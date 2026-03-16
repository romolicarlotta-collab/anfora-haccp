-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('ADMIN', 'HACCP_MANAGER', 'KITCHEN_MANAGER', 'KITCHEN_OPERATOR', 'BAR_OPERATOR', 'OWNER');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'LOW_STOCK', 'DEPLETED', 'EXPIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BatchKind" AS ENUM ('SUPPLIER', 'PRODUCTION', 'DERIVED');

-- CreateEnum
CREATE TYPE "RecipeCategory" AS ENUM ('SEMILAVORATO', 'PRODOTTO_FINITO', 'PIATTO');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('PENDING', 'COMPLETED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "NonConformityStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" "RoleKey" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalArea" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "OperationalArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vatNumber" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "allergens" TEXT[],
    "standardShelfLifeDays" INTEGER NOT NULL,
    "storageTemperature" TEXT NOT NULL,
    "preferredSupplierId" TEXT,
    "haccpNotes" TEXT,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageLocation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "temperatureRange" TEXT,

    CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "RecipeCategory" NOT NULL,
    "instructions" TEXT NOT NULL,
    "expectedYield" DECIMAL(10,2) NOT NULL,
    "yieldUnit" TEXT NOT NULL,
    "finalAllergens" TEXT[],
    "standardShelfLifeDays" INTEGER NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "RecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "kind" "BatchKind" NOT NULL,
    "status" "BatchStatus" NOT NULL,
    "productName" TEXT NOT NULL,
    "ingredientId" TEXT,
    "recipeId" TEXT,
    "supplierId" TEXT,
    "parentBatchId" TEXT,
    "operationalAreaId" TEXT,
    "storageLocationId" TEXT,
    "supplierLotCode" TEXT,
    "quantityReceived" DECIMAL(10,3) NOT NULL,
    "quantityAvailable" DECIMAL(10,3) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "lowStockThreshold" DECIMAL(10,3),
    "dateReceived" TIMESTAMP(3),
    "producedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "storageCondition" TEXT,
    "inboundTemperature" DECIMAL(4,1),
    "conformityOutcome" BOOLEAN,
    "operatorName" TEXT,
    "notes" TEXT,
    "allergens" TEXT[],
    "genealogySnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionBatchItem" (
    "id" TEXT NOT NULL,
    "producedBatchId" TEXT NOT NULL,
    "consumedBatchId" TEXT NOT NULL,
    "ingredientId" TEXT,
    "quantityUsed" DECIMAL(10,3) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,

    CONSTRAINT "ProductionBatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchMovement" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitOfMeasure" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "sourceBatchId" TEXT,
    "targetBatchId" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchLabel" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "qrPayload" TEXT,
    "barcodeValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabelPrintLog" (
    "id" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "copies" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabelPrintLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaccpCheck" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "checklistType" TEXT NOT NULL,
    "status" "CheckStatus" NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "operationalAreaId" TEXT,
    "assignedToId" TEXT,
    "notes" TEXT,

    CONSTRAINT "HaccpCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemperatureLog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "value" DECIMAL(4,1) NOT NULL,
    "minThreshold" DECIMAL(4,1),
    "maxThreshold" DECIMAL(4,1),
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operationalAreaId" TEXT,
    "recordedById" TEXT,
    "isAlert" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "TemperatureLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NonConformity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" "NonConformityStatus" NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "NonConformity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectiveAction" (
    "id" TEXT NOT NULL,
    "nonConformityId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CorrectiveAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "supplierId" TEXT,
    "batchId" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalArea_code_key" ON "OperationalArea"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_code_key" ON "Ingredient"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StorageLocation_code_key" ON "StorageLocation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_code_key" ON "Recipe"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeItem_recipeId_ingredientId_key" ON "RecipeItem"("recipeId", "ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_code_key" ON "Batch"("code");

-- CreateIndex
CREATE INDEX "Batch_status_expiresAt_idx" ON "Batch"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Batch_parentBatchId_idx" ON "Batch"("parentBatchId");

-- CreateIndex
CREATE INDEX "Batch_ingredientId_supplierLotCode_idx" ON "Batch"("ingredientId", "supplierLotCode");

-- CreateIndex
CREATE INDEX "BatchMovement_batchId_performedAt_idx" ON "BatchMovement"("batchId", "performedAt");

-- CreateIndex
CREATE INDEX "LabelPrintLog_createdAt_idx" ON "LabelPrintLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_preferredSupplierId_fkey" FOREIGN KEY ("preferredSupplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_parentBatchId_fkey" FOREIGN KEY ("parentBatchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_operationalAreaId_fkey" FOREIGN KEY ("operationalAreaId") REFERENCES "OperationalArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "StorageLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBatchItem" ADD CONSTRAINT "ProductionBatchItem_producedBatchId_fkey" FOREIGN KEY ("producedBatchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBatchItem" ADD CONSTRAINT "ProductionBatchItem_consumedBatchId_fkey" FOREIGN KEY ("consumedBatchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionBatchItem" ADD CONSTRAINT "ProductionBatchItem_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMovement" ADD CONSTRAINT "BatchMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchLabel" ADD CONSTRAINT "BatchLabel_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelPrintLog" ADD CONSTRAINT "LabelPrintLog_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "BatchLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabelPrintLog" ADD CONSTRAINT "LabelPrintLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaccpCheck" ADD CONSTRAINT "HaccpCheck_operationalAreaId_fkey" FOREIGN KEY ("operationalAreaId") REFERENCES "OperationalArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HaccpCheck" ADD CONSTRAINT "HaccpCheck_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureLog" ADD CONSTRAINT "TemperatureLog_operationalAreaId_fkey" FOREIGN KEY ("operationalAreaId") REFERENCES "OperationalArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemperatureLog" ADD CONSTRAINT "TemperatureLog_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectiveAction" ADD CONSTRAINT "CorrectiveAction_nonConformityId_fkey" FOREIGN KEY ("nonConformityId") REFERENCES "NonConformity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
