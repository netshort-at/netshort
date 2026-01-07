// Farben für Institutionen
const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];

async function loadCSV() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/netshort-at/netshort/main/fma_test.csv');
    if (!res.ok) throw new Error('CSV konnte nicht geladen werden');
    const csvText = await res.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const dataRows = lines.slice(1).map(l => l.split(','));

    const table = document.getElementById('shortTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Tabelle Header
    const headerRow = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Filter-Optionen sammeln
    const companySet = new Set();
    const holderSet = new Set();

    // Tabelle füllen
    dataRows.forEach(cols => {
      if (parseFloat(cols[4]) < 0.2) return; // Filter 0,2%
      const tr = document.createElement('tr');
      cols.forEach(c => {
        const td = document.createElement('td');
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
      companySet.add(cols[2]);
      holderSet.add(cols[3]);
    });

    // Filteroptionen füllen
    const companyFilter = document.getElementById('companyFilter');
    companySet.forEach(c => companyFilter.appendChild(new Option(c, c)));
    const holderFilter = document.getElementById('holderFilter');
    holderSet.forEach(h => holderFilter.appendChild(new Option(h, h)));

    // Chart vorbereiten
    const chartData = {};
    dataRows.forEach(cols => {
      const date = cols[0];
      const company = cols[2];
      const holder = cols[3];
      const percent = parseFloat(cols[4]);
      if (!chartData[company]) chartData[company] = {};
      if (!chartData[company][holder]) chartData[company][holder] = [];
      chartData[company][holder].push({ x: date, y: percent });
    });

    // Chart.js
    const ctx = document.getElementById('shortChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [...new Set(dataRows.map(r => r[0]))],
        datasets: Object.keys(chartData['Example AG'] || {}).map((holder, i) => ({
          label: holder,
          data: chartData['Example AG'][holder]?.map(d => d.y) || [],
          backgroundColor: colors[i % colors.length]
        }))
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { stacked: true },
          y: { stacked: true, title: { display: true, text: 'Netto-Short (%)' } }
        }
      }
    });

    console.log('CSV + Chart geladen!');
  } catch (err) {
    console.error(err);
  }
}

// Start
loadCSV();
