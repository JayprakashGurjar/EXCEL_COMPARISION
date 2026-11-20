const fs = require('fs');
const path = require('path');

const outputPath = path.resolve(__dirname, 'src/react/App.js');

// Try to locate babel core from standard node_modules or relative local fallback
let babel = null;
let babelPreset = null;

try {
  babel = require('@babel/core');
} catch (e) {
  const localFallbacks = [
    path.resolve(__dirname, '../newReactApp/online-booking/node_modules/@babel/core')
  ];
  for (const p of localFallbacks) {
    if (fs.existsSync(p)) {
      try {
        babel = require(p);
        break;
      } catch (err) {}
    }
  }
}

try {
  babelPreset = require('@babel/preset-react');
} catch (e) {
  const localFallbacks = [
    path.resolve(__dirname, '../newReactApp/online-booking/node_modules/@babel/preset-react')
  ];
  for (const p of localFallbacks) {
    if (fs.existsSync(p)) {
      try {
        babelPreset = require(p);
        break;
      } catch (err) {}
    }
  }
}

// If babel is not installed in the environment (e.g. Vercel CI build)
if (!babel || !babelPreset) {
  if (fs.existsSync(outputPath)) {
    console.log('Notice: @babel/core not installed in build environment.');
    console.log(`Using existing pre-compiled production bundle: src/react/App.js (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB).`);
    console.log('Build successful!');
    process.exit(0);
  } else {
    console.error('Error: @babel/core or @babel/preset-react is required to compile src/react/App.js.');
    process.exit(1);
  }
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

const header = `
const { useState, useEffect, useRef, useMemo, useCallback } = React;
`;

const combinedSource = header + componentOrder.map(filePath => {
  const fullPath = path.resolve(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  let code = fs.readFileSync(fullPath, 'utf8');
  code = code.replace(/const\s*\{[^}]*\}\s*=\s*React;\r?\n?/g, '');
  return `// --- File: ${filePath} ---\n${code}\n`;
}).join('\n');

const result = babel.transformSync(combinedSource, {
  presets: [
    [babelPreset, { runtime: 'classic' }]
  ]
});

fs.writeFileSync(outputPath, result.code, 'utf8');
console.log(`Successfully compiled ${componentOrder.length} modular components into ${outputPath} (${(result.code.length / 1024).toFixed(1)} KB)`);
