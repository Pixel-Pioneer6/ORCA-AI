// Real client-side file download helpers — FR-3.4/US-06 requires an actual
// downloadable CSV, not a toast claiming one was generated.

export function rowsToCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

export function downloadBlob(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsv(rows, filename) {
  downloadBlob(rowsToCsv(rows), filename, 'text/csv;charset=utf-8');
}

export function downloadJson(obj, filename) {
  downloadBlob(JSON.stringify(obj, null, 2), filename, 'application/json');
}
