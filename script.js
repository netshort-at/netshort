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

    // Filter Sets
    const companySet = new Set();
    const holderSet = new Set();

    // Tabelle füllen + Filter Sets
    dataRows.forEach(cols => {
      if (parseFloat(cols[4]) < 0.2) return;
      const tr = document.createElement('tr');
      cols.forEach(c => {
        const td = document.createElement('td');
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
      companySet.add(cols[2]); // Issuer
      holderSet.add(cols[1]);  // Holder
    });

    // Filteroptionen füllen
    const companyFilter = document.getElementById('companyFilter');
    companySet.forEach(c => companyFilter.appendChild(new Option(c, c)));
    const holderFilter = document.getElementById('holderFilter');
    holderSet.forEach(h => holderFilter.appendChild(new Option(h, h)));

    // Event-Listener für Filter
    companyFilter.addEventListener('change', applyFilters);
    holderFilter.addEventListener('change', applyFilters);

    // Chart vorbereiten
    let chart;
    function renderChart(filteredRows) {
      const chartData = {};
      filteredRows.forEach(cols => {
        const date = cols[0];
        const company = cols[2];
        const holder = cols[1];
        const percent = parseFloat(cols[4]);
        if (!chartData[company]) chartData[company] = {};
        if (!chartData[company][holder]) chartData[company][holder] = [];
        chartData[company][holder].push({ x: date, y: percent });
      });

      const selectedCompany = companyFilter.value === 'all' ? [...companySet][0] : companyFilter.value;
      const datasets = Object.keys(chartData[selectedCompany] || {}).map((holder, i) => ({
        label: holder,
        data: chartData[selectedCompany][holder].map(d => ({x: d.x, y: d.y})),
        backgroundColor: colors[i % colors.length],
        type: 'bar',
        stack: 'stack1'
      }));

      const totalDataset = {
        label: 'Gesamtposition',
        data: Object.keys(chartData[selectedCompany] || {}).map(holder =>
          chartData[selectedCompany][holder].map(d => ({x: d.x, y: d.y}))
        ).flat().reduce((acc, val) => {
          const existing = acc.find(e => e.x === val.x);
          if (existing) existing.y += val.y; else acc.push({x: val.x, y: val.y});
          return acc;
        }, []),
        borderColor: '#1a1f36',
        type: 'line',
        fill: false,
        tension: 0.3
      };

      if(chart) chart.destroy();
      const ctx = document.getElementById('shortChart').getContext('2d');
      chart = new Chart(ctx, {
        data: {
          datasets: [...datasets, totalDataset]
        },
        options: {
          responsive: true,
          parsing: {
            xAxisKey: 'x',
            yAxisKey: 'y'
          },
          scales: {
            x: {
              type: 'time',
              time: { parser: 'YYYY-MM-DD', tooltipFormat: 'll', unit: 'month' },
              title: { display: true, text: 'Datum' }
            },
            y: {
              stacked: true,
              title: { display: true, text: 'Netto-Short (%)' }
            }
          },
          plugins: { legend: { position: 'top' } }
        }
      });
    }

    function applyFilters() {
      const companyVal = companyFilter.value;
      const holderVal = holderFilter.value;
      const filtered = dataRows.filter(cols => {
        if (parseFloat(cols[4]) < 0.2) return false;
        if (companyVal !== 'all' && cols[2] !== companyVal) return false;
        if (holderVal !== 'all' && cols[1] !== holderVal) return false;
        return true;
      });
      tbody.innerHTML = '';
      filtered.forEach(cols => {
        const tr = document.createElement('tr');
        cols.forEach(c => { const td = document.createElement('td'); td.textContent = c; tr.appendChild(td); });
        tbody.appendChild(tr);
      });
      renderChart(filtered);
    }

    // Initial Render
    applyFilters();

    console.log('CSV geladen und Chart gerendert!');
  } catch (err) {
    console.error(err);
  }
}

// Start
loadCSV();
