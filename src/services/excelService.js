/* Excel Service - Robust Multi-structure Excel Parsing and Export Engine */
(function (g) {
  const ECT = (g.ECT = g.ECT || {});

  const HEADER_WORDS = /\b(id|code|no|num|number|key|name|first|last|full|title|desc|description|date|time|dept|department|salary|amount|amt|price|cost|total|bal|balance|status|state|stat|type|cat|category|role|user|emp|employee|client|customer|email|mail|phone|mobile|tel|address|addr|city|country|zip|qty|quantity|count|unit|remarks|notes|flag)\b/i;

  function fixRange(ws) {
    if (!ws || typeof ws !== 'object') return;
    const X = typeof XLSX !== 'undefined' ? XLSX : g.XLSX;
    if (!X) return;
    let maxR = -1, maxC = -1;
    for (const key of Object.keys(ws)) {
      if (key[0] === '!') continue;
      try {
        const c = X.utils.decode_cell(key);
        if (c.r > maxR) maxR = c.r;
        if (c.c > maxC) maxC = c.c;
      } catch (e) {}
    }
    if (maxR >= 0 && maxC >= 0) {
      ws['!ref'] = X.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
    }
  }

  // Intelligent Header Row Detection Algorithm
  function detectHeaderRow(aoa, trueWidth) {
    if (!aoa || !aoa.length) return 0;
    if (trueWidth <= 1) return 0;
    const maxCheck = Math.min(25, aoa.length);
    let bestRow = 0;
    let bestScore = -999;

    for (let r = 0; r < maxCheck; r++) {
      const row = aoa[r] || [];
      const filled = [];
      for (let c = 0; c < trueWidth; c++) {
        const val = row[c] != null ? String(row[c]).replace(/[\u00A0\r\n\t]+/g, ' ').trim() : '';
        if (val !== '') filled.push({ val, c });
      }
      const count = filled.length;
      if (count === 0) continue;

      // Heavy penalty for single-cell title rows when table has 3+ columns
      if (count === 1 && trueWidth >= 3) continue;

      let textCount = 0;
      let uniqueSet = new Set();
      let totalLen = 0;
      let keywordHits = 0;

      for (const cell of filled) {
        const isNum = !isNaN(Number(cell.val)) && cell.val !== '';
        if (!isNum) textCount++;
        uniqueSet.add(cell.val.toLowerCase());
        totalLen += cell.val.length;
        if (HEADER_WORDS.test(cell.val)) keywordHits++;
      }

      const avgLen = totalLen / count;
      const uniqueness = uniqueSet.size / count;

      let nextRowHasData = false;
      let nextRowHasNumbers = false;
      if (r + 1 < aoa.length) {
        const nextRow = aoa[r + 1] || [];
        const nextFilled = nextRow.filter((c) => c != null && String(c).trim() !== '');
        if (nextFilled.length >= count * 0.4) nextRowHasData = true;
        if (nextFilled.some((c) => !isNaN(Number(c)) && String(c).trim() !== '')) {
          nextRowHasNumbers = true;
        }
      }

      // Scoring factors:
      let score = (count * 4) + (textCount * 3) + (uniqueness * 12);
      if (nextRowHasData) score += 15;
      if (nextRowHasNumbers) score += 15;
      if (keywordHits > 0) score += (keywordHits * 8);
      if (avgLen >= 2 && avgLen <= 45) score += 6;
      if (count === 1) score -= 30;

      // Slight natural preference for earlier rows
      score -= (r * 2);

      if (score > bestScore) {
        bestScore = score;
        bestRow = r;
      }
    }
    return bestRow;
  }

  ECT.excel = {
    async read(file) {
      const X = typeof XLSX !== 'undefined' ? XLSX : g.XLSX;
      const buf = await file.arrayBuffer();
      return X.read(buf, { type: 'array', cellDates: true });
    },

    table(wb, sheetName, chosenHeaderRow = null) {
      const X = typeof XLSX !== 'undefined' ? XLSX : g.XLSX;
      const ws = wb.Sheets[sheetName];
      if (!ws) return { headers: [], rows: [], samples: {}, headerRow: 0, preview: [], trueWidth: 0, totalRows: 0 };

      fixRange(ws);
      const rawAoa = X.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '', blankrows: true });
      if (!rawAoa.length) return { headers: [], rows: [], samples: {}, headerRow: 0, preview: [], trueWidth: 0, totalRows: 0 };

      // 1. Calculate true maximum column width (ignoring trailing phantom columns)
      let maxCol = 0;
      for (let r = 0; r < rawAoa.length; r++) {
        const row = rawAoa[r] || [];
        for (let c = row.length - 1; c >= 0; c--) {
          if (row[c] != null && String(row[c]).trim() !== '') {
            if (c > maxCol) maxCol = c;
            break;
          }
        }
      }
      const trueWidth = maxCol + 1;

      // 2. Detect or apply user-selected header row index (0-based)
      let headerRow = chosenHeaderRow;
      const autoDetectedHeader = detectHeaderRow(rawAoa, trueWidth);
      if (headerRow === null || headerRow === undefined || headerRow < 0 || headerRow >= rawAoa.length) {
        headerRow = autoDetectedHeader;
      }

      // 3. Extract and sanitize column headers
      const headerRowData = rawAoa[headerRow] || [];
      const seen = {};
      const headers = [];
      for (let c = 0; c < trueWidth; c++) {
        let rawVal = headerRowData[c] != null ? String(headerRowData[c]).replace(/[\u00A0\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim() : '';
        let colName = rawVal || `Column ${c + 1}`;
        seen[colName] = (seen[colName] || 0) + 1;
        if (seen[colName] > 1) {
          colName = `${colName} (${seen[colName]})`;
        }
        headers.push(colName);
      }

      // 4. Parse all data rows after the header row with original Excel row numbering
      const rows = [];
      const samples = {};
      for (let r = headerRow + 1; r < rawAoa.length; r++) {
        const rowData = rawAoa[r] || [];
        let isRowEmpty = true;
        const record = { _excelRow: r + 1 };

        for (let c = 0; c < headers.length; c++) {
          const val = rowData[c] != null ? rowData[c] : '';
          const strVal = String(val).trim();
          if (strVal !== '') isRowEmpty = false;

          record[headers[c]] = val;
          if (!samples[headers[c]] && strVal !== '') {
            samples[headers[c]] = strVal.length > 30 ? strVal.slice(0, 27) + '...' : strVal;
          }
        }

        if (!isRowEmpty) {
          rows.push(record);
        }
      }

      // 5. Generate preview rows for UI inspection
      const previewLimit = Math.min(10, rawAoa.length);
      const preview = [];
      for (let r = 0; r < previewLimit; r++) {
        const row = rawAoa[r] || [];
        const cells = [];
        for (let c = 0; c < trueWidth; c++) {
          cells.push(row[c] != null ? String(row[c]).trim() : '');
        }
        preview.push({
          rowIndex: r,
          excelRowNumber: r + 1,
          isHeader: r === headerRow,
          cells
        });
      }

      return {
        headers,
        rows,
        samples,
        headerRow,
        autoDetectedHeader,
        trueWidth,
        totalRows: rows.length,
        preview
      };
    },

    exportUnmatched(res, A, B) {
      const X = typeof XLSX !== 'undefined' ? XLSX : g.XLSX;
      const wb = X.utils.book_new();

      // Sheet 1: Unmatched File A
      const aoaA = [['Status', 'Key', 'Excel Row', ...A.headers]];
      res.unmatched
        .filter((u) => u.side === 'a')
        .forEach((u) => {
          u.rows.forEach((r) => {
            aoaA.push([u.reason, u.key, r.row, ...A.headers.map((h) => r.data[h] ?? '')]);
          });
        });
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(aoaA), 'Unmatched_File_A');

      // Sheet 2: Unmatched File B
      const aoaB = [['Status', 'Key', 'Excel Row', ...B.headers]];
      res.unmatched
        .filter((u) => u.side === 'b')
        .forEach((u) => {
          u.rows.forEach((r) => {
            aoaB.push([u.reason, u.key, r.row, ...B.headers.map((h) => r.data[h] ?? '')]);
          });
        });
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(aoaB), 'Unmatched_File_B');

      // Sheet 3: Summary
      const summaryAoa = [
        ['Metric', 'Count'],
        ['Total Rows in File A', res.stats.a.total],
        ['Total Rows in File B', res.stats.b.total],
        ['Exact Matched Rows', res.matched.length],
        ['Mismatched Records', res.mismatched.length],
        ['Duplicate Records', res.duplicate.length],
        ['Ambiguous Records', res.ambiguous.length],
        ['Unmatched in File A', res.unmatched.filter((u) => u.side === 'a').reduce((n, u) => n + u.rows.length, 0)],
        ['Unmatched in File B', res.unmatched.filter((u) => u.side === 'b').reduce((n, u) => n + u.rows.length, 0)],
        ['Integrity Check Status', res.stats.a.ok && res.stats.b.ok ? 'PASSED (100% Accounted)' : 'WARNING']
      ];
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(summaryAoa), 'Comparison_Summary');

      X.writeFile(wb, 'Unmatched_Records.xlsx', { cellDates: true });
    },

    exportFullReport(res, A, B) {
      const X = typeof XLSX !== 'undefined' ? XLSX : g.XLSX;
      const wb = X.utils.book_new();

      // 1. Summary Sheet
      const summaryAoa = [
        ['Executive Comparison Summary Report'],
        ['File A Total Rows', res.stats.a.total],
        ['File B Total Rows', res.stats.b.total],
        ['Exact Matched Records', res.matched.length],
        ['Mismatched Records (Value Differences)', res.mismatched.length],
        ['Duplicate Records', res.duplicate.length],
        ['Ambiguous Records', res.ambiguous.length],
        ['Unmatched in File A', res.unmatched.filter((u) => u.side === 'a').reduce((n, u) => n + u.rows.length, 0)],
        ['Unmatched in File B', res.unmatched.filter((u) => u.side === 'b').reduce((n, u) => n + u.rows.length, 0)],
        ['Data Integrity Verified', res.stats.a.ok && res.stats.b.ok ? 'YES (100% Accounted)' : 'WARNING']
      ];
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(summaryAoa), 'Summary');

      // 2. Mismatched Differences Sheet (Clear Column-by-Column Diff)
      const misAoa = [['Key', 'File A Row', 'File B Row', 'Differing Column Name', 'File A Value (Source)', 'File B Value (Target)', 'Diff Status']];
      res.mismatched.forEach((item) => {
        item.diffs.forEach((d) => {
          misAoa.push([
            item.key,
            item.a.map((r) => r.row).join(', '),
            item.b.map((r) => r.row).join(', '),
            d.field,
            d.a ?? '',
            d.b ?? '',
            'VALUE MISMATCH'
          ]);
        });
      });
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(misAoa), 'Mismatched_Differences');

      // 3. Mismatched Side-by-Side Row Grid
      if (res.mismatched.length && res.mismatched[0].allFields) {
        const fieldNames = res.mismatched[0].allFields.map((f) => f.field);
        const gridAoa = [['Key', 'Source File', 'Excel Row', 'Differing Columns Count', ...fieldNames]];

        res.mismatched.forEach((item) => {
          const diffList = item.diffs.map((d) => d.field).join(', ');
          // Row A
          const rowA = [item.key, 'File A', item.a[0].row, `${item.diffs.length} columns diff (${diffList})`];
          item.allFields.forEach((f) => rowA.push(f.a ?? ''));
          gridAoa.push(rowA);

          // Row B
          const rowB = [item.key, 'File B', item.b[0].row, `${item.diffs.length} columns diff (${diffList})`];
          item.allFields.forEach((f) => rowB.push(f.b ?? ''));
          gridAoa.push(rowB);
        });
        X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(gridAoa), 'Mismatched_SideBySide');
      }

      // 4. Matched Sheet
      const matchedAoa = [['Key', 'File A Row', 'File B Row', 'Status']];
      res.matched.forEach((item) => {
        matchedAoa.push([item.key, item.a.map((r) => r.row).join(', '), item.b.map((r) => r.row).join(', '), 'All fields matched']);
      });
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(matchedAoa), 'Matched_Records');

      // 5. Duplicates Sheet
      const dupAoa = [['Key', 'File A Rows', 'File B Rows', 'Reason']];
      res.duplicate.forEach((item) => {
        dupAoa.push([item.key, item.a.map((r) => r.row).join(', '), item.b.map((r) => r.row).join(', '), item.reason]);
      });
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(dupAoa), 'Duplicates');

      // 6. Ambiguous Sheet
      const ambAoa = [['Key', 'File A Rows', 'File B Rows', 'Reason']];
      res.ambiguous.forEach((item) => {
        ambAoa.push([item.key, item.a.map((r) => r.row).join(', '), item.b.map((r) => r.row).join(', '), item.reason]);
      });
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(ambAoa), 'Ambiguous');

      // 7. Unmatched A & B
      const unmA = [['Status', 'Key', 'File A Row', ...A.headers]];
      res.unmatched.filter((u) => u.side === 'a').forEach((u) => {
        u.rows.forEach((r) => unmA.push([u.reason, u.key, r.row, ...A.headers.map((h) => r.data[h] ?? '')]));
      });
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(unmA), 'Unmatched_File_A');

      const unmB = [['Status', 'Key', 'File B Row', ...B.headers]];
      res.unmatched.filter((u) => u.side === 'b').forEach((u) => {
        u.rows.forEach((r) => unmB.push([u.reason, u.key, r.row, ...B.headers.map((h) => r.data[h] ?? '')]));
      });
      X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(unmB), 'Unmatched_File_B');

      X.writeFile(wb, 'Complete_Comparison_Report.xlsx', { cellDates: true });
    }
  };

  // Modern Enterprise API Adapter for Excel Service
  const excelService = {
    async parseExcelFile(file) {
      const X = typeof XLSX !== 'undefined' ? XLSX : g.XLSX;
      if (!X) throw new Error('SheetJS (XLSX) library is not loaded');

      const wb = await ECT.excel.read(file);
      const sheetNames = wb.SheetNames || [];
      if (sheetNames.length === 0) throw new Error('Excel workbook contains no sheets');

      const firstSheet = sheetNames[0];
      const table = ECT.excel.table(wb, firstSheet, null);

      return {
        name: file.name,
        size: file.size,
        workbook: wb,
        sheetNames: sheetNames,
        currentSheet: firstSheet,
        headers: table.headers || [],
        data: table.rows || [],
        detectedHeaderRow: (table.headerRow || 0) + 1,
        table: table
      };
    },

    parseSheetWithHeaderRow(wb, sheetName, headerRow) {
      const zeroBasedRow = Math.max(0, (headerRow || 1) - 1);
      const table = ECT.excel.table(wb, sheetName, zeroBasedRow);
      return {
        currentSheet: sheetName,
        headers: table.headers || [],
        data: table.rows || [],
        detectedHeaderRow: headerRow,
        table: table
      };
    },

    exportResultsToExcel(comparisonResult, columnMappings, diffsOnly = false) {
      const X = typeof XLSX !== 'undefined' ? XLSX : g.XLSX;
      if (!X) throw new Error('SheetJS (XLSX) library is not loaded');

      const wb = X.utils.book_new();

      if (diffsOnly) {
        // 1. Mismatched Differences Sheet
        const misAoa = [['Key', 'Differing Column Name', 'File A Value', 'File B Value', 'Status']];
        (comparisonResult.mismatched || []).forEach(item => {
          (item.diffs || []).forEach(d => {
            misAoa.push([
              item.key,
              d.field || d.fieldA,
              d.valA ?? '',
              d.valB ?? '',
              'VALUE MISMATCH'
            ]);
          });
        });
        X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(misAoa), 'Differences_Only');

        // 2. Unmatched File A
        if (comparisonResult.unmatchedA?.length) {
          const unmAoa = [['Key', 'Reason', ...Object.keys(comparisonResult.unmatchedA[0].row || {})]];
          comparisonResult.unmatchedA.forEach(u => {
            unmAoa.push([u.key, u.reason || 'Missing in File B', ...Object.values(u.row || {})]);
          });
          X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(unmAoa), 'Missing_in_File_B');
        }

        // 3. Unmatched File B
        if (comparisonResult.unmatchedB?.length) {
          const unmBaoa = [['Key', 'Reason', ...Object.keys(comparisonResult.unmatchedB[0].row || {})]];
          comparisonResult.unmatchedB.forEach(u => {
            unmBaoa.push([u.key, u.reason || 'Missing in File A', ...Object.values(u.row || {})]);
          });
          X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(unmBaoa), 'Missing_in_File_A');
        }

        X.writeFile(wb, 'Differences_Report.xlsx', { cellDates: true });
      } else {
        // Complete Summary Report
        const summaryAoa = [
          ['Executive Comparison Summary Report'],
          ['Matched Records', comparisonResult.matched?.length || 0],
          ['Mismatched Records', comparisonResult.mismatched?.length || 0],
          ['Missing in File B (Unmatched A)', comparisonResult.unmatchedA?.length || 0],
          ['Missing in File A (Unmatched B)', comparisonResult.unmatchedB?.length || 0],
          ['Ambiguous Conflicts', comparisonResult.ambiguous?.length || 0],
          ['Duplicates', (comparisonResult.duplicatesA?.length || 0) + (comparisonResult.duplicatesB?.length || 0)]
        ];
        X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(summaryAoa), 'Summary');

        // Mismatched
        const misAoa = [['Key', 'Column Name', 'File A Value', 'File B Value', 'Status']];
        (comparisonResult.mismatched || []).forEach(item => {
          (item.diffs || []).forEach(d => {
            misAoa.push([item.key, d.field || d.fieldA, d.valA ?? '', d.valB ?? '', 'VALUE MISMATCH']);
          });
        });
        X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(misAoa), 'Mismatched');

        // Matched
        const matchedAoa = [['Key', 'Status']];
        (comparisonResult.matched || []).forEach(item => {
          matchedAoa.push([item.key, 'All Fields Matched']);
        });
        X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(matchedAoa), 'Matched');

        // Unmatched A
        if (comparisonResult.unmatchedA?.length) {
          const unmAoa = [['Key', 'Reason', ...Object.keys(comparisonResult.unmatchedA[0].row || {})]];
          comparisonResult.unmatchedA.forEach(u => {
            unmAoa.push([u.key, u.reason || 'Missing in File B', ...Object.values(u.row || {})]);
          });
          X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(unmAoa), 'Missing_in_File_B');
        }

        // Unmatched B
        if (comparisonResult.unmatchedB?.length) {
          const unmBaoa = [['Key', 'Reason', ...Object.keys(comparisonResult.unmatchedB[0].row || {})]];
          comparisonResult.unmatchedB.forEach(u => {
            unmBaoa.push([u.key, u.reason || 'Missing in File A', ...Object.values(u.row || {})]);
          });
          X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(unmBaoa), 'Missing_in_File_A');
        }

        // Ambiguous
        if (comparisonResult.ambiguous?.length) {
          const ambAoa = [['Key', 'Rows in File A', 'Rows in File B', 'Reason']];
          comparisonResult.ambiguous.forEach(a => {
            ambAoa.push([a.key, a.countA, a.countB, a.reason]);
          });
          X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(ambAoa), 'Ambiguous_Conflicts');
        }

        X.writeFile(wb, 'Complete_Reconciliation_Report.xlsx', { cellDates: true });
      }
    }
  };

  g.excelService = ECT.excelService = excelService;
  ECT.exportResultsToExcel = excelService.exportResultsToExcel;
})(typeof window !== 'undefined' ? window : globalThis);
