import sqlite3

from flask import Blueprint, request

from app.auth import normalize_identifier, require_role
from app.database import current_timestamp, ensure_users_seeded, format_datetime, get_db

users_bp = Blueprint("users", __name__, url_prefix="/users")

MANAGED_ROLES = {"student", "canteen_staff", "admin"}
USER_STATUSES = {"Active", "Inactive"}


def portal_for_role(role: str) -> str:
    return "staff" if role in {"canteen_staff", "admin"} else "student"


def validate_user_payload(payload: dict, partial: bool = False) -> tuple[dict, str | None]:
    values: dict[str, str] = {}

    if not partial or "name" in payload:
        name = str(payload.get("name", "")).strip()
        if len(name) < 2 or len(name) > 100:
            return {}, "Name must be between 2 and 100 characters."
        values["display_name"] = name

    role = str(payload.get("role", "")).strip()
    if not partial or "role" in payload:
        if role not in MANAGED_ROLES:
            return {}, "Select a valid user role."
        values["role"] = role
        values["portal"] = portal_for_role(role)

    if not partial or "identifier" in payload:
        identifier = normalize_identifier(str(payload.get("identifier", "")))
        effective_role = role

        if partial and not effective_role:
            effective_role = str(payload.get("currentRole", ""))

        if effective_role == "student":
            if len(identifier) != 8:
                return {}, "Student ID must contain exactly 8 digits."
        elif effective_role in {"canteen_staff", "admin"}:
            if len(identifier) != 11 or not identifier.startswith("947"):
                return {}, "Enter a valid Sri Lankan mobile number."
        else:
            return {}, "Select a valid user role."

        values["identifier"] = identifier

    if "status" in payload:
        status = str(payload["status"])
        if status not in USER_STATUSES:
            return {}, "Select a valid user status."
        values["status"] = status

    return values, None


def serialize_user(row) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["display_name"],
        "identifier": row["identifier"],
        "portal": row["portal"],
        "role": row["role"],
        "status": row["status"],
        "createdAt": format_datetime(row["created_at"]),
    }


@users_bp.get("")
@require_role("admin")
def list_users(current_user):
    del current_user
    ensure_users_seeded()
    rows = get_db().execute(
        """
        SELECT id, portal, identifier, display_name, role, status, created_at
        FROM users
        WHERE role IN ('student', 'canteen_staff', 'admin')
        ORDER BY id DESC
        """
    ).fetchall()
    return {"items": [serialize_user(row) for row in rows]}


@users_bp.post("")
@require_role("admin")
def create_user(current_user):
    del current_user
    payload = request.get_json(silent=True) or {}
    values, error = validate_user_payload(payload)

    if error:
        return {"message": error}, 400

    db = get_db()

    try:
        cursor = db.execute(
            """
            INSERT INTO users (
              portal, identifier, display_name, role, status, created_at
            )
            VALUES (?, ?, ?, ?, 'Active', ?)
            """,
            (
                values["portal"],
                values["identifier"],
                values["display_name"],
                values["role"],
                current_timestamp(),
            ),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return {"message": "A user with this student ID or mobile number already exists."}, 409

    row = db.execute(
        """
        SELECT id, portal, identifier, display_name, role, status, created_at
        FROM users
        WHERE id = ?
        """,
        (cursor.lastrowid,),
    ).fetchone()
    return serialize_user(row), 201


@users_bp.patch("/<int:user_id>")
@require_role("admin")
def update_user(user_id: int, current_user):
    db = get_db()
    existing = db.execute(
        """
        SELECT id, portal, identifier, display_name, role, status, created_at
        FROM users
        WHERE id = ? AND role IN ('student', 'canteen_staff', 'admin')
        """,
        (user_id,),
    ).fetchone()

    if existing is None:
        return {"message": "User not found."}, 404

    payload = request.get_json(silent=True) or {}

    if existing["identifier"] == current_user["identifier"] and any(
        field in payload for field in ("identifier", "role", "status")
    ):
        return {
            "message": "You cannot change the identifier, role, or status of your current admin account."
        }, 400

    payload["currentRole"] = payload.get("role", existing["role"])
    values, error = validate_user_payload(payload, partial=True)

    if error:
        return {"message": error}, 400

    if "role" in values and "identifier" not in values:
        identifier_values, identifier_error = validate_user_payload(
            {
                "identifier": existing["identifier"],
                "role": values["role"],
            },
            partial=True,
        )
        if identifier_error:
            return {"message": "Enter an identifier valid for the selected role."}, 400
        values["identifier"] = identifier_values["identifier"]

    if not values:
        return serialize_user(existing)

    assignments = ", ".join(f"{column} = ?" for column in values)

    try:
        db.execute(
            f"UPDATE users SET {assignments} WHERE id = ?",
            (*values.values(), user_id),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return {"message": "A user with this student ID or mobile number already exists."}, 409

    row = db.execute(
        """
        SELECT id, portal, identifier, display_name, role, status, created_at
        FROM users
        WHERE id = ?
        """,
        (user_id,),
    ).fetchone()
    return serialize_user(row)


@users_bp.delete("/<int:user_id>")
@require_role("admin")
def delete_user(user_id: int, current_user):
    db = get_db()
    existing = db.execute(
        "SELECT identifier FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()

    if existing is not None and existing["identifier"] == current_user["identifier"]:
        return {"message": "You cannot delete your current admin account."}, 400

    cursor = db.execute(
        "DELETE FROM users WHERE id = ? AND role IN ('student', 'canteen_staff', 'admin')",
        (user_id,),
    )

    if cursor.rowcount == 0:
        return {"message": "User not found."}, 404

    db.commit()
    return "", 204
