// Mock Data for demonstration and testing
// Toggle USE_MOCK_DATA in api.ts to switch between mock and real data

import type {
    Meeting,
    MeetingWithCount,
    TaskWithRelations
} from '@meeting-task-tool/shared';

export interface Contact {
    id: string;
    userId: string;
    name: string;
    email?: string;
    role?: string;
    avatar?: string;
    contactType: 'internal' | 'external';
    createdAt: Date;
    updatedAt: Date;
}

// =============================================================================
// CONTACTS
// =============================================================================

export const mockContacts: Contact[] = [
    {
        id: 'contact-1',
        userId: 'mock-user',
        name: 'Sarah Chen',
        email: 'sarah.chen@company.com',
        role: 'HR Manager',
        contactType: 'internal',
        createdAt: new Date('2024-06-01'),
        updatedAt: new Date('2024-06-01'),
    },
    {
        id: 'contact-2',
        userId: 'mock-user',
        name: 'Marcus Johnson',
        email: 'marcus.j@company.com',
        role: 'Engineering Lead',
        contactType: 'internal',
        createdAt: new Date('2024-06-02'),
        updatedAt: new Date('2024-06-02'),
    },
    {
        id: 'contact-3',
        userId: 'mock-user',
        name: 'Emily Rodriguez',
        email: 'emily.r@company.com',
        role: 'UX Designer',
        contactType: 'internal',
        createdAt: new Date('2024-06-03'),
        updatedAt: new Date('2024-06-03'),
    },
    {
        id: 'contact-4',
        userId: 'mock-user',
        name: 'David Kim',
        email: 'david.kim@company.com',
        role: 'Backend Developer',
        contactType: 'internal',
        createdAt: new Date('2024-06-04'),
        updatedAt: new Date('2024-06-04'),
    },
    {
        id: 'contact-5',
        userId: 'mock-user',
        name: 'Lisa Thompson',
        email: 'lisa.t@company.com',
        role: 'QA Engineer',
        contactType: 'internal',
        createdAt: new Date('2024-06-05'),
        updatedAt: new Date('2024-06-05'),
    },
    {
        id: 'contact-6',
        userId: 'mock-user',
        name: 'Alex Rivera',
        email: 'alex.r@company.com',
        role: 'Frontend Developer',
        contactType: 'internal',
        createdAt: new Date('2024-06-06'),
        updatedAt: new Date('2024-06-06'),
    },
    {
        id: 'contact-7',
        userId: 'mock-user',
        name: 'Nina Patel',
        email: 'nina.p@company.com',
        role: 'Marketing Specialist',
        contactType: 'internal',
        createdAt: new Date('2024-06-07'),
        updatedAt: new Date('2024-06-07'),
    },
    {
        id: 'contact-8',
        userId: 'mock-user',
        name: 'James Wilson',
        email: 'james.w@company.com',
        role: 'DevOps Engineer',
        contactType: 'internal',
        createdAt: new Date('2024-06-08'),
        updatedAt: new Date('2024-06-08'),
    },
];

// =============================================================================
// MEETINGS
// =============================================================================

export const mockMeetings: MeetingWithCount[] = [
    {
        id: 'meeting-1',
        userId: 'mock-user',
        title: 'Q4 Product Planning Session',
        transcript: `Meeting started at 10:00 AM

Sarah: Good morning everyone. Let's discuss our Q4 priorities.

Marcus: We need to focus on the API performance issues first. Users are complaining about slow load times.

Emily: I've been working on the new dashboard redesign. Should have mockups ready by Friday.

Sarah: Great. David, can you look into the database optimization this week?

David: Sure, I'll prioritize that. I think we can improve query performance by 40%.

Lisa: I'll set up the performance testing suite once David's changes are in.

Action items:
- David to optimize database queries by Dec 10
- Emily to deliver dashboard mockups by Friday
- Lisa to prepare performance testing by Dec 15
- Marcus to review API architecture next week

Meeting ended at 11:30 AM`,
        processed: true,
        processedAt: new Date('2024-12-01T12:00:00'),
        metadata: { duration: 5400, participants: 5 },
        createdAt: new Date('2024-12-01T10:00:00'),
        _count: { tasks: 4 },
    },
    {
        id: 'meeting-2',
        userId: 'mock-user',
        title: 'Sprint Retrospective - Week 48',
        transcript: `Sprint Retrospective

What went well:
- Deployed new authentication system
- Reduced bug count by 30%
- Team collaboration improved

What could be improved:
- Need better documentation
- Code review process is slow

Action items:
- Alex to create documentation templates
- James to set up automated code review checks
- Nina to analyze sprint velocity metrics

Next steps discussed for the upcoming sprint.`,
        processed: true,
        processedAt: new Date('2024-12-02T15:00:00'),
        metadata: { duration: 3600, participants: 8 },
        createdAt: new Date('2024-12-02T14:00:00'),
        _count: { tasks: 3 },
    },
    {
        id: 'meeting-3',
        userId: 'mock-user',
        title: 'Client Feedback Review',
        transcript: `Client meeting notes:

Client expressed satisfaction with recent updates.
Requested features:
1. Export functionality for reports
2. Dark mode support
3. Mobile app consideration

Sarah will follow up with timeline estimates.
Emily to create initial mockups for dark mode.
Marcus to evaluate mobile app feasibility.`,
        processed: true,
        processedAt: new Date('2024-12-03T11:00:00'),
        metadata: { duration: 2700, participants: 4 },
        createdAt: new Date('2024-12-03T10:00:00'),
        _count: { tasks: 3 },
    },
    {
        id: 'meeting-4',
        userId: 'mock-user',
        title: 'Technical Architecture Discussion',
        transcript: `Architecture review meeting:

Discussed microservices migration strategy.
David presented the new service boundaries.
James outlined the deployment pipeline changes.

Key decisions:
- Start with authentication service extraction
- Use Kubernetes for orchestration
- Implement feature flags for gradual rollout

Tasks assigned:
- David to create service architecture diagram
- James to POC Kubernetes setup
- Lisa to define testing strategy for microservices`,
        processed: true,
        processedAt: new Date('2024-12-04T16:00:00'),
        metadata: { duration: 4500, participants: 6 },
        createdAt: new Date('2024-12-04T14:00:00'),
        _count: { tasks: 3 },
    },
    {
        id: 'meeting-5',
        userId: 'mock-user',
        title: 'Weekly Team Standup',
        transcript: `Standup notes - Dec 5

Sarah: Working on roadmap for Q1, need input from engineering by EOW
Marcus: API optimization in progress, 50% complete
Emily: Design system updates almost done
David: Database migration scripts ready for review
Lisa: Test automation coverage increased to 78%
Alex: New component library published
Nina: Dashboard analytics ready for demo
James: CI/CD pipeline improvements deployed

No blockers reported. Team aligned on priorities.`,
        processed: true,
        processedAt: new Date('2024-12-05T09:30:00'),
        metadata: { duration: 1800, participants: 8 },
        createdAt: new Date('2024-12-05T09:00:00'),
        _count: { tasks: 5 },
    },
    {
        id: 'meeting-6',
        userId: 'mock-user',
        title: 'Budget Planning 2025',
        transcript: `Budget discussion for next fiscal year. Pending AI processing to extract action items.`,
        processed: false,
        processedAt: null,
        metadata: { duration: 3600, participants: 3 },
        createdAt: new Date('2024-12-05T13:00:00'),
        _count: { tasks: 0 },
    },
];

// =============================================================================
// TASKS
// =============================================================================

// Task comment type
export interface TaskComment {
    id: string;
    text: string;
    author: string;
    createdAt: Date;
}

export const mockTasks: (TaskWithRelations & { quarterlyObjectiveId?: string; comments?: TaskComment[] })[] = [
    // Tasks from Meeting 1: Q4 Product Planning
    {
        id: 'task-1',
        meetingId: 'meeting-1',
        userId: 'mock-user',
        description: 'Optimize database queries for improved performance',
        assigneeId: 'contact-4',
        assigneeName: 'David Kim',
        deadline: new Date('2024-12-10'),
        status: 'in_progress',
        priority: 'high',
        aiExtracted: true,
        reviewed: true,
        quarterlyObjectiveId: 'q4-1', // Linked to: Hit 10,000 user milestone
        reviewedAt: new Date('2024-12-01T13:00:00'),
        createdAt: new Date('2024-12-01T12:00:00'),
        updatedAt: new Date('2024-12-03T10:00:00'),
        meeting: { id: 'meeting-1', title: 'Q4 Product Planning Session', createdAt: new Date('2024-12-01T10:00:00') },
        assignee: { id: 'contact-4', name: 'David Kim', email: 'david.kim@company.com' },
        comments: [
            { id: 'c1', text: 'Started profiling slow queries. Found 3 N+1 problems.', author: 'David Kim', createdAt: new Date('2024-12-02T10:30:00') },
            { id: 'c2', text: 'Optimized the main dashboard query - 60% faster now!', author: 'David Kim', createdAt: new Date('2024-12-03T15:20:00') },
        ],
    },
    {
        id: 'task-2',
        meetingId: 'meeting-1',
        userId: 'mock-user',
        description: 'Deliver dashboard redesign mockups',
        assigneeId: 'contact-3',
        assigneeName: 'Emily Rodriguez',
        deadline: new Date('2024-12-06'),
        status: 'completed',
        priority: 'high',
        aiExtracted: true,
        reviewed: true,
        quarterlyObjectiveId: 'q4-1', // Linked to: Hit 10,000 user milestone
        reviewedAt: new Date('2024-12-01T13:00:00'),
        createdAt: new Date('2024-12-01T12:00:00'),
        updatedAt: new Date('2024-12-05T14:00:00'),
        meeting: { id: 'meeting-1', title: 'Q4 Product Planning Session', createdAt: new Date('2024-12-01T10:00:00') },
        assignee: { id: 'contact-3', name: 'Emily Rodriguez', email: 'emily.r@company.com' },
    },
    {
        id: 'task-3',
        meetingId: 'meeting-1',
        userId: 'mock-user',
        description: 'Set up performance testing suite',
        assigneeId: 'contact-5',
        assigneeName: 'Lisa Thompson',
        deadline: new Date('2024-12-15'),
        status: 'pending',
        priority: 'medium',
        aiExtracted: true,
        reviewed: true,
        quarterlyObjectiveId: 'q4-1', // Linked to: Hit 10,000 user milestone
        reviewedAt: new Date('2024-12-01T13:00:00'),
        createdAt: new Date('2024-12-01T12:00:00'),
        updatedAt: new Date('2024-12-01T12:00:00'),
        meeting: { id: 'meeting-1', title: 'Q4 Product Planning Session', createdAt: new Date('2024-12-01T10:00:00') },
        assignee: { id: 'contact-5', name: 'Lisa Thompson', email: 'lisa.t@company.com' },
    },
    {
        id: 'task-4',
        meetingId: 'meeting-1',
        userId: 'mock-user',
        description: 'Review API architecture and propose improvements',
        assigneeId: 'contact-2',
        assigneeName: 'Marcus Johnson',
        deadline: new Date('2024-12-12'),
        status: 'pending',
        priority: 'high',
        aiExtracted: true,
        reviewed: false,
        reviewedAt: null,
        createdAt: new Date('2024-12-01T12:00:00'),
        updatedAt: new Date('2024-12-01T12:00:00'),
        meeting: { id: 'meeting-1', title: 'Q4 Product Planning Session', createdAt: new Date('2024-12-01T10:00:00') },
        assignee: { id: 'contact-2', name: 'Marcus Johnson', email: 'marcus.j@company.com' },
    },

    // Tasks from Meeting 2: Sprint Retrospective
    {
        id: 'task-5',
        meetingId: 'meeting-2',
        userId: 'mock-user',
        description: 'Create documentation templates for the team',
        assigneeId: 'contact-6',
        assigneeName: 'Alex Rivera',
        deadline: new Date('2024-12-09'),
        status: 'in_progress',
        priority: 'medium',
        aiExtracted: true,
        reviewed: true,
        reviewedAt: new Date('2024-12-02T16:00:00'),
        createdAt: new Date('2024-12-02T15:00:00'),
        updatedAt: new Date('2024-12-04T09:00:00'),
        meeting: { id: 'meeting-2', title: 'Sprint Retrospective - Week 48', createdAt: new Date('2024-12-02T14:00:00') },
        assignee: { id: 'contact-6', name: 'Alex Rivera', email: 'alex.r@company.com' },
    },
    {
        id: 'task-6',
        meetingId: 'meeting-2',
        userId: 'mock-user',
        description: 'Set up automated code review checks',
        assigneeId: 'contact-8',
        assigneeName: 'James Wilson',
        deadline: new Date('2024-12-11'),
        status: 'pending',
        priority: 'medium',
        aiExtracted: true,
        reviewed: true,
        reviewedAt: new Date('2024-12-02T16:00:00'),
        createdAt: new Date('2024-12-02T15:00:00'),
        updatedAt: new Date('2024-12-02T15:00:00'),
        meeting: { id: 'meeting-2', title: 'Sprint Retrospective - Week 48', createdAt: new Date('2024-12-02T14:00:00') },
        assignee: { id: 'contact-8', name: 'James Wilson', email: 'james.w@company.com' },
    },
    {
        id: 'task-7',
        meetingId: 'meeting-2',
        userId: 'mock-user',
        description: 'Analyze sprint velocity metrics and create report',
        assigneeId: 'contact-7',
        assigneeName: 'Nina Patel',
        deadline: new Date('2024-12-08'),
        status: 'completed',
        priority: 'low',
        aiExtracted: true,
        reviewed: true,
        reviewedAt: new Date('2024-12-02T16:00:00'),
        createdAt: new Date('2024-12-02T15:00:00'),
        updatedAt: new Date('2024-12-07T11:00:00'),
        meeting: { id: 'meeting-2', title: 'Sprint Retrospective - Week 48', createdAt: new Date('2024-12-02T14:00:00') },
        assignee: { id: 'contact-7', name: 'Nina Patel', email: 'nina.p@company.com' },
    },

    // Tasks from Meeting 3: Client Feedback
    {
        id: 'task-8',
        meetingId: 'meeting-3',
        userId: 'mock-user',
        description: 'Create timeline estimates for export functionality',
        assigneeId: 'contact-1',
        assigneeName: 'Sarah Chen',
        deadline: new Date('2024-12-10'),
        status: 'in_progress',
        priority: 'high',
        aiExtracted: true,
        reviewed: true,
        reviewedAt: new Date('2024-12-03T12:00:00'),
        createdAt: new Date('2024-12-03T11:00:00'),
        updatedAt: new Date('2024-12-05T10:00:00'),
        meeting: { id: 'meeting-3', title: 'Client Feedback Review', createdAt: new Date('2024-12-03T10:00:00') },
        assignee: { id: 'contact-1', name: 'Sarah Chen', email: 'sarah.chen@company.com' },
    },
    {
        id: 'task-9',
        meetingId: 'meeting-3',
        userId: 'mock-user',
        description: 'Design initial mockups for dark mode theme',
        assigneeId: 'contact-3',
        assigneeName: 'Emily Rodriguez',
        deadline: new Date('2024-12-13'),
        status: 'pending',
        priority: 'medium',
        aiExtracted: true,
        reviewed: false,
        reviewedAt: null,
        createdAt: new Date('2024-12-03T11:00:00'),
        updatedAt: new Date('2024-12-03T11:00:00'),
        meeting: { id: 'meeting-3', title: 'Client Feedback Review', createdAt: new Date('2024-12-03T10:00:00') },
        assignee: { id: 'contact-3', name: 'Emily Rodriguez', email: 'emily.r@company.com' },
    },
    {
        id: 'task-10',
        meetingId: 'meeting-3',
        userId: 'mock-user',
        description: 'Evaluate mobile app feasibility and create proposal',
        assigneeId: 'contact-2',
        assigneeName: 'Marcus Johnson',
        deadline: new Date('2024-12-20'),
        status: 'pending',
        priority: 'low',
        aiExtracted: true,
        reviewed: false,
        reviewedAt: null,
        createdAt: new Date('2024-12-03T11:00:00'),
        updatedAt: new Date('2024-12-03T11:00:00'),
        meeting: { id: 'meeting-3', title: 'Client Feedback Review', createdAt: new Date('2024-12-03T10:00:00') },
        assignee: { id: 'contact-2', name: 'Marcus Johnson', email: 'marcus.j@company.com' },
    },

    // Tasks from Meeting 4: Technical Architecture
    {
        id: 'task-11',
        meetingId: 'meeting-4',
        userId: 'mock-user',
        description: 'Create microservices architecture diagram',
        assigneeId: 'contact-4',
        assigneeName: 'David Kim',
        deadline: new Date('2024-12-11'),
        status: 'in_progress',
        priority: 'high',
        aiExtracted: true,
        reviewed: true,
        quarterlyObjectiveId: 'q4-2', // Linked to: Reach 20 enterprise customers
        reviewedAt: new Date('2024-12-04T17:00:00'),
        createdAt: new Date('2024-12-04T16:00:00'),
        updatedAt: new Date('2024-12-05T09:00:00'),
        meeting: { id: 'meeting-4', title: 'Technical Architecture Discussion', createdAt: new Date('2024-12-04T14:00:00') },
        assignee: { id: 'contact-4', name: 'David Kim', email: 'david.kim@company.com' },
    },
    {
        id: 'task-12',
        meetingId: 'meeting-4',
        userId: 'mock-user',
        description: 'POC Kubernetes cluster setup for microservices',
        assigneeId: 'contact-8',
        assigneeName: 'James Wilson',
        deadline: new Date('2024-12-18'),
        status: 'pending',
        priority: 'high',
        aiExtracted: true,
        reviewed: true,
        quarterlyObjectiveId: 'q4-2', // Linked to: Reach 20 enterprise customers
        reviewedAt: new Date('2024-12-04T17:00:00'),
        createdAt: new Date('2024-12-04T16:00:00'),
        updatedAt: new Date('2024-12-04T16:00:00'),
        meeting: { id: 'meeting-4', title: 'Technical Architecture Discussion', createdAt: new Date('2024-12-04T14:00:00') },
        assignee: { id: 'contact-8', name: 'James Wilson', email: 'james.w@company.com' },
    },
    {
        id: 'task-13',
        meetingId: 'meeting-4',
        userId: 'mock-user',
        description: 'Define testing strategy for microservices architecture',
        assigneeId: 'contact-5',
        assigneeName: 'Lisa Thompson',
        deadline: new Date('2024-12-16'),
        status: 'pending',
        priority: 'medium',
        aiExtracted: true,
        reviewed: true,
        reviewedAt: new Date('2024-12-04T17:00:00'),
        createdAt: new Date('2024-12-04T16:00:00'),
        updatedAt: new Date('2024-12-04T16:00:00'),
        meeting: { id: 'meeting-4', title: 'Technical Architecture Discussion', createdAt: new Date('2024-12-04T14:00:00') },
        assignee: { id: 'contact-5', name: 'Lisa Thompson', email: 'lisa.t@company.com' },
    },

    // Tasks from Meeting 5: Weekly Standup
    {
        id: 'task-14',
        meetingId: 'meeting-5',
        userId: 'mock-user',
        description: 'Provide engineering input for Q1 roadmap',
        assigneeId: 'contact-2',
        assigneeName: 'Marcus Johnson',
        deadline: new Date('2024-12-06'),
        status: 'pending',
        priority: 'urgent',
        aiExtracted: true,
        reviewed: false,
        reviewedAt: null,
        createdAt: new Date('2024-12-05T09:30:00'),
        updatedAt: new Date('2024-12-05T09:30:00'),
        meeting: { id: 'meeting-5', title: 'Weekly Team Standup', createdAt: new Date('2024-12-05T09:00:00') },
        assignee: { id: 'contact-2', name: 'Marcus Johnson', email: 'marcus.j@company.com' },
    },
    {
        id: 'task-15',
        meetingId: 'meeting-5',
        userId: 'mock-user',
        description: 'Complete API optimization work',
        assigneeId: 'contact-2',
        assigneeName: 'Marcus Johnson',
        deadline: new Date('2024-12-08'),
        status: 'in_progress',
        priority: 'high',
        aiExtracted: true,
        reviewed: false,
        reviewedAt: null,
        createdAt: new Date('2024-12-05T09:30:00'),
        updatedAt: new Date('2024-12-05T09:30:00'),
        meeting: { id: 'meeting-5', title: 'Weekly Team Standup', createdAt: new Date('2024-12-05T09:00:00') },
        assignee: { id: 'contact-2', name: 'Marcus Johnson', email: 'marcus.j@company.com' },
    },
    {
        id: 'task-16',
        meetingId: 'meeting-5',
        userId: 'mock-user',
        description: 'Review database migration scripts',
        assigneeId: null,
        assigneeName: null,
        deadline: new Date('2024-12-07'),
        status: 'pending',
        priority: 'high',
        aiExtracted: true,
        reviewed: false,
        reviewedAt: null,
        createdAt: new Date('2024-12-05T09:30:00'),
        updatedAt: new Date('2024-12-05T09:30:00'),
        meeting: { id: 'meeting-5', title: 'Weekly Team Standup', createdAt: new Date('2024-12-05T09:00:00') },
        assignee: null,
    },
    {
        id: 'task-17',
        meetingId: 'meeting-5',
        userId: 'mock-user',
        description: 'Demo dashboard analytics to stakeholders',
        assigneeId: 'contact-7',
        assigneeName: 'Nina Patel',
        deadline: new Date('2024-12-09'),
        status: 'pending',
        priority: 'medium',
        aiExtracted: true,
        reviewed: false,
        reviewedAt: null,
        createdAt: new Date('2024-12-05T09:30:00'),
        updatedAt: new Date('2024-12-05T09:30:00'),
        meeting: { id: 'meeting-5', title: 'Weekly Team Standup', createdAt: new Date('2024-12-05T09:00:00') },
        assignee: { id: 'contact-7', name: 'Nina Patel', email: 'nina.p@company.com' },
    },
    {
        id: 'task-18',
        meetingId: 'meeting-5',
        userId: 'mock-user',
        description: 'Finalize design system updates',
        assigneeId: 'contact-3',
        assigneeName: 'Emily Rodriguez',
        deadline: new Date('2024-12-06'),
        status: 'in_progress',
        priority: 'medium',
        aiExtracted: true,
        reviewed: false,
        reviewedAt: null,
        createdAt: new Date('2024-12-05T09:30:00'),
        updatedAt: new Date('2024-12-05T09:30:00'),
        meeting: { id: 'meeting-5', title: 'Weekly Team Standup', createdAt: new Date('2024-12-05T09:00:00') },
        assignee: { id: 'contact-3', name: 'Emily Rodriguez', email: 'emily.r@company.com' },
    },
];

// =============================================================================
// YEARLY & QUARTERLY OBJECTIVES
// =============================================================================

export interface KeyResult {
    id: string;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
}

export interface QuarterlyObjective {
    id: string;
    yearlyObjectiveId: string;
    title: string;
    description: string;
    quarter: 1 | 2 | 3 | 4;
    progress: number;
    status: 'not-started' | 'in-progress' | 'completed' | 'at-risk';
    keyResults: KeyResult[];
}

export interface YearlyObjective {
    id: string;
    title: string;
    description: string;
    targetDate: Date;
    progress: number;
    status: 'on-track' | 'at-risk' | 'behind' | 'completed';
    year: number;
    category: 'growth' | 'product' | 'team' | 'operations' | 'revenue';
    quarterlyObjectives: QuarterlyObjective[];
}

export let mockYearlyObjectives: YearlyObjective[] = [
    {
        id: 'yearly-1',
        title: 'Scale Product to 10,000 Active Users',
        description: 'Grow our user base from 2,500 to 10,000 monthly active users through product improvements and marketing initiatives.',
        targetDate: new Date('2025-12-31'),
        progress: 68,
        status: 'on-track',
        year: 2025,
        category: 'growth',
        quarterlyObjectives: [
            {
                id: 'q1-1',
                yearlyObjectiveId: 'yearly-1',
                title: 'Launch referral program and reach 4,000 users',
                description: 'Implement viral growth mechanics',
                quarter: 1,
                progress: 100,
                status: 'completed',
                keyResults: [
                    { id: 'kr-1', title: 'Referral program launched', targetValue: 1, currentValue: 1, unit: 'launch' },
                    { id: 'kr-2', title: 'Monthly active users', targetValue: 4000, currentValue: 4200, unit: 'users' },
                ],
            },
            {
                id: 'q2-1',
                yearlyObjectiveId: 'yearly-1',
                title: 'Expand to 6,000 users with enterprise features',
                description: 'Add team collaboration features',
                quarter: 2,
                progress: 100,
                status: 'completed',
                keyResults: [
                    { id: 'kr-3', title: 'Enterprise features shipped', targetValue: 5, currentValue: 5, unit: 'features' },
                    { id: 'kr-4', title: 'Monthly active users', targetValue: 6000, currentValue: 6100, unit: 'users' },
                ],
            },
            {
                id: 'q3-1',
                yearlyObjectiveId: 'yearly-1',
                title: 'Reach 8,000 users and improve retention',
                description: 'Focus on user retention and engagement',
                quarter: 3,
                progress: 85,
                status: 'in-progress',
                keyResults: [
                    { id: 'kr-5', title: 'Weekly retention rate', targetValue: 75, currentValue: 72, unit: '%' },
                    { id: 'kr-6', title: 'Monthly active users', targetValue: 8000, currentValue: 7600, unit: 'users' },
                ],
            },
            {
                id: 'q4-1',
                yearlyObjectiveId: 'yearly-1',
                title: 'Hit 10,000 user milestone',
                description: 'Final push to reach yearly goal',
                quarter: 4,
                progress: 20,
                status: 'in-progress',
                keyResults: [
                    { id: 'kr-7', title: 'Monthly active users', targetValue: 10000, currentValue: 7800, unit: 'users' },
                    { id: 'kr-8', title: 'User satisfaction score', targetValue: 4.5, currentValue: 4.2, unit: '/5' },
                ],
            },
        ],
    },
    {
        id: 'yearly-2',
        title: 'Achieve Product-Market Fit for Enterprise',
        description: 'Validate and establish our enterprise offering with 20 paying enterprise customers.',
        targetDate: new Date('2025-12-31'),
        progress: 55,
        status: 'on-track',
        year: 2025,
        category: 'product',
        quarterlyObjectives: [
            {
                id: 'q1-2',
                yearlyObjectiveId: 'yearly-2',
                title: 'Define enterprise feature requirements',
                description: 'Customer discovery and requirements gathering',
                quarter: 1,
                progress: 100,
                status: 'completed',
                keyResults: [
                    { id: 'kr-9', title: 'Enterprise customer interviews', targetValue: 30, currentValue: 35, unit: 'interviews' },
                    { id: 'kr-10', title: 'Feature requirements documented', targetValue: 1, currentValue: 1, unit: 'doc' },
                ],
            },
            {
                id: 'q2-2',
                yearlyObjectiveId: 'yearly-2',
                title: 'Ship SSO and team management',
                description: 'Core enterprise features development',
                quarter: 2,
                progress: 100,
                status: 'completed',
                keyResults: [
                    { id: 'kr-11', title: 'SSO integrations', targetValue: 3, currentValue: 3, unit: 'providers' },
                    { id: 'kr-12', title: 'Beta enterprise customers', targetValue: 5, currentValue: 7, unit: 'customers' },
                ],
            },
            {
                id: 'q3-2',
                yearlyObjectiveId: 'yearly-2',
                title: 'Onboard 12 enterprise customers',
                description: 'Sales and onboarding push',
                quarter: 3,
                progress: 75,
                status: 'at-risk',
                keyResults: [
                    { id: 'kr-13', title: 'Paying enterprise customers', targetValue: 12, currentValue: 9, unit: 'customers' },
                    { id: 'kr-14', title: 'Enterprise NPS score', targetValue: 50, currentValue: 42, unit: 'score' },
                ],
            },
            {
                id: 'q4-2',
                yearlyObjectiveId: 'yearly-2',
                title: 'Reach 20 enterprise customers',
                description: 'Close remaining deals and prove PMF',
                quarter: 4,
                progress: 15,
                status: 'in-progress',
                keyResults: [
                    { id: 'kr-15', title: 'Paying enterprise customers', targetValue: 20, currentValue: 11, unit: 'customers' },
                    { id: 'kr-16', title: 'Annual contract value', targetValue: 500000, currentValue: 285000, unit: '$' },
                ],
            },
        ],
    },
    {
        id: 'yearly-3',
        title: 'Build World-Class Engineering Team',
        description: 'Grow engineering team from 8 to 15 members while maintaining high performance standards.',
        targetDate: new Date('2025-12-31'),
        progress: 45,
        status: 'at-risk',
        year: 2025,
        category: 'team',
        quarterlyObjectives: [
            {
                id: 'q1-3',
                yearlyObjectiveId: 'yearly-3',
                title: 'Hire 2 senior engineers',
                description: 'Focus on backend and infrastructure',
                quarter: 1,
                progress: 100,
                status: 'completed',
                keyResults: [
                    { id: 'kr-17', title: 'Senior engineers hired', targetValue: 2, currentValue: 2, unit: 'hires' },
                    { id: 'kr-18', title: 'Time to productivity', targetValue: 30, currentValue: 28, unit: 'days' },
                ],
            },
            {
                id: 'q2-3',
                yearlyObjectiveId: 'yearly-3',
                title: 'Hire 2 mid-level developers',
                description: 'Expand frontend and mobile capacity',
                quarter: 2,
                progress: 100,
                status: 'completed',
                keyResults: [
                    { id: 'kr-19', title: 'Mid-level developers hired', targetValue: 2, currentValue: 2, unit: 'hires' },
                    { id: 'kr-20', title: 'Engineering velocity increase', targetValue: 20, currentValue: 25, unit: '%' },
                ],
            },
            {
                id: 'q3-3',
                yearlyObjectiveId: 'yearly-3',
                title: 'Hire engineering manager + 1 developer',
                description: 'Add leadership and grow team',
                quarter: 3,
                progress: 50,
                status: 'at-risk',
                keyResults: [
                    { id: 'kr-21', title: 'Engineering manager hired', targetValue: 1, currentValue: 0, unit: 'hire' },
                    { id: 'kr-22', title: 'Developers hired', targetValue: 1, currentValue: 1, unit: 'hire' },
                ],
            },
            {
                id: 'q4-3',
                yearlyObjectiveId: 'yearly-3',
                title: 'Complete team to 15 members',
                description: 'Final hiring push',
                quarter: 4,
                progress: 0,
                status: 'not-started',
                keyResults: [
                    { id: 'kr-23', title: 'Total engineering team size', targetValue: 15, currentValue: 13, unit: 'members' },
                    { id: 'kr-24', title: 'Team satisfaction score', targetValue: 4.5, currentValue: 4.1, unit: '/5' },
                ],
            },
        ],
    },
    {
        id: 'yearly-4',
        title: 'Achieve $1M Annual Recurring Revenue',
        description: 'Grow revenue through pricing optimization, upsells, and customer expansion.',
        targetDate: new Date('2025-12-31'),
        progress: 72,
        status: 'on-track',
        year: 2025,
        category: 'revenue',
        quarterlyObjectives: [
            {
                id: 'q1-4',
                yearlyObjectiveId: 'yearly-4',
                title: 'Reach $200K ARR',
                description: 'Establish pricing and initial revenue base',
                quarter: 1,
                progress: 100,
                status: 'completed',
                keyResults: [
                    { id: 'kr-25', title: 'Annual recurring revenue', targetValue: 200000, currentValue: 215000, unit: '$' },
                    { id: 'kr-26', title: 'Average revenue per user', targetValue: 50, currentValue: 52, unit: '$' },
                ],
            },
            {
                id: 'q2-4',
                yearlyObjectiveId: 'yearly-4',
                title: 'Grow to $450K ARR',
                description: 'Launch premium tiers',
                quarter: 2,
                progress: 100,
                status: 'completed',
                keyResults: [
                    { id: 'kr-27', title: 'Annual recurring revenue', targetValue: 450000, currentValue: 480000, unit: '$' },
                    { id: 'kr-28', title: 'Premium tier adoption', targetValue: 15, currentValue: 18, unit: '%' },
                ],
            },
            {
                id: 'q3-4',
                yearlyObjectiveId: 'yearly-4',
                title: 'Reach $700K ARR',
                description: 'Enterprise sales push',
                quarter: 3,
                progress: 90,
                status: 'in-progress',
                keyResults: [
                    { id: 'kr-29', title: 'Annual recurring revenue', targetValue: 700000, currentValue: 680000, unit: '$' },
                    { id: 'kr-30', title: 'Monthly churn rate', targetValue: 3, currentValue: 3.2, unit: '%' },
                ],
            },
            {
                id: 'q4-4',
                yearlyObjectiveId: 'yearly-4',
                title: 'Hit $1M ARR milestone',
                description: 'Annual revenue goal',
                quarter: 4,
                progress: 25,
                status: 'in-progress',
                keyResults: [
                    { id: 'kr-31', title: 'Annual recurring revenue', targetValue: 1000000, currentValue: 720000, unit: '$' },
                    { id: 'kr-32', title: 'Net revenue retention', targetValue: 120, currentValue: 115, unit: '%' },
                ],
            },
        ],
    },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getMockMeetingById(id: string): MeetingWithCount | undefined {
    return mockMeetings.find(m => m.id === id);
}

export function getMockTasksByMeetingId(meetingId: string): TaskWithRelations[] {
    return mockTasks.filter(t => t.meetingId === meetingId);
}

export function getMockContactById(id: string): Contact | undefined {
    return mockContacts.find(c => c.id === id);
}

export function filterMockTasks(filters: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    reviewed?: boolean;
}): TaskWithRelations[] {
    return mockTasks.filter(task => {
        if (filters.status && task.status !== filters.status) return false;
        if (filters.priority && task.priority !== filters.priority) return false;
        if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;
        if (filters.reviewed !== undefined && task.reviewed !== filters.reviewed) return false;
        return true;
    });
}

// Get current quarter (1-4) for highlighting
export function getCurrentQuarter(): number {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
}

// Get tasks linked to a specific quarterly objective
export function getTasksByQuarterlyObjectiveId(quarterlyObjectiveId: string) {
    return mockTasks.filter(t => t.quarterlyObjectiveId === quarterlyObjectiveId);
}

// Calculate progress for an objective based on linked tasks
export function calculateObjectiveProgressFromTasks(quarterlyObjectiveId: string): {
    totalTasks: number;
    completedTasks: number;
    progress: number;
} {
    const tasks = getTasksByQuarterlyObjectiveId(quarterlyObjectiveId);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { totalTasks, completedTasks, progress };
}
