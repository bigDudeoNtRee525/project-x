import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '../../.env');
console.log('CWD:', process.cwd());
console.log('Loading .env from:', envPath);
console.log('File exists:', fs.existsSync(envPath));

dotenv.config({ path: envPath });

console.log('DEEPSEEKAUTH set:', !!process.env.DEEPSEEKAUTH);

import { prisma } from '../src/lib/prisma';

async function main() {
    // Dynamic import to ensure env vars are loaded first
    const { deepSeekService } = await import('../src/services/ai.service');
    console.log('Verifying DeepSeek Service...');

    // 1. Create Mock Data
    console.log('Creating mock data...');
    const user = await prisma.user.create({
        data: {
            email: `test-${Date.now()}@example.com`,
            name: 'Test User',
        }
    });

    const goal = await prisma.goal.create({
        data: {
            userId: user.id,
            title: 'Q4 Product Launch',
            type: 'QUARTERLY',
        }
    });

    const contact = await prisma.contact.create({
        data: {
            userId: user.id,
            name: 'Alice Engineer',
            role: 'Frontend Dev',
        }
    });

    // 2. Mock Transcript
    const transcript = `
    Meeting about Q4 Product Launch.
    Alice, please update the landing page by Friday, December 1st.
    Bob, please check the analytics (no rush).
    We need to make sure the server is stable.
  `;

    // 3. Test Service Directly
    console.log('Testing identifyGoal...');
    const goalResult = await deepSeekService.identifyGoal(transcript, [{
        id: goal.id,
        title: goal.title,
        type: goal.type,
        categories: []
    }]);
    console.log('Goal Result:', goalResult);

    console.log('Testing extractTasks...');
    const tasks = await deepSeekService.extractTasks(transcript, goal.title, [{
        id: contact.id,
        name: contact.name,
        role: contact.role
    }]);
    console.log('Extracted Tasks:', tasks);

    // Cleanup
    console.log('Cleaning up...');
    await prisma.contact.delete({ where: { id: contact.id } });
    await prisma.goal.delete({ where: { id: goal.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Done.');
}

main().catch(console.error);
