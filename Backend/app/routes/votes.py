from flask import Blueprint, request

from app.auth import require_portal
from app.database import current_timestamp, format_datetime, get_db

votes_bp = Blueprint("votes", __name__, url_prefix="/votes")


def ensure_vote_schema() -> None:
    db = get_db()
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS vote_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          creator_identifier TEXT NOT NULL,
          creator_name TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS vote_participants (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vote_id INTEGER NOT NULL,
          student_identifier TEXT NOT NULL,
          student_name TEXT NOT NULL,
          UNIQUE (vote_id, student_identifier),
          FOREIGN KEY (vote_id) REFERENCES vote_sessions (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS vote_options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vote_id INTEGER NOT NULL,
          food_item_id INTEGER NOT NULL,
          food_name TEXT NOT NULL,
          UNIQUE (vote_id, food_item_id),
          FOREIGN KEY (vote_id) REFERENCES vote_sessions (id) ON DELETE CASCADE,
          FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS vote_ballots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          vote_id INTEGER NOT NULL,
          student_identifier TEXT NOT NULL,
          food_item_id INTEGER NOT NULL,
          voted_at TEXT NOT NULL,
          UNIQUE (vote_id, student_identifier),
          FOREIGN KEY (vote_id) REFERENCES vote_sessions (id) ON DELETE CASCADE,
          FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE CASCADE
        );
        """
    )
    db.commit()


def list_registered_students(current_user) -> list[dict]:
    rows = get_db().execute(
        """
        SELECT identifier, display_name
        FROM users
        WHERE portal = 'student' AND identifier != ?
        ORDER BY display_name ASC
        """,
        (current_user["identifier"],),
    ).fetchall()

    return [
        {
            "identifier": row["identifier"],
            "name": row["display_name"],
        }
        for row in rows
    ]


def get_vote_rows(current_user):
    return get_db().execute(
        """
        SELECT DISTINCT vote_sessions.*
        FROM vote_sessions
        INNER JOIN vote_participants
            ON vote_participants.vote_id = vote_sessions.id
        WHERE vote_participants.student_identifier = ?
        ORDER BY vote_sessions.id DESC
        """,
        (current_user["identifier"],),
    ).fetchall()


def serialize_vote(row, current_user) -> dict:
    db = get_db()
    participants = db.execute(
        """
        SELECT student_identifier, student_name
        FROM vote_participants
        WHERE vote_id = ?
        ORDER BY student_name ASC
        """,
        (row["id"],),
    ).fetchall()
    options = db.execute(
        """
        SELECT vote_options.food_item_id, vote_options.food_name, food_items.image_url,
               food_items.category, food_items.price, food_items.stock,
               COUNT(vote_ballots.id) AS vote_count
        FROM vote_options
        INNER JOIN food_items ON food_items.id = vote_options.food_item_id
        LEFT JOIN vote_ballots
            ON vote_ballots.vote_id = vote_options.vote_id
            AND vote_ballots.food_item_id = vote_options.food_item_id
        WHERE vote_options.vote_id = ?
        GROUP BY vote_options.food_item_id, vote_options.food_name, food_items.image_url,
                 food_items.category, food_items.price, food_items.stock
        ORDER BY vote_count DESC, vote_options.food_name ASC
        """,
        (row["id"],),
    ).fetchall()
    ballot = db.execute(
        """
        SELECT food_item_id
        FROM vote_ballots
        WHERE vote_id = ? AND student_identifier = ?
        """,
        (row["id"], current_user["identifier"]),
    ).fetchone()

    return {
        "id": str(row["id"]),
        "title": row["title"],
        "creatorName": row["creator_name"],
        "createdAt": format_datetime(row["created_at"]),
        "currentUserVoteFoodItemId": str(ballot["food_item_id"]) if ballot else None,
        "participants": [
            {
                "identifier": participant["student_identifier"],
                "name": participant["student_name"],
            }
            for participant in participants
        ],
        "options": [
            {
                "foodItemId": str(option["food_item_id"]),
                "foodName": option["food_name"],
                "imageUrl": option["image_url"],
                "category": option["category"],
                "price": option["price"],
                "stock": option["stock"],
                "voteCount": option["vote_count"],
            }
            for option in options
        ],
    }


@votes_bp.get("/students")
@require_portal("student")
def list_students(current_user):
    ensure_vote_schema()
    return {"items": list_registered_students(current_user)}


@votes_bp.get("")
@require_portal("student")
def list_votes(current_user):
    ensure_vote_schema()
    return {"items": [serialize_vote(row, current_user) for row in get_vote_rows(current_user)]}


@votes_bp.post("")
@require_portal("student")
def create_vote(current_user):
    ensure_vote_schema()
    payload = request.get_json(silent=True) or {}
    title = str(payload.get("title") or "Food vote").strip()
    participant_identifiers = payload.get("participantIdentifiers")
    food_item_ids = payload.get("foodItemIds")

    if not isinstance(participant_identifiers, list) or not participant_identifiers:
        return {"message": "Add at least one student to the vote."}, 400

    if not isinstance(food_item_ids, list) or len(food_item_ids) < 2:
        return {"message": "Add at least two food items to the vote."}, 400

    participant_identifiers = {
        str(identifier)
        for identifier in participant_identifiers
        if str(identifier) != current_user["identifier"]
    }
    participant_identifiers.add(current_user["identifier"])

    try:
        food_item_ids = {int(food_item_id) for food_item_id in food_item_ids}
    except (TypeError, ValueError):
        return {"message": "Invalid food item selection."}, 400

    db = get_db()
    student_rows = db.execute(
        f"""
        SELECT identifier, display_name
        FROM users
        WHERE portal = 'student'
        AND identifier IN ({",".join("?" for _ in participant_identifiers)})
        """,
        tuple(participant_identifiers),
    ).fetchall()

    if len(student_rows) != len(participant_identifiers):
        return {"message": "One or more students are not registered."}, 400

    food_rows = db.execute(
        f"""
        SELECT id, name
        FROM food_items
        WHERE stock > 0
        AND id IN ({",".join("?" for _ in food_item_ids)})
        """,
        tuple(food_item_ids),
    ).fetchall()

    if len(food_rows) != len(food_item_ids):
        return {"message": "One or more food items are not currently available."}, 400

    created_at = current_timestamp()
    cursor = db.execute(
        """
        INSERT INTO vote_sessions (title, creator_identifier, creator_name, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (title, current_user["identifier"], current_user["name"], created_at),
    )
    vote_id = cursor.lastrowid

    db.executemany(
        """
        INSERT INTO vote_participants (vote_id, student_identifier, student_name)
        VALUES (?, ?, ?)
        """,
        [
            (vote_id, row["identifier"], row["display_name"])
            for row in student_rows
        ],
    )
    db.executemany(
        """
        INSERT INTO vote_options (vote_id, food_item_id, food_name)
        VALUES (?, ?, ?)
        """,
        [(vote_id, row["id"], row["name"]) for row in food_rows],
    )
    db.commit()

    row = db.execute("SELECT * FROM vote_sessions WHERE id = ?", (vote_id,)).fetchone()
    return serialize_vote(row, current_user), 201


@votes_bp.post("/<int:vote_id>/ballot")
@require_portal("student")
def submit_vote(vote_id: int, current_user):
    ensure_vote_schema()
    payload = request.get_json(silent=True) or {}

    try:
        food_item_id = int(payload.get("foodItemId", 0))
    except (TypeError, ValueError):
        return {"message": "Invalid food item selection."}, 400

    db = get_db()
    participant = db.execute(
        """
        SELECT id
        FROM vote_participants
        WHERE vote_id = ? AND student_identifier = ?
        """,
        (vote_id, current_user["identifier"]),
    ).fetchone()

    if participant is None:
        return {"message": "You are not added to this vote."}, 403

    option = db.execute(
        """
        SELECT id
        FROM vote_options
        WHERE vote_id = ? AND food_item_id = ?
        """,
        (vote_id, food_item_id),
    ).fetchone()

    if option is None:
        return {"message": "Food item is not an option in this vote."}, 400

    db.execute(
        """
        INSERT INTO vote_ballots (vote_id, student_identifier, food_item_id, voted_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT (vote_id, student_identifier)
        DO UPDATE SET food_item_id = excluded.food_item_id, voted_at = excluded.voted_at
        """,
        (vote_id, current_user["identifier"], food_item_id, current_timestamp()),
    )
    db.commit()

    row = db.execute("SELECT * FROM vote_sessions WHERE id = ?", (vote_id,)).fetchone()
    return serialize_vote(row, current_user)
