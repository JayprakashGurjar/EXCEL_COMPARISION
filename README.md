# Excel Comparison Tool

An independent, client-side, high-performance Excel comparison engine designed to handle real-world Excel files of arbitrary structures, messy layouts, title rows, and multi-column schemas without force-matching or silent data loss.

---

## 🌟 Key Features

1. **Intelligent Multi-Structure Excel Header Detection**
   - Automatically detects the real table header row even when reports have title banners, company logos, disclaimers, or metadata in rows 1 to 5.
   - Provides quick interactive **Header Row Selectors** (`Row 1`, `Row 2`, `Row 3`, `Row 4`...) and an **Interactive 8-Row Sheet Preview** where clicking any row sets it as the header.
   - Detects all columns without truncating to 2-3 columns or generating phantom blanks.
   - Shows live sample values for every detected column (e.g. `Emp_Code (e.g. "EMP-101")`).

2. **Accurate Record Matching (Unique & Composite Keys)**
   - Supports single unique keys or multi-column composite keys (e.g. `Department` + `Employee ID`).
   - Matching is strictly value-based and completely independent of row order.

3. **Smart Dynamic Column Mapping**
   - **Smart Auto-Map Engine**: Automatically matches identical, normalized (case/space/underscore-insensitive), synonym (`id` ⟷ `code`, `dept` ⟷ `department`), and substring columns.
   - Manual mapping controls to pair, add, or swap any column.

4. **100% Data Integrity & Classification Engine**
   Every row from both files is audited and placed into exactly one category:
   - **Matched**: Key matches and all mapped comparison values are identical.
   - **Mismatched**: Key matches, but one or more fields differ (with old ⟷ new cell-level diffs).
   - **Duplicates**: Key repeats within the same file (detected and isolated).
   - **Ambiguous Records**: Non-deterministic or conflicting rows under the same key. **Never force-matched or dropped**.
   - **Unmatched in File A**: Rows present only in File A.
   - **Unmatched in File B**: Rows present only in File B.
   - **Data Integrity Audit**: Verifies `Total = Matched + Mismatched + Duplicates + Ambiguous + Unmatched + Blank`.

5. **Exporting Capabilities**
   - **Export Unmatched Records (`.xlsx`)**: Generates an Excel workbook with `Unmatched_File_A`, `Unmatched_File_B`, and `Comparison_Summary` sheets.
   - **Export Complete Comparison Report (`.xlsx`)**: Full multi-sheet breakdown with cell diffs, matched, duplicates, and audit summary.

---

## 📂 Project Architecture

```
Excel_Comapare/
├── index.html                 # Modern, responsive single-page application UI
├── README.md                  # Project documentation & usage guide
├── test_engine.js             # Automated end-to-end test suite
├── samples/                   # Sample test files with normal and tricky layouts
│   ├── Sample_File_A.xlsx
│   └── Sample_File_B_TrickyHeaders.xlsx
└── src/
    ├── core/
    │   ├── comparisonEngine.js # Key grouping, comparison, diffs, 100% integrity audit
    │   └── normalizer.js       # Whitespace, dates, numbers, tolerances, string normalization
    ├── services/
    │   └── excelService.js     # SheetJS range repair, header detection, parsing, Excel exports
    ├── ui/
    │   └── app.js              # UI controller, fuzzy auto-mapping, live preview, event handling
    └── vendor/
        └── xlsx.full.min.js    # Local offline SheetJS library (no internet needed)
```

---

## 🚀 How to Run

1. Simply double-click or open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).
2. Or serve it via any local static server (e.g., `npx serve .` or VS Code Live Server).
3. Upload File A and File B.
4. Review the auto-detected header rows and identified columns in the preview.
5. Click **"Run Excel Comparison"** to view and export results.
