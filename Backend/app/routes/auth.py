from flask import Blueprint, request

from app.auth import DEMO_OTP, create_access_token, normalize_identifier
from app.database import ensure_users_seeded, get_db

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")


def get_user(portal: str, identifier: str):
    ensure_users_seeded()
    return get_db().execute(
        """
        SELECT portal, identifier, display_name, role, status
        FROM users
        WHERE portal = ? AND identifier = ?
        """,
        (portal, identifier),
    ).fetchone()


@auth_bp.post("/login")
def request_otp():
    payload = request.get_json(silent=True) or {}
    portal = payload.get("portal")
    identifier = normalize_identifier(str(payload.get("identifier") or payload.get("mobileNumber", "")))

    if portal not in ("student", "staff"):
        return {"message": "Invalid portal."}, 400

    user = get_user(portal, identifier)

    if user is None:
        return {"message": "Identifier is not registered for this portal."}, 401

    if user["status"] != "Active":
        return {"message": "This user account is inactive."}, 403

    return {"message": "OTP sent."}


@auth_bp.post("/verify-otp")
def verify_otp():
    payload = request.get_json(silent=True) or {}
    portal = payload.get("portal")
    identifier = normalize_identifier(str(payload.get("identifier") or payload.get("mobileNumber", "")))
    otp = str(payload.get("otp", ""))

    if portal not in ("student", "staff"):
        return {"message": "Invalid portal."}, 400

    user = get_user(portal, identifier)

    if user is None or otp != DEMO_OTP:
        return {"message": "Invalid OTP."}, 401

    if user["status"] != "Active":
        return {"message": "This user account is inactive."}, 403

    return {
        "accessToken": create_access_token(
            portal,
            identifier,
            user["display_name"],
            user["role"],
        ),
        "portal": portal,
        "role": user["role"],
    }
