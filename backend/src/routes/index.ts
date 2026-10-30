import { Router } from "express";

import { accountsRouter } from "@/routes/accounts";
import { budgetsRouter } from "@/routes/budgets";
import { categoriesRouter } from "@/routes/categories";
import { dashboardRouter } from "@/routes/dashboard";
import { goalsRouter } from "@/routes/goals";
import { meRouter } from "@/routes/me";
import { recurrencesRouter } from "@/routes/recurrences";
import { reportsRouter } from "@/routes/reports";
import { transactionsRouter } from "@/routes/transactions";

/** Router utama untuk seluruh endpoint /api/* (selain /api/auth). */
export const routes = Router();

routes.use("/accounts", accountsRouter);
routes.use("/categories", categoriesRouter);
routes.use("/transactions", transactionsRouter);
routes.use("/budgets", budgetsRouter);
routes.use("/goals", goalsRouter);
routes.use("/recurrences", recurrencesRouter);
routes.use("/dashboard", dashboardRouter);
routes.use("/reports", reportsRouter);
routes.use("/me", meRouter);
