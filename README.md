# LitTracker

LitTracker is a full-stack media tracking app for saving books, movies, TV series and all kinds of media into a personal list. Users can search external media APIs, create an account, log in, and save items to a user-specific list backed by Azure PostgreSQL.

## Features

- Search movies and TV series with TMDB
- Search books with Google Books
- Register and log in with hashed passwords
- JWT-based auth for protected list actions
- Save media items to a user-specific list
- Store shared media metadata once in a centralized `media_items` table
- Fetch each user's saved list through `user_list_items` relationships

## Tech Stack

- Frontend: React, Vite, React Router, React Hook Form, Axios
- Backend: Node.js, Express, pg
- Auth: bcrypt, JSON Web Tokens
- Database: Azure Database for PostgreSQL
- APIs: TMDB API, Google Books API

## Project Structure

```txt
server/
  auth/
    routes.js        # signup/login routes and JWT creation
  db.js              # PostgreSQL connection pool
  index.js           # Express app and media list routes

src/
  components/
    BookSearch.jsx
    Login.jsx
    MovieSearch.jsx
    Register.jsx
    UserList.jsx
  App.jsx            # React Router routes and protected UserList route
```

## Database Model

The app uses a centralized media table plus a user-to-media relationship table.

```txt
users
- id
- name
- email
- password_hash

media_items
- id
- media_type
- external_source
- external_id
- title
- image_url
- release_date
- rating

user_list_items
- user_id
- media_item_id
- added_at
```

## Environment Variables

Create a `.env` file in the project root. Do not commit this file.

```env
PORT=3001 or any port
DATABASE_URL=postgresql://USER:PASSWORD@SERVER.postgres.database.azure.com:5432/DATABASE?sslmode=require
JWT_SECRET=your_long_random_secret
VITE_API_URL=http://localhost:3001 or any port/production server you choose
VITE_TMDB_API_KEY=your_tmdb_bearer_token
VITE_BOOKS_API_KEY=your_google_books_api_key
```

Generate a local JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Azure PostgreSQL

This project uses Azure Database for PostgreSQL as the hosted database. The backend connects through the `DATABASE_URL` environment variable using the `pg` package.

A typical Azure PostgreSQL connection string looks like:

```txt
postgresql://USER:PASSWORD@SERVER.postgres.database.azure.com:5432/DATABASE?sslmode=require
```

After changing database or auth environment variables, restart the backend server.

## Running Locally

Install dependencies:

```bash
npm install
```

Start the Express backend:

```bash
npm run server
```

Start the Vite frontend in a second terminal:

```bash
npm run dev
```

Frontend runs on Vite's local dev server, and the backend runs on:

```txt
http://localhost:3001
```

## Available Scripts

```bash
npm run dev      # start frontend dev server
npm run server   # start Express backend
npm run build    # build frontend for production
npm run preview  # preview production frontend build
npm run lint     # run ESLint
```

## API Overview

Auth routes are mounted under `/api`.

```txt
POST /api/signup
POST /api/login-check
```

Media list routes:

```txt
GET  /api/media-list
POST /api/media-list
```

Protected media list requests require an auth header:

```txt
Authorization: Bearer <jwt_token>
```

## Current Status

Working locally:

- User registration
- User login with JWT token storage
- Public book/movie search pages
- Protected user list page
- Add-to-list requests connected to authenticated users

In progress / future work:

- Improve frontend styling and layout
- Add clearer loading and success states
- Add remove-from-list support
- Move external API calls fully behind the backend for production
- Build a richer homepage with user-based recommendations
- Deploy frontend and backend
- Add CI/CD checks
