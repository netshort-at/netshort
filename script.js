let rawData = [];
let chart;

/* Responsive Navigation */
function toggleNav() {
  document.querySelector('.nav').classList.toggle('open');
}

/* Load historical CSV */
fetch('https://raw.githubusercontent.com/netshort-at/netshort/main/fma_historical.csv')
  .then(res => res.text())
  .then(text => parseCSV(text));

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const header = lines[0].split(',');

  // Header mapping (robust & professionell)
  const map = {};
  header.forEach((h, i) => map[h.trim()] = i);

  rawData = lines.slice(1).map(line => {
    const cols = line.split(',');

    return {
      holder: cols[map["Position Holder"]],
      issuer: cols[map["Issuer"]],
      isin: cols[map["ISIN"]],
      date: cols[map["Date"]],
      position: parseFloat(cols[map["Net Short Position (%)"]])
    };
  }).filter(d => !isNaN(d.position));

  render();
}

function render() {
  const issuerFilter = document.getElementById('issuerFilter').value.toLowerCase();
  const holderFilter = document.getElementById('holderFilter').value.toLowerCase();

  const filtered = rawData.filter(d =>
    d.position >= 0.2 &&
    d.issuer.toLowerCase().includes(issuerFilter) &&
    d.holder.toLowerCase().includes(holderFilter)
  );

  renderTable(filtered);
  renderChart(filtered);
}

function renderTable(data) {
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = '';

  data.forEach(d => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.date}</td>
      <td>${d.issuer}</td>
      <td>${d.holder}</td>
      <td>${d.position.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderChart(data) {
  const ctx = document.getElementById('shortChart').getContext('2d');

  // Zeitlich korrekt sortieren
  const sorted = data.slice().sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sorted.map(d => d.date),
      datasets: [{
        label: 'Netto-Short-Position (%)',
        data: sorted.map(d => d.position),
        borderColor: '#1f2933',
        backgroundColor: 'rgba(31,41,51,0.08)',
        tension: 0.25,
        pointRadius: 1.8
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#4b5563' } },
        y: { ticks: { color: '#4b5563' } }
      }
    }
  });
}

document.getElementById('issuerFilter').addEventListener('input', render);
document.getElementById('holderFilter').addEventListener('input', render);

/* CSV Export der gefilterten Tabelle */
function downloadCSV() {
  const rows = [['Datum','Aktie','Institution','Position (%)']];
  document.querySelectorAll('#dataTable tbody tr').forEach(tr => {
    rows.push([...tr.children].map(td => td.textContent));
  });

  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'netshort_filtered.csv';
  a.click();
}
