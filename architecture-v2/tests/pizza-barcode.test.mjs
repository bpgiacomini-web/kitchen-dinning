import test from "node:test";
import assert from "node:assert/strict";
import { normalizeScannedUpc } from "../src/domain/pizza-barcode.mjs";

test("UPC and EAN barcode values retain leading zeroes", () => {
  assert.equal(normalizeScannedUpc("0012345678905"), "0012345678905");
  assert.equal(normalizeScannedUpc("012345678905"), "012345678905");
  assert.equal(normalizeScannedUpc("12345670"), "12345670");
});

test("barcode normalization rejects non-numeric or out-of-range values", () => {
  for (const value of ["", "1234567", "123456789012345", "UPC 012345678905", "1234-5678-90"]) {
    assert.equal(normalizeScannedUpc(value), null);
  }
});
