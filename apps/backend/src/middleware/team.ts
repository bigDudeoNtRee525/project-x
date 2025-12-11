import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// Extend Express Request type to include team context
declare global {
  namespace Express {
    interface Request {
      team?: {
        teamId: string | null;
        role: 'owner' | 'member' | null;
        isOwner: boolean;
        isMember: boolean;
      };
    }
  }
}

/**
 * Middleware to load the user's team context.
 * Must be used after authenticate middleware.
 * Attaches team information to req.team
 */
export async function loadTeamContext(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    req.team = {
      teamId: null,
      role: null,
      isOwner: false,
      isMember: false,
    };
    return next();
  }

  try {
    const membership = await prisma.teamMember.findUnique({
      where: { userId: req.user.id },
      include: { team: true },
    });

    req.team = {
      teamId: membership?.teamId || null,
      role: (membership?.role as 'owner' | 'member') || null,
      isOwner: membership?.role === 'owner',
      isMember: !!membership,
    };

    next();
  } catch (error) {
    console.error('Error loading team context:', error);
    req.team = {
      teamId: null,
      role: null,
      isOwner: false,
      isMember: false,
    };
    next();
  }
}

/**
 * Middleware to require team owner role.
 * Must be used after loadTeamContext middleware.
 */
export function requireTeamOwner(req: Request, res: Response, next: NextFunction): void {
  if (!req.team?.isOwner) {
    res.status(403).json({ error: 'Only team owners can perform this action' });
    return;
  }
  next();
}

/**
 * Middleware to require team membership.
 * Must be used after loadTeamContext middleware.
 */
export function requireTeamMember(req: Request, res: Response, next: NextFunction): void {
  if (!req.team?.isMember) {
    res.status(403).json({ error: 'You must be a team member to perform this action' });
    return;
  }
  next();
}

/**
 * Helper to build a Prisma where clause for personal + team data.
 * Returns data that is either:
 * - Personal (belongs to user, no team)
 * - Team-shared (belongs to user's team)
 */
export function buildPersonalAndTeamWhere(userId: string, teamId: string | null | undefined) {
  return {
    OR: [
      { userId, teamId: null },
      ...(teamId ? [{ teamId }] : []),
    ],
  };
}

/**
 * Helper to build a Prisma where clause for team-only data.
 */
export function buildTeamOnlyWhere(teamId: string | null | undefined) {
  if (!teamId) {
    return { teamId: null }; // Return empty set if no team
  }
  return { teamId };
}
