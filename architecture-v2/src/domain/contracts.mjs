/**
 * Pure structural checks for the next data-contract migration.
 * These checks are not authentication or authorization and must be repeated
 * server-side before any future write is enabled.
 */
const MAX_RECORDS_PER_COLLECTION = 10_000;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function checkCollection(name, rows, errors) {
  if (!Array.isArray(rows)) {
    errors.push(`${name} must be an array`);
    return;
  }
  if (rows.length > MAX_RECORDS_PER_COLLECTION) {
    errors.push(`${name} exceeds the maximum of ${MAX_RECORDS_PER_COLLECTION} records`);
    return;
  }
  const ids = new Set();
  rows.forEach((row, index) => {
    if (!isRecord(row)) {
      errors.push(`${name}[${index}] must be an object`);
      return;
    }
    if (row.id != null && String(row.id).trim()) {
      const id = String(row.id);
      if (ids.has(id)) errors.push(`${name} contains duplicate id "${id}"`);
      ids.add(id);
    }
  });
}

/** Validate an incoming dataset envelope without mutating or normalizing it. */
export function validateDatasetEnvelope(value) {
  const errors = [];
  if (!isRecord(value)) return { valid: false, errors: ["dataset must be an object"] };
  checkCollection("recipes", value.recipes, errors);
  checkCollection("restaurants", value.restaurants, errors);
  return { valid: errors.length === 0, errors };
}
