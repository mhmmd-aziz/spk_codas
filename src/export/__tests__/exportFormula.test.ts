import { describe, expect, it } from "vitest";
import { calculateCodas } from "../../domain/codas/calculateCodas";
import { createJournalPresetModel } from "../../domain/codas/preset";
import type { CodasModel } from "../../domain/codas/types";
import { buildCodasWorkbook } from "../exportExcel";
import { buildCodasPdf } from "../exportPdf";
import { buildCodasWordBuffer } from "../exportWord";

function extractFormula(cellValue: unknown): string | null {
  if (
    cellValue &&
    typeof cellValue === "object" &&
    "formula" in cellValue &&
    typeof (cellValue as { formula?: unknown }).formula === "string"
  ) {
    return (cellValue as { formula: string }).formula;
  }
  return null;
}

describe("Formula-driven Excel and PDF export", () => {
  it("exports 7 sheets with real Excel formulas for the journal preset", async () => {
    const model = createJournalPresetModel();
    const workbook = await buildCodasWorkbook(model, "id");

    expect(workbook.worksheets.map((ws) => ws.name)).toEqual([
      "Guide",
      "Inputs",
      "Normalized",
      "Weighted",
      "Distances",
      "Relative",
      "Ranking",
    ]);
    expect(workbook.calcProperties.fullCalcOnLoad).toBe(true);

    // Check Inputs total weight formula
    const inputs = workbook.getWorksheet("Inputs")!;
    expect(extractFormula(inputs.getCell("E13").value)).toBe("SUM(E8:E12)");
    expect(extractFormula(inputs.getCell("F13").value)).toContain("IF(ABS(");

    // Check Normalized matrix (5x5 at D5:H9) uses IF/MAX/MIN formulas referencing Inputs
    const norm = workbook.getWorksheet("Normalized")!;
    for (let r = 5; r <= 9; r++) {
      for (const col of ["D", "E", "F", "G", "H"]) {
        const f = extractFormula(norm.getCell(`${col}${r}`).value);
        expect(f).not.toBeNull();
        expect(f).toContain("Inputs!");
        expect(f).toContain("MAX(");
        expect(f).toContain("MIN(");
      }
    }

    // Check Weighted matrix (D5:H9) and NS row (D11:H11)
    const weighted = workbook.getWorksheet("Weighted")!;
    for (let r = 5; r <= 9; r++) {
      for (const col of ["D", "E", "F", "G", "H"]) {
        const f = extractFormula(weighted.getCell(`${col}${r}`).value);
        expect(f).toMatch(/^Normalized![A-Z]+\d+\*[A-Z]+\$3$/);
      }
    }
    for (const col of ["D", "E", "F", "G", "H"]) {
      const nsF = extractFormula(weighted.getCell(`${col}11`).value);
      expect(nsF).toBe(`MIN(${col}5:${col}9)`);
    }

    // Check Distances E_i and T_i (D4:E8)
    const dist = workbook.getWorksheet("Distances")!;
    for (let r = 4; r <= 8; r++) {
      const eF = extractFormula(dist.getCell(`D${r}`).value);
      const tF = extractFormula(dist.getCell(`E${r}`).value);
      expect(eF).toMatch(/^SQRT\(SUM\(/);
      expect(tF).toMatch(/^SUM\(/);
    }

    // Check Relative matrix (C5:G9) references Distances and threshold $B$2
    const rel = workbook.getWorksheet("Relative")!;
    expect(extractFormula(rel.getCell("B2").value)).toBe("Inputs!$B$4");
    for (let r = 5; r <= 9; r++) {
      for (const col of ["C", "D", "E", "F", "G"]) {
        const f = extractFormula(rel.getCell(`${col}${r}`).value);
        expect(f).toContain("Distances!");
        expect(f).toContain("IF(ABS(");
        expect(f).toContain("$B$2");
      }
    }

    // Check Ranking sheet (F4:H8) uses SUM, RANK descending, and IF
    const rank = workbook.getWorksheet("Ranking")!;
    for (let r = 4; r <= 8; r++) {
      const hF = extractFormula(rank.getCell(`F${r}`).value);
      const rF = extractFormula(rank.getCell(`G${r}`).value);
      expect(hF).toBe(`SUM(Relative!C${r + 1}:G${r + 1})`);
      expect(rF).toBe(`RANK(F${r},$F$4:$F$8,0)`);
    }

    // Ensure every formula has a cached result, no broken tokens, and monochrome colors only
    workbook.worksheets.forEach((ws) => {
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          const f = extractFormula(cell.value);
          if (f) {
            expect(f).not.toContain("#REF!");
            expect(f).not.toContain("#DIV/0!");
            expect(f).not.toContain("#NAME?");
            expect(f).not.toContain("undefined");
            expect(cell.result).toBeDefined();
          }
          if (cell.fill && cell.fill.type === "pattern" && cell.fill.fgColor?.argb) {
            const hex = cell.fill.fgColor.argb;
            expect(hex.slice(2, 4)).toBe(hex.slice(4, 6));
            expect(hex.slice(4, 6)).toBe(hex.slice(6, 8));
          }
        });
      });
    });
  });

  it("adapts Excel formula ranges dynamically to custom model dimensions (3x4)", async () => {
    const custom: CodasModel = {
      tau: 0.03,
      criteria: [
        { id: "C1", nameId: "K1", nameEn: "C1", weight: 0.25, type: "benefit" },
        { id: "C2", nameId: "K2", nameEn: "C2", weight: 0.25, type: "cost" },
        { id: "C3", nameId: "K3", nameEn: "C3", weight: 0.25, type: "benefit" },
        { id: "C4", nameId: "K4", nameEn: "C4", weight: 0.25, type: "cost" },
      ],
      alternatives: [
        { id: "A1", nameId: "Alt 1", nameEn: "Alt 1", values: { C1: 8, C2: 4, C3: 9, C4: 5 } },
        { id: "A2", nameId: "Alt 2", nameEn: "Alt 2", values: { C1: 7, C2: 5, C3: 8, C4: 4 } },
        { id: "A3", nameId: "Alt 3", nameEn: "Alt 3", values: { C1: 9, C2: 3, C3: 7, C4: 6 } },
      ],
    };

    const workbook = await buildCodasWorkbook(custom, "en");
    const inputs = workbook.getWorksheet("Inputs")!;
    expect(extractFormula(inputs.getCell("E12").value)).toBe("SUM(E8:E11)");

    const rank = workbook.getWorksheet("Ranking")!;
    expect(extractFormula(rank.getCell("F4").value)).toBe("SUM(Relative!C5:E5)");
    expect(extractFormula(rank.getCell("G6").value)).toBe("RANK(F6,$F$4:$F$6,0)");
  });

  it("builds a multi-page PDF report from the active model", () => {
    const model = createJournalPresetModel();
    const { result } = calculateCodas(model);
    expect(result).not.toBeNull();
    const doc = buildCodasPdf(model, result!, "bilingual", 4);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
    const output = doc.output("arraybuffer");
    expect(output.byteLength).toBeGreaterThan(2000);
  });

  it("builds a complete Word (.docx) report from the active model", async () => {
    const model = createJournalPresetModel();
    const { result } = calculateCodas(model);
    expect(result).not.toBeNull();
    const bytes = await buildCodasWordBuffer(model, result!, "bilingual", 4);
    expect(bytes.byteLength).toBeGreaterThan(5000);
    // DOCX is an OpenXML zip container starting with PK header
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });
});
