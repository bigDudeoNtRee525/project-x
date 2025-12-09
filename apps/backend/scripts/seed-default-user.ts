
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const defaultUserId = '00000000-0000-0000-0000-000000000000';

    console.log(`Checking for default user ${defaultUserId}...`);

    const user = await prisma.user.upsert({
        where: { id: defaultUserId },
        update: {},
        create: {
            id: defaultUserId,
            email: 'test@example.com',
            name: 'Test User',
        },
    });

    console.log('Default user ensured:', user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
