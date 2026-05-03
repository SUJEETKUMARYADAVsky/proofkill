# ProofSkill

ProofSkill is a project submission and review platform that helps users build a visible portfolio of work, submit GitHub projects for review, and share a public profile with recruiters.

## What it solves

It turns scattered coding exercises into proof of skill. Users can submit work, get reviewed, track progress, and share a recruiter-friendly public profile with ratings and feedback.

## Features

- User authentication with JWT
- Project listing and submission flow
- Admin review workflow with ratings and feedback
- Private dashboard with progress and submission history
- Public profile route at `/u/:username`
- Shareable profile link from the dashboard
- Clean reviewed-first project cards

## Tech Stack

- Frontend: React, Vite, React Router, Tailwind CSS
- Backend: Node.js, Express
- Data: JSON-based local store for development
- Auth: JWT, bcryptjs

## Project Structure

- `backend/` - API server, routes, controllers, models, and utilities
- `src/` - React app, pages, components, context, and services
- `public/` - static assets
- Generated build output such as `dist/` stays out of version control

## Running Locally

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
copy .env.example .env
```

3. Start the app:

```bash
npm run dev:all
```

4. Open the app:

- Frontend: `http://localhost:5175` or the port printed by Vite
- Backend: `http://localhost:5000`

## Environment Variables

See `.env.example` for the required values.

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `ALLOW_IN_MEMORY_DB`
- `VITE_API_URL`

## Suggested Commit Breakdown

The repository is cleaner when changes are grouped by feature instead of being bundled into one large commit.

1. `Add user authentication with JWT`
2. `Create project listing API`
3. `Implement submission workflow`
4. `Add review and rating system`
5. `Build dashboard and public profile UI`
6. `Improve UI with Tailwind and shared components`
7. `Remove debug logs and temporary scripts`

## Notes

- Public profiles are intentionally read-only and do not require login.
- Reviewed submissions are treated as the strongest proof of work.
- Temporary helper files and build output should stay out of version control.
