/**
 * Generates a unique batch code from a product name.
 * Format: PREFIX-YYYYMMDD-NN (e.g., POM-20260315-42)
 */
export function generateBatchCode(productName: string): string {
  const prefix = productName
    .replace(/[^A-Za-z]/g, "")
    .substring(0, 3)
    .toUpperCase() || "LOT";
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 99) + 1).padStart(2, "0");
  return `${prefix}-${dateStr}-${seq}`;
}

export type DerivedBatchInput = {
  count: number;
  quantityPerChild: number;
  availableQuantity: number;
};

export function generateDerivedCodes(parentCode: string, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const suffix = String.fromCharCode("A".charCodeAt(0) + index);
    return `${parentCode}-${suffix}`;
  });
}

export function validateDerivedAllocation(input: DerivedBatchInput) {
  const total = input.count * input.quantityPerChild;
  return {
    total,
    isValid: total <= input.availableQuantity
  };
}

export function computeBatchStatus(available: number, threshold?: number, expired?: boolean) {
  if (expired) {
    return "EXPIRED";
  }
  if (available <= 0) {
    return "DEPLETED";
  }
  if (threshold && available <= threshold) {
    return "LOW_STOCK";
  }
  return "ACTIVE";
}
