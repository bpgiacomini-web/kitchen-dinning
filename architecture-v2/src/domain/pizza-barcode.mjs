export function normalizeScannedUpc(value) {
  const code = String(value ?? "").trim();
  return /^\d{8,14}$/.test(code) ? code : null;
}
