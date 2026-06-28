from datetime import datetime

from flask import Blueprint, request

from app.auth import require_auth, require_portal, require_role
from app.database import current_timestamp, format_datetime, get_db

orders_bp = Blueprint("orders", __name__, url_prefix="/orders")

ORDER_STATUSES = {"Pending", "Ready", "Collected", "Cancelled"}


def normalize_order_status(status: str) -> str:
    if status in ORDER_STATUSES:
        return status

    if status == "Paid":
        return "Pending"

    return "Cancelled"


def ensure_order_items_schema() -> None:
    db = get_db()
    order_items_exists = db.execute(
        """
        SELECT name FROM sqlite_master
        WHERE type = 'table' AND name = 'order_items'
        """
    ).fetchone()

    if order_items_exists is None:
        db.execute(
            """
            CREATE TABLE order_items (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              order_id INTEGER NOT NULL,
              food_item_id INTEGER NOT NULL,
              food_name TEXT NOT NULL,
              quantity INTEGER NOT NULL,
              unit_price INTEGER NOT NULL,
              total_price INTEGER NOT NULL,
              FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
              FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE CASCADE
            )
            """
        )

    order_columns = {
        row["name"] for row in db.execute("PRAGMA table_info(orders)").fetchall()
    }
    has_legacy_item_columns = {"food_item_id", "food_name", "quantity"}.issubset(order_columns)

    if has_legacy_item_columns:
        legacy_rows = db.execute(
            """
            SELECT id, food_item_id, food_name, quantity, total_price
            FROM orders
            WHERE id NOT IN (SELECT DISTINCT order_id FROM order_items)
            """
        ).fetchall()

        for row in legacy_rows:
            quantity = max(1, int(row["quantity"]))
            unit_price = int(row["total_price"] / quantity)
            db.execute(
                """
                INSERT INTO order_items (
                    order_id, food_item_id, food_name, quantity, unit_price, total_price
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    row["id"],
                    row["food_item_id"],
                    row["food_name"],
                    quantity,
                    unit_price,
                    row["total_price"],
                ),
            )

    db.commit()


def get_order_columns() -> set[str]:
    return {row["name"] for row in get_db().execute("PRAGMA table_info(orders)").fetchall()}


def get_order_items(order_id: int) -> list[dict]:
    rows = get_db().execute(
        """
        SELECT id, food_item_id, food_name, quantity, unit_price, total_price
        FROM order_items
        WHERE order_id = ?
        ORDER BY id ASC
        """,
        (order_id,),
    ).fetchall()

    return [
        {
            "id": str(row["id"]),
            "foodItemId": str(row["food_item_id"]),
            "foodName": row["food_name"],
            "quantity": row["quantity"],
            "unitPrice": row["unit_price"],
            "totalPrice": row["total_price"],
        }
        for row in rows
    ]


def serialize_order(row) -> dict:
    items = get_order_items(row["id"])
    total_quantity = sum(item["quantity"] for item in items)
    item_count = len(items)
    food_name = items[0]["foodName"] if item_count == 1 else f"{item_count} items"

    return {
        "id": str(row["id"]),
        "orderNumber": row["order_number"],
        "foodItemId": items[0]["foodItemId"] if items else "",
        "foodName": food_name,
        "studentName": row["student_name"],
        "quantity": total_quantity,
        "itemCount": item_count,
        "items": items,
        "totalPrice": row["total_price"],
        "orderedAt": format_datetime(row["ordered_at"]),
        "status": normalize_order_status(row["status"]),
    }


def cancel_order_and_restore_stock(order_id: int) -> None:
    db = get_db()
    updated_at = current_timestamp()
    items = db.execute(
        """
        SELECT food_item_id, quantity
        FROM order_items
        WHERE order_id = ?
        """,
        (order_id,),
    ).fetchall()

    for item in items:
        db.execute(
            """
            UPDATE food_items
            SET stock = stock + ?, updated_at = ?
            WHERE id = ?
            """,
            (item["quantity"], updated_at, item["food_item_id"]),
        )

    db.execute(
        "UPDATE orders SET status = 'Cancelled' WHERE id = ?",
        (order_id,),
    )


@orders_bp.get("")
@require_auth
def list_orders(current_user):
    ensure_order_items_schema()
    db = get_db()

    if current_user["portal"] == "staff":
        if current_user["role"] != "canteen_staff":
            return {"message": "Forbidden"}, 403

        rows = db.execute("SELECT * FROM orders ORDER BY id DESC").fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM orders WHERE student_mobile = ? ORDER BY id DESC",
            (current_user["identifier"],),
        ).fetchall()

    return {"items": [serialize_order(row) for row in rows]}


@orders_bp.post("")
@require_portal("student")
def create_order(current_user):
    ensure_order_items_schema()
    payload = request.get_json(silent=True) or {}
    raw_items = payload.get("items")

    if raw_items is None:
        raw_items = [
            {
                "foodItemId": payload.get("foodItemId"),
                "quantity": payload.get("quantity", 1),
            }
        ]

    if not isinstance(raw_items, list) or not raw_items:
        return {"message": "Add at least one food item to the order."}, 400

    requested_items: dict[int, int] = {}

    for raw_item in raw_items:
        try:
            food_item_id = int(raw_item.get("foodItemId", 0))
            quantity = int(raw_item.get("quantity", 1))
        except (TypeError, ValueError, AttributeError):
            return {"message": "Invalid order item."}, 400

        if food_item_id <= 0 or quantity <= 0:
            return {"message": "Invalid order quantity."}, 400

        requested_items[food_item_id] = requested_items.get(food_item_id, 0) + quantity

    db = get_db()
    food_rows = db.execute(
        f"""
        SELECT * FROM food_items
        WHERE id IN ({",".join("?" for _ in requested_items)})
        """,
        tuple(requested_items.keys()),
    ).fetchall()
    food_items = {row["id"]: row for row in food_rows}

    if len(food_items) != len(requested_items):
        return {"message": "One or more food items were not found."}, 404

    for food_item_id, quantity in requested_items.items():
        food_item = food_items[food_item_id]

        if food_item["stock"] < quantity:
            return {
                "message": f"Not enough stock available for {food_item['name']}."
            }, 400

    ordered_at = current_timestamp()
    total_price = sum(
        food_items[food_item_id]["price"] * quantity
        for food_item_id, quantity in requested_items.items()
    )
    first_food_item_id = next(iter(requested_items))
    first_food_item = food_items[first_food_item_id]
    total_quantity = sum(requested_items.values())
    order_columns = get_order_columns()

    if {"food_item_id", "food_name", "quantity"}.issubset(order_columns):
        cursor = db.execute(
            """
            INSERT INTO orders (
                order_number, food_item_id, food_name, student_mobile, student_name,
                quantity, total_price, status, ordered_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                f"ORD-{int(datetime.utcnow().timestamp() * 1000)}",
                first_food_item_id,
                first_food_item["name"],
                current_user["identifier"],
                current_user["name"],
                total_quantity,
                total_price,
                "Pending",
                ordered_at,
            ),
        )
    else:
        cursor = db.execute(
            """
            INSERT INTO orders (
                order_number, student_mobile, student_name, total_price, status, ordered_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                f"ORD-{int(datetime.utcnow().timestamp() * 1000)}",
                current_user["identifier"],
                current_user["name"],
                total_price,
                "Pending",
                ordered_at,
            ),
        )
    order_id = cursor.lastrowid

    for food_item_id, quantity in requested_items.items():
        food_item = food_items[food_item_id]
        line_total = food_item["price"] * quantity
        db.execute(
            """
            INSERT INTO order_items (
                order_id, food_item_id, food_name, quantity, unit_price, total_price
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (order_id, food_item_id, food_item["name"], quantity, food_item["price"], line_total),
        )
        db.execute(
            "UPDATE food_items SET stock = ?, updated_at = ? WHERE id = ?",
            (food_item["stock"] - quantity, ordered_at, food_item_id),
        )

    db.commit()

    row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    return serialize_order(row), 201


@orders_bp.post("/<int:order_id>/cancel")
@require_portal("student")
def cancel_student_order(order_id: int, current_user):
    ensure_order_items_schema()
    db = get_db()
    order = db.execute(
        """
        SELECT *
        FROM orders
        WHERE id = ? AND student_mobile = ?
        """,
        (order_id, current_user["identifier"]),
    ).fetchone()

    if order is None:
        return {"message": "Order not found."}, 404

    if normalize_order_status(order["status"]) != "Pending":
        return {"message": "Only pending orders can be cancelled."}, 409

    cancel_order_and_restore_stock(order_id)
    db.commit()
    row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    return serialize_order(row)


@orders_bp.patch("/<int:order_id>")
@require_role("canteen_staff")
def update_order_status(order_id: int, current_user):
    ensure_order_items_schema()
    payload = request.get_json(silent=True) or {}
    status = payload.get("status")

    if status not in ORDER_STATUSES:
        return {"message": "Invalid order status."}, 400

    db = get_db()
    existing = db.execute(
        "SELECT id, status FROM orders WHERE id = ?",
        (order_id,),
    ).fetchone()

    if existing is None:
        return {"message": "Order not found."}, 404

    current_status = normalize_order_status(existing["status"])

    if current_status in {"Collected", "Cancelled"} and status != current_status:
        return {"message": "Completed or cancelled orders cannot be changed."}, 409

    if status == "Cancelled" and current_status != "Cancelled":
        cancel_order_and_restore_stock(order_id)
    else:
        db.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))

    db.commit()
    row = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
    return serialize_order(row)


@orders_bp.delete("/<int:order_id>")
@require_role("canteen_staff")
def delete_order(order_id: int, current_user):
    ensure_order_items_schema()
    db = get_db()
    cursor = db.execute("DELETE FROM orders WHERE id = ?", (order_id,))
    db.commit()

    if cursor.rowcount == 0:
        return {"message": "Order not found."}, 404

    return {"message": "Order deleted."}
