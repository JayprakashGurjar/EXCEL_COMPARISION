/* Value normalisation + equality. Pure functions, no DOM, no Excel dependency. */
(function (g) {
  const ECT = (g.ECT = g.ECT || {});
  const NUM = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
  const LEAD0 = /^[+-]?0\d+/; // "007" or "0123" is text ID, never coerced to number

  function normalize(v, o) {
    o = o || {};
    if (v == null) return '';
    if (v instanceof Date) {
      if (isNaN(v.getTime())) return '';
      const iso = v.toISOString();
      return iso.slice(11, 16) === '00:00' ? iso.slice(0, 10) : iso.slice(0, 16);
    }
    if (typeof v === 'number') {
      if (isNaN(v)) return '';
      return String(v);
    }
    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';

    // Replace non-breaking spaces, tabs, newlines with single space
    let s = String(v).replace(/[\u00A0\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (o.ignoreCase) s = s.toLowerCase();
    return s;
  }

  const isBlank = (v) => normalize(v) === '';

  function equal(a, b, o) {
    o = o || {};
    const x = normalize(a, o);
    const y = normalize(b, o);
    if (x === y) return true;

    // Numeric comparison with tolerance
    if (NUM.test(x) && NUM.test(y) && !LEAD0.test(x) && !LEAD0.test(y)) {
      const nx = parseFloat(x);
      const ny = parseFloat(y);
      if (!isNaN(nx) && !isNaN(ny)) {
        return Math.abs(nx - ny) <= (o.tolerance || 0);
      }
    }

    // Date comparison tolerance (e.g. if one is ISO and one is standard format)
    const dx = Date.parse(x);
    const dy = Date.parse(y);
    if (!isNaN(dx) && !isNaN(dy) && x.length >= 8 && y.length >= 8) {
      // Both are valid dates
      const dtA = new Date(dx);
      const dtB = new Date(dy);
      if (dtA.toISOString().slice(0, 10) === dtB.toISOString().slice(0, 10)) {
        return true;
      }
    }

    return false;
  }

  ECT.normalize = normalize;
  ECT.isBlank = isBlank;
  ECT.equal = equal;
})(typeof window !== 'undefined' ? window : globalThis);
