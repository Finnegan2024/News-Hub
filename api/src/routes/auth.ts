import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";

export const authRouter = Router();

function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

authRouter.post("/register", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!isValidEmail(email) || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({
      error: "Email must be valid and password must be at least 8 characters.",
    });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash },
  });

  req.session.userId = user.id;
  res.status(201).json({ id: user.id, email: user.email });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!isValidEmail(email) || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  req.session.userId = user.id;
  res.status(200).json({ id: user.id, email: user.email });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Could not log out." });
    }
    res.clearCookie("newshub.sid");
    res.status(204).send();
  });
});

authRouter.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  if (!user) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  res.status(200).json({ id: user.id, email: user.email });
});
