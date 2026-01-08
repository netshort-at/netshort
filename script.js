let rawData = [];
let chart;

fetch('https://raw.githubusercontent.com/netshort-at/netshort/main/fma_test.csv')
  .then(r => r.text())
  .then(parseCSV);

function parseCSV(text) {
  const lines = text.trim().split('\n');
  rawData = lines.slice(1).map(l => {
    const c = l.split(',');
    return {
      holder: c[0],
      issuer: c[1],
      isin: c[2],
      date: new Date(c[3]),
      percent: parseFloat(c[4]),
      report: c[5],
      cancel: c[6]
    };
  }).filter(d => d.percent >= 0.2);

  initFilters();
  render();
}

function initFilters() {
  [...new Set(rawData.map(d => d.issuer))]
    .forEach(v => companyFilter.add(new Option(v, v)));

  [...new Set(rawData.map(d => d.holder))]
    .forEach(v => holderFilter.add(new Option(v, v)));

  companyFilter.onchange = holderFilter.onchange = render;
  downloadCsv.onclick = downloadFilteredCSV;
}

function render() {
  const c = companyFilter.value;
  const h = holderFilter.value;

  const data = rawData
    .filter(d => (c === 'all' || d.issuer === c) &&
                 (h === 'all' || d.holder === h))
    .sort((a, b) => a.date - b.date);

  renderTable(data);
  renderMetrics(data);
  renderChart(data);
}

function renderTable(data) {
  shortTable.tHead.innerHTML = `
    <tr>
      <th>Institution</th><th>Aktie</th><th>ISIN</th>
      <th>Datum</th><th>%</th><th>Meldedatum</th><th>Cancellation</th>
    </tr>`;

  shortTable.tBodies[0].innerHTML = data.map(d => `
    <tr>
      <td>${d.holder}</td>
      <td>${d.issuer}</td>
      <td>${d.isin}</td>
      <td>${d.date.toISOString().slice(0,10)}</td>
      <td>${d.percent}</td>
      <td>${d.report}</td>
      <td>${d.cancel || ''}</td>
    </tr>
  `).join('');
}

function renderMetrics(data) {
  if (!data.length) return;

  const values = data.map(d => d.percent);
  currentVal.textContent = values.at(-1).toFixed(2) + '%';
  maxVal.textContent = Math.max(...values).toFixed(2) + '%';
  minVal.textContent = Math.min(...values).toFixed(2) + '%';
  trendVal.textContent =
    values.at(-1) > values[0] ? 'steigend' :
    values.at(-1) < values[0] ? 'fallend' : 'seitwärts';
}

function renderChart(data) {
  if (chart) chart.destroy();

  chart = new Chart(shortChart, {
    type: 'line',
    data: {
      datasets: [{
        label: 'Netto-Short (%)',
        data: data.map(d => ({ x: d.date, y: d.percent })),
        borderColor: '#3366cc',
        tension: 0.2
      }]
    },
    options: {
      parsing: false,
      scales: {
        x: { type: 'time', time: { unit: 'month' } },
        y: { title: { display: true, text: '%' } }
      }
    }
  });
}

function downloadFilteredCSV() {
  const rows = [['Institution','Aktie','ISIN','Datum','%']];
  document.querySelectorAll('#shortTable tbody tr').forEach(tr => {
    rows.push([...tr.children].map(td => td.textContent));
  });

  const blob = new Blob([rows.map(r => r.join(',')).join('\n')]);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'netshort_filtered.csv';
  a.click();
}
