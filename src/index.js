import { env } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import express from "express";
import cors from "cors";
import { kvSession } from "./middleware/kvSession.js";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import dashboardRoutes from "./routes/dashboard.js";
import commentRoutes from "./routes/comments.js";

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
// Lightweight body parser — express.json()/urlencoded pull in body-parser →
// iconv-lite, which crashes on workerd. The API only needs JSON + form bodies.
app.use(async (req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD") {
    req.body = {};
    return next();
  }
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = chunks.map((c) => (typeof c === "string" ? c : new TextDecoder().decode(c))).join("");
    const type = req.headers["content-type"] || "";
    if (type.includes("application/json")) {
      req.body = raw ? JSON.parse(raw) : {};
    } else if (type.includes("application/x-www-form-urlencoded")) {
      req.body = Object.fromEntries(new URLSearchParams(raw));
    } else {
      req.body = {};
    }
  } catch {
    req.body = {};
  }
  next();
});
app.use(kvSession());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/posts/:postId/comments", commentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", platform: "cloudflare-workers" });
});

// Serve the landing page at "/" (html_handling: "none" disables automatic index resolution)
app.get("/", async (req, res) => {
  try {
    const asset = await env.ASSETS.fetch(new Request("https://assets.local/index.html"));
    res.status(asset.status);
    asset.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(Buffer.from(await asset.arrayBuffer()));
  } catch (err) {
    console.error("Asset fetch error:", err);
    res.status(500).send("Failed to load page");
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Catch-all: let static assets handle everything else
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start Express on a port and export the Workers handler
app.listen(3000);
export default httpServerHandler({ port: 3000 });
