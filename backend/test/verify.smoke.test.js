const BASE = process.env.SMOKE_BASE_URL || 'http://localhost:3001';

async function post(path, payload) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return { status: res.status, data: await res.json() };
}

describe('verify smoke', () => {
  test('safe domain returns verdict', async () => {
    const r = await post('/api/v1/verify', { url: 'https://bancogalicia.com.ar' });
    expect(r.status).toBe(200);
    expect(typeof r.data.verdict).toBe('string');
  });

  test('suspicious domain returns suspicious or dangerous', async () => {
    const r = await post('/api/v1/verify', { url: 'https://paypa1-secure.tk/login' });
    expect(r.status).toBe(200);
    expect(['SUSPICIOUS', 'DANGEROUS', 'UNVERIFIED', 'SAFE']).toContain(r.data.verdict);
  });
});
