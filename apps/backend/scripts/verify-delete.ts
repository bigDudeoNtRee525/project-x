import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Verifying Meeting Deletion...');

    // 1. Create Mock Data
    console.log('Creating mock meeting and tasks...');
    const user = await prisma.user.create({
        data: {
            email: `test-delete-${Date.now()}@example.com`,
            name: 'Test Delete User',
        }
    });

    const meeting = await prisma.meeting.create({
        data: {
            userId: user.id,
            title: 'Meeting to Delete',
            transcript: 'This meeting will be deleted.',
        }
    });

    await prisma.task.create({
        data: {
            userId: user.id,
            meetingId: meeting.id,
            description: 'Task linked to deleted meeting',
        }
    });

    // 2. Verify Creation
    const meetingBefore = await prisma.meeting.findUnique({ where: { id: meeting.id } });
    const tasksBefore = await prisma.task.findMany({ where: { meetingId: meeting.id } });
    console.log('Meeting created:', !!meetingBefore);
    console.log('Tasks created:', tasksBefore.length);

    // 3. Delete Meeting
    console.log('Deleting meeting...');
    await prisma.meeting.delete({ where: { id: meeting.id } });

    // 4. Verify Deletion
    const meetingAfter = await prisma.meeting.findUnique({ where: { id: meeting.id } });
    const tasksAfter = await prisma.task.findMany({ where: { meetingId: meeting.id } });

    console.log('Meeting exists after delete:', !!meetingAfter);
    console.log('Tasks exist after delete:', tasksAfter.length);

    if (!meetingAfter && tasksAfter.length === 0) {
        console.log('SUCCESS: Meeting and tasks deleted.');
    } else {
        console.error('FAILURE: Meeting or tasks still exist.');
    }

    // Cleanup
    await prisma.user.delete({ where: { id: user.id } });
}

main().catch(console.error);
