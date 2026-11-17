# Survey Builder

A full-stack survey application with an administrator survey builder, authenticated user
responses, per-user completion history, conditional questions, and an analytics dashboard.

## Features

### Administrators

- Sign in with a role-protected admin account.
- Create, edit, and delete surveys with a title and description.
- Add four question types:
  - Text answer
  - Single choice
  - Checkboxes (multi-select)
  - Rating from 1 to 5
- Add, remove, and reorder questions.
- Mark individual questions as required.
- Add conditional logic: show a question only when an earlier answer matches a value.
- Save surveys as drafts and publish or unpublish them.
- View analytics:
  - Total responses
  - Single-choice and checkbox response counts
  - Rating averages and distribution
  - All text responses
  - A list of every respondent with their submitted answers and submission time

### Users

- Register and sign in.
- Browse all published surveys from the main page.
- Surveys they have already submitted display a **Completed** marker.
- Fill a survey with client-side and server-side validation.
- Conditional questions appear only when their condition is met.
- Every completed survey is stored in a personal history page with the submission time.
- One response is allowed per user per survey.

## Tech Stack

| Layer     | Tools                                                        |
| --------- | ------------------------------------------------------------ |
| Language  | TypeScript                                                   |
| Frontend  | React 19, React Router, Tailwind CSS 4, GSAP                 |
| Backend   | Node.js, Express 5, Zod, JSON Web Tokens, bcrypt             |
| Database  | PostgreSQL 16, Prisma ORM                                    |

## Project Structure

```text
SurveyBuilder/
├── backend/
│   ├── prisma/
│   │   ├── migrations/          # Applied SQL migrations
│   │   ├── schema.prisma        # User, Survey and Response models
│   │   └── seed.ts              # Creates the administrator account
│   └── src/
│       ├── controllers/         # Auth, survey and user business logic
│       ├── middleware/          # Authentication, validation, error handling
│       ├── routes/              # Thin Express route definitions
│       ├── validation/          # Zod request schemas
│       ├── lib/                 # JWT cookies, question rules, helpers
│       ├── env.ts
│       ├── prisma.ts
│       └── index.ts
├── frontend/
│   └── src/
│       ├── components/          # Shell, auth layout, shared UI
│       ├── context/             # Authentication state
│       ├── hooks/               # GSAP page reveal hook
│       ├── lib/                 # API client, types, question helpers
│       └── pages/               # Auth, user and admin pages
└── README.md
```

## Setup

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer
- A PostgreSQL role that can create tables in the target database

### 1. Create the database

```bash
createdb survey_builder
```

Or from `psql`:

```sql
CREATE DATABASE survey_builder;
```

### 2. Configure and start the backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/survey_builder?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
NODE_ENV=development
COOKIE_SECURE=false

ADMIN_EMAIL="admin@surveybuilder.local"
ADMIN_PASSWORD="admin12345"
ADMIN_NAME="Workspace Admin"
```

Then apply the database schema and create the administrator:

```bash
npm run db:deploy
npm run db:seed
npm run dev
```

The API runs at `http://localhost:4000`. A health check is available at
`GET /api/health`.

> The `.env` included in this workspace uses a local Unix socket connection to the
> existing `surveybuilderdb` database. For a standard local PostgreSQL install, use the
> TCP connection string shown above.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the backend on port 4000.

### Default accounts

- Administrator: `admin@surveybuilder.local` / `admin12345`
- Users: create an account from the registration page.

Change the administrator credentials in `backend/.env` before using this outside local
development.

## How to Use

### Administrator flow

1. Sign in with the administrator account. You are redirected to `/admin`.
2. Select **New survey**, enter the survey details, and add questions.
3. Reorder questions with **Up** / **Down**, remove them, or mark them **Required**.
4. For a conditional question, enable **Show this question conditionally** and choose the
   earlier question, operator, and value.
5. Select **Save survey**, then **Publish survey**.
6. Open **Analytics** to see question-level results, the list of respondents, and each
   respondent's answers.

### User flow

1. Select **Create account** and register.
2. The main page lists published surveys. Completed surveys show a **Completed** badge.
3. Open a survey and answer the visible questions.
4. After submitting, the survey is marked complete and appears on the **History** page.
5. A second submission for the same survey is blocked.

## API Overview

### Authentication

| Method | Endpoint             | Access        | Purpose                        |
| ------ | -------------------- | ------------- | ------------------------------ |
| POST   | `/api/auth/register` | Public        | Create a user account          |
| POST   | `/api/auth/login`    | Public        | Sign in and set the JWT cookie |
| POST   | `/api/auth/logout`   | Public        | Clear the JWT cookie           |
| GET    | `/api/auth/me`       | Authenticated | Return the current user        |

### Administrator surveys

All routes below require an `ADMIN` account.

| Method | Endpoint                        | Purpose                                      |
| ------ | ------------------------------- | -------------------------------------------- |
| GET    | `/api/surveys`                  | List the administrator's surveys             |
| POST   | `/api/surveys`                  | Create a survey                              |
| GET    | `/api/surveys/:id`              | Get a survey with its schema                 |
| PUT    | `/api/surveys/:id`              | Update a survey                              |
| PATCH  | `/api/surveys/:id/status`       | Publish or unpublish (`{ "published": true }`) |
| DELETE | `/api/surveys/:id`              | Delete a survey and its responses            |
| GET    | `/api/surveys/:id/analytics`    | Aggregated results and respondent answers    |

### User surveys

All routes below require an authenticated account.

| Method | Endpoint                             | Purpose                                      |
| ------ | ------------------------------------ | -------------------------------------------- |
| GET    | `/api/user/surveys`                  | List published surveys with completion state |
| GET    | `/api/user/surveys/:id`              | Get a survey, completion state, and submitted answers |
| POST   | `/api/user/surveys/:id/responses`    | Submit answers                               |
| GET    | `/api/user/history`                  | List the user's completed surveys            |

## Data Model

```text
User
  id, name, email, passwordHash, role (ADMIN | USER)

Survey
  id, title, description, questions (JSON), status (DRAFT | PUBLISHED), adminId
  questions is an ordered JSON array of typed question objects

Response
  id, surveyId, userId, answers (JSON), submittedAt
  unique(surveyId, userId) prevents duplicate submissions
```

Each question has a stable ID. Response answers are keyed by those IDs, so a survey's
schema can remain flexible without adding a new table for every question type.

## Architecture Decisions

- **JSON survey schema.** Surveys are dynamic, so the ordered question array is stored as
  JSON in PostgreSQL. Prisma still manages users, surveys, and responses as relational
  records.
- **Separate controllers, middleware, and routes.** Routes only declare endpoints and
  middleware. Business logic lives in controllers; authentication, validation, and error
  handling live in dedicated middleware files.
- **Request validation with Zod.** Login, registration, survey schemas, question
  structures, and response payloads are validated before reaching the database.
- **JWT in an HTTP-only cookie.** Tokens are never exposed to client JavaScript.
  Authentication middleware reloads the user from the database and exposes the role for
  authorization.
- **Role-based protection.** Admin APIs require `ADMIN`; user APIs require authentication.
  The frontend also has protected route wrappers, but server-side checks are authoritative.
- **Conditional logic on both sides.** The form hides questions immediately, while the
  backend recalculates visibility and ignores answers to hidden questions. This prevents
  clients from submitting stale or unqualified answers.
- **Analytics computed on read.** Counts, rating averages, and text lists are calculated
  from stored responses when the dashboard is requested. This keeps writes simple and is
  appropriate for small and medium response volumes.
- **Minimal animation.** GSAP is used only for page and list entrances; reduced-motion
  preferences are respected.

## Assumptions and Trade-offs

- Authentication is required to view and answer surveys. The completed state and history
  are tied to the signed-in user.
- One response per user per survey is enforced with a database unique constraint. Users
  cannot edit a response after submission.
- There is no email verification, password reset, or account management screen. Users
  register directly.
- The administrator account is created by the seed script instead of a public admin
  registration form.
- Editing a survey after responses exist keeps existing answers by question ID. Renaming a
  question is safe; deleting a question or changing options can make older answers harder
  to interpret in analytics.
- Unpublishing a survey removes it from the user survey list, but stored responses and the
  respondents' history remain. Users can still open a completed survey from their history and
  review their submitted answers in read-only mode.
- JWT cookies expire after seven days and there is no refresh-token rotation. CSRF
  protection is not implemented because authentication uses a same-site HTTP-only cookie
  and the app is expected to run behind the same origin in development. A production
  deployment should add an explicit CSRF strategy and secure cookies.
- Analytics are read-time calculations. At large scale, aggregate tables or cached
  metrics would be preferable.
- No file uploads, pagination, or advanced export features are included, to keep the scope
  aligned with the requirements.

## Commands

### Backend

```bash
npm run dev          # Start the API with hot reload
npm run build        # Compile TypeScript to dist/
npm start            # Run the compiled API
npm run typecheck    # Type-check without emitting
npm run db:deploy    # Apply committed migrations
npm run db:migrate   # Create a new development migration
npm run db:seed      # Create or update the administrator account
```

### Frontend

```bash
npm run dev          # Start Vite on port 5173
npm run build        # Type-check and build for production
npm run lint         # Run ESLint
npm run preview      # Preview the production build
```
