from pathlib import Path

from flask import Flask
from flask_cors import CORS

from app.database import close_db, init_app
from app.routes.auth import auth_bp
from app.routes.food_items import food_items_bp
from app.routes.orders import orders_bp
from app.routes.votes import votes_bp


def create_app() -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    database_path = Path(app.instance_path) / "canteen.sqlite3"
    app.config.from_mapping(
        DATABASE=str(database_path),
        JWT_SECRET_KEY="dev-secret-change-me",
    )

    CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

    init_app(app)
    app.teardown_appcontext(close_db)

    app.register_blueprint(auth_bp)
    app.register_blueprint(food_items_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(votes_bp)

    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    return app
