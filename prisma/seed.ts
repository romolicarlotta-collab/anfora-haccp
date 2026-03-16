import { PrismaClient, BatchKind, BatchStatus, CheckStatus, NonConformityStatus, RecipeCategory, RoleKey } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.labelPrintLog.deleteMany();
  await prisma.batchLabel.deleteMany();
  await prisma.batchMovement.deleteMany();
  await prisma.productionBatchItem.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.temperatureLog.deleteMany();
  await prisma.haccpCheck.deleteMany();
  await prisma.correctiveAction.deleteMany();
  await prisma.nonConformity.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.operationalArea.deleteMany();
  await prisma.storageLocation.deleteMany();

  const roles = await Promise.all([
    prisma.role.create({ data: { key: RoleKey.ADMIN, name: "Admin" } }),
    prisma.role.create({ data: { key: RoleKey.HACCP_MANAGER, name: "Responsabile HACCP" } }),
    prisma.role.create({ data: { key: RoleKey.KITCHEN_MANAGER, name: "Responsabile cucina" } }),
    prisma.role.create({ data: { key: RoleKey.KITCHEN_OPERATOR, name: "Operatore cucina" } }),
    prisma.role.create({ data: { key: RoleKey.BAR_OPERATOR, name: "Operatore bar/pizzeria" } }),
    prisma.role.create({ data: { key: RoleKey.OWNER, name: "Supervisore / titolare" } })
  ]);

  const [cucina, pizzeria, bar, laboratorio] = await Promise.all([
    prisma.operationalArea.create({ data: { code: "CUC", name: "Cucina ristorante" } }),
    prisma.operationalArea.create({ data: { code: "PIZ", name: "Pizzeria" } }),
    prisma.operationalArea.create({ data: { code: "BAR", name: "Bar / colazioni" } }),
    prisma.operationalArea.create({ data: { code: "LAB", name: "Laboratorio preparazioni" } })
  ]);

  const [frigo1, cellaSalse] = await Promise.all([
    prisma.storageLocation.create({ data: { code: "FRIGO-1", name: "Frigo cucina 1", area: "Cucina", temperatureRange: "0 / +4 C" } }),
    prisma.storageLocation.create({ data: { code: "CEL-SALSE", name: "Cella salse", area: "Laboratorio", temperatureRange: "0 / +4 C" } })
  ]);

  const admin = await prisma.user.create({
    data: {
      name: "Giulia Admin",
      email: "admin@anfora.local",
      passwordHash: "demo1234",
      roleId: roles[0].id
    }
  });

  const haccpManager = await prisma.user.create({
    data: {
      name: "Marco HACCP",
      email: "haccp@anfora.local",
      passwordHash: "demo1234",
      roleId: roles[1].id
    }
  });

  const kitchenOperator = await prisma.user.create({
    data: {
      name: "Sara Cucina",
      email: "cucina@anfora.local",
      passwordHash: "demo1234",
      roleId: roles[3].id
    }
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: "OrtoSud Distribuzione",
      vatNumber: "IT01234567890",
      phone: "+39 080 555010",
      email: "ordini@ortosud.example",
      notes: "Consegna giornaliera ortofrutta e conserve."
    }
  });

  const olioSupplier = await prisma.supplier.create({
    data: {
      name: "Frantoio Costa",
      vatNumber: "IT09876543210",
      email: "commerciale@frantoiocosta.example"
    }
  });

  const pomodoro = await prisma.ingredient.create({
    data: {
      name: "Pomodoro pelato",
      code: "POM-PEL",
      category: "Conserve",
      unitOfMeasure: "kg",
      allergens: [],
      standardShelfLifeDays: 365,
      storageTemperature: "temperatura ambiente, poi 0/+4 C dopo apertura",
      preferredSupplierId: supplier.id,
      haccpNotes: "Verificare integrita' lattina e assenza rigonfiamenti."
    }
  });

  const olio = await prisma.ingredient.create({
    data: {
      name: "Olio extravergine di oliva",
      code: "OLIO-EVO",
      category: "Condimenti",
      unitOfMeasure: "l",
      allergens: [],
      standardShelfLifeDays: 540,
      storageTemperature: "luogo fresco e asciutto",
      preferredSupplierId: olioSupplier.id
    }
  });

  const cipolla = await prisma.ingredient.create({
    data: {
      name: "Cipolla bianca",
      code: "CIP-BIA",
      category: "Ortaggi",
      unitOfMeasure: "kg",
      allergens: [],
      standardShelfLifeDays: 14,
      storageTemperature: "0/+4 C",
      preferredSupplierId: supplier.id
    }
  });

  const lotPomodoro = await prisma.batch.create({
    data: {
      code: "POM-240311-A",
      kind: BatchKind.SUPPLIER,
      status: BatchStatus.ACTIVE,
      productName: "Pomodoro pelato",
      ingredientId: pomodoro.id,
      supplierId: supplier.id,
      operationalAreaId: cucina.id,
      storageLocationId: frigo1.id,
      supplierLotCode: "LOT-PD-311",
      quantityReceived: 20,
      quantityAvailable: 15,
      unitOfMeasure: "kg",
      lowStockThreshold: 4,
      dateReceived: new Date("2026-03-11T08:30:00+01:00"),
      expiresAt: new Date("2027-02-28T23:59:00+01:00"),
      inboundTemperature: 16.2,
      conformityOutcome: true,
      operatorName: "Sara Cucina",
      allergens: []
    }
  });

  const lotOlio = await prisma.batch.create({
    data: {
      code: "OLV-240308-B",
      kind: BatchKind.SUPPLIER,
      status: BatchStatus.ACTIVE,
      productName: "Olio extravergine di oliva",
      ingredientId: olio.id,
      supplierId: olioSupplier.id,
      operationalAreaId: cucina.id,
      storageLocationId: frigo1.id,
      supplierLotCode: "LOT-EVO-773",
      quantityReceived: 10,
      quantityAvailable: 8,
      unitOfMeasure: "l",
      lowStockThreshold: 2,
      dateReceived: new Date("2026-03-08T09:10:00+01:00"),
      expiresAt: new Date("2027-09-15T23:59:00+02:00"),
      conformityOutcome: true,
      operatorName: "Sara Cucina",
      allergens: []
    }
  });

  const lotCipolla = await prisma.batch.create({
    data: {
      code: "CIP-240310-C",
      kind: BatchKind.SUPPLIER,
      status: BatchStatus.ACTIVE,
      productName: "Cipolla bianca",
      ingredientId: cipolla.id,
      supplierId: supplier.id,
      operationalAreaId: cucina.id,
      storageLocationId: frigo1.id,
      supplierLotCode: "LOT-CIP-921",
      quantityReceived: 8,
      quantityAvailable: 6,
      unitOfMeasure: "kg",
      lowStockThreshold: 1.5,
      dateReceived: new Date("2026-03-10T07:40:00+01:00"),
      expiresAt: new Date("2026-03-18T23:59:00+01:00"),
      inboundTemperature: 4.1,
      conformityOutcome: true,
      operatorName: "Sara Cucina",
      allergens: []
    }
  });

  const recipe = await prisma.recipe.create({
    data: {
      name: "Sugo al pomodoro base",
      code: "RIC-SUGO-BASE",
      category: RecipeCategory.SEMILAVORATO,
      instructions: "Soffriggere cipolla in olio, aggiungere pomodoro e cuocere 45 minuti.",
      expectedYield: 5,
      yieldUnit: "kg",
      finalAllergens: [],
      standardShelfLifeDays: 3,
      items: {
        create: [
          { ingredientId: pomodoro.id, quantity: 4.5, unit: "kg" },
          { ingredientId: olio.id, quantity: 0.2, unit: "l" },
          { ingredientId: cipolla.id, quantity: 0.6, unit: "kg" }
        ]
      }
    }
  });

  const sugo = await prisma.batch.create({
    data: {
      code: "SG-20260313-01",
      kind: BatchKind.PRODUCTION,
      status: BatchStatus.ACTIVE,
      productName: "Sugo al pomodoro base",
      recipeId: recipe.id,
      operationalAreaId: laboratorio.id,
      storageLocationId: cellaSalse.id,
      quantityReceived: 5,
      quantityAvailable: 0,
      unitOfMeasure: "kg",
      lowStockThreshold: 1,
      producedAt: new Date("2026-03-13T10:15:00+01:00"),
      expiresAt: new Date("2026-03-16T10:15:00+01:00"),
      storageCondition: "0/+4 C",
      operatorName: "Sara Cucina",
      allergens: [],
      genealogySnapshot: {
        sourceBatches: ["POM-240311-A", "OLV-240308-B", "CIP-240310-C"]
      }
    }
  });

  await prisma.productionBatchItem.createMany({
    data: [
      { producedBatchId: sugo.id, consumedBatchId: lotPomodoro.id, ingredientId: pomodoro.id, quantityUsed: 4.5, unitOfMeasure: "kg" },
      { producedBatchId: sugo.id, consumedBatchId: lotOlio.id, ingredientId: olio.id, quantityUsed: 0.2, unitOfMeasure: "l" },
      { producedBatchId: sugo.id, consumedBatchId: lotCipolla.id, ingredientId: cipolla.id, quantityUsed: 0.6, unitOfMeasure: "kg" }
    ]
  });

  const derivedCodes = ["A", "B", "C", "D", "E"];
  for (const suffix of derivedCodes) {
    await prisma.batch.create({
      data: {
        code: `SG-20260313-01-${suffix}`,
        kind: BatchKind.DERIVED,
        status: BatchStatus.ACTIVE,
        productName: "Sugo al pomodoro base",
        recipeId: recipe.id,
        parentBatchId: sugo.id,
        operationalAreaId: laboratorio.id,
        storageLocationId: cellaSalse.id,
        quantityReceived: 1,
        quantityAvailable: 1,
        unitOfMeasure: "kg",
        lowStockThreshold: 0.2,
        producedAt: new Date("2026-03-13T10:15:00+01:00"),
        expiresAt: new Date("2026-03-16T10:15:00+01:00"),
        storageCondition: "0/+4 C",
        operatorName: "Sara Cucina",
        allergens: [],
        genealogySnapshot: {
          parentCode: "SG-20260313-01",
          sourceBatches: ["POM-240311-A", "OLV-240308-B", "CIP-240310-C"]
        }
      }
    });
  }

  const label = await prisma.batchLabel.create({
    data: {
      batchId: sugo.id,
      templateName: "Termica 58x40",
      qrPayload: "batch:SG-20260313-01",
      barcodeValue: "SG2026031301"
    }
  });

  await prisma.labelPrintLog.create({
    data: {
      labelId: label.id,
      userId: kitchenOperator.id,
      reason: "Ristampa etichetta per controllo linea fredda",
      copies: 1
    }
  });

  await prisma.batchMovement.createMany({
    data: [
      { batchId: sugo.id, movementType: "PRODUCED", quantity: 5, unitOfMeasure: "kg", reason: "Nuova produzione ricetta", performedBy: "Sara Cucina" },
      { batchId: sugo.id, movementType: "DERIVED", quantity: 5, unitOfMeasure: "kg", reason: "Creazione 5 sublotti da 1 kg", performedBy: "Sara Cucina" }
    ]
  });

  await prisma.haccpCheck.createMany({
    data: [
      { title: "Checklist apertura cucina", checklistType: "Apertura", status: CheckStatus.COMPLETED, dueAt: new Date("2026-03-13T07:30:00+01:00"), completedAt: new Date("2026-03-13T07:20:00+01:00"), operationalAreaId: cucina.id, assignedToId: kitchenOperator.id },
      { title: "Sanificazione banco pizza", checklistType: "Chiusura", status: CheckStatus.PENDING, dueAt: new Date("2026-03-13T23:00:00+01:00"), operationalAreaId: pizzeria.id, assignedToId: haccpManager.id }
    ]
  });

  await prisma.temperatureLog.createMany({
    data: [
      { title: "Frigo cucina 1", value: 3.2, minThreshold: 0, maxThreshold: 4, operationalAreaId: cucina.id, recordedById: kitchenOperator.id, isAlert: false },
      { title: "Cella salse", value: 6.8, minThreshold: 0, maxThreshold: 4, operationalAreaId: laboratorio.id, recordedById: haccpManager.id, isAlert: true, notes: "Verifica guarnizione porta." }
    ]
  });

  const nc = await prisma.nonConformity.create({
    data: {
      title: "Temperatura cella salse fuori soglia",
      description: "Rilevata temperatura +6.8 C per oltre 20 minuti.",
      severity: "Alta",
      status: NonConformityStatus.IN_PROGRESS
    }
  });

  await prisma.correctiveAction.create({
    data: {
      nonConformityId: nc.id,
      description: "Controllare guarnizione e spostare temporaneamente i semilavorati in frigo 1.",
      owner: "Marco HACCP",
      dueAt: new Date("2026-03-13T18:00:00+01:00")
    }
  });

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, entityType: "batch", entityId: sugo.id, action: "CREATE_PRODUCTION_BATCH", payload: { code: "SG-20260313-01" } },
      { userId: kitchenOperator.id, entityType: "label", entityId: label.id, action: "REPRINT_LABEL", payload: { reason: "Controllo linea fredda", copies: 1 } }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
