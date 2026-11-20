/**
 * Inspect Conflicting Ambiguous Rows Modal
 * Displays side-by-side comparison of conflicting duplicate rows with clear English guidance.
 */
function InspectModal({ item, onClose, onGoToMapping }) {
  if (!item) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
          {/* Modal Header */}
          <div className="modal-header bg-danger text-white py-3 px-4">
            <div>
              <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-1">
                <span>🔍</span> Conflicting Rows Inspector: Key &quot;{item.key}&quot;
              </h5>
              <div className="small opacity-90">
                Found {item.countA} row(s) in File A and {item.countB} row(s) in File B with this identical key
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4 bg-light">
            {/* English Explanation Alert */}
            <div className="alert alert-warning border border-warning shadow-sm rounded-3 mb-4">
              <h6 className="fw-bold text-dark mb-1">🤔 What is the Issue?</h6>
              <p className="mb-2 small text-secondary">
                The selected Key column contains duplicate values across both files. For example, key &quot;<strong>{item.key}</strong>&quot;
                appears <strong>{item.countA} times</strong> in File A and <strong>{item.countB} times</strong> in File B,
                but the accompanying data across other columns differs. To protect 100% data integrity, the system deliberately avoids arbitrary force-matching.
              </p>
              <h6 className="fw-bold text-dark mb-1">💡 Recommended Solution</h6>
              <p className="mb-0 small text-secondary">
                Review the rows below to identify distinguishing fields (e.g., Date, Product, Branch, Invoice No).
                Then return to <strong>Step 1 (Column Mapping &amp; Keys)</strong> and click <strong>&quot;+ Add Composite Key Column&quot;</strong> to create a uniquely identifiable multi-column key.
              </p>
            </div>

            <div className="row g-4">
              {/* File A Conflicting Rows */}
              <div className="col-lg-6">
                <div className="card shadow-sm border h-100">
                  <div className="card-header bg-white py-2 px-3 fw-bold text-danger border-bottom d-flex justify-content-between">
                    <span>📄 File A Rows ({item.rowsA?.length || 0})</span>
                    <span className="badge bg-danger-subtle text-danger border">Source A</span>
                  </div>
                  <div className="card-body p-0 overflow-auto" style={{ maxHeight: '350px' }}>
                    <div className="table-responsive mb-0">
                      <table className="table table-sm table-hover table-bordered mb-0 small">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>#</th>
                            {item.rowsA && item.rowsA[0] && Object.keys(item.rowsA[0]).map(col => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {item.rowsA?.map((row, rIdx) => (
                            <tr key={rIdx}>
                              <td className="fw-bold text-muted">{rIdx + 1}</td>
                              {Object.keys(row).map(col => (
                                <td key={col} className="text-truncate" style={{ maxWidth: '140px' }} title={String(row[col] ?? '')}>
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* File B Conflicting Rows */}
              <div className="col-lg-6">
                <div className="card shadow-sm border h-100">
                  <div className="card-header bg-white py-2 px-3 fw-bold text-success border-bottom d-flex justify-content-between">
                    <span>📄 File B Rows ({item.rowsB?.length || 0})</span>
                    <span className="badge bg-success-subtle text-success border">Source B</span>
                  </div>
                  <div className="card-body p-0 overflow-auto" style={{ maxHeight: '350px' }}>
                    <div className="table-responsive mb-0">
                      <table className="table table-sm table-hover table-bordered mb-0 small">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>#</th>
                            {item.rowsB && item.rowsB[0] && Object.keys(item.rowsB[0]).map(col => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {item.rowsB?.map((row, rIdx) => (
                            <tr key={rIdx}>
                              <td className="fw-bold text-muted">{rIdx + 1}</td>
                              {Object.keys(row).map(col => (
                                <td key={col} className="text-truncate" style={{ maxWidth: '140px' }} title={String(row[col] ?? '')}>
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-white py-3 px-4 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close Inspector
            </button>
            <button
              type="button"
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              onClick={() => {
                onClose();
                if (onGoToMapping) onGoToMapping();
              }}
            >
              <span>🔀</span> Go to Column Mapping to Add Composite Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
