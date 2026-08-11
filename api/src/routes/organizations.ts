import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../lib/requireAuth.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const organizationsRouter = Router();

organizationsRouter.use(requireAuth);

organizationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = req.session.userId as string;

    const organizations = await prisma.organization.findMany({
      orderBy: { name: "asc" },
      include: {
        follows: { where: { userId }, select: { userId: true } },
      },
    });

    res.json(
      organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        logoUrl: org.logoUrl,
        isFollowed: org.follows.length > 0,
      })),
    );
  }),
);

organizationsRouter.post(
  "/:id/follow",
  asyncHandler(async (req, res) => {
    const userId = req.session.userId as string;
    const organizationId = req.params.id;

    const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found." });
    }

    await prisma.userOrganizationFollow.upsert({
      where: { userId_organizationId: { userId, organizationId } },
      update: {},
      create: { userId, organizationId },
    });

    res.status(204).send();
  }),
);

organizationsRouter.delete(
  "/:id/follow",
  asyncHandler(async (req, res) => {
    const userId = req.session.userId as string;
    const organizationId = req.params.id;

    await prisma.userOrganizationFollow.deleteMany({
      where: { userId, organizationId },
    });

    res.status(204).send();
  }),
);
