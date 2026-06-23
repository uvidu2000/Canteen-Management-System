DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS vote_ballots;
DROP TABLE IF EXISTS vote_options;
DROP TABLE IF EXISTS vote_participants;
DROP TABLE IF EXISTS vote_sessions;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS food_items;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal TEXT NOT NULL CHECK (portal IN ('student', 'staff')),
  identifier TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL
);

CREATE TABLE food_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  food_item_id INTEGER NOT NULL,
  student_mobile TEXT NOT NULL,
  student_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE CASCADE
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  student_mobile TEXT NOT NULL,
  student_name TEXT NOT NULL,
  total_price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  ordered_at TEXT NOT NULL
);

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
);

CREATE TABLE vote_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  creator_identifier TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Ended')),
  ended_at TEXT
);

CREATE TABLE vote_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vote_id INTEGER NOT NULL,
  student_identifier TEXT NOT NULL,
  student_name TEXT NOT NULL,
  UNIQUE (vote_id, student_identifier),
  FOREIGN KEY (vote_id) REFERENCES vote_sessions (id) ON DELETE CASCADE
);

CREATE TABLE vote_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vote_id INTEGER NOT NULL,
  food_item_id INTEGER NOT NULL,
  food_name TEXT NOT NULL,
  UNIQUE (vote_id, food_item_id),
  FOREIGN KEY (vote_id) REFERENCES vote_sessions (id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE CASCADE
);

CREATE TABLE vote_ballots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vote_id INTEGER NOT NULL,
  student_identifier TEXT NOT NULL,
  food_item_id INTEGER NOT NULL,
  voted_at TEXT NOT NULL,
  UNIQUE (vote_id, student_identifier),
  FOREIGN KEY (vote_id) REFERENCES vote_sessions (id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE CASCADE
);
