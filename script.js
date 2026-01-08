const COLORS = [
  '#4e79a7','#f28e2b','#e15759','#76b7b2',
  '#59a14f','#edc948','#b07aa1'
];

let chart;

async function loadCSV() {
  const res = await fetch(
    'https://raw.githubusercontent.com/netshort-at/netshort/main/fma_test.csv'
  );
  const text = await res.text();

  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map(l => l.split(','));

  const tableHead = document.querySelector('#shortTable thead');
  const tableBody = document.querySelector('#shortTable tbody');

  tableHead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';

  const companySet = new Set();
  const holderSet = new Set();

  rows.forEach(r => {
    if (parseFloat(r[4]) >= 0.2) {
      companySet.add(r[2]);
      holderSet.add(r[0]);
    }
  });

  fillSelect('companyFilter', companySet);
  fillSelect('holderFilter', holderSet);

  document.getElementById('companyFilter').onchange = applyFilters;
  document.getElementById('holderFilter').onchange = applyFilters;

  function applyFilters() {
    const company = companyFilter.value;
    const holder = holderFilter.value;

    const filtered = rows.filter(r =>
      parseFloat(r[4]) >= 0.2 &&
      (company === 'all' || r[2] === company) &&
      (holder === 'all' || r[0] === holder)
    );

    tableBody.innerHTML = filtered.map(r =>
      `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`
    ).join('');

    renderChart(filtered, company);
  }

  applyFilters();
}

function fillSelect(id, values) {
  const sel = document.getElementById(id);
  [...values].sort().forEach(v => sel.add(new Option(v, v)));
}

function renderChart(rows, company) {
  if (chart) chart.destroy();

  const dataByDate = {};
  rows.forEach(r => {
    if (company !== 'all' && r[2] !== company) return;
    const date = r[3];
    dataByDate[date] = (dataByDate[date] || 0) + parseFloat(r[4]);
  });

  chart = new Chart(
    document.getElementById('shortChart'),
    {
      type: 'line',
      data: {
        labels: Object.keys(dataByDate),
        datasets: [{
          label: 'Gesamt-Netto-Short (%)',
          data: Object.values(dataByDate),
          borderColor: '#111',
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { title: { display: true, text: '%' } }
        }
      }
    }
  );
}

loadCSV();
