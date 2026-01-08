let allData = [];
let chart;

const colors = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f','#edc949'];

fetch('https://raw.githubusercontent.com/netshort-at/netshort/main/fma_test.csv')
  .then(r => r.text())
  .then(parseCSV);

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  allData = lines.slice(1).map(l => {
    const c = l.split(',');
    return {
      holder: c[0],
      issuer: c[1],
      isin: c[2],
      date: c[3],
      percent: parseFloat(c[4]),
      report: c[5],
      cancel: c[6]
    };
  }).filter(d => d.percent >= 0.2);

  initFilters();
  render();
}

function initFilters() {
  const companySet = [...new Set(allData.map(d => d.issuer))];
  const holderSet = [...new Set(allData.map(d => d.holder))];

  companySet.forEach(c => companyFilter.add(new Option(c, c)));
  holderSet.forEach(h => holderFilter.add(new Option(h, h)));

  companyFilter.onchange = holderFilter.onchange = render;
}

function render() {
  const c = companyFilter.value;
  const h = holderFilter.value;

  const data = allData.filter(d =>
    (c === 'all' || d.issuer === c) &&
    (h === 'all' || d.holder === h)
  );

  renderTable(data);
  renderChart(data);
}

function renderTable(data) {
  const thead = shortTable.querySelector('thead');
  const tbody = shortTable.querySelector('tbody');
  thead.innerHTML = `
    <tr>
      <th>Institution</th><th>Aktie</th><th>ISIN</th>
      <th>Datum</th><th>Netto-Short (%)</th>
      <th>Meldedatum</th><th>Cancellation</th>
    </tr>`;
  tbody.innerHTML = '';

  data.forEach(d => {
    tbody.innerHTML += `
      <tr>
        <td>${d.holder}</td>
        <td>${d.issuer}</td>
        <td>${d.isin}</td>
        <td>${d.date}</td>
        <td>${d.percent}</td>
        <td>${d.report}</td>
        <td>${d.cancel || ''}</td>
      </tr>`;
  });
}

function renderChart(data) {
  const ctx = document.getElementById('shortChart');

  if (chart) chart.destroy();

  const grouped = {};
  data.forEach(d => {
    if (!grouped[d.holder]) grouped[d.holder] = [];
    grouped[d.holder].push({ x: d.date, y: d.percent });
  });

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: Object.keys(grouped).map((h, i) => ({
        label: h,
        data: grouped[h],
        borderColor: colors[i % colors.length],
        tension: 0.2
      }))
    },
    options: {
      responsive: true,
      parsing: false,
      scales: {
        x: { type: 'time', time: { unit: 'month' } },
        y: { title: { display: true, text: 'Netto-Short (%)' } }
      }
    }
  });
}
