import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userId = '00000000-0000-0000-0000-000000000000'; // Mock user ID

    // Create User if not exists
    const user = await prisma.user.upsert({
        where: { email: 'dev@example.com' },
        update: {},
        create: {
            id: userId,
            email: 'dev@example.com',
            name: 'Dev User',
        },
    });

    console.log({ user });

    // Create Yearly Goal
    const yearlyGoal = await prisma.goal.create({
        data: {
            userId: user.id,
            title: 'Scale Product to 10,000 Active Users',
            type: 'YEARLY',
        },
    });

    console.log({ yearlyGoal });

    // Create Quarterly Goal
    const quarterlyGoal = await prisma.goal.create({
        data: {
            userId: user.id,
            title: 'Launch referral program',
            type: 'QUARTERLY',
            parentId: yearlyGoal.id,
        },
    });

    console.log({ quarterlyGoal });

    // Create Category
    const category = await prisma.category.create({
        data: {
            userId: user.id,
            name: 'Growth Marketing',
            goalId: quarterlyGoal.id,
        },
    });

    console.log({ category });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
