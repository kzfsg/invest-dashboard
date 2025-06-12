interface TableRow {
  series: string;
  values: number[];
}

export const parseTableData = (html: string): TableRow[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  const rows: TableRow[] = [];

  if (!table) return [];

  const rowElements = Array.from(table.querySelectorAll('tbody tr'));

  rowElements.forEach(row => {
    const cells = Array.from(row.querySelectorAll('th, td'));
    if (cells.length > 0) {
      const series = cells[0].textContent?.trim() || '';
      const values = cells.slice(1).map(cell => {
        const value = cell.textContent?.trim() || '0';
        return parseFloat(value) || 0;
      });
      rows.push({ series, values });
    }
  });

  return rows;
};
