from flask import Blueprint, request

from app.auth import require_auth, require_portal, require_role
from app.database import current_timestamp, format_datetime, get_db, row_to_dict
from app.services.sentiment import analyze_food_item_reviews

food_items_bp = Blueprint("food_items", __name__, url_prefix="/food-items")


def serialize_food_item(row, current_user=None) -> dict:
    item = row_to_dict(row)
    db = get_db()
    reviews = db.execute(
        """
        SELECT id, student_mobile, student_name AS studentName, rating, comment, created_at AS createdAt
        FROM reviews
        WHERE food_item_id = ?
        ORDER BY id DESC
        """,
        (item["id"],),
    ).fetchall()

    return {
        "id": str(item["id"]),
        "name": item["name"],
        "category": item["category"],
        "price": item["price"],
        "stock": item["stock"],
        "description": item["description"],
        "imageUrl": item["image_url"],
        "updatedAt": format_datetime(item["updated_at"]),
        "reviews": [
            {
                "id": str(review["id"]),
                "studentName": review["studentName"],
                "rating": review["rating"],
                "comment": review["comment"],
                "createdAt": format_datetime(review["createdAt"]),
                "canManage": bool(
                    current_user
                    and current_user["portal"] == "student"
                    and review["student_mobile"] == current_user["identifier"]
                ),
            }
            for review in reviews
        ],
    }


@food_items_bp.get("")
@require_auth
def list_food_items(current_user):
    rows = get_db().execute("SELECT * FROM food_items ORDER BY id DESC").fetchall()
    return {"items": [serialize_food_item(row, current_user) for row in rows]}


@food_items_bp.post("")
@require_role("canteen_staff")
def create_food_item(current_user):
    payload = request.get_json(silent=True) or {}
    now = current_timestamp()
    db = get_db()
    cursor = db.execute(
        """
        INSERT INTO food_items (name, category, price, stock, description, image_url, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.get("name"),
            payload.get("category"),
            int(payload.get("price", 0)),
            int(payload.get("stock", 0)),
            payload.get("description"),
            payload.get("imageUrl", ""),
            now,
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM food_items WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return serialize_food_item(row, current_user), 201


@food_items_bp.patch("/<int:food_item_id>")
@require_role("canteen_staff")
def update_food_item(food_item_id: int, current_user):
    payload = request.get_json(silent=True) or {}
    existing = get_db().execute("SELECT * FROM food_items WHERE id = ?", (food_item_id,)).fetchone()

    if existing is None:
        return {"message": "Food item not found."}, 404

    next_values = {
        "name": payload.get("name", existing["name"]),
        "category": payload.get("category", existing["category"]),
        "price": int(payload.get("price", existing["price"])),
        "stock": int(payload.get("stock", existing["stock"])),
        "description": payload.get("description", existing["description"]),
        "image_url": payload.get("imageUrl", existing["image_url"]),
        "updated_at": current_timestamp(),
    }

    db = get_db()
    db.execute(
        """
        UPDATE food_items
        SET name = ?, category = ?, price = ?, stock = ?, description = ?, image_url = ?, updated_at = ?
        WHERE id = ?
        """,
        (
            next_values["name"],
            next_values["category"],
            next_values["price"],
            next_values["stock"],
            next_values["description"],
            next_values["image_url"],
            next_values["updated_at"],
            food_item_id,
        ),
    )
    db.commit()

    row = db.execute("SELECT * FROM food_items WHERE id = ?", (food_item_id,)).fetchone()
    return serialize_food_item(row, current_user)


@food_items_bp.delete("/<int:food_item_id>")
@require_role("canteen_staff")
def delete_food_item(food_item_id: int, current_user):
    db = get_db()
    db.execute("DELETE FROM food_items WHERE id = ?", (food_item_id,))
    db.commit()
    return {"message": "Food item deleted."}


@food_items_bp.get("/<int:food_item_id>/sentiment")
@require_role("canteen_staff")
def analyze_food_item_sentiment(food_item_id: int, current_user):
    db = get_db()
    food_item = db.execute("SELECT id FROM food_items WHERE id = ?", (food_item_id,)).fetchone()

    if food_item is None:
        return {"message": "Food item not found."}, 404

    rows = db.execute(
        """
        SELECT rating, comment
        FROM reviews
        WHERE food_item_id = ?
        ORDER BY id DESC
        """,
        (food_item_id,),
    ).fetchall()
    reviews = [{"rating": row["rating"], "comment": row["comment"]} for row in rows]

    return analyze_food_item_reviews(reviews)


@food_items_bp.post("/<int:food_item_id>/reviews")
@require_portal("student")
def create_review(food_item_id: int, current_user):
    payload = request.get_json(silent=True) or {}
    db = get_db()
    existing = db.execute("SELECT id FROM food_items WHERE id = ?", (food_item_id,)).fetchone()

    if existing is None:
        return {"message": "Food item not found."}, 404

    db.execute(
        """
        INSERT INTO reviews (food_item_id, student_mobile, student_name, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            food_item_id,
            current_user["identifier"],
            current_user["name"],
            int(payload.get("rating", 0)),
            payload.get("comment", ""),
            current_timestamp(),
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM food_items WHERE id = ?", (food_item_id,)).fetchone()
    return serialize_food_item(row, current_user), 201


@food_items_bp.patch("/<int:food_item_id>/reviews/<int:review_id>")
@require_portal("student")
def update_review(food_item_id: int, review_id: int, current_user):
    payload = request.get_json(silent=True) or {}
    db = get_db()
    existing = db.execute(
        """
        SELECT id FROM reviews
        WHERE id = ? AND food_item_id = ? AND student_mobile = ?
        """,
        (review_id, food_item_id, current_user["identifier"]),
    ).fetchone()

    if existing is None:
        return {"message": "Review not found."}, 404

    db.execute(
        """
        UPDATE reviews
        SET rating = ?, comment = ?, created_at = ?
        WHERE id = ?
        """,
        (
            int(payload.get("rating", 0)),
            payload.get("comment", ""),
            current_timestamp(),
            review_id,
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM food_items WHERE id = ?", (food_item_id,)).fetchone()
    return serialize_food_item(row, current_user)


@food_items_bp.delete("/<int:food_item_id>/reviews/<int:review_id>")
@require_portal("student")
def delete_review(food_item_id: int, review_id: int, current_user):
    db = get_db()
    cursor = db.execute(
        """
        DELETE FROM reviews
        WHERE id = ? AND food_item_id = ? AND student_mobile = ?
        """,
        (review_id, food_item_id, current_user["identifier"]),
    )
    db.commit()

    if cursor.rowcount == 0:
        return {"message": "Review not found."}, 404

    row = db.execute("SELECT * FROM food_items WHERE id = ?", (food_item_id,)).fetchone()
    return serialize_food_item(row, current_user)
