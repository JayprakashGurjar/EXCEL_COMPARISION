/**
 * Top Navigation / Header Component
 * Clean enterprise title, description, and global reset button.
 */
function Navbar({ onReset }) {
  return (
    <header className="d-flex justify-content-between align-items-center flex-wrap pb-3 mb-3 border-bottom">
      <div>
        <div className="d-flex align-items-center gap-2">
          <h1 className="h4 fw-bold mb-0 text-dark d-flex align-items-center gap-2">
            <span>📊</span> Excel Comparison Tool
          </h1>
        </div>
        <p className="text-muted small mb-0 mt-1">
          High-Precision Record Reconciliation, Smart Header Detection & Visual Cell-by-Cell Difference Highlighting
        </p>
      </div>

      <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
        <button
          type="button"
          className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 shadow-sm"
          onClick={onReset}
          title="Reset all files and start over"
        >
          <span>🔄</span> Reset All
        </button>
      </div>
    </header>
  );
}
