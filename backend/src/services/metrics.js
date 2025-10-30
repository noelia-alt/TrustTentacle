// In-memory activity metrics for demo/production-lite
// Aggregates daily counts by event type

const counters = new Map(); // key: YYYY-MM-DD -> { total, byType: { [type]: count } }

function dateKey(d = new Date()) {
  const iso = new Date(d).toISOString();
  return iso.substring(0, 10); // YYYY-MM-DD
}

function ensureDay(key) {
  if (!counters.has(key)) counters.set(key, { total: 0, byType: {} });
  return counters.get(key);
}

function record(type = 'event', count = 1, at = new Date()) {
  const key = dateKey(at);
  const day = ensureDay(key);
  day.total += count;
  day.byType[type] = (day.byType[type] || 0) + count;
}

function getSeries(days = 7) {
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    const key = dateKey(d);
    const day = counters.get(key);
    out.push({ date: key, value: day ? day.total : 0 });
  }
  return out;
}

function getSummary(days = 7) {
  const series = getSeries(days);
  const total = series.reduce((a, b) => a + b.value, 0);
  const avg = series.length ? Math.round(total / series.length) : 0;
  const max = series.reduce((m, p) => Math.max(m, p.value), 0);
  return { total, avg, max };
}

function getSnapshot() {
  return Object.fromEntries(counters);
}

module.exports = {
  record,
  getSeries,
  getSummary,
  getSnapshot,
};

