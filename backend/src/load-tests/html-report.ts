// Helper to safely extract number/string from metric values
export function getMetricValue(metric: any, key: string, digits: number = 2): string {
  if (!metric || !metric.values) return '-';
  const val = metric.values[key];
  if (val === undefined || val === null || (typeof val === 'number' && isNaN(val))) return '-';
  return typeof val === 'number' ? val.toFixed(digits) : String(val);
}

// Helper to format k6 metrics into a clean standalone HTML dashboard
export function generateHtmlReport(data: any, title: string): string {
  const metrics = data.metrics || {};
  const httpReqs = metrics.http_reqs ? metrics.http_reqs.values.count : 0;
  const httpRate = getMetricValue(metrics.http_reqs, 'rate', 1);
  
  const avg = getMetricValue(metrics.http_req_duration, 'avg');
  const med = getMetricValue(metrics.http_req_duration, 'med');
  const p90 = getMetricValue(metrics.http_req_duration, 'p(90)');
  const p95 = getMetricValue(metrics.http_req_duration, 'p(95)');
  const p99 = getMetricValue(metrics.http_req_duration, 'p(99)');
  const max = getMetricValue(metrics.http_req_duration, 'max');

  const failRate = metrics.http_req_failed && metrics.http_req_failed.values
    ? (metrics.http_req_failed.values.rate * 100).toFixed(2)
    : '0.00';

  let customMetricsRows = '';
  for (const [key, metric] of Object.entries<any>(metrics)) {
    if (key.startsWith('autocomplete_') || key.startsWith('selection_')) {
      const vals = metric.values || {};
      const avgVal = getMetricValue(metric, 'avg');
      const rateVal = vals.rate !== undefined ? (vals.rate * 100).toFixed(2) + '%' : null;
      const countVal = vals.count !== undefined ? vals.count : (vals.value !== undefined ? vals.value : '-');
      const displayVal = rateVal !== null ? rateVal : (avgVal !== '-' ? avgVal + ' ms' : countVal);
      const p95Val = getMetricValue(metric, 'p(95)');
      const p99Val = getMetricValue(metric, 'p(99)');

      customMetricsRows += `
        <tr>
          <td><strong>${key}</strong></td>
          <td>${metric.type || 'custom'}</td>
          <td>${displayVal}</td>
          <td>${p95Val !== '-' ? p95Val + ' ms' : '-'}</td>
          <td>${p99Val !== '-' ? p99Val + ' ms' : '-'}</td>
        </tr>
      `;
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - Performance Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 2rem; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { color: #38bdf8; margin-bottom: 0.5rem; font-size: 2rem; }
    .subtitle { color: #94a3b8; margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: #1e293b; border-radius: 8px; padding: 1.25rem; border: 1px solid #334155; }
    .card .label { color: #94a3b8; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .card .value { font-size: 1.75rem; font-weight: bold; color: #f1f5f9; margin-top: 0.5rem; }
    .card .highlight { color: #38bdf8; }
    .card .success { color: #4ade80; }
    .card .warning { color: #f87171; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; margin-top: 1rem; }
    th, td { padding: 0.85rem 1.25rem; text-align: left; border-bottom: 1px solid #334155; }
    th { background: #334155; color: #e2e8f0; font-size: 0.875rem; text-transform: uppercase; }
    tr:last-child td { border-bottom: none; }
    .footer { margin-top: 2rem; text-align: center; color: #64748b; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>

    <div class="grid">
      <div class="card">
        <div class="label">Total Requests</div>
        <div class="value highlight">${Number(httpReqs).toLocaleString()}</div>
      </div>
      <div class="card">
        <div class="label">Throughput</div>
        <div class="value">${httpRate} <span style="font-size: 1rem; font-weight: normal; color: #94a3b8;">req/sec</span></div>
      </div>
      <div class="card">
        <div class="label">P95 Latency</div>
        <div class="value success">${p95} <span style="font-size: 1rem; font-weight: normal; color: #94a3b8;">ms</span></div>
      </div>
      <div class="card">
        <div class="label">Failed Requests</div>
        <div class="value ${parseFloat(failRate) > 0 ? 'warning' : 'success'}">${failRate}%</div>
      </div>
    </div>

    <h2>Latency Percentiles</h2>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Average Latency</td><td><strong>${avg} ms</strong></td></tr>
        <tr><td>Median (p50) Latency</td><td><strong>${med} ms</strong></td></tr>
        <tr><td>90th Percentile (p90)</td><td><strong>${p90} ms</strong></td></tr>
        <tr><td>95th Percentile (p95)</td><td><strong>${p95} ms</strong></td></tr>
        <tr><td>99th Percentile (p99)</td><td><strong>${p99} ms</strong></td></tr>
        <tr><td>Max Latency</td><td><strong>${max} ms</strong></td></tr>
      </tbody>
    </table>

    ${customMetricsRows ? `
      <h2>Endpoint Breakdown</h2>
      <table>
        <thead>
          <tr>
            <th>Metric Name</th>
            <th>Type</th>
            <th>Avg / Rate / Count</th>
            <th>P95</th>
            <th>P99</th>
          </tr>
        </thead>
        <tbody>
          ${customMetricsRows}
        </tbody>
      </table>
    ` : ''}

    <div class="footer">
      Tested with k6 &bull; Antigravity Engine Benchmark Suite
    </div>
  </div>
</body>
</html>`;
}
