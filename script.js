let rawData = [];
let chart;

function toggleNav() {
  document.querySelector('.nav').classList.toggle('open');
}

fetch('https://raw.githubusercontent.com/netshort-at/netshort/main/fma_test.csv')
  .then(res => res.text())
  .then(text => {
    const rows = text.trim().split('\n').slice(1);
    rawData = rows.map(r => {
      const [date, issuer, holder, position] = r.split(',');
      return {
        date,
        issuer,
        holder,
        position: parseFloat(position)
      };
    });
    render();
  });

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
    tr.innerHTML = `<td>${d.date}</td><td>${d.issuer}</td><td>${d.holder}</td><td>${d.position.toFixed(2)}</td>`;
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
        label: 'Netto-Short-Position (%)',
        data: sorted.map(d => d.position),
        borderColor: '#111',
        backgroundColor: 'rgba(0,0,0,0.05)',
        tension: 0.2,
        pointRadius: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: '#555' }
        },
        y: {
          ticks: { color: '#555' }
        }
      }
    }
  });
}

document.getElementById('issuerFilter').addEventListener('input', render);
document.getElementById('holderFilter').addEventListener('input', render);

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
