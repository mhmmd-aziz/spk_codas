import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  buildRankingExplanation,
  formatNum,
} from "../domain/codas/formatCalculationTrace";
import { JOURNAL_REFERENCE } from "../domain/codas/preset";
import type { CodasModel, CodasResult, Language } from "../domain/codas/types";

export type PdfExportLanguage = Language | "bilingual";

function altLabel(
  alt: CodasModel["alternatives"][number],
  mode: PdfExportLanguage,
): string {
  if (mode === "bilingual") {
    return alt.nameId === alt.nameEn
      ? `${alt.id} (${alt.nameId})`
      : `${alt.id} (${alt.nameId} / ${alt.nameEn})`;
  }
  return `${alt.id} (${mode === "id" ? alt.nameId : alt.nameEn})`;
}

function critShortHeader(
  c: CodasModel["criteria"][number],
  mode: PdfExportLanguage,
): string {
  const name =
    mode === "bilingual"
      ? c.nameId === c.nameEn
        ? c.nameId
        : `${c.nameId} / ${c.nameEn}`
      : mode === "id"
        ? c.nameId
        : c.nameEn;
  const dir = c.type === "benefit" ? "Benefit" : "Cost";
  return `${c.id}\n${name}\n[${dir}]`;
}

function labelText(mode: PdfExportLanguage, idText: string, enText: string): string {
  if (mode === "id") return idText;
  if (mode === "en") return enText;
  return `${idText} / ${enText}`;
}

/**
 * Vector math primitives for clean, readable compiled equations in PDF
 * using standard PDF built-in Helvetica + Symbol fonts and vector lines.
 * Always pure black ink on white/light-gray background.
 */
class PdfMathDrawer {
  private doc: jsPDF;

  constructor(doc: jsPDF) {
    this.doc = doc;
  }

  private textWidth(
    text: string,
    font: "helvetica" | "symbol",
    style: "normal" | "bold" | "italic",
    size: number,
  ): number {
    this.doc.setFont(font, style);
    this.doc.setFontSize(size);
    return this.doc.getTextWidth(text);
  }

  text(
    x: number,
    y: number,
    str: string,
    opts?: {
      font?: "helvetica" | "symbol";
      style?: "normal" | "bold" | "italic";
      size?: number;
    },
  ): number {
    const font = opts?.font ?? "helvetica";
    const style = opts?.style ?? "normal";
    const size = opts?.size ?? 9.5;
    this.doc.setFont(font, style);
    this.doc.setFontSize(size);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(str, x, y);
    return x + this.doc.getTextWidth(str);
  }

  varSub(
    x: number,
    y: number,
    base: string,
    sub: string,
    size: number = 9.5,
  ): number {
    let cx = this.text(x, y, base, { style: "italic", size });
    cx = this.text(cx + 0.2, y + 1.3, sub, {
      style: "italic",
      size: size * 0.68,
    });
    return cx + 0.5;
  }

  varSubSup(
    x: number,
    y: number,
    base: string,
    sub: string,
    sup: string,
    size: number = 9.5,
  ): number {
    const cx = this.text(x, y, base, { style: "italic", size });
    const wSub = this.textWidth(sub, "helvetica", "italic", size * 0.68);
    const wSup = this.textWidth(sup, "helvetica", "normal", size * 0.68);
    this.text(cx + 0.2, y + 1.3, sub, { style: "italic", size: size * 0.68 });
    this.text(cx + 0.2, y - 1.7, sup, { style: "normal", size: size * 0.68 });
    return cx + Math.max(wSub, wSup) + 0.8;
  }

  symbol(x: number, y: number, symChar: string, size: number = 10): number {
    this.doc.setFont("symbol", "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(symChar, x, y);
    return x + this.doc.getTextWidth(symChar);
  }

  sigma(
    x: number,
    y: number,
    lower: string,
    upper: string,
    size: number = 13,
  ): number {
    // Draw Sigma glyph from Symbol font ('S' = 0x53) with upper and lower limits
    const wSig = this.textWidth("S", "symbol", "normal", size);
    const wLow = this.textWidth(lower, "helvetica", "italic", 6.5);
    const wUp = this.textWidth(upper, "helvetica", "italic", 6.5);
    const blockW = Math.max(wSig, wLow, wUp) + 1;

    this.doc.setFont("symbol", "normal");
    this.doc.setFontSize(size);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("S", x + (blockW - wSig) / 2, y + 0.8);

    this.doc.setFont("helvetica", "italic");
    this.doc.setFontSize(6.5);
    this.doc.text(upper, x + (blockW - wUp) / 2, y - 3.6);
    this.doc.text(lower, x + (blockW - wLow) / 2, y + 3.6);

    return x + blockW + 0.8;
  }

  fraction(
    x: number,
    y: number,
    width: number,
    drawTop: (cx: number, cy: number) => void,
    drawBottom: (cx: number, cy: number) => void,
  ): number {
    const barY = y - 1.1;
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.3);
    this.doc.line(x, barY, x + width, barY);
    drawTop(x, barY - 1.8);
    drawBottom(x, barY + 3.4);
    return x + width + 1;
  }

  sqrtBox(
    x: number,
    y: number,
    innerWidth: number,
    drawInner: (ix: number, iy: number) => void,
  ): number {
    const topY = y - 5.4;
    const midY = y + 1.6;
    const hookX = x + 1.4;
    const rootStartX = x + 3.6;

    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.35);
    // Vector radical check + overbar (vinculum)
    this.doc.line(x, y - 0.5, hookX, midY);
    this.doc.line(hookX, midY, rootStartX, topY);
    this.doc.line(rootStartX, topY, rootStartX + innerWidth + 1.5, topY);

    drawInner(rootStartX + 0.8, y);
    return rootStartX + innerWidth + 2.2;
  }

  drawStepFormula(step: number, x: number, y: number): void {
    switch (step) {
      case 1: {
        let cx = this.text(x, y, "X = [", { style: "normal", size: 9.5 });
        cx = this.varSub(cx, y, "x", "ij", 9.5);
        cx = this.text(cx, y, "]", { style: "normal", size: 9.5 });
        this.text(cx + 0.2, y + 1.3, "n \u00d7 m", {
          style: "italic",
          size: 6.8,
        });
        break;
      }
      case 2: {
        // Benefit fraction
        let cx = this.text(x, y, "Benefit: ", { style: "bold", size: 8.5 });
        cx = this.varSub(cx, y, "n", "ij", 9);
        cx = this.text(cx, y, " = ", { size: 9 });
        cx = this.fraction(
          cx,
          y,
          17,
          (fx, fy) => {
            this.varSub(fx + 5.5, fy, "x", "ij", 8.5);
          },
          (fx, fy) => {
            const p = this.text(fx + 1, fy, "max", { size: 8 });
            const p2 = this.text(p + 0.2, fy + 1, "i", {
              style: "italic",
              size: 6,
            });
            this.text(p2 + 0.3, fy, "(", { size: 8 });
            const p3 = this.varSub(p2 + 1.3, fy, "x", "ij", 8);
            this.text(p3, fy, ")", { size: 8 });
          },
        );

        // Cost fraction
        cx = this.text(cx + 6, y, "Cost: ", { style: "bold", size: 8.5 });
        cx = this.varSub(cx, y, "n", "ij", 9);
        cx = this.text(cx, y, " = ", { size: 9 });
        this.fraction(
          cx,
          y,
          17,
          (fx, fy) => {
            const p = this.text(fx + 1, fy, "min", { size: 8 });
            const p2 = this.text(p + 0.2, fy + 1, "i", {
              style: "italic",
              size: 6,
            });
            this.text(p2 + 0.3, fy, "(", { size: 8 });
            const p3 = this.varSub(p2 + 1.3, fy, "x", "ij", 8);
            this.text(p3, fy, ")", { size: 8 });
          },
          (fx, fy) => {
            this.varSub(fx + 5.5, fy, "x", "ij", 8.5);
          },
        );
        break;
      }
      case 3: {
        let cx = this.varSub(x, y, "r", "ij", 9.5);
        cx = this.text(cx, y, " = ", { size: 9.5 });
        cx = this.varSub(cx, y, "w", "j", 9.5);
        cx = this.symbol(cx + 0.5, y, "\xB4", 9.5);
        cx = this.varSub(cx + 0.6, y, "n", "ij", 9.5);
        cx = this.text(cx + 6, y, "with ", { size: 8.5 });
        cx = this.sigma(cx, y, "j=1", "m", 12);
        cx = this.varSub(cx, y, "w", "j", 9.5);
        this.text(cx, y, " = 1", { size: 9.5 });
        break;
      }
      case 4: {
        let cx = this.varSub(x, y, "ns", "j", 9.5);
        cx = this.text(cx, y, " = min", { size: 9.5 });
        cx = this.text(cx + 0.2, y + 1.2, "i", { style: "italic", size: 6.5 });
        cx = this.text(cx + 0.4, y, "(", { size: 9.5 });
        cx = this.varSub(cx, y, "r", "ij", 9.5);
        cx = this.text(cx, y, "),   NS = [", { size: 9.5 });
        cx = this.varSub(cx, y, "ns", "1", 9.5);
        cx = this.text(cx, y, ", ..., ", { size: 9.5 });
        cx = this.varSub(cx, y, "ns", "m", 9.5);
        this.text(cx, y, "]", { size: 9.5 });
        break;
      }
      case 5: {
        this.drawStep5(x, y);
        break;
      }
      case 6: {
        let cx = this.varSub(x, y, "h", "ik", 9.2);
        cx = this.text(cx, y, " = (", { size: 9.2 });
        cx = this.varSub(cx, y, "E", "i", 9.2);
        cx = this.text(cx, y, " - ", { size: 9.2 });
        cx = this.varSub(cx, y, "E", "k", 9.2);
        cx = this.text(cx, y, ") + ", { size: 9.2 });
        cx = this.symbol(cx, y, "y", 9.5);
        cx = this.text(cx + 0.3, y, "(", { size: 9.2 });
        cx = this.varSub(cx, y, "E", "i", 9.2);
        cx = this.text(cx, y, " - ", { size: 9.2 });
        cx = this.varSub(cx, y, "E", "k", 9.2);
        cx = this.text(cx, y, ")(", { size: 9.2 });
        cx = this.varSub(cx, y, "T", "i", 9.2);
        cx = this.text(cx, y, " - ", { size: 9.2 });
        cx = this.varSub(cx, y, "T", "k", 9.2);
        cx = this.text(cx, y, "),   ", { size: 9.2 });
        cx = this.symbol(cx, y, "y", 9.5);
        cx = this.text(cx + 0.3, y, "(x) = 1 if |x| ", { size: 8.5 });
        cx = this.symbol(cx, y, "\xB3", 9);
        cx = this.text(cx + 0.5, y, " ", { size: 8.5 });
        cx = this.symbol(cx, y, "t", 9.5);
        this.text(cx + 0.5, y, ", else 0", { size: 8.5 });
        break;
      }
      case 7: {
        let cx = this.varSub(x, y, "H", "i", 9.5);
        cx = this.text(cx, y, " = ", { size: 9.5 });
        cx = this.sigma(cx, y, "k=1", "n", 12);
        this.varSub(cx, y, "h", "ik", 9.5);
        break;
      }
      case 8: {
        let cx = this.text(x, y, "Rank 1 = arg max", { size: 9.5 });
        cx = this.text(cx + 0.3, y + 1.2, "i", { style: "italic", size: 6.5 });
        cx = this.text(cx + 0.8, y, " ", { size: 9.5 });
        cx = this.varSub(cx, y, "H", "i", 9.5);
        this.text(cx + 3, y, "(descending order)", {
          style: "italic",
          size: 8.5,
        });
        break;
      }
    }
  }

  // Dedicated clean Step 5 drawer without any overlap
  drawStep5(x: number, y: number): void {
    let cx = this.varSub(x, y, "E", "i", 9.5);
    cx = this.text(cx, y, " = ", { size: 9.5 });
    cx = this.sqrtBox(cx, y, 29.5, (ix, iy) => {
      let sx = this.sigma(ix, iy, "j=1", "m", 11.5);
      sx = this.text(sx, iy, "(", { size: 8.5 });
      sx = this.varSub(sx, iy, "r", "ij", 8.5);
      sx = this.text(sx, iy, " - ", { size: 8.5 });
      sx = this.varSub(sx, iy, "ns", "j", 8.5);
      sx = this.text(sx, iy, ")", { size: 8.5 });
      this.text(sx + 0.2, iy - 1.7, "2", { size: 6.2 });
    });

    cx = this.text(cx + 5, y, "   ", { size: 9.5 });
    cx = this.varSub(cx, y, "T", "i", 9.5);
    cx = this.text(cx, y, " = ", { size: 9.5 });
    cx = this.sigma(cx, y, "j=1", "m", 11.5);
    cx = this.text(cx, y, "|", { size: 9 });
    cx = this.varSub(cx, y, "r", "ij", 9);
    cx = this.text(cx, y, " - ", { size: 9 });
    cx = this.varSub(cx, y, "ns", "j", 9);
    this.text(cx, y, "|", { size: 9 });
  }
}

export function buildCodasPdf(
  model: CodasModel,
  result: CodasResult,
  mode: PdfExportLanguage = "id",
  decimals: number = 4,
): jsPDF {
  const manyCols = model.criteria.length > 6 || model.alternatives.length > 7;
  const doc = new jsPDF({
    orientation: manyCols ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });
  const math = new PdfMathDrawer(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usableWidth = pageWidth - margin * 2;
  const generatedAt = new Date().toLocaleString(
    mode === "en" ? "en-US" : "id-ID",
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  // Strict monochrome table defaults
  const bwStyles = {
    fontSize: 8,
    cellPadding: 2,
    textColor: [0, 0, 0] as [number, number, number],
    lineColor: [90, 90, 90] as [number, number, number],
    lineWidth: 0.15,
    fillColor: [255, 255, 255] as [number, number, number],
  };
  const bwHeadStyles = {
    fillColor: [20, 20, 20] as [number, number, number],
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: "bold" as const,
  };
  const bwAltStyles = {
    fillColor: [246, 246, 246] as [number, number, number],
  };

  let y = 18;

  const ensureSpace = (neededMm: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + neededMm > pageHeight - 18) {
      doc.addPage();
      y = 18;
    }
  };

  const addSectionTitle = (title: string) => {
    ensureSpace(15);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(title, margin, y);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.line(margin, y + 1.4, margin + usableWidth, y + 1.4);
    y += 5.5;
  };

  const addSubTitle = (title: string) => {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    doc.text(title, margin, y);
    y += 4;
  };

  const addWrappedParagraph = (
    text: string,
    fontSize: number = 9,
    italic: boolean = false,
  ) => {
    doc.setFont("helvetica", italic ? "italic" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(25, 25, 25);
    const lines = doc.splitTextToSize(text, usableWidth) as string[];
    const needed = lines.length * (fontSize * 0.44) + 3;
    ensureSpace(needed);
    doc.text(lines, margin, y);
    y += needed;
  };

  const getLastY = (): number =>
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 6;

  // =========================================================================
  // TITLE BANNER (BLACK & WHITE)
  // =========================================================================
  doc.setFillColor(17, 17, 17);
  doc.rect(margin, 12, usableWidth, 21, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(
    labelText(
      mode,
      "Laporan Lengkap Analisis SPK Metode CODAS",
      "Complete CODAS Decision Support System Report",
    ),
    margin + 4,
    20,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const langLabel =
    mode === "id"
      ? "Bahasa: Indonesia"
      : mode === "en"
        ? "Language: English"
        : "Language: Bilingual (ID / EN)";
  doc.text(
    `${langLabel}  |  ${labelText(mode, "Dibuat", "Generated")}: ${generatedAt}  |  tau = ${model.tau}`,
    margin + 4,
    28,
  );
  y = 40;

  // =========================================================================
  // SHEET 1 EQUIVALENT: GUIDE, METHODOLOGY & COMPILED FORMULAS
  // =========================================================================
  addSectionTitle(
    labelText(
      mode,
      "1. Panduan, Metodologi & Rumus CODAS (Setara Lembar Guide)",
      "1. Guide, Methodology & CODAS Formulas (Guide Sheet)",
    ),
  );
  addWrappedParagraph(
    labelText(
      mode,
      "Metode Combinative Distance-based Assessment (CODAS) menentukan peringkat alternatif dengan mengkombinasikan jarak Euclidean (ukuran utama) dan jarak Taxicab (ukuran sekunder) terhadap titik solusi ideal negatif (NS). Parameter ambang tau menentukan kapan selisih jarak Taxicab diikutsertakan ketika dua alternatif memiliki jarak Euclidean yang berdekatan.",
      "The Combinative Distance-based Assessment (CODAS) method ranks alternatives by combining Euclidean distance (primary measure) and Taxicab distance (secondary measure) from the negative-ideal solution (NS). The threshold parameter tau governs when Taxicab distance differences break close Euclidean comparisons.",
    ),
  );
  addWrappedParagraph(
    `${labelText(mode, "Sitasi Jurnal", "Journal Citation")}: ${JOURNAL_REFERENCE.citationEn}`,
    8.5,
    true,
  );

  // Compiled Vector Formulas Box (Steps 1 - 8)
  addSubTitle(
    labelText(
      mode,
      "Ringkasan Rumus Matematis CODAS (Langkah 1 - 8)",
      "CODAS Mathematical Formula Reference (Steps 1 - 8)",
    ),
  );

  const formulaRowsMeta: Array<{ step: number; label: string; height: number }> =
    [
      {
        step: 1,
        label: labelText(mode, "1. Matriks Keputusan", "1. Decision Matrix"),
        height: 11,
      },
      {
        step: 2,
        label: labelText(mode, "2. Normalisasi Linear", "2. Linear Normalization"),
        height: 15,
      },
      {
        step: 3,
        label: labelText(
          mode,
          "3. Matriks Terbobot",
          "3. Weighted Matrix",
        ),
        height: 12,
      },
      {
        step: 4,
        label: labelText(
          mode,
          "4. Solusi Ideal Negatif",
          "4. Negative-Ideal Solution",
        ),
        height: 11,
      },
      {
        step: 5,
        label: labelText(
          mode,
          "5. Jarak Euclidean & Taxicab",
          "5. Euclidean & Taxicab Distances",
        ),
        height: 16,
      },
      {
        step: 6,
        label: labelText(
          mode,
          "6. Penilaian Relatif",
          "6. Relative Assessment",
        ),
        height: 12,
      },
      {
        step: 7,
        label: labelText(mode, "7. Skor Penilaian", "7. Assessment Score"),
        height: 12,
      },
      {
        step: 8,
        label: labelText(mode, "8. Perangkingan", "8. Final Ranking"),
        height: 11,
      },
    ];

  const labelColW = 46;
  const formulaColW = usableWidth - labelColW;

  for (const rowMeta of formulaRowsMeta) {
    ensureSpace(rowMeta.height + 2);
    doc.setDrawColor(70, 70, 70);
    doc.setLineWidth(0.2);
    doc.setFillColor(244, 244, 244);
    doc.rect(margin, y, labelColW, rowMeta.height, "FD");
    doc.setFillColor(255, 255, 255);
    doc.rect(margin + labelColW, y, formulaColW, rowMeta.height, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(0, 0, 0);
    doc.text(rowMeta.label, margin + 2.5, y + rowMeta.height / 2 + 1);

    const fx = margin + labelColW + 3.5;
    const fy = y + rowMeta.height / 2 + (rowMeta.step === 5 ? 1.8 : 1.2);
    if (rowMeta.step === 5) {
      math.drawStep5(fx, fy);
    } else {
      math.drawStepFormula(rowMeta.step, fx, fy);
    }
    y += rowMeta.height;
  }
  y += 6;

  // =========================================================================
  // SHEET 2 EQUIVALENT: INPUTS (TAU, CRITERIA, ALTERNATIVES, MATRIX X)
  // =========================================================================
  addSectionTitle(
    labelText(
      mode,
      "2. Data Masukan Model (Setara Lembar Inputs)",
      "2. Model Inputs (Inputs Sheet)",
    ),
  );
  const totalWeight = model.criteria.reduce((s, c) => s + c.weight, 0);
  addWrappedParagraph(
    `${labelText(mode, "Jumlah Kriteria", "Criteria")}: ${model.criteria.length}  |  ${labelText(mode, "Jumlah Alternatif", "Alternatives")}: ${model.alternatives.length}  |  ${labelText(mode, "Total Bobot", "Total Weight")}: ${formatNum(totalWeight, 4)}  |  Threshold (tau) = ${model.tau}`,
  );

  addSubTitle(
    labelText(
      mode,
      "2A. Konfigurasi Kriteria, Tipe & Bobot",
      "2A. Criteria Configuration, Direction & Weights",
    ),
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: bwStyles,
    headStyles: bwHeadStyles,
    alternateRowStyles: bwAltStyles,
    head: [
      [
        "ID",
        labelText(mode, "Nama (Indonesia)", "Name (ID)"),
        labelText(mode, "Nama (English)", "Name (EN)"),
        labelText(mode, "Tipe (Arah)", "Type (Direction)"),
        labelText(mode, "Bobot (w_j)", "Weight (w_j)"),
      ],
    ],
    body: [
      ...model.criteria.map((c) => [
        c.id,
        c.nameId,
        c.nameEn,
        c.type === "benefit"
          ? labelText(mode, "Benefit (Maksimasi)", "Benefit (Maximize)")
          : labelText(mode, "Cost (Minimasi)", "Cost (Minimize)"),
        formatNum(c.weight, 4),
      ]),
      [
        "",
        "",
        "",
        labelText(mode, "Total Bobot", "Total Weight"),
        formatNum(totalWeight, 4),
      ],
    ],
    didParseCell: (hookData) => {
      if (
        hookData.section === "body" &&
        hookData.row.index === model.criteria.length
      ) {
        hookData.cell.styles.fillColor = [225, 225, 225];
        hookData.cell.styles.fontStyle = "bold";
      }
    },
  });
  y = getLastY();

  addSubTitle(
    labelText(
      mode,
      "2B. Daftar Alternatif & Matriks Keputusan Awal (X)",
      "2B. Alternatives & Original Decision Matrix (X)",
    ),
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: bwStyles,
    headStyles: bwHeadStyles,
    alternateRowStyles: bwAltStyles,
    head: [
      [
        labelText(mode, "Alternatif", "Alternative"),
        ...model.criteria.map((c) => critShortHeader(c, mode)),
      ],
    ],
    body: model.alternatives.map((alt, i) => [
      altLabel(alt, mode),
      ...result.decisionMatrix[i].map((v) => formatNum(v, 2)),
    ]),
  });
  y = getLastY();

  // =========================================================================
  // SHEET 3 EQUIVALENT: NORMALIZED MATRIX (N)
  // =========================================================================
  addSectionTitle(
    labelText(
      mode,
      "3. Matriks Keputusan Ternormalisasi (Setara Lembar Normalized)",
      "3. Normalized Decision Matrix (Normalized Sheet)",
    ),
  );
  addWrappedParagraph(
    labelText(
      mode,
      "Sumber perhitungan: Benefit n_ij = x_ij / max_i(x_ij) | Cost n_ij = min_i(x_ij) / x_ij (x_ij diambil dari Matriks X pada Bagian 2B).",
      "Calculation provenance: Benefit n_ij = x_ij / max_i(x_ij) | Cost n_ij = min_i(x_ij) / x_ij (x_ij sourced from Matrix X in Section 2B).",
    ),
    8.5,
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { ...bwStyles, fontSize: 7.4 },
    headStyles: bwHeadStyles,
    alternateRowStyles: bwAltStyles,
    head: [
      [
        labelText(mode, "Alternatif / Statistik", "Alternative / Stat"),
        ...model.criteria.map(
          (c) => `${c.id} (${c.type === "benefit" ? "Benefit" : "Cost"})`,
        ),
      ],
    ],
    body: [
      [
        labelText(mode, "Referensi min / max", "Column min / max"),
        ...result.columnStats.map((st) =>
          st.type === "benefit"
            ? `max = ${formatNum(st.max, 2)}`
            : `min = ${formatNum(st.min, 2)}`,
        ),
      ],
      ...model.alternatives.map((alt, i) => [
        altLabel(alt, mode),
        ...result.normalizedMatrix[i].map((v, j) => {
          const xVal = result.decisionMatrix[i][j];
          const stat = result.columnStats[j];
          const expr =
            stat.type === "benefit"
              ? `(${formatNum(xVal, 2)} / ${formatNum(stat.max, 2)})`
              : `(${formatNum(stat.min, 2)} / ${formatNum(xVal, 2)})`;
          return `${formatNum(v, decimals)}\n${expr}`;
        }),
      ]),
    ],
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.row.index === 0) {
        hookData.cell.styles.fillColor = [232, 232, 232];
        hookData.cell.styles.fontStyle = "bold";
      }
    },
  });
  y = getLastY();

  // =========================================================================
  // SHEET 4 EQUIVALENT: WEIGHTED MATRIX (R) & NEGATIVE-IDEAL (NS)
  // =========================================================================
  addSectionTitle(
    labelText(
      mode,
      "4. Matriks Ternormalisasi Terbobot & Solusi Ideal Negatif (Setara Lembar Weighted)",
      "4. Weighted Normalized Matrix & Negative-Ideal Solution (Weighted Sheet)",
    ),
  );
  addWrappedParagraph(
    labelText(
      mode,
      "Sumber perhitungan: r_ij = w_j x n_ij (bobot w_j dari Bagian 2A, n_ij dari Bagian 3). Baris NS memilih nilai minimum tiap kolom r_ij beserta kode alternatif sumbernya.",
      "Calculation provenance: r_ij = w_j x n_ij (weight w_j from Section 2A, n_ij from Section 3). The NS row selects each column minimum r_ij and shows its source alternative.",
    ),
    8.5,
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { ...bwStyles, fontSize: 7.2 },
    headStyles: bwHeadStyles,
    alternateRowStyles: bwAltStyles,
    head: [
      [
        labelText(mode, "Alternatif", "Alternative"),
        ...model.criteria.map((c) => `${c.id} (w=${formatNum(c.weight, 4)})`),
      ],
    ],
    body: [
      ...model.alternatives.map((alt, i) => [
        altLabel(alt, mode),
        ...result.weightedNormalizedMatrix[i].map((v, j) => {
          const w = model.criteria[j].weight;
          const nVal = result.normalizedMatrix[i][j];
          return `${formatNum(v, decimals)}\n(${formatNum(w, 4)} x ${formatNum(nVal, decimals)})`;
        }),
      ]),
      [
        labelText(mode, "NS (Solusi Ideal Negatif)", "NS (Negative-Ideal)"),
        ...result.negativeIdeal.map((v, j) => {
          const minAlts = model.alternatives
            .filter(
              (_, rowIdx) =>
                Math.abs(result.weightedNormalizedMatrix[rowIdx][j] - v) <= 1e-12,
            )
            .map((a) => a.id);
          return `${formatNum(v, decimals)}\n(min: ${minAlts.join(", ")})`;
        }),
      ],
    ],
    didParseCell: (hookData) => {
      if (
        hookData.section === "body" &&
        hookData.row.index === model.alternatives.length
      ) {
        hookData.cell.styles.fillColor = [220, 220, 220];
        hookData.cell.styles.fontStyle = "bold";
      }
    },
  });
  y = getLastY();

  // =========================================================================
  // SHEET 5 EQUIVALENT: DISTANCES + PER-CRITERION SQUARED & ABSOLUTE DEVIATIONS
  // =========================================================================
  addSectionTitle(
    labelText(
      mode,
      "5. Jarak Euclidean, Taxicab & Kontribusi Deviasi (Setara Lembar Distances)",
      "5. Euclidean, Taxicab & Deviation Contributions (Distances Sheet)",
    ),
  );

  addSubTitle(
    labelText(
      mode,
      "5A. Ringkasan Jarak Euclidean (E_i) dan Jarak Taxicab (T_i) beserta Asal Hitung",
      "5A. Euclidean (E_i) & Taxicab (T_i) Distance Summary with Derivation",
    ),
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { ...bwStyles, fontSize: 7.4 },
    headStyles: bwHeadStyles,
    alternateRowStyles: bwAltStyles,
    head: [
      [
        labelText(mode, "Alternatif", "Alternative"),
        labelText(
          mode,
          "Asal E_i = sqrt(sum (r_ij - ns_j)^2)",
          "Source of E_i = sqrt(sum (r_ij - ns_j)^2)",
        ),
        "E_i",
        labelText(
          mode,
          "Asal T_i = sum |r_ij - ns_j|",
          "Source of T_i = sum |r_ij - ns_j|",
        ),
        "T_i",
      ],
    ],
    body: model.alternatives.map((alt, i) => {
      const bd = result.distanceBreakdowns[i];
      const sumSq = bd.perCriterionSquaredDiff.reduce((s, v) => s + v, 0);
      const absExpr = bd.perCriterionAbsDiff
        .map((v) => formatNum(v, decimals))
        .join(" + ");
      return [
        altLabel(alt, mode),
        `sqrt(${formatNum(sumSq, decimals)})`,
        formatNum(result.euclideanDistances[i], decimals),
        absExpr,
        formatNum(result.taxicabDistances[i], decimals),
      ];
    }),
  });
  y = getLastY();

  addSubTitle(
    labelText(
      mode,
      "5B. Kontribusi Kuadrat Deviasi per Kriteria: (r_ij - ns_j)^2 -> Jumlah -> E_i",
      "5B. Per-Criterion Squared Deviations: (r_ij - ns_j)^2 -> Sum -> E_i",
    ),
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { ...bwStyles, fontSize: 7.1 },
    headStyles: bwHeadStyles,
    alternateRowStyles: bwAltStyles,
    head: [
      [
        labelText(mode, "Alternatif", "Alternative"),
        ...model.criteria.map((c) => c.id),
        labelText(mode, "Jumlah (Sum)", "Row Sum"),
        "E_i = sqrt(Sum)",
      ],
    ],
    body: model.alternatives.map((alt, i) => {
      const bd = result.distanceBreakdowns[i];
      const sumSq = bd.perCriterionSquaredDiff.reduce((s, v) => s + v, 0);
      return [
        altLabel(alt, mode),
        ...bd.perCriterionSquaredDiff.map(
          (v, j) =>
            `${formatNum(v, decimals)}\n(${formatNum(bd.perCriterionDiff[j], decimals)})^2`,
        ),
        formatNum(sumSq, decimals),
        formatNum(bd.euclidean, decimals),
      ];
    }),
  });
  y = getLastY();

  addSubTitle(
    labelText(
      mode,
      "5C. Kontribusi Deviasi Absolut per Kriteria: |r_ij - ns_j| -> T_i",
      "5C. Per-Criterion Absolute Deviations: |r_ij - ns_j| -> T_i",
    ),
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { ...bwStyles, fontSize: 6.9 },
    headStyles: bwHeadStyles,
    alternateRowStyles: bwAltStyles,
    head: [
      [
        labelText(mode, "Alternatif", "Alternative"),
        ...model.criteria.map((c) => c.id),
        "T_i = Sum",
      ],
    ],
    body: model.alternatives.map((alt, i) => {
      const bd = result.distanceBreakdowns[i];
      return [
        altLabel(alt, mode),
        ...bd.perCriterionAbsDiff.map(
          (v, j) =>
            `${formatNum(v, decimals)}\n|${formatNum(result.weightedNormalizedMatrix[i][j], decimals)}-${formatNum(result.negativeIdeal[j], decimals)}|`,
        ),
        formatNum(bd.taxicab, decimals),
      ];
    }),
  });
  y = getLastY();

  // =========================================================================
  // SHEET 6 EQUIVALENT: RELATIVE ASSESSMENT (psi AND h_ik)
  // =========================================================================
  addSectionTitle(
    labelText(
      mode,
      `6. Matriks Penilaian Relatif (Setara Lembar Relative, tau = ${model.tau})`,
      `6. Relative Assessment Matrix (Relative Sheet, tau = ${model.tau})`,
    ),
  );
  addWrappedParagraph(
    labelText(
      mode,
      `Sumber perhitungan: nilai E_i dan T_i berasal dari Bagian 5A. Ambang psi = 1 jika |E_i - E_k| >= ${model.tau}, selain itu 0. Kemudian h_ik = (E_i - E_k) + psi * (T_i - T_k).`,
      `Calculation provenance: E_i and T_i values come from Section 5A. Threshold psi = 1 when |E_i - E_k| >= ${model.tau}, else 0. Then h_ik = (E_i - E_k) + psi * (T_i - T_k).`,
    ),
    8.5,
  );

  addSubTitle(
    labelText(
      mode,
      `6A. Matriks Aktivasi Ambang psi(E_i - E_k) untuk tau = ${model.tau}`,
      `6A. Threshold Activation Matrix psi(E_i - E_k) for tau = ${model.tau}`,
    ),
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { ...bwStyles, fontSize: 6.8, halign: "center", cellPadding: 1.6 },
    headStyles: bwHeadStyles,
    alternateRowStyles: bwAltStyles,
    head: [["i / k", ...model.alternatives.map((a) => a.id)]],
    body: model.alternatives.map((alt, i) => [
      alt.id,
      ...result.relativePairs[i].map((pair, k) => {
        if (i === k) return "0\n(i=k)";
        const op = pair.psi === 1 ? ">=" : "<";
        return `${pair.psi}\n(|${formatNum(pair.absEDiff, decimals)}| ${op} ${model.tau})`;
      }),
    ]),
  });
  y = getLastY();

  addSubTitle(
    labelText(
      mode,
      "6B. Matriks Penilaian Relatif h_ik = (E_i - E_k) + psi(T_i - T_k) & H_i",
      "6B. Relative Assessment Matrix h_ik = (E_i - E_k) + psi(T_i - T_k) & H_i",
    ),
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { ...bwStyles, fontSize: 6.4, cellPadding: 1.5 },
    headStyles: bwHeadStyles,
    alternateRowStyles: bwAltStyles,
    head: [["i / k", ...model.alternatives.map((a) => a.id), "H_i"]],
    body: model.alternatives.map((alt, i) => [
      alt.id,
      ...result.relativeAssessmentMatrix[i].map((v, k) => {
        if (i === k) return `${formatNum(v, decimals)}\n(0)`;
        const pair = result.relativePairs[i][k];
        return `${formatNum(v, decimals)}\n(${formatNum(pair.eDiff, decimals)}+${pair.psi}*(${formatNum(pair.tDiff, decimals)}))`;
      }),
      `${formatNum(result.assessmentScores[i], decimals)}\n(sum baris)`,
    ]),
    didParseCell: (hookData) => {
      if (
        hookData.section === "body" &&
        hookData.column.index === model.alternatives.length + 1
      ) {
        hookData.cell.styles.fillColor = [230, 230, 230];
        hookData.cell.styles.fontStyle = "bold";
      }
    },
  });
  y = getLastY();

  addSubTitle(
    labelText(
      mode,
      "6C. Asal Penjumlahan Skor Penilaian Akhir (H_i = sum_k h_ik)",
      "6C. Assessment Score Summation Trace (H_i = sum_k h_ik)",
    ),
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: { ...bwStyles, fontSize: 7.4 },
    headStyles: bwHeadStyles,
    alternateRowStyles: bwAltStyles,
    head: [
      [
        labelText(mode, "Alternatif", "Alternative"),
        labelText(
          mode,
          "Penjumlahan Baris Matriks 6B (h_i1 + ... + h_in)",
          "Row Summation from Matrix 6B (h_i1 + ... + h_in)",
        ),
        "H_i",
      ],
    ],
    body: model.alternatives.map((alt, i) => [
      altLabel(alt, mode),
      result.relativeAssessmentMatrix[i]
        .map((v) => formatNum(v, decimals))
        .join(" + "),
      formatNum(result.assessmentScores[i], decimals),
    ]),
  });
  y = getLastY();

  // =========================================================================
  // SHEET 7 EQUIVALENT: FINAL RANKING & INTERPRETATION
  // =========================================================================
  addSectionTitle(
    labelText(
      mode,
      "7. Skor Penilaian & Perangkingan Akhir (Setara Lembar Ranking)",
      "7. Assessment Scores & Final Ranking (Ranking Sheet)",
    ),
  );
  addWrappedParagraph(
    labelText(
      mode,
      "Peringkat ditentukan dengan mengurutkan skor H_i (dari Bagian 6B/6C) dari nilai terbesar ke terkecil, dengan E_i dan T_i bersumber dari Bagian 5A.",
      "Final ranks are determined by sorting assessment scores H_i (from Section 6B/6C) in descending order, with E_i and T_i carried from Section 5A.",
    ),
    8.5,
  );
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    styles: bwStyles,
    headStyles: bwHeadStyles,
    alternateRowStyles: bwAltStyles,
    head: [
      [
        labelText(mode, "Peringkat", "Rank"),
        "ID",
        labelText(mode, "Alternatif", "Alternative"),
        "E_i (5A)",
        "T_i (5A)",
        labelText(mode, "Skor H_i (6C)", "Score H_i (6C)"),
        "Status",
      ],
    ],
    body: result.ranking.map((item) => {
      const alt = model.alternatives.find((a) => a.id === item.alternativeId)!;
      const altName =
        mode === "bilingual"
          ? alt.nameId === alt.nameEn
            ? alt.nameId
            : `${alt.nameId} / ${alt.nameEn}`
          : mode === "id"
            ? alt.nameId
            : alt.nameEn;
      return [
        String(item.rank),
        alt.id,
        altName,
        formatNum(item.euclidean, decimals),
        formatNum(item.taxicab, decimals),
        formatNum(item.score, decimals),
        item.rank === 1
          ? labelText(mode, "Terbaik", "Preferred")
          : "",
      ];
    }),
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.row.index === 0) {
        hookData.cell.styles.fillColor = [225, 225, 225];
        hookData.cell.styles.fontStyle = "bold";
      }
    },
  });
  y = getLastY();

  ensureSpace(32);
  addSubTitle(
    labelText(
      mode,
      "7B. Interpretasi Peringkat Teratas & Catatan Presisi",
      "7B. Top-Rank Interpretation & Precision Notes",
    ),
  );
  if (mode === "bilingual") {
    addWrappedParagraph(buildRankingExplanation(model, result, "id", decimals));
    addWrappedParagraph(buildRankingExplanation(model, result, "en", decimals));
  } else {
    addWrappedParagraph(buildRankingExplanation(model, result, mode, decimals));
  }

  addWrappedParagraph(
    labelText(
      mode,
      "Catatan: Seluruh perhitungan antara dilakukan dengan presisi penuh (floating-point) dan hanya dibulatkan saat ditampilkan. Aturan seri menggunakan peringkat kompetisi menurun (nilai identik dalam toleransi 1e-12 mendapat peringkat yang sama). Hasil peringkat sepenuhnya bergantung pada data input, bobot kriteria, arah Benefit/Cost, dan nilai parameter tau yang dimasukkan pengguna.",
      "Disclaimer: All intermediate calculations retain full floating-point precision and are rounded only for display. Tie handling assigns equal descending competition ranks within 1e-12 numerical tolerance. Ranking outcomes depend strictly on the supplied input values, criterion weights, Benefit/Cost directions, and threshold parameter tau.",
    ),
    8.5,
    true,
  );

  // Page numbers & monochrome footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(
      `CODAS DSS Report | ${JOURNAL_REFERENCE.doi}`,
      margin,
      pageH - 8,
    );
    doc.text(
      `${labelText(mode, "Halaman", "Page")} ${p} / ${totalPages}`,
      pageWidth - margin,
      pageH - 8,
      { align: "right" },
    );
  }

  return doc;
}

export function exportCodasPdf(
  model: CodasModel,
  result: CodasResult,
  mode: PdfExportLanguage = "id",
  decimals: number = 4,
): void {
  const doc = buildCodasPdf(model, result, mode, decimals);
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`codas-report-${mode}-${stamp}.pdf`);
}
