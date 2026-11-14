import http from "node:http";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const required = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "MAILTRAP_API_TOKEN", "MAIL_FROM", "ALLOWED_ORIGINS"];
for (const key of required) {
  if (!process.env[key]) {
    console.error("Missing required environment variable:", key);
    process.exit(1);
  }
}

const port = Number(process.env.PORT || 3000);
const allowedOrigins = new Set(process.env.ALLOWED_ORIGINS.split(",").map(value => value.trim()).filter(Boolean));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const smtpPort = Number(process.env.MAILTRAP_PORT || 587);
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || "live.smtp.mailtrap.io",
  port: smtpPort,
  secure: smtpPort === 465,
  requireTLS: smtpPort === 587,
  auth: {
    user: process.env.MAILTRAP_USER || "api",
    pass: process.env.MAILTRAP_API_TOKEN
  }
});

const sends = new Map();
function rateLimited(userId) {
  const now = Date.now();
  const entry = sends.get(userId);
  if (!entry || now - entry.startedAt > 15 * 60 * 1000) {
    sends.set(userId, { startedAt: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > 3;
}
function reply(res, status, payload, origin) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (origin && allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) return reply(res, 403, { error: "Origin not allowed." });
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin || "",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Vary": "Origin"
    });
    return res.end();
  }
  if (req.method === "GET" && req.url === "/health") return reply(res, 200, { ok: true }, origin);
  if (req.method !== "POST" || req.url !== "/api/email/test") return reply(res, 404, { error: "Not found." }, origin);

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return reply(res, 401, { error: "Sign in first." }, origin);

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return reply(res, 401, { error: "Your session is invalid or expired. Sign in again." }, origin);

    const user = data.user;
    if (!user.email || !(user.email_confirmed_at || user.confirmed_at)) {
      return reply(res, 403, { error: "Use a confirmed email account. Guest accounts cannot receive this test." }, origin);
    }
    if (rateLimited(user.id)) return reply(res, 429, { error: "Email test limit reached. Try again in 15 minutes." }, origin);

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: user.email,
      subject: "WALLZ by ECH0 — Mailtrap test",
      text: "Your WALLZ email connection is working. This test message was sent through Mailtrap SMTP.",
      html: "<main style=\"font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#172033\"><h1>WALLZ by ECH0</h1><p>Your Mailtrap SMTP connection is working.</p><p>This test message was sent through the WALLZ mail service.</p></main>"
    });

    return reply(res, 200, { ok: true }, origin);
  } catch (error) {
    console.error("Email send failed:", error?.message || error);
    return reply(res, 502, { error: "Mailtrap could not send the message. Check the server mail settings and Mailtrap logs." }, origin);
  }
});

server.listen(port, () => console.log("WALLZ mail API listening on", port));
