let rawData = [];
let chart;

/* Filters */
document.getElementById('issuerFilter').addEventListener('input', render);
document.getElementById('holderFilter').addEventListener('input', render);

/* CSV Export */
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

/* Load historical CSV */
fetch('fma_historical.csv')
  .then(res => res.text())
  .then(csv => parseCSV(csv));

function parseCSV(csv) {
  Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      rawData = results.data
        .map(row => ({
          date: row["Date"]?.trim(),
          issuer: row["Issuer"]?.trim(),
          holder: row["Position Holder"]?.trim(),
          position: parseFloat(row["Net Short Position (%)"])
        }))
        .filter(d =>
          d.date && d.issuer && d.holder && !isNaN(d.position)
        );
      render();
    }
  });
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
  const sorted = data.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sorted.map(d => d.date),
      datasets: [{
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
