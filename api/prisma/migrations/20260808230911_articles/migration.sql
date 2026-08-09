-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "source_url" TEXT NOT NULL,
    "image_url" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "articles_organization_id_published_at_idx" ON "articles"("organization_id", "published_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "articles_organization_id_external_id_key" ON "articles"("organization_id", "external_id");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
