const csvText = `date,isin,company,holder,position_percent,position_type,cancellation_date
2026-01-06,AT0000XXXX,Example AG,BlackRock,1.23,net,
2026-01-05,AT0000XXXX,Example AG,Vanguard,0.45,net,
2026-01-04,AT0000XXXX,Example AG,BlackRock,1.18,net,
2026-01-03,AT0000XXXX,Example AG,State Street,0.62,net,`;

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
