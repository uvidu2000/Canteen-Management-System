from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Callable, Literal, TypedDict

import jwt
from flask import current_app, request

Portal = Literal["student", "staff"]


class AuthUser(TypedDict):
    portal: Portal
    identifier: str
    name: str


DEMO_OTP = "123456"


def normalize_identifier(identifier: str) -> str:
    return "".join(character for character in identifier if character.isdigit())


def create_access_token(portal: Portal, identifier: str, name: str) -> str:
    payload = {
        "portal": portal,
        "identifier": identifier,
        "name": name,
        "exp": datetime.now(timezone.utc) + timedelta(hours=8),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def get_current_user() -> AuthUser | None:
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
    except jwt.PyJWTError:
        return None

    portal = payload.get("portal")
    identifier = payload.get("identifier") or payload.get("mobile_number")
    name = payload.get("name")

    if portal not in ("student", "staff") or not isinstance(identifier, str):
        return None

    return {
        "portal": portal,
        "identifier": identifier,
        "name": name if isinstance(name, str) else "User",
    }


def require_auth(handler: Callable):
    @wraps(handler)
    def wrapper(*args, **kwargs):
        user = get_current_user()

        if user is None:
            return {"message": "Unauthorized"}, 401

        return handler(*args, current_user=user, **kwargs)

    return wrapper


def require_portal(portal: Portal):
    def decorator(handler: Callable):
        @wraps(handler)
        @require_auth
        def wrapper(*args, current_user: AuthUser, **kwargs):
            if current_user["portal"] != portal:
                return {"message": "Forbidden"}, 403

            return handler(*args, current_user=current_user, **kwargs)

        return wrapper

    return decorator
