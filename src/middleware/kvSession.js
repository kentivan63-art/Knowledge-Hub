import { env } from "cloudflare:workers";
import crypto from "node:crypto";

const SESSION_TTL = 86400; // 24 hours in seconds
const COOKIE_NAME = "sessionId";
const IS_PROD = env.NODE_ENV === "production";

/**
 * Generate a random session ID.
 */
function generateSessionId() {
  return crypto.randomBytes(32).toString("hex");
}

function parseCookies(header) {
  const cookies = {};
  (header || "").split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx > -1) {
      cookies[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  });
  return cookies;
}

/**
 * KV-backed session middleware for Express.
 * Replaces express-session + connect-mongo.
 *
 * Usage: app.use(kvSession());
 */
export function kvSession() {
  return async (req, res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    let sessionId = cookies[COOKIE_NAME] || null;

    let session = null;
    if (sessionId) {
      session = await env.SESSIONS.get(`session:${sessionId}`, "json");
    }

    if (!session) {
      sessionId = generateSessionId();
      session = {};
    }

    req.session = session;
    req.sessionId = sessionId;

    req.session.save = async function () {
      await env.SESSIONS.put(`session:${sessionId}`, JSON.stringify(session), {
        expirationTtl: SESSION_TTL,
      });
    };

    req.session.destroy = async function () {
      if (sessionId) {
        await env.SESSIONS.delete(`session:${sessionId}`);
      }
      req.session = {};
      req.sessionId = null;
    };

    const originalEnd = res.end.bind(res);
    res.end = function (...args) {
      if (req.sessionId && Object.keys(req.session).length > 0) {
        env.SESSIONS.put(`session:${req.sessionId}`, JSON.stringify(req.session), {
          expirationTtl: SESSION_TTL,
        }).catch((err) => console.error("Session save error:", err));
        const secure = IS_PROD ? "; Secure" : "";
        res.setHeader(
          "Set-Cookie",
          `${COOKIE_NAME}=${req.sessionId}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL}${secure}`
        );
      }
      return originalEnd(...args);
    };

    next();
  };
}
