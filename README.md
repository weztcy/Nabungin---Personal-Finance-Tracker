# Nabungin — Personal Finance Tracker

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.3-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.7-black?logo=auth0&logoColor=white)](https://www.better-auth.com/)
[![Vitest](https://img.shields.io/badge/Tests-23%20passed-success?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

<p align="center">
  <img src="./screenshots/banner.png" alt="Nabungin — Personal Finance Tracker" width="100%" />
</p>

Nabungin is a modern, full-stack personal finance tracker and wealth management platform designed to deliver complete clarity, security, and precision over your financial life. Built to solve the chaos of tracking fragmented funds across physical cash, bank accounts, digital e-wallets, revolving credit cards, and investments, Nabungin provides an all-in-one financial operating system. Users can monitor multi-asset net worth in real time, record and categorize income and expenses, enforce period-based budgets with active overspending alerts, establish savings goal milestones, and automate routine recurring cashflows.

Engineered as a high-performance TypeScript monorepo, Nabungin features a decoupled architecture combining an Express 5 REST API backend with a Next.js 16 (App Router) and React 19 frontend. The backend utilizes Prisma 7 with the `@prisma/adapter-pg` driver adapter directly against PostgreSQL 16, securing all operations behind Better Auth session-based authentication with 30-day sliding sessions and cross-origin credential sharing. Crucially, Nabungin completely eliminates floating-point rounding errors by enforcing an exact **BigInt minor-unit ledger** (IDR scale = 0). Every calculation—from multi-account balance reconciliation to 6-month historical cashflow trends—is computed with mathematical precision before presentation.

---

## Features

- **Exact Minor-Unit Financial Ledger**: Implements 64-bit `BigInt` minor units across all balance computations, currency transformations, and aggregations (scale = 0 for IDR), eliminating floating-point rounding inaccuracies common in JavaScript monetary systems.
- **Executive Financial Dashboard**: Centralized command view summarizing consolidated net worth, monthly income, expense totals, net cashflow surplus, daily cashflow bar charts, category spending donut distributions, and real-time account balances.
- **Multi-Account & Multi-Asset Portfolio**: Manage cash, bank accounts, e-wallets (GoPay, OVO), credit cards (with negative balance handling), and investment holdings. Features automated balance recalculations and soft-archiving to preserve historic ledger integrity.
- **Hierarchical Categorization**: Dual-stream classification separating Income and Expense categories with customizable theme colors, metadata icons, and deletion safeguards for referenced records.
- **Dynamic Periodic Budgeting**: Configure spending caps per category across customizable periods (monthly, custom intervals). Features real-time consumption progress bars, remaining budget trackers, and visual overspending warnings.
- **Savings Goals & Financial Milestones**: Track long-term financial targets with target amounts, optional target completion dates, linked accumulation accounts, and real-time progress percentages.
- **Automated Recurring Transactions**: Automate routine cashflows (salaries, subscriptions like Netflix and Spotify, utility bills, loan amortizations, and recurring savings transfers) with customizable cadences (daily, weekly, monthly, yearly), next-execution forecasting, and active/pause toggles.
- **In-Depth Financial Reports & Analytics**: Historical month-by-month financial analysis featuring 6-month cashflow comparison line charts, automated savings ratio calculations, detailed categorical breakdown bars, and chronological period navigation.
- **Robust Session Authentication**: Integrated with Better Auth featuring email/password authentication, Bcrypt password hashing, 30-day sliding cookie sessions, and Next.js 16 routing proxy protection.
- **Modern Responsive Dark/Light UI**: Styled with Tailwind CSS 4, Base UI, Shadcn UI primitives, Recharts data visualizations, and Sonner toast notifications with seamless theme persistence.

---

## Preview & Demo

### Executive Financial Dashboard

![Nabungin Financial Dashboard & Cashflow Overview](./screenshots/Nabungin%20-%20Personal%20Finance%20Tracker%201.png)
_Real-time executive dashboard displaying total net worth, current month income, expenses, net surplus, daily cashflow bar chart, category donut distribution, recent transactions, and account snapshots._

### Comprehensive Transaction Ledger

![Comprehensive Transaction Ledger & Filtering](./screenshots/Nabungin%20-%20Personal%20Finance%20Tracker%202.png)
_Detailed transaction activity view featuring quick category and type filters (All, Income, Expense, Transfer) with payee, notes, and source/destination account tracking._

### Multi-Account & Portfolio Management

![Multi-Account & Multi-Asset Management](./screenshots/Nabungin%20-%20Personal%20Finance%20Tracker%203.png)
_Multi-account balance overview categorizing cash, banking accounts, e-wallets, credit cards, and investments with support for account archiving._

### Period-Based Budget Monitoring

![Period-Based Budget Monitoring](./screenshots/Nabungin%20-%20Personal%20Finance%20Tracker%205.png)
_Budget allocation cards tracking spending limits, spent amounts, remaining allowances, and overspending indicators across active billing cycles._

### Savings Goals & Financial Milestones

![Savings Goals & Milestones](./screenshots/Nabungin%20-%20Personal%20Finance%20Tracker%206.png)
_Savings goals view tracking target amounts, saved amounts, milestone percentages, target dates, and linked funding accounts._

### Historical Reports & 6-Month Trend Analytics

![In-Depth Financial Reports & Analytics](./screenshots/Nabungin%20-%20Personal%20Finance%20Tracker%208.png)
_Financial analytics suite featuring a 6-month comparative cashflow trend chart, savings ratio calculations, and proportional category expense distribution._

---

## Tech Stack

### Core Technologies

- **Frontend Framework**: [Next.js 16.4 (App Router)](https://nextjs.org/)
- **UI Library**: [React 19.3](https://react.dev/) & [React DOM 19.3](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling & Design System**: [Tailwind CSS 4](https://tailwindcss.com/), Base UI (`@base-ui/react`), Shadcn UI, [Lucide React](https://lucide.dev/)
- **Data Visualization**: [Recharts 3.10](https://recharts.org/)
- **Form Management & Validation**: [React Hook Form 7.90](https://react-hook-form.com/), [Zod 4.6](https://zod.dev/), `@hookform/resolvers`
- **Backend Framework**: [Express 5.3](https://expressjs.com/)
- **Database & ORM**: [PostgreSQL 16](https://www.postgresql.org/) & [Prisma 7.10](https://www.prisma.io/) (with `@prisma/adapter-pg`)
- **Authentication**: [Better Auth 1.7](https://www.better-auth.com/) (`@better-auth/prisma-adapter`)
- **Date Utilities**: [date-fns 4.4](https://date-fns.org/)

### Tooling & Infrastructure

- **Monorepo Architecture**: npm Workspaces, [Concurrently 9.2](https://github.com/open-cli-tools/concurrently)
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (PostgreSQL 16 Alpine, Adminer)
- **Code Quality & Formatting**: ESLint 9, Prettier 3.9 (`prettier-plugin-tailwindcss`)
- **Testing**: [Vitest 5.0](https://vitest.dev/)
- **Runtime Execution**: Node.js (>=20.0.0), `tsx 4.23`

---

## Prerequisites

Ensure the following runtimes and services are installed before setting up Nabungin:

- **Node.js**: `>= 20.0.0` (LTS recommended, tested on Node.js v26)
- **Package Manager**: `npm` `>= 10.0.0`
- **Docker & Docker Compose**: Required for containerized PostgreSQL 16 and Adminer database management

---

## Installation & Setup

### 1. Clone & Enter Repository

```bash
git clone https://github.com/weztcy/Nabungin---Personal-Finance-Tracker.git
cd Nabungin---Personal-Finance-Tracker
```

### 2. Install Dependencies

Install all monorepo dependencies across the root, backend, and frontend workspaces:

```bash
npm install
```

### 3. Start Database Services

Launch the PostgreSQL 16 and Adminer containers in the background:

```bash
docker compose up -d
```

### 4. Configure Environment Variables

Copy the sample environment configuration files for both services:

**For Linux / macOS / Bash:**

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**For Windows PowerShell:**

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
```

### 5. Generate Prisma Client & Run Migrations

Generate the Prisma 7 client and apply database migrations:

```bash
npm run db:generate
npm run db:migrate
```

### 6. (Optional) Seed Comprehensive Demo Data

Populate the database with 7 months of realistic financial transactions, categories, budgets, savings goals, and recurring schedules:

```bash
npm run db:seed
```

> **Default Seed Credentials:**
>
> - **Email**: `demo@nabungin.app`
> - **Password**: `password1234`

---

## Environment Variables

### Backend Configuration (`backend/.env`)

| Variable             | Description                                                               | Default / Example                                                      | Required |
| -------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------- |
| `DATABASE_URL`       | PostgreSQL connection string pointing to local/hosted database            | `postgresql://nabungin:nabungin@localhost:5433/nabungin?schema=public` | Yes      |
| `BETTER_AUTH_SECRET` | Secret key used by Better Auth to sign session tokens (min 32 characters) | `replace-me-with-a-32-byte-random-string`                              | Yes      |
| `BETTER_AUTH_URL`    | Canonical backend base URL used for Better Auth callbacks & cookies       | `http://localhost:4000`                                                | Yes      |
| `PORT`               | HTTP port on which the Express REST API runs                              | `4000`                                                                 | No       |
| `CORS_ORIGIN`        | Allowed frontend origin for cross-origin requests and credentials         | `http://localhost:3000`                                                | Yes      |
| `APP_NAME`           | Application identifier displayed by auth handlers                         | `Nabungin`                                                             | No       |

### Frontend Configuration (`frontend/.env.local`)

| Variable                    | Description                                                 | Default / Example       | Required |
| --------------------------- | ----------------------------------------------------------- | ----------------------- | -------- |
| `NEXT_PUBLIC_API_URL`       | Backend REST API URL used for client & server data fetching | `http://localhost:4000` | Yes      |
| `NEXT_PUBLIC_APP_NAME`      | Public application name displayed across UI components      | `Nabungin`              | No       |
| `NEXT_PUBLIC_BASE_CURRENCY` | Default base currency code                                  | `IDR`                   | No       |
| `NEXT_PUBLIC_TIMEZONE`      | Default timezone for date and calendar formatting           | `Asia/Jakarta`          | No       |

---

## Usage / Running the Project

### Start Development Servers

Run both the Express REST API and the Next.js development server concurrently:

```bash
npm run dev
```

The services will be accessible at:

- **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:4000](http://localhost:4000)
- **API Health Check**: [http://localhost:4000/health](http://localhost:4000/health)
- **Adminer Database Manager**: [http://localhost:8081](http://localhost:8081) _(System: PostgreSQL, Server: `db`, Username: `nabungin`, Password: `nabungin`, Database: `nabungin`)_

Sign in using the seeded credentials (`demo@nabungin.app` / `password1234`) or register a new user from the `/sign-up` page.

---

## Available Scripts / Commands

The monorepo provides the following scripts executable from the repository root:

| Command                | Description                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `npm run dev`          | Concurrently starts backend (`tsx watch`) and frontend (`next dev`) with live reload |
| `npm run dev:backend`  | Starts only the Express API backend in development mode                              |
| `npm run dev:frontend` | Starts only the Next.js frontend in development mode                                 |
| `npm run build`        | Builds the Next.js frontend for production                                           |
| `npm run start`        | Concurrently runs backend and frontend production builds                             |
| `npm run lint`         | Runs ESLint across the frontend codebase                                             |
| `npm run typecheck`    | Executes TypeScript typechecks (`tsc --noEmit`) across both workspaces               |
| `npm run format`       | Automatically formats the entire repository with Prettier                            |
| `npm run format:check` | Verifies code formatting across the repository without modifying files               |
| `npm test`             | Runs the Vitest test suite on `@nabungin/frontend`                                   |
| `npm run db:generate`  | Generates the Prisma 7 client into `backend/src/generated/prisma`                    |
| `npm run db:migrate`   | Applies pending Prisma migrations in development mode                                |
| `npm run db:push`      | Pushes schema changes directly to the database without generating migrations         |
| `npm run db:seed`      | Seeds the database with deterministic demo financial data                            |
| `npm run db:studio`    | Launches Prisma Studio GUI for visual database management                            |
| `npm run db:reset`     | Resets the database, drops tables, and reapplies all migrations                      |

---

## API Reference / Documentation

All endpoints (excluding `/health` and `/api/auth/*`) require an active session cookie created by Better Auth.

### Health Check

- `GET /health`
  - **Description**: Verifies API operational status.
  - **Response**: `200 OK`
    ```json
    { "ok": true, "service": "nabungin-api" }
    ```

### Authentication (`/api/auth/*`)

Handled by Better Auth:

- `POST /api/auth/sign-up/email`: Register a new account (`name`, `email`, `password`).
- `POST /api/auth/sign-in/email`: Authenticate user and issue session cookie.
- `POST /api/auth/sign-out`: Invalidate session and clear auth cookies.
- `GET /api/auth/get-session`: Retrieve active user session metadata.

### Financial Accounts (`/api/accounts`)

- `GET /api/accounts`: Returns all user accounts with calculated current balances.
- `POST /api/accounts`: Create an account (`name`, `type`, `openingBalance`, `color`, `icon`).
- `PUT /api/accounts/:id`: Update account metadata and opening balance.
- `POST /api/accounts/:id/toggle-archived`: Toggle active/archived status.
- `DELETE /api/accounts/:id`: Delete an account (prevented if transactions reference the account).

### Categories (`/api/categories`)

- `GET /api/categories`: Returns user categories grouped by kind (`INCOME` | `EXPENSE`).
- `POST /api/categories`: Create category (`name`, `kind`, `color`, `icon`, optional `parentId`).
- `PUT /api/categories/:id`: Update category properties.
- `DELETE /api/categories/:id`: Delete an unused category.

### Transactions (`/api/transactions`)

- `GET /api/transactions?take=200`: Retrieve the most recent transactions with account and category details.
- `POST /api/transactions`: Create transaction (`type`: `INCOME` | `EXPENSE` | `TRANSFER`, `amount`, `date`, `accountId`, optional `toAccountId`, optional `categoryId`, `note`, `payee`).
- `PUT /api/transactions/:id`: Update an existing transaction.
- `DELETE /api/transactions/:id`: Remove a transaction and revert its balance impact.

### Budgets (`/api/budgets`)

- `GET /api/budgets`: List budgets alongside spent amount, remaining allowance, and percentage used for the current period.
- `POST /api/budgets`: Create budget (`name`, `amount`, `periodStart`, `periodEnd`, `frequency`, optional `categoryId`, optional `accountId`).
- `PUT /api/budgets/:id`: Update budget configuration.
- `DELETE /api/budgets/:id`: Delete a budget.

### Savings Goals (`/api/goals`)

- `GET /api/goals`: List savings goals with target amount, saved balance, and progress percentage.
- `POST /api/goals`: Create goal (`name`, `targetAmount`, `savedAmount`, `targetDate`, `color`, optional `accountId`).
- `POST /api/goals/:id/contribute`: Add funds towards goal target (`amount`).
- `PUT /api/goals/:id`: Update savings goal properties.
- `DELETE /api/goals/:id`: Remove a savings goal.

### Recurring Transactions (`/api/recurrences`)

- `GET /api/recurrences`: List automated schedules with next run dates and execution status.
- `POST /api/recurrences`: Create schedule (`name`, `type`, `amount`, `freq`: `DAILY` | `WEEKLY` | `MONTHLY` | `YEARLY`, `interval`, `nextRunAt`, `accountId`, optional `toAccountId`, optional `categoryId`).
- `POST /api/recurrences/:id/pause`: Toggle pause/active status.
- `POST /api/recurrences/:id/process`: Force immediate execution of scheduled transaction.
- `POST /api/recurrences/process-due`: Batch process all due scheduled items.

### Dashboard & Analytics (`/api/dashboard`, `/api/reports`)

- `GET /api/dashboard?month=yyyy-MM`: Combined dashboard summary (net worth, period income/expense/net, cashflow timeline points, category spending distribution, recent transactions).
- `GET /api/reports?month=yyyy-MM`: Detailed monthly financial report with 6-month historical cashflow trend points, savings ratio, and categorical breakdown.

### Profile & Settings (`/api/me`)

- `GET /api/me`: Returns profile info, locale settings (base currency, timezone), and total record counts across all modules.
- `PATCH /api/me/profile`: Update user display name and profile settings.

---

## Testing

Nabungin employs Vitest for high-speed unit and component testing, verifying money arithmetic precision and component context behavior.

### Run Tests

```bash
npm test
```

### Test Scope

- **Monetary Ledger Precision (`frontend/src/lib/money.test.ts`)**: 21 unit tests validating minor unit conversion, IDR zero-scale handling, USD decimal parsing, Intl currency formatting, addition, subtraction, ratio distribution, and percentage calculations.
- **UI Context (`frontend/src/components/ui/dropdown-menu.group-context.test.tsx`)**: 2 component tests verifying Radix/Base UI dropdown menu group context semantics.

---

## Build & Deployment

### Production Build

Build the Next.js frontend production bundle:

```bash
npm run build
```

### Production Execution

Start both the Express API and the Next.js production server concurrently:

```bash
npm run start
```

### Containerized Infrastructure

The PostgreSQL database and Adminer web management console run as production-grade Docker containers configured via `docker-compose.yml`:

- Uses the official `postgres:16-alpine` lightweight base image with persistent volume storage (`nabungin-db-data`).
- Includes automatic container health checks verifying database readiness (`pg_isready`).

---

## Contributing

1. **Monorepo Architecture Separation**:
   - Backend logic, database queries, and Better Auth handlers reside exclusively in `backend/src/`.
   - Frontend UI components, Server Components, and Server Actions reside in `frontend/src/`.
2. **Financial Data Integrity**:
   - Always store and manipulate monetary amounts as 64-bit `BigInt` minor units using helpers from `src/lib/money.ts`.
   - Never introduce floating-point numbers (`number`) into database persistence or balance calculations.
3. **Quality & Formatting Standards**:
   - Run typechecks across both packages: `npm run typecheck`
   - Run linter: `npm run lint`
   - Verify code formatting: `npm run format:check`
   - Ensure all Vitest tests pass before submitting changes: `npm test`

---

## License

Please see the [LICENSE](./LICENSE) file for the terms and conditions governing the use, modification, and distribution of this project.

## Author & Contact

**Yohanes Dimas Pratama**

- GitHub: [github.com/weztcy](https://github.com/weztcy)
- Portfolio: [dimaspratama.vercel.app](https://dimaspratama.vercel.app)
- LinkedIn: [linkedin.com/in/yohanes-dimas](https://www.linkedin.com/in/yohanes-dimas)
