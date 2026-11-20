/**
 * 3-Step Navigation Tabs
 * Clean pill-based multi-step progression with readiness indicators.
 */
function TabNavigation({ activeTab, onSelectTab, canGoToMapping, canGoToDiffs }) {
  const tabs = [
    { id: 'upload', label: '1. File Upload & Sheets', icon: '📁', enabled: true },
    { id: 'mapping', label: '2. Column Mapping & Keys', icon: '🔀', enabled: canGoToMapping },
    { id: 'diffs', label: '3. Visual Diffs & Results', icon: '📊', enabled: canGoToDiffs }
  ];

  return (
    <ul className="nav nav-pills nav-fill bg-white p-2 rounded-3 border shadow-sm mb-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = !tab.enabled;

        return (
          <li className="nav-item mx-1" key={tab.id}>
            <button
              type="button"
              className={`nav-link text-center py-2 px-3 fw-semibold d-flex align-items-center justify-content-center gap-2 ${
                isActive
                  ? 'active bg-primary text-white shadow-sm'
                  : isDisabled
                  ? 'text-muted disabled opacity-50'
                  : 'text-dark bg-light'
              }`}
              style={{
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => !isDisabled && onSelectTab(tab.id)}
              disabled={isDisabled}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
