// Pfad zur CSV-Datei
const csvUrl = "historical_positions.csv";

// Hilfsfunktion zum Parsen der CSV
async function loadCSV(url) {
  const response = await fetch(url);
  const text = await response.text();
  const lines = text.split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  
  const data = lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim());
    let row = {};
    headers.forEach((header, i) => {
      row[header] = cols[i];
    });
    return row;
  });
  return data;
}

// Header-Mapping
function mapRow(row) {
  return {
    date: row["Position Date"] || row["Date"] || "",
    issuer: row["Issuer"] || "",
    isin: row["ISIN"] || "",
    holder: row["Position Holder"] || "",
    position: parseFloat(row["Net Short Position (%)"] || 0)
  };
}

// Tabelle füllen
function fillTable(data) {
  const tbody = document.querySelector("#shorts-table tbody");
  tbody.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.date}</td>
      <td>${row.issuer}</td>
      <td>${row.holder}</td>
      <td>${row.position}</td>
    `;
    tbody.appendChild(tr);
  });
}

// CSV Download
function setupDownload(data) {
  const btn = document.getElementById("download-csv");
  btn.addEventListener("click", () => {
    const csvContent = ["Datum,Aktie,Institution,Position (%)"];
    data.forEach(row => {
      csvContent.push(`${row.date},${row.issuer},${row.holder},${row.position}`);
    });
    const blob = new Blob([csvContent.join("\n")], {type: "text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "netshort_historisch.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Chart erstellen
function drawChart(data) {
  const ctx = document.getElementById("shorts-chart").getContext("2d");
  const labels = [...new Set(data.map(r => r.date))].sort();
  const datasetsMap = {};
  
  data.forEach(r => {
    if (!datasetsMap[r.issuer]) datasetsMap[r.issuer] = Array(labels.length).fill(0);
    const idx = labels.indexOf(r.date);
    datasetsMap[r.issuer][idx] += r.position;
  });
  
  const datasets = Object.keys(datasetsMap).map(issuer => ({
    label: issuer,
    data: datasetsMap[issuer],
    borderWidth: 2,
    fill: false
  }));
  
  new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: { responsive: true, plugins: { legend: { display: true } } }
  });
}

// Filter
function setupFilters(data) {
  const filterIssuer = document.getElementById("filter-issuer");
  const filterHolder = document.getElementById("filter-holder");
  
  function applyFilters() {
    const filtered = data.filter(r =>
      r.issuer.toLowerCase().includes(filterIssuer.value.toLowerCase()) &&
      r.holder.toLowerCase().includes(filterHolder.value.toLowerCase())
    );
    fillTable(filtered);
    drawChart(filtered);
  }
  
  filterIssuer.addEventListener("input", applyFilters);
  filterHolder.addEventListener("input", applyFilters);
}

// Alles zusammen
async function init() {
  let rawData = await loadCSV(csvUrl);
  let data = rawData.map(mapRow).filter(r => r.date && r.position > 0);
  fillTable(data);
  setupDownload(data);
  drawChart(data);
  setupFilters(data);
}

init();
