## Homi

Homi is a lightweight property management app for small teams and independent landlords. It helps you manage units and tenants, track rent and payments, log issues, and upload photos — with secure auth and a simple, mobile-first UI.

## Features

### Seamless Management

- **Units and Tenants**: Create, view, and edit units and tenant records with per‑organization scoping.

### Rent and Payments

- **Schedules and Tracking**: Generate upcoming rent schedules and track due/paid status. Mark payments with method and notes.

### Maintenance Issues

- **Issue Logging**: Capture and resolve maintenance issues with basic status tracking.

### Media Uploads

- **Photos**: Upload unit photos to Supabase Storage; previous images can be replaced and deleted.

### Metrics

- **Dashboards**: Simple rent summary metrics endpoints for quick insights.

### Security

- **Authentication**: Clerk-based JWT session verification on the server. Organization context enforced per request.

## Technologies Used

- **Frontend**: Expo (React Native), Expo Router, React Query, Clerk
- **Backend (Ruby)**: Rails API (8.x), Sidekiq, Pagy, Rswag (OpenAPI)
- **Optional Backend (Node)**: Fastify, BullMQ, Zod
- **Database**: PostgreSQL
- **Queue/Cache**: Redis
- **Storage**: Supabase Storage
- **Auth**: Clerk (JWT verification)

## Setup

### 1) Configure environment variables

Create an environment file for the Rails API (used by Docker) at `backend/backend-ruby/.env.local`:

```bash
# Rails / API
RAILS_ENV=development

# Database (either provide DATABASE_URL or these PG* vars)
DATABASE_URL=
PGHOST=db
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres

# Auth (Clerk)
CLERK_SECRET_KEY=
CLERK_ISSUER=
# Optional
CLERK_AUDIENCE=

# Redis / Sidekiq
REDIS_URL=redis://redis:6379/0

# Supabase Storage
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET_UNITS=unit-media
SUPABASE_STORAGE_BUCKET_TENANTS=tenant-media

# Protect Sidekiq Web UI (optional)
SIDEKIQ_USER=
SIDEKIQ_PASSWORD=
```

If you plan to run the optional Node backend, create `backend/backend-node/.env.local`:

```bash
# Server
PORT=3001

# Auth (Clerk)
CLERK_SECRET_KEY=
CLERK_ISSUER=
# Optional
CLERK_JWT_ISSUER=
CLERK_ISSUER_URL=
CLERK_AUTHORIZED_PARTIES=

# Supabase Storage
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET_UNITS=unit-media
SUPABASE_STORAGE_BUCKET_TENANTS=tenant-media

# Redis for BullMQ
REDIS_URL=redis://localhost:6379/0

# Optional seed
ENABLE_SEED=false
```

Configure the frontend API URL and Clerk publishable key in `frontend/app.json` (under `expo.extra`):

```json
{
  "expo": {
    "extra": {
      "API_URL": "http://localhost:3000/",
      "CLERK_PUBLISHABLE_KEY": "pk_test_..."
    }
  }
}
```

### 2) Build and run the API with Docker (Rails)

```bash
cd backend/backend-ruby
docker compose build
docker compose up
```

- API available at `http://localhost:3000`
- Swagger docs at `http://localhost:3000/docs`

### 3) Run the frontend (Expo)

```bash
cd frontend
npm install
npm run start
```

### 4) Optional: run the Node backend locally

```bash
cd backend/backend-node
npm install
npm run dev
```

## License

This project is licensed under the MIT License. See `LICENSE` for details.
