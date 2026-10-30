import type { Request, Response, NextFunction } from "express";

import { auth } from "@/auth";

export type AuthedRequest = Request & {
  user: { id: string };
};

/**
 * Verifikasi session Better Auth dari header cookie request dan tempelkan
 * user ke `req.user`. Menolak dengan 401 bila belum login.
 */
export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await auth.api.getSession({ headers: req.headers as never });
    if (!session) {
      res.status(401).json({ error: "Tidak terautentikasi" });
      return;
    }
    (req as AuthedRequest).user = { id: session.user.id };
    next();
  } catch (error) {
    next(error);
  }
}
