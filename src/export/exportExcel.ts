import ExcelJS from "exceljs";
import { computeCodasRaw } from "../domain/codas/calculateCodas";
import { JOURNAL_REFERENCE } from "../domain/codas/preset";
import type { CodasModel, Language } from "../domain/codas/types";

export function colLetter(colIndex1Based: number): string {
  let n = colIndex1Based;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

// Strict monochrome (black, white, neutral grayscale) styling
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF111111" },
};

const SUBHEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE6E6E6" },
};

const INPUT_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFFFF" },
};

const FORMULA_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF5F5F5" },
};

const HIGHLIGHT_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFDCDCDC" },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FF404040" } },
  left: { style: "thin", color: { argb: "FF404040" } },
  bottom: { style: "thin", color: { argb: "FF404040" } },
  right: { style: "thin", color: { argb: "FF404040" } },
};

const INPUT_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: "medium", color: { argb: "FF000000" } },
  left: { style: "medium", color: { argb: "FF000000" } },
  bottom: { style: "medium", color: { argb: "FF000000" } },
  right: { style: "medium", color: { argb: "FF000000" } },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: "Calibri",
  size: 11,
  bold: true,
  color: { argb: "FFFFFFFF" },
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
  name: "Calibri",
  size: 14,
  bold: true,
  color: { argb: "FF000000" },
};

const SECTION_FONT: Partial<ExcelJS.Font> = {
  name: "Calibri",
  size: 11,
  bold: true,
  color: { argb: "FF111111" },
};

const INPUT_FONT: Partial<ExcelJS.Font> = {
  name: "Calibri",
  size: 11,
  color: { argb: "FF000000" },
};

const FORMULA_FONT: Partial<ExcelJS.Font> = {
  name: "Calibri",
  size: 11,
  color: { argb: "FF1A1A1A" },
};

function styleHeaderRow(row: ExcelJS.Row, colCount: number): void {
  row.height = 24;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  }
}

export async function buildCodasWorkbook(
  model: CodasModel,
  lang: Language = "id",
): Promise<ExcelJS.Workbook> {
  const m = model.criteria.length;
  const n = model.alternatives.length;
  const computed = computeCodasRaw(model);
  const totalWeightVal = model.criteria.reduce((acc, c) => acc + c.weight, 0);
  const weightStatusStr =
    Math.abs(totalWeightVal - 1) <= 0.0001 ? "OK" : "Check Sum = 1";

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CODAS Decision Support System";
  workbook.created = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const guideSheet = workbook.addWorksheet("Guide");
  const inputsSheet = workbook.addWorksheet("Inputs");
  const normSheet = workbook.addWorksheet("Normalized");
  const weightedSheet = workbook.addWorksheet("Weighted");
  const distSheet = workbook.addWorksheet("Distances");
  const relSheet = workbook.addWorksheet("Relative");
  const rankSheet = workbook.addWorksheet("Ranking");

  // =========================================================================
  // 1. GUIDE SHEET
  // =========================================================================
  guideSheet.getColumn(1).width = 26;
  guideSheet.getColumn(2).width = 60;
  guideSheet.getColumn(3).width = 60;

  guideSheet.getCell("A1").value =
    "CODAS Decision Support System - Formula-Driven Workbook";
  guideSheet.getCell("A1").font = TITLE_FONT;
  guideSheet.getCell("A2").value =
    lang === "id"
      ? "Panduan Penggunaan & Referensi Metodologi (Indonesia / English)"
      : "User Guide & Methodology Reference (English / Indonesia)";
  guideSheet.getCell("A2").font = SECTION_FONT;

  const guideRows: Array<[string, string, string]> = [
    ["Section / Bagian", "Bahasa Indonesia", "English"],
    [
      "Referensi Jurnal / Citation",
      JOURNAL_REFERENCE.citationId,
      JOURNAL_REFERENCE.citationEn,
    ],
    [
      "Cara Kerja / How It Works",
      "Sel berwarna putih berbingkai tebal pada lembar Inputs adalah sel input yang dapat diubah (nilai keputusan, bobot, tipe Benefit/Cost, dan tau). Seluruh sel perhitungan berlatar abu-abu pada lembar Normalized, Weighted, Distances, Relative, dan Ranking menggunakan formula Excel asli (=IF, =MAX, =MIN, =SQRT, =SUM, =ABS, =RANK) yang menghitung ulang otomatis.",
      "White cells with bold black borders on the Inputs sheet are editable inputs (decision values, weights, Benefit/Cost types, and tau). All gray-shaded calculation cells across Normalized, Weighted, Distances, Relative, and Ranking use real Excel formulas (=IF, =MAX, =MIN, =SQRT, =SUM, =ABS, =RANK) that recalculate automatically.",
    ],
    [
      "Batasan Struktur / Scope",
      "Mengubah nilai x_ij, bobot w_j, tipe Benefit/Cost, atau tau di Excel akan memperbarui seluruh hasil secara otomatis. Namun, jika Anda ingin menambah atau menghapus jumlah kriteria maupun alternatif, lakukan pada aplikasi web lalu ekspor ulang workbook baru.",
      "Editing x_ij values, weights w_j, Benefit/Cost types, or tau in Excel updates all dependent outputs automatically. To add or remove criteria or alternatives structurally, update the model in the web application and export a fresh workbook.",
    ],
    [
      "Aturan Seri / Tie Rule",
      "Peringkat menggunakan fungsi =RANK(score, range, 0) secara menurun (skor H_i tertinggi = peringkat 1). Nilai yang identik memperoleh peringkat yang sama.",
      "Ranking uses =RANK(score, range, 0) in descending order (highest H_i = rank 1). Tied scores receive identical ranks.",
    ],
    [
      "Lembar 1: Guide",
      "Petunjuk penggunaan, referensi metodologi, dan penjelasan formula.",
      "Instructions, methodology reference, and formula explanations.",
    ],
    [
      "Lembar 2: Inputs",
      "Parameter ambang tau, tabel kriteria (tipe & bobot), dan matriks keputusan X.",
      "Threshold parameter tau, criteria table (type & weight), and decision matrix X.",
    ],
    [
      "Lembar 3: Normalized",
      "Normalisasi linear: Benefit = x_ij / MAX, Cost = MIN / x_ij (dengan penjaga pembagian nol).",
      "Linear normalization: Benefit = x_ij / MAX, Cost = MIN / x_ij (with zero-division guards).",
    ],
    [
      "Lembar 4: Weighted",
      "Matriks terbobot r_ij = w_j * n_ij serta vektor solusi ideal negatif ns_j = MIN(r_ij).",
      "Weighted normalized matrix r_ij = w_j * n_ij and negative-ideal vector ns_j = MIN(r_ij).",
    ],
    [
      "Lembar 5: Distances",
      "Jarak Euclidean E_i = SQRT(SUM((r_ij - ns_j)^2)) dan Taxicab T_i = SUM(|r_ij - ns_j|), lengkap dengan tabel kontribusi deviasi kuadrat dan deviasi absolut per kriteria.",
      "Euclidean E_i = SQRT(SUM((r_ij - ns_j)^2)) and Taxicab T_i = SUM(|r_ij - ns_j|) distances, including per-criterion squared and absolute deviation tables.",
    ],
    [
      "Lembar 6: Relative",
      "Matriks penilaian relatif h_ik = (E_i - E_k) + IF(ABS(E_i - E_k) >= tau, 1, 0) * (T_i - T_k).",
      "Relative assessment matrix h_ik = (E_i - E_k) + IF(ABS(E_i - E_k) >= tau, 1, 0) * (T_i - T_k).",
    ],
    [
      "Lembar 7: Ranking",
      "Skor penilaian H_i = SUM(baris h_ik) dan peringkat menurun RANK.",
      "Assessment score H_i = SUM(row h_ik) and descending RANK.",
    ],
  ];

  guideRows.forEach((vals, idx) => {
    const rowNum = 4 + idx;
    const row = guideSheet.getRow(rowNum);
    row.values = vals;
    if (idx === 0) {
      styleHeaderRow(row, 3);
    } else {
      row.height = 44;
      for (let c = 1; c <= 3; c++) {
        const cell = row.getCell(c);
        cell.border = THIN_BORDER;
        cell.alignment = { vertical: "top", wrapText: true };
        cell.font = {
          name: "Calibri",
          size: 10,
          bold: c === 1,
          color: { argb: "FF000000" },
        };
        cell.fill = c === 1 ? SUBHEADER_FILL : INPUT_FILL;
      }
    }
  });

  // =========================================================================
  // 2. INPUTS SHEET
  // =========================================================================
  const CRIT_START_ROW = 8;
  const CRIT_END_ROW = 7 + m;
  const CRIT_TOTAL_ROW = 8 + m;
  const DM_TITLE_ROW = 10 + m;
  const DM_HEADER_ROW = 11 + m;
  const DM_START_ROW = 12 + m;
  const DM_END_ROW = 11 + m + n;

  inputsSheet.getCell("A1").value =
    lang === "id"
      ? "INPUT MODEL CODAS (SEL PUTIH BERBINGKAI TEBAL DAPAT DIUBAH)"
      : "CODAS MODEL INPUTS (WHITE CELLS WITH BOLD BORDER ARE EDITABLE)";
  inputsSheet.getCell("A1").font = TITLE_FONT;
  inputsSheet.getCell("A2").value =
    lang === "id"
      ? "Perubahan nilai pada lembar ini otomatis menghitung ulang seluruh lembar perhitungan."
      : "Edits on this sheet automatically recalculate all dependent calculation sheets.";
  inputsSheet.getCell("A2").font = {
    name: "Calibri",
    size: 10,
    italic: true,
    color: { argb: "FF333333" },
  };

  inputsSheet.getCell("A4").value = "Threshold (tau)";
  inputsSheet.getCell("A4").font = SECTION_FONT;
  inputsSheet.getCell("A4").fill = SUBHEADER_FILL;
  inputsSheet.getCell("A4").border = THIN_BORDER;

  const tauCell = inputsSheet.getCell("B4");
  tauCell.value = model.tau;
  tauCell.numFmt = "0.0000";
  tauCell.fill = INPUT_FILL;
  tauCell.font = INPUT_FONT;
  tauCell.border = INPUT_BORDER;

  inputsSheet.getCell("C4").value =
    lang === "id"
      ? "Rentang anjuran jurnal: 0.01 - 0.05 (default 0.02)"
      : "Recommended journal range: 0.01 - 0.05 (default 0.02)";
  inputsSheet.getCell("C4").font = {
    name: "Calibri",
    size: 10,
    italic: true,
    color: { argb: "FF333333" },
  };

  inputsSheet.getCell("A6").value =
    lang === "id" ? "KONFIGURASI KRITERIA" : "CRITERIA CONFIGURATION";
  inputsSheet.getCell("A6").font = SECTION_FONT;

  const critHeaderRow = inputsSheet.getRow(7);
  critHeaderRow.values = [
    "ID",
    "Name (ID)",
    "Name (EN)",
    "Type (Benefit/Cost)",
    "Weight (w_j)",
  ];
  styleHeaderRow(critHeaderRow, 5);

  model.criteria.forEach((c, j) => {
    const r = CRIT_START_ROW + j;
    const row = inputsSheet.getRow(r);
    row.getCell(1).value = c.id;
    row.getCell(2).value = c.nameId;
    row.getCell(3).value = c.nameEn;
    row.getCell(4).value = c.type === "benefit" ? "Benefit" : "Cost";
    row.getCell(5).value = c.weight;
    row.getCell(5).numFmt = "0.0000";

    row.getCell(4).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: ['"Benefit,Cost"'],
      showErrorMessage: true,
      errorTitle: "Invalid Criterion Type",
      error: "Choose Benefit or Cost.",
    };

    for (let col = 1; col <= 5; col++) {
      const cell = row.getCell(col);
      cell.border = col >= 2 ? INPUT_BORDER : THIN_BORDER;
      cell.fill = col >= 2 ? INPUT_FILL : FORMULA_FILL;
      cell.font = col >= 2 ? INPUT_FONT : FORMULA_FONT;
      cell.alignment = {
        vertical: "middle",
        horizontal: col === 1 || col === 4 ? "center" : col === 5 ? "right" : "left",
      };
    }
  });

  const totalRow = inputsSheet.getRow(CRIT_TOTAL_ROW);
  totalRow.getCell(4).value = lang === "id" ? "Total Bobot" : "Total Weight";
  totalRow.getCell(4).font = SECTION_FONT;
  totalRow.getCell(4).fill = SUBHEADER_FILL;
  totalRow.getCell(4).border = THIN_BORDER;

  const totalWeightCell = totalRow.getCell(5);
  totalWeightCell.value = {
    formula: `SUM(E${CRIT_START_ROW}:E${CRIT_END_ROW})`,
    result: totalWeightVal,
  };
  totalWeightCell.numFmt = "0.0000";
  totalWeightCell.font = { ...FORMULA_FONT, bold: true };
  totalWeightCell.fill = HIGHLIGHT_FILL;
  totalWeightCell.border = THIN_BORDER;

  const totalStatusCell = totalRow.getCell(6);
  totalStatusCell.value = {
    formula: `IF(ABS(E${CRIT_TOTAL_ROW}-1)<=0.0001,"OK","Check Sum = 1")`,
    result: weightStatusStr,
  };
  totalStatusCell.font = { ...FORMULA_FONT, bold: true };
  totalStatusCell.fill = HIGHLIGHT_FILL;
  totalStatusCell.border = THIN_BORDER;
  totalStatusCell.alignment = { vertical: "middle", horizontal: "center" };

  inputsSheet.getCell(`A${DM_TITLE_ROW}`).value =
    lang === "id" ? "MATRIKS KEPUTUSAN (X)" : "DECISION MATRIX (X)";
  inputsSheet.getCell(`A${DM_TITLE_ROW}`).font = SECTION_FONT;

  const dmHeader = inputsSheet.getRow(DM_HEADER_ROW);
  dmHeader.getCell(1).value = "ID";
  dmHeader.getCell(2).value = "Name (ID)";
  dmHeader.getCell(3).value = "Name (EN)";
  model.criteria.forEach((c, j) => {
    const critRow = CRIT_START_ROW + j;
    dmHeader.getCell(4 + j).value = {
      formula: `A${critRow}&" - "&${lang === "id" ? "B" : "C"}${critRow}`,
      result: `${c.id} - ${lang === "id" ? c.nameId : c.nameEn}`,
    };
  });
  styleHeaderRow(dmHeader, 3 + m);

  model.alternatives.forEach((alt, i) => {
    const r = DM_START_ROW + i;
    const row = inputsSheet.getRow(r);
    row.getCell(1).value = alt.id;
    row.getCell(2).value = alt.nameId;
    row.getCell(3).value = alt.nameEn;

    for (let col = 1; col <= 3; col++) {
      const cell = row.getCell(col);
      cell.border = col >= 2 ? INPUT_BORDER : THIN_BORDER;
      cell.fill = col >= 2 ? INPUT_FILL : FORMULA_FILL;
      cell.font = col >= 2 ? INPUT_FONT : FORMULA_FONT;
    }

    model.criteria.forEach((c, j) => {
      const cell = row.getCell(4 + j);
      cell.value = alt.values[c.id] ?? 0;
      cell.numFmt = "0.0000";
      cell.fill = INPUT_FILL;
      cell.font = INPUT_FONT;
      cell.border = INPUT_BORDER;
      cell.alignment = { vertical: "middle", horizontal: "right" };
    });
  });

  inputsSheet.getColumn(1).width = 16;
  inputsSheet.getColumn(2).width = 28;
  inputsSheet.getColumn(3).width = 28;
  inputsSheet.getColumn(4).width = 20;
  for (let j = 0; j < m; j++) {
    inputsSheet.getColumn(4 + j).width = Math.max(
      inputsSheet.getColumn(4 + j).width ?? 14,
      20,
    );
  }
  inputsSheet.getColumn(6).width = 18;

  // =========================================================================
  // 3. NORMALIZED SHEET
  // =========================================================================
  normSheet.getCell("A1").value =
    lang === "id"
      ? "MATRIKS KEPUTUSAN TERNORMALISASI (N)"
      : "NORMALIZED DECISION MATRIX (N)";
  normSheet.getCell("A1").font = TITLE_FONT;

  normSheet.getCell("C3").value = "Type";
  normSheet.getCell("C3").font = SECTION_FONT;
  normSheet.getCell("C3").fill = SUBHEADER_FILL;
  normSheet.getCell("C3").border = THIN_BORDER;
  model.criteria.forEach((c, j) => {
    const cell = normSheet.getRow(3).getCell(4 + j);
    cell.value = {
      formula: `Inputs!D${CRIT_START_ROW + j}`,
      result: c.type === "benefit" ? "Benefit" : "Cost",
    };
    cell.font = { ...FORMULA_FONT, bold: true };
    cell.fill = SUBHEADER_FILL;
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const normHeader = normSheet.getRow(4);
  normHeader.getCell(1).value = "ID";
  normHeader.getCell(2).value = "Name (ID)";
  normHeader.getCell(3).value = "Name (EN)";
  model.criteria.forEach((c, j) => {
    normHeader.getCell(4 + j).value = {
      formula: `Inputs!A${CRIT_START_ROW + j}&" - "&Inputs!${lang === "id" ? "B" : "C"}${CRIT_START_ROW + j}`,
      result: `${c.id} - ${lang === "id" ? c.nameId : c.nameEn}`,
    };
  });
  styleHeaderRow(normHeader, 3 + m);

  for (let i = 0; i < n; i++) {
    const alt = model.alternatives[i];
    const r = 5 + i;
    const dmR = DM_START_ROW + i;
    const row = normSheet.getRow(r);
    row.getCell(1).value = { formula: `Inputs!A${dmR}`, result: alt.id };
    row.getCell(2).value = { formula: `Inputs!B${dmR}`, result: alt.nameId };
    row.getCell(3).value = { formula: `Inputs!C${dmR}`, result: alt.nameEn };

    for (let col = 1; col <= 3; col++) {
      const cell = row.getCell(col);
      cell.border = THIN_BORDER;
      cell.fill = FORMULA_FILL;
      cell.font = FORMULA_FONT;
    }

    for (let j = 0; j < m; j++) {
      const colL = colLetter(4 + j);
      const typeRef = `Inputs!$D$${CRIT_START_ROW + j}`;
      const xCell = `Inputs!${colL}${dmR}`;
      const colRange = `Inputs!${colL}$${DM_START_ROW}:${colL}$${DM_END_ROW}`;
      const formula = `IF(${typeRef}="Benefit",IF(MAX(${colRange})=0,0,${xCell}/MAX(${colRange})),IF(${xCell}=0,0,MIN(${colRange})/${xCell}))`;

      const cell = row.getCell(4 + j);
      cell.value = { formula, result: computed.normalizedMatrix[i][j] };
      cell.numFmt = "0.000000";
      cell.fill = FORMULA_FILL;
      cell.font = FORMULA_FONT;
      cell.border = THIN_BORDER;
    }
  }

  normSheet.getColumn(1).width = 12;
  normSheet.getColumn(2).width = 24;
  normSheet.getColumn(3).width = 24;
  for (let j = 0; j < m; j++) normSheet.getColumn(4 + j).width = 20;

  // =========================================================================
  // 4. WEIGHTED SHEET
  // =========================================================================
  const WEIGHTED_START_ROW = 5;
  const WEIGHTED_END_ROW = 4 + n;
  const NS_ROW = 6 + n;

  weightedSheet.getCell("A1").value =
    lang === "id"
      ? "MATRIKS TERNORMALISASI TERBOBOT (R) & SOLUSI IDEAL NEGATIF (NS)"
      : "WEIGHTED NORMALIZED MATRIX (R) & NEGATIVE-IDEAL SOLUTION (NS)";
  weightedSheet.getCell("A1").font = TITLE_FONT;

  weightedSheet.getCell("C3").value = "Weight (w_j)";
  weightedSheet.getCell("C3").font = SECTION_FONT;
  weightedSheet.getCell("C3").fill = SUBHEADER_FILL;
  weightedSheet.getCell("C3").border = THIN_BORDER;
  model.criteria.forEach((c, j) => {
    const cell = weightedSheet.getRow(3).getCell(4 + j);
    cell.value = {
      formula: `Inputs!E${CRIT_START_ROW + j}`,
      result: c.weight,
    };
    cell.numFmt = "0.0000";
    cell.font = { ...FORMULA_FONT, bold: true };
    cell.fill = SUBHEADER_FILL;
    cell.border = THIN_BORDER;
  });

  const wHeader = weightedSheet.getRow(4);
  wHeader.getCell(1).value = "ID";
  wHeader.getCell(2).value = "Name (ID)";
  wHeader.getCell(3).value = "Name (EN)";
  model.criteria.forEach((c, j) => {
    wHeader.getCell(4 + j).value = {
      formula: `Inputs!A${CRIT_START_ROW + j}&" - "&Inputs!${lang === "id" ? "B" : "C"}${CRIT_START_ROW + j}`,
      result: `${c.id} - ${lang === "id" ? c.nameId : c.nameEn}`,
    };
  });
  styleHeaderRow(wHeader, 3 + m);

  for (let i = 0; i < n; i++) {
    const alt = model.alternatives[i];
    const r = WEIGHTED_START_ROW + i;
    const dmR = DM_START_ROW + i;
    const row = weightedSheet.getRow(r);
    row.getCell(1).value = { formula: `Inputs!A${dmR}`, result: alt.id };
    row.getCell(2).value = { formula: `Inputs!B${dmR}`, result: alt.nameId };
    row.getCell(3).value = { formula: `Inputs!C${dmR}`, result: alt.nameEn };

    for (let col = 1; col <= 3; col++) {
      const cell = row.getCell(col);
      cell.border = THIN_BORDER;
      cell.fill = FORMULA_FILL;
      cell.font = FORMULA_FONT;
    }

    for (let j = 0; j < m; j++) {
      const colL = colLetter(4 + j);
      const cell = row.getCell(4 + j);
      cell.value = {
        formula: `Normalized!${colL}${r}*${colL}$3`,
        result: computed.weightedNormalizedMatrix[i][j],
      };
      cell.numFmt = "0.000000";
      cell.fill = FORMULA_FILL;
      cell.font = FORMULA_FONT;
      cell.border = THIN_BORDER;
    }
  }

  const nsRow = weightedSheet.getRow(NS_ROW);
  nsRow.getCell(1).value = "NS";
  nsRow.getCell(2).value = "Solusi Ideal Negatif";
  nsRow.getCell(3).value = "Negative-Ideal Solution";
  for (let col = 1; col <= 3; col++) {
    const cell = nsRow.getCell(col);
    cell.fill = HIGHLIGHT_FILL;
    cell.font = { ...FORMULA_FONT, bold: true };
    cell.border = THIN_BORDER;
  }
  for (let j = 0; j < m; j++) {
    const colL = colLetter(4 + j);
    const cell = nsRow.getCell(4 + j);
    cell.value = {
      formula: `MIN(${colL}${WEIGHTED_START_ROW}:${colL}${WEIGHTED_END_ROW})`,
      result: computed.negativeIdeal[j],
    };
    cell.numFmt = "0.000000";
    cell.fill = HIGHLIGHT_FILL;
    cell.font = { ...FORMULA_FONT, bold: true };
    cell.border = THIN_BORDER;
  }

  weightedSheet.getColumn(1).width = 12;
  weightedSheet.getColumn(2).width = 24;
  weightedSheet.getColumn(3).width = 24;
  for (let j = 0; j < m; j++) weightedSheet.getColumn(4 + j).width = 20;

  // =========================================================================
  // 5. DISTANCES SHEET (Summary + Per-Criterion Squared & Absolute Deviations)
  // =========================================================================
  const DIST_START_ROW = 4;
  const SQ_TITLE_ROW = 5 + n;
  const SQ_HEADER_ROW = 6 + n;
  const SQ_START_ROW = 7 + n;
  const ABS_TITLE_ROW = 8 + 2 * n;
  const ABS_HEADER_ROW = 9 + 2 * n;
  const ABS_START_ROW = 10 + 2 * n;
  const lastCritCol = colLetter(3 + m);

  distSheet.getCell("A1").value =
    lang === "id"
      ? "JARAK EUCLIDEAN (E_i) DAN TAXICAB (T_i)"
      : "EUCLIDEAN (E_i) AND TAXICAB (T_i) DISTANCES";
  distSheet.getCell("A1").font = TITLE_FONT;

  const distHeader = distSheet.getRow(3);
  distHeader.values = [
    "ID",
    "Name (ID)",
    "Name (EN)",
    "Euclidean Distance (E_i)",
    "Taxicab Distance (T_i)",
  ];
  styleHeaderRow(distHeader, 5);

  for (let i = 0; i < n; i++) {
    const alt = model.alternatives[i];
    const r = DIST_START_ROW + i;
    const dmR = DM_START_ROW + i;
    const sqR = SQ_START_ROW + i;
    const absR = ABS_START_ROW + i;

    const row = distSheet.getRow(r);
    row.getCell(1).value = { formula: `Inputs!A${dmR}`, result: alt.id };
    row.getCell(2).value = { formula: `Inputs!B${dmR}`, result: alt.nameId };
    row.getCell(3).value = { formula: `Inputs!C${dmR}`, result: alt.nameEn };
    row.getCell(4).value = {
      formula: `SQRT(SUM(D${sqR}:${lastCritCol}${sqR}))`,
      result: computed.euclideanDistances[i],
    };
    row.getCell(5).value = {
      formula: `SUM(D${absR}:${lastCritCol}${absR})`,
      result: computed.taxicabDistances[i],
    };
    row.getCell(4).numFmt = "0.000000";
    row.getCell(5).numFmt = "0.000000";

    for (let col = 1; col <= 5; col++) {
      const cell = row.getCell(col);
      cell.border = THIN_BORDER;
      cell.fill = FORMULA_FILL;
      cell.font = col >= 4 ? { ...FORMULA_FONT, bold: true } : FORMULA_FONT;
    }
  }

  distSheet.getCell(`A${SQ_TITLE_ROW}`).value =
    lang === "id"
      ? "KONTRIBUSI KUADRAT DEVIASI: (r_ij - ns_j)^2"
      : "SQUARED DEVIATION CONTRIBUTIONS: (r_ij - ns_j)^2";
  distSheet.getCell(`A${SQ_TITLE_ROW}`).font = SECTION_FONT;

  const sqHeader = distSheet.getRow(SQ_HEADER_ROW);
  sqHeader.getCell(1).value = "ID";
  sqHeader.getCell(2).value = "Name (ID)";
  sqHeader.getCell(3).value = "Name (EN)";
  model.criteria.forEach((c, j) => {
    sqHeader.getCell(4 + j).value = {
      formula: `Inputs!A${CRIT_START_ROW + j}`,
      result: c.id,
    };
  });
  styleHeaderRow(sqHeader, 3 + m);

  for (let i = 0; i < n; i++) {
    const alt = model.alternatives[i];
    const r = SQ_START_ROW + i;
    const wR = WEIGHTED_START_ROW + i;
    const dmR = DM_START_ROW + i;
    const row = distSheet.getRow(r);
    row.getCell(1).value = { formula: `Inputs!A${dmR}`, result: alt.id };
    row.getCell(2).value = { formula: `Inputs!B${dmR}`, result: alt.nameId };
    row.getCell(3).value = { formula: `Inputs!C${dmR}`, result: alt.nameEn };
    for (let col = 1; col <= 3; col++) {
      row.getCell(col).border = THIN_BORDER;
      row.getCell(col).fill = FORMULA_FILL;
      row.getCell(col).font = FORMULA_FONT;
    }
    for (let j = 0; j < m; j++) {
      const colL = colLetter(4 + j);
      const cell = row.getCell(4 + j);
      cell.value = {
        formula: `(Weighted!${colL}${wR}-Weighted!${colL}$${NS_ROW})^2`,
        result: computed.distanceBreakdowns[i].perCriterionSquaredDiff[j],
      };
      cell.numFmt = "0.000000";
      cell.border = THIN_BORDER;
      cell.fill = FORMULA_FILL;
      cell.font = FORMULA_FONT;
    }
  }

  distSheet.getCell(`A${ABS_TITLE_ROW}`).value =
    lang === "id"
      ? "KONTRIBUSI DEVIASI ABSOLUT: |r_ij - ns_j|"
      : "ABSOLUTE DEVIATION CONTRIBUTIONS: |r_ij - ns_j|";
  distSheet.getCell(`A${ABS_TITLE_ROW}`).font = SECTION_FONT;

  const absHeader = distSheet.getRow(ABS_HEADER_ROW);
  absHeader.getCell(1).value = "ID";
  absHeader.getCell(2).value = "Name (ID)";
  absHeader.getCell(3).value = "Name (EN)";
  model.criteria.forEach((c, j) => {
    absHeader.getCell(4 + j).value = {
      formula: `Inputs!A${CRIT_START_ROW + j}`,
      result: c.id,
    };
  });
  styleHeaderRow(absHeader, 3 + m);

  for (let i = 0; i < n; i++) {
    const alt = model.alternatives[i];
    const r = ABS_START_ROW + i;
    const wR = WEIGHTED_START_ROW + i;
    const dmR = DM_START_ROW + i;
    const row = distSheet.getRow(r);
    row.getCell(1).value = { formula: `Inputs!A${dmR}`, result: alt.id };
    row.getCell(2).value = { formula: `Inputs!B${dmR}`, result: alt.nameId };
    row.getCell(3).value = { formula: `Inputs!C${dmR}`, result: alt.nameEn };
    for (let col = 1; col <= 3; col++) {
      row.getCell(col).border = THIN_BORDER;
      row.getCell(col).fill = FORMULA_FILL;
      row.getCell(col).font = FORMULA_FONT;
    }
    for (let j = 0; j < m; j++) {
      const colL = colLetter(4 + j);
      const cell = row.getCell(4 + j);
      cell.value = {
        formula: `ABS(Weighted!${colL}${wR}-Weighted!${colL}$${NS_ROW})`,
        result: computed.distanceBreakdowns[i].perCriterionAbsDiff[j],
      };
      cell.numFmt = "0.000000";
      cell.border = THIN_BORDER;
      cell.fill = FORMULA_FILL;
      cell.font = FORMULA_FONT;
    }
  }

  distSheet.getColumn(1).width = 12;
  distSheet.getColumn(2).width = 24;
  distSheet.getColumn(3).width = 24;
  distSheet.getColumn(4).width = 24;
  distSheet.getColumn(5).width = 24;
  for (let j = 2; j < m; j++) distSheet.getColumn(4 + j).width = 18;

  // =========================================================================
  // 6. RELATIVE SHEET (n x n matrix h_ik)
  // =========================================================================
  const REL_START_ROW = 5;
  const lastRelCol = colLetter(2 + n);

  relSheet.getCell("A1").value =
    lang === "id"
      ? "MATRIKS PENILAIAN RELATIF (h_ik)"
      : "RELATIVE ASSESSMENT MATRIX (h_ik)";
  relSheet.getCell("A1").font = TITLE_FONT;

  relSheet.getCell("A2").value = "Threshold (tau)";
  relSheet.getCell("A2").font = SECTION_FONT;
  relSheet.getCell("A2").fill = SUBHEADER_FILL;
  relSheet.getCell("A2").border = THIN_BORDER;

  relSheet.getCell("B2").value = { formula: "Inputs!$B$4", result: model.tau };
  relSheet.getCell("B2").numFmt = "0.0000";
  relSheet.getCell("B2").font = { ...FORMULA_FONT, bold: true };
  relSheet.getCell("B2").fill = SUBHEADER_FILL;
  relSheet.getCell("B2").border = THIN_BORDER;

  const relHeader = relSheet.getRow(4);
  relHeader.getCell(1).value = "ID";
  relHeader.getCell(2).value = "Alternative";
  model.alternatives.forEach((alt, k) => {
    relHeader.getCell(3 + k).value = {
      formula: `Inputs!A${DM_START_ROW + k}`,
      result: alt.id,
    };
  });
  styleHeaderRow(relHeader, 2 + n);

  for (let i = 0; i < n; i++) {
    const altI = model.alternatives[i];
    const r = REL_START_ROW + i;
    const dmR = DM_START_ROW + i;
    const distIR = DIST_START_ROW + i;
    const row = relSheet.getRow(r);
    row.getCell(1).value = { formula: `Inputs!A${dmR}`, result: altI.id };
    row.getCell(2).value = {
      formula: `Inputs!${lang === "id" ? "B" : "C"}${dmR}`,
      result: lang === "id" ? altI.nameId : altI.nameEn,
    };
    row.getCell(1).border = THIN_BORDER;
    row.getCell(1).fill = FORMULA_FILL;
    row.getCell(1).font = FORMULA_FONT;
    row.getCell(2).border = THIN_BORDER;
    row.getCell(2).fill = FORMULA_FILL;
    row.getCell(2).font = FORMULA_FONT;

    for (let k = 0; k < n; k++) {
      const distKR = DIST_START_ROW + k;
      const eI = `Distances!$D$${distIR}`;
      const eK = `Distances!$D$${distKR}`;
      const tI = `Distances!$E$${distIR}`;
      const tK = `Distances!$E$${distKR}`;
      const formula = `(${eI}-${eK})+IF(ABS(${eI}-${eK})>=$B$2,1,0)*(${tI}-${tK})`;

      const cell = row.getCell(3 + k);
      cell.value = {
        formula,
        result: computed.relativeAssessmentMatrix[i][k],
      };
      cell.numFmt = "0.000000";
      cell.border = THIN_BORDER;
      cell.fill = i === k ? SUBHEADER_FILL : FORMULA_FILL;
      cell.font = FORMULA_FONT;
    }
  }

  relSheet.getColumn(1).width = 12;
  relSheet.getColumn(2).width = 24;
  for (let k = 0; k < n; k++) relSheet.getColumn(3 + k).width = 16;

  // =========================================================================
  // 7. RANKING SHEET
  // =========================================================================
  const RANK_START_ROW = 4;
  const RANK_END_ROW = 3 + n;
  const rankMap = new Map(
    computed.ranking.map((item) => [item.alternativeId, item.rank]),
  );

  rankSheet.getCell("A1").value =
    lang === "id"
      ? "SKOR PENILAIAN (H_i) DAN PERANGKINGAN AKHIR"
      : "ASSESSMENT SCORES (H_i) AND FINAL RANKING";
  rankSheet.getCell("A1").font = TITLE_FONT;

  const rankHeader = rankSheet.getRow(3);
  rankHeader.values = [
    "ID",
    "Name (ID)",
    "Name (EN)",
    "Euclidean (E_i)",
    "Taxicab (T_i)",
    "Assessment Score (H_i)",
    "Rank",
    "Status",
  ];
  styleHeaderRow(rankHeader, 8);

  for (let i = 0; i < n; i++) {
    const alt = model.alternatives[i];
    const r = RANK_START_ROW + i;
    const dmR = DM_START_ROW + i;
    const distR = DIST_START_ROW + i;
    const relR = REL_START_ROW + i;
    const altRank = rankMap.get(alt.id) ?? n;

    const row = rankSheet.getRow(r);
    row.getCell(1).value = { formula: `Inputs!A${dmR}`, result: alt.id };
    row.getCell(2).value = { formula: `Inputs!B${dmR}`, result: alt.nameId };
    row.getCell(3).value = { formula: `Inputs!C${dmR}`, result: alt.nameEn };
    row.getCell(4).value = {
      formula: `Distances!D${distR}`,
      result: computed.euclideanDistances[i],
    };
    row.getCell(5).value = {
      formula: `Distances!E${distR}`,
      result: computed.taxicabDistances[i],
    };
    row.getCell(6).value = {
      formula: `SUM(Relative!C${relR}:${lastRelCol}${relR})`,
      result: computed.assessmentScores[i],
    };
    row.getCell(7).value = {
      formula: `RANK(F${r},$F$${RANK_START_ROW}:$F$${RANK_END_ROW},0)`,
      result: altRank,
    };
    row.getCell(8).value = {
      formula: `IF(G${r}=1,"Preferred / Terbaik","-")`,
      result: altRank === 1 ? "Preferred / Terbaik" : "-",
    };

    row.getCell(4).numFmt = "0.000000";
    row.getCell(5).numFmt = "0.000000";
    row.getCell(6).numFmt = "0.000000";
    row.getCell(7).numFmt = "0";

    for (let col = 1; col <= 8; col++) {
      const cell = row.getCell(col);
      cell.border = THIN_BORDER;
      cell.fill = col >= 6 ? HIGHLIGHT_FILL : FORMULA_FILL;
      cell.font = col >= 6 ? { ...FORMULA_FONT, bold: true } : FORMULA_FONT;
      if (col === 7 || col === 8 || col === 1) {
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
    }
  }

  rankSheet.getCell(`A${RANK_END_ROW + 2}`).value =
    lang === "id"
      ? "Catatan: Peringkat menggunakan RANK menurun; nilai H_i identik mendapat peringkat sama."
      : "Note: Ranks use descending RANK; identical H_i scores share the same rank.";
  rankSheet.getCell(`A${RANK_END_ROW + 2}`).font = {
    name: "Calibri",
    size: 10,
    italic: true,
    color: { argb: "FF333333" },
  };

  rankSheet.getColumn(1).width = 12;
  rankSheet.getColumn(2).width = 24;
  rankSheet.getColumn(3).width = 24;
  rankSheet.getColumn(4).width = 18;
  rankSheet.getColumn(5).width = 18;
  rankSheet.getColumn(6).width = 24;
  rankSheet.getColumn(7).width = 12;
  rankSheet.getColumn(8).width = 22;

  return workbook;
}

export async function exportCodasExcel(
  model: CodasModel,
  lang: Language = "id",
): Promise<void> {
  const workbook = await buildCodasWorkbook(model, lang);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `codas-analysis-${lang}-${stamp}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
