import { formatDateTime } from "@/lib/utils";
import { generateDerivedCodes, validateDerivedAllocation } from "@/lib/domain/batches";

export const currentUser = {
  name: "Marco HACCP",
  role: "Responsabile HACCP"
};

export const dashboardStats = [
  { label: "Scadenze oggi", value: "4", tone: "danger" },
  { label: "Lotti in esaurimento", value: "3", tone: "warning" },
  { label: "Checklist incomplete", value: "2", tone: "danger" },
  { label: "Temperature fuori soglia", value: "1", tone: "danger" }
];

export const operationalAreas = [
  "Cucina ristorante",
  "Pizzeria",
  "Bar / colazioni",
  "Laboratorio preparazioni"
];

export const ingredients = [
  {
    id: "pomodoro-pelato",
    code: "POM-PEL",
    name: "Pomodoro pelato",
    category: "Conserve",
    unit: "kg",
    supplier: "OrtoSud Distribuzione",
    allergens: "Nessuno",
    shelfLife: "365 giorni",
    temperature: "Ambiente / 0-4 C dopo apertura"
  },
  {
    id: "olio-evo",
    code: "OLIO-EVO",
    name: "Olio extravergine di oliva",
    category: "Condimenti",
    unit: "l",
    supplier: "Frantoio Costa",
    allergens: "Nessuno",
    shelfLife: "540 giorni",
    temperature: "Luogo fresco e asciutto"
  },
  {
    id: "cipolla-bianca",
    code: "CIP-BIA",
    name: "Cipolla bianca",
    category: "Ortaggi",
    unit: "kg",
    supplier: "OrtoSud Distribuzione",
    allergens: "Nessuno",
    shelfLife: "14 giorni",
    temperature: "0-4 C"
  }
];

export const suppliers = [
  { name: "OrtoSud Distribuzione", contact: "ordini@ortosud.example", products: "Ortaggi, conserve", lots: 24 },
  { name: "Frantoio Costa", contact: "commerciale@frantoiocosta.example", products: "Olio EVO", lots: 8 }
];

export const inboundLots = [
  { batch: "POM-240311-A", ingredient: "Pomodoro pelato", supplierLot: "LOT-PD-311", quantity: "20 kg", expiry: "28 feb 2027", temperature: "16.2 C", outcome: "Conforme" },
  { batch: "CIP-240310-C", ingredient: "Cipolla bianca", supplierLot: "LOT-CIP-921", quantity: "8 kg", expiry: "18 mar 2026", temperature: "4.1 C", outcome: "Conforme" }
];

export const inventoryBatches = [
  { code: "POM-240311-A", product: "Pomodoro pelato", kind: "Fornitore", status: "Attivo", area: "Cucina", available: "15 kg", expiry: "28 feb 2027", parent: "-" },
  { code: "CIP-240310-C", product: "Cipolla bianca", kind: "Fornitore", status: "Attivo", area: "Cucina", available: "6 kg", expiry: "18 mar 2026", parent: "-" },
  { code: "SG-20260313-01", product: "Sugo al pomodoro base", kind: "Produzione", status: "Esaurito", area: "Laboratorio", available: "0 kg", expiry: "16 mar 2026", parent: "-" },
  { code: "SG-20260313-01-A", product: "Sugo al pomodoro base", kind: "Sublotto", status: "Attivo", area: "Laboratorio", available: "1 kg", expiry: "16 mar 2026", parent: "SG-20260313-01" }
];

export const recipes = [
  {
    code: "RIC-SUGO-BASE",
    name: "Sugo al pomodoro base",
    category: "Semilavorato",
    yield: "5 kg",
    shelfLife: "3 giorni",
    allergens: "Nessuno"
  }
];

export const productionExample = {
  batchCode: "SG-20260313-01",
  recipe: "Sugo al pomodoro base",
  area: "Laboratorio preparazioni",
  producedAt: formatDateTime("2026-03-13T10:15:00+01:00"),
  expiresAt: formatDateTime("2026-03-16T10:15:00+01:00"),
  operator: "Sara Cucina",
  output: "5 kg",
  ingredients: [
    { ingredient: "Pomodoro pelato", batch: "POM-240311-A", quantity: "4.5 kg" },
    { ingredient: "Olio extravergine di oliva", batch: "OLV-240308-B", quantity: "0.2 l" },
    { ingredient: "Cipolla bianca", batch: "CIP-240310-C", quantity: "0.6 kg" }
  ]
};

const derivedCodes = generateDerivedCodes("SG-20260313-01", 5);
const allocation = validateDerivedAllocation({ count: 5, quantityPerChild: 1, availableQuantity: 5 });

export const derivedExample = {
  parentCode: "SG-20260313-01",
  parentQuantity: "5 kg",
  operation: "Porzionamento in 5 contenitori da 1 kg",
  isValid: allocation.isValid,
  totalAllocated: `${allocation.total} kg`,
  childCodes: derivedCodes
};

export const traceabilityTree = {
  batch: "SG-20260313-01",
  children: [
    { batch: "POM-240311-A", type: "Ingrediente", detail: "Pomodoro pelato 4.5 kg" },
    { batch: "OLV-240308-B", type: "Ingrediente", detail: "Olio EVO 0.2 l" },
    { batch: "CIP-240310-C", type: "Ingrediente", detail: "Cipolla bianca 0.6 kg" },
    { batch: "SG-20260313-01-A", type: "Sublotto", detail: "Contenitore GN 1/6 - 1 kg" },
    { batch: "SG-20260313-01-B", type: "Sublotto", detail: "Contenitore GN 1/6 - 1 kg" },
    { batch: "SG-20260313-01-C", type: "Sublotto", detail: "Contenitore GN 1/6 - 1 kg" },
    { batch: "SG-20260313-01-D", type: "Sublotto", detail: "Contenitore GN 1/6 - 1 kg" },
    { batch: "SG-20260313-01-E", type: "Sublotto", detail: "Contenitore GN 1/6 - 1 kg" }
  ]
};

export const temperatureLogs = [
  { title: "Frigo cucina 1", value: "3.2 C", threshold: "0 / +4 C", area: "Cucina ristorante", status: "OK" },
  { title: "Cella salse", value: "6.8 C", threshold: "0 / +4 C", area: "Laboratorio preparazioni", status: "Fuori soglia" }
];

export const haccpChecks = [
  { title: "Checklist apertura cucina", due: "07:30", area: "Cucina ristorante", status: "Completata" },
  { title: "Sanificazione banco pizza", due: "23:00", area: "Pizzeria", status: "Da completare" }
];

export const nonConformities = [
  { title: "Temperatura cella salse fuori soglia", severity: "Alta", status: "In corso", action: "Spostare i semilavorati in frigo 1 e verificare guarnizione" }
];

export const documents = [
  { name: "Manuale HACCP 2026", type: "PDF", area: "Generale", updated: "13 mar 2026" },
  { name: "Scheda tecnica pomodoro pelato", type: "PDF", area: "Cucina", updated: "11 mar 2026" }
];

export const labelPrints = [
  { batch: "SG-20260313-01", user: "Sara Cucina", when: "13 mar 2026 11:02", reason: "Ristampa etichetta per controllo linea fredda", copies: 1 }
];

export const roleMatrix = [
  { role: "Admin", permissions: "Configurazione completa, utenti, template, export, audit" },
  { role: "Responsabile HACCP", permissions: "Checklist, temperature, non conformita', audit, documenti" },
  { role: "Responsabile cucina", permissions: "Produzione, ricette, magazzino, sublotti, etichette" },
  { role: "Operatore cucina", permissions: "Ricevimento, produzioni, sublotti, checklist assegnate" },
  { role: "Operatore bar/pizzeria", permissions: "Controlli area, lotti area, ristampe, ricevimento" },
  { role: "Supervisore / titolare", permissions: "Dashboard, report, audit e visibilita' completa" }
];
