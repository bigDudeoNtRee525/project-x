import crypto from 'crypto';

/**
 * Generate a secure random invite token.
 * Uses crypto.randomBytes for cryptographic security.
 */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a URL-friendly slug from a team name.
 * Converts to lowercase, replaces spaces with hyphens, removes special chars.
 */
export function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // Add a random suffix to ensure uniqueness
  const suffix = crypto.randomBytes(4).toString('hex');
  return `${baseSlug}-${suffix}`;
}

/**
 * Placeholder for sending invite emails.
 * In production, integrate with a real email service (SendGrid, Resend, etc.)
 */
export async function sendInviteEmail(params: {
  email: string;
  teamName: string;
  inviterName: string;
  inviteToken: string;
  baseUrl: string;
}): Promise<void> {
  const { email, teamName, inviterName, inviteToken, baseUrl } = params;
  const inviteUrl = `${baseUrl}/join/${inviteToken}`;

  // TODO: Integrate with email service
  console.log(`[EMAIL] Sending team invite to ${email}`);
  console.log(`[EMAIL] Team: ${teamName}, Invited by: ${inviterName}`);
  console.log(`[EMAIL] Join URL: ${inviteUrl}`);

  // In development, just log the email
  // In production, use something like:
  // await sendgrid.send({
  //   to: email,
  //   from: 'noreply@yourdomain.com',
  //   subject: `${inviterName} invited you to join ${teamName}`,
  //   html: `<p>Click <a href="${inviteUrl}">here</a> to join the team.</p>`
  // });
}

/**
 * Calculate invite expiration date (7 days from now by default)
 */
export function getInviteExpiration(days: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
