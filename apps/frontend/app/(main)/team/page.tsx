'use client';

import { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth';
import { useTeamStore } from '@/stores/team';
import {
  Users,
  Crown,
  UserPlus,
  Mail,
  Link as LinkIcon,
  Copy,
  Trash2,
  LogOut,
  Settings,
  RefreshCw,
  Check,
} from 'lucide-react';
import type { TeamMember, TeamRole } from '@meeting-task-tool/shared';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
});

const inviteEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type CreateTeamFormValues = z.infer<typeof createTeamSchema>;
type InviteEmailFormValues = z.infer<typeof inviteEmailSchema>;

export default function TeamPage() {
  const { user, team: authTeam, checkAuth } = useAuthStore();
  const {
    team,
    pendingInvites,
    isLoading,
    fetchTeam,
    createTeam,
    updateTeam,
    leaveTeam,
    deleteTeam,
    updateMemberRole,
    removeMember,
    sendEmailInvite,
    generateInviteLink,
    fetchPendingInvites,
    revokeInvite,
  } = useTeamStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createForm = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '' },
  });

  const inviteForm = useForm<InviteEmailFormValues>({
    resolver: zodResolver(inviteEmailSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    if (team?.role === 'owner') {
      fetchPendingInvites();
    }
  }, [team, fetchPendingInvites]);

  const handleCreateTeam = async (values: CreateTeamFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await createTeam(values.name);
      await checkAuth(); // Refresh auth to get updated team
      setShowCreateModal(false);
      createForm.reset();
    } catch (err: any) {
      setError(err?.error || 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvite = async (values: InviteEmailFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await sendEmailInvite(values.email);
      inviteForm.reset();
      setError(null);
    } catch (err: any) {
      setError(err?.error || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateLink = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const url = await generateInviteLink();
      setInviteLink(url);
    } catch (err: any) {
      setError(err?.error || 'Failed to generate link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeaveTeam = async () => {
    setIsSubmitting(true);
    try {
      await leaveTeam();
      await checkAuth();
      setShowLeaveDialog(false);
    } catch (err: any) {
      setError(err?.error || 'Failed to leave team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    setIsSubmitting(true);
    try {
      await deleteTeam();
      await checkAuth();
      setShowDeleteDialog(false);
    } catch (err: any) {
      setError(err?.error || 'Failed to delete team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    setIsSubmitting(true);
    try {
      await removeMember(removingMember.id);
      setRemovingMember(null);
    } catch (err: any) {
      setError(err?.error || 'Failed to remove member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    try {
      await updateMemberRole(memberId, newRole);
      await checkAuth(); // Refresh to get updated role
    } catch (err: any) {
      setError(err?.error || 'Failed to update role');
    }
  };

  // No team - show create/join options
  if (!team && !authTeam) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Team</h1>

        <Card>
          <CardHeader>
            <CardTitle>Get Started with Teams</CardTitle>
            <CardDescription>
              Create a team to collaborate with others, or join an existing team with an invite link.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setShowCreateModal(true)} className="w-full">
              <Users className="w-4 h-4 mr-2" />
              Create a Team
            </Button>
            <p className="text-center text-muted-foreground text-sm">
              Have an invite link? Click it to join a team.
            </p>
          </CardContent>
        </Card>

        {/* Create Team Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Team</DialogTitle>
              <DialogDescription>
                Create a team to start collaborating with others.
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateTeam)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Awesome Team" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Team'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const currentTeam = team || authTeam;
  const isOwner = currentTeam?.role === 'owner';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{currentTeam?.name}</h1>
          <p className="text-muted-foreground">
            {isOwner ? 'You are the owner of this team' : 'You are a member of this team'}
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchTeam()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Members Card */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                {currentTeam?.members?.length || 0} member(s) in this team
              </CardDescription>
            </div>
            {isOwner && (
              <Button onClick={() => setShowInviteModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentTeam?.members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {member.role === 'owner' ? (
                        <Crown className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <Users className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{member.name || 'Unnamed'}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner && member.id !== user?.id ? (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleRoleChange(member.id, value as TeamRole)}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRemovingMember(member)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground capitalize px-3 py-1 bg-muted rounded">
                        {member.role}
                        {member.id === user?.id && ' (you)'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invites (Owner only) */}
        {isOwner && pendingInvites.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations that haven't been accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {invite.type === 'email' ? (
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <LinkIcon className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span>
                        {invite.type === 'email' ? invite.email : 'Invite Link'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => revokeInvite(invite.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Team Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isOwner && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowLeaveDialog(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Team
              </Button>
            )}
            {isOwner && (
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Team
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
            <DialogDescription>
              Send an invitation by email or generate a shareable link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Email Invite */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Invitation
              </h4>
              <Form {...inviteForm}>
                <form onSubmit={inviteForm.handleSubmit(handleSendInvite)} className="flex gap-2">
                  <FormField
                    control={inviteForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="colleague@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSubmitting}>
                    Send
                  </Button>
                </form>
              </Form>
            </div>

            {/* Link Invite */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Shareable Link
              </h4>
              {inviteLink ? (
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={handleCopyLink}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleGenerateLink}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  Generate Invite Link
                </Button>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogContent>
      </Dialog>

      {/* Leave Team Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this team? You'll need a new invitation to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveTeam} disabled={isSubmitting}>
              {isSubmitting ? 'Leaving...' : 'Leave Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Team Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All team data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Dialog */}
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removingMember?.name || removingMember?.email} from the team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} disabled={isSubmitting}>
              {isSubmitting ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
