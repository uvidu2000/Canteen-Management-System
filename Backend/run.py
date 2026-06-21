import sys

from app import create_app
from app.database import init_db, seed_db

app = create_app()


@app.cli.command("init-db")
def init_database_command() -> None:
    init_db()
    print("Initialized SQLite database.")


@app.cli.command("seed")
def seed_database_command() -> None:
    seed_db()
    print("Seeded demo data.")


def run_command(command: str) -> None:
    with app.app_context():
        if command == "init-db":
            init_db()
            print("Initialized SQLite database.")
            return

        if command == "seed":
            seed_db()
            print("Seeded demo data.")
            return

    raise SystemExit(f"Unknown command: {command}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        run_command(sys.argv[1])
    else:
        app.run(host="127.0.0.1", port=5000, debug=True)
