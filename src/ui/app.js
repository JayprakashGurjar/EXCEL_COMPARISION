/* Excel Comparison Tool - UI Controller & Event Handlers */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  const S = {
    a: null,
    b: null,
    keys: [{ a: '', b: '' }],
    fields: [],
    res: null,
    tab: 'mismatched',
    diffViewMode: 'grid', // 'grid' (Side-by-Side Excel Grid) or 'diffs' (Column Diff Table)
    filterDiffColumn: 'all', // Filter by specific differing column
    searchQuery: '',
    previewOpenA: false,
    previewOpenB: false,
    inspectedItem: null, // For Side-by-Side Row Inspector Modal
    inspectedUnmatchedItem: null, // For Unmatched Record Modal
    inspectedAmbiguousItem: null // For Ambiguous Conflicting Rows Modal
  };

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const formatSample = (val) => (val ? ` (e.g. "${esc(val)}")` : '');

  const showVal = (v) => {
    if (v instanceof Date) return ECT.normalize(v);
    if (v === '' || v == null) return '<span class="empty-val">(empty)</span>';
    return esc(String(v));
  };

  const msg = (text, ok = false) => {
    const el = $('#msg');
    if (!el) return;
    if (!text) {
      el.innerHTML = '';
      el.className = '';
      return;
    }
    const icon = ok ? '✓' : '⚠️';
    el.innerHTML = `<span>${icon}</span> <span>${esc(text)}</span>`;
    el.className = ok ? 'alert-box alert-success' : 'alert-box alert-error';
  };

  function updateStepper() {
    const p1 = $('#step-pill-1');
    const p2 = $('#step-pill-2');
    const p3 = $('#step-pill-3');
    const guide = $('#quick-guide-banner');

    const filesLoaded = (S.a?.table ? 1 : 0) + (S.b?.table ? 1 : 0);

    if (p1 && p2 && p3) {
      if (filesLoaded === 2) {
        p1.className = 'step-pill step-done';
        p1.innerHTML = '✓ 1. Files Uploaded (2/2)';
      } else if (filesLoaded === 1) {
        p1.className = 'step-pill step-active';
        p1.innerHTML = '1. Upload Files (1/2)';
      } else {
        p1.className = 'step-pill step-active';
        p1.innerHTML = '1. Upload Files';
      }

      if (S.res) {
        p2.className = 'step-pill step-done';
        p2.innerHTML = '✓ 2. Columns Mapped';
        p3.className = 'step-pill step-active';
        p3.innerHTML = '3. Visual Diff Analysis';
      } else if (filesLoaded === 2) {
        p2.className = 'step-pill step-active';
        p2.innerHTML = '2. Map Columns';
        p3.className = 'step-pill';
        p3.innerHTML = '3. Visual Diff Analysis';
      } else {
        p2.className = 'step-pill';
        p2.innerHTML = '2. Map Columns';
        p3.className = 'step-pill';
        p3.innerHTML = '3. Visual Diff Analysis';
      }
    }

    if (guide) {
      guide.style.display = filesLoaded === 2 ? 'none' : 'flex';
    }
  }

  // Fuzzy & Normalized Column Matching
  function findBestMatch(colA, headersB) {
    if (!colA || !headersB || !headersB.length) return '';
    const normA = colA.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Exact match
    if (headersB.includes(colA)) return colA;

    // 2. Case-insensitive match
    const caseMatch = headersB.find((b) => b.toLowerCase() === colA.toLowerCase());
    if (caseMatch) return caseMatch;

    // 3. Normalized match (without spaces, underscores, symbols)
    const normMatch = headersB.find((b) => b.toLowerCase().replace(/[^a-z0-9]/g, '') === normA);
    if (normMatch) return normMatch;

    // 4. Synonym groups
    const synonyms = [
      ['id', 'code', 'no', 'number', 'key', 'identifier', 'ref'],
      ['name', 'fullname', 'empname', 'custname', 'clientname', 'title'],
      ['amount', 'amt', 'total', 'price', 'cost', 'value', 'val', 'balance'],
      ['date', 'dt', 'createdat', 'joiningdate', 'timestamp', 'dob'],
      ['email', 'mail', 'emailaddress'],
      ['phone', 'mobile', 'cell', 'tel', 'contact', 'phoneno'],
      ['dept', 'department'],
      ['desc', 'description', 'remarks', 'notes'],
      ['status', 'stat', 'state', 'flag'],
      ['qty', 'quantity', 'count', 'units']
    ];

    for (const group of synonyms) {
      if (group.some((term) => normA.includes(term))) {
        const found = headersB.find((b) => {
          const normB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
          return group.some((term) => normB.includes(term));
        });
        if (found) return found;
      }
    }

    // 5. Substring containment
    if (normA.length >= 3) {
      const subMatch = headersB.find((b) => {
        const normB = b.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normB.length >= 3 && (normA.includes(normB) || normB.includes(normA));
      });
      if (subMatch) return subMatch;
    }

    return '';
  }

  async function loadFile(side, file) {
    if (!file) return;
    try {
      msg(`Reading file ${file.name}...`);
      const wb = await ECT.excel.read(file);
      S[side] = {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        wb,
        chosenHeaderRow: null
      };
      setSheet(side, wb.SheetNames[0], null);
      msg('');
    } catch (err) {
      msg(`Failed to parse ${file.name}: ${err.message}`);
    }
  }

  function setSheet(side, sheetName, headerRow = null) {
    const f = S[side];
    if (!f) return;
    f.sheet = sheetName;
    f.chosenHeaderRow = headerRow;
    f.table = ECT.excel.table(f.wb, sheetName, headerRow);
    S.res = null;

    if (S.a?.table && S.b?.table) {
      autoMapColumns();
    }
    render();
  }

  function setHeaderRow(side, headerRowIndex) {
    const f = S[side];
    if (!f) return;
    setSheet(side, f.sheet, headerRowIndex);
  }

  function autoMapColumns() {
    if (!S.a?.table || !S.b?.table) return;
    const headersA = S.a.table.headers;
    const headersB = S.b.table.headers;

    const matchedPairs = [];
    headersA.forEach((hA) => {
      const bestB = findBestMatch(hA, headersB);
      if (bestB) {
        matchedPairs.push({ a: hA, b: bestB });
      }
    });

    const idIdx = matchedPairs.findIndex((p) =>
      /(^|[\s_-])(id|code|no|key|number|ref)$|^id/i.test(p.a)
    );

    if (matchedPairs.length) {
      const keyPair = matchedPairs[idIdx >= 0 ? idIdx : 0];
      S.keys = [{ a: keyPair.a, b: keyPair.b }];
      S.fields = matchedPairs.filter((p) => p.a !== keyPair.a);
    } else {
      S.keys = [{ a: headersA[0] || '', b: headersB[0] || '' }];
      S.fields = [];
    }
  }

  function renderFileInfo(side) {
    const f = S[side];
    const container = $(`#info-${side}`);
    const dropArea = $(`#drop-area-${side}`);

    if (!f) {
      if (dropArea) dropArea.style.display = 'block';
      if (container) container.innerHTML = '';
      return;
    }

    if (dropArea) dropArea.style.display = 'none';

    const t = f.table;
    const sheetOptions = f.wb.SheetNames.map(
      (n) => `<option value="${esc(n)}"${n === f.sheet ? ' selected' : ''}>${esc(n)}</option>`
    ).join('');

    const headerRowButtons = t.preview
      .map((p) => {
        const isCurrent = p.rowIndex === t.headerRow;
        const isAuto = p.rowIndex === t.autoDetectedHeader;
        let badge = isCurrent ? ' active-header-pill' : '';
        let label = `Row ${p.excelRowNumber}${isAuto ? ' ⭐' : ''}`;
        return `<button type="button" class="header-pill${badge}" data-set-header="${side}" data-row="${p.rowIndex}" title="Set Row ${p.excelRowNumber} as Header">${label}</button>`;
      })
      .join('');

    const isOpen = side === 'a' ? S.previewOpenA : S.previewOpenB;
    let previewHtml = '';
    if (isOpen && t.preview.length) {
      const headerPreviewCells = t.headers.slice(0, 10).map((h) => `<th>${esc(h)}</th>`).join('');
      const rowsPreviewHtml = t.preview
        .map((p) => {
          const isHdr = p.rowIndex === t.headerRow;
          const trClass = isHdr ? 'table-header-highlight' : 'table-data-row';
          const clickHint = isHdr
            ? `<span class="badge badge-success">✓ Active Header</span>`
            : `<button type="button" class="btn-micro" data-set-header="${side}" data-row="${p.rowIndex}">Set as Header</button>`;

          const cellsHtml = p.cells
            .slice(0, 10)
            .map((c) => `<td>${esc(c || '')}</td>`)
            .join('');

          return `<tr class="${trClass}"><td><b>Row ${p.excelRowNumber}</b> ${clickHint}</td>${cellsHtml}</tr>`;
        })
        .join('');

      previewHtml = `
        <div class="sheet-preview-box">
          <div class="preview-header-bar">
            <span><b>Preview First ${t.preview.length} Rows of "${esc(f.sheet)}"</b> (Click any row to set it as Header Row)</span>
          </div>
          <div class="scroll-table-wrapper mini-scroll">
            <table class="preview-table">
              <thead><tr><th>Row #</th>${headerPreviewCells}</tr></thead>
              <tbody>${rowsPreviewHtml}</tbody>
            </table>
          </div>
        </div>
      `;
    }

    const colChips = t.headers
      .map((h) => {
        const sample = t.samples[h] ? ` <span class="chip-sample">${esc(t.samples[h])}</span>` : '';
        return `<span class="col-chip" title="Column: ${esc(h)}">${esc(h)}${sample}</span>`;
      })
      .join('');

    container.innerHTML = `
      <div class="file-card-details">
        <div class="file-title-row">
          <span class="file-name-tag">
            <span>📄</span>
            <b title="${esc(f.name)}">${esc(f.name)}</b>
            <span class="file-size-badge">${f.size}</span>
          </span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="sheet-select-wrapper">
              <label>Sheet:</label>
              <select data-sheet="${side}" aria-label="Select Sheet">${sheetOptions}</select>
            </div>
            <button type="button" class="btn-replace-file" data-trigger-upload="${side}" title="Upload a different file">
              Replace File
            </button>
          </div>
        </div>

        <div class="header-detection-bar">
          <div class="header-detection-title">
            <span><b>Header Row:</b> Row ${t.headerRow + 1} ${t.headerRow === t.autoDetectedHeader ? '<span class="badge badge-info">Auto-detected ⭐</span>' : '<span class="badge badge-warning">User Selected</span>'}</span>
            <span class="muted-note">Click a row pill below if headers begin on a different row:</span>
          </div>
          <div class="header-pills-list">${headerRowButtons}</div>
        </div>

        <div class="preview-toggle-bar">
          <button type="button" class="btn-secondary btn-sm" data-toggle-preview="${side}">
            ${isOpen ? '▲ Hide Sheet Preview' : '👁 Inspect Sheet & Rows'}
          </button>
          <span class="stat-badge"><b>${t.headers.length}</b> Columns</span>
          <span class="stat-badge"><b>${t.totalRows.toLocaleString()}</b> Data Rows</span>
        </div>

        ${previewHtml}

        <div class="columns-detected-drawer">
          <div class="drawer-header">Identified Columns in File ${side.toUpperCase()} (${t.headers.length}):</div>
          <div class="col-chips-container">${colChips || '<span class="muted">No columns detected</span>'}</div>
        </div>
      </div>
    `;
  }

  // Select2-style Searchable Dropdown Generator
  function renderSearchableSelect(list, index, side, headers, samples, selectedVal, placeholder = '-- Search or Select Column --') {
    const selectedText = selectedVal ? esc(selectedVal) : '';
    const sample = selectedVal && samples[selectedVal] ? ` <span class="select2-sample">(e.g. "${esc(samples[selectedVal])}")</span>` : '';
    const hasValue = !!selectedVal;

    const optionsHtml = headers
      .map((h) => {
        const isSel = h === selectedVal;
        const smp = samples && samples[h] ? ` <span class="opt-sample">(e.g. "${esc(samples[h])}")</span>` : '';
        return `
          <div class="select2-option ${isSel ? 'selected' : ''}" data-val="${esc(h)}">
            <span class="opt-name">${esc(h)}</span>
            ${smp}
            ${isSel ? '<span class="opt-check">✓</span>' : ''}
          </div>
        `;
      })
      .join('');

    return `
      <div class="select2-wrapper" data-list="${list}" data-index="${index}" data-side="${side}">
        <div class="select2-selection ${hasValue ? 'has-value' : ''}" tabindex="0" data-action="toggle-select2">
          <span class="select2-search-icon">🔍</span>
          <span class="select2-rendered" title="${selectedText || placeholder}">
            ${hasValue ? `<b class="opt-active-name">${selectedText}</b>${sample}` : `<span class="select2-placeholder">${placeholder}</span>`}
          </span>
          ${hasValue ? `<button type="button" class="select2-clear-btn" data-action="clear-select2" title="Clear selection">✕</button>` : ''}
          <span class="select2-arrow">▾</span>
        </div>
        <div class="select2-dropdown" hidden>
          <div class="select2-search-wrap">
            <span class="search-input-icon">🔍</span>
            <input type="text" class="select2-search-input" placeholder="Type column name to filter..." autocomplete="off">
          </div>
          <div class="select2-results-list">
            ${optionsHtml || '<div class="select2-no-results">No columns available</div>'}
          </div>
        </div>
      </div>
    `;
  }

  function renderKeyPairs() {
    const headersA = S.a?.table?.headers || [];
    const headersB = S.b?.table?.headers || [];
    const samplesA = S.a?.table?.samples || {};
    const samplesB = S.b?.table?.samples || {};

    const html = S.keys
      .map((p, i) => `
        <div class="mapping-pair-row">
          <span class="pair-index">Key #${i + 1}</span>
          <div class="select-field">
            <label>File A Key Column:</label>
            ${renderSearchableSelect('keys', i, 'a', headersA, samplesA, p.a, '-- Select File A Key Column --')}
          </div>
          <span class="pair-arrow">⟷</span>
          <div class="select-field">
            <label>File B Key Column:</label>
            ${renderSearchableSelect('keys', i, 'b', headersB, samplesB, p.b, '-- Select File B Key Column --')}
          </div>
          ${S.keys.length > 1 ? `<button type="button" class="btn-icon-remove" data-remove="keys" data-index="${i}" title="Remove this key pair">✕</button>` : ''}
        </div>
      `)
      .join('');

    $('#keys-container').innerHTML = html;
  }

  function renderFieldPairs() {
    const headersA = S.a?.table?.headers || [];
    const headersB = S.b?.table?.headers || [];
    const samplesA = S.a?.table?.samples || {};
    const samplesB = S.b?.table?.samples || {};

    if (!S.fields.length) {
      $('#fields-container').innerHTML = `<div class="empty-fields-note" style="padding: 14px; color: #64748b; font-size: 13px;">No comparison columns mapped yet. Click <b>"Smart Auto-Map Columns"</b> or <b>"Add Column Pair"</b>.</div>`;
      return;
    }

    const html = S.fields
      .map((p, i) => `
        <div class="mapping-pair-row">
          <span class="pair-index">Field #${i + 1}</span>
          <div class="select-field">
            <label>File A Column:</label>
            ${renderSearchableSelect('fields', i, 'a', headersA, samplesA, p.a, '-- Select File A Column --')}
          </div>
          <span class="pair-arrow">⟷</span>
          <div class="select-field">
            <label>File B Column:</label>
            ${renderSearchableSelect('fields', i, 'b', headersB, samplesB, p.b, '-- Select File B Column --')}
          </div>
          <button type="button" class="btn-icon-remove" data-remove="fields" data-index="${i}" title="Remove this comparison pair">✕</button>
        </div>
      `)
      .join('');

    $('#fields-container').innerHTML = html;
  }

  function render() {
    renderFileInfo('a');
    renderFileInfo('b');

    const ready = S.a?.table && S.b?.table;
    $('#config-section').hidden = !ready;

    if (ready) {
      renderKeyPairs();
      renderFieldPairs();
    }
    renderResults();
    updateStepper();
  }

  // Generate Side-by-Side Excel Row Grid with Glowing Diff Highlighting
  function renderMismatchedGrid(items) {
    if (!items.length) {
      return `<tr><td colspan="100" class="no-records-cell">No mismatched records found.</td></tr>`;
    }

    const comparedFields = S.fields;
    const headerColsHtml = comparedFields
      .map((f) => `<th class="col-header-compared">${esc(f.a === f.b ? f.a : `${f.a} / ${f.b}`)}</th>`)
      .join('');

    let rowsHtml = '';
    items.slice(0, 150).forEach((item, itemIdx) => {
      const rowNumA = item.a[0].row;
      const rowNumB = item.b[0].row;
      const recA = item.a[0].data;
      const recB = item.b[0].data;

      // Extract set of field names that differ for this record
      const diffFieldNames = new Set(item.diffs.map((d) => d.fieldA || d.field));

      // Cells for File A
      const cellsAHtml = comparedFields
        .map((f) => {
          const isDiff = diffFieldNames.has(f.a) || diffFieldNames.has(f.field);
          const val = recA[f.a];
          if (isDiff) {
            return `
              <td class="diff-cell diff-cell-a" title="File A: ${esc(val)}">
                <span class="diff-marker-tag marker-a">FILE A</span>
                <span class="diff-cell-val">${showVal(val)}</span>
              </td>
            `;
          }
          return `<td class="match-cell">${showVal(val)}</td>`;
        })
        .join('');

      // Cells for File B
      const cellsBHtml = comparedFields
        .map((f) => {
          const isDiff = diffFieldNames.has(f.a) || diffFieldNames.has(f.field);
          const val = recB[f.b];
          if (isDiff) {
            return `
              <td class="diff-cell diff-cell-b" title="File B: ${esc(val)}">
                <span class="diff-marker-tag marker-b">FILE B</span>
                <span class="diff-cell-val">${showVal(val)}</span>
              </td>
            `;
          }
          return `<td class="match-cell">${showVal(val)}</td>`;
        })
        .join('');

      const diffPillSummary = item.diffs
        .map((d) => `<span class="col-diff-name-pill">${esc(d.field)}</span>`)
        .join(' ');

      rowsHtml += `
        <!-- File A Row -->
        <tr class="grid-pair-row-a">
          <td rowspan="2" class="sticky-key-cell">
            <div class="key-val-title">🔑 <b>${esc(item.key)}</b></div>
            <div class="diff-count-badge">⚠️ ${item.diffs.length} ${item.diffs.length === 1 ? 'Column' : 'Columns'} Differ:</div>
            <div class="diff-columns-list">${diffPillSummary}</div>
            <button type="button" class="btn-inspect-row" data-inspect-item="${itemIdx}">
              🔍 Side-by-Side Detail
            </button>
          </td>
          <td class="source-tag-cell source-tag-a">
            <span class="source-bubble bubble-a">File A</span>
            <span class="row-num-tag">Row ${rowNumA}</span>
          </td>
          ${cellsAHtml}
        </tr>
        <!-- File B Row -->
        <tr class="grid-pair-row-b">
          <td class="source-tag-cell source-tag-b">
            <span class="source-bubble bubble-b">File B</span>
            <span class="row-num-tag">Row ${rowNumB}</span>
          </td>
          ${cellsBHtml}
        </tr>
      `;
    });

    return `
      <div class="scroll-table-wrapper main-results-scroll">
        <table class="data-table grid-comparison-table">
          <thead>
            <tr>
              <th style="min-width: 220px;">Record Key & Changed Columns</th>
              <th style="min-width: 140px;">Source File & Row</th>
              ${headerColsHtml}
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  }

  // Generate Column-by-Column Diff Breakdown Table
  function renderMismatchedDiffsTable(items) {
    if (!items.length) {
      return `<div class="scroll-table-wrapper"><table class="data-table"><tbody><tr><td class="no-records-cell">No mismatched records found.</td></tr></tbody></table></div>`;
    }

    let rowsHtml = '';
    items.slice(0, 300).forEach((item, itemIdx) => {
      item.diffs.forEach((d, dIdx) => {
        const isFirst = dIdx === 0;
        const rowspan = item.diffs.length;

        const keyCell = isFirst
          ? `<td rowspan="${rowspan}" class="sticky-key-cell">
              <div class="key-val-title">🔑 <b>${esc(item.key)}</b></div>
              <div class="diff-count-badge">⚠️ ${rowspan} Column ${rowspan === 1 ? 'Difference' : 'Differences'}</div>
              <button type="button" class="btn-inspect-row" data-inspect-item="${itemIdx}">🔍 Compare Row</button>
            </td>
            <td rowspan="${rowspan}">
              <div class="row-badge-pair">
                <span class="source-bubble bubble-a">File A: Row ${item.a[0].row}</span>
                <span class="source-bubble bubble-b">File B: Row ${item.b[0].row}</span>
              </div>
            </td>`
          : '';

        rowsHtml += `
          <tr>
            ${keyCell}
            <td class="diff-col-name-cell">
              <span class="badge-col-differing">${esc(d.field)}</span>
            </td>
            <td class="diff-val-col val-col-a">
              <div class="diff-val-box box-a">
                <span class="diff-source-label">File A (Row ${item.a[0].row}):</span>
                <b>${showVal(d.a)}</b>
              </div>
            </td>
            <td class="diff-arrow-cell">➔</td>
            <td class="diff-val-col val-col-b">
              <div class="diff-val-box box-b">
                <span class="diff-source-label">File B (Row ${item.b[0].row}):</span>
                <b>${showVal(d.b)}</b>
              </div>
            </td>
          </tr>
        `;
      });
    });

    return `
      <div class="scroll-table-wrapper main-results-scroll">
        <table class="data-table diffs-breakdown-table">
          <thead>
            <tr>
              <th style="min-width: 200px;">Record Key</th>
              <th style="min-width: 160px;">Excel Rows</th>
              <th style="min-width: 180px;">Differing Column Name</th>
              <th style="min-width: 200px;">File A Value (Source)</th>
              <th style="width: 40px; text-align: center;">Diff</th>
              <th style="min-width: 200px;">File B Value (Target)</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;
  }

  // Side-by-Side Detailed Modal for a Single Record
  function renderInspectorModal() {
    const hasModal = !!(S.inspectedItem || S.inspectedUnmatchedItem || S.inspectedAmbiguousItem);
    document.body.style.overflow = hasModal ? 'hidden' : '';

    // 1. Ambiguous Duplicate Inspector Modal
    if (S.inspectedAmbiguousItem) {
      const amb = S.inspectedAmbiguousItem;
      const colsA = S.a.table.headers;
      const colsB = S.b.table.headers;

      const rowsAHtml = amb.a
        .map((r) => {
          const cells = colsA.map((c) => `<td>${showVal(r.data[c])}</td>`).join('');
          return `<tr><td><span class="badge badge-info">Row ${r.row}</span></td>${cells}</tr>`;
        })
        .join('');

      const rowsBHtml = amb.b
        .map((r) => {
          const cells = colsB.map((c) => `<td>${showVal(r.data[c])}</td>`).join('');
          return `<tr><td><span class="badge badge-purple">Row ${r.row}</span></td>${cells}</tr>`;
        })
        .join('');

      return `
        <div class="modal-backdrop" data-action="close-modal">
          <div class="modal-card" style="max-width: 1100px;" onclick="event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 style="margin: 0; font-size: 18px; color: #b45309;">⚠️ Conflicting Repeated Rows for Key: "${esc(amb.key)}"</h3>
                <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                  This Key appears <b>${amb.a.length} times in File A</b> and <b>${amb.b.length} times in File B</b> with differing row data.
                </div>
              </div>
              <button type="button" class="btn-close-modal" data-action="close-modal">✕</button>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; font-size: 13px; color: #92400e; line-height: 1.6;">
              <b>🤔 What is the Issue?</b> The selected Match Key contains duplicate values across both files. For instance, the exact same Key appears ${amb.a.length} times in File A and ${amb.b.length} times in File B, but the rest of the row data (such as Date, Amount, or Product) differs across those rows. The system cannot guess or force-match rows arbitrarily without compromising data integrity.<br>
              💡 <b>Recommended Solution:</b> Review the tables below to identify which column distinguishes these rows (such as <code>Date</code>, <code>Item Name</code>, <code>Type</code>, or <code>Invoice ID</code>). Then go to Step 1 (Match Key) above and click <b>"+ Add Composite Key Column"</b> to add that column so each row becomes uniquely identifiable!
            </div>

            <h4 style="margin: 14px 0 8px; font-size: 14px; color: #1e3a8a;">
              📄 File A ("${esc(S.a.name)}") — ${amb.a.length} Rows with Key "${esc(amb.key)}":
            </h4>
            <div class="scroll-table-wrapper mini-scroll" style="max-height: 220px; margin-bottom: 18px;">
              <table class="data-table">
                <thead><tr><th>Row #</th>${colsA.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
                <tbody>${rowsAHtml}</tbody>
              </table>
            </div>

            <h4 style="margin: 14px 0 8px; font-size: 14px; color: #1e3a8a;">
              📄 File B ("${esc(S.b.name)}") — ${amb.b.length} Rows with Key "${esc(amb.key)}":
            </h4>
            <div class="scroll-table-wrapper mini-scroll" style="max-height: 220px;">
              <table class="data-table">
                <thead><tr><th>Row #</th>${colsB.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
                <tbody>${rowsBHtml}</tbody>
              </table>
            </div>

            <div style="margin-top: 20px; text-align: right;">
              <button type="button" class="btn-secondary" data-action="close-modal">Close Window</button>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Unmatched Record Inspector Modal
    if (S.inspectedUnmatchedItem) {
      const u = S.inspectedUnmatchedItem;
      const rowsHtml = Object.keys(u.data)
        .map((col) => {
          const isKeyCol = u.keyCols && u.keyCols.includes(col);
          const trStyle = isKeyCol ? 'style="background: #faf5ff;"' : '';
          const keyBadge = isKeyCol ? '<span class="badge badge-purple" style="margin-left: 6px;">🔑 Match Key</span>' : '';
          return `
            <tr ${trStyle}>
              <td style="width: 260px;"><b>${esc(col)}</b> ${keyBadge}</td>
              <td>${showVal(u.data[col])}</td>
            </tr>
          `;
        })
        .join('');

      let nearMatchBox = '';
      if (u.nearMatch) {
        nearMatchBox = `
          <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 6px; padding: 12px 16px; margin-bottom: 14px; font-size: 13px; color: #854d0e;">
            💡 <b>Possible Near-Match in File ${u.side === 'a' ? 'B' : 'A'}:</b> Key value <b>"${esc(u.nearMatch.key)}"</b> exists at Row ${u.nearMatch.row}. Please check for trailing spaces, uppercase/lowercase, or formatting differences.
          </div>
        `;
      }

      return `
        <div class="modal-backdrop" data-action="close-modal">
          <div class="modal-card" onclick="event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 style="margin: 0; font-size: 18px;">📋 Unmatched Record Details</h3>
                <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                  Source: <b>File ${u.side.toUpperCase()} ("${esc(u.sourceFileName)}")</b> | Excel Row: <b>${u.row}</b>
                </div>
              </div>
              <button type="button" class="btn-close-modal" data-action="close-modal">✕</button>
            </div>
            <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 6px; padding: 12px 16px; margin-bottom: 14px; font-size: 13px; color: #991b1b;">
              <b>Search Result:</b> Key value <b>"${esc(u.key)}"</b> (from column <b>"${esc(u.keyCols)}"</b>) was <b>NOT FOUND</b> anywhere in <b>"${esc(u.otherFileName)}"</b>.
            </div>
            ${nearMatchBox}
            <div class="scroll-table-wrapper" style="max-height: 420px;">
              <table class="data-table">
                <thead><tr><th>Field / Column Name</th><th>Value in File ${u.side.toUpperCase()} (Row ${u.row})</th></tr></thead>
                <tbody>${rowsHtml}</tbody>
              </table>
            </div>
            <div style="margin-top: 18px; text-align: right;">
              <button type="button" class="btn-secondary" data-action="close-modal">Close</button>
            </div>
          </div>
        </div>
      `;
    }

    const item = S.inspectedItem;
    if (!item) return '';

    const allFields = item.allFields || [];
    const diffCount = item.diffs ? item.diffs.length : 0;
    const matchCount = allFields.length - diffCount;

    const rowsHtml = allFields
      .map((f) => {
        const isDiff = f.isDiff;
        const statusBadge = isDiff
          ? `<span class="badge badge-danger">≠ MISMATCH</span>`
          : `<span class="badge badge-success">✓ MATCH</span>`;

        const rowBg = isDiff ? 'style="background: #fff5f5;"' : '';
        const valAClass = isDiff ? 'modal-val-diff-a' : '';
        const valBClass = isDiff ? 'modal-val-diff-b' : '';

        return `
          <tr ${rowBg}>
            <td><b>${esc(f.field)}</b></td>
            <td class="${valAClass}">${showVal(f.a)}</td>
            <td class="${valBClass}">${showVal(f.b)}</td>
            <td>${statusBadge}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <div class="modal-backdrop" data-action="close-modal">
        <div class="modal-card" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 style="margin: 0; font-size: 18px;">🔍 Side-by-Side Column Comparison</h3>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                Key: <b style="color: #0f172a;">${esc(item.key)}</b> | File A Row: <b>${item.a[0].row}</b> ⟷ File B Row: <b>${item.b[0].row}</b>
              </div>
            </div>
            <button type="button" class="btn-close-modal" data-action="close-modal">✕</button>
          </div>
          <div class="modal-summary-bar">
            <span class="badge badge-danger">⚠️ ${diffCount} ${diffCount === 1 ? 'Column Differs' : 'Columns Differ'}</span>
            <span class="badge badge-success">✓ ${matchCount} ${matchCount === 1 ? 'Column Matches' : 'Columns Match'}</span>
          </div>
          <div class="scroll-table-wrapper" style="max-height: 450px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Column Name</th>
                  <th>File A Value (Row ${item.a[0].row})</th>
                  <th>File B Value (Row ${item.b[0].row})</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
          <div style="margin-top: 18px; text-align: right;">
            <button type="button" class="btn-secondary" data-action="close-modal">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderResults() {
    const res = S.res;
    const box = $('#results-section');
    if (!res) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    box.hidden = false;

    const umCountA = res.unmatched.filter((u) => u.side === 'a').reduce((n, u) => n + u.rows.length, 0);
    const umCountB = res.unmatched.filter((u) => u.side === 'b').reduce((n, u) => n + u.rows.length, 0);
    const totalUnmatched = umCountA + umCountB;

    const cards = [
      { id: 'mismatched', label: 'Mismatched (Diffs)', count: res.mismatched.length, color: 'card-warning', icon: '≠' },
      { id: 'matched', label: 'Exact Matched', count: res.matched.length, color: 'card-success', icon: '✓' },
      { id: 'unmatched-a', label: 'Unmatched in File A', count: umCountA, color: 'card-info', icon: '←' },
      { id: 'unmatched-b', label: 'Unmatched in File B', count: umCountB, color: 'card-indigo', icon: '→' },
      { id: 'duplicate', label: 'Duplicates', count: res.duplicate.length, color: 'card-purple', icon: '⧉' },
      { id: 'ambiguous', label: 'Ambiguous Keys', count: res.ambiguous.length, color: 'card-danger', icon: '⚠' }
    ];

    const cardsHtml = cards
      .map(
        (c) => `
        <button type="button" class="metric-card ${c.color} ${S.tab === c.id ? 'active-card' : ''}" data-tab="${c.id}">
          <div class="card-icon-bubble">${c.icon}</div>
          <div class="card-metric-val">${c.count.toLocaleString()}</div>
          <div class="card-metric-label">${c.label}</div>
        </button>
      `
      )
      .join('');

    const isIntegrityPassed = res.stats.a.ok && res.stats.b.ok;
    const integrityAuditHtml = `
      <div class="audit-banner ${isIntegrityPassed ? 'audit-pass' : 'audit-warn'}">
        <div class="audit-icon">${isIntegrityPassed ? '🛡️' : '⚠️'}</div>
        <div class="audit-text">
          <b>Data Integrity Status: ${isIntegrityPassed ? '100% Passed (All Records Accounted)' : 'Warning'}</b>
          <div>File A: ${res.stats.a.total} rows parsed (${res.stats.a.placed} placed, ${res.stats.a.blank} blank). File B: ${res.stats.b.total} rows parsed (${res.stats.b.placed} placed, ${res.stats.b.blank} blank). Zero rows silently dropped.</div>
        </div>
        <div class="audit-actions">
          <button type="button" class="btn-primary" data-action="export-unmatched" ${totalUnmatched ? '' : 'disabled'}>
            📥 Export Unmatched Records (.xlsx)
          </button>
          <button type="button" class="btn-secondary" data-action="export-full">
            📊 Export Complete Report (.xlsx)
          </button>
        </div>
      </div>
    `;

    // Differing Columns list for filter dropdown
    const allDifferingColumns = new Set();
    res.mismatched.forEach((item) => {
      item.diffs.forEach((d) => allDifferingColumns.add(d.field));
    });

    const diffColumnFilterOptions = ['<option value="all">-- All Differing Columns --</option>'];
    Array.from(allDifferingColumns).sort().forEach((col) => {
      const isSel = col === S.filterDiffColumn ? ' selected' : '';
      diffColumnFilterOptions.push(`<option value="${esc(col)}"${isSel}>Column: ${esc(col)}</option>`);
    });

    const search = S.searchQuery.toLowerCase().trim();
    let currentTableHtml = '';
    let totalItemsCount = 0;

    if (S.tab === 'mismatched') {
      let filtered = res.mismatched || [];

      // Filter by column if selected
      if (S.filterDiffColumn && S.filterDiffColumn !== 'all') {
        filtered = filtered.filter((item) =>
          item.diffs.some((d) => d.field === S.filterDiffColumn || d.fieldA === S.filterDiffColumn)
        );
      }

      // Filter by search query
      if (search) {
        filtered = filtered.filter((item) => {
          if (item.key && item.key.toLowerCase().includes(search)) return true;
          if (item.diffs && item.diffs.some((d) => d.field.toLowerCase().includes(search) || String(d.a).toLowerCase().includes(search) || String(d.b).toLowerCase().includes(search))) return true;
          return false;
        });
      }

      totalItemsCount = filtered.length;

      // View Controls Bar
      const viewControlsHtml = `
        <div class="diff-view-controls-bar">
          <div class="view-mode-buttons">
            <span class="control-label">View Style:</span>
            <button type="button" class="btn-toggle-view ${S.diffViewMode === 'grid' ? 'active-view' : ''}" data-view-mode="grid">
              📊 Side-by-Side Excel Grid (Red/Green Cells)
            </button>
            <button type="button" class="btn-toggle-view ${S.diffViewMode === 'diffs' ? 'active-view' : ''}" data-view-mode="diffs">
              📋 Column Differences Breakdown Table
            </button>
          </div>

          <div class="column-filter-select-wrapper">
            <label>Filter by Changed Column:</label>
            <select data-action="filter-diff-col">${diffColumnFilterOptions.join('')}</select>
          </div>
        </div>
      `;

      if (S.diffViewMode === 'grid') {
        currentTableHtml = viewControlsHtml + renderMismatchedGrid(filtered);
      } else {
        currentTableHtml = viewControlsHtml + renderMismatchedDiffsTable(filtered);
      }
    } else if (S.tab === 'matched') {
      let filtered = res.matched || [];
      if (search) {
        filtered = filtered.filter((item) => item.key && item.key.toLowerCase().includes(search));
      }
      totalItemsCount = filtered.length;

      const comparedCols = S.fields;
      const headers = ['Record Key', 'File A Row', 'File B Row', ...comparedCols.map((f) => esc(f.a))];

      const rows = filtered
        .slice(0, 200)
        .map((item) => {
          const cells = comparedCols.map((f) => `<td>${showVal(item.a[0].data[f.a])}</td>`).join('');
          return `
            <tr>
              <td><b class="key-display">🔑 ${esc(item.key)}</b></td>
              <td><span class="badge badge-info">Row ${item.a[0].row}</span></td>
              <td><span class="badge badge-purple">Row ${item.b[0].row}</span></td>
              ${cells}
            </tr>
          `;
        })
        .join('');

      currentTableHtml = `
        <div class="scroll-table-wrapper main-results-scroll">
          <table class="data-table">
            <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows || `<tr><td colspan="${headers.length}" class="no-records-cell">No matched records found.</td></tr>`}</tbody>
          </table>
        </div>
      `;
    } else if (S.tab === 'unmatched-a' || S.tab === 'unmatched-b') {
      const targetSide = S.tab === 'unmatched-a' ? 'a' : 'b';
      const otherSide = targetSide === 'a' ? 'b' : 'a';
      const sourceTable = targetSide === 'a' ? S.a.table : S.b.table;
      const targetTable = otherSide === 'a' ? S.a.table : S.b.table;
      const sourceFileName = targetSide === 'a' ? S.a.name : S.b.name;
      const otherFileName = targetSide === 'a' ? S.b.name : S.a.name;
      const sourceKeyCols = S.keys.map((k) => (targetSide === 'a' ? k.a : k.b)).join(' + ');
      const targetKeyCols = S.keys.map((k) => (otherSide === 'a' ? k.a : k.b)).join(' + ');

      const unmatchedGroups = res.unmatched.filter((u) => u.side === targetSide);
      let flattened = [];
      unmatchedGroups.forEach((u) => {
        u.rows.forEach((r) => {
          flattened.push({
            side: targetSide,
            key: u.key,
            keyCols: u.keyCols || sourceKeyCols,
            otherKeyCols: u.otherKeyCols || targetKeyCols,
            row: r.row,
            reason: u.reason,
            nearMatch: u.nearMatch,
            isBlankKey: u.isBlankKey,
            data: r.data,
            sourceFileName,
            otherFileName
          });
        });
      });

      if (search) {
        flattened = flattened.filter((item) => {
          if (item.key && item.key.toLowerCase().includes(search)) return true;
          if (item.reason && item.reason.toLowerCase().includes(search)) return true;
          return Object.values(item.data).some((v) => String(v).toLowerCase().includes(search));
        });
      }

      totalItemsCount = flattened.length;

      // Keep reference for click-to-inspect
      S.currentUnmatchedList = flattened;

      const heroBannerHtml = `
        <div class="unmatched-hero-banner">
          <div class="banner-badge-icon">📋</div>
          <div class="banner-body">
            <div class="banner-title">
              <b>${totalItemsCount.toLocaleString()} Records in File ${targetSide.toUpperCase()} ("${esc(sourceFileName)}") NOT FOUND in File ${otherSide.toUpperCase()} ("${esc(otherFileName)}")</b>
            </div>
            <div class="banner-meta">
              <span>Matching Key in File ${targetSide.toUpperCase()}: <span class="badge-col-differing">Column: ${esc(sourceKeyCols)}</span></span>
              <span>➔ Looked up in File ${otherSide.toUpperCase()}: <span class="badge-col-differing">Column: ${esc(targetKeyCols)}</span></span>
            </div>
          </div>
        </div>
      `;

      // Display all available columns of the table
      const dataCols = sourceTable.headers;
      const headers = ['Excel Row', `Missing Key Value (Col: ${esc(sourceKeyCols)})`, 'Search Status', 'Inspect', ...dataCols];

      const rows = flattened
        .slice(0, 300)
        .map((item, idx) => {
          const cells = dataCols.map((c) => `<td>${showVal(item.data[c])}</td>`).join('');

          let keyDisplayHtml = '';
          if (item.isBlankKey || item.key === '(blank key)' || !item.key.trim()) {
            keyDisplayHtml = `<span class="badge badge-danger">⚠️ Empty / Blank Key Value</span>`;
          } else {
            keyDisplayHtml = `
              <div class="unmatched-key-pill">
                <span class="key-icon">🔑</span>
                <b class="key-text">${esc(item.key)}</b>
              </div>
            `;
          }

          let nearMatchHtml = '';
          if (item.nearMatch) {
            nearMatchHtml = `
              <div class="near-match-box" title="Similar key found">
                💡 <b>Near Match in File ${otherSide.toUpperCase()}:</b> "${esc(item.nearMatch.key)}" (Row ${item.nearMatch.row})
              </div>
            `;
          }

          return `
            <tr>
              <td><span class="badge badge-info">Row ${item.row}</span></td>
              <td class="missing-key-cell">
                ${keyDisplayHtml}
                <div class="key-col-subtitle">Column: <b>${esc(item.keyCols)}</b></div>
                ${nearMatchHtml}
              </td>
              <td>
                <div class="missing-status-box">
                  <span class="badge badge-danger">❌ Not in ${esc(otherFileName)}</span>
                  <div class="missing-hint-text">Value "${esc(item.key)}" missing from [${esc(item.otherKeyCols)}]</div>
                </div>
              </td>
              <td>
                <button type="button" class="btn-inspect-row" data-inspect-unmatched="${idx}">
                  🔍 View Row
                </button>
              </td>
              ${cells}
            </tr>
          `;
        })
        .join('');

      currentTableHtml = `
        ${heroBannerHtml}
        <div class="scroll-table-wrapper main-results-scroll">
          <table class="data-table">
            <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${rows || `<tr><td colspan="${headers.length}" class="no-records-cell">No unmatched records found.</td></tr>`}</tbody>
          </table>
        </div>
      `;
    } else if (S.tab === 'ambiguous') {
      const items = res.ambiguous || [];
      totalItemsCount = items.length;

      const heroBannerHtml = `
        <div class="unmatched-hero-banner" style="background: #fffbeb; border-color: #fde68a;">
          <div class="banner-badge-icon">⚠️</div>
          <div class="banner-body">
            <div class="banner-title" style="color: #92400e; font-size: 15px;">
              <b>${totalItemsCount} Ambiguous Key Groups (Multiple Conflicting Rows Found)</b>
            </div>
            <div style="font-size: 13px; color: #78350f; margin-top: 6px; line-height: 1.6;">
              <b>🤔 What is the Issue?</b> The selected Match Key contains duplicate values across both files. For instance, the exact same Key appears multiple times in File A and File B, but the rest of the row data (such as Date, Amount, or Product) differs between those rows. The system cannot guess or force-match rows arbitrarily without compromising data integrity.<br>
              💡 <b>Recommended Solution:</b> Click <b>"🔍 Inspect Conflicting Rows"</b> next to any record below to see what differs across those rows. Then, navigate to <b>Step 1 (Match Key)</b> above and click <b>"+ Add Composite Key Column"</b> (e.g., Date, Product, or Invoice No.) so that each row becomes uniquely identifiable!
            </div>
          </div>
        </div>
      `;

      const rows = items
        .slice(0, 200)
        .map((item, idx) => `
          <tr>
            <td style="min-width: 200px;">
              <div class="unmatched-key-pill">
                <span class="key-icon">🔑</span>
                <b class="key-text">${esc(item.key)}</b>
              </div>
            </td>
            <td style="min-width: 220px;">
              <div class="row-badge-pair">
                <span class="source-bubble bubble-a">File A: ${item.a.length} Rows (Rows ${item.a.map((r) => r.row).join(', ')})</span>
                <span class="source-bubble bubble-b">File B: ${item.b.length} Rows (Rows ${item.b.map((r) => r.row).join(', ')})</span>
              </div>
            </td>
            <td>
              <span class="badge badge-warning" style="font-size: 12px;">⚠️ Multiple Rows with Conflicting Data</span>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Force-matching avoided to protect data accuracy</div>
            </td>
            <td>
              <button type="button" class="btn-inspect-row" data-inspect-ambiguous="${idx}">
                🔍 Inspect Conflicting Rows (${item.a.length + item.b.length} Rows)
              </button>
            </td>
          </tr>
        `)
        .join('');

      currentTableHtml = `
        ${heroBannerHtml}
        <div class="scroll-table-wrapper main-results-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Repeated Key Value</th>
                <th>Rows in Each File</th>
                <th>Why It Wasn't Matched</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows || `<tr><td colspan="4" class="no-records-cell">No ambiguous records.</td></tr>`}</tbody>
          </table>
        </div>
      `;
    } else if (S.tab === 'duplicate') {
      const items = res.duplicate || [];
      totalItemsCount = items.length;

      const heroBannerHtml = `
        <div class="unmatched-hero-banner" style="background: #faf5ff; border-color: #e9d5ff;">
          <div class="banner-badge-icon">⧉</div>
          <div class="banner-body">
            <div class="banner-title" style="color: #6b21a8; font-size: 15px;">
              <b>${totalItemsCount} Duplicate Key Groups (Identical Rows Repeated)</b>
            </div>
            <div style="font-size: 13px; color: #581c87; margin-top: 4px;">
              These records contain repeated key values, but all compared column values within each file are identical copies.
            </div>
          </div>
        </div>
      `;

      const rows = items
        .slice(0, 200)
        .map((item) => `
          <tr>
            <td>
              <div class="unmatched-key-pill">
                <span class="key-icon">🔑</span>
                <b class="key-text">${esc(item.key)}</b>
              </div>
            </td>
            <td>
              <div class="row-badge-pair">
                <span class="source-bubble bubble-a">File A: ${item.a.length} Rows (${item.a.map((r) => r.row).join(', ')})</span>
                <span class="source-bubble bubble-b">File B: ${item.b.length} Rows (${item.b.map((r) => r.row).join(', ')})</span>
              </div>
            </td>
            <td><span class="badge badge-purple">${esc(item.reason)}</span></td>
          </tr>
        `)
        .join('');

      currentTableHtml = `
        ${heroBannerHtml}
        <div class="scroll-table-wrapper main-results-scroll">
          <table class="data-table">
            <thead><tr><th>Key</th><th>Row Occurrences</th><th>Status & Details</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="3" class="no-records-cell">No duplicate records found.</td></tr>`}</tbody>
          </table>
        </div>
      `;
    }

    box.innerHTML = `
      <div class="results-container">
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #0f172a;">
          Comparison Results & Visual Diff Analysis
        </h2>
        ${integrityAuditHtml}

        <div class="metric-cards-grid">${cardsHtml}</div>

        <div class="table-action-bar">
          <div class="search-box-wrapper">
            <input type="text" id="result-search" placeholder="Search across all records..." value="${esc(S.searchQuery)}" aria-label="Search results">
            ${S.searchQuery ? '<button type="button" class="btn-clear-search" data-action="clear-search">✕</button>' : ''}
          </div>
          <div class="table-counts-badge">
            Showing <b>${Math.min(totalItemsCount, 200)}</b> of <b>${totalItemsCount}</b> records
          </div>
        </div>

        ${currentTableHtml}
      </div>

      ${renderInspectorModal()}
    `;

    const searchInput = $('#result-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        S.searchQuery = e.target.value;
        renderResults();
      });
    }
  }

  function runComparison() {
    msg('');
    const cfg = {
      keys: S.keys,
      fields: S.fields,
      options: {
        ignoreCase: $('#ic')?.checked || false,
        tolerance: Math.abs(parseFloat($('#tol')?.value) || 0)
      }
    };

    const errors = ECT.engine.validate(S.a?.table, S.b?.table, cfg);
    if (errors.length) {
      msg(errors.join(' | '));
      return;
    }

    try {
      S.res = ECT.engine.compare(S.a.table, S.b.table, cfg);
      msg('Comparison completed successfully!', true);

      if (S.res.mismatched.length) S.tab = 'mismatched';
      else if (S.res.unmatched.length) S.tab = 'unmatched-a';
      else if (S.res.duplicate.length) S.tab = 'duplicate';
      else S.tab = 'matched';

      renderResults();
      updateStepper();

      // Smooth scroll to results
      setTimeout(() => {
        const resEl = $('#results-section');
        if (resEl) resEl.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (e) {
      msg(`Comparison error: ${e.message}`);
    }
  }

  // Close all open Select2 dropdowns
  function closeAllSelect2(exceptWrapper = null) {
    $$('.select2-wrapper').forEach((w) => {
      if (w !== exceptWrapper) {
        const dd = w.querySelector('.select2-dropdown');
        if (dd) dd.hidden = true;
        w.classList.remove('select2-open');
      }
    });
  }

  // Filter options inside a Select2 dropdown
  function filterSelect2(wrapper, query) {
    const q = query.toLowerCase().trim();
    const options = wrapper.querySelectorAll('.select2-option');
    let visibleCount = 0;
    options.forEach((opt) => {
      const text = opt.textContent.toLowerCase();
      const match = text.includes(q);
      opt.hidden = !match;
      if (match) visibleCount++;
      opt.classList.remove('highlighted');
    });

    // Highlight the first visible option
    const firstVis = wrapper.querySelector('.select2-option:not([hidden])');
    if (firstVis) firstVis.classList.add('highlighted');

    let noResults = wrapper.querySelector('.select2-no-results');
    if (visibleCount === 0) {
      if (!noResults) {
        const list = wrapper.querySelector('.select2-results-list');
        noResults = document.createElement('div');
        noResults.className = 'select2-no-results';
        list.appendChild(noResults);
      }
      noResults.hidden = false;
      noResults.textContent = `No columns matching "${query}"`;
    } else if (noResults) {
      noResults.hidden = true;
    }
  }

  function resetAll() {
    S.a = null;
    S.b = null;
    S.keys = [{ a: '', b: '' }];
    S.fields = [];
    S.res = null;
    S.tab = 'mismatched';
    S.diffViewMode = 'grid';
    S.filterDiffColumn = 'all';
    S.searchQuery = '';
    S.previewOpenA = false;
    S.previewOpenB = false;
    S.inspectedItem = null;
    S.inspectedUnmatchedItem = null;
    S.inspectedAmbiguousItem = null;

    const fileInputA = $('#file-input-a');
    const fileInputB = $('#file-input-b');
    if (fileInputA) fileInputA.value = '';
    if (fileInputB) fileInputB.value = '';

    msg('');
    render();
  }

  // Setup Drag-and-Drop file uploads
  function setupDragAndDrop() {
    ['a', 'b'].forEach((side) => {
      const card = $(`#card-upload-${side}`);
      const dropArea = $(`#drop-area-${side}`);
      if (!card || !dropArea) return;

      ['dragenter', 'dragover'].forEach((eventName) => {
        card.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          card.classList.add('drag-over');
          dropArea.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        card.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          card.classList.remove('drag-over');
          dropArea.classList.remove('drag-over');
        });
      });

      card.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length) {
          loadFile(side, files[0]);
        }
      });
    });
  }

  // Event Listeners
  document.addEventListener('input', (e) => {
    if (e.target.classList.contains('select2-search-input')) {
      const wrapper = e.target.closest('.select2-wrapper');
      if (wrapper) {
        filterSelect2(wrapper, e.target.value);
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    // 1. Escape key handling
    if (e.key === 'Escape') {
      const openWrapper = $('.select2-wrapper.select2-open');
      if (openWrapper) {
        closeAllSelect2();
        e.preventDefault();
        return;
      }
      if (S.inspectedItem || S.inspectedUnmatchedItem || S.inspectedAmbiguousItem) {
        S.inspectedItem = null;
        S.inspectedUnmatchedItem = null;
        S.inspectedAmbiguousItem = null;
        renderResults();
        e.preventDefault();
        return;
      }
    }

    // 2. Select2 Keyboard Navigation
    const openWrapper = $('.select2-wrapper.select2-open');
    if (!openWrapper) return;

    const visibleOptions = Array.from(openWrapper.querySelectorAll('.select2-option:not([hidden])'));

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!visibleOptions.length) return;
      const currentIdx = visibleOptions.findIndex((opt) => opt.classList.contains('highlighted'));
      let nextIdx = 0;
      if (e.key === 'ArrowDown') {
        nextIdx = currentIdx < visibleOptions.length - 1 ? currentIdx + 1 : 0;
      } else {
        nextIdx = currentIdx > 0 ? currentIdx - 1 : visibleOptions.length - 1;
      }
      visibleOptions.forEach((o) => o.classList.remove('highlighted'));
      visibleOptions[nextIdx].classList.add('highlighted');
      visibleOptions[nextIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const highlighted = openWrapper.querySelector('.select2-option.highlighted') || visibleOptions[0];
      if (highlighted) {
        highlighted.click();
      }
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    const d = t.dataset;

    if (d.uploadSide) {
      loadFile(d.uploadSide, t.files[0]);
    } else if (d.sheet) {
      setSheet(d.sheet, t.value, null);
    } else if (d.action === 'filter-diff-col') {
      S.filterDiffColumn = t.value;
      renderResults();
    }
  });

  document.addEventListener('click', (e) => {
    // 1. Check if clicking on Select2 clear button
    const clearBtn = e.target.closest('[data-action="clear-select2"]');
    if (clearBtn) {
      e.stopPropagation();
      const wrapper = clearBtn.closest('.select2-wrapper');
      if (wrapper) {
        const list = wrapper.dataset.list;
        const index = +wrapper.dataset.index;
        const side = wrapper.dataset.side;
        S[list][index][side] = '';
        S.res = null;
        render();
      }
      return;
    }

    // 2. Check if clicking on Select2 toggle trigger
    const selection = e.target.closest('[data-action="toggle-select2"]');
    if (selection) {
      e.stopPropagation();
      const wrapper = selection.closest('.select2-wrapper');
      const dd = wrapper.querySelector('.select2-dropdown');
      const isCurrentlyOpen = wrapper.classList.contains('select2-open');

      if (isCurrentlyOpen) {
        closeAllSelect2();
      } else {
        closeAllSelect2(wrapper);
        dd.hidden = false;
        wrapper.classList.add('select2-open');
        const input = wrapper.querySelector('.select2-search-input');
        if (input) {
          input.value = '';
          filterSelect2(wrapper, '');
          setTimeout(() => input.focus(), 50);
        }
      }
      return;
    }

    // 3. Check if clicking an option inside Select2 dropdown
    const opt = e.target.closest('.select2-option');
    if (opt) {
      e.stopPropagation();
      const wrapper = opt.closest('.select2-wrapper');
      if (wrapper) {
        const val = opt.dataset.val;
        const list = wrapper.dataset.list;
        const index = +wrapper.dataset.index;
        const side = wrapper.dataset.side;
        S[list][index][side] = val;
        S.res = null;
        closeAllSelect2();
        render();
      }
      return;
    }

    // 4. Click inside search input or dropdown container
    if (e.target.closest('.select2-dropdown')) {
      return;
    }

    // Close any open select2 if clicking elsewhere
    closeAllSelect2();

    // Regular buttons and actions
    const btn = e.target.closest('button') || e.target.closest('[data-action="close-modal"]');
    if (!btn) return;
    const d = btn.dataset;

    if (d.setHeader) {
      setHeaderRow(d.setHeader, +d.row);
    } else if (d.togglePreview) {
      if (d.togglePreview === 'a') S.previewOpenA = !S.previewOpenA;
      else if (d.togglePreview === 'b') S.previewOpenB = !S.previewOpenB;
      render();
    } else if (d.triggerUpload) {
      const input = $(`#file-input-${d.triggerUpload}`);
      if (input) input.click();
    } else if (d.addKey) {
      S.keys.push({ a: '', b: '' });
      renderKeyPairs();
    } else if (d.addField) {
      S.fields.push({ a: '', b: '' });
      renderFieldPairs();
    } else if (d.remove) {
      const list = d.remove;
      const idx = +d.index;
      S[list].splice(idx, 1);
      S.res = null;
      render();
    } else if (d.autoMap) {
      autoMapColumns();
      render();
    } else if (d.runComparison) {
      runComparison();
    } else if (d.tab) {
      S.tab = d.tab;
      renderResults();
    } else if (d.viewMode) {
      S.diffViewMode = d.viewMode;
      renderResults();
    } else if (d.inspectItem !== undefined) {
      const idx = +d.inspectItem;
      if (S.res?.mismatched && S.res.mismatched[idx]) {
        S.inspectedItem = S.res.mismatched[idx];
        S.inspectedUnmatchedItem = null;
        S.inspectedAmbiguousItem = null;
        renderResults();
      }
    } else if (d.inspectUnmatched !== undefined) {
      const idx = +d.inspectUnmatched;
      if (S.currentUnmatchedList && S.currentUnmatchedList[idx]) {
        S.inspectedUnmatchedItem = S.currentUnmatchedList[idx];
        S.inspectedItem = null;
        S.inspectedAmbiguousItem = null;
        renderResults();
      }
    } else if (d.inspectAmbiguous !== undefined) {
      const idx = +d.inspectAmbiguous;
      if (S.res?.ambiguous && S.res.ambiguous[idx]) {
        S.inspectedAmbiguousItem = S.res.ambiguous[idx];
        S.inspectedItem = null;
        S.inspectedUnmatchedItem = null;
        renderResults();
      }
    } else if (d.action === 'close-modal') {
      S.inspectedItem = null;
      S.inspectedUnmatchedItem = null;
      S.inspectedAmbiguousItem = null;
      renderResults();
    } else if (d.action === 'export-unmatched') {
      if (S.res) ECT.excel.exportUnmatched(S.res, S.a.table, S.b.table);
    } else if (d.action === 'export-full') {
      if (S.res) ECT.excel.exportFullReport(S.res, S.a.table, S.b.table);
    } else if (d.action === 'clear-search') {
      S.searchQuery = '';
      renderResults();
    } else if (d.action === 'reset-all') {
      resetAll();
    }
  });

  setupDragAndDrop();
  render();
})();
