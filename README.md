A web-based university canteen food review and ordering system developed for final year project demonstration purposes. The system allows students to view canteen food items, submit reviews, place food orders, and track their orders. Management users can review student feedback, monitor food ratings, view sentiment analysis results, and manage order statuses.

Project Overview

This project was designed to improve communication between university students and canteen management. Students can share their opinions about food quality, price, service, portion size, and hygiene through reviews. The system includes an sentiment analysis module trained both by an algorithmic approach and deep learning approach (on 2 seperate branches) that classifies student reviews as positive, negative, or neutral. It also supports aspect-based sentiment analysis to help management identify which specific areas require improvement.

The system also includes an online ordering feature where students can place food orders for pickup from the canteen.

Key Features
Student Features
Student login,
View available canteen food items,
View food details such as price, category, and description,
Submit food reviews and ratings,
Place food orders online,
View order status,
View previous reviews and orders, add polls with other students etc...

Management Features
Management login,
View all student reviews,
View sentiment analysis results,
Monitor positive, negative, and neutral feedback,
View aspect-based sentiment results,
View incoming food orders,
Update order status,
Identify low-rated food items

Sentiment Analysis Features

Rule-based algorithmic sentiment analysis,
Text preprocessing,
Phrase-level sentiment scoring,
Word-level sentiment scoring,
Negation handling,
Intensity handling,
Contrast handling

Aspect-based sentiment analysis for:

Taste,
Portion,
Price,
Service,
Hygiene

Ordering Features

Add food items to cart,
Place food orders,
Store order details,
Track order status,
Management order status updates

Technology Stack

Frontend

React JS,
TypeScript,
Vite,
Tailwind CSS,
shadcn/ui,
React Router,
TanStack Query,
Axios,
React Hook Form,
Zod

Backend

Python,
Flask,
SQLite,
Flask-CORS,
Werkzeug password hashing,
Database,
SQLite local database

The system uses SQLite because it is lightweight, free, and suitable for running the project locally on a laptop without requiring a separate database server.
