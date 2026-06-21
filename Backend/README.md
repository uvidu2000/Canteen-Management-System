# Flask SQLite Backend

Backend API for the canteen portal.

## Setup

```bash
cd Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run.py init-db
python run.py seed
python run.py
```

Use `init-db` and `seed` only for first-time setup or when you intentionally want to reset demo data. For normal daily use, only run:

```bash
cd Backend
.venv\Scripts\activate
python run.py
```

SQLite data is stored in:

```text
Backend/instance/canteen.sqlite3
```

The API runs on:

```text
http://localhost:5000
```

Demo credentials:

```text
Staff mobile: 94714547325
Student IDs:
- 20211188: Uvidu
- 20209891: Nipuni
- 20240982: Ruhiri
OTP: 123456
```

## Main endpoints

```text
POST /auth/login
POST /auth/verify-otp
GET  /food-items
POST /food-items
PATCH /food-items/<id>
DELETE /food-items/<id>
POST /food-items/<id>/reviews
PATCH /food-items/<id>/reviews/<review_id>
DELETE /food-items/<id>/reviews/<review_id>
GET  /orders
POST /orders
PATCH /orders/<id>
DELETE /orders/<id>
```
