/*
 * Comparison Engine
 * Input: two tables {headers, rows[]} + config.
 * Output: categorized records { matched, mismatched, duplicate, ambiguous, unmatched, stats }.
 * Rules:
 * - Matching is strictly by key (unique or composite), independent of row order.
 * - Excel row numbering is preserved (_excelRow).
 * - Ambiguous duplicates are never arbitrarily paired or force-matched.
 * - Zero silent data loss: every row is accounted for in the integrity audit.
 */
(function (g) {
  const ECT = (g.ECT = g.ECT || {});
  const SEP = '\u0001';
  const label = (k) => k.split(SEP).join(' | ');

  function validate(A, B, cfg) {
    const errs = [];
    if (!A || !B) return ['Please upload and configure both Excel files first.'];
    if (!cfg.keys || !cfg.keys.length) {
      errs.push('Please select at least one Key Column pair to match records.');
    }
    cfg.keys.forEach((k, i) => {
      if (!k.a || !k.b) errs.push(`Key Column pair ${i + 1} is incomplete.`);
    });
    cfg.fields.forEach((f, i) => {
      if (!f.a || !f.b) errs.push(`Comparison Column pair ${i + 1} is incomplete.`);
    });
    const hasDup = (arr) => new Set(arr).size !== arr.length;
    if (hasDup(cfg.keys.map((k) => k.a)) || hasDup(cfg.keys.map((k) => k.b))) {
      errs.push('The same column cannot be selected multiple times in the Match Key.');
    }
    return errs;
  }

  function group(tbl, cols, o) {
    const groups = new Map();
    const invalid = [];
    let blank = 0;

    tbl.rows.forEach((data, i) => {
      const rowNum = data._excelRow || i + 2;
      const rec = { row: rowNum, data };

      // Check if row is completely blank across all table headers
      const isAllBlank = tbl.headers.every((h) => ECT.isBlank(data[h]));
      if (isAllBlank) {
        blank++;
        return;
      }

      // Check key columns
      const parts = cols.map((c) => ECT.normalize(data[c], o));
      if (parts.some((p) => p === '')) {
        invalid.push(rec);
        return;
      }

      const k = parts.join(SEP);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(rec);
    });

    return { groups, invalid, blank };
  }

  function compare(A, B, cfg) {
    const o = cfg.options || {};
    const res = { matched: [], mismatched: [], duplicate: [], ambiguous: [], unmatched: [] };

    const keyColsA = cfg.keys.map((k) => k.a);
    const keyColsB = cfg.keys.map((k) => k.b);

    const ga = group(A, keyColsA, o);
    const gb = group(B, keyColsB, o);

    const sig = (rec, cols) => cols.map((c) => ECT.normalize(rec.data[c], o)).join(SEP);
    const fa = cfg.fields.map((f) => f.a);
    const fb = cfg.fields.map((f) => f.b);

    const fieldComparison = (x, y) =>
      cfg.fields.map((f) => {
        const isMatch = ECT.equal(x.data[f.a], y.data[f.b], o);
        return {
          fieldA: f.a,
          fieldB: f.b,
          field: f.a === f.b ? f.a : `${f.a} ↔ ${f.b}`,
          a: x.data[f.a],
          b: y.data[f.b],
          isDiff: !isMatch
        };
      });

    const diffs = (x, y) => fieldComparison(x, y).filter((f) => f.isDiff);

    // Helper to find near-matching keys in the counterpart file (spaces, dashes, case, leading zeros)
    function findNearMatch(searchKey, targetMap) {
      if (!searchKey) return null;
      const cleanSearch = searchKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const unpaddedSearch = cleanSearch.replace(/^0+/, '');
      for (const [tKey, tRows] of targetMap) {
        const cleanTarget = tKey.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const unpaddedTarget = cleanTarget.replace(/^0+/, '');
        if (cleanSearch && cleanTarget && (cleanSearch === cleanTarget || (unpaddedSearch && unpaddedSearch === unpaddedTarget))) {
          return { key: label(tKey), row: tRows[0].row };
        }
      }
      return null;
    }

    // Compare records present in File A
    for (const [k, ra] of ga.groups) {
      const rb = gb.groups.get(k);
      if (!rb) {
        const near = findNearMatch(k, gb.groups);
        res.unmatched.push({
          side: 'a',
          key: label(k),
          keyCols: keyColsA.join(' + '),
          otherKeyCols: keyColsB.join(' + '),
          rows: ra,
          reason: 'Key value not found in File B' + (ra.length > 1 ? ` (repeated ${ra.length}× in File A)` : ''),
          nearMatch: near
        });
        continue;
      }

      // Both sides have exactly 1 record with this key
      if (ra.length === 1 && rb.length === 1) {
        const all = fieldComparison(ra[0], rb[0]);
        const d = all.filter((f) => f.isDiff);
        if (d.length) {
          res.mismatched.push({ key: label(k), a: ra, b: rb, diffs: d, allFields: all });
        } else {
          res.matched.push({ key: label(k), a: ra, b: rb, diffs: [], allFields: all });
        }
        continue;
      }

      // Multi-occurrence / duplicate keys
      const sa = new Set(ra.map((r) => sig(r, fa)));
      const sb = new Set(rb.map((r) => sig(r, fb)));

      // If all instances within A are identical, and all instances within B are identical
      if (sa.size === 1 && sb.size === 1) {
        const all = fieldComparison(ra[0], rb[0]);
        const d = all.filter((f) => f.isDiff);
        res.duplicate.push({
          key: label(k),
          a: ra,
          b: rb,
          diffs: d,
          allFields: all,
          reason:
            `Key repeated (File A: ${ra.length} rows, File B: ${rb.length} rows); duplicate rows within each file are identical` +
            (d.length ? ', but values differ between File A and File B' : '') +
            (ra.length !== rb.length ? ' (row counts differ)' : '')
        });
      } else {
        // Conflicting rows under the same key: ambiguous, cannot safely pair
        res.ambiguous.push({
          key: label(k),
          a: ra,
          b: rb,
          diffs: [],
          reason: `Key repeated (File A: ${ra.length} rows, File B: ${rb.length} rows) with conflicting data. Force-matching was avoided to protect data integrity.`
        });
      }
    }

    // Records present in File B only
    for (const [k, rb] of gb.groups) {
      if (!ga.groups.has(k)) {
        const near = findNearMatch(k, ga.groups);
        res.unmatched.push({
          side: 'b',
          key: label(k),
          keyCols: keyColsB.join(' + '),
          otherKeyCols: keyColsA.join(' + '),
          rows: rb,
          reason: 'Key value not found in File A' + (rb.length > 1 ? ` (repeated ${rb.length}× in File B)` : ''),
          nearMatch: near
        });
      }
    }

    // Records with blank/missing key values
    [['a', ga, keyColsA], ['b', gb, keyColsB]].forEach(([s, gr, kCols]) =>
      gr.invalid.forEach((rec) =>
        res.unmatched.push({
          side: s,
          key: '(blank key)',
          keyCols: kCols.join(' + '),
          rows: [rec],
          reason: `Key column [${kCols.join(' + ')}] is empty/blank in this row — unable to match`,
          isBlankKey: true
        })
      )
    );

    // 100% Data Integrity Audit Check
    res.stats = {};
    [['a', A, ga], ['b', B, gb]].forEach(([s, t, gr]) => {
      const placed =
        ['matched', 'mismatched', 'duplicate', 'ambiguous'].reduce(
          (n, k) => n + res[k].reduce((m, x) => m + x[s].length, 0),
          0
        ) + res.unmatched.filter((u) => u.side === s).reduce((n, u) => n + u.rows.length, 0);

      const total = t.rows.length;
      res.stats[s] = {
        total,
        blank: gr.blank,
        placed,
        ok: placed + gr.blank === total
      };
    });

    return res;
  }

  ECT.engine = { compare, validate };

  // Modern Enterprise API Adapter for Comparison Engine
  const comparisonEngine = {
    autoMapHeaders(headersA = [], headersB = []) {
      const normalizeStr = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      return headersA.map(colA => {
        const normA = normalizeStr(colA);

        // 1. Exact match
        let matched = headersB.find(colB => colB === colA);

        // 2. Case-insensitive match
        if (!matched) {
          matched = headersB.find(colB => colB.toLowerCase() === colA.toLowerCase());
        }

        // 3. Normalized match (without underscores/spaces)
        if (!matched) {
          matched = headersB.find(colB => normalizeStr(colB) === normA);
        }

        // 4. Substring / common acronym match
        if (!matched) {
          matched = headersB.find(colB => {
            const normB = normalizeStr(colB);
            return (normA.length > 2 && normB.includes(normA)) || (normB.length > 2 && normA.includes(normB));
          });
        }

        return {
          sourceCol: colA,
          targetCol: matched || '',
          type: 'auto',
          ignore: !matched
        };
      });
    },

    compareFiles(dataA, dataB, fullKeyConfig, validMappings) {
      const headersA = (fullKeyConfig.headersA && fullKeyConfig.headersA.length)
        ? fullKeyConfig.headersA
        : (dataA.length > 0 && dataA[0] ? Object.keys(dataA[0]).filter(k => k !== '_excelRow') : []);
      const headersB = (fullKeyConfig.headersB && fullKeyConfig.headersB.length)
        ? fullKeyConfig.headersB
        : (dataB.length > 0 && dataB[0] ? Object.keys(dataB[0]).filter(k => k !== '_excelRow') : []);

      const tblA = { headers: headersA, rows: dataA };
      const tblB = { headers: headersB, rows: dataB };

      const keys = [
        { a: fullKeyConfig.fileAKey, b: fullKeyConfig.fileBKey },
        ...(fullKeyConfig.compositeKeys || []).map(ck => ({ a: ck.colA, b: ck.colB }))
      ];

      const fields = validMappings.map(m => ({
        a: m.sourceCol,
        b: m.targetCol,
        type: m.type
      }));

      const res = ECT.engine.compare(tblA, tblB, { keys, fields });

      return {
        raw: res,
        matched: res.matched.map(m => ({
          key: m.key,
          rowA: m.a[0]?.data,
          rowB: m.b[0]?.data,
          a: m.a,
          b: m.b
        })),
        mismatched: res.mismatched.map(m => ({
          key: m.key,
          rowA: m.a[0]?.data,
          rowB: m.b[0]?.data,
          a: m.a,
          b: m.b,
          diffs: m.diffs.map(d => ({
            field: d.fieldA,
            valA: d.a,
            valB: d.b,
            fieldA: d.fieldA,
            fieldB: d.fieldB
          })),
          allFields: m.allFields
        })),
        unmatchedA: res.unmatched.filter(u => u.side === 'a').flatMap(u =>
          u.rows.map(r => ({ key: u.key, row: r.data, reason: u.reason }))
        ),
        unmatchedB: res.unmatched.filter(u => u.side === 'b').flatMap(u =>
          u.rows.map(r => ({ key: u.key, row: r.data, reason: u.reason }))
        ),
        ambiguous: res.ambiguous.map(amb => ({
          key: amb.key,
          countA: amb.a.length,
          countB: amb.b.length,
          rowsA: amb.a.map(r => r.data),
          rowsB: amb.b.map(r => r.data),
          reason: amb.reason
        })),
        duplicatesA: res.duplicate.filter(d => d.a.length > 1).map(d => ({
          key: d.key,
          count: d.a.length,
          rows: d.a.map(r => r.data)
        })),
        duplicatesB: res.duplicate.filter(d => d.b.length > 1).map(d => ({
          key: d.key,
          count: d.b.length,
          rows: d.b.map(r => r.data)
        })),
        stats: res.stats
      };
    },

    validate: ECT.engine.validate
  };

  g.comparisonEngine = ECT.comparisonEngine = comparisonEngine;
})(typeof window !== 'undefined' ? window : globalThis);
