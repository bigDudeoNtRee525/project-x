import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { loadTeamContext, requireTeamMember } from '../middleware/team';
import { prisma } from '../lib/prisma';
import { generateInviteToken, getInviteExpiration, sendInviteEmail } from '../lib/invite';
import { z } from 'zod';

const router = Router();

// Validation schemas
const emailInviteSchema = z.object({
  email: z.string().email(),
});

// Send email invitation (team owner only)
router.post('/email', authenticate, loadTeamContext, requireTeamMember, async (req, res) => {
  if (!req.user || !req.team?.teamId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only owners can invite
  if (!req.team.isOwner) {
    return res.status(403).json({ error: 'Only team owners can send invitations' });
  }

  try {
    const data = emailInviteSchema.parse(req.body);

    // Check if user already in team
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      include: { teamMembership: true },
    });

    if (existingUser?.teamMembership?.teamId === req.team.teamId) {
      return res.status(400).json({ error: 'This user is already a member of your team' });
    }

    if (existingUser?.teamMembership) {
      return res.status(400).json({ error: 'This user is already a member of another team' });
    }

    // Check for existing pending invite
    const existingInvite = await prisma.teamInvite.findFirst({
      where: {
        teamId: req.team.teamId,
        email: data.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return res.status(400).json({ error: 'An invitation has already been sent to this email' });
    }

    // Create invite
    const invite = await prisma.teamInvite.create({
      data: {
        teamId: req.team.teamId,
        type: 'email',
        email: data.email,
        token: generateInviteToken(),
        expiresAt: getInviteExpiration(7),
        createdBy: req.user.id,
      },
    });

    // Get team and inviter info for email
    const team = await prisma.team.findUnique({
      where: { id: req.team.teamId },
    });

    const inviter = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    // Send email (placeholder - integrate with real email service)
    await sendInviteEmail({
      email: data.email,
      teamName: team?.name || 'Team',
      inviterName: inviter?.name || inviter?.email || 'A team member',
      inviteToken: invite.token,
      baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    });

    res.status(201).json({
      invite: {
        id: invite.id,
        email: invite.email,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error sending invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate shareable invite link (team owner only)
router.post('/link', authenticate, loadTeamContext, requireTeamMember, async (req, res) => {
  if (!req.user || !req.team?.teamId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.team.isOwner) {
    return res.status(403).json({ error: 'Only team owners can generate invite links' });
  }

  try {
    const invite = await prisma.teamInvite.create({
      data: {
        teamId: req.team.teamId,
        type: 'link',
        email: null,
        token: generateInviteToken(),
        expiresAt: getInviteExpiration(7),
        createdBy: req.user.id,
      },
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/join/${invite.token}`;

    res.status(201).json({
      invite: {
        id: invite.id,
        token: invite.token,
        url: inviteUrl,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
    });
  } catch (error) {
    console.error('Error generating invite link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invite details by token (public - for join page)
router.get('/:token', optionalAuthenticate, async (req, res) => {
  const { token } = req.params;

  try {
    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: {
        team: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invite.usedAt) {
      return res.status(400).json({ error: 'This invitation has already been used' });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This invitation has expired' });
    }

    // Get inviter info
    const inviter = await prisma.user.findUnique({
      where: { id: invite.createdBy },
      select: { name: true, email: true },
    });

    res.json({
      invite: {
        id: invite.id,
        type: invite.type,
        team: invite.team,
        invitedBy: inviter?.name || inviter?.email || 'A team member',
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept invitation and join team
router.post('/:token/accept', authenticate, loadTeamContext, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user is already in a team
  if (req.team?.isMember) {
    return res.status(400).json({ error: 'You are already a member of a team. Leave your current team first.' });
  }

  const { token } = req.params;

  try {
    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invite.usedAt) {
      return res.status(400).json({ error: 'This invitation has already been used' });
    }

    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This invitation has expired' });
    }

    // For email invites, verify the email matches
    if (invite.type === 'email' && invite.email !== req.user.email) {
      return res.status(403).json({ error: 'This invitation was sent to a different email address' });
    }

    // Add user to team and mark invite as used
    await prisma.$transaction([
      prisma.teamMember.create({
        data: {
          teamId: invite.teamId,
          userId: req.user.id,
          role: 'member',
        },
      }),
      prisma.teamInvite.update({
        where: { id: invite.id },
        data: {
          usedAt: new Date(),
          usedById: req.user.id,
        },
      }),
    ]);

    // Fetch updated team
    const team = await prisma.team.findUnique({
      where: { id: invite.teamId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    res.json({
      success: true,
      team: {
        id: team!.id,
        name: team!.name,
        slug: team!.slug,
        createdAt: team!.createdAt,
        role: 'member',
        members: team!.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List pending invitations (team owner only)
router.get('/', authenticate, loadTeamContext, requireTeamMember, async (req, res) => {
  if (!req.user || !req.team?.teamId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.team.isOwner) {
    return res.status(403).json({ error: 'Only team owners can view invitations' });
  }

  try {
    const invites = await prisma.teamInvite.findMany({
      where: {
        teamId: req.team.teamId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      invites: invites.map((invite) => ({
        id: invite.id,
        type: invite.type,
        email: invite.email,
        token: invite.token,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error listing invites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke an invitation (team owner only)
router.delete('/:id', authenticate, loadTeamContext, requireTeamMember, async (req, res) => {
  if (!req.user || !req.team?.teamId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.team.isOwner) {
    return res.status(403).json({ error: 'Only team owners can revoke invitations' });
  }

  const { id } = req.params;

  try {
    const invite = await prisma.teamInvite.findUnique({
      where: { id },
    });

    if (!invite || invite.teamId !== req.team.teamId) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    await prisma.teamInvite.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error revoking invite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
