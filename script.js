// Farben für Institutionen
const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];

// Rohdaten global speichern
let rawData = [];

// Globaler Chart
let shortChart = null;

async function loadCSV() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/netshort-at/netshort/main/fma_test.csv');
    if (!res.ok) throw new Error('CSV konnte nicht geladen werden');

    const csvText = await res.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const dataRows = lines.slice(1).map(l => l.split(','));

    rawData = dataRows;

    const table = document.getElementById('shortTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // -----------------------------
    // Tabellenkopf
    // -----------------------------
    const headerRow = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // -----------------------------
    // Filter-Daten sammeln
    // -----------------------------
    const companyMap = new Map(); // ISIN -> Issuer
    const holderSet = new Set();

    dataRows.forEach(cols => {
      const issuer = cols[1];
      const isin = cols[2];
      const holder = cols[3];
      const netShort = parseFloat(cols[4]);

      if (netShort < 0.2) return;

      if (!companyMap.has(isin)) {
        companyMap.set(isin, issuer);
      }
      holderSet.add(holder);
    });

    // -----------------------------
    // Aktienfilter (Firmenname + ISIN)
    // -----------------------------
    const companyFilter = document.getElementById('companyFilter');
    companyMap.forEach((issuer, isin) => {
      companyFilter.appendChild(
        new Option(`${issuer} (${isin})`, isin)
      );
    });

    // -----------------------------
    // Institutionsfilter
    // -----------------------------
    const holderFilter = document.getElementById('holderFilter');
    holderSet.forEach(h => {
      holderFilter.appendChild(new Option(h, h));
    });

    // -----------------------------
    // Initiale Tabelle
    // -----------------------------
    renderTable(rawData);

    // -----------------------------
    // Filter aktivieren
    // -----------------------------
    companyFilter.addEventListener('change', applyFilters);
    holderFilter.addEventListener('change', applyFilters);

    // -----------------------------
    // Initialer Chart (erste Aktie)
    // -----------------------------
    const firstISIN = companyFilter.value;
    if (firstISIN !== 'all') renderChart(firstISIN);

    console.log('CSV geladen – Live-Filter + dynamischer Chart aktiv');
  } catch (err) {
    console.error(err);
  }
}

// ---------------------------------
// Tabelle rendern
// ---------------------------------
function renderTable(data) {
  const tbody = document
    .getElementById('shortTable')
    .querySelector('tbody');

  tbody.innerHTML = '';

  data.forEach(cols => {
    const netShort = parseFloat(cols[4]);
    if (netShort < 0.2) return;

    const tr = document.createElement('tr');
    cols.forEach(c => {
      const td = document.createElement('td');
      td.textContent = c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// ---------------------------------
// Filter anwenden
// ---------------------------------
function applyFilters() {
  const companyValue = document.getElementById('companyFilter').value;
  const holderValue = document.getElementById('holderFilter').value;

  const filtered = rawData.filter(cols => {
    const isin = cols[2];
    const holder = cols[3];

    const companyMatch = companyValue === 'all' || isin === companyValue;
    const holderMatch = holderValue === 'all' || holder === holderValue;

    return companyMatch && holderMatch;
  });

  renderTable(filtered);

  // Chart nur aktualisieren, wenn eine Aktie ausgewählt wurde
  if (companyValue !== 'all') {
    renderChart(companyValue);
  }
}

// ---------------------------------
// Dynamischer Chart
// ---------------------------------
function renderChart(selectedISIN) {
  // Filter für die aktuelle Aktie
  const filtered = rawData.filter(cols => {
    const isin = cols[2];
    return isin === selectedISIN && parseFloat(cols[4]) >= 0.2;
  });

  // Daten pro Institution vorbereiten
  const chartData = {};
  filtered.forEach(cols => {
    const date = cols[0];
    const holder = cols[3];
    const percent = parseFloat(cols[4]);

    if (!chartData[holder]) chartData[holder] = [];
    chartData[holder].push({ x: date, y: percent });
  });

  const ctx = document.getElementById('shortChart').getContext('2d');

  // Wenn Chart existiert, zuerst zerstören
  if (shortChart) shortChart.destroy();

  // Neue Datasets bauen
  const datasets = Object.keys(chartData).map((holder, i) => ({
    label: holder,
    data: chartData[holder].map(d => d.y),
    backgroundColor: colors[i % colors.length]
  }));

  const labels = [...new Set(filtered.map(r => r[0]))].sort();

  shortChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            label: function(context) {
              const holder = context.dataset.label;
              const value = context.raw;
              const date = context.label;
              return `${holder}: ${value}% (${date})`;
            }
          }
        }
      },
      scales: {
        x: { stacked: true },
        y: { stacked: true, title: { display: true, text: 'Netto-Short (%)' } }
      }
    }
  });
}

// Start
loadCSV();
