import { describe, expect, it } from "vitest";

import {
  abs,
  add,
  applyRatio,
  formatIDR,
  formatMoney,
  fromMinorUnits,
  isNegative,
  isPositive,
  isZero,
  negate,
  percentageOf,
  scaleFor,
  subtract,
  sum,
  toMinorUnits,
} from "@/lib/money";

describe("scaleFor", () => {
  it("mengembalikan 0 untuk IDR/JPY (tanpa desimal)", () => {
    expect(scaleFor("IDR")).toBe(0);
    expect(scaleFor("JPY")).toBe(0);
  });

  it("mengembalikan 2 untuk USD (default)", () => {
    expect(scaleFor("USD")).toBe(2);
  });

  it("case-insensitive dan fallback ke 2 untuk mata uang tak dikenal", () => {
    expect(scaleFor("idr")).toBe(0);
    expect(scaleFor("XYZ")).toBe(2);
  });
});

describe("toMinorUnits", () => {
  it("mengkonversi number IDR menjadi BigInt apa adanya (scale 0)", () => {
    expect(toMinorUnits(1500)).toBe(1500n);
    expect(toMinorUnits(0)).toBe(0n);
  });

  it("memproses string IDR dengan pemisah ribuan titik", () => {
    expect(toMinorUnits("1.500")).toBe(1500n);
  });

  it("menangani nilai negatif", () => {
    expect(toMinorUnits(-250)).toBe(-250n);
    expect(toMinorUnits("-250")).toBe(-250n);
  });

  it("mengkonversi desimal USD ke minor units", () => {
    expect(toMinorUnits("1500.50", "USD")).toBe(150050n);
    expect(toMinorUnits(10.5, "USD")).toBe(1050n);
  });

  it("memotong (truncate) desimal untuk IDR (scale 0)", () => {
    expect(toMinorUnits("1500.99", "IDR")).toBe(1500n);
  });

  it("melempar error untuk input kosong / tidak valid", () => {
    expect(() => toMinorUnits("")).toThrow();
    expect(() => toMinorUnits("abc")).toThrow();
  });
});

describe("fromMinorUnits", () => {
  it("mengembalikan number apa adanya untuk IDR", () => {
    expect(fromMinorUnits(1500n)).toBe(1500);
  });

  it("membagi dengan scale untuk USD", () => {
    expect(fromMinorUnits(150050n, "USD")).toBe(1500.5);
  });
});

describe("formatMoney / formatIDR", () => {
  it("memformat IDR tanpa desimal", () => {
    const formatted = formatIDR(1500n);
    // Terima variasi spasi/non-breaking space antar platform
    expect(formatted.replace(/\s/g, " ")).toMatch(/^Rp\s?1\.500$/);
  });

  it("memformat nilai besar dengan pemisah ribuan", () => {
    expect(formatIDR(1_000_000n)).toContain("1.000.000");
  });

  it("formatMoney USD memakai 2 desimal", () => {
    const formatted = formatMoney(150050n, "USD", "en-US");
    expect(formatted).toContain("1,500.50");
  });
});

describe("aritmetika minor units", () => {
  it("add & subtract", () => {
    expect(add(1000n, 500n)).toBe(1500n);
    expect(subtract(1000n, 250n)).toBe(750n);
  });

  it("sum menjumlahkan array", () => {
    expect(sum([100n, 200n, 300n])).toBe(600n);
    expect(sum([])).toBe(0n);
  });

  it("abs, negate, dan predikat tanda", () => {
    expect(abs(-500n)).toBe(500n);
    expect(negate(500n)).toBe(-500n);
    expect(isZero(0n)).toBe(true);
    expect(isNegative(-1n)).toBe(true);
    expect(isPositive(1n)).toBe(true);
  });
});

describe("applyRatio", () => {
  it("menghitung setengah dan persentase", () => {
    expect(applyRatio(1000n, 0.5)).toBe(500n);
    expect(applyRatio(1000n, 0.15)).toBe(150n);
  });

  it("melempar error untuk ratio non-finite", () => {
    expect(() => applyRatio(1000n, Number.NaN)).toThrow();
  });
});

describe("percentageOf", () => {
  it("menghitung persentase", () => {
    expect(percentageOf(50n, 200n)).toBe(25);
  });

  it("mengembalikan 0 jika total 0", () => {
    expect(percentageOf(50n, 0n)).toBe(0);
  });
});
