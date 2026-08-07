import session from "express-session";
import pgSession from "connect-pg-simple";
import pg from "pg";

const PgStore = pgSession(session);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
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
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
