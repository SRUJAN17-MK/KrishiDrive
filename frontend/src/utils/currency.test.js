import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENCY_SYMBOL,
  formatINR,
  formatINRCompact,
  formatIndianNumber,
} from "./currency.js";

const RUPEE = "\u20B9";

test("symbol comes from ICU and is U+20B9", () => {
  assert.equal(CURRENCY_SYMBOL, RUPEE);
  assert.equal(CURRENCY_SYMBOL.codePointAt(0), 0x20b9);
  assert.equal(formatINR(1).charCodeAt(0), 0x20b9);
});

test("required amounts", () => {
  assert.equal(formatINR(922), "\u20B9922");
  assert.equal(formatINR(206), "\u20B9206");
  assert.equal(formatINR(32), "\u20B932");
  assert.equal(formatINR(125000), "\u20B91,25,000");
  assert.equal(formatINR(0), "\u20B90");
});

test("indian digit grouping", () => {
  assert.equal(formatINR(1000), "\u20B91,000");
  assert.equal(formatINR(100000), "\u20B91,00,000");
  assert.equal(formatINR(12345678), "\u20B91,23,45,678");
});

test("rounds to whole rupees by default", () => {
  assert.equal(formatINR(922.4), "\u20B9922");
  assert.equal(formatINR(922.6), "\u20B9923");
});

test("negatives keep the sign", () => {
  assert.equal(formatINR(-922), "-\u20B9922");
});

test("legacy strings are tolerated instead of producing \$NaN", () => {
  assert.equal(formatINR("\u20B9922"), "\u20B9922");
  assert.equal(formatINR("Rs. 1,25,000"), "\u20B91,25,000");
  assert.equal(formatINR(undefined), "\u20B90");
  assert.equal(formatINR(null), "\u20B90");
  assert.equal(formatINR("not a number"), "\u20B90");
  assert.equal(formatINR(NaN), "\u20B90");
});

test("compact notation for dashboard tiles", () => {
  assert.equal(formatINRCompact(922), "\u20B9922");
  assert.equal(formatINRCompact(3500), "\u20B93.5K");
  assert.equal(formatINRCompact(125000), "\u20B91.25L");
  assert.equal(formatINRCompact(500000000), "\u20B950Cr");
  assert.equal(formatINRCompact(0), "\u20B90");
});

test("plain numbers use indian grouping", () => {
  assert.equal(formatIndianNumber(125000), "1,25,000");
  assert.equal(formatIndianNumber(1250.5, { decimals: 1 }), "1,250.5");
});

test("no output ever contains the mangled sequences", () => {
  const samples = [922, 206, 32, 125000, 0, 3500, 500000000, "not a number"];
  for (const sample of samples) {
    for (const out of [formatINR(sample), formatINRCompact(sample)]) {
      assert.ok(!/[\u0393\u00E2\u00C3]/.test(out), `mangled output: ${out}`);
    }
  }
});
