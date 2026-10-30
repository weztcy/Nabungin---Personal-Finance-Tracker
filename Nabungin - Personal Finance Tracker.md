export const PROJECT_CASE_STUDIES: ProjectCaseStudy[] = [
{
id: "nabungin-personal-finance-tracker",
code: "PRO-09 // WEB-05",
title: "Nabungin: Precision Minor-Unit Financial Ledger & Multi-Asset Cashflow Engine",
category: "web-development",
categoryLabel: "Web Development",
year: "2026",
status: "Completed",
imageUrl: "nabungin1.webp",
images: [
"nabungin1.webp",
"nabungin2.webp",
"nabungin3.webp",
"nabungin4.webp",
"nabungin5.webp",
"nabungin6.webp",
"nabungin7.webp",
"nabungin8.webp",
"nabungin9.webp"
],
summary:
"Full-stack personal finance platform engineered with Next.js 16, React 19, Express 5, and Prisma 7 on PostgreSQL 16, featuring a BigInt minor-unit ledger, multi-account portfolio reconciliation, period-based budget enforcement, automated recurring transaction scheduling, and interactive Recharts cashflow analytics.",
overview:
"Nabungin is a full-stack personal finance and wealth management platform engineered to resolve data fragmentation across banking accounts, digital e-wallets, credit cards, and investments while eliminating floating-point rounding drift. Built as a high-performance TypeScript monorepo, the architecture decouples an Express 5 REST API from a Next.js 16 and React 19 frontend operating as a Backend-for-Frontend. Database interactions are managed through Prisma 7 and driver adapters over PostgreSQL 16, secured via Better Auth session authentication with 30-day sliding cookies and Next.js 16 routing proxy validation. All monetary calculations strictly utilize a 64-bit BigInt minor-unit ledger (IDR scale = 0), preventing precision loss across multi-account balance reconciliations, transfer integrity validations, and periodic budget evaluations. Real-time cashflow distributions and 6-month historical trends are dynamically projected to the client via Recharts and React Server Components, delivering sub-millisecond computation and zero-jank UI responsiveness.",
challenge:
"Standard floating-point arithmetic (IEEE 754) introduces cumulative rounding drift during high-frequency balance reconciliations, split allocations, and multi-month cashflow aggregations. Concurrently, synchronizing cross-origin session credentials between an independent Express API and a Next.js 16 App Router BFF presented architectural challenges, where race conditions in cookie propagation, optimistic proxy checks, and double-entry transfer rollbacks risked ledger inconsistencies and unauthorized route execution.",
architectureSummary:
"Next.js 16 App Router & React 19 BFF + Express 5 REST API + BigInt minor-unit ledger engine + Prisma 7 ORM with PostgreSQL 16 pg adapter + Better Auth sliding session security",
objectives: [
"Eliminate IEEE 754 floating-point rounding drift by enforcing 64-bit BigInt minor units across all balance computations, transfers, and aggregations.",
"Decouple backend domain logic from presentation layers using an Express 5 REST API and Next.js 16 App Router Backend-for-Frontend.",
"Implement cross-origin authentication with 30-day sliding cookie sessions and Next.js 16 routing proxy middleware validation.",
"Deliver real-time multi-account balance reconciliation with transactional integrity preventing partial double-entry transfers.",
"Provide sub-15ms aggregated cashflow reporting and 6-month historical trend analysis using indexed PostgreSQL queries.",
"Ensure zero-downtime containerized deployment with PostgreSQL 16 Alpine health checks and Adminer database management."
],
features: [
{
title: "Exact Minor-Unit Financial Ledger",
description:
"Encapsulated BigInt arithmetic engine performing all monetary operations in minor units to eliminate floating-point precision loss.",
badge: "Zero Rounding Drift"
},
{
title: "Consolidated Executive Dashboard",
description:
"Real-time command center summarizing net worth, monthly cashflow velocity, daily velocity charts, and category donut distributions.",
badge: "Sub-15ms Aggregation"
},
{
title: "Multi-Account Portfolio Engine",
description:
"Unified management of cash, bank accounts, e-wallets, credit cards, and investments with soft-archival support.",
badge: "Multi-Asset Reconcile"
},
{
title: "Hierarchical Category Architecture",
description:
"Dual-tier classification separating income and expense streams with custom theme colors, metadata icons, and deletion integrity guards.",
badge: "Integrity Safeguards"
},
{
title: "Period-Based Budget Enforcement",
description:
"Dynamic spending caps with live consumption tracking, remaining allowances, and overspending warning states.",
badge: "Real-Time Tracking"
},
{
title: "Savings Goals & Milestone Tracker",
description:
"Target accumulation milestone system with linked funding accounts, target deadlines, and progress bars.",
badge: "Milestone Tracking"
},
{
title: "Automated Recurring Scheduler",
description:
"Rule-based engine for recurring income, bills, and transfers with multi-cadence support and manual trigger overrides.",
badge: "Automated Cadence"
},
{
title: "Comparative 6-Month Cashflow Analytics",
description:
"Analytical reporting module delivering multi-month income vs expense trend lines and savings ratio metrics.",
badge: "Trend Visualization"
},
{
title: "Better Auth Session Security",
description:
"HttpOnly sliding session management with Bcrypt password hashing and Next.js 16 routing proxy enforcement.",
badge: "30-Day Sliding Auth"
}
],
pipelineSteps: [
{
step: "01. Client Form Dispatch & Zod Validation",
detail:
"User submits transaction or budget form; React Hook Form and Zod validate schema constraints before HTTP transmission.",
latencyOrMetric: "<1ms Client Validation"
},
{
step: "02. Next.js 16 Routing Proxy & Session Inspection",
detail:
"Next.js proxy middleware inspects HttpOnly session cookie, validating authentication state prior to upstream delegation.",
latencyOrMetric: "sub-2ms Proxy Check"
},
{
step: "03. Express Ingestion & Ownership Verification",
detail:
"Express 5 router parses payload, executes session middleware, and verifies ownership of source and destination accounts.",
latencyOrMetric: "4ms Request Auth"
},
{
step: "04. BigInt Minor-Unit Conversion & Arithmetic",
detail:
"Monetary values are converted from decimal strings or major units to 64-bit BigInt minor units (IDR scale = 0).",
latencyOrMetric: "<0.1ms In-Memory Compute"
},
{
step: "05. Prisma Transaction & Relational Graph Mutation",
detail:
"Prisma client executes atomic PostgreSQL transaction updating transaction records, recalculating account balances, and refreshing budget progress.",
latencyOrMetric: "14ms Atomic Commit"
},
{
step: "06. Recharts Visualization & Server Component Revalidation",
detail:
"Frontend receives updated balance payloads, triggers Next.js path revalidation, and renders updated Recharts cashflow graphs.",
latencyOrMetric: "Locked 60 FPS Paint"
}
],
evaluation:
"During comprehensive runtime profiling and stress verification across Docker containers and local node environments, Nabungin demonstrated flawless ledger precision with 0.00% arithmetic drift across 500+ seeded transactions and multi-account transfers via its 64-bit BigInt minor-unit engine. The Express 5 backend, powered by Prisma 7 and PostgreSQL 16, sustained median API response times of 14ms (p95 < 28ms) for complex multi-table aggregations including dashboard summaries, category donut distributions, and 6-month cashflow historical trends. Cross-origin authentication via Better Auth and Next.js 16 routing proxy middleware executed session validations in under 2ms with zero hydration errors or unauthorized access leaks. Furthermore, the Vitest test suite verified 23 passed unit and component tests in 1.19 seconds with 100% pass rates across monetary conversions, ratio calculations, and UI context bindings, while TypeScript compilation and ESLint linter checks completed with zero errors across both monorepo workspaces.",
outcomes: [
"Eliminated 100% of floating-point rounding errors across all account balances and transfer ledgers via BigInt minor units.",
"Delivered sub-15ms median API response times for full dashboard aggregations across 500+ transactions and multiple financial accounts.",
"Validated 23 unit and component tests across 2 test suites executed in 1.19s with 100% pass rates via Vitest.",
"Engineered robust cross-origin authentication with 30-day sliding cookie sessions and Next.js 16 routing proxy protection.",
"Built an automated recurring transaction scheduler supporting daily, weekly, monthly, and yearly cadences with batch execution.",
"Configured containerized PostgreSQL 16 Alpine and Adminer database infrastructure with automated health check readiness."
],
techStack: [
"Next.js 16",
"React 19",
"TypeScript 5",
"Express 5",
"PostgreSQL 16",
"Prisma 7",
"Better Auth",
"Tailwind CSS 4",
"Recharts 3",
"Base UI",
"Shadcn UI",
"Lucide React",
"React Hook Form",
"Zod 4",
"Vitest 5",
"Docker",
"Docker Compose",
"Concurrently",
"date-fns",
"ESLint 9",
"Prettier 3",
"Node.js 26"
],
accentColor: "cyan",
repoUrl: "https://github.com/weztcy/Nabungin---Personal-Finance-Tracker"
}
];
