import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  category: z.string().min(2),
  unitOfMeasure: z.string().min(1),
  allergens: z.array(z.string()).default([]),
  standardShelfLifeDays: z.number().int().positive(),
  storageTemperature: z.string().min(2),
  preferredSupplierId: z.string().optional(),
  haccpNotes: z.string().optional()
});

export const supplierSchema = z.object({
  name: z.string().min(2),
  vatNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional()
});

export const productionBatchSchema = z.object({
  recipeId: z.string(),
  operationalAreaId: z.string(),
  storageLocationId: z.string(),
  productName: z.string().min(2),
  code: z.string().min(4),
  quantityProduced: z.number().positive(),
  unitOfMeasure: z.string().min(1),
  lowStockThreshold: z.number().nonnegative().optional(),
  operatorName: z.string().min(2),
  producedAt: z.string(),
  expiresAt: z.string(),
  allergens: z.array(z.string()).default([]),
  sourceItems: z.array(
    z.object({
      consumedBatchId: z.string(),
      ingredientId: z.string().optional(),
      quantityUsed: z.number().positive(),
      unitOfMeasure: z.string().min(1)
    })
  ).min(1)
});

export const derivedBatchSchema = z.object({
  parentBatchId: z.string(),
  parentBatchCode: z.string(),
  quantityAvailable: z.number().positive(),
  count: z.number().int().positive(),
  quantityPerChild: z.number().positive(),
  unitOfMeasure: z.string().min(1),
  operatorName: z.string().min(2),
  storageLocationId: z.string().optional(),
  suffixMode: z.enum(["AUTO", "CUSTOM"]).default("AUTO"),
  customCodes: z.array(z.string()).optional()
});

export const labelReprintSchema = z.object({
  batchId: z.string(),
  labelId: z.string(),
  userId: z.string(),
  reason: z.string().min(3),
  copies: z.number().int().positive().max(20)
});

export const recipeSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  category: z.enum(["SEMILAVORATO", "PRODOTTO_FINITO", "PIATTO"]),
  instructions: z.string().min(1),
  expectedYield: z.number().positive(),
  yieldUnit: z.string().min(1),
  finalAllergens: z.array(z.string()).default([]),
  standardShelfLifeDays: z.number().int().positive(),
  items: z.array(
    z.object({
      ingredientId: z.string(),
      quantity: z.number().positive(),
      unit: z.string().min(1)
    })
  ).min(1)
});

export const temperatureLogSchema = z.object({
  title: z.string().min(2),
  value: z.number(),
  minThreshold: z.number().optional(),
  maxThreshold: z.number().optional(),
  operationalAreaId: z.string().optional(),
  recordedById: z.string().optional(),
  notes: z.string().optional()
});

export const haccpCheckSchema = z.object({
  title: z.string().min(2),
  checklistType: z.string().min(1),
  status: z.enum(["PENDING", "COMPLETED", "OVERDUE"]).default("PENDING"),
  dueAt: z.string(),
  operationalAreaId: z.string().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional()
});

export const haccpCheckUpdateSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "OVERDUE"]).optional(),
  notes: z.string().optional()
});
