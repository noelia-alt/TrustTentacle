const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3001';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, data: await res.json() };
}

async function post(path, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return { status: res.status, data: await res.json() };
}

describe('report and stats smoke', () => {
  test('report submission works', async () => {
    const r = await post('/api/v1/report', {
      url: 'https://evil-login-example.tk',
      description: 'Smoke test report for stage2.',
      category: 'phishing',
      evidence: { source: 'jest_smoke' }
    });
    expect(r.status).toBe(201);
    expect(r.data.success).toBe(true);
  });

  test('stats endpoints return data', async () => {
    const reportStats = await get('/api/v1/report/stats');
    expect(reportStats.status).toBe(200);
    expect(typeof reportStats.data.totalReports).toBe('number');

    const activity = await get('/api/v1/stats/activity?days=7');
    expect(activity.status).toBe(200);
    expect(Array.isArray(activity.data.series)).toBe(true);
  });
});
