-- CreateTable: task_assignees (join table for many-to-many)
CREATE TABLE "task_assignees" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("id")
);

-- Migrate existing assignee data to join table
INSERT INTO "task_assignees" ("id", "task_id", "contact_id", "assigned_at")
SELECT
    gen_random_uuid()::text,
    id,
    assignee_id,
    CURRENT_TIMESTAMP
FROM "tasks"
WHERE "assignee_id" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "task_assignees_task_id_contact_id_key" ON "task_assignees"("task_id", "contact_id");

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old assignee columns from tasks
ALTER TABLE "tasks" DROP COLUMN "assignee_id";
ALTER TABLE "tasks" DROP COLUMN "assignee_name";
