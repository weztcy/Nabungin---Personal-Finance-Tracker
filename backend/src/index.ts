import "dotenv/config";

import cors from "cors";
import express from "express";

import { auth } from "@/auth";
import { corsOrigins, getServerEnv } from "@/env";
import { routes } from "@/routes";

const env = getServerEnv();
const app = express();

app.disable("x-powered-by");

// CORS: izinkan origin frontend + kirim/terima cookie (credentials).
app.use(
  cors({
    origin: corsOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// Health check (dipakai frontend & skrip untuk memastikan API siap).
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "nabungin-api" });
});

// Body parser. Dipasang SEBELUM handler auth agar req.body terisi; handler auth
// lalu menyusun ulang Request web dari body tersebut.
app.use(express.json({ limit: "1mb" }));

// Better Auth menangani seluruh endpoint auth di /api/auth/*.
app.all("/api/auth/*splat", async (req, res, next) => {
  try {
    const handler = auth.handler;
    const protocol = req.protocol;
    const host = req.get("host") ?? `localhost:${env.PORT}`;
    const url = new URL(req.originalUrl, `${protocol}://${host}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) headers.set(key, value.join(", "));
      else if (value !== undefined) headers.set(key, value);
    }
    const method = req.method.toUpperCase();
    const body = method === "GET" || method === "HEAD" ? undefined : JSON.stringify(req.body ?? {});
    const request = new Request(url, { method, headers, body });
    const response = await handler(request);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") return; // ditangani terpisah di bawah
      res.append(key, value);
    });
    // `Set-Cookie` bisa lebih dari satu → jangan digabung jadi satu baris.
    for (const cookie of response.headers.getSetCookie()) {
      res.append("set-cookie", cookie);
    }
    const payload = await response.arrayBuffer();
    if (payload.byteLength > 0) {
      res.setHeader("content-type", response.headers.get("content-type") ?? "application/json");
      res.send(Buffer.from(payload));
    } else {
      res.end();
    }
  } catch (error) {
    next(error);
  }
});

// Route API aplikasi (finance).
app.use("/api", routes);

// 404 & error handler.
app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ): void => {
    console.error("[api] unhandled error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada server" });
  },
);

app.listen(env.PORT, () => {
  console.log(`✅ Nabungin API siap di http://localhost:${env.PORT}`);
  console.log(`   CORS origin: ${corsOrigins().join(", ")}`);
});
