import rateLimit from "express-rate-limit";

// Mitigates credential stuffing / brute-force login attempts (SPEC.md §9).
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});
