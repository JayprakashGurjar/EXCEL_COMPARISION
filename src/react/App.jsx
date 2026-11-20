const { useState, useEffect, useCallback } = React;

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
    setAlertMsg({ text, type });
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
      setFileA(prev => ({ ...prev, ...reParsed }));
      setPrimaryKeyA(reParsed.headers[0] || '');
    } else {
      setSelectedSheetB(sheetName);
      setFileB(prev => ({ ...prev, ...reParsed }));
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
      setFileA(prev => ({ ...prev, ...reParsed, detectedHeaderRow: newRow }));
      setPrimaryKeyA(reParsed.headers[0] || '');
    } else {
      setHeaderRowB(newRow);
      setFileB(prev => ({ ...prev, ...reParsed, detectedHeaderRow: newRow }));
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
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Composite Key helpers
  const handleAddCompositeKey = () => {
    setCompositeKeys(prev => [...prev, { colA: fileA?.headers[0] || '', colB: fileB?.headers[0] || '' }]);
  };

  const handleRemoveCompositeKey = (index) => {
    setCompositeKeys(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompositeKeyChange = (index, field, value) => {
    setCompositeKeys(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
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

        const result = engine.compareFiles(
          fileA.data,
          fileB.data,
          fullKeyConfig,
          validMappings
        );

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

  return (
    <div className="container-fluid py-4 px-lg-5" style={{ maxWidth: '1440px', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Brand Header (React + MUI + Bootstrap badge removed) */}
      <Navbar onReset={handleReset} />

      {/* Alert Notification Toast */}
      {alertMsg && (
        <div className={`alert alert-${alertMsg.type} alert-dismissible fade show shadow-sm py-2 px-3 small mb-3`} role="alert">
          <strong>{alertMsg.type === 'danger' ? 'Error: ' : alertMsg.type === 'success' ? 'Success: ' : 'Notice: '}</strong>
          {alertMsg.text}
          <button type="button" className="btn-close py-2" onClick={() => setAlertMsg(null)} aria-label="Close"></button>
        </div>
      )}

      {/* 3-Step Navigation Tabs (Tabs 4 & 5 removed) */}
      <TabNavigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        canGoToMapping={canGoToMapping}
        canGoToDiffs={canGoToDiffs}
      />

      {/* Tab 1: File Upload & Sheets */}
      {activeTab === 'upload' && (
        <Tab1Upload
          fileA={fileA}
          fileB={fileB}
          onFileUpload={handleFileUpload}
          sheetsA={sheetsA}
          sheetsB={sheetsB}
          selectedSheetA={selectedSheetA}
          selectedSheetB={selectedSheetB}
          onSheetChange={handleSheetChange}
          headerRowA={headerRowA}
          headerRowB={headerRowB}
          onHeaderRowChange={handleHeaderRowChange}
          onNext={() => setActiveTab('mapping')}
          canProceed={canGoToMapping}
        />
      )}

      {/* Tab 2: Column Mapping & Keys */}
      {activeTab === 'mapping' && (
        <Tab2Mapping
          fileA={fileA}
          fileB={fileB}
          primaryKeyA={primaryKeyA}
          primaryKeyB={primaryKeyB}
          onPrimaryKeyAChange={setPrimaryKeyA}
          onPrimaryKeyBChange={setPrimaryKeyB}
          compositeKeys={compositeKeys}
          onAddCompositeKey={handleAddCompositeKey}
          onRemoveCompositeKey={handleRemoveCompositeKey}
          onCompositeKeyChange={handleCompositeKeyChange}
          columnMappings={columnMappings}
          onMappingChange={handleMappingChange}
          onAutoMap={runAutoMap}
          onCompare={handleRunComparison}
          onBack={() => setActiveTab('upload')}
          isComparing={isComparing}
        />
      )}

      {/* Tab 3: Visual Differences & Results (In-place metrics & all views) */}
      {activeTab === 'diffs' && (
        <Tab3Diffs
          comparisonResult={comparisonResult}
          columnMappings={columnMappings}
          onBackToMapping={() => setActiveTab('mapping')}
          onInspectAmbiguous={(item) => setInspectingAmbiguous(item)}
          onExportAll={handleExportAll}
          onExportDiffs={handleExportDiffs}
        />
      )}

      {/* Inspect Ambiguous Duplicate Rows Modal */}
      {inspectingAmbiguous && (
        <InspectModal
          item={inspectingAmbiguous}
          onClose={() => setInspectingAmbiguous(null)}
          onGoToMapping={() => {
            setInspectingAmbiguous(null);
            setActiveTab('mapping');
          }}
        />
      )}
    </div>
  );
}

// Mount to DOM
const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App />);
}
