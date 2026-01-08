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
    // Filter-Datenstrukturen
    // -----------------------------
    const companyMap = new Map(); // ISIN -> Issuer
    const holderSet = new Set();

    // -----------------------------
    // Tabelle füllen
    // -----------------------------
    dataRows.forEach(cols => {
      const netShort = parseFloat(cols[4]);
      if (netShort < 0.2) return; // Schwellenfilter 0,2 %

      const tr = document.createElement('tr');
      cols.forEach(c => {
        const td = document.createElement('td');
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);

      const issuer = cols[1]; // Firmenname
      const isin = cols[2];   // ISIN
      const holder = cols[3];

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
      const option = new Option(`${issuer} (${isin})`, isin);
      companyFilter.appendChild(option);
    });

    // -----------------------------
    // Institutionsfilter
    // -----------------------------
    const holderFilter = document.getElementById('holderFilter');
    holderSet.forEach(h => {
      holderFilter.appendChild(new Option(h, h));
    });

    // -----------------------------
    // Chart vorbereiten (noch statisch)
    // -----------------------------
    const chartData = {};
    dataRows.forEach(cols => {
      const date = cols[0];
      const issuer = cols[1];
      const holder = cols[3];
      const percent = parseFloat(cols[4]);

      if (!chartData[issuer]) chartData[issuer] = {};
      if (!chartData[issuer][holder]) chartData[issuer][holder] = [];
      chartData[issuer][holder].push({ x: date, y: percent });
    });

    const exampleCompany = Object.keys(chartData)[0];

    const ctx = document.getElementById('shortChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [...new Set(dataRows.map(r => r[0]))],
        datasets: Object.keys(chartData[exampleCompany] || {}).map((holder, i) => ({
          label: holder,
          data: chartData[exampleCompany][holder].map(d => d.y),
          backgroundColor: colors[i % colors.length]
        }))
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            title: { display: true, text: 'Netto-Short (%)' }
          }
        }
      }
    });

    console.log('CSV geladen – Aktienfilter mit Firmenname + ISIN aktiv');
  } catch (err) {
    console.error(err);
  }
}

// Start
loadCSV();
