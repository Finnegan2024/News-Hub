import session from "express-session";
import pgSession from "connect-pg-simple";
import pg from "pg";

const PgStore = pgSession(session);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// An idle pooled connection erroring (e.g. the DB restarting) emits 'error'
// on the pool; without a listener, Node treats it as uncaught and crashes
// the whole process. Log and let the pool reconnect on the next query.
pool.on("error", (err) => {
  console.error("Postgres pool idle client error:", err.message);
});

const isProduction = process.env.NODE_ENV === "production";

export const sessionMiddleware = session({
  store: new PgStore({ pool, tableName: "session" }),
  secret: process.env.SESSION_SECRET as string,
  name: "newshub.sid",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    // The deployed frontend and API live on different onrender.com
    // subdomains, which browsers treat as cross-site — SameSite=Lax cookies
    // aren't attached to cross-site fetch()/XHR calls (only top-level
    // navigations), so every authenticated request after login would
    // silently drop the cookie and 401. SameSite=None (requires Secure,
    // already true in production) fixes this. Lax is kept for local dev,
    // where frontend/API share "localhost" as their site.
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
