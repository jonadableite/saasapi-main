-- AlterTable
ALTER TABLE "whatlead_campaigns" ADD COLUMN     "maxMessagesPerInstance" INTEGER,
ADD COLUMN     "rotationStrategy" TEXT NOT NULL DEFAULT 'RANDOM',
ADD COLUMN     "useInstanceRotation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "whatlead_campaign_instances" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxMessages" INTEGER,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatlead_campaign_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatlead_campaign_instances_campaignId_idx" ON "whatlead_campaign_instances"("campaignId");

-- CreateIndex
CREATE INDEX "whatlead_campaign_instances_instanceId_idx" ON "whatlead_campaign_instances"("instanceId");

-- CreateIndex
CREATE INDEX "whatlead_campaign_instances_isActive_idx" ON "whatlead_campaign_instances"("isActive");

-- CreateIndex
CREATE INDEX "whatlead_campaign_instances_priority_idx" ON "whatlead_campaign_instances"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "whatlead_campaign_instances_campaignId_instanceId_key" ON "whatlead_campaign_instances"("campaignId", "instanceId");

-- AddForeignKey
ALTER TABLE "whatlead_campaign_instances" ADD CONSTRAINT "whatlead_campaign_instances_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "whatlead_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatlead_campaign_instances" ADD CONSTRAINT "whatlead_campaign_instances_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "Instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
