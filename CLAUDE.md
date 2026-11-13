# CLAUDE.md — CODAS Decision Support System

> **Project brief / Ringkasan proyek**  
> Build a bilingual (Bahasa Indonesia–English) web-based Decision Support System (DSS) that implements the **Combinative Distance-based Assessment (CODAS)** method. The application must explain every calculation step with clear animations, produce a final ranking, and export both PDF reports and a genuinely formula-driven Excel workbook. Users must also be able to customize criteria and alternatives.

---

## 1. Project goals / Tujuan proyek

### Bahasa Indonesia
Bangun aplikasi web Sistem Pendukung Keputusan (SPK) menggunakan metode CODAS untuk membantu pengguna melakukan pemeringkatan alternatif berdasarkan sejumlah kriteria dan bobot. Aplikasi harus:

1. Menyediakan contoh kasus awal sesuai jurnal Badi, Ballem, dan Shetwan (2018).
2. Menjelaskan proses CODAS secara bertahap dari matriks keputusan hingga hasil perangkingan, dengan animasi/transisi yang membantu pengguna memahami perubahan data.
3. Menyediakan mode bilingual Bahasa Indonesia dan English.
4. Memungkinkan pengguna mengubah, menambah, dan menghapus kriteria serta alternatif.
5. Menghitung ulang seluruh hasil secara otomatis ketika input, bobot, tipe kriteria, nilai ambang, atau struktur data berubah.
6. Menghasilkan PDF laporan dan Excel yang berisi formula Excel asli, bukan hanya angka hasil salinan.
7. Menampilkan hasil yang transparan, dapat ditelusuri, dan konsisten antara web, PDF, dan Excel.

### English
Build a web-based Decision Support System (DSS) using the **Combinative Distance-based Assessment (CODAS)** method to rank alternatives against weighted criteria. The application must:

1. Include the journal's original case study as its default example.
2. Explain every CODAS calculation step through guided animations and transitions.
3. Support Bahasa Indonesia and English throughout the user interface and generated reports.
4. Allow users to add, edit, and delete criteria and alternatives.
5. Recalculate all dependent results whenever input values, weights, criterion types, the threshold parameter, or the decision structure changes.
6. Export a PDF report and a formula-driven Excel workbook. Excel cells must contain working spreadsheet formulas, not merely pasted calculation results.
7. Make the calculation process transparent, traceable, and consistent across the web app, PDF, and Excel.

---

## 2. Source of truth: journal case study

Use the uploaded paper as the reference for the default example:

**Badi, I., Ballem, M., & Shetwan, A. (2018).** *Site Selection of Desalination Plant in Libya by Using Combinative Distance-Based Assessment (CODAS) Method.* International Journal for Quality Research, 12(3), 609–624. https://doi.org/10.18421/IJQR12.03-04

Do not silently replace the paper's sample criteria, alternatives, weights, or decision-matrix values with unrelated examples. Keep the journal case study available as a resettable preset.

### 2.1 Default alternatives / Alternatif awal

| ID | Alternative (English) | Alternatif (Indonesia) |
|---|---|---|
| S1 | Tripoli | Tripoli |
| S2 | Zawia | Zawia |
| S3 | Qarabouli | Qarabouli |
| S4 | Surman | Surman |
| S5 | Suggested Location | Lokasi Usulan |

### 2.2 Default criteria / Kriteria awal

The paper uses five criteria. Preserve the original labels and weights:

| ID | Criterion (English) | Kriteria (Indonesia) | Weight |
|---|---|---|---:|
| C1 | Raw Water Proximity | Kedekatan dengan Air Baku | 0.19 |
| C2 | Raw Water Quality | Kualitas Air Baku | 0.26 |
| C3 | Product Water Distribution Network | Jaringan Distribusi Air Produk | 0.24 |
| C4 | Vicinity Power Plants / Electrical Network | Kedekatan dengan Pembangkit / Jaringan Listrik | 0.17 |
| C5 | Cost | Biaya | 0.14 |

Total weight must equal **1.00** (within a configurable numerical tolerance). Show the total live while editing weights.

**Criterion types from the paper:**
- C1 Raw Water Proximity: **Cost**
- C2 Raw Water Quality: **Benefit**
- C3 Product Water Distribution Network: **Benefit**
- C4 Vicinity Power Plants / Electrical Network: **Benefit**
- C5 Cost: **Cost**

The paper's prose explicitly identifies proximity and cost as cost criteria; the other three are benefit criteria. Make this distinction visible in the interface.

### 2.3 Default decision matrix / Matriks keputusan awal

Use the following values exactly as the paper's Table 2:

| Alternative | C1 Proximity | C2 Quality | C3 Network | C4 Vicinity | C5 Cost |
|---|---:|---:|---:|---:|---:|
| S1 Tripoli | 8 | 8 | 10 | 9 | 5 |
| S2 Zawia | 8 | 9 | 9 | 9 | 8 |
| S3 Qarabouli | 9 | 9 | 7 | 8 | 6 |
| S4 Surman | 8 | 8 | 7 | 8 | 9 |
| S5 Suggested Location | 9 | 8 | 7 | 7 | 4 |

Default threshold parameter:
- Symbol: **τ (tau)**
- Default value: **0.02**
- The paper suggests 0.01–0.05 as a practical range, while its case study uses 0.02.
- Allow the user to edit τ and recalculate the ranking.

### 2.4 Important source interpretation

The paper's case study reports Tripoli (S1) as the highest-scoring alternative and best location. It also reports a sensitivity analysis over multiple τ values. Treat this as a reference result for validating the preset, not as a hard-coded answer. The application must calculate results from the input data.

The article contains a few apparent table-label inconsistencies in its extracted Table 5 (including a repeated S5 row label). Do not copy that apparent typo into the application's generated matrix. Generate the relative assessment matrix using the actual alternative IDs in their correct order.

---

## 3. CODAS calculation engine / Mesin perhitungan CODAS

Implement the classical CODAS procedure described in the paper and attributed there to Keshavarz Ghorabaee et al. (2016). Keep the calculation engine separate from UI components and export code.

Let:
- `n` = number of alternatives
- `m` = number of criteria
- `x_ij` = performance value of alternative `i` on criterion `j`
- `w_j` = weight of criterion `j`
- `τ` = threshold parameter
- `Nb` = set of benefit criteria
- `Nc` = set of cost criteria

### Step 1 — Decision matrix / Matriks keputusan

Construct:

\[
X=[x_{ij}]_{n\times m}
\]

Rows represent alternatives and columns represent criteria. Validate that all required values are numeric and finite.

### Step 2 — Normalized decision matrix / Matriks keputusan ternormalisasi

Use the linear normalization specified in the paper:

For a **benefit** criterion:

\[
n_{ij}=\frac{x_{ij}}{\max_i x_{ij}}
\]

For a **cost** criterion:

\[
n_{ij}=\frac{\min_i x_{ij}}{x_{ij}}
\]

Important implementation details:
- Benefit criteria are maximized; cost criteria are minimized.
- Handle a zero denominator or a column containing all zeros safely. Do not return `NaN` or `Infinity`. Display a clear validation message or apply a documented mathematically safe rule.
- If all values in a criterion column are identical and nonzero, normalized values should be 1.
- Explain the normalization direction in the step-by-step UI.

### Step 3 — Weighted normalized decision matrix / Matriks ternormalisasi terbobot

\[
r_{ij}=w_j\,n_{ij}
\]

Weights must be non-negative and sum to 1. Do not silently normalize user-entered weights without telling the user. Prefer validation with an explicit action such as **Normalize Weights / Normalisasi Bobot**.

### Step 4 — Negative-ideal solution / Solusi ideal negatif

For each criterion:

\[
ns_j=\min_i(r_{ij})
\]

The negative-ideal solution is the vector:

\[
NS=[ns_1,ns_2,\ldots,ns_m]
\]

### Step 5 — Euclidean and Taxicab distances / Jarak Euclidean dan Taxicab

For each alternative:

\[
E_i=\sqrt{\sum_{j=1}^{m}(r_{ij}-ns_j)^2}
\]

\[
T_i=\sum_{j=1}^{m}|r_{ij}-ns_j|
\]

Use the weighted normalized matrix and negative-ideal solution. Display the per-criterion distance contributions so users can inspect how each distance was obtained.

### Step 6 — Relative assessment matrix / Matriks penilaian relatif

For every ordered pair of alternatives `(i, k)`:

\[
h_{ik}=(E_i-E_k)+\psi(E_i-E_k)(T_i-T_k)
\]

Threshold function:

\[
\psi(x)=
\begin{cases}
1,& |x|\geq\tau\\
0,& |x|<\tau
\end{cases}
\]

Use the absolute value for the threshold comparison. The matrix is `n × n`, and its diagonal entries must be zero.

The paper recommends a τ value between 0.01 and 0.05 and uses 0.02 in its case study. The user can change τ. Explain that τ controls when the Taxicab distance is used as a secondary comparison when Euclidean-distance differences are small.

### Step 7 — Assessment score / Nilai penilaian

For each alternative:

\[
H_i=\sum_{k=1}^{n}h_{ik}
\]

Sum each row of the relative assessment matrix. Keep full internal precision; round only for display.

### Step 8 — Ranking / Perangkingan

Sort alternatives by **descending** assessment score `H_i`. The highest score receives rank 1 and is the preferred alternative.

Define deterministic tie handling:
- If displayed scores look equal due to rounding, compare unrounded values.
- If values are equal within a documented tolerance, assign equal rank or use a clearly disclosed stable tie-break rule. Never imply a meaningful difference that does not exist.

### Numerical precision and validation

- Use full floating-point precision internally.
- Display a configurable number of decimal places (default 4 or 6).
- Do not round intermediate calculations.
- Recalculate all dependent steps whenever relevant inputs change.
- Keep a single calculation implementation as the source of truth for the web result and PDF data.
- Test the implementation against the journal's preset tables and reported ranking. If a discrepancy appears, investigate formula interpretation, criterion direction, and rounding. Do not hard-code the paper's final ranking.

---

## 4. Interactive calculation walkthrough / Penjelasan perhitungan interaktif

This is a core feature, not a decorative extra. Users must be able to understand how the system reaches the ranking.

Create a guided stepper/timeline with these stages:

1. Decision Matrix — Matriks Keputusan
2. Normalized Matrix — Normalisasi
3. Weighted Normalized Matrix — Normalisasi Terbobot
4. Negative-Ideal Solution — Solusi Ideal Negatif
5. Euclidean & Taxicab Distances — Jarak Euclidean & Taxicab
6. Relative Assessment Matrix — Matriks Penilaian Relatif
7. Assessment Scores — Nilai Penilaian
8. Final Ranking — Hasil Perangkingan

### Interaction requirements

- Each step has a **Previous / Sebelumnya** and **Next / Selanjutnya** control.
- Animate the transition between stages; use restrained, purposeful motion (fade, slide, cell highlight, number count-up).
- Highlight the cells and values involved in the current calculation.
- Show the formula, variable definitions, substituted values, and resulting value.
- Provide a short explanation in both languages.
- Let users replay an animation or jump to any completed step.
- Provide a persistent progress indicator, e.g. `Step 3 of 8`.
- On input changes, mark later steps as recalculated and refresh their values. Do not show stale results.
- Include a **Show Formula / Tampilkan Rumus** toggle and a **Show Detailed Calculation / Tampilkan Perhitungan Detail** mode.
- Respect `prefers-reduced-motion`; animations must not be required to understand the data.
- Animation must not delay calculation correctness or block interaction.

### Suggested visual treatment

- Use a clean academic dashboard style.
- Tables should be readable and horizontally scrollable on small screens.
- Highlight the active row/column and the current alternative being explained.
- For pairwise comparisons, allow the user to select an alternative pair `(i, k)` and inspect `E_i`, `E_k`, `T_i`, `T_k`, `ψ`, and `h_ik`.
- At the final stage, animate alternatives moving into their rank positions, while also showing the exact `H_i` values.
- Avoid excessive glow, sparkle, or distracting effects. Prioritize clarity and accessibility.

---

## 5. Custom criteria and alternatives / Pengaturan kriteria dan alternatif

Provide a dedicated **Model Builder / Pengaturan Model** area.

### Criteria management

Users can:
- Add a criterion.
- Edit its name in Bahasa Indonesia and English.
- Change its weight.
- Choose its type: Benefit or Cost.
- Delete a criterion (with confirmation).
- Reorder criteria.
- See the live total weight.
- Restore the journal's five-criterion preset.

Each criterion should have:
- Stable ID (not based on its editable name).
- `nameId`
- `nameEn`
- `weight`
- `type: "benefit" | "cost"`
- Optional description in Indonesian and English.

### Alternatives management

Users can:
- Add an alternative.
- Edit its name in Bahasa Indonesia and English.
- Edit its value for every criterion.
- Delete an alternative (with confirmation).
- Reorder alternatives.
- Restore the journal's five-alternative preset.

Each alternative should have:
- Stable ID.
- `nameId`
- `nameEn`
- A numeric value for every criterion, keyed by criterion ID.

### Model validation

- Require at least 2 alternatives and 1 criterion.
- Require unique IDs.
- Require unique non-empty names within the relevant language.
- Require finite numeric decision values.
- Require non-negative weights and total weight equal to 1 within tolerance before calculation.
- Require τ to be numeric and non-negative. Warn if it is outside the paper's suggested 0.01–0.05 range, but do not silently prohibit legitimate experimentation.
- When deleting a criterion, remove its corresponding values from every alternative.
- When adding a criterion, require the user to enter values for all alternatives before calculation.
- When adding an alternative, require values for all criteria.
- Show validation errors close to the relevant field.
- Never silently discard user-entered data.

### User experience

- Provide clear tabs or sections for **Criteria / Kriteria**, **Alternatives / Alternatif**, and **Decision Matrix / Matriks Keputusan**.
- Use inline editing or a focused edit dialog.
- Provide reset-to-journal-preset with a confirmation dialog.
- Clearly distinguish the journal preset from a user-customized model.
- Keep custom data in application state and, if persistence is implemented, make save/reset behavior explicit.

---

## 6. Bilingual requirements / Persyaratan dua bahasa

The whole product must support **Bahasa Indonesia** and **English**, not only the landing page.

Provide a visible language switcher in the main navigation. Persist the selected language if appropriate.

Translate:
- Navigation, buttons, labels, tooltips, empty states, errors, confirmations.
- Criteria and alternative names.
- Step-by-step explanations.
- Formula descriptions and variable definitions.
- Ranking interpretation.
- PDF report headings and explanatory text.
- Excel sheet names where practical, or use concise language-neutral names and bilingual labels within sheets.

Use terminology consistently with the journal:
- Combinative Distance-based Assessment (CODAS)
- Decision Matrix / Matriks Keputusan
- Normalized Decision Matrix / Matriks Keputusan Ternormalisasi
- Weighted Normalized Decision Matrix / Matriks Ternormalisasi Terbobot
- Negative-Ideal Solution / Solusi Ideal Negatif
- Euclidean Distance / Jarak Euclidean
- Taxicab Distance / Jarak Taxicab
- Relative Assessment Matrix / Matriks Penilaian Relatif
- Assessment Score / Nilai Penilaian
- Ranking / Perangkingan
- Benefit Criterion / Kriteria Benefit
- Cost Criterion / Kriteria Cost
- Threshold Parameter (τ) / Parameter Ambang (τ)

Do not translate mathematical symbols or change the meaning of the CODAS formulas.

---

## 7. PDF export / Ekspor PDF

Provide a **Download PDF / Unduh PDF** action.

The PDF must be a professional, print-ready report containing:
1. Report title and generation date.
2. Selected language (or bilingual labels if bilingual report mode is enabled).
3. Method overview and CODAS reference.
4. Model configuration: criteria, weights, criterion types, alternatives, τ.
5. Original decision matrix.
6. Normalized decision matrix.
7. Weighted normalized decision matrix.
8. Negative-ideal solution.
9. Euclidean and Taxicab distances.
10. Relative assessment matrix.
11. Assessment scores and final ranking.
12. A concise explanation of why the top-ranked alternative is ranked first.
13. Formula definitions and calculation notes.
14. A note that results depend on the supplied input data and weights.

PDF rules:
- Generate from the current calculated model, not from stale or hard-coded sample data.
- Use readable typography, consistent number formatting, page numbers, and table headers.
- Support multi-page tables and prevent clipped columns.
- Include the journal citation.
- Make the report language follow the selected language, with an optional bilingual mode.
- Clearly state τ and the benefit/cost direction of each criterion.

---

## 8. Excel export — real formulas, not static values

Provide a **Download Excel / Unduh Excel** action. This is a critical acceptance requirement.

The exported `.xlsx` workbook must contain **working Excel formulas** for every dependent CODAS calculation. Do not export a workbook where calculated outputs are pasted as static numbers. When the user changes a decision value, criterion weight, criterion type, or τ in Excel, dependent matrices, distances, assessment scores, and ranking must update through spreadsheet formulas.

Use a library capable of writing formulas (for example, `openpyxl` in a Python backend or a suitable equivalent). Formula cells must be actual Excel formulas beginning with `=`. Do not rely on macros/VBA for the normal calculation flow.

### Required workbook sheets

Suggested sheets (names may be localized, but keep them consistent):

1. `Guide` — bilingual instructions and methodology reference.
2. `Inputs` — editable criteria, weights, types, alternatives, and decision matrix.
3. `Normalized` — formulas for normalized decision matrix.
4. `Weighted` — formulas for weighted normalized matrix and negative-ideal vector.
5. `Distances` — formulas for Euclidean and Taxicab distances.
6. `Relative` — formulas for every `h_ik` pair.
7. `Ranking` — formulas for assessment scores and rank.

### Workbook formula behavior

- Input cells should be visually distinguishable from formula cells.
- Include editable weight and type cells. Use data validation dropdowns for `Benefit` / `Cost` if supported.
- Use formulas referencing the `Inputs` sheet; avoid hard-coded input values inside calculation formulas.
- Formula ranges must accommodate the current number of criteria and alternatives.
- When the exported workbook is opened in Excel, formulas must recalculate. Set workbook calculation mode to automatic.
- Avoid formulas that depend on unsupported functions in common Excel versions unless a compatibility note is provided.
- Use absolute and mixed references carefully so copied formulas remain correct.
- Use named ranges only if they improve maintainability; do not make formulas fragile.
- Include formula explanations in the Guide sheet.
- Protect neither inputs nor formulas by default unless the user explicitly requests protection. If protection is used, leave input cells editable and explain how to unprotect.
- Do not use VBA/macros as a requirement.
- Ensure formula results are calculated by Excel/LibreOffice on opening. Note that `openpyxl` writes formulas but does not calculate them itself; configure automatic recalculation and, where possible, validate by opening/recalculating a test copy with LibreOffice or Excel.

### Formula design notes

The workbook must support dynamic dimensions. Build the workbook generator based on the actual count of criteria and alternatives at export time. Formulas can be written explicitly for each generated row/column, with references to editable input cells.

For each criterion column:
- Benefit normalization: `=input_cell/MAX(input_column_range)`
- Cost normalization: `=MIN(input_column_range)/input_cell`
- Use an IF branch based on the editable criterion type cell.
- Add safeguards for zero values and invalid input. Prefer clear validation and blank/error handling over silent misleading values.

Weighted normalization:
- `=normalized_cell*weight_cell`

Negative ideal:
- `=MIN(weighted_column_range)`

Euclidean distance:
- `=SQRT(SUMXMY2(weighted_row_range,negative_ideal_range))` may be used if compatible with the chosen Excel version; otherwise generate the explicit `SQRT(SUMPRODUCT((range1-range2)^2))` equivalent.

Taxicab distance:
- `=SUMPRODUCT(ABS(weighted_row_range-negative_ideal_range))` if supported by the target Excel version; otherwise generate explicit `SUM(ABS(...))` expressions or helper cells to ensure compatibility.

Relative assessment:
- `=(E_i-E_k)+IF(ABS(E_i-E_k)>=tau,1,0)*(T_i-T_k)`

Assessment score:
- `=SUM(relative_row_range)`

Ranking:
- Use a formula such as `=RANK.EQ(score_cell,score_range,0)` for descending rank, or a compatible alternative. Handle ties consistently.

**Important:** If the user changes a value in `Inputs`, all dependent formulas must update. If the user changes the number of criteria or alternatives after export, the workbook is not expected to auto-create new formula columns/rows; instead, export a new workbook from the updated web model. State this limitation in the Guide sheet.

### Excel quality assurance

Create an automated test that:
1. Exports the journal preset.
2. Confirms that calculation cells contain formulas, not constants.
3. Changes one input value in a test workbook.
4. Recalculates using Excel or LibreOffice when available.
5. Confirms that at least one dependent normalized value, distance, assessment score, or rank changes when mathematically expected.
6. Confirms the formulas do not contain `#REF!`, `#DIV/0!`, or broken sheet references.

Do not claim that the workbook is formula-driven unless these checks have been performed.

---

## 9. Suggested architecture / Arsitektur yang disarankan

Adapt this to the existing repository rather than replacing its stack without reason.

### Frontend
- React + TypeScript.
- A modern build tool already used by the repository (e.g. Vite).
- A utility-first styling system if already configured.
- Framer Motion or CSS transitions for step walkthrough animations.
- An i18n solution with Indonesian and English dictionaries.
- A table/grid component that supports editable numeric cells and responsive overflow.
- A chart library only where it clarifies the result (e.g. score comparison).

### Calculation domain
Create a pure, independently testable CODAS module, for example:

```text
src/
  domain/
    codas/
      types.ts
      validateModel.ts
      normalize.ts
      calculateCodas.ts
      rankAlternatives.ts
      formatCalculationTrace.ts
      __tests__/
```

The calculation module should:
- Accept a model object.
- Return every intermediate matrix and vector, not only the final ranking.
- Return validation errors separately from calculated output.
- Avoid UI dependencies.
- Avoid rounding intermediate values.
- Be deterministic for identical inputs.

Example conceptual types:

```ts
type CriterionType = "benefit" | "cost";

interface Criterion {
  id: string;
  nameId: string;
  nameEn: string;
  weight: number;
  type: CriterionType;
}

interface Alternative {
  id: string;
  nameId: string;
  nameEn: string;
  values: Record<string, number>; // criterionId -> value
}

interface CodasModel {
  criteria: Criterion[];
  alternatives: Alternative[];
  tau: number;
}

interface CodasResult {
  normalizedMatrix: number[][];
  weightedNormalizedMatrix: number[][];
  negativeIdeal: number[];
  euclideanDistances: number[];
  taxicabDistances: number[];
  relativeAssessmentMatrix: number[][];
  assessmentScores: number[];
  ranking: Array<{
    alternativeId: string;
    score: number;
    rank: number;
  }>;
}
```

The final result should also expose a calculation trace for the walkthrough, such as formula, substituted values, explanation keys, and cell references for each step.

### Backend / export service
A backend may be used for PDF and Excel generation if browser-side export becomes difficult. Keep calculation logic consistent:
- Prefer one canonical calculation implementation, or implement parity tests if the backend must independently calculate.
- Never let PDF/Excel silently use a different method from the web UI.
- Validate export requests server-side.
- Use safe filenames and do not trust user-provided strings as filesystem paths.

### State and recalculation
- Keep the current model as the source of truth.
- Derive the CODAS result from the model using a pure function.
- Recalculate when the model changes; debounce only expensive rendering, never allow stale result exports.
- Use stable IDs for criteria and alternatives.
- Keep the displayed result and export payload tied to the same model revision.

---

## 10. UI pages / Halaman aplikasi

Recommended page structure:

1. **Dashboard**
   - Project/method overview.
   - Current model summary.
   - Number of criteria and alternatives.
   - Total weight and τ.
   - Best-ranked alternative when calculation is valid.

2. **Model Builder**
   - Criteria editor.
   - Alternatives editor.
   - Decision matrix editor.
   - Weight validation and criterion type selection.
   - Reset journal preset.

3. **Calculation Process**
   - Eight-step CODAS walkthrough.
   - Animated matrices and formulas.
   - Pairwise relative-assessment explorer.

4. **Final Ranking**
   - Ranked list/table.
   - Assessment scores.
   - Visual score comparison.
   - Explanation of ranking.

5. **Reports & Export**
   - Download PDF.
   - Download formula-driven Excel.
   - Export language selection.
   - Summary of workbook contents and formula behavior.

The navigation and all page content must be bilingual.

---

## 11. Accessibility, responsive design, and UX quality

- Responsive from mobile to desktop.
- Keyboard-accessible controls and dialogs.
- Visible focus states.
- Sufficient color contrast.
- Do not communicate Benefit/Cost or rank only by color; include text labels/icons.
- Tables need captions or accessible labels.
- Provide loading, empty, success, and error states.
- Confirm destructive actions.
- Do not use animation as the only way to communicate a calculation.
- Support reduced-motion preferences.
- Use consistent number formatting and make decimal precision clear.

---

## 12. Testing and acceptance criteria / Kriteria penerimaan

Do not consider the application complete until all of the following pass:

### CODAS correctness
- [ ] Journal preset loads with exactly 5 alternatives and 5 criteria.
- [ ] Weights are 0.19, 0.26, 0.24, 0.17, 0.14 and total 1.00.
- [ ] Criterion directions are Cost, Benefit, Benefit, Benefit, Cost.
- [ ] Decision matrix matches the paper's Table 2 exactly.
- [ ] Normalization follows the correct benefit/cost equations.
- [ ] Weighted normalized matrix, negative ideal, Euclidean distance, Taxicab distance, relative matrix, scores, and ranking are all calculated.
- [ ] τ defaults to 0.02 and can be edited.
- [ ] No intermediate calculation is rounded.
- [ ] The journal preset's calculated ranking is checked against the paper's reported S1/Tripoli result; any discrepancy is investigated rather than hidden.

### Interactive walkthrough
- [ ] All eight steps can be visited.
- [ ] Formula and substituted values are shown.
- [ ] Animations highlight the relevant calculation.
- [ ] Previous, Next, replay, and jump-to-step controls work.
- [ ] Changing inputs refreshes every dependent step.

### Custom model
- [ ] Users can add/edit/delete criteria.
- [ ] Users can add/edit/delete alternatives.
- [ ] Weights, criterion types, τ, and decision values are editable.
- [ ] Validation prevents invalid calculations.
- [ ] Reset to journal preset works with confirmation.

### Language
- [ ] Indonesian and English switchers work.
- [ ] No major UI, error, walkthrough, or report text remains untranslated.
- [ ] Criterion and alternative names have both language versions.

### Exports
- [ ] PDF reflects the current model and all calculation stages.
- [ ] Excel contains actual formulas for every dependent calculation.
- [ ] Editing an Excel input recalculates dependent values in a spreadsheet application.
- [ ] Ranking formulas are descending and tie behavior is documented.
- [ ] Workbook formulas have been tested for broken references and division errors.
- [ ] Exported reports identify the method, τ, criterion directions, and journal source.

### General quality
- [ ] Responsive layout works on mobile and desktop.
- [ ] No console errors or unhandled calculation exceptions.
- [ ] No stale results are shown after model edits.
- [ ] Tests cover edge cases: zero values, identical columns, one invalid weight, equal scores, and τ boundary behavior.

---

## 13. Development workflow for Claude

When working in this repository:

1. Inspect the existing project structure, package manager, framework, styling, and current implementation before changing files.
2. Do not overwrite working configuration or replace the stack without a clear reason.
3. Identify the existing entry points and reusable components.
4. Implement and test the CODAS calculation engine first.
5. Verify the journal preset and intermediate calculations before building animations.
6. Build the bilingual model editor and calculation walkthrough.
7. Implement PDF and formula-driven Excel exports.
8. Add tests for calculation correctness, dynamic edits, and export formulas.
9. Run the available lint, type-check, test, and build commands.
10. Fix errors introduced by the changes.
11. Summarize completed features, changed files, commands run, test results, and any limitations honestly.

### Non-negotiable engineering rules

- Never hard-code the final winner.
- Never substitute static calculated numbers for Excel formulas.
- Never round intermediate CODAS values.
- Never assume every criterion is Benefit.
- Never assume the number of criteria or alternatives is fixed at five.
- Never silently change weights or input data.
- Never export stale results.
- Never present an untested Excel workbook as verified formula-driven.
- Keep the journal preset available, while allowing fully custom models.

---

## 14. Reference

Badi, I., Ballem, M., & Shetwan, A. (2018). Site selection of desalination plant in Libya by using Combinative Distance-Based Assessment (CODAS) method. *International Journal for Quality Research, 12*(3), 609–624. https://doi.org/10.18421/IJQR12.03-04

The default criteria, alternatives, weights, decision matrix, τ value, CODAS steps, and reported best alternative in this brief are based on the uploaded paper. Any additional UI/engineering requirements are project requirements, not claims made by the journal.
