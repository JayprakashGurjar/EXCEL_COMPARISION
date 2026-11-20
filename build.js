const fs = require('fs');
const path = require('path');

// Locate babel core
let babel;
try {
  babel = require('@babel/core');
} catch (e) {
  babel = require('D:/Singaji-Code-Masters-main/newReactApp/online-booking/node_modules/@babel/core');
}

const componentOrder = [
  'src/react/components/SearchableSelect2.jsx',
  'src/react/components/Navbar.jsx',
  'src/react/components/TabNavigation.jsx',
  'src/react/components/InspectModal.jsx',
  'src/react/components/Tab1Upload.jsx',
  'src/react/components/Tab2Mapping.jsx',
  'src/react/components/Tab3Diffs.jsx',
  'src/react/App.jsx'
];

console.log('Compiling modular components...');

// Global React hooks declared once
const header = `
const { useState, useEffect, useRef, useMemo, useCallback } = React;
`;

const combinedSource = header + componentOrder.map(filePath => {
  const fullPath = path.resolve(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  let code = fs.readFileSync(fullPath, 'utf8');
  // Strip duplicate const { ... } = React; lines
  code = code.replace(/const\s*\{[^}]*\}\s*=\s*React;\r?\n?/g, '');
  return `// --- File: ${filePath} ---\n${code}\n`;
}).join('\n');

const babelPreset = path.resolve('D:/Singaji-Code-Masters-main/newReactApp/online-booking/node_modules/@babel/preset-react');

const result = babel.transformSync(combinedSource, {
  presets: [
    [babelPreset, { runtime: 'classic' }]
  ]
});

const outputPath = path.resolve(__dirname, 'src/react/App.js');
fs.writeFileSync(outputPath, result.code, 'utf8');

console.log(`Successfully compiled ${componentOrder.length} modular components into ${outputPath} (${(result.code.length / 1024).toFixed(1)} KB)`);
