/*
  Warnings:

  - You are about to drop the `MessageReaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MessageReaction" DROP CONSTRAINT "MessageReaction_conversationId_fkey";

-- DropTable
DROP TABLE "MessageReaction";

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conversationId" TEXT,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotmart_customers" (
    "id" TEXT NOT NULL,
    "subscriberCode" TEXT NOT NULL,
    "transaction" TEXT,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerDocument" TEXT,
    "customerCountry" TEXT,
    "customerCity" TEXT,
    "customerState" TEXT,
    "customerZipCode" TEXT,
    "customerAddress" TEXT,
    "customerNumber" TEXT,
    "customerComplement" TEXT,
    "customerNeighborhood" TEXT,
    "paymentType" TEXT,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL,
    "subscriptionStatus" TEXT NOT NULL,
    "subscriptionValue" DECIMAL(10,2) NOT NULL,
    "subscriptionCurrency" TEXT NOT NULL DEFAULT 'BRL',
    "subscriptionFrequency" TEXT,
    "subscriptionStartDate" TIMESTAMP(3),
    "subscriptionEndDate" TIMESTAMP(3),
    "nextChargeDate" TIMESTAMP(3),
    "cancelationDate" TIMESTAMP(3),
    "cancelationReason" TEXT,
    "affiliateCode" TEXT,
    "affiliateName" TEXT,
    "producerCode" TEXT,
    "producerName" TEXT,
    "hotmartUserId" TEXT,
    "hotmartUserEmail" TEXT,
    "hotmartUserName" TEXT,
    "hotmartUserPhone" TEXT,
    "hotmartUserDocument" TEXT,
    "hotmartUserCountry" TEXT,
    "hotmartUserCity" TEXT,
    "hotmartUserState" TEXT,
    "hotmartUserZipCode" TEXT,
    "hotmartUserAddress" TEXT,
    "hotmartUserNumber" TEXT,
    "hotmartUserComplement" TEXT,
    "hotmartUserNeighborhood" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "trialEndDate" TIMESTAMP(3),
    "lastLoginDate" TIMESTAMP(3),
    "lastActivityDate" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "whatleadUserId" TEXT,
    "hotmartProductId" TEXT,

    CONSTRAINT "hotmart_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotmart_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "transaction" TEXT,
    "subscriberCode" TEXT,
    "productId" TEXT,
    "status" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,

    CONSTRAINT "hotmart_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotmart_transactions" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "subscriberCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "transactionStatus" TEXT NOT NULL,
    "transactionValue" DECIMAL(10,2) NOT NULL,
    "transactionCurrency" TEXT NOT NULL DEFAULT 'BRL',
    "paymentType" TEXT,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "refundDate" TIMESTAMP(3),
    "refundValue" DECIMAL(10,2),
    "refundReason" TEXT,
    "chargebackDate" TIMESTAMP(3),
    "chargebackValue" DECIMAL(10,2),
    "chargebackReason" TEXT,
    "installmentNumber" INTEGER,
    "totalInstallments" INTEGER,
    "affiliateCode" TEXT,
    "affiliateName" TEXT,
    "commissionValue" DECIMAL(10,2),
    "commissionPercentage" DECIMAL(5,2),
    "producerCode" TEXT,
    "producerName" TEXT,
    "producerValue" DECIMAL(10,2),
    "producerPercentage" DECIMAL(5,2),
    "platformValue" DECIMAL(10,2),
    "platformPercentage" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "hotmart_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotmart_products" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "productCategory" TEXT,
    "productSubcategory" TEXT,
    "productDescription" TEXT,
    "productPrice" DECIMAL(10,2) NOT NULL,
    "productCurrency" TEXT NOT NULL DEFAULT 'BRL',
    "productStatus" TEXT NOT NULL,
    "productUrl" TEXT,
    "productImage" TEXT,
    "productVideo" TEXT,
    "productDocuments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "productTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "producerCode" TEXT,
    "producerName" TEXT,
    "producerEmail" TEXT,
    "producerPhone" TEXT,
    "affiliateEnabled" BOOLEAN NOT NULL DEFAULT true,
    "commissionPercentage" DECIMAL(5,2),
    "trialEnabled" BOOLEAN NOT NULL DEFAULT false,
    "trialDays" INTEGER,
    "trialPrice" DECIMAL(10,2),
    "subscriptionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionFrequency" TEXT,
    "subscriptionPrice" DECIMAL(10,2),
    "subscriptionCycles" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotmart_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotmart_analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "productId" TEXT,
    "metricType" TEXT NOT NULL,
    "metricValue" DECIMAL(15,2) NOT NULL,
    "metricUnit" TEXT,
    "metricDescription" TEXT,
    "activeSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "cancelledSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "delayedSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "newSubscriptions" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "refundedRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "chargebackRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "churnRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "ltv" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "mrr" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "arr" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotmart_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_key" ON "message_reactions"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "hotmart_customers_subscriberCode_key" ON "hotmart_customers"("subscriberCode");

-- CreateIndex
CREATE INDEX "hotmart_customers_subscriberCode_idx" ON "hotmart_customers"("subscriberCode");

-- CreateIndex
CREATE INDEX "hotmart_customers_customerEmail_idx" ON "hotmart_customers"("customerEmail");

-- CreateIndex
CREATE INDEX "hotmart_customers_subscriptionStatus_idx" ON "hotmart_customers"("subscriptionStatus");

-- CreateIndex
CREATE INDEX "hotmart_customers_paymentStatus_idx" ON "hotmart_customers"("paymentStatus");

-- CreateIndex
CREATE INDEX "hotmart_customers_nextChargeDate_idx" ON "hotmart_customers"("nextChargeDate");

-- CreateIndex
CREATE INDEX "hotmart_customers_createdAt_idx" ON "hotmart_customers"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "hotmart_events_eventType_idx" ON "hotmart_events"("eventType");

-- CreateIndex
CREATE INDEX "hotmart_events_eventDate_idx" ON "hotmart_events"("eventDate" DESC);

-- CreateIndex
CREATE INDEX "hotmart_events_status_idx" ON "hotmart_events"("status");

-- CreateIndex
CREATE INDEX "hotmart_events_transaction_idx" ON "hotmart_events"("transaction");

-- CreateIndex
CREATE INDEX "hotmart_events_subscriberCode_idx" ON "hotmart_events"("subscriberCode");

-- CreateIndex
CREATE UNIQUE INDEX "hotmart_transactions_transactionId_key" ON "hotmart_transactions"("transactionId");

-- CreateIndex
CREATE INDEX "hotmart_transactions_transactionId_idx" ON "hotmart_transactions"("transactionId");

-- CreateIndex
CREATE INDEX "hotmart_transactions_subscriberCode_idx" ON "hotmart_transactions"("subscriberCode");

-- CreateIndex
CREATE INDEX "hotmart_transactions_transactionStatus_idx" ON "hotmart_transactions"("transactionStatus");

-- CreateIndex
CREATE INDEX "hotmart_transactions_paymentStatus_idx" ON "hotmart_transactions"("paymentStatus");

-- CreateIndex
CREATE INDEX "hotmart_transactions_paymentDate_idx" ON "hotmart_transactions"("paymentDate" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "hotmart_products_productId_key" ON "hotmart_products"("productId");

-- CreateIndex
CREATE INDEX "hotmart_products_productId_idx" ON "hotmart_products"("productId");

-- CreateIndex
CREATE INDEX "hotmart_products_productStatus_idx" ON "hotmart_products"("productStatus");

-- CreateIndex
CREATE INDEX "hotmart_products_producerCode_idx" ON "hotmart_products"("producerCode");

-- CreateIndex
CREATE INDEX "hotmart_analytics_date_idx" ON "hotmart_analytics"("date" DESC);

-- CreateIndex
CREATE INDEX "hotmart_analytics_productId_idx" ON "hotmart_analytics"("productId");

-- CreateIndex
CREATE INDEX "hotmart_analytics_metricType_idx" ON "hotmart_analytics"("metricType");

-- CreateIndex
CREATE UNIQUE INDEX "hotmart_analytics_date_productId_metricType_key" ON "hotmart_analytics"("date", "productId", "metricType");

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "whatlead_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotmart_customers" ADD CONSTRAINT "hotmart_customers_whatleadUserId_fkey" FOREIGN KEY ("whatleadUserId") REFERENCES "whatlead_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotmart_customers" ADD CONSTRAINT "hotmart_customers_hotmartProductId_fkey" FOREIGN KEY ("hotmartProductId") REFERENCES "hotmart_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotmart_events" ADD CONSTRAINT "hotmart_events_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "hotmart_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotmart_transactions" ADD CONSTRAINT "hotmart_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "hotmart_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
