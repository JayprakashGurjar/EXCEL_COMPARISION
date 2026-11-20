const { useState, useEffect, useRef } = React;

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
    return normalizedOptions.filter(opt =>
      opt.label.toLowerCase().includes(q) ||
      opt.value.toLowerCase().includes(q) ||
      opt.subtext.toLowerCase().includes(q)
    );
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
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
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

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div
      className={`position-relative select2-container ${className}`}
      ref={dropdownRef}
      style={{ minWidth: '180px' }}
    >
      {/* Selected Box / Toggle */}
      <div
        className={`form-select d-flex align-items-center justify-content-between text-start cursor-pointer ${disabled ? 'disabled bg-light text-muted' : 'bg-white'} ${isOpen ? 'border-primary shadow-sm' : ''}`}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          paddingRight: '0.75rem',
          minHeight: '38px',
          borderColor: isOpen ? '#2563eb' : '#cbd5e1'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
      >
        <div className="text-truncate pe-2 flex-grow-1">
          {selectedOption ? (
            <span className="fw-medium text-dark d-flex align-items-center gap-1">
              <span className="text-truncate">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="badge bg-secondary-subtle text-secondary border px-1 py-0 small" style={{ fontSize: '0.65rem' }}>
                  {selectedOption.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
        </div>

        <div className="d-flex align-items-center gap-1 text-muted">
          {showClear && selectedOption && !disabled && (
            <button
              type="button"
              className="btn btn-sm btn-link p-0 text-muted text-decoration-none"
              style={{ lineHeight: 1, fontSize: '0.9rem' }}
              onClick={handleClear}
              title="Clear selection"
            >
              ✕
            </button>
          )}
          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          className="position-absolute start-0 end-0 bg-white border border-primary rounded-bottom shadow-lg mt-1"
          style={{
            zIndex: 1050,
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Search Box */}
          <div className="p-2 border-bottom bg-light">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                className="form-control border-start-0 ps-1"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightIndex(0);
                }}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            className="overflow-auto flex-grow-1"
            style={{ maxHeight: '250px' }}
          >
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-muted small fst-italic">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === String(value);
                const isHighlighted = idx === highlightIndex;
                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    className={`px-3 py-2 cursor-pointer border-bottom-0 d-flex align-items-center justify-content-between ${
                      isSelected
                        ? 'bg-primary-subtle text-primary fw-semibold'
                        : isHighlighted
                        ? 'bg-light text-dark'
                        : 'text-dark'
                    }`}
                    style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    <div className="text-truncate me-2">
                      <div className="text-truncate">{opt.label}</div>
                      {opt.subtext && (
                        <div className="text-muted small text-truncate" style={{ fontSize: '0.75rem' }}>
                          {opt.subtext}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <span className="text-primary small fw-bold">✓</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
