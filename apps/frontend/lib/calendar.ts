import type { TaskWithRelations } from '@meeting-task-tool/shared';

/**
 * Generate an ICS calendar event for a single task
 */
export function generateICSEvent(task: TaskWithRelations): string {
    if (!task.deadline) return '';

    const deadline = new Date(task.deadline);
    const created = new Date(task.createdAt);

    // Format date as YYYYMMDD
    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0].replace(/-/g, '');
    };

    // Format datetime as YYYYMMDDTHHMMSSZ
    const formatDateTime = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Escape special characters in ICS text
    const escapeText = (text: string) => {
        return text.replace(/[\\;,\n]/g, (match) => {
            if (match === '\n') return '\\n';
            return '\\' + match;
        });
    };

    const uid = `task-${task.id}@meeting-task-tool`;
    const summary = escapeText(task.description);
    const assigneeText = task.assignees && task.assignees.length > 0
        ? task.assignees.map(a => a.name).join(', ')
        : 'Unassigned';
    const description = escapeText(
        `Priority: ${task.priority}\\nStatus: ${task.status}\\n` +
        `Assignee: ${assigneeText}\\n` +
        (task.meeting?.title ? `From meeting: ${task.meeting.title}` : '')
    );

    return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatDateTime(new Date())}`,
        `DTSTART;VALUE=DATE:${formatDate(deadline)}`,
        `DTEND;VALUE=DATE:${formatDate(new Date(deadline.getTime() + 24 * 60 * 60 * 1000))}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `CREATED:${formatDateTime(created)}`,
        task.priority === 'urgent' || task.priority === 'high' ? 'PRIORITY:1' : 'PRIORITY:5',
        'END:VEVENT',
    ].join('\r\n');
}

/**
 * Generate a complete ICS calendar file from multiple tasks
 */
export function generateICSCalendar(tasks: TaskWithRelations[]): string {
    const tasksWithDeadlines = tasks.filter((t) => t.deadline);

    const events = tasksWithDeadlines.map(generateICSEvent).filter(Boolean).join('\r\n');

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Meeting Task Tool//Task Export//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Meeting Task Tool - Tasks',
        events,
        'END:VCALENDAR',
    ].join('\r\n');
}

/**
 * Trigger download of an ICS file
 */
export function downloadICS(tasks: TaskWithRelations[], filename: string = 'tasks.ics'): void {
    const icsContent = generateICSCalendar(tasks);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Generate a Google Calendar URL to add a single task as an event
 */
export function generateGoogleCalendarURL(task: TaskWithRelations): string | null {
    if (!task.deadline) return null;

    const deadline = new Date(task.deadline);
    const nextDay = new Date(deadline.getTime() + 24 * 60 * 60 * 1000);

    // Format as YYYYMMDD for all-day events
    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0].replace(/-/g, '');
    };

    const assigneeText = task.assignees && task.assignees.length > 0
        ? task.assignees.map(a => a.name).join(', ')
        : 'Unassigned';
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: task.description,
        dates: `${formatDate(deadline)}/${formatDate(nextDay)}`,
        details: `Priority: ${task.priority}\nStatus: ${task.status}\nAssignee: ${assigneeText}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an Outlook.com calendar URL
 */
export function generateOutlookCalendarURL(task: TaskWithRelations): string | null {
    if (!task.deadline) return null;

    const deadline = new Date(task.deadline);
    const nextDay = new Date(deadline.getTime() + 24 * 60 * 60 * 1000);

    const assigneeText = task.assignees && task.assignees.length > 0
        ? task.assignees.map(a => a.name).join(', ')
        : 'Unassigned';
    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: task.description,
        startdt: deadline.toISOString().split('T')[0],
        enddt: nextDay.toISOString().split('T')[0],
        allday: 'true',
        body: `Priority: ${task.priority}\nStatus: ${task.status}\nAssignee: ${assigneeText}`,
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
