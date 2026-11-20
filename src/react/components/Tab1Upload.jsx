const { useRef } = React;

/**
 * Tab 1: File Upload & Sheet Selection Component
 * Handles drag-and-drop, Excel sheet selection, auto-header detection, and readiness state.
 */
function Tab1Upload({
  fileA,
  fileB,
  onFileUpload,
  sheetsA,
  sheetsB,
  selectedSheetA,
  selectedSheetB,
  onSheetChange,
  headerRowA,
  headerRowB,
  onHeaderRowChange,
  onNext,
  canProceed
}) {
  const fileInputRefA = useRef(null);
  const fileInputRefB = useRef(null);

  // File Card Renderer for clean reusability
  const renderFileCard = ({
    fileType,
    label,
    file,
    sheets,
    selectedSheet,
    headerRow,
    fileInputRef,
    borderColor,
    badgeColor
  }) => {
    const isLoaded = Boolean(file && file.headers && file.headers.length > 0);

    const sheetOptions = (sheets || []).map(s => ({
      value: s,
      label: s,
      badge: 'Sheet'
    }));

    const headerOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(r => ({
      value: String(r),
      label: `Row ${r}`,
      subtext: r === (file?.detectedHeaderRow || 1) ? 'Auto-Detected Header' : ''
    }));

    return (
      <div className="col-lg-6">
        <div className={`card h-100 shadow-sm border rounded-3 overflow-hidden ${isLoaded ? `border-${borderColor}` : ''}`}>
          <div className={`card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between`}>
            <div className="d-flex align-items-center gap-2">
              <span className={`badge bg-${badgeColor} text-white px-2 py-1`}>
                {fileType.toUpperCase()}
              </span>
              <h5 className="h6 fw-bold mb-0 text-dark">{label}</h5>
            </div>
            {isLoaded && (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small">
                ✓ Ready ({(file.data?.length || 0).toLocaleString()} rows)
              </span>
            )}
          </div>

          <div className="card-body p-4">
            <input
              type="file"
              ref={fileInputRef}
              className="d-none"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onFileUpload(e.target.files[0], fileType);
                }
              }}
            />

            {!isLoaded ? (
              <div
                className="upload-dropzone p-5 text-center border-2 border-dashed rounded-3 cursor-pointer bg-light d-flex flex-column align-items-center justify-content-center"
                style={{ minHeight: '260px', borderColor: '#cbd5e1', cursor: 'pointer' }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    onFileUpload(e.dataTransfer.files[0], fileType);
                  }
                }}
              >
                <div className="display-5 mb-2 text-muted">📁</div>
                <div className="fw-bold text-dark mb-1">Click to Upload or Drag &amp; Drop</div>
                <div className="text-muted small mb-3">Supports .xlsx, .xls, .csv spreadsheets</div>
                <button type="button" className={`btn btn-sm btn-${badgeColor} px-3 shadow-sm`}>
                  Browse File
                </button>
              </div>
            ) : (
              <div>
                {/* File Details Info Box */}
                <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex align-items-center gap-2 text-truncate">
                    <span className="fs-4">📊</span>
                    <div className="text-truncate">
                      <div className="fw-bold text-dark text-truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-muted small">
                        {((file.size || 0) / 1024).toFixed(1)} KB &bull; {(file.data?.length || 0).toLocaleString()} Records &bull; {file.headers?.length || 0} Columns
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    title="Change file"
                  >
                    Change
                  </button>
                </div>

                {/* Select2 Sheet Selector */}
                <div className="row g-3 mb-3">
                  <div className="col-sm-7">
                    <label className="form-label small fw-semibold text-dark mb-1">
                      Active Sheet:
                    </label>
                    <SearchableSelect2
                      options={sheetOptions}
                      value={selectedSheet}
                      onChange={(val) => onSheetChange(val, fileType)}
                      placeholder="Select Worksheet..."
                      searchPlaceholder="Search sheet name..."
                      showClear={false}
                    />
                  </div>

                  {/* Select2 Header Row Selector */}
                  <div className="col-sm-5">
                    <label className="form-label small fw-semibold text-dark mb-1">
                      Header Row:
                    </label>
                    <SearchableSelect2
                      options={headerOptions}
                      value={String(headerRow)}
                      onChange={(val) => onHeaderRowChange(Number(val), fileType)}
                      placeholder="Select Header Row..."
                      searchPlaceholder="Search row #..."
                      showClear={false}
                    />
                  </div>
                </div>

                {/* Detected Columns Preview */}
                <div>
                  <div className="text-muted small fw-semibold mb-2">
                    Detected Headers ({file.headers.length}):
                  </div>
                  <div className="d-flex flex-wrap gap-1" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                    {file.headers.map((h, i) => (
                      <span key={i} className="badge bg-white text-dark border px-2 py-1 small">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* File Dropzones Row */}
      <div className="row g-4 mb-4">
        {renderFileCard({
          fileType: 'fileA',
          label: 'File A (Baseline / Source of Truth)',
          file: fileA,
          sheets: sheetsA,
          selectedSheet: selectedSheetA,
          headerRow: headerRowA,
          fileInputRef: fileInputRefA,
          borderColor: 'primary',
          badgeColor: 'primary'
        })}

        {renderFileCard({
          fileType: 'fileB',
          label: 'File B (Comparison / Target File)',
          file: fileB,
          sheets: sheetsB,
          selectedSheet: selectedSheetB,
          headerRow: headerRowB,
          fileInputRef: fileInputRefB,
          borderColor: 'info',
          badgeColor: 'dark'
        })}
      </div>

      {/* Action Bar Card */}
      <div className="card shadow-sm border rounded-3 p-3 bg-white">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            {canProceed ? (
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fs-6">
                ✓ Both files loaded &amp; ready for column mapping
              </span>
            ) : (
              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 fs-6">
                ℹ Please upload both File A and File B to continue
              </span>
            )}
          </div>

          <div>
            <button
              type="button"
              className="btn btn-primary px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
              disabled={!canProceed}
              onClick={onNext}
            >
              <span>Next: Column Mapping</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
