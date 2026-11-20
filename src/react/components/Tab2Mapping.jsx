/**
 * Tab 2: Column Mapping & Key Configuration Component
 * Features Select2-based primary/composite key selection, top-bar Run Comparison button right next to Smart Auto-Map, and side-by-side mapping table.
 */
function Tab2Mapping({
  fileA,
  fileB,
  primaryKeyA,
  primaryKeyB,
  onPrimaryKeyAChange,
  onPrimaryKeyBChange,
  compositeKeys,
  onAddCompositeKey,
  onRemoveCompositeKey,
  onCompositeKeyChange,
  columnMappings,
  onMappingChange,
  onAutoMap,
  onCompare,
  onBack,
  isComparing
}) {
  const headersA = fileA?.headers || [];
  const headersB = fileB?.headers || [];

  // Helper to extract first 2 non-empty sample values from data for each column
  const getSampleValues = (fileData, colName) => {
    if (!fileData || !colName) return '';
    // Use precomputed samples if available
    if (fileData.table?.samples && fileData.table.samples[colName]) {
      return `e.g. ${fileData.table.samples[colName]}`;
    }
    const dataList = Array.isArray(fileData.data) ? fileData.data : [];
    const samples = [];
    for (let i = 0; i < Math.min(dataList.length, 30); i++) {
      const row = dataList[i];
      if (!row || typeof row !== 'object') continue;
      const v = row[colName];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        samples.push(String(v).trim());
        if (samples.length >= 2) break;
      }
    }
    return samples.length > 0 ? `e.g. ${samples.join(', ')}` : '';
  };

  // Build Select2 options for File A headers
  const optionsA = headersA.map(h => ({
    value: h,
    label: h,
    subtext: getSampleValues(fileA, h)
  }));

  // Build Select2 options for File B headers (with an empty option)
  const optionsB = [
    { value: '', label: '-- Do Not Compare (Ignore) --', subtext: '' },
    ...headersB.map(h => ({
      value: h,
      label: h,
      subtext: getSampleValues(fileB, h)
    }))
  ];

  const mappedCount = columnMappings.filter(m => m.targetCol && !m.ignore).length;
  const isReadyToCompare = Boolean(primaryKeyA && primaryKeyB && mappedCount > 0);

  return (
    <div>
      {/* Top Navigation Back Button */}
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 shadow-sm"
          onClick={onBack}
        >
          <span>⬅</span>
          <span>Back to File Upload</span>
        </button>

        <span className="text-muted small">
          Step 2 of 3: Configure Reconciliation Keys &amp; Compare Rules
        </span>
      </div>

      {/* Step 1: Match Key Card */}
      <div className="card shadow-sm border rounded-3 mb-4">
        <div className="card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-primary rounded-circle p-2" style={{ width: '28px', height: '28px' }}>1</span>
            <h5 className="h6 fw-bold mb-0 text-dark">Define Unique Match Key(s)</h5>
          </div>
          <span className="badge bg-light text-dark border">
            Ensures 100% Reliable Row Pairing
          </span>
        </div>

        <div className="card-body p-4">
          <p className="text-muted small mb-3">
            Select the primary unique identifier present in both files (e.g. <code>ID</code>, <code>InvoiceNo</code>, <code>EmpCode</code>).
            If rows are identified by multiple columns (e.g. <code>Date + Store + Product</code>), add <strong>Composite Key Columns</strong> below.
          </p>

          <div className="row g-4 align-items-center mb-3">
            {/* File A Primary Key */}
            <div className="col-md-5">
              <label className="form-label small fw-semibold text-dark mb-1">
                <span className="badge bg-primary text-white me-1">A</span> File A Primary Key Column:
              </label>
              <SearchableSelect2
                options={optionsA}
                value={primaryKeyA}
                onChange={onPrimaryKeyAChange}
                placeholder="Choose Key from File A..."
                searchPlaceholder="Search File A headers..."
                showClear={false}
              />
            </div>

            <div className="col-md-2 text-center text-muted fw-bold fs-4 d-none d-md-block">
              ⇄
            </div>

            {/* File B Primary Key */}
            <div className="col-md-5">
              <label className="form-label small fw-semibold text-dark mb-1">
                <span className="badge bg-dark text-white me-1">B</span> File B Primary Key Column:
              </label>
              <SearchableSelect2
                options={headersB.map(h => ({ value: h, label: h, subtext: getSampleValues(fileB, h) }))}
                value={primaryKeyB}
                onChange={onPrimaryKeyBChange}
                placeholder="Choose Key from File B..."
                searchPlaceholder="Search File B headers..."
                showClear={false}
              />
            </div>
          </div>

          {/* Composite Keys Section */}
          <div className="border-top pt-3 mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold small text-dark d-flex align-items-center gap-1">
                <span>🔗</span> Composite Key Columns (Optional)
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1"
                onClick={onAddCompositeKey}
              >
                <span>+</span> Add Composite Column
              </button>
            </div>

            {compositeKeys.length === 0 ? (
              <div className="text-muted small fst-italic">
                No composite columns added. Single key matching will be used.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2 mt-2">
                {compositeKeys.map((ck, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-2 bg-light p-2 rounded border">
                    <span className="badge bg-secondary small">Key #{idx + 2}</span>
                    <div className="flex-grow-1">
                      <SearchableSelect2
                        options={optionsA}
                        value={ck.colA}
                        onChange={(val) => onCompositeKeyChange(idx, 'colA', val)}
                        placeholder="File A Column..."
                      />
                    </div>
                    <span>⇄</span>
                    <div className="flex-grow-1">
                      <SearchableSelect2
                        options={headersB.map(h => ({ value: h, label: h, subtext: getSampleValues(fileB, h) }))}
                        value={ck.colB}
                        onChange={(val) => onCompositeKeyChange(idx, 'colB', val)}
                        placeholder="File B Column..."
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onRemoveCompositeKey(idx)}
                      title="Remove column"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Column Mapping & Run Comparison Card */}
      <div className="card shadow-sm border rounded-3 mb-4">
        {/* Top Action Bar with Auto-Map and Run Comparison placed right next to each other */}
        <div className="card-header bg-white py-3 px-4 border-bottom">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary rounded-circle p-2" style={{ width: '28px', height: '28px' }}>2</span>
              <h5 className="h6 fw-bold mb-0 text-dark">Map Columns to Compare</h5>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle ms-2">
                {mappedCount} / {columnMappings.length} Columns Mapped
              </span>
            </div>

            {/* Action Buttons Right Next to Each Other */}
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
                onClick={onAutoMap}
                title="Automatically match columns by header name similarity"
              >
                <span>⚡</span>
                <span>Smart Auto-Map Columns</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-success px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
                disabled={!isReadyToCompare || isComparing}
                onClick={onCompare}
              >
                {isComparing ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Reconciling...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Run Excel Comparison</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Column Mapping Table */}
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '30%' }}>File A Column (Baseline)</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Map To</th>
                  <th style={{ width: '34%' }}>File B Column (Target)</th>
                  <th style={{ width: '18%' }}>Comparison Rule</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Ignore</th>
                </tr>
              </thead>
              <tbody>
                {columnMappings.map((m, idx) => (
                  <tr key={m.sourceCol} className={m.ignore ? 'table-light opacity-50' : ''}>
                    {/* File A Column */}
                    <td>
                      <div className="fw-semibold text-dark text-truncate" title={m.sourceCol}>
                        {m.sourceCol}
                      </div>
                      <div className="text-muted small text-truncate" style={{ fontSize: '0.75rem' }}>
                        {getSampleValues(fileA, m.sourceCol)}
                      </div>
                    </td>

                    {/* Arrow */}
                    <td className="text-center text-muted fw-bold">
                      ➔
                    </td>

                    {/* File B Column Select2 */}
                    <td>
                      <SearchableSelect2
                        options={optionsB}
                        value={m.targetCol}
                        onChange={(val) => onMappingChange(idx, 'targetCol', val)}
                        disabled={m.ignore}
                        placeholder="Select matching column..."
                        searchPlaceholder="Search File B columns..."
                      />
                    </td>

                    {/* Comparison Rule Select */}
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={m.type || 'auto'}
                        disabled={m.ignore}
                        onChange={(e) => onMappingChange(idx, 'type', e.target.value)}
                      >
                        <option value="auto">Auto-Detect Type</option>
                        <option value="text">Exact Text</option>
                        <option value="case-insensitive">Case-Insensitive Text</option>
                        <option value="number">Numeric (Tolerance ±0.01)</option>
                        <option value="date">Date Formats</option>
                      </select>
                    </td>

                    {/* Ignore Checkbox */}
                    <td className="text-center">
                      <div className="form-check form-switch d-inline-block">
                        <input
                          className="form-check-input cursor-pointer"
                          type="checkbox"
                          checked={m.ignore}
                          onChange={(e) => onMappingChange(idx, 'ignore', e.target.checked)}
                          title="Toggle ignore column"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Footer with duplicated bottom action bar */}
        <div className="card-footer bg-white py-3 px-4 d-flex justify-content-between align-items-center">
          <button
            type="button"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
            onClick={onBack}
          >
            <span>⬅</span>
            <span>Back to File Upload</span>
          </button>

          <button
            type="button"
            className="btn btn-success px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
            disabled={!isReadyToCompare || isComparing}
            onClick={onCompare}
          >
            <span>🚀</span>
            <span>Run Excel Comparison</span>
          </button>
        </div>
      </div>
    </div>
  );
}
