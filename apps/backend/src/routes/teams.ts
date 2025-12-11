import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { loadTeamContext, requireTeamOwner, requireTeamMember } from '../middleware/team';
import { prisma } from '../lib/prisma';
import { generateSlug } from '../lib/invite';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['owner', 'member']),
});

// Create a new team (user becomes owner)
router.post('/', authenticate, loadTeamContext, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user is already in a team
  if (req.team?.isMember) {
    return res.status(400).json({ error: 'You are already a member of a team. Leave your current team first.' });
  }

  try {
    const data = createTeamSchema.parse(req.body);

    const team = await prisma.team.create({
      data: {
        name: data.name,
        slug: generateSlug(data.name),
        members: {
          create: {
            userId: req.user.id,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.status(201).json({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        createdAt: team.createdAt,
        role: 'owner',
        members: team.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user's team with members
router.get('/current', authenticate, loadTeamContext, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.team?.teamId) {
    return res.json({ team: null });
  }

  try {
    const team = await prisma.team.findUnique({
      where: { id: req.team.teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!team) {
      return res.json({ team: null });
    }

    res.json({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        createdAt: team.createdAt,
        role: req.team.role,
        members: team.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update team details (owner only)
router.patch('/:id', authenticate, loadTeamContext, requireTeamOwner, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;

  // Ensure user can only update their own team
  if (req.team?.teamId !== id) {
    return res.status(403).json({ error: 'You can only update your own team' });
  }

  try {
    const data = updateTeamSchema.parse(req.body);

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.json({
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        createdAt: team.createdAt,
        role: 'owner',
        members: team.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete team (owner only)
router.delete('/:id', authenticate, loadTeamContext, requireTeamOwner, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;

  if (req.team?.teamId !== id) {
    return res.status(403).json({ error: 'You can only delete your own team' });
  }

  try {
    await prisma.team.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Leave team (members can leave, owner must transfer ownership first)
router.post('/:id/leave', authenticate, loadTeamContext, requireTeamMember, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;

  if (req.team?.teamId !== id) {
    return res.status(403).json({ error: 'You can only leave your own team' });
  }

  // Owner cannot leave without transferring ownership
  if (req.team?.isOwner) {
    const memberCount = await prisma.teamMember.count({
      where: { teamId: id },
    });

    if (memberCount > 1) {
      return res.status(400).json({
        error: 'As the team owner, you must transfer ownership to another member before leaving, or delete the team.',
      });
    }

    // If owner is the only member, delete the team instead
    await prisma.team.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'Team deleted as you were the only member' });
  }

  try {
    await prisma.teamMember.delete({
      where: { userId: req.user.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error leaving team:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update member role (owner only)
router.post('/:id/members/:userId/role', authenticate, loadTeamContext, requireTeamOwner, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, userId } = req.params;

  if (req.team?.teamId !== id) {
    return res.status(403).json({ error: 'You can only manage members of your own team' });
  }

  // Cannot change own role
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }

  try {
    const data = updateRoleSchema.parse(req.body);

    // Verify target user is in the team
    const member = await prisma.teamMember.findFirst({
      where: { teamId: id, userId },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found in team' });
    }

    // If making someone else owner, demote current owner to member
    if (data.role === 'owner') {
      await prisma.$transaction([
        prisma.teamMember.update({
          where: { userId: req.user.id },
          data: { role: 'member' },
        }),
        prisma.teamMember.update({
          where: { userId },
          data: { role: 'owner' },
        }),
      ]);
    } else {
      await prisma.teamMember.update({
        where: { userId },
        data: { role: data.role },
      });
    }

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove member from team (owner only)
router.delete('/:id/members/:userId', authenticate, loadTeamContext, requireTeamOwner, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, userId } = req.params;

  if (req.team?.teamId !== id) {
    return res.status(403).json({ error: 'You can only manage members of your own team' });
  }

  // Cannot remove yourself
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'You cannot remove yourself. Use the leave endpoint instead.' });
  }

  try {
    const member = await prisma.teamMember.findFirst({
      where: { teamId: id, userId },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found in team' });
    }

    await prisma.teamMember.delete({
      where: { userId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
