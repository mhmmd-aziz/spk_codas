import type { Language } from "../domain/codas/types";

export interface TranslationDictionary {
  appTitle: string;
  appSubtitle: string;
  nav: {
    dashboard: string;
    modelBuilder: string;
    calculation: string;
    ranking: string;
    reports: string;
  };
  languageLabel: string;
  langId: string;
  langEn: string;
  precisionLabel: string;
  decimalsUnit: string;
  modelStatus: {
    presetBadge: string;
    customBadge: string;
    validBadge: string;
    invalidBadge: string;
  };
  common: {
    benefit: string;
    cost: string;
    weight: string;
    totalWeight: string;
    tau: string;
    criteria: string;
    alternatives: string;
    alternative: string;
    criterion: string;
    score: string;
    rank: string;
    actions: string;
    add: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    confirm: string;
    resetPreset: string;
    normalizeWeights: string;
    moveUp: string;
    moveDown: string;
    close: string;
    noData: string;
    warning: string;
    error: string;
    id: string;
    nameId: string;
    nameEn: string;
    type: string;
    descriptionId: string;
    descriptionEn: string;
    optional: string;
  };
  dashboard: {
    heading: string;
    subheading: string;
    overviewTitle: string;
    overviewBody: string;
    criteriaCount: string;
    alternativesCount: string;
    totalWeightLabel: string;
    tauLabel: string;
    bestAlternativeLabel: string;
    bestScoreLabel: string;
    invalidModelNotice: string;
    quickActionsTitle: string;
    openBuilder: string;
    openWalkthrough: string;
    openRanking: string;
    openReports: string;
    referenceTitle: string;
    referenceNote: string;
    summaryTableTitle: string;
    presetIndicator: string;
    customIndicator: string;
  };
  builder: {
    heading: string;
    subheading: string;
    tabs: {
      criteria: string;
      alternatives: string;
      matrix: string;
    };
    addCriterion: string;
    addAlternative: string;
    resetConfirmTitle: string;
    resetConfirmBody: string;
    deleteCriterionTitle: string;
    deleteCriterionBody: string;
    deleteAlternativeTitle: string;
    deleteAlternativeBody: string;
    tauHelp: string;
    tauRecommendedRange: string;
    weightExactHint: string;
    weightMismatchHint: string;
    matrixHint: string;
    directionLegend: string;
    benefitHint: string;
    costHint: string;
    editCriterionTitle: string;
    newCriterionTitle: string;
    editAlternativeTitle: string;
    newAlternativeTitle: string;
    initialValuesHint: string;
    validationPanelTitle: string;
    allValidMessage: string;
  };
  walkthrough: {
    heading: string;
    subheading: string;
    stepOf: string;
    previous: string;
    next: string;
    replay: string;
    showFormula: string;
    showDetails: string;
    recalculatedBadge: string;
    clickCellHint: string;
    selectedInspectionTitle: string;
    formulaLabel: string;
    substitutionLabel: string;
    resultLabel: string;
    pairwiseExplorerTitle: string;
    pairwiseExplorerHint: string;
    selectRowAlt: string;
    selectColAlt: string;
    tauRoleNote: string;
    tieNote: string;
    invalidBlockedTitle: string;
    invalidBlockedBody: string;
    perCriterionBreakdownTitle: string;
    steps: Array<{
      number: number;
      shortTitle: string;
      title: string;
      formula: string;
      description: string;
    }>;
  };
  ranking: {
    heading: string;
    subheading: string;
    winnerBannerLabel: string;
    explanationTitle: string;
    tableTitle: string;
    chartTitle: string;
    euclideanLabel: string;
    taxicabLabel: string;
    assessmentScoreLabel: string;
    tieNotice: string;
    invalidBlocked: string;
    preferredLabel: string;
  };
  reports: {
    heading: string;
    subheading: string;
    exportLanguageLabel: string;
    exportLangCurrent: string;
    exportLangId: string;
    exportLangEn: string;
    exportLangBilingualPdf: string;
    pdfCardTitle: string;
    pdfCardDesc: string;
    pdfIncludes: string[];
    downloadPdf: string;
    pdfSuccess: string;
    wordCardTitle: string;
    wordCardDesc: string;
    wordIncludes: string[];
    downloadWord: string;
    wordSuccess: string;
    excelCardTitle: string;
    excelCardDesc: string;
    excelIncludes: string[];
    downloadExcel: string;
    excelSuccess: string;
    exportErrorPrefix: string;
    invalidBlocked: string;
    formulaGuaranteeTitle: string;
    formulaGuaranteeBody: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  id: {
    appTitle: "SPK Metode CODAS",
    appSubtitle: "Sistem Pendukung Keputusan Berbasis Jarak Kombinatif",
    nav: {
      dashboard: "Dasbor",
      modelBuilder: "Pengaturan Model",
      calculation: "Proses Perhitungan",
      ranking: "Hasil Perangkingan",
      reports: "Laporan & Ekspor",
    },
    languageLabel: "Bahasa",
    langId: "Indonesia",
    langEn: "English",
    precisionLabel: "Desimal",
    decimalsUnit: "digit",
    modelStatus: {
      presetBadge: "Preset Jurnal (Badi et al., 2018)",
      customBadge: "Model Kustom",
      validBadge: "Model Valid",
      invalidBadge: "Perlu Perbaikan",
    },
    common: {
      benefit: "Benefit",
      cost: "Cost",
      weight: "Bobot",
      totalWeight: "Total Bobot",
      tau: "Parameter Ambang (tau)",
      criteria: "Kriteria",
      alternatives: "Alternatif",
      alternative: "Alternatif",
      criterion: "Kriteria",
      score: "Nilai Penilaian (H)",
      rank: "Peringkat",
      actions: "Aksi",
      add: "Tambah",
      edit: "Ubah",
      delete: "Hapus",
      save: "Simpan",
      cancel: "Batal",
      confirm: "Konfirmasi",
      resetPreset: "Pulihkan Preset Jurnal",
      normalizeWeights: "Normalisasi Bobot",
      moveUp: "Naikkan",
      moveDown: "Turunkan",
      close: "Tutup",
      noData: "Belum ada data.",
      warning: "Peringatan",
      error: "Kesalahan",
      id: "ID",
      nameId: "Nama (Bahasa Indonesia)",
      nameEn: "Nama (English)",
      type: "Tipe",
      descriptionId: "Deskripsi (Bahasa Indonesia)",
      descriptionEn: "Deskripsi (English)",
      optional: "opsional",
    },
    dashboard: {
      heading: "Ringkasan Sistem Pendukung Keputusan CODAS",
      subheading:
        "Implementasi transparan metode Combinative Distance-based Assessment (CODAS) dengan penjelasan bertahap, model dinamis, laporan PDF, dan Excel berbasis formula asli.",
      overviewTitle: "Tentang Metode CODAS",
      overviewBody:
        "Metode CODAS menentukan peringkat alternatif berdasarkan jarak Euclidean (primer) dan jarak Taxicab (sekunder) terhadap solusi ideal negatif. Parameter ambang tau mengendalikan kapan selisih jarak Taxicab diikutsertakan ketika dua alternatif memiliki jarak Euclidean yang berdekatan.",
      criteriaCount: "Jumlah Kriteria",
      alternativesCount: "Jumlah Alternatif",
      totalWeightLabel: "Total Bobot Kriteria",
      tauLabel: "Nilai Ambang (tau)",
      bestAlternativeLabel: "Alternatif Terbaik",
      bestScoreLabel: "Skor Penilaian Tertinggi",
      invalidModelNotice:
        "Model memiliki kesalahan validasi. Perbaiki pada halaman Pengaturan Model untuk menghitung peringkat.",
      quickActionsTitle: "Navigasi Cepat",
      openBuilder: "Ubah Kriteria & Alternatif",
      openWalkthrough: "Lihat Simulasi 8 Langkah",
      openRanking: "Lihat Peringkat Akhir",
      openReports: "Unduh PDF & Excel",
      referenceTitle: "Referensi Kasus Awal",
      referenceNote:
        "Kasus awal diambil persis dari studi pemilihan lokasi instalasi desalinasi di Libya (5 lokasi, 5 kriteria, tau = 0.02). Semua angka dihitung langsung oleh mesin CODAS dari input aktif.",
      summaryTableTitle: "Ringkasan Kriteria & Bobot Aktif",
      presetIndicator: "Menggunakan data asli jurnal (dapat diubah atau direset kapan saja).",
      customIndicator: "Model telah dimodifikasi dari preset jurnal.",
    },
    builder: {
      heading: "Pengaturan Model Keputusan",
      subheading:
        "Tambah, ubah, urutkan, atau hapus kriteria dan alternatif serta sunting matriks keputusan dan parameter ambang tau.",
      tabs: {
        criteria: "Kriteria",
        alternatives: "Alternatif",
        matrix: "Matriks Keputusan",
      },
      addCriterion: "Tambah Kriteria",
      addAlternative: "Tambah Alternatif",
      resetConfirmTitle: "Pulihkan Preset Jurnal?",
      resetConfirmBody:
        "Seluruh perubahan kriteria, alternatif, bobot, matriks keputusan, dan nilai tau saat ini akan diganti dengan kasus awal jurnal Badi, Ballem, & Shetwan (2018).",
      deleteCriterionTitle: "Hapus Kriteria?",
      deleteCriterionBody:
        "Menghapus kriteria ini juga akan menghapus nilainya dari seluruh alternatif. Lanjutkan?",
      deleteAlternativeTitle: "Hapus Alternatif?",
      deleteAlternativeBody:
        "Alternatif dan seluruh nilai kriterianya akan dihapus permanen dari model aktif. Lanjutkan?",
      tauHelp:
        "Mengatur ambang selisih jarak Euclidean agar jarak Taxicab dipertimbangkan.",
      tauRecommendedRange: "Rentang anjuran jurnal: 0.01 hingga 0.05 (default 0.02).",
      weightExactHint: "Total bobot tepat 1.0000 dan siap dihitung.",
      weightMismatchHint:
        "Total bobot harus tepat 1.0000 sebelum hasil dihitung. Gunakan tombol Normalisasi Bobot atau sesuaikan manual.",
      matrixHint:
        "Sunting nilai x_ij langsung pada sel tabel. Kriteria Cost membutuhkan nilai > 0.",
      directionLegend: "Arah Kriteria:",
      benefitHint: "Benefit: nilai lebih besar lebih baik (n_ij = x_ij / max).",
      costHint: "Cost: nilai lebih kecil lebih baik (n_ij = min / x_ij).",
      editCriterionTitle: "Ubah Kriteria",
      newCriterionTitle: "Tambah Kriteria Baru",
      editAlternativeTitle: "Ubah Alternatif",
      newAlternativeTitle: "Tambah Alternatif Baru",
      initialValuesHint: "Masukkan nilai awal untuk setiap kriteria yang tersedia:",
      validationPanelTitle: "Status Validasi Model",
      allValidMessage:
        "Seluruh aturan validasi terpenuhi. Hasil perhitungan dan ekspor selalu sinkron dengan data ini.",
    },
    walkthrough: {
      heading: "Proses Perhitungan CODAS (8 Langkah)",
      subheading:
        "Telusuri setiap transformasi matriks dan rumus secara interaktif. Klik sel atau baris untuk melihat substitusi angka.",
      stepOf: "Langkah {current} dari {total}",
      previous: "Sebelumnya",
      next: "Selanjutnya",
      replay: "Putar Ulang Animasi",
      showFormula: "Tampilkan Rumus",
      showDetails: "Tampilkan Perhitungan Detail",
      recalculatedBadge: "Diperbarui dari model terkini",
      clickCellHint: "Klik salah satu sel pada tabel untuk melihat rincian substitusi rumusnya.",
      selectedInspectionTitle: "Inspeksi Perhitungan Sel Terpilih",
      formulaLabel: "Rumus",
      substitutionLabel: "Substitusi Nilai",
      resultLabel: "Hasil",
      pairwiseExplorerTitle: "Penjelajah Perbandingan Berpasangan (i vs k)",
      pairwiseExplorerHint:
        "Pilih pasangan alternatif (i, k) untuk memeriksa E_i, E_k, T_i, T_k, fungsi ambang psi, dan h_ik.",
      selectRowAlt: "Alternatif Baris (i)",
      selectColAlt: "Alternatif Kolom (k)",
      tauRoleNote:
        "Nilai tau mengendalikan apakah selisih jarak Taxicab digunakan saat selisih jarak Euclidean kecil.",
      tieNote:
        "Peringkat diurutkan menurun berdasarkan H_i tanpa pembulatan antara. Nilai identik dalam toleransi 1e-12 mendapat peringkat sama.",
      invalidBlockedTitle: "Perhitungan Tertunda",
      invalidBlockedBody:
        "Terdapat kesalahan validasi pada model. Silakan perbaiki data pada Pengaturan Model terlebih dahulu.",
      perCriterionBreakdownTitle: "Kontribusi Jarak per Kriteria terhadap Solusi Ideal Negatif",
      steps: [
        {
          number: 1,
          shortTitle: "Matriks Keputusan",
          title: "Langkah 1: Matriks Keputusan (X)",
          formula: "X = [x_ij]_(n x m)",
          description:
            "Menyusun nilai kinerja setiap alternatif (baris) terhadap setiap kriteria (kolom) beserta arah Benefit atau Cost.",
        },
        {
          number: 2,
          shortTitle: "Normalisasi",
          title: "Langkah 2: Matriks Keputusan Ternormalisasi (N)",
          formula: "Benefit: n_ij = x_ij / max_i(x_ij)  |  Cost: n_ij = min_i(x_ij) / x_ij",
          description:
            "Menyamakan skala seluruh kriteria ke rentang (0, 1] dengan memperhatikan arah maksimasi (Benefit) atau minimasi (Cost).",
        },
        {
          number: 3,
          shortTitle: "Terbobot",
          title: "Langkah 3: Matriks Ternormalisasi Terbobot (R)",
          formula: "r_ij = w_j * n_ij",
          description:
            "Mengalikan setiap nilai ternormalisasi dengan bobot kriteria w_j sehingga kepentingan relatif kriteria tercermin pada matriks.",
        },
        {
          number: 4,
          shortTitle: "Ideal Negatif",
          title: "Langkah 4: Titik Solusi Ideal Negatif (NS)",
          formula: "ns_j = min_i(r_ij)",
          description:
            "Menentukan nilai terburuk (minimum) pada masing-masing kolom kriteria dari matriks ternormalisasi terbobot.",
        },
        {
          number: 5,
          shortTitle: "Jarak E & T",
          title: "Langkah 5: Jarak Euclidean (E_i) dan Taxicab (T_i)",
          formula: "E_i = sqrt(sum_j (r_ij - ns_j)^2)  |  T_i = sum_j |r_ij - ns_j|",
          description:
            "Mengukur seberapa jauh setiap alternatif dari solusi ideal negatif menggunakan jarak Euclidean dan jarak Taxicab.",
        },
        {
          number: 6,
          shortTitle: "Penilaian Relatif",
          title: "Langkah 6: Matriks Penilaian Relatif (H_ik)",
          formula: "h_ik = (E_i - E_k) + psi(E_i - E_k) * (T_i - T_k), psi(x) = 1 jika |x| >= tau else 0",
          description:
            "Membandingkan setiap pasangan alternatif (i, k). Jika selisih Euclidean memenuhi ambang tau, selisih Taxicab turut ditambahkan.",
        },
        {
          number: 7,
          shortTitle: "Skor Penilaian",
          title: "Langkah 7: Nilai Penilaian Akhir (H_i)",
          formula: "H_i = sum_(k=1)^n h_ik",
          description:
            "Menjumlahkan setiap baris pada matriks penilaian relatif untuk memperoleh skor keunggulan agregat tiap alternatif.",
        },
        {
          number: 8,
          shortTitle: "Perangkingan",
          title: "Langkah 8: Perangkingan Akhir",
          formula: "Urutkan H_i secara menurun (tertinggi = Peringkat 1)",
          description:
            "Mengurutkan alternatif dari skor H_i terbesar hingga terkecil. Alternatif dengan H_i tertinggi adalah pilihan terbaik.",
        },
      ],
    },
    ranking: {
      heading: "Hasil Perangkingan Akhir",
      subheading:
        "Urutan alternatif berdasarkan nilai penilaian H_i dengan presisi penuh secara internal.",
      winnerBannerLabel: "Alternatif Pilihan Terbaik",
      explanationTitle: "Interpretasi Peringkat Teratas",
      tableTitle: "Tabel Peringkat & Jarak CODAS",
      chartTitle: "Perbandingan Visual Nilai Penilaian (H_i)",
      euclideanLabel: "Jarak Euclidean (E_i)",
      taxicabLabel: "Jarak Taxicab (T_i)",
      assessmentScoreLabel: "Nilai Penilaian (H_i)",
      tieNotice:
        "Terdapat alternatif dengan skor sama dalam toleransi numerik (1e-12) sehingga memperoleh peringkat setara.",
      invalidBlocked:
        "Peringkat tidak dapat ditampilkan sebelum kesalahan validasi model diperbaiki.",
      preferredLabel: "Terbaik",
    },
    reports: {
      heading: "Laporan & Ekspor",
      subheading:
        "Unduh laporan PDF, dokumen Word (.docx), atau buku kerja Excel dengan formula spreadsheet aktif yang menghitung ulang otomatis.",
      exportLanguageLabel: "Bahasa Dokumen Ekspor",
      exportLangCurrent: "Ikuti Bahasa Aplikasi Saat Ini",
      exportLangId: "Bahasa Indonesia",
      exportLangEn: "English",
      exportLangBilingualPdf: "Dwibahasa (ID / EN) - PDF & Word",
      pdfCardTitle: "Ekspor Laporan PDF",
      pdfCardDesc:
        "Menghasilkan dokumen PDF multi-halaman hitam-putih lengkap berisi asal perhitungan tiap sel, seluruh matriks tahapan CODAS, rumus terkompilasi, interpretasi peringkat teratas, dan sitasi jurnal.",
      pdfIncludes: [
        "Tata letak hitam-putih siap cetak mencakup 7 bagian lengkap setara lembar Excel",
        "Rumus matematis CODAS terkompilasi, parameter tau, bobot, arah Benefit/Cost, dan sitasi jurnal",
        "Dilengkapi jejak asal perhitungan pada tiap sel (N, R, NS, deviasi, E_i, T_i, psi, h_ik, H_i)",
        "Interpretasi peringkat teratas, aturan seri, dan catatan ketergantungan input",
      ],
      downloadPdf: "Unduh PDF",
      pdfSuccess: "Laporan PDF berhasil dibuat dan diunduh.",
      wordCardTitle: "Ekspor Dokumen Word (.docx)",
      wordCardDesc:
        "Menghasilkan file Microsoft Word (.docx) siap edit berformat hitam-putih yang memuat seluruh 7 tahapan CODAS beserta jejak substitusi perhitungan untuk memudahkan presentasi dan penulisan laporan.",
      wordIncludes: [
        "Seluruh 7 bagian lengkap dari Panduan Rumus hingga Perangkingan Akhir dan Interpretasi",
        "Setiap tabel menampilkan nilai hasil beserta sumber hitungnya (x_ij/max, w_j x n_ij, deviasi, psi, h_ik)",
        "Format tabel hitam-putih bersih siap disunting langsung di Microsoft Word / LibreOffice Writer",
        "Mendukung mode Bahasa Indonesia, English, dan Dwibahasa (ID / EN)",
      ],
      downloadWord: "Unduh Word (.docx)",
      wordSuccess: "Dokumen Word (.docx) berhasil dibuat dan diunduh.",
      excelCardTitle: "Ekspor Excel Berbasis Formula (.xlsx)",
      excelCardDesc:
        "Menghasilkan workbook .xlsx dengan rumus Excel asli (=IF, =MAX, =MIN, =SQRT, =SUM, =ABS, =RANK) di seluruh lembar perhitungan, bukan angka statis.",
      excelIncludes: [
        "7 lembar berformat hitam-putih: Guide, Inputs, Normalized, Weighted, Distances, Relative, Ranking",
        "Sel input putih berbingkai tebal yang jelas dengan validasi dropdown Benefit / Cost",
        "Mengubah nilai keputusan, bobot, tipe kriteria, atau tau di Excel otomatis memperbarui seluruh hasil",
        "Penghitungan ulang otomatis diaktifkan saat file dibuka beserta nilai cache formula",
      ],
      downloadExcel: "Unduh Excel (.xlsx)",
      excelSuccess: "Workbook Excel berbasis formula berhasil dibuat dan diunduh.",
      exportErrorPrefix: "Gagal mengekspor dokumen: ",
      invalidBlocked:
        "Ekspor dinonaktifkan saat model tidak valid. Perbaiki model di Pengaturan Model terlebih dahulu.",
      formulaGuaranteeTitle: "Transparansi Formula Excel",
      formulaGuaranteeBody:
        "Setiap sel turunan pada lembar Normalized, Weighted, Distances, Relative, dan Ranking berisi rumus Excel dimulai dengan '='. Perubahan struktur jumlah kriteria/alternatif tetap dilakukan dengan mengekspor ulang dari aplikasi web ini.",
    },
  },
  en: {
    appTitle: "CODAS Decision Support System",
    appSubtitle: "Combinative Distance-based Assessment Platform",
    nav: {
      dashboard: "Dashboard",
      modelBuilder: "Model Builder",
      calculation: "Calculation Process",
      ranking: "Final Ranking",
      reports: "Reports & Export",
    },
    languageLabel: "Language",
    langId: "Indonesia",
    langEn: "English",
    precisionLabel: "Decimals",
    decimalsUnit: "dp",
    modelStatus: {
      presetBadge: "Journal Preset (Badi et al., 2018)",
      customBadge: "Custom Model",
      validBadge: "Model Valid",
      invalidBadge: "Needs Attention",
    },
    common: {
      benefit: "Benefit",
      cost: "Cost",
      weight: "Weight",
      totalWeight: "Total Weight",
      tau: "Threshold Parameter (tau)",
      criteria: "Criteria",
      alternatives: "Alternatives",
      alternative: "Alternative",
      criterion: "Criterion",
      score: "Assessment Score (H)",
      rank: "Rank",
      actions: "Actions",
      add: "Add",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      resetPreset: "Restore Journal Preset",
      normalizeWeights: "Normalize Weights",
      moveUp: "Move up",
      moveDown: "Move down",
      close: "Close",
      noData: "No data available.",
      warning: "Warning",
      error: "Error",
      id: "ID",
      nameId: "Name (Bahasa Indonesia)",
      nameEn: "Name (English)",
      type: "Type",
      descriptionId: "Description (Bahasa Indonesia)",
      descriptionEn: "Description (English)",
      optional: "optional",
    },
    dashboard: {
      heading: "CODAS Decision Support System Overview",
      subheading:
        "Transparent Combinative Distance-based Assessment (CODAS) with an 8-step interactive walkthrough, customizable model builder, print-ready PDF, and formula-driven Excel export.",
      overviewTitle: "About the CODAS Method",
      overviewBody:
        "CODAS ranks alternatives by combining Euclidean distance (primary) and Taxicab distance (secondary) from the negative-ideal solution. The threshold parameter tau governs when Taxicab distance differences break close Euclidean comparisons.",
      criteriaCount: "Criteria Count",
      alternativesCount: "Alternatives Count",
      totalWeightLabel: "Total Weight",
      tauLabel: "Threshold (tau)",
      bestAlternativeLabel: "Top-Ranked Alternative",
      bestScoreLabel: "Highest Assessment Score",
      invalidModelNotice:
        "The active model has validation errors. Resolve them in the Model Builder to compute rankings.",
      quickActionsTitle: "Quick Navigation",
      openBuilder: "Edit Criteria & Alternatives",
      openWalkthrough: "Explore 8-Step Walkthrough",
      openRanking: "View Final Ranking",
      openReports: "Download PDF & Excel",
      referenceTitle: "Default Case Study Reference",
      referenceNote:
        "The default preset faithfully reproduces the Libya desalination plant site selection study (5 sites, 5 criteria, tau = 0.02). All outputs are dynamically computed from active model inputs.",
      summaryTableTitle: "Active Criteria & Weight Summary",
      presetIndicator: "Using the original journal preset (editable and resettable anytime).",
      customIndicator: "Model has been customized from the journal preset.",
    },
    builder: {
      heading: "Decision Model Builder",
      subheading:
        "Add, edit, reorder, or remove criteria and alternatives, edit the decision matrix, and tune the threshold parameter tau.",
      tabs: {
        criteria: "Criteria",
        alternatives: "Alternatives",
        matrix: "Decision Matrix",
      },
      addCriterion: "Add Criterion",
      addAlternative: "Add Alternative",
      resetConfirmTitle: "Restore Journal Preset?",
      resetConfirmBody:
        "All current changes to criteria, alternatives, weights, decision matrix values, and tau will be replaced with the Badi, Ballem, & Shetwan (2018) case study.",
      deleteCriterionTitle: "Delete Criterion?",
      deleteCriterionBody:
        "Deleting this criterion also removes its performance values from every alternative. Continue?",
      deleteAlternativeTitle: "Delete Alternative?",
      deleteAlternativeBody:
        "This alternative and all of its criterion values will be permanently removed from the active model. Continue?",
      tauHelp:
        "Controls the Euclidean distance difference threshold above which Taxicab distance is activated.",
      tauRecommendedRange: "Paper recommended range: 0.01 to 0.05 (default 0.02).",
      weightExactHint: "Total weight equals 1.0000 and is ready for calculation.",
      weightMismatchHint:
        "Total weight must equal 1.0000 before calculation. Use Normalize Weights or adjust manually.",
      matrixHint:
        "Edit x_ij values directly in the grid. Cost criteria require positive values (> 0).",
      directionLegend: "Criterion Directions:",
      benefitHint: "Benefit: higher is better (n_ij = x_ij / max).",
      costHint: "Cost: lower is better (n_ij = min / x_ij).",
      editCriterionTitle: "Edit Criterion",
      newCriterionTitle: "Add New Criterion",
      editAlternativeTitle: "Edit Alternative",
      newAlternativeTitle: "Add New Alternative",
      initialValuesHint: "Provide initial performance values for all existing criteria:",
      validationPanelTitle: "Model Validation Status",
      allValidMessage:
        "All validation rules pass. Calculations and exports stay synchronized with this model.",
    },
    walkthrough: {
      heading: "CODAS Calculation Process (8 Steps)",
      subheading:
        "Inspect every matrix transformation and formula step by step. Click any cell or row to inspect exact number substitutions.",
      stepOf: "Step {current} of {total}",
      previous: "Previous",
      next: "Next",
      replay: "Replay Animation",
      showFormula: "Show Formula",
      showDetails: "Show Detailed Calculation",
      recalculatedBadge: "Recalculated from live model",
      clickCellHint: "Select any cell in the table to inspect its substituted formula.",
      selectedInspectionTitle: "Selected Cell Calculation Trace",
      formulaLabel: "Formula",
      substitutionLabel: "Substituted Values",
      resultLabel: "Result",
      pairwiseExplorerTitle: "Pairwise Relative Assessment Explorer (i vs k)",
      pairwiseExplorerHint:
        "Select any pair (i, k) to inspect E_i, E_k, T_i, T_k, threshold function psi, and h_ik.",
      selectRowAlt: "Row Alternative (i)",
      selectColAlt: "Column Alternative (k)",
      tauRoleNote:
        "Threshold tau controls when Taxicab distance acts as a secondary tie-breaker for close Euclidean distances.",
      tieNote:
        "Ranks are sorted descending by unrounded H_i. Values equal within 1e-12 receive the same competition rank.",
      invalidBlockedTitle: "Calculation Paused",
      invalidBlockedBody:
        "The model currently contains validation errors. Please resolve them in the Model Builder first.",
      perCriterionBreakdownTitle: "Per-Criterion Distance Contributions to Negative-Ideal Solution",
      steps: [
        {
          number: 1,
          shortTitle: "Decision Matrix",
          title: "Step 1: Decision Matrix (X)",
          formula: "X = [x_ij]_(n x m)",
          description:
            "Organize performance values of each alternative (rows) across each criterion (columns), clearly marking Benefit and Cost directions.",
        },
        {
          number: 2,
          shortTitle: "Normalization",
          title: "Step 2: Normalized Decision Matrix (N)",
          formula: "Benefit: n_ij = x_ij / max_i(x_ij)  |  Cost: n_ij = min_i(x_ij) / x_ij",
          description:
            "Scale all criteria to (0, 1] using linear normalization aligned with Benefit (maximize) or Cost (minimize) directions.",
        },
        {
          number: 3,
          shortTitle: "Weighted Matrix",
          title: "Step 3: Weighted Normalized Decision Matrix (R)",
          formula: "r_ij = w_j * n_ij",
          description:
            "Multiply each normalized entry by its criterion weight w_j so relative importance is reflected across all scores.",
        },
        {
          number: 4,
          shortTitle: "Negative-Ideal",
          title: "Step 4: Negative-Ideal Solution (NS)",
          formula: "ns_j = min_i(r_ij)",
          description:
            "Find the lowest (worst-case) weighted normalized value in each criterion column to form the negative-ideal vector.",
        },
        {
          number: 5,
          shortTitle: "E & T Distances",
          title: "Step 5: Euclidean (E_i) and Taxicab (T_i) Distances",
          formula: "E_i = sqrt(sum_j (r_ij - ns_j)^2)  |  T_i = sum_j |r_ij - ns_j|",
          description:
            "Compute both Euclidean and Taxicab distances from each alternative to the negative-ideal solution.",
        },
        {
          number: 6,
          shortTitle: "Relative Matrix",
          title: "Step 6: Relative Assessment Matrix (H_ik)",
          formula: "h_ik = (E_i - E_k) + psi(E_i - E_k) * (T_i - T_k), psi(x) = 1 if |x| >= tau else 0",
          description:
            "Compare every ordered pair (i, k). Taxicab differences contribute only when |E_i - E_k| reaches or exceeds tau.",
        },
        {
          number: 7,
          shortTitle: "Assessment Score",
          title: "Step 7: Assessment Scores (H_i)",
          formula: "H_i = sum_(k=1)^n h_ik",
          description:
            "Sum each row of the relative assessment matrix using full floating-point precision to obtain each alternative's net score.",
        },
        {
          number: 8,
          shortTitle: "Final Ranking",
          title: "Step 8: Final Ranking",
          formula: "Sort H_i descending (highest = Rank 1)",
          description:
            "Rank alternatives from highest to lowest H_i. The top-scoring alternative is the preferred choice.",
        },
      ],
    },
    ranking: {
      heading: "Final Ranking Results",
      subheading:
        "Alternatives ordered by descending assessment score H_i using full internal precision.",
      winnerBannerLabel: "Preferred Alternative",
      explanationTitle: "Why the Top Alternative Ranks First",
      tableTitle: "CODAS Distances, Scores & Ranking",
      chartTitle: "Assessment Score (H_i) Comparison",
      euclideanLabel: "Euclidean Distance (E_i)",
      taxicabLabel: "Taxicab Distance (T_i)",
      assessmentScoreLabel: "Assessment Score (H_i)",
      tieNotice:
        "One or more alternatives share identical scores within numerical tolerance (1e-12) and receive equal rank.",
      invalidBlocked:
        "Rankings are unavailable until all model validation errors are resolved.",
      preferredLabel: "Preferred",
    },
    reports: {
      heading: "Reports & Export",
      subheading:
        "Download a print-ready PDF report, an editable Word (.docx) document, or a formula-driven Excel workbook.",
      exportLanguageLabel: "Export Document Language",
      exportLangCurrent: "Follow Active UI Language",
      exportLangId: "Bahasa Indonesia",
      exportLangEn: "English",
      exportLangBilingualPdf: "Bilingual (ID / EN) - PDF & Word",
      pdfCardTitle: "Export PDF Report",
      pdfCardDesc:
        "Generates a black-and-white multi-page PDF containing full calculation provenance in every table, all CODAS intermediate matrices, compiled formulas, top-rank interpretation, and journal citation.",
      pdfIncludes: [
        "Print-ready black-and-white layout covering all 7 complete sections matching the Excel sheets",
        "Compiled CODAS formulas, tau parameter, weights, Benefit/Cost directions, and journal citation",
        "Includes step-by-step provenance in every matrix cell (N, R, NS, deviations, E_i, T_i, psi, h_ik, H_i)",
        "Top-rank interpretation, tie rules, and input-dependency disclaimer",
      ],
      downloadPdf: "Download PDF",
      pdfSuccess: "PDF report generated and downloaded.",
      wordCardTitle: "Export Word Document (.docx)",
      wordCardDesc:
        "Generates an editable black-and-white Microsoft Word (.docx) report containing all 7 CODAS sections and explicit step-by-step substitution traces for easy presentation and documentation.",
      wordIncludes: [
        "All 7 complete sections from Formula Guide through Final Ranking and Interpretation",
        "Every table pairs numeric results with their source expressions (x_ij/max, w_j x n_ij, deviations, psi, h_ik)",
        "Clean monochrome table formatting ready to edit in Microsoft Word or LibreOffice Writer",
        "Supports Indonesian, English, and Bilingual (ID / EN) document modes",
      ],
      downloadWord: "Download Word (.docx)",
      wordSuccess: "Word (.docx) document generated and downloaded.",
      excelCardTitle: "Export Formula-Driven Excel (.xlsx)",
      excelCardDesc:
        "Generates an .xlsx workbook containing live Excel formulas (=IF, =MAX, =MIN, =SQRT, =SUM, =ABS, =RANK) across all calculation sheets instead of static numbers.",
      excelIncludes: [
        "7 sheets in clean black-and-white formatting: Guide, Inputs, Normalized, Weighted, Distances, Relative, Ranking",
        "Distinct white bold-bordered editable input cells with Benefit / Cost dropdown validation",
        "Editing decision values, weights, criterion types, or tau in Excel recalculates all outputs",
        "Automatic recalculation enabled on workbook open alongside cached formula values",
      ],
      downloadExcel: "Download Excel (.xlsx)",
      excelSuccess: "Formula-driven Excel workbook generated and downloaded.",
      exportErrorPrefix: "Export failed: ",
      invalidBlocked:
        "Exports are disabled while the model has validation errors. Fix them in the Model Builder first.",
      formulaGuaranteeTitle: "Formula Workbook Scope",
      formulaGuaranteeBody:
        "Every dependent cell in Normalized, Weighted, Distances, Relative, and Ranking uses an Excel formula beginning with '='. To add or remove criteria/alternatives structurally, edit the web model and export a fresh workbook.",
    },
  },
};
