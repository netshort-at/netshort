fetch('fma_test.csv')
  .then(response => response.text())
  .then(csvText => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const rows = lines.slice(1);

    const thead = document.querySelector('#shortTable thead');
    const tbody = document.querySelector('#shortTable tbody');

    // Tabellenkopf
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Tabellenzeilen
    rows.forEach(line => {
      const cols = line.split(',');
      const tr = document.createElement('tr');

      cols.forEach(col => {
        const td = document.createElement('td');
        td.textContent = col;
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  })
  .catch(err => {
    console.error('CSV konnte nicht geladen werden:', err);
  });
