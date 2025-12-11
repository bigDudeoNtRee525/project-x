import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { teamsApi, invitesApi } from '@/lib/api';
import type { TeamWithMembers, TeamInvite, TeamRole } from '@meeting-task-tool/shared';

export type ViewMode = 'personal' | 'team' | 'all';

interface TeamState {
  team: TeamWithMembers | null;
  viewMode: ViewMode;
  isLoading: boolean;
  pendingInvites: TeamInvite[];

  // Actions
  setTeam: (team: TeamWithMembers | null) => void;
  setViewMode: (mode: ViewMode) => void;
  fetchTeam: () => Promise<void>;
  createTeam: (name: string) => Promise<TeamWithMembers>;
  updateTeam: (name: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
  deleteTeam: () => Promise<void>;

  // Member management
  updateMemberRole: (userId: string, role: TeamRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;

  // Invitations
  sendEmailInvite: (email: string) => Promise<void>;
  generateInviteLink: () => Promise<string>;
  fetchPendingInvites: () => Promise<void>;
  revokeInvite: (inviteId: string) => Promise<void>;

  // Utility
  clearTeam: () => void;
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      team: null,
      viewMode: 'all',
      isLoading: false,
      pendingInvites: [],

      setTeam: (team) => set({ team }),

      setViewMode: (viewMode) => set({ viewMode }),

      fetchTeam: async () => {
        set({ isLoading: true });
        try {
          const response = await teamsApi.getCurrent();
          set({ team: (response as any).team || null });
        } catch (error) {
          console.error('Failed to fetch team:', error);
          set({ team: null });
        } finally {
          set({ isLoading: false });
        }
      },

      createTeam: async (name: string) => {
        set({ isLoading: true });
        try {
          const response = await teamsApi.create({ name });
          const team = (response as any).team;
          set({ team });
          return team;
        } finally {
          set({ isLoading: false });
        }
      },

      updateTeam: async (name: string) => {
        const { team } = get();
        if (!team) throw new Error('No team to update');

        set({ isLoading: true });
        try {
          const response = await teamsApi.update(team.id, { name });
          set({ team: (response as any).team });
        } finally {
          set({ isLoading: false });
        }
      },

      leaveTeam: async () => {
        const { team } = get();
        if (!team) throw new Error('No team to leave');

        set({ isLoading: true });
        try {
          await teamsApi.leave(team.id);
          set({ team: null, viewMode: 'personal', pendingInvites: [] });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteTeam: async () => {
        const { team } = get();
        if (!team) throw new Error('No team to delete');

        set({ isLoading: true });
        try {
          await teamsApi.delete(team.id);
          set({ team: null, viewMode: 'personal', pendingInvites: [] });
        } finally {
          set({ isLoading: false });
        }
      },

      updateMemberRole: async (userId: string, role: TeamRole) => {
        const { team } = get();
        if (!team) throw new Error('No team');

        await teamsApi.updateMemberRole(team.id, userId, role);
        // Refetch team to get updated members
        await get().fetchTeam();
      },

      removeMember: async (userId: string) => {
        const { team } = get();
        if (!team) throw new Error('No team');

        await teamsApi.removeMember(team.id, userId);
        // Refetch team to get updated members
        await get().fetchTeam();
      },

      sendEmailInvite: async (email: string) => {
        const response = await invitesApi.sendEmail(email);
        // Refresh pending invites
        await get().fetchPendingInvites();
      },

      generateInviteLink: async () => {
        const response = await invitesApi.generateLink();
        await get().fetchPendingInvites();
        return (response as any).invite.url;
      },

      fetchPendingInvites: async () => {
        try {
          const response = await invitesApi.list();
          set({ pendingInvites: (response as any).invites || [] });
        } catch (error) {
          console.error('Failed to fetch pending invites:', error);
        }
      },

      revokeInvite: async (inviteId: string) => {
        await invitesApi.revoke(inviteId);
        // Refresh pending invites
        await get().fetchPendingInvites();
      },

      clearTeam: () => set({
        team: null,
        viewMode: 'all',
        pendingInvites: [],
      }),
    }),
    {
      name: 'team-storage',
      partialize: (state) => ({
        team: state.team,
        viewMode: state.viewMode,
      }),
    }
  )
);
