-- CreateEnum
CREATE TYPE "ReadTrigger" AS ENUM ('scrolled', 'dwell_45s');

-- CreateTable
CREATE TABLE "read_events" (
    "user_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trigger" "ReadTrigger" NOT NULL,

    CONSTRAINT "read_events_pkey" PRIMARY KEY ("user_id","article_id")
);

-- CreateIndex
CREATE INDEX "read_events_user_id_idx" ON "read_events"("user_id");

-- AddForeignKey
ALTER TABLE "read_events" ADD CONSTRAINT "read_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "read_events" ADD CONSTRAINT "read_events_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
