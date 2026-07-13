import os
import sqlite3
from datetime import datetime
from typing import Any

from flask import current_app, g


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        database_path = current_app.config["DATABASE"]
        os.makedirs(os.path.dirname(database_path), exist_ok=True)
        g.db = sqlite3.connect(database_path)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")

    return g.db


def close_db(error: Exception | None = None) -> None:
    db = g.pop("db", None)

    if db is not None:
        db.close()


def init_app(app) -> None:
    os.makedirs(app.instance_path, exist_ok=True)


def init_db() -> None:
    db = get_db()

    with current_app.open_resource("schema.sql") as schema_file:
        db.executescript(schema_file.read().decode("utf-8"))


def current_timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def format_datetime(value: str) -> str:
    try:
        return datetime.fromisoformat(value).strftime("%Y-%m-%d %H:%M")
    except ValueError:
        return value[:16].replace("T", " ")


def ensure_user_schema() -> None:
    db = get_db()
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          portal TEXT NOT NULL CHECK (portal IN ('student', 'staff')),
          identifier TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'student',
          status TEXT NOT NULL DEFAULT 'Active',
          created_at TEXT NOT NULL DEFAULT ''
        )
        """
    )

    columns = {
        row["name"]
        for row in db.execute("PRAGMA table_info(users)").fetchall()
    }

    if "role" not in columns:
        db.execute("ALTER TABLE users ADD COLUMN role TEXT")
    if "status" not in columns:
        db.execute("ALTER TABLE users ADD COLUMN status TEXT")
    if "created_at" not in columns:
        db.execute("ALTER TABLE users ADD COLUMN created_at TEXT")

    now = current_timestamp()
    db.execute(
        """
        UPDATE users
        SET role = CASE
          WHEN portal = 'staff' THEN 'canteen_staff'
          ELSE 'student'
        END
        WHERE role IS NULL OR role = ''
        """
    )
    db.execute(
        "UPDATE users SET status = 'Active' WHERE status IS NULL OR status = ''"
    )
    db.execute(
        "UPDATE users SET created_at = ? WHERE created_at IS NULL OR created_at = ''",
        (now,),
    )
    db.commit()


def ensure_users_seeded() -> None:
    ensure_user_schema()
    db = get_db()
    now = current_timestamp()
    db.executemany(
        """
        INSERT OR IGNORE INTO users (
          portal, identifier, display_name, role, status, created_at
        )
        VALUES (?, ?, ?, ?, 'Active', ?)
        """,
        [
            ("staff", "94714547325", "Staff User", "canteen_staff", now),
            ("student", "20211188", "Uvidu", "student", now),
            ("student", "20209891", "Nipuni", "student", now),
            ("student", "20240982", "Ruhiri", "student", now),
            ("staff", "94712345678", "System Admin 1", "admin", now),
            ("staff", "94765467928", "System Admin 2", "admin", now),
        ],
    )
    db.commit()


def seed_db() -> None:
    db = get_db()
    now = current_timestamp()

    ensure_users_seeded()

    food_items = [
        (
            "Rice and Curry",
            "Lunch",
            280,
            34,
            "Steamed rice served with dhal, vegetables, and chicken curry.",
            "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=320&q=80",
            now,
        ),
        (
            "Fish Bun",
            "Snack",
            120,
            8,
            "Soft baked bun filled with spiced fish and potato.",
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=320&q=80",
            now,
        ),
        (
            "Iced Milo",
            "Drink",
            180,
            20,
            "Chilled malt drink prepared fresh at the counter.",
            "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=320&q=80",
            now,
        ),
    ]

    db.executemany(
        """
        INSERT INTO food_items (name, category, price, stock, description, image_url, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        food_items,
    )
    db.executemany(
        """
        INSERT INTO reviews (food_item_id, student_mobile, student_name, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            (
                1,
                "94779638719",
                "Nethmi Perera",
                5,
                "Good portion size and the curry was fresh today.",
                now,
            ),
            (
                1,
                "94779638719",
                "Kasun Silva",
                4,
                "Tasty lunchh, but the queue moved a little slowly.",
                now,
            ),
            (
                2,
                "94779638719",
                "Amaya Fernando",
                5,
                "Still warm when I bought it. Please keep this available daily.",
                now,
            ),
        ],
    )
    db.executemany(
        """
        INSERT INTO orders (
            order_number, student_mobile, student_name, total_price, status, ordered_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            ("ORD-1001", "94779638719", "Nethmi Perera", 740, "Pending", now),
            ("ORD-1002", "94779638719", "Nethmi Perera", 120, "Ready", now),
            ("ORD-1003", "94779638719", "Amaya Fernando", 280, "Collected", now),
        ],
    )
    db.executemany(
        """
        INSERT INTO order_items (order_id, food_item_id, food_name, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        [
            (1, 1, "Rice and Curry", 2, 280, 560),
            (1, 3, "Iced Milo", 1, 180, 180),
            (2, 2, "Fish Bun", 1, 120, 120),
            (3, 1, "Rice and Curry", 1, 280, 280),
        ],
    )
    db.commit()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    if row is None:
        return None

    return dict(row)
