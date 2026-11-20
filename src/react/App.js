const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;
// --- File: src/react/components/SearchableSelect2.jsx ---

/**
 * Reusable Select2-style searchable dropdown component.
 * Features: live text search, badge/subtext display, clear button, keyboard navigation, click-outside close.
 */
function SearchableSelect2({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  className = '',
  showClear = true,
  emptyMessage = 'No matching options found'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options into { value, label, subtext, badge }
  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: String(opt.value ?? ''),
          label: String(opt.label ?? opt.value ?? ''),
          subtext: opt.subtext ? String(opt.subtext) : '',
          badge: opt.badge ? String(opt.badge) : ''
        };
      }
      return {
        value: String(opt),
        label: String(opt),
        subtext: '',
        badge: ''
      };
    });
  }, [options]);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(opt => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q) || opt.subtext.toLowerCase().includes(q));
  }, [normalizedOptions, searchTerm]);

  // Find currently selected option object
  const selectedOption = normalizedOptions.find(opt => opt.value === String(value));

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightIndex(0);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation inside dropdown
  const handleKeyDown = e => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => prev < filteredOptions.length - 1 ? prev + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => prev > 0 ? prev - 1 : filteredOptions.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[highlightIndex]) {
        onChange(filteredOptions[highlightIndex].value);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };
  const handleSelect = val => {
    onChange(val);
    setIsOpen(false);
  };
  const handleClear = e => {
    e.stopPropagation();
    onChange('');
  };
  return /*#__PURE__*/React.createElement("div", {
    className: `position-relative select2-container ${className}`,
    ref: dropdownRef,
    style: {
      minWidth: '180px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: `form-select d-flex align-items-center justify-content-between text-start cursor-pointer ${disabled ? 'disabled bg-light text-muted' : 'bg-white'} ${isOpen ? 'border-primary shadow-sm' : ''}`,
    style: {
      cursor: disabled ? 'not-allowed' : 'pointer',
      userSelect: 'none',
      paddingRight: '0.75rem',
      minHeight: '38px',
      borderColor: isOpen ? '#2563eb' : '#cbd5e1'
    },
    onClick: () => !disabled && setIsOpen(!isOpen),
    onKeyDown: handleKeyDown,
    tabIndex: disabled ? -1 : 0,
    role: "combobox",
    "aria-expanded": isOpen
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-truncate pe-2 flex-grow-1"
  }, selectedOption ? /*#__PURE__*/React.createElement("span", {
    className: "fw-medium text-dark d-flex align-items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-truncate"
  }, selectedOption.label), selectedOption.badge && /*#__PURE__*/React.createElement("span", {
    className: "badge bg-secondary-subtle text-secondary border px-1 py-0 small",
    style: {
      fontSize: '0.65rem'
    }
  }, selectedOption.badge)) : /*#__PURE__*/React.createElement("span", {
    className: "text-muted"
  }, placeholder)), /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-1 text-muted"
  }, showClear && selectedOption && !disabled && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-link p-0 text-muted text-decoration-none",
    style: {
      lineHeight: 1,
      fontSize: '0.9rem'
    },
    onClick: handleClear,
    title: "Clear selection"
  }, "\u2715"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.7rem',
      opacity: 0.7
    }
  }, isOpen ? '▲' : '▼'))), isOpen && !disabled && /*#__PURE__*/React.createElement("div", {
    className: "position-absolute start-0 end-0 bg-white border border-primary rounded-bottom shadow-lg mt-1",
    style: {
      zIndex: 1050,
      maxHeight: '320px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-2 border-bottom bg-light"
  }, /*#__PURE__*/React.createElement("div", {
    className: "input-group input-group-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "input-group-text bg-white border-end-0 text-muted"
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("input", {
    ref: searchInputRef,
    type: "text",
    className: "form-control border-start-0 ps-1",
    placeholder: searchPlaceholder,
    value: searchTerm,
    onChange: e => {
      setSearchTerm(e.target.value);
      setHighlightIndex(0);
    },
    onKeyDown: handleKeyDown,
    onClick: e => e.stopPropagation()
  }), searchTerm && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-outline-secondary",
    onClick: () => setSearchTerm('')
  }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
    className: "overflow-auto flex-grow-1",
    style: {
      maxHeight: '250px'
    }
  }, filteredOptions.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "p-3 text-center text-muted small fst-italic"
  }, emptyMessage) : filteredOptions.map((opt, idx) => {
    const isSelected = opt.value === String(value);
    const isHighlighted = idx === highlightIndex;
    return /*#__PURE__*/React.createElement("div", {
      key: `${opt.value}-${idx}`,
      className: `px-3 py-2 cursor-pointer border-bottom-0 d-flex align-items-center justify-content-between ${isSelected ? 'bg-primary-subtle text-primary fw-semibold' : isHighlighted ? 'bg-light text-dark' : 'text-dark'}`,
      style: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease'
      },
      onClick: () => handleSelect(opt.value),
      onMouseEnter: () => setHighlightIndex(idx)
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-truncate me-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "text-truncate"
    }, opt.label), opt.subtext && /*#__PURE__*/React.createElement("div", {
      className: "text-muted small text-truncate",
      style: {
        fontSize: '0.75rem'
      }
    }, opt.subtext)), isSelected && /*#__PURE__*/React.createElement("span", {
      className: "text-primary small fw-bold"
    }, "\u2713"));
  }))));
}

// --- File: src/react/components/Navbar.jsx ---
/**
 * Top Navigation / Header Component
 * Clean enterprise title, description, and global reset button.
 */
function Navbar({
  onReset
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "d-flex justify-content-between align-items-center flex-wrap pb-3 mb-3 border-bottom"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-2"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "h4 fw-bold mb-0 text-dark d-flex align-items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCA"), " Excel Comparison Tool")), /*#__PURE__*/React.createElement("p", {
    className: "text-muted small mb-0 mt-1"
  }, "High-Precision Record Reconciliation, Smart Header Detection & Visual Cell-by-Cell Difference Highlighting")), /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-2 mt-2 mt-md-0"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 shadow-sm",
    onClick: onReset,
    title: "Reset all files and start over"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD04"), " Reset All")));
}

// --- File: src/react/components/TabNavigation.jsx ---
/**
 * 3-Step Navigation Tabs
 * Clean pill-based multi-step progression with readiness indicators.
 */
function TabNavigation({
  activeTab,
  onSelectTab,
  canGoToMapping,
  canGoToDiffs
}) {
  const tabs = [{
    id: 'upload',
    label: '1. File Upload & Sheets',
    icon: '📁',
    enabled: true
  }, {
    id: 'mapping',
    label: '2. Column Mapping & Keys',
    icon: '🔀',
    enabled: canGoToMapping
  }, {
    id: 'diffs',
    label: '3. Visual Diffs & Results',
    icon: '📊',
    enabled: canGoToDiffs
  }];
  return /*#__PURE__*/React.createElement("ul", {
    className: "nav nav-pills nav-fill bg-white p-2 rounded-3 border shadow-sm mb-4"
  }, tabs.map(tab => {
    const isActive = activeTab === tab.id;
    const isDisabled = !tab.enabled;
    return /*#__PURE__*/React.createElement("li", {
      className: "nav-item mx-1",
      key: tab.id
    }, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: `nav-link text-center py-2 px-3 fw-semibold d-flex align-items-center justify-content-center gap-2 ${isActive ? 'active bg-primary text-white shadow-sm' : isDisabled ? 'text-muted disabled opacity-50' : 'text-dark bg-light'}`,
      style: {
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        borderRadius: '8px',
        transition: 'all 0.2s ease'
      },
      onClick: () => !isDisabled && onSelectTab(tab.id),
      disabled: isDisabled
    }, /*#__PURE__*/React.createElement("span", null, tab.icon), /*#__PURE__*/React.createElement("span", null, tab.label)));
  }));
}

// --- File: src/react/components/InspectModal.jsx ---
/**
 * Inspect Conflicting Ambiguous Rows Modal
 * Displays side-by-side comparison of conflicting duplicate rows with clear English guidance.
 */
function InspectModal({
  item,
  onClose,
  onGoToMapping
}) {
  if (!item) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal show d-block",
    style: {
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      zIndex: 1060
    },
    role: "dialog",
    "aria-modal": "true"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content shadow-lg border-0 rounded-3 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header bg-danger text-white py-3 px-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title fw-bold d-flex align-items-center gap-2 mb-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD0D"), " Conflicting Rows Inspector: Key \"", item.key, "\""), /*#__PURE__*/React.createElement("div", {
    className: "small opacity-90"
  }, "Found ", item.countA, " row(s) in File A and ", item.countB, " row(s) in File B with this identical key")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-close btn-close-white",
    onClick: onClose,
    "aria-label": "Close"
  })), /*#__PURE__*/React.createElement("div", {
    className: "modal-body p-4 bg-light"
  }, /*#__PURE__*/React.createElement("div", {
    className: "alert alert-warning border border-warning shadow-sm rounded-3 mb-4"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "fw-bold text-dark mb-1"
  }, "\uD83E\uDD14 What is the Issue?"), /*#__PURE__*/React.createElement("p", {
    className: "mb-2 small text-secondary"
  }, "The selected Key column contains duplicate values across both files. For example, key \"", /*#__PURE__*/React.createElement("strong", null, item.key), "\" appears ", /*#__PURE__*/React.createElement("strong", null, item.countA, " times"), " in File A and ", /*#__PURE__*/React.createElement("strong", null, item.countB, " times"), " in File B, but the accompanying data across other columns differs. To protect 100% data integrity, the system deliberately avoids arbitrary force-matching."), /*#__PURE__*/React.createElement("h6", {
    className: "fw-bold text-dark mb-1"
  }, "\uD83D\uDCA1 Recommended Solution"), /*#__PURE__*/React.createElement("p", {
    className: "mb-0 small text-secondary"
  }, "Review the rows below to identify distinguishing fields (e.g., Date, Product, Branch, Invoice No). Then return to ", /*#__PURE__*/React.createElement("strong", null, "Step 1 (Column Mapping & Keys)"), " and click ", /*#__PURE__*/React.createElement("strong", null, "\"+ Add Composite Key Column\""), " to create a uniquely identifiable multi-column key.")), /*#__PURE__*/React.createElement("div", {
    className: "row g-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-lg-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border h-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header bg-white py-2 px-3 fw-bold text-danger border-bottom d-flex justify-content-between"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCC4 File A Rows (", item.rowsA?.length || 0, ")"), /*#__PURE__*/React.createElement("span", {
    className: "badge bg-danger-subtle text-danger border"
  }, "Source A")), /*#__PURE__*/React.createElement("div", {
    className: "card-body p-0 overflow-auto",
    style: {
      maxHeight: '350px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-responsive mb-0"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table table-sm table-hover table-bordered mb-0 small"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "table-light sticky-top"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "#"), item.rowsA && item.rowsA[0] && Object.keys(item.rowsA[0]).map(col => /*#__PURE__*/React.createElement("th", {
    key: col
  }, col)))), /*#__PURE__*/React.createElement("tbody", null, item.rowsA?.map((row, rIdx) => /*#__PURE__*/React.createElement("tr", {
    key: rIdx
  }, /*#__PURE__*/React.createElement("td", {
    className: "fw-bold text-muted"
  }, rIdx + 1), Object.keys(row).map(col => /*#__PURE__*/React.createElement("td", {
    key: col,
    className: "text-truncate",
    style: {
      maxWidth: '140px'
    },
    title: String(row[col] ?? '')
  }, String(row[col] ?? ''))))))))))), /*#__PURE__*/React.createElement("div", {
    className: "col-lg-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border h-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header bg-white py-2 px-3 fw-bold text-success border-bottom d-flex justify-content-between"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCC4 File B Rows (", item.rowsB?.length || 0, ")"), /*#__PURE__*/React.createElement("span", {
    className: "badge bg-success-subtle text-success border"
  }, "Source B")), /*#__PURE__*/React.createElement("div", {
    className: "card-body p-0 overflow-auto",
    style: {
      maxHeight: '350px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-responsive mb-0"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table table-sm table-hover table-bordered mb-0 small"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "table-light sticky-top"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "#"), item.rowsB && item.rowsB[0] && Object.keys(item.rowsB[0]).map(col => /*#__PURE__*/React.createElement("th", {
    key: col
  }, col)))), /*#__PURE__*/React.createElement("tbody", null, item.rowsB?.map((row, rIdx) => /*#__PURE__*/React.createElement("tr", {
    key: rIdx
  }, /*#__PURE__*/React.createElement("td", {
    className: "fw-bold text-muted"
  }, rIdx + 1), Object.keys(row).map(col => /*#__PURE__*/React.createElement("td", {
    key: col,
    className: "text-truncate",
    style: {
      maxWidth: '140px'
    },
    title: String(row[col] ?? '')
  }, String(row[col] ?? ''))))))))))))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer bg-white py-3 px-4 d-flex justify-content-between"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-secondary",
    onClick: onClose
  }, "Close Inspector"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary d-inline-flex align-items-center gap-2",
    onClick: () => {
      onClose();
      if (onGoToMapping) onGoToMapping();
    }
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD00"), " Go to Column Mapping to Add Composite Key")))));
}

// --- File: src/react/components/Tab1Upload.jsx ---

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
    return /*#__PURE__*/React.createElement("div", {
      className: "col-lg-6"
    }, /*#__PURE__*/React.createElement("div", {
      className: `card h-100 shadow-sm border rounded-3 overflow-hidden ${isLoaded ? `border-${borderColor}` : ''}`
    }, /*#__PURE__*/React.createElement("div", {
      className: `card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between`
    }, /*#__PURE__*/React.createElement("div", {
      className: "d-flex align-items-center gap-2"
    }, /*#__PURE__*/React.createElement("span", {
      className: `badge bg-${badgeColor} text-white px-2 py-1`
    }, fileType.toUpperCase()), /*#__PURE__*/React.createElement("h5", {
      className: "h6 fw-bold mb-0 text-dark"
    }, label)), isLoaded && /*#__PURE__*/React.createElement("span", {
      className: "badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small"
    }, "\u2713 Ready (", (file.data?.length || 0).toLocaleString(), " rows)")), /*#__PURE__*/React.createElement("div", {
      className: "card-body p-4"
    }, /*#__PURE__*/React.createElement("input", {
      type: "file",
      ref: fileInputRef,
      className: "d-none",
      accept: ".xlsx,.xls,.csv",
      onChange: e => {
        if (e.target.files && e.target.files[0]) {
          onFileUpload(e.target.files[0], fileType);
        }
      }
    }), !isLoaded ? /*#__PURE__*/React.createElement("div", {
      className: "upload-dropzone p-5 text-center border-2 border-dashed rounded-3 cursor-pointer bg-light d-flex flex-column align-items-center justify-content-center",
      style: {
        minHeight: '260px',
        borderColor: '#cbd5e1',
        cursor: 'pointer'
      },
      onClick: () => fileInputRef.current && fileInputRef.current.click(),
      onDragOver: e => {
        e.preventDefault();
        e.stopPropagation();
      },
      onDrop: e => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          onFileUpload(e.dataTransfer.files[0], fileType);
        }
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "display-5 mb-2 text-muted"
    }, "\uD83D\uDCC1"), /*#__PURE__*/React.createElement("div", {
      className: "fw-bold text-dark mb-1"
    }, "Click to Upload or Drag & Drop"), /*#__PURE__*/React.createElement("div", {
      className: "text-muted small mb-3"
    }, "Supports .xlsx, .xls, .csv spreadsheets"), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: `btn btn-sm btn-${badgeColor} px-3 shadow-sm`
    }, "Browse File")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "d-flex align-items-center justify-content-between p-3 bg-light rounded-3 border mb-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "d-flex align-items-center gap-2 text-truncate"
    }, /*#__PURE__*/React.createElement("span", {
      className: "fs-4"
    }, "\uD83D\uDCCA"), /*#__PURE__*/React.createElement("div", {
      className: "text-truncate"
    }, /*#__PURE__*/React.createElement("div", {
      className: "fw-bold text-dark text-truncate",
      title: file.name
    }, file.name), /*#__PURE__*/React.createElement("div", {
      className: "text-muted small"
    }, ((file.size || 0) / 1024).toFixed(1), " KB \u2022 ", (file.data?.length || 0).toLocaleString(), " Records \u2022 ", file.headers?.length || 0, " Columns"))), /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-sm btn-outline-secondary",
      onClick: () => fileInputRef.current && fileInputRef.current.click(),
      title: "Change file"
    }, "Change")), /*#__PURE__*/React.createElement("div", {
      className: "row g-3 mb-3"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col-sm-7"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label small fw-semibold text-dark mb-1"
    }, "Active Sheet:"), /*#__PURE__*/React.createElement(SearchableSelect2, {
      options: sheetOptions,
      value: selectedSheet,
      onChange: val => onSheetChange(val, fileType),
      placeholder: "Select Worksheet...",
      searchPlaceholder: "Search sheet name...",
      showClear: false
    })), /*#__PURE__*/React.createElement("div", {
      className: "col-sm-5"
    }, /*#__PURE__*/React.createElement("label", {
      className: "form-label small fw-semibold text-dark mb-1"
    }, "Header Row:"), /*#__PURE__*/React.createElement(SearchableSelect2, {
      options: headerOptions,
      value: String(headerRow),
      onChange: val => onHeaderRowChange(Number(val), fileType),
      placeholder: "Select Header Row...",
      searchPlaceholder: "Search row #...",
      showClear: false
    }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "text-muted small fw-semibold mb-2"
    }, "Detected Headers (", file.headers.length, "):"), /*#__PURE__*/React.createElement("div", {
      className: "d-flex flex-wrap gap-1",
      style: {
        maxHeight: '110px',
        overflowY: 'auto'
      }
    }, file.headers.map((h, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      className: "badge bg-white text-dark border px-2 py-1 small"
    }, h))))))));
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "row g-4 mb-4"
  }, renderFileCard({
    fileType: 'fileA',
    label: 'File A (Baseline / Source of Truth)',
    file: fileA,
    sheets: sheetsA,
    selectedSheet: selectedSheetA,
    headerRow: headerRowA,
    fileInputRef: fileInputRefA,
    borderColor: 'primary',
    badgeColor: 'primary'
  }), renderFileCard({
    fileType: 'fileB',
    label: 'File B (Comparison / Target File)',
    file: fileB,
    sheets: sheetsB,
    selectedSheet: selectedSheetB,
    headerRow: headerRowB,
    fileInputRef: fileInputRefB,
    borderColor: 'info',
    badgeColor: 'dark'
  })), /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border rounded-3 p-3 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-wrap justify-content-between align-items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-2"
  }, canProceed ? /*#__PURE__*/React.createElement("span", {
    className: "badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fs-6"
  }, "\u2713 Both files loaded & ready for column mapping") : /*#__PURE__*/React.createElement("span", {
    className: "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 fs-6"
  }, "\u2139 Please upload both File A and File B to continue")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm",
    disabled: !canProceed,
    onClick: onNext
  }, /*#__PURE__*/React.createElement("span", null, "Next: Column Mapping"), /*#__PURE__*/React.createElement("span", null, "\u2794"))))));
}

// --- File: src/react/components/Tab2Mapping.jsx ---
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
  const optionsB = [{
    value: '',
    label: '-- Do Not Compare (Ignore) --',
    subtext: ''
  }, ...headersB.map(h => ({
    value: h,
    label: h,
    subtext: getSampleValues(fileB, h)
  }))];
  const mappedCount = columnMappings.filter(m => m.targetCol && !m.ignore).length;
  const isReadyToCompare = Boolean(primaryKeyA && primaryKeyB && mappedCount > 0);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "mb-3 d-flex justify-content-between align-items-center"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 shadow-sm",
    onClick: onBack
  }, /*#__PURE__*/React.createElement("span", null, "\u2B05"), /*#__PURE__*/React.createElement("span", null, "Back to File Upload")), /*#__PURE__*/React.createElement("span", {
    className: "text-muted small"
  }, "Step 2 of 3: Configure Reconciliation Keys & Compare Rules")), /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border rounded-3 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header bg-white py-3 px-4 border-bottom d-flex align-items-center justify-content-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge bg-primary rounded-circle p-2",
    style: {
      width: '28px',
      height: '28px'
    }
  }, "1"), /*#__PURE__*/React.createElement("h5", {
    className: "h6 fw-bold mb-0 text-dark"
  }, "Define Unique Match Key(s)")), /*#__PURE__*/React.createElement("span", {
    className: "badge bg-light text-dark border"
  }, "Ensures 100% Reliable Row Pairing")), /*#__PURE__*/React.createElement("div", {
    className: "card-body p-4"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-muted small mb-3"
  }, "Select the primary unique identifier present in both files (e.g. ", /*#__PURE__*/React.createElement("code", null, "ID"), ", ", /*#__PURE__*/React.createElement("code", null, "InvoiceNo"), ", ", /*#__PURE__*/React.createElement("code", null, "EmpCode"), "). If rows are identified by multiple columns (e.g. ", /*#__PURE__*/React.createElement("code", null, "Date + Store + Product"), "), add ", /*#__PURE__*/React.createElement("strong", null, "Composite Key Columns"), " below."), /*#__PURE__*/React.createElement("div", {
    className: "row g-4 align-items-center mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-md-5"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label small fw-semibold text-dark mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge bg-primary text-white me-1"
  }, "A"), " File A Primary Key Column:"), /*#__PURE__*/React.createElement(SearchableSelect2, {
    options: optionsA,
    value: primaryKeyA,
    onChange: onPrimaryKeyAChange,
    placeholder: "Choose Key from File A...",
    searchPlaceholder: "Search File A headers...",
    showClear: false
  })), /*#__PURE__*/React.createElement("div", {
    className: "col-md-2 text-center text-muted fw-bold fs-4 d-none d-md-block"
  }, "\u21C4"), /*#__PURE__*/React.createElement("div", {
    className: "col-md-5"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label small fw-semibold text-dark mb-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge bg-dark text-white me-1"
  }, "B"), " File B Primary Key Column:"), /*#__PURE__*/React.createElement(SearchableSelect2, {
    options: headersB.map(h => ({
      value: h,
      label: h,
      subtext: getSampleValues(fileB, h)
    })),
    value: primaryKeyB,
    onChange: onPrimaryKeyBChange,
    placeholder: "Choose Key from File B...",
    searchPlaceholder: "Search File B headers...",
    showClear: false
  }))), /*#__PURE__*/React.createElement("div", {
    className: "border-top pt-3 mt-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex justify-content-between align-items-center mb-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "fw-semibold small text-dark d-flex align-items-center gap-1"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD17"), " Composite Key Columns (Optional)"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-outline-primary py-1 px-2 d-inline-flex align-items-center gap-1",
    onClick: onAddCompositeKey
  }, /*#__PURE__*/React.createElement("span", null, "+"), " Add Composite Column")), compositeKeys.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-muted small fst-italic"
  }, "No composite columns added. Single key matching will be used.") : /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-column gap-2 mt-2"
  }, compositeKeys.map((ck, idx) => /*#__PURE__*/React.createElement("div", {
    key: idx,
    className: "d-flex align-items-center gap-2 bg-light p-2 rounded border"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge bg-secondary small"
  }, "Key #", idx + 2), /*#__PURE__*/React.createElement("div", {
    className: "flex-grow-1"
  }, /*#__PURE__*/React.createElement(SearchableSelect2, {
    options: optionsA,
    value: ck.colA,
    onChange: val => onCompositeKeyChange(idx, 'colA', val),
    placeholder: "File A Column..."
  })), /*#__PURE__*/React.createElement("span", null, "\u21C4"), /*#__PURE__*/React.createElement("div", {
    className: "flex-grow-1"
  }, /*#__PURE__*/React.createElement(SearchableSelect2, {
    options: headersB.map(h => ({
      value: h,
      label: h,
      subtext: getSampleValues(fileB, h)
    })),
    value: ck.colB,
    onChange: val => onCompositeKeyChange(idx, 'colB', val),
    placeholder: "File B Column..."
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-outline-danger",
    onClick: () => onRemoveCompositeKey(idx),
    title: "Remove column"
  }, "\u2715"))))))), /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border rounded-3 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header bg-white py-3 px-4 border-bottom"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-wrap align-items-center justify-content-between gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge bg-primary rounded-circle p-2",
    style: {
      width: '28px',
      height: '28px'
    }
  }, "2"), /*#__PURE__*/React.createElement("h5", {
    className: "h6 fw-bold mb-0 text-dark"
  }, "Map Columns to Compare"), /*#__PURE__*/React.createElement("span", {
    className: "badge bg-primary-subtle text-primary border border-primary-subtle ms-2"
  }, mappedCount, " / ", columnMappings.length, " Columns Mapped")), /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-outline-primary px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm",
    onClick: onAutoMap,
    title: "Automatically match columns by header name similarity"
  }, /*#__PURE__*/React.createElement("span", null, "\u26A1"), /*#__PURE__*/React.createElement("span", null, "Smart Auto-Map Columns")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-success px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm",
    disabled: !isReadyToCompare || isComparing,
    onClick: onCompare
  }, isComparing ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner-border spinner-border-sm",
    role: "status",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", null, "Reconciling...")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDE80"), /*#__PURE__*/React.createElement("span", null, "Run Excel Comparison")))))), /*#__PURE__*/React.createElement("div", {
    className: "card-body p-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-responsive"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table table-hover align-middle mb-0"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "table-light"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: '30%'
    }
  }, "File A Column (Baseline)"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: '8%',
      textAlign: 'center'
    }
  }, "Map To"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: '34%'
    }
  }, "File B Column (Target)"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: '18%'
    }
  }, "Comparison Rule"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: '10%',
      textAlign: 'center'
    }
  }, "Ignore"))), /*#__PURE__*/React.createElement("tbody", null, columnMappings.map((m, idx) => /*#__PURE__*/React.createElement("tr", {
    key: m.sourceCol,
    className: m.ignore ? 'table-light opacity-50' : ''
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "fw-semibold text-dark text-truncate",
    title: m.sourceCol
  }, m.sourceCol), /*#__PURE__*/React.createElement("div", {
    className: "text-muted small text-truncate",
    style: {
      fontSize: '0.75rem'
    }
  }, getSampleValues(fileA, m.sourceCol))), /*#__PURE__*/React.createElement("td", {
    className: "text-center text-muted fw-bold"
  }, "\u2794"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(SearchableSelect2, {
    options: optionsB,
    value: m.targetCol,
    onChange: val => onMappingChange(idx, 'targetCol', val),
    disabled: m.ignore,
    placeholder: "Select matching column...",
    searchPlaceholder: "Search File B columns..."
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
    className: "form-select form-select-sm",
    value: m.type || 'auto',
    disabled: m.ignore,
    onChange: e => onMappingChange(idx, 'type', e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "auto"
  }, "Auto-Detect Type"), /*#__PURE__*/React.createElement("option", {
    value: "text"
  }, "Exact Text"), /*#__PURE__*/React.createElement("option", {
    value: "case-insensitive"
  }, "Case-Insensitive Text"), /*#__PURE__*/React.createElement("option", {
    value: "number"
  }, "Numeric (Tolerance \xB10.01)"), /*#__PURE__*/React.createElement("option", {
    value: "date"
  }, "Date Formats"))), /*#__PURE__*/React.createElement("td", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "form-check form-switch d-inline-block"
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-check-input cursor-pointer",
    type: "checkbox",
    checked: m.ignore,
    onChange: e => onMappingChange(idx, 'ignore', e.target.checked),
    title: "Toggle ignore column"
  }))))))))), /*#__PURE__*/React.createElement("div", {
    className: "card-footer bg-white py-3 px-4 d-flex justify-content-between align-items-center"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-secondary d-inline-flex align-items-center gap-1",
    onClick: onBack
  }, /*#__PURE__*/React.createElement("span", null, "\u2B05"), /*#__PURE__*/React.createElement("span", null, "Back to File Upload")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-success px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm",
    disabled: !isReadyToCompare || isComparing,
    onClick: onCompare
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDE80"), /*#__PURE__*/React.createElement("span", null, "Run Excel Comparison")))));
}

// --- File: src/react/components/Tab3Diffs.jsx ---

/**
 * Tab 3: Visual Differences & Comprehensive Results Component
 * Features in-place metric card filtering, cell-by-cell diff highlighting, unmatched views, ambiguous inspector, and Excel export.
 */
function Tab3Diffs({
  comparisonResult,
  columnMappings,
  onBackToMapping,
  onInspectAmbiguous,
  onExportAll,
  onExportDiffs
}) {
  const [resultSubView, setResultSubView] = useState('mismatched'); // 'mismatched' | 'matched' | 'unmatched-a' | 'unmatched-b' | 'ambiguous' | 'duplicate'
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyDiffCols, setShowOnlyDiffCols] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  if (!comparisonResult) {
    return /*#__PURE__*/React.createElement("div", {
      className: "card shadow-sm border rounded-3 p-5 text-center bg-white"
    }, /*#__PURE__*/React.createElement("div", {
      className: "display-4 text-muted mb-2"
    }, "\uD83D\uDCCA"), /*#__PURE__*/React.createElement("h5", {
      className: "fw-bold text-dark"
    }, "No Comparison Results Yet"), /*#__PURE__*/React.createElement("p", {
      className: "text-muted small mb-3"
    }, "Please complete column mapping and click \"Run Excel Comparison\" in Tab 2."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
      type: "button",
      className: "btn btn-primary d-inline-flex align-items-center gap-2",
      onClick: onBackToMapping
    }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD00"), /*#__PURE__*/React.createElement("span", null, "Go to Column Mapping"))));
  }
  const {
    matched = [],
    mismatched = [],
    unmatchedA = [],
    unmatchedB = [],
    ambiguous = [],
    duplicatesA = [],
    duplicatesB = []
  } = comparisonResult;
  const totalDuplicates = duplicatesA.length + duplicatesB.length;

  // Filter Active Dataset based on search term
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (resultSubView === 'mismatched') {
      if (!q) return mismatched;
      return mismatched.filter(item => String(item.key).toLowerCase().includes(q) || item.diffs?.some(d => String(d.valA).toLowerCase().includes(q) || String(d.valB).toLowerCase().includes(q) || String(d.field).toLowerCase().includes(q)));
    }
    if (resultSubView === 'matched') {
      if (!q) return matched;
      return matched.filter(item => String(item.key).toLowerCase().includes(q) || Object.values(item.rowA || {}).some(v => String(v).toLowerCase().includes(q)));
    }
    if (resultSubView === 'unmatched-a') {
      if (!q) return unmatchedA;
      return unmatchedA.filter(item => String(item.key).toLowerCase().includes(q) || Object.values(item.row || {}).some(v => String(v).toLowerCase().includes(q)));
    }
    if (resultSubView === 'unmatched-b') {
      if (!q) return unmatchedB;
      return unmatchedB.filter(item => String(item.key).toLowerCase().includes(q) || Object.values(item.row || {}).some(v => String(v).toLowerCase().includes(q)));
    }
    if (resultSubView === 'ambiguous') {
      if (!q) return ambiguous;
      return ambiguous.filter(item => String(item.key).toLowerCase().includes(q) || String(item.reason || '').toLowerCase().includes(q));
    }
    if (resultSubView === 'duplicate') {
      const combined = [...duplicatesA.map(d => ({
        ...d,
        source: 'File A'
      })), ...duplicatesB.map(d => ({
        ...d,
        source: 'File B'
      }))];
      if (!q) return combined;
      return combined.filter(d => String(d.key).toLowerCase().includes(q));
    }
    return [];
  }, [resultSubView, searchTerm, mismatched, matched, unmatchedA, unmatchedB, ambiguous, duplicatesA, duplicatesB]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  // Active columns to display in diff view
  const activeMappedCols = useMemo(() => {
    return columnMappings.filter(m => m.targetCol && !m.ignore);
  }, [columnMappings]);
  const displayCols = useMemo(() => {
    if (!showOnlyDiffCols || resultSubView !== 'mismatched') {
      return activeMappedCols;
    }
    // Only columns that have at least one diff across all mismatched rows
    const diffColNames = new Set();
    mismatched.forEach(m => {
      m.diffs?.forEach(d => diffColNames.add(d.field));
    });
    return activeMappedCols.filter(m => diffColNames.has(m.sourceCol));
  }, [activeMappedCols, showOnlyDiffCols, resultSubView, mismatched]);

  // Metric Cards Config
  const metricCards = [{
    id: 'mismatched',
    label: 'Mismatched Records',
    count: mismatched.length,
    icon: '🔴',
    borderClass: 'border-danger',
    bgClass: 'bg-danger-subtle',
    badgeClass: 'bg-danger text-white'
  }, {
    id: 'matched',
    label: 'Exact Matched',
    count: matched.length,
    icon: '🟢',
    borderClass: 'border-success',
    bgClass: 'bg-success-subtle',
    badgeClass: 'bg-success text-white'
  }, {
    id: 'unmatched-a',
    label: 'Missing in File B',
    count: unmatchedA.length,
    icon: '⚠️',
    borderClass: 'border-warning',
    bgClass: 'bg-warning-subtle',
    badgeClass: 'bg-warning text-dark'
  }, {
    id: 'unmatched-b',
    label: 'Missing in File A',
    count: unmatchedB.length,
    icon: '⚠️',
    borderClass: 'border-warning',
    bgClass: 'bg-warning-subtle',
    badgeClass: 'bg-warning text-dark'
  }, {
    id: 'ambiguous',
    label: 'Ambiguous Conflicts',
    count: ambiguous.length,
    icon: '🛑',
    borderClass: 'border-danger',
    bgClass: 'bg-danger-subtle',
    badgeClass: 'bg-danger text-white'
  }, {
    id: 'duplicate',
    label: 'Duplicate Records',
    count: totalDuplicates,
    icon: '🟣',
    borderClass: 'border-info',
    bgClass: 'bg-info-subtle',
    badgeClass: 'bg-info text-dark'
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border rounded-3 p-3 bg-white mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-wrap justify-content-between align-items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-secondary d-inline-flex align-items-center gap-2 shadow-sm",
    onClick: onBackToMapping,
    title: "Return to Column Mapping and Keys"
  }, /*#__PURE__*/React.createElement("span", null, "\u2B05"), /*#__PURE__*/React.createElement("span", {
    className: "fw-semibold"
  }, "Back to Column Mapping")), /*#__PURE__*/React.createElement("span", {
    className: "badge bg-light text-dark border px-2 py-1 small"
  }, "Step 3 of 3: Visual Differences & Audit")), /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-success btn-sm px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm",
    onClick: onExportDiffs,
    title: "Export only differences and unmatched records to Excel"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCE5"), /*#__PURE__*/React.createElement("span", null, "Export Differences")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-success btn-sm px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1 shadow-sm",
    onClick: onExportAll,
    title: "Export complete comparison workbook with all tabs"
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDCCA"), /*#__PURE__*/React.createElement("span", null, "Export All to Excel"))))), /*#__PURE__*/React.createElement("div", {
    className: "row g-3 mb-4"
  }, metricCards.map(card => {
    const isSelected = resultSubView === card.id;
    return /*#__PURE__*/React.createElement("div", {
      className: "col-6 col-md-4 col-lg-2",
      key: card.id
    }, /*#__PURE__*/React.createElement("div", {
      className: `card h-100 shadow-sm border cursor-pointer text-center p-3 transition-all ${isSelected ? `${card.borderClass} ${card.bgClass} shadow` : 'bg-white hover-shadow'}`,
      style: {
        cursor: 'pointer',
        borderWidth: isSelected ? '2px' : '1px',
        borderRadius: '10px'
      },
      onClick: () => {
        setResultSubView(card.id);
        setPage(1);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "fs-4 mb-1"
    }, card.icon), /*#__PURE__*/React.createElement("div", {
      className: "h4 fw-bold text-dark mb-0"
    }, card.count.toLocaleString()), /*#__PURE__*/React.createElement("div", {
      className: "text-muted small text-truncate",
      style: {
        fontSize: '0.75rem'
      }
    }, card.label), isSelected && /*#__PURE__*/React.createElement("div", {
      className: "mt-1"
    }, /*#__PURE__*/React.createElement("span", {
      className: "badge bg-primary px-2 py-0",
      style: {
        fontSize: '0.65rem'
      }
    }, "Active View"))));
  })), /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border rounded-3 p-3 bg-white mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-wrap justify-content-between align-items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-3 flex-grow-1",
    style: {
      maxWidth: '450px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "input-group input-group-sm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "input-group-text bg-white border-end-0"
  }, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control border-start-0",
    placeholder: "Search by Key or any cell value...",
    value: searchTerm,
    onChange: e => {
      setSearchTerm(e.target.value);
      setPage(1);
    }
  }), searchTerm && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-secondary",
    onClick: () => setSearchTerm('')
  }, "\u2715"))), /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-3"
  }, resultSubView === 'mismatched' && /*#__PURE__*/React.createElement("div", {
    className: "form-check form-switch mb-0"
  }, /*#__PURE__*/React.createElement("input", {
    className: "form-check-input cursor-pointer",
    type: "checkbox",
    id: "diffColSwitch",
    checked: showOnlyDiffCols,
    onChange: e => setShowOnlyDiffCols(e.target.checked)
  }), /*#__PURE__*/React.createElement("label", {
    className: "form-check-label small text-dark cursor-pointer",
    htmlFor: "diffColSwitch"
  }, "Show Only Differing Columns")), /*#__PURE__*/React.createElement("span", {
    className: "badge bg-light text-dark border px-3 py-2 small"
  }, "Showing ", filteredData.length.toLocaleString(), " records")))), (resultSubView === 'mismatched' || resultSubView === 'matched') && /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border rounded-3 overflow-hidden bg-white mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header bg-white py-3 px-4 border-bottom d-flex justify-content-between align-items-center"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "fw-bold mb-0 text-dark d-flex align-items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, resultSubView === 'mismatched' ? '🔴 Mismatched Records' : '🟢 Exact Matched Records'), /*#__PURE__*/React.createElement("span", {
    className: "badge bg-secondary-subtle text-secondary border small"
  }, resultSubView === 'mismatched' ? 'Red = File A, Green = File B' : 'All Values Identical'))), /*#__PURE__*/React.createElement("div", {
    className: "card-body p-0"
  }, paginatedData.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "p-5 text-center text-muted"
  }, "No records found matching current filter.") : /*#__PURE__*/React.createElement("div", {
    className: "table-responsive",
    style: {
      maxHeight: '650px'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "table table-sm table-bordered table-hover align-middle mb-0 font-monospace small"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "table-light sticky-top"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    rowSpan: "2",
    style: {
      width: '40px'
    },
    className: "text-center"
  }, "#"), /*#__PURE__*/React.createElement("th", {
    rowSpan: "2",
    style: {
      minWidth: '140px'
    }
  }, "Match Key"), /*#__PURE__*/React.createElement("th", {
    rowSpan: "2",
    style: {
      width: '100px'
    },
    className: "text-center"
  }, "Status"), displayCols.map(col => /*#__PURE__*/React.createElement("th", {
    key: col.sourceCol,
    colSpan: "2",
    className: "text-center border-start border-end",
    style: {
      minWidth: '220px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "fw-bold text-dark text-truncate",
    title: col.sourceCol
  }, col.sourceCol), /*#__PURE__*/React.createElement("div", {
    className: "text-muted small fw-normal",
    style: {
      fontSize: '0.7rem'
    }
  }, "mapped to ", col.targetCol)))), /*#__PURE__*/React.createElement("tr", null, displayCols.map(col => /*#__PURE__*/React.createElement(React.Fragment, {
    key: `${col.sourceCol}-sub`
  }, /*#__PURE__*/React.createElement("th", {
    className: "text-center bg-danger-subtle text-danger border-start",
    style: {
      width: '110px',
      fontSize: '0.7rem'
    }
  }, "File A"), /*#__PURE__*/React.createElement("th", {
    className: "text-center bg-success-subtle text-success border-end",
    style: {
      width: '110px',
      fontSize: '0.7rem'
    }
  }, "File B"))))), /*#__PURE__*/React.createElement("tbody", null, paginatedData.map((item, idx) => {
    const rowNumber = (page - 1) * rowsPerPage + idx + 1;
    const diffMap = new Map();
    item.diffs?.forEach(d => diffMap.set(d.field, d));
    return /*#__PURE__*/React.createElement("tr", {
      key: item.key || idx
    }, /*#__PURE__*/React.createElement("td", {
      className: "text-center text-muted fw-bold"
    }, rowNumber), /*#__PURE__*/React.createElement("td", {
      className: "fw-semibold text-dark text-truncate",
      style: {
        maxWidth: '160px'
      },
      title: String(item.key)
    }, String(item.key)), /*#__PURE__*/React.createElement("td", {
      className: "text-center"
    }, resultSubView === 'mismatched' ? /*#__PURE__*/React.createElement("span", {
      className: "badge bg-danger-subtle text-danger border border-danger-subtle"
    }, item.diffs?.length || 0, " Diffs") : /*#__PURE__*/React.createElement("span", {
      className: "badge bg-success-subtle text-success border border-success-subtle"
    }, "Matched")), displayCols.map(col => {
      const diff = diffMap.get(col.sourceCol);
      const valA = item.rowA ? item.rowA[col.sourceCol] : '';
      const valB = item.rowB ? item.rowB[col.targetCol] : '';
      if (diff) {
        return /*#__PURE__*/React.createElement(React.Fragment, {
          key: col.sourceCol
        }, /*#__PURE__*/React.createElement("td", {
          className: "diff-cell-a text-truncate",
          style: {
            maxWidth: '130px'
          },
          title: String(valA ?? '')
        }, String(valA ?? '') || /*#__PURE__*/React.createElement("span", {
          className: "fst-italic opacity-50"
        }, "<empty>")), /*#__PURE__*/React.createElement("td", {
          className: "diff-cell-b text-truncate",
          style: {
            maxWidth: '130px'
          },
          title: String(valB ?? '')
        }, String(valB ?? '') || /*#__PURE__*/React.createElement("span", {
          className: "fst-italic opacity-50"
        }, "<empty>")));
      }
      return /*#__PURE__*/React.createElement(React.Fragment, {
        key: col.sourceCol
      }, /*#__PURE__*/React.createElement("td", {
        className: "text-truncate text-secondary",
        style: {
          maxWidth: '130px'
        },
        title: String(valA ?? '')
      }, String(valA ?? '')), /*#__PURE__*/React.createElement("td", {
        className: "text-truncate text-secondary",
        style: {
          maxWidth: '130px'
        },
        title: String(valB ?? '')
      }, String(valB ?? '')));
    }));
  })))))), resultSubView === 'unmatched-a' && /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border rounded-3 overflow-hidden bg-white mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header bg-warning-subtle py-3 px-4 border-bottom"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "fw-bold mb-1 text-dark"
  }, "\u26A0\uFE0F Records Missing in File B (", unmatchedA.length, ")"), /*#__PURE__*/React.createElement("div", {
    className: "text-muted small"
  }, "These records exist in File A (Source of Truth) but no matching key was found in File B.")), /*#__PURE__*/React.createElement("div", {
    className: "card-body p-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-responsive",
    style: {
      maxHeight: '600px'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "table table-sm table-hover table-bordered mb-0 small"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "table-light sticky-top"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "#"), /*#__PURE__*/React.createElement("th", null, "Match Key"), unmatchedA[0]?.row && Object.keys(unmatchedA[0].row).map(c => /*#__PURE__*/React.createElement("th", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, paginatedData.map((item, idx) => /*#__PURE__*/React.createElement("tr", {
    key: idx
  }, /*#__PURE__*/React.createElement("td", {
    className: "fw-bold text-muted"
  }, (page - 1) * rowsPerPage + idx + 1), /*#__PURE__*/React.createElement("td", {
    className: "fw-semibold text-danger"
  }, String(item.key)), item.row && Object.keys(item.row).map(c => /*#__PURE__*/React.createElement("td", {
    key: c,
    className: "text-truncate",
    style: {
      maxWidth: '140px'
    },
    title: String(item.row[c] ?? '')
  }, String(item.row[c] ?? '')))))))))), resultSubView === 'unmatched-b' && /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border rounded-3 overflow-hidden bg-white mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header bg-warning-subtle py-3 px-4 border-bottom"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "fw-bold mb-1 text-dark"
  }, "\u26A0\uFE0F Records Missing in File A (", unmatchedB.length, ")"), /*#__PURE__*/React.createElement("div", {
    className: "text-muted small"
  }, "These records exist in File B (Target) but no matching key was found in File A.")), /*#__PURE__*/React.createElement("div", {
    className: "card-body p-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-responsive",
    style: {
      maxHeight: '600px'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "table table-sm table-hover table-bordered mb-0 small"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "table-light sticky-top"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "#"), /*#__PURE__*/React.createElement("th", null, "Match Key"), unmatchedB[0]?.row && Object.keys(unmatchedB[0].row).map(c => /*#__PURE__*/React.createElement("th", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, paginatedData.map((item, idx) => /*#__PURE__*/React.createElement("tr", {
    key: idx
  }, /*#__PURE__*/React.createElement("td", {
    className: "fw-bold text-muted"
  }, (page - 1) * rowsPerPage + idx + 1), /*#__PURE__*/React.createElement("td", {
    className: "fw-semibold text-danger"
  }, String(item.key)), item.row && Object.keys(item.row).map(c => /*#__PURE__*/React.createElement("td", {
    key: c,
    className: "text-truncate",
    style: {
      maxWidth: '140px'
    },
    title: String(item.row[c] ?? '')
  }, String(item.row[c] ?? '')))))))))), resultSubView === 'ambiguous' && /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border rounded-3 overflow-hidden bg-white mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header bg-danger text-white py-3 px-4"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "fw-bold mb-1"
  }, "\uD83D\uDED1 Ambiguous Key Conflicts (", ambiguous.length, ")"), /*#__PURE__*/React.createElement("div", {
    className: "small opacity-90"
  }, "Multiple rows share identical keys with conflicting data. Force-matching was safely avoided to protect data integrity.")), /*#__PURE__*/React.createElement("div", {
    className: "card-body p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "alert alert-warning border border-warning shadow-sm rounded-3 mb-4"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "fw-bold text-dark mb-1"
  }, "\uD83E\uDD14 What is the Issue?"), /*#__PURE__*/React.createElement("p", {
    className: "mb-2 small text-secondary"
  }, "The selected Key column contains duplicate values across both files. For example, the same key appears multiple times in File A and File B, but the other fields (such as Date, Product, or Amount) differ. The system deliberately prevents arbitrary force-matching to protect data integrity."), /*#__PURE__*/React.createElement("h6", {
    className: "fw-bold text-dark mb-1"
  }, "\uD83D\uDCA1 Recommended Solution"), /*#__PURE__*/React.createElement("p", {
    className: "mb-0 small text-secondary"
  }, "Click ", /*#__PURE__*/React.createElement("strong", null, "\"\uD83D\uDD0D Inspect Conflicting Rows\""), " below to inspect the data differences. Then return to ", /*#__PURE__*/React.createElement("strong", null, "Step 1 (Column Mapping & Keys)"), " and add a ", /*#__PURE__*/React.createElement("strong", null, "Composite Key Column"), " (e.g. Date / Product / Invoice No) so that each row becomes uniquely identifiable!")), /*#__PURE__*/React.createElement("div", {
    className: "table-responsive"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table table-hover table-bordered align-middle mb-0"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "table-light"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "#"), /*#__PURE__*/React.createElement("th", null, "Conflicting Key Value"), /*#__PURE__*/React.createElement("th", null, "Rows in File A"), /*#__PURE__*/React.createElement("th", null, "Rows in File B"), /*#__PURE__*/React.createElement("th", null, "Reason / Safeguard"), /*#__PURE__*/React.createElement("th", {
    className: "text-center"
  }, "Action"))), /*#__PURE__*/React.createElement("tbody", null, paginatedData.map((item, idx) => /*#__PURE__*/React.createElement("tr", {
    key: idx
  }, /*#__PURE__*/React.createElement("td", {
    className: "fw-bold text-muted"
  }, (page - 1) * rowsPerPage + idx + 1), /*#__PURE__*/React.createElement("td", {
    className: "fw-bold text-danger"
  }, String(item.key)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "badge bg-danger-subtle text-danger border"
  }, item.countA, " rows")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "badge bg-success-subtle text-success border"
  }, item.countB, " rows")), /*#__PURE__*/React.createElement("td", {
    className: "small text-muted"
  }, item.reason), /*#__PURE__*/React.createElement("td", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 shadow-sm",
    onClick: () => onInspectAmbiguous(item)
  }, /*#__PURE__*/React.createElement("span", null, "\uD83D\uDD0D"), /*#__PURE__*/React.createElement("span", null, "Inspect Conflicting Rows")))))))))), resultSubView === 'duplicate' && /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border rounded-3 overflow-hidden bg-white mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header bg-info-subtle py-3 px-4 border-bottom"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "fw-bold mb-1 text-dark"
  }, "\uD83D\uDFE3 Internal Duplicate Records (", totalDuplicates, ")"), /*#__PURE__*/React.createElement("div", {
    className: "text-muted small"
  }, "Identical keys repeated within the same file (File A: ", duplicatesA.length, ", File B: ", duplicatesB.length, ").")), /*#__PURE__*/React.createElement("div", {
    className: "card-body p-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-responsive",
    style: {
      maxHeight: '600px'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "table table-sm table-hover table-bordered mb-0 small"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "table-light sticky-top"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "#"), /*#__PURE__*/React.createElement("th", null, "Source File"), /*#__PURE__*/React.createElement("th", null, "Duplicate Key"), /*#__PURE__*/React.createElement("th", null, "Occurrences"))), /*#__PURE__*/React.createElement("tbody", null, paginatedData.map((d, idx) => /*#__PURE__*/React.createElement("tr", {
    key: idx
  }, /*#__PURE__*/React.createElement("td", {
    className: "fw-bold text-muted"
  }, (page - 1) * rowsPerPage + idx + 1), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `badge ${d.source === 'File A' ? 'bg-primary' : 'bg-dark'}`
  }, d.source)), /*#__PURE__*/React.createElement("td", {
    className: "fw-semibold text-danger"
  }, String(d.key)), /*#__PURE__*/React.createElement("td", null, d.count, " times")))))))), totalPages > 1 && /*#__PURE__*/React.createElement("div", {
    className: "d-flex flex-wrap justify-content-between align-items-center p-3 bg-white border rounded-3 shadow-sm mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-muted small"
  }, "Rows per page:"), /*#__PURE__*/React.createElement("select", {
    className: "form-select form-select-sm",
    style: {
      width: '85px'
    },
    value: rowsPerPage,
    onChange: e => {
      setRowsPerPage(Number(e.target.value));
      setPage(1);
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: "25"
  }, "25"), /*#__PURE__*/React.createElement("option", {
    value: "50"
  }, "50"), /*#__PURE__*/React.createElement("option", {
    value: "100"
  }, "100"), /*#__PURE__*/React.createElement("option", {
    value: "200"
  }, "200"))), /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-outline-secondary",
    disabled: page <= 1,
    onClick: () => setPage(prev => Math.max(prev - 1, 1))
  }, "\u25C0 Previous"), /*#__PURE__*/React.createElement("span", {
    className: "small text-muted px-2"
  }, "Page ", /*#__PURE__*/React.createElement("strong", null, page), " of ", /*#__PURE__*/React.createElement("strong", null, totalPages)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-sm btn-outline-secondary",
    disabled: page >= totalPages,
    onClick: () => setPage(prev => Math.min(prev + 1, totalPages))
  }, "Next \u25B6"))), /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border rounded-3 p-3 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex justify-content-between align-items-center"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-secondary d-inline-flex align-items-center gap-2",
    onClick: onBackToMapping
  }, /*#__PURE__*/React.createElement("span", null, "\u2B05"), /*#__PURE__*/React.createElement("span", null, "Back to Column Mapping")), /*#__PURE__*/React.createElement("span", {
    className: "text-muted small"
  }, "Need to change keys or add composite columns? Click Back to Column Mapping above."))));
}

// --- File: src/react/App.jsx ---

/**
 * Main Application Component (Modular Coordinator)
 * Orchestrates File Upload, Sheet Parsing, Header Detection, Column Mapping, and Side-by-Side Visual Differences.
 */
function App() {
  // Navigation State: strictly 3 tabs
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'mapping' | 'diffs'

  // Files & Raw Data
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [rawWorkbookA, setRawWorkbookA] = useState(null);
  const [rawWorkbookB, setRawWorkbookB] = useState(null);

  // Sheets & Header Rows
  const [sheetsA, setSheetsA] = useState([]);
  const [sheetsB, setSheetsB] = useState([]);
  const [selectedSheetA, setSelectedSheetA] = useState('');
  const [selectedSheetB, setSelectedSheetB] = useState('');
  const [headerRowA, setHeaderRowA] = useState(1);
  const [headerRowB, setHeaderRowB] = useState(1);

  // Key Selection & Composite Keys
  const [primaryKeyA, setPrimaryKeyA] = useState('');
  const [primaryKeyB, setPrimaryKeyB] = useState('');
  const [compositeKeys, setCompositeKeys] = useState([]); // [{ colA: '', colB: '' }]

  // Column Mappings
  const [columnMappings, setColumnMappings] = useState([]); // [{ sourceCol, targetCol, type, ignore }]

  // Comparison & Modal States
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [inspectingAmbiguous, setInspectingAmbiguous] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null); // { type: 'success' | 'danger' | 'warning', text: '' }

  // Service Resolvers with fallback to window.ECT
  const getExcel = () => window.excelService || window.ECT?.excelService;
  const getEngine = () => window.comparisonEngine || window.ECT?.comparisonEngine;
  const showToast = (text, type = 'info') => {
    setAlertMsg({
      text,
      type
    });
    setTimeout(() => setAlertMsg(null), 5000);
  };

  // 1. Handle File Upload
  const handleFileUpload = async (file, fileType) => {
    try {
      showToast(`Reading ${file.name}...`, 'info');
      const svc = getExcel();
      if (!svc || typeof svc.parseExcelFile !== 'function') {
        throw new Error('Excel Parser service is initializing. Please re-try in a moment or reload the page.');
      }
      const parsed = await svc.parseExcelFile(file);
      if (fileType === 'fileA') {
        setFileA(parsed);
        setRawWorkbookA(parsed.workbook);
        setSheetsA(parsed.sheetNames || []);
        setSelectedSheetA(parsed.sheetNames[0] || '');
        setHeaderRowA(parsed.detectedHeaderRow || 1);
        setPrimaryKeyA(parsed.headers[0] || '');
      } else {
        setFileB(parsed);
        setRawWorkbookB(parsed.workbook);
        setSheetsB(parsed.sheetNames || []);
        setSelectedSheetB(parsed.sheetNames[0] || '');
        setHeaderRowB(parsed.detectedHeaderRow || 1);
        setPrimaryKeyB(parsed.headers[0] || '');
      }
      showToast(`Successfully loaded ${file.name}`, 'success');
    } catch (err) {
      console.error('File parse error:', err);
      showToast(`Failed to parse ${file.name}: ${err.message}`, 'danger');
    }
  };

  // 2. Handle Sheet Change
  const handleSheetChange = (sheetName, fileType) => {
    const wb = fileType === 'fileA' ? rawWorkbookA : rawWorkbookB;
    if (!wb) return;
    const row = fileType === 'fileA' ? headerRowA : headerRowB;
    const svc = getExcel();
    if (!svc) return;
    const reParsed = svc.parseSheetWithHeaderRow(wb, sheetName, row);
    if (fileType === 'fileA') {
      setSelectedSheetA(sheetName);
      setFileA(prev => ({
        ...prev,
        ...reParsed
      }));
      setPrimaryKeyA(reParsed.headers[0] || '');
    } else {
      setSelectedSheetB(sheetName);
      setFileB(prev => ({
        ...prev,
        ...reParsed
      }));
      setPrimaryKeyB(reParsed.headers[0] || '');
    }
  };

  // 3. Handle Header Row Change
  const handleHeaderRowChange = (newRow, fileType) => {
    const wb = fileType === 'fileA' ? rawWorkbookA : rawWorkbookB;
    const sheet = fileType === 'fileA' ? selectedSheetA : selectedSheetB;
    if (!wb || !sheet) return;
    const svc = getExcel();
    if (!svc) return;
    const reParsed = svc.parseSheetWithHeaderRow(wb, sheet, newRow);
    if (fileType === 'fileA') {
      setHeaderRowA(newRow);
      setFileA(prev => ({
        ...prev,
        ...reParsed,
        detectedHeaderRow: newRow
      }));
      setPrimaryKeyA(reParsed.headers[0] || '');
    } else {
      setHeaderRowB(newRow);
      setFileB(prev => ({
        ...prev,
        ...reParsed,
        detectedHeaderRow: newRow
      }));
      setPrimaryKeyB(reParsed.headers[0] || '');
    }
  };

  // 4. Auto-initialize and update Column Mappings when headers change
  const runAutoMap = useCallback(() => {
    if (!fileA?.headers || !fileB?.headers) return;
    const engine = getEngine();
    if (!engine) return;
    const initialMappings = engine.autoMapHeaders(fileA.headers, fileB.headers);
    setColumnMappings(initialMappings);

    // Auto-select best matching primary key if empty
    if (!primaryKeyA && fileA.headers.length > 0) setPrimaryKeyA(fileA.headers[0]);
    if (!primaryKeyB && fileB.headers.length > 0) {
      const match = initialMappings.find(m => m.sourceCol === fileA.headers[0]);
      setPrimaryKeyB(match?.targetCol || fileB.headers[0]);
    }
  }, [fileA, fileB, primaryKeyA, primaryKeyB]);
  useEffect(() => {
    if (fileA?.headers?.length && fileB?.headers?.length && columnMappings.length === 0) {
      runAutoMap();
    }
  }, [fileA, fileB, columnMappings.length, runAutoMap]);

  // Update specific column mapping row
  const handleMappingChange = (index, field, value) => {
    setColumnMappings(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  // Composite Key helpers
  const handleAddCompositeKey = () => {
    setCompositeKeys(prev => [...prev, {
      colA: fileA?.headers[0] || '',
      colB: fileB?.headers[0] || ''
    }]);
  };
  const handleRemoveCompositeKey = index => {
    setCompositeKeys(prev => prev.filter((_, i) => i !== index));
  };
  const handleCompositeKeyChange = (index, field, value) => {
    setCompositeKeys(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  // 5. Run Comparison
  const handleRunComparison = () => {
    if (!fileA || !fileB) {
      showToast('Please upload both File A and File B first.', 'warning');
      return;
    }
    if (!primaryKeyA || !primaryKeyB) {
      showToast('Please select a Primary Match Key for both files.', 'warning');
      return;
    }
    const validMappings = columnMappings.filter(m => m.targetCol && !m.ignore);
    if (validMappings.length === 0) {
      showToast('Please map at least one column to compare.', 'warning');
      return;
    }
    setIsComparing(true);
    setTimeout(() => {
      try {
        const fullKeyConfig = {
          fileAKey: primaryKeyA,
          fileBKey: primaryKeyB,
          compositeKeys: compositeKeys.filter(ck => ck.colA && ck.colB),
          headersA: fileA.headers,
          headersB: fileB.headers
        };
        const engine = getEngine();
        if (!engine || typeof engine.compareFiles !== 'function') {
          throw new Error('Comparison engine service is not initialized');
        }
        const result = engine.compareFiles(fileA.data, fileB.data, fullKeyConfig, validMappings);
        setComparisonResult(result);
        setIsComparing(false);
        setActiveTab('diffs'); // Move directly to results
        showToast('Comparison completed successfully!', 'success');
      } catch (err) {
        console.error('Comparison error:', err);
        setIsComparing(false);
        showToast(`Comparison error: ${err.message}`, 'danger');
      }
    }, 150);
  };

  // 6. Export to Excel
  const handleExportAll = () => {
    if (!comparisonResult) return;
    try {
      const svc = getExcel();
      if (!svc) throw new Error('Excel Service unavailable');
      svc.exportResultsToExcel(comparisonResult, columnMappings, false);
      showToast('Workbook exported successfully!', 'success');
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'danger');
    }
  };
  const handleExportDiffs = () => {
    if (!comparisonResult) return;
    try {
      const svc = getExcel();
      if (!svc) throw new Error('Excel Service unavailable');
      svc.exportResultsToExcel(comparisonResult, columnMappings, true);
      showToast('Differences workbook exported successfully!', 'success');
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'danger');
    }
  };

  // 7. Global Reset
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all files, keys, and comparison results?')) {
      setFileA(null);
      setFileB(null);
      setRawWorkbookA(null);
      setRawWorkbookB(null);
      setSheetsA([]);
      setSheetsB([]);
      setSelectedSheetA('');
      setSelectedSheetB('');
      setHeaderRowA(1);
      setHeaderRowB(1);
      setPrimaryKeyA('');
      setPrimaryKeyB('');
      setCompositeKeys([]);
      setColumnMappings([]);
      setComparisonResult(null);
      setInspectingAmbiguous(null);
      setActiveTab('upload');
      showToast('All state has been reset.', 'info');
    }
  };

  // Navigation Readiness Checks
  const canGoToMapping = Boolean(fileA?.headers?.length && fileB?.headers?.length);
  const canGoToDiffs = Boolean(comparisonResult);
  return /*#__PURE__*/React.createElement("div", {
    className: "container-fluid py-4 px-lg-5",
    style: {
      maxWidth: '1440px',
      minHeight: '100vh',
      background: '#f8fafc'
    }
  }, /*#__PURE__*/React.createElement(Navbar, {
    onReset: handleReset
  }), alertMsg && /*#__PURE__*/React.createElement("div", {
    className: `alert alert-${alertMsg.type} alert-dismissible fade show shadow-sm py-2 px-3 small mb-3`,
    role: "alert"
  }, /*#__PURE__*/React.createElement("strong", null, alertMsg.type === 'danger' ? 'Error: ' : alertMsg.type === 'success' ? 'Success: ' : 'Notice: '), alertMsg.text, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-close py-2",
    onClick: () => setAlertMsg(null),
    "aria-label": "Close"
  })), /*#__PURE__*/React.createElement(TabNavigation, {
    activeTab: activeTab,
    onSelectTab: setActiveTab,
    canGoToMapping: canGoToMapping,
    canGoToDiffs: canGoToDiffs
  }), activeTab === 'upload' && /*#__PURE__*/React.createElement(Tab1Upload, {
    fileA: fileA,
    fileB: fileB,
    onFileUpload: handleFileUpload,
    sheetsA: sheetsA,
    sheetsB: sheetsB,
    selectedSheetA: selectedSheetA,
    selectedSheetB: selectedSheetB,
    onSheetChange: handleSheetChange,
    headerRowA: headerRowA,
    headerRowB: headerRowB,
    onHeaderRowChange: handleHeaderRowChange,
    onNext: () => setActiveTab('mapping'),
    canProceed: canGoToMapping
  }), activeTab === 'mapping' && /*#__PURE__*/React.createElement(Tab2Mapping, {
    fileA: fileA,
    fileB: fileB,
    primaryKeyA: primaryKeyA,
    primaryKeyB: primaryKeyB,
    onPrimaryKeyAChange: setPrimaryKeyA,
    onPrimaryKeyBChange: setPrimaryKeyB,
    compositeKeys: compositeKeys,
    onAddCompositeKey: handleAddCompositeKey,
    onRemoveCompositeKey: handleRemoveCompositeKey,
    onCompositeKeyChange: handleCompositeKeyChange,
    columnMappings: columnMappings,
    onMappingChange: handleMappingChange,
    onAutoMap: runAutoMap,
    onCompare: handleRunComparison,
    onBack: () => setActiveTab('upload'),
    isComparing: isComparing
  }), activeTab === 'diffs' && /*#__PURE__*/React.createElement(Tab3Diffs, {
    comparisonResult: comparisonResult,
    columnMappings: columnMappings,
    onBackToMapping: () => setActiveTab('mapping'),
    onInspectAmbiguous: item => setInspectingAmbiguous(item),
    onExportAll: handleExportAll,
    onExportDiffs: handleExportDiffs
  }), inspectingAmbiguous && /*#__PURE__*/React.createElement(InspectModal, {
    item: inspectingAmbiguous,
    onClose: () => setInspectingAmbiguous(null),
    onGoToMapping: () => {
      setInspectingAmbiguous(null);
      setActiveTab('mapping');
    }
  }));
}

// Mount to DOM
const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(/*#__PURE__*/React.createElement(App, null));
}