# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Use React hooks and functional components with the existing API client (`src/api/client.ts`). Each feature page (Activities, Teams, Leaderboard, Workouts) will manage its own loading, error, and empty states with accessible ARIA labels. Forms will validate input and display server-side errors from 4xx responses.

- Logic tier decision: Separate concerns into routes (HTTP layer) and services (business logic layer). Routes validate input and return deliberate 4xx responses for invalid data; services contain reusable domain logic. All endpoints start with `/api/` and use TypeScript for type safety.

- Data tier decision: Define Mongoose schemas with built-in validation for User, Team, Activity, and Workout models. Use Mongoose population for references. Seed data idempotently using upserts to avoid data loss and reconcile team membership changes.

- Activity tracking approach: Store activities with references to user and team documents. Calculate `points` based on activity `type` (run/walk/bike = different multipliers) and `minutes`. Use MongoDB aggregation to sum points per team for leaderboard ranking. Set `occurredAt` to current timestamp at creation.

- Team management approach: Teams store `name`, `mascot`, and an array of member references (User IDs). Support adding/removing members via upserts in the seed. Validate that `name` is required; reject POST without a name with 400. Populate members when returning team data.

- Leaderboard approach: Query all teams and sum their activities' points using aggregation pipeline or in-memory grouping. Sort by total points descending and add 1-based rank. Return entries with `teamName`, `totalPoints`, and `rank` to the presentation tier.

- Workout suggestions approach: Query recent activities for a user matched by email. Analyze activity types and user's `fitnessGoal` to recommend workouts. The first suggestion's `focus` will match the user's goal or most recent activity type. Include a `reason` string explaining the recommendation. Return 404 if the email doesn't match any user.

## Test plan

Record the commands you run and what each failure means.

- **Data-tier command**: `npm run test:data --prefix octofit-tracker/backend`
  - **Baseline**: 4 failures (User, Team, Activity, Workout schemas missing validation)
  - **Goal**: All 5 tests pass (validation for required fields: name/email/goal for users, name/mascot for teams, type/user/team/minutes/points/occurredAt for activities, focus/minutes/difficulty for workouts)
  - **Success**: All schemas define required fields with proper error messages

- **API command**: `npm run test:api --prefix octofit-tracker/backend`
  - **Baseline**: 4 failures (501 errors for activities/teams, empty leaderboard, missing reason in suggestions)
  - **Activity test**: POST to `/api/activities` returns 400 for missing userId/teamId, 201 with computed points on success
  - **Team test**: POST to `/api/teams` returns 400 for missing name, 201 on success; GET returns teams with populated members
  - **Leaderboard test**: GET `/api/leaderboard` returns ranked teams ordered by total points descending with 1-based rank
  - **Workout test**: GET `/api/workouts/suggestions/:email` returns suggestions array with title, focus, reason, and difficulty; 404 if email doesn't match
  - **Goal**: All 4 tests pass with proper status codes and response shapes

- **Frontend command**: `npm test --prefix octofit-tracker/frontend`
  - **Baseline**: 15 failures (all pages show "Implementation pending" placeholder)
  - **Activities page**: Renders activity table on success, shows loading state while fetching, handles empty state, displays form validation errors
  - **Teams page**: Renders team list with member names, form for creating teams with name/mascot, shows validation errors
  - **Leaderboard page**: Renders ranked table with Rank | Team | Points columns, ordered by points descending
  - **Workouts page**: Email input field, renders suggestions with title/focus/reason/difficulty on success, shows 404 error message for unknown email
  - **Goal**: All 15 tests pass with accessible content and proper form handling

- **Backend build command**: `npm run build --prefix octofit-tracker/backend`
  - Compiles TypeScript to JavaScript without errors
  - Validates all imports, types, and service/route definitions

- **Frontend build command**: `npm run build --prefix octofit-tracker/frontend`
  - Bundles React components and API client for production
  - Validates no broken imports or missing components
