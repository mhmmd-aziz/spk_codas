import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import {
  buildRankingExplanation,
  formatNum,
} from "../domain/codas/formatCalculationTrace";
import { JOURNAL_REFERENCE } from "../domain/codas/preset";
import type { CodasModel, CodasResult, Language } from "../domain/codas/types";

export type WordExportLanguage = Language | "bilingual";

const BW_COLORS = {
  black: "000000",
  headerBg: "111111",
  headerText: "FFFFFF",
  sectionBorder: "222222",
  altRowBg: "F5F5F5",
  accentRowBg: "E6E6E6",
  totalRowBg: "DCDCDC",
  cellBorder: "999999",
  subText: "444444",
  white: "FFFFFF",
} as const;

function labelText(mode: WordExportLanguage, idText: string, enText: string): string {
  if (mode === "id") return idText;
  if (mode === "en") return enText;
  return `${idText} / ${enText}`;
}

function altLabel(
  alt: CodasModel["alternatives"][number],
  mode: WordExportLanguage,
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
  mode: WordExportLanguage,
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
  return `${c.id}: ${name} [${dir}]`;
}

const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 6, color: BW_COLORS.cellBorder },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: BW_COLORS.cellBorder },
  left: { style: BorderStyle.SINGLE, size: 4, color: BW_COLORS.cellBorder },
  right: { style: BorderStyle.SINGLE, size: 4, color: BW_COLORS.cellBorder },
  insideHorizontal: {
    style: BorderStyle.SINGLE,
    size: 4,
    color: BW_COLORS.cellBorder,
  },
  insideVertical: {
    style: BorderStyle.SINGLE,
    size: 4,
    color: BW_COLORS.cellBorder,
  },
};

function makeCell(
  lines: Array<{
    text: string;
    bold?: boolean;
    italics?: boolean;
    size?: number;
    color?: string;
  }>,
  options?: {
    fill?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    header?: boolean;
    widthPct?: number;
  },
): TableCell {
  const fill = options?.fill ?? (options?.header ? BW_COLORS.headerBg : undefined);
  const align = options?.align ?? AlignmentType.LEFT;

  return new TableCell({
    width: options?.widthPct
      ? { size: options.widthPct, type: WidthType.PERCENTAGE }
      : undefined,
    shading: fill
      ? {
          type: ShadingType.CLEAR,
          color: "auto",
          fill,
        }
      : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: lines.map(
      (line) =>
        new Paragraph({
          alignment: align,
          spacing: { before: 0, after: 20 },
          children: [
            new TextRun({
              text: line.text,
              bold: line.bold ?? options?.header ?? false,
              italics: line.italics ?? false,
              size: line.size ?? (options?.header ? 17 : 17),
              color:
                line.color ??
                (options?.header ? BW_COLORS.headerText : BW_COLORS.black),
              font: "Calibri",
            }),
          ],
        }),
    ),
  });
}

function makeSimpleTable(
  headers: string[],
  rows: Array<
    Array<
      | string
      | Array<{
          text: string;
          bold?: boolean;
          size?: number;
          color?: string;
        }>
    >
  >,
  options?: {
    rightAlignFromCol?: number;
    centerAll?: boolean;
    highlightRowIndices?: number[];
    highlightColIndex?: number;
  },
): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, colIdx) =>
      makeCell([{ text: h, bold: true, size: 17, color: BW_COLORS.headerText }], {
        header: true,
        align: options?.centerAll
          ? AlignmentType.CENTER
          : options?.rightAlignFromCol !== undefined &&
              colIdx >= options.rightAlignFromCol
            ? AlignmentType.RIGHT
            : AlignmentType.LEFT,
      }),
    ),
  });

  const bodyRows = rows.map((row, rowIdx) => {
    const isHighlightedRow = options?.highlightRowIndices?.includes(rowIdx);
    const defaultFill = isHighlightedRow
      ? BW_COLORS.totalRowBg
      : rowIdx % 2 === 1
        ? BW_COLORS.altRowBg
        : BW_COLORS.white;

    return new TableRow({
      children: row.map((cell, colIdx) => {
        const isHighlightedCol = options?.highlightColIndex === colIdx;
        const fill = isHighlightedCol ? BW_COLORS.accentRowBg : defaultFill;
        const align = options?.centerAll
          ? AlignmentType.CENTER
          : options?.rightAlignFromCol !== undefined &&
              colIdx >= options.rightAlignFromCol
            ? AlignmentType.RIGHT
            : AlignmentType.LEFT;

        const lines =
          typeof cell === "string"
            ? cell.split("\n").map((line, lIdx) => ({
                text: line,
                bold: isHighlightedRow || isHighlightedCol || (cell.includes("\n") && lIdx === 0),
                size: lIdx === 0 ? 17 : 14,
                color: lIdx === 0 ? BW_COLORS.black : BW_COLORS.subText,
              }))
            : cell;

        return makeCell(lines, { fill, align });
      }),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [headerRow, ...bodyRows],
  });
}

function addSectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 100 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 8,
        color: BW_COLORS.sectionBorder,
      },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        color: BW_COLORS.black,
        font: "Calibri",
      }),
    ],
  });
}

function addSubHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 20,
        color: BW_COLORS.black,
        font: "Calibri",
      }),
    ],
  });
}

function addBodyParagraph(
  text: string,
  options?: { italics?: boolean; size?: number; color?: string },
): Paragraph {
  return new Paragraph({
    spacing: { before: 40, after: 90 },
    children: [
      new TextRun({
        text,
        italics: options?.italics ?? false,
        size: options?.size ?? 19,
        color: options?.color ?? BW_COLORS.black,
        font: "Calibri",
      }),
    ],
  });
}

function tRun(
  text: string,
  opts?: { sub?: boolean; sup?: boolean; bold?: boolean; italics?: boolean },
): TextRun {
  return new TextRun({
    text,
    subScript: opts?.sub,
    superScript: opts?.sup,
    bold: opts?.bold,
    italics: opts?.italics,
    size: 18,
    color: BW_COLORS.black,
    font: "Cambria Math",
  });
}

function makeFormulaTable(mode: WordExportLanguage): Table {
  const rows: Array<{ label: string; runs: TextRun[] }> = [
    {
      label: labelText(mode, "1. Matriks Keputusan", "1. Decision Matrix"),
      runs: [
        tRun("X = [x", { italics: true }),
        tRun("ij", { sub: true, italics: true }),
        tRun("]"),
        tRun("n×m", { sub: true, italics: true }),
      ],
    },
    {
      label: labelText(mode, "2. Normalisasi Linear", "2. Linear Normalization"),
      runs: [
        tRun("Benefit: n", { italics: true }),
        tRun("ij", { sub: true, italics: true }),
        tRun(" = x"),
        tRun("ij", { sub: true, italics: true }),
        tRun(" / max"),
        tRun("i", { sub: true, italics: true }),
        tRun("(x"),
        tRun("ij", { sub: true, italics: true }),
        tRun(")    |    Cost: n"),
        tRun("ij", { sub: true, italics: true }),
        tRun(" = min"),
        tRun("i", { sub: true, italics: true }),
        tRun("(x"),
        tRun("ij", { sub: true, italics: true }),
        tRun(") / x"),
        tRun("ij", { sub: true, italics: true }),
      ],
    },
    {
      label: labelText(mode, "3. Matriks Terbobot", "3. Weighted Matrix"),
      runs: [
        tRun("r", { italics: true }),
        tRun("ij", { sub: true, italics: true }),
        tRun(" = w"),
        tRun("j", { sub: true, italics: true }),
        tRun(" × n"),
        tRun("ij", { sub: true, italics: true }),
        tRun(",    ∑"),
        tRun("j=1..m", { sub: true }),
        tRun(" w"),
        tRun("j", { sub: true, italics: true }),
        tRun(" = 1"),
      ],
    },
    {
      label: labelText(
        mode,
        "4. Solusi Ideal Negatif",
        "4. Negative-Ideal Solution",
      ),
      runs: [
        tRun("ns", { italics: true }),
        tRun("j", { sub: true, italics: true }),
        tRun(" = min"),
        tRun("i", { sub: true, italics: true }),
        tRun("(r"),
        tRun("ij", { sub: true, italics: true }),
        tRun("),    NS = [ns"),
        tRun("1", { sub: true }),
        tRun(", ns"),
        tRun("2", { sub: true }),
        tRun(", ..., ns"),
        tRun("m", { sub: true, italics: true }),
        tRun("]"),
      ],
    },
    {
      label: labelText(
        mode,
        "5. Jarak Euclidean & Taxicab",
        "5. Euclidean & Taxicab Distances",
      ),
      runs: [
        tRun("E", { italics: true }),
        tRun("i", { sub: true, italics: true }),
        tRun(" = √[ ∑"),
        tRun("j=1..m", { sub: true }),
        tRun(" (r"),
        tRun("ij", { sub: true, italics: true }),
        tRun(" - ns"),
        tRun("j", { sub: true, italics: true }),
        tRun(")"),
        tRun("2", { sup: true }),
        tRun(" ]    |    "),
        tRun("T", { italics: true }),
        tRun("i", { sub: true, italics: true }),
        tRun(" = ∑"),
        tRun("j=1..m", { sub: true }),
        tRun(" |r"),
        tRun("ij", { sub: true, italics: true }),
        tRun(" - ns"),
        tRun("j", { sub: true, italics: true }),
        tRun("|"),
      ],
    },
    {
      label: labelText(mode, "6. Penilaian Relatif", "6. Relative Assessment"),
      runs: [
        tRun("h", { italics: true }),
        tRun("ik", { sub: true, italics: true }),
        tRun(" = (E"),
        tRun("i", { sub: true, italics: true }),
        tRun(" - E"),
        tRun("k", { sub: true, italics: true }),
        tRun(") + ψ(E"),
        tRun("i", { sub: true, italics: true }),
        tRun(" - E"),
        tRun("k", { sub: true, italics: true }),
        tRun(")(T"),
        tRun("i", { sub: true, italics: true }),
        tRun(" - T"),
        tRun("k", { sub: true, italics: true }),
        tRun("),   ψ(x) = 1 jika |x| ≥ τ, else 0"),
      ],
    },
    {
      label: labelText(mode, "7. Skor Penilaian", "7. Assessment Score"),
      runs: [
        tRun("H", { italics: true }),
        tRun("i", { sub: true, italics: true }),
        tRun(" = ∑"),
        tRun("k=1..n", { sub: true }),
        tRun(" h"),
        tRun("ik", { sub: true, italics: true }),
      ],
    },
    {
      label: labelText(mode, "8. Perangkingan", "8. Final Ranking"),
      runs: [
        tRun("Rank 1 = arg max"),
        tRun("i", { sub: true, italics: true }),
        tRun(" H"),
        tRun("i", { sub: true, italics: true }),
        tRun("  ("),
        tRun(labelText(mode, "urutan menurun", "descending order")),
        tRun(")"),
      ],
    },
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      makeCell(
        [
          {
            text: labelText(mode, "Tahapan CODAS", "CODAS Step"),
            bold: true,
            color: BW_COLORS.headerText,
          },
        ],
        { header: true, widthPct: 30 },
      ),
      makeCell(
        [
          {
            text: labelText(mode, "Rumus Matematis", "Mathematical Formula"),
            bold: true,
            color: BW_COLORS.headerText,
          },
        ],
        { header: true, widthPct: 70 },
      ),
    ],
  });

  const dataRows = rows.map(
    (item, idx) =>
      new TableRow({
        children: [
          makeCell([{ text: item.label, bold: true, size: 17 }], {
            fill: idx % 2 === 1 ? BW_COLORS.altRowBg : BW_COLORS.white,
            widthPct: 30,
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: {
              type: ShadingType.CLEAR,
              color: "auto",
              fill: idx % 2 === 1 ? BW_COLORS.altRowBg : BW_COLORS.white,
            },
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: item.runs,
              }),
            ],
          }),
        ],
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [headerRow, ...dataRows],
  });
}

export function buildCodasWordDocument(
  model: CodasModel,
  result: CodasResult,
  mode: WordExportLanguage = "id",
  decimals: number = 4,
): Document {
  const generatedAt = new Date().toISOString().slice(0, 10);
  const totalWeight = model.criteria.reduce((s, c) => s + c.weight, 0);
  const langLabel =
    mode === "id"
      ? "Bahasa: Indonesia"
      : mode === "en"
        ? "Language: English"
        : "Language: Bilingual (ID / EN)";

  const children: Array<Paragraph | Table> = [];

  // Title Block (Monochrome Black Banner Table)
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 8, color: BW_COLORS.black },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: BW_COLORS.black },
        left: { style: BorderStyle.SINGLE, size: 8, color: BW_COLORS.black },
        right: { style: BorderStyle.SINGLE, size: 8, color: BW_COLORS.black },
      },
      rows: [
        new TableRow({
          children: [
            makeCell(
              [
                {
                  text: labelText(
                    mode,
                    "LAPORAN LENGKAP KEPUTUSAN CODAS",
                    "COMPLETE CODAS DECISION REPORT",
                  ),
                  bold: true,
                  size: 28,
                  color: BW_COLORS.headerText,
                },
                {
                  text: "Combinative Distance-based Assessment (CODAS)",
                  size: 19,
                  color: "DDDDDD",
                },
                {
                  text: `${langLabel}  |  ${labelText(mode, "Dibuat", "Generated")}: ${generatedAt}  |  tau = ${model.tau}`,
                  size: 17,
                  color: "CCCCCC",
                },
              ],
              { fill: BW_COLORS.headerBg },
            ),
          ],
        }),
      ],
    }),
  );

  // =========================================================================
  // 1. GUIDE & FORMULAS
  // =========================================================================
  children.push(
    addSectionHeading(
      labelText(
        mode,
        "1. Panduan, Metodologi & Rumus CODAS (Setara Lembar Guide)",
        "1. Guide, Methodology & CODAS Formulas (Guide Sheet)",
      ),
    ),
  );
  children.push(
    addBodyParagraph(
      labelText(
        mode,
        "Metode Combinative Distance-based Assessment (CODAS) menentukan peringkat alternatif dengan mengkombinasikan jarak Euclidean (ukuran utama) dan jarak Taxicab (ukuran sekunder) terhadap titik solusi ideal negatif (NS). Parameter ambang tau menentukan kapan selisih jarak Taxicab diikutsertakan ketika dua alternatif memiliki jarak Euclidean yang berdekatan.",
        "The Combinative Distance-based Assessment (CODAS) method ranks alternatives by combining Euclidean distance (primary measure) and Taxicab distance (secondary measure) from the negative-ideal solution (NS). The threshold parameter tau governs when Taxicab distance differences break close Euclidean comparisons.",
      ),
    ),
  );
  children.push(
    addBodyParagraph(
      `${labelText(mode, "Sitasi Jurnal", "Journal Citation")}: ${JOURNAL_REFERENCE.citationEn}`,
      { italics: true, size: 17, color: BW_COLORS.subText },
    ),
  );
  children.push(
    addSubHeading(
      labelText(
        mode,
        "Ringkasan Rumus Matematis CODAS (Langkah 1 - 8)",
        "CODAS Mathematical Formula Reference (Steps 1 - 8)",
      ),
    ),
  );
  children.push(makeFormulaTable(mode));

  // =========================================================================
  // 2. INPUTS
  // =========================================================================
  children.push(
    addSectionHeading(
      labelText(
        mode,
        "2. Data Masukan Model (Setara Lembar Inputs)",
        "2. Model Inputs (Inputs Sheet)",
      ),
    ),
  );
  children.push(
    addBodyParagraph(
      `${labelText(mode, "Jumlah Kriteria", "Criteria")}: ${model.criteria.length}  |  ${labelText(mode, "Jumlah Alternatif", "Alternatives")}: ${model.alternatives.length}  |  ${labelText(mode, "Total Bobot", "Total Weight")}: ${formatNum(totalWeight, 4)}  |  Threshold (tau) = ${model.tau}`,
    ),
  );
  children.push(
    addSubHeading(
      labelText(
        mode,
        "2A. Konfigurasi Kriteria, Tipe & Bobot",
        "2A. Criteria Configuration, Direction & Weights",
      ),
    ),
  );
  children.push(
    makeSimpleTable(
      [
        "ID",
        labelText(mode, "Nama (Indonesia)", "Name (ID)"),
        labelText(mode, "Nama (English)", "Name (EN)"),
        labelText(mode, "Tipe (Arah)", "Type (Direction)"),
        labelText(mode, "Bobot (w_j)", "Weight (w_j)"),
      ],
      [
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
      {
        rightAlignFromCol: 4,
        highlightRowIndices: [model.criteria.length],
      },
    ),
  );

  children.push(
    addSubHeading(
      labelText(
        mode,
        "2B. Daftar Alternatif & Matriks Keputusan Awal (X)",
        "2B. Alternatives & Original Decision Matrix (X)",
      ),
    ),
  );
  children.push(
    makeSimpleTable(
      [
        labelText(mode, "Alternatif", "Alternative"),
        ...model.criteria.map((c) => critShortHeader(c, mode)),
      ],
      model.alternatives.map((alt, i) => [
        altLabel(alt, mode),
        ...result.decisionMatrix[i].map((v) => formatNum(v, 2)),
      ]),
      { rightAlignFromCol: 1 },
    ),
  );

  // =========================================================================
  // 3. NORMALIZED MATRIX (WITH PROVENANCE)
  // =========================================================================
  children.push(
    addSectionHeading(
      labelText(
        mode,
        "3. Matriks Keputusan Ternormalisasi (Setara Lembar Normalized)",
        "3. Normalized Decision Matrix (Normalized Sheet)",
      ),
    ),
  );
  children.push(
    addBodyParagraph(
      labelText(
        mode,
        "Sumber perhitungan: Benefit n_ij = x_ij / max_i(x_ij) | Cost n_ij = min_i(x_ij) / x_ij (x_ij diambil dari Matriks X pada Bagian 2B).",
        "Calculation provenance: Benefit n_ij = x_ij / max_i(x_ij) | Cost n_ij = min_i(x_ij) / x_ij (x_ij sourced from Matrix X in Section 2B).",
      ),
      { size: 17, color: BW_COLORS.subText },
    ),
  );
  children.push(
    makeSimpleTable(
      [
        labelText(mode, "Alternatif / Statistik", "Alternative / Stat"),
        ...model.criteria.map(
          (c) => `${c.id} (${c.type === "benefit" ? "Benefit" : "Cost"})`,
        ),
      ],
      [
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
      { rightAlignFromCol: 1, highlightRowIndices: [0] },
    ),
  );

  // =========================================================================
  // 4. WEIGHTED MATRIX (R) & NEGATIVE-IDEAL (NS)
  // =========================================================================
  children.push(
    addSectionHeading(
      labelText(
        mode,
        "4. Matriks Ternormalisasi Terbobot & Solusi Ideal Negatif (Setara Lembar Weighted)",
        "4. Weighted Normalized Matrix & Negative-Ideal Solution (Weighted Sheet)",
      ),
    ),
  );
  children.push(
    addBodyParagraph(
      labelText(
        mode,
        "Sumber perhitungan: r_ij = w_j × n_ij (w_j dari Bagian 2A, n_ij dari Bagian 3). Baris NS memilih nilai minimum tiap kolom r_ij beserta kode alternatif sumbernya.",
        "Calculation provenance: r_ij = w_j × n_ij (weight w_j from Section 2A, n_ij from Section 3). The NS row selects each column minimum r_ij and shows its source alternative.",
      ),
      { size: 17, color: BW_COLORS.subText },
    ),
  );
  children.push(
    makeSimpleTable(
      [
        labelText(mode, "Alternatif", "Alternative"),
        ...model.criteria.map((c) => `${c.id} (w=${formatNum(c.weight, 4)})`),
      ],
      [
        ...model.alternatives.map((alt, i) => [
          altLabel(alt, mode),
          ...result.weightedNormalizedMatrix[i].map((v, j) => {
            const w = model.criteria[j].weight;
            const nVal = result.normalizedMatrix[i][j];
            return `${formatNum(v, decimals)}\n(${formatNum(w, 4)} × ${formatNum(nVal, decimals)})`;
          }),
        ]),
        [
          labelText(mode, "NS (Solusi Ideal Negatif)", "NS (Negative-Ideal)"),
          ...result.negativeIdeal.map((v, j) => {
            const minAlts = model.alternatives
              .filter(
                (_, rowIdx) =>
                  Math.abs(result.weightedNormalizedMatrix[rowIdx][j] - v) <=
                  1e-12,
              )
              .map((a) => a.id);
            return `${formatNum(v, decimals)}\n(min: ${minAlts.join(", ")})`;
          }),
        ],
      ],
      { rightAlignFromCol: 1, highlightRowIndices: [model.alternatives.length] },
    ),
  );

  // =========================================================================
  // 5. DISTANCES
  // =========================================================================
  children.push(
    addSectionHeading(
      labelText(
        mode,
        "5. Jarak Euclidean, Taxicab & Kontribusi Deviasi (Setara Lembar Distances)",
        "5. Euclidean, Taxicab & Deviation Contributions (Distances Sheet)",
      ),
    ),
  );
  children.push(
    addSubHeading(
      labelText(
        mode,
        "5A. Ringkasan Jarak Euclidean (E_i) dan Jarak Taxicab (T_i) beserta Asal Hitung",
        "5A. Euclidean (E_i) & Taxicab (T_i) Distance Summary with Derivation",
      ),
    ),
  );
  children.push(
    makeSimpleTable(
      [
        labelText(mode, "Alternatif", "Alternative"),
        labelText(
          mode,
          "Asal E_i = √(∑(r_ij - ns_j)²)",
          "Source of E_i = √(∑(r_ij - ns_j)²)",
        ),
        "E_i",
        labelText(
          mode,
          "Asal T_i = ∑|r_ij - ns_j|",
          "Source of T_i = ∑|r_ij - ns_j|",
        ),
        "T_i",
      ],
      model.alternatives.map((alt, i) => {
        const bd = result.distanceBreakdowns[i];
        const sumSq = bd.perCriterionSquaredDiff.reduce((s, v) => s + v, 0);
        const absExpr = bd.perCriterionAbsDiff
          .map((v) => formatNum(v, decimals))
          .join(" + ");
        return [
          altLabel(alt, mode),
          `√(${formatNum(sumSq, decimals)})`,
          formatNum(result.euclideanDistances[i], decimals),
          absExpr,
          formatNum(result.taxicabDistances[i], decimals),
        ];
      }),
      { rightAlignFromCol: 1 },
    ),
  );

  children.push(
    addSubHeading(
      labelText(
        mode,
        "5B. Kontribusi Kuadrat Deviasi per Kriteria: (r_ij - ns_j)² -> Jumlah -> E_i",
        "5B. Per-Criterion Squared Deviations: (r_ij - ns_j)² -> Sum -> E_i",
      ),
    ),
  );
  children.push(
    makeSimpleTable(
      [
        labelText(mode, "Alternatif", "Alternative"),
        ...model.criteria.map((c) => c.id),
        labelText(mode, "Jumlah (Sum)", "Row Sum"),
        "E_i = √(Sum)",
      ],
      model.alternatives.map((alt, i) => {
        const bd = result.distanceBreakdowns[i];
        const sumSq = bd.perCriterionSquaredDiff.reduce((s, v) => s + v, 0);
        return [
          altLabel(alt, mode),
          ...bd.perCriterionSquaredDiff.map(
            (v, j) =>
              `${formatNum(v, decimals)}\n(${formatNum(bd.perCriterionDiff[j], decimals)})²`,
          ),
          formatNum(sumSq, decimals),
          formatNum(bd.euclidean, decimals),
        ];
      }),
      { rightAlignFromCol: 1 },
    ),
  );

  children.push(
    addSubHeading(
      labelText(
        mode,
        "5C. Kontribusi Deviasi Absolut per Kriteria: |r_ij - ns_j| -> T_i",
        "5C. Per-Criterion Absolute Deviations: |r_ij - ns_j| -> T_i",
      ),
    ),
  );
  children.push(
    makeSimpleTable(
      [
        labelText(mode, "Alternatif", "Alternative"),
        ...model.criteria.map((c) => c.id),
        "T_i = Sum",
      ],
      model.alternatives.map((alt, i) => {
        const bd = result.distanceBreakdowns[i];
        return [
          altLabel(alt, mode),
          ...bd.perCriterionAbsDiff.map(
            (v, j) =>
              `${formatNum(v, decimals)}\n|${formatNum(result.weightedNormalizedMatrix[i][j], decimals)} - ${formatNum(result.negativeIdeal[j], decimals)}|`,
          ),
          formatNum(bd.taxicab, decimals),
        ];
      }),
      { rightAlignFromCol: 1 },
    ),
  );

  // =========================================================================
  // 6. RELATIVE ASSESSMENT
  // =========================================================================
  children.push(
    addSectionHeading(
      labelText(
        mode,
        `6. Matriks Penilaian Relatif (Setara Lembar Relative, tau = ${model.tau})`,
        `6. Relative Assessment Matrix (Relative Sheet, tau = ${model.tau})`,
      ),
    ),
  );
  children.push(
    addBodyParagraph(
      labelText(
        mode,
        `Sumber perhitungan: nilai E_i dan T_i berasal dari Bagian 5A. Ambang ψ = 1 jika |E_i - E_k| ≥ ${model.tau}, selain itu 0. Kemudian h_ik = (E_i - E_k) + ψ × (T_i - T_k).`,
        `Calculation provenance: E_i and T_i values come from Section 5A. Threshold ψ = 1 when |E_i - E_k| ≥ ${model.tau}, else 0. Then h_ik = (E_i - E_k) + ψ × (T_i - T_k).`,
      ),
      { size: 17, color: BW_COLORS.subText },
    ),
  );
  children.push(
    addSubHeading(
      labelText(
        mode,
        `6A. Matriks Aktivasi Ambang ψ(E_i - E_k) untuk τ = ${model.tau}`,
        `6A. Threshold Activation Matrix ψ(E_i - E_k) for τ = ${model.tau}`,
      ),
    ),
  );
  children.push(
    makeSimpleTable(
      ["i / k", ...model.alternatives.map((a) => a.id)],
      model.alternatives.map((alt, i) => [
        alt.id,
        ...result.relativePairs[i].map((pair, k) => {
          if (i === k) return "0\n(i=k)";
          const op = pair.psi === 1 ? "≥" : "<";
          return `${pair.psi}\n(|${formatNum(pair.absEDiff, decimals)}| ${op} ${model.tau})`;
        }),
      ]),
      { centerAll: true },
    ),
  );

  children.push(
    addSubHeading(
      labelText(
        mode,
        "6B. Matriks Penilaian Relatif h_ik = (E_i - E_k) + ψ(T_i - T_k) & H_i",
        "6B. Relative Assessment Matrix h_ik = (E_i - E_k) + ψ(T_i - T_k) & H_i",
      ),
    ),
  );
  children.push(
    makeSimpleTable(
      ["i / k", ...model.alternatives.map((a) => a.id), "H_i"],
      model.alternatives.map((alt, i) => [
        alt.id,
        ...result.relativeAssessmentMatrix[i].map((v, k) => {
          if (i === k) return `${formatNum(v, decimals)}\n(0)`;
          const pair = result.relativePairs[i][k];
          return `${formatNum(v, decimals)}\n(${formatNum(pair.eDiff, decimals)} + ${pair.psi}×(${formatNum(pair.tDiff, decimals)}))`;
        }),
        `${formatNum(result.assessmentScores[i], decimals)}\n(sum baris)`,
      ]),
      { rightAlignFromCol: 1, highlightColIndex: model.alternatives.length + 1 },
    ),
  );

  children.push(
    addSubHeading(
      labelText(
        mode,
        "6C. Asal Penjumlahan Skor Penilaian Akhir (H_i = ∑_k h_ik)",
        "6C. Assessment Score Summation Trace (H_i = ∑_k h_ik)",
      ),
    ),
  );
  children.push(
    makeSimpleTable(
      [
        labelText(mode, "Alternatif", "Alternative"),
        labelText(
          mode,
          "Penjumlahan Baris Matriks 6B (h_i1 + ... + h_in)",
          "Row Summation from Matrix 6B (h_i1 + ... + h_in)",
        ),
        "H_i",
      ],
      model.alternatives.map((alt, i) => [
        altLabel(alt, mode),
        result.relativeAssessmentMatrix[i]
          .map((v) => formatNum(v, decimals))
          .join(" + "),
        formatNum(result.assessmentScores[i], decimals),
      ]),
      { rightAlignFromCol: 2, highlightColIndex: 2 },
    ),
  );

  // =========================================================================
  // 7. RANKING & INTERPRETATION
  // =========================================================================
  children.push(
    addSectionHeading(
      labelText(
        mode,
        "7. Skor Penilaian & Perangkingan Akhir (Setara Lembar Ranking)",
        "7. Assessment Scores & Final Ranking (Ranking Sheet)",
      ),
    ),
  );
  children.push(
    addBodyParagraph(
      labelText(
        mode,
        "Peringkat ditentukan dengan mengurutkan skor H_i (dari Bagian 6B/6C) dari nilai terbesar ke terkecil, dengan E_i dan T_i bersumber dari Bagian 5A.",
        "Final ranks are determined by sorting assessment scores H_i (from Section 6B/6C) in descending order, with E_i and T_i carried from Section 5A.",
      ),
      { size: 17, color: BW_COLORS.subText },
    ),
  );
  children.push(
    makeSimpleTable(
      [
        labelText(mode, "Peringkat", "Rank"),
        "ID",
        labelText(mode, "Alternatif", "Alternative"),
        "E_i (5A)",
        "T_i (5A)",
        labelText(mode, "Skor H_i (6C)", "Score H_i (6C)"),
        "Status",
      ],
      result.ranking.map((item) => {
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
          item.rank === 1 ? labelText(mode, "Terbaik", "Preferred") : "",
        ];
      }),
      { rightAlignFromCol: 3, highlightRowIndices: [0] },
    ),
  );

  children.push(
    addSubHeading(
      labelText(
        mode,
        "7B. Interpretasi Peringkat Teratas & Catatan Presisi",
        "7B. Top-Rank Interpretation & Precision Notes",
      ),
    ),
  );
  if (mode === "bilingual") {
    children.push(
      addBodyParagraph(buildRankingExplanation(model, result, "id", decimals)),
    );
    children.push(
      addBodyParagraph(buildRankingExplanation(model, result, "en", decimals)),
    );
  } else {
    children.push(
      addBodyParagraph(buildRankingExplanation(model, result, mode, decimals)),
    );
  }

  children.push(
    addBodyParagraph(
      labelText(
        mode,
        "Catatan: Seluruh perhitungan antara dilakukan dengan presisi penuh (floating-point) dan hanya dibulatkan saat ditampilkan. Aturan seri menggunakan peringkat kompetisi menurun (nilai identik dalam toleransi 1e-12 mendapat peringkat yang sama). Hasil peringkat sepenuhnya bergantung pada data input, bobot kriteria, arah Benefit/Cost, dan nilai parameter tau yang dimasukkan pengguna.",
        "Disclaimer: All intermediate calculations retain full floating-point precision and are rounded only for display. Tie handling assigns equal descending competition ranks within 1e-12 numerical tolerance. Ranking outcomes depend strictly on the supplied input values, criterion weights, Benefit/Cost directions, and threshold parameter tau.",
      ),
      { italics: true, size: 17, color: BW_COLORS.subText },
    ),
  );

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `CODAS DSS Report | ${JOURNAL_REFERENCE.doi}  —  ${labelText(mode, "Halaman", "Page")} `,
                    size: 16,
                    color: BW_COLORS.subText,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: BW_COLORS.subText,
                  }),
                  new TextRun({
                    text: " / ",
                    size: 16,
                    color: BW_COLORS.subText,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: BW_COLORS.subText,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

export async function buildCodasWordBuffer(
  model: CodasModel,
  result: CodasResult,
  mode: WordExportLanguage = "id",
  decimals: number = 4,
): Promise<Uint8Array> {
  const doc = buildCodasWordDocument(model, result, mode, decimals);
  return Packer.toBuffer(doc);
}

export async function exportCodasWord(
  model: CodasModel,
  result: CodasResult,
  mode: WordExportLanguage = "id",
  decimals: number = 4,
): Promise<void> {
  const doc = buildCodasWordDocument(model, result, mode, decimals);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);

  const link = document.createElement("a");
  link.href = url;
  link.download = `codas-report-${mode}-${stamp}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

