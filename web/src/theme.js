export const THEME = {
  bg: 'linear-gradient(180deg, #06111d 0%, #0a1d2f 48%, #071726 100%)',
  panel: 'rgba(10, 24, 40, 0.82)',
  panelBorder: 'rgba(125, 211, 252, 0.16)',
  panelStrong: 'rgba(8, 20, 34, 0.92)',
  text: '#f8fafc',
  textMuted: '#cbd5e1',
  accent: '#22d3ee',
  accentStrong: '#0ea5e9',
  accentSoft: 'rgba(34, 211, 238, 0.16)',
  safe: '#22c55e',
  suspicious: '#f59e0b',
  dangerous: '#ef4444',
  unverified: '#94a3b8'
};

export const RISK_STYLES = {
  SAFE: {
    label: 'Safe',
    color: THEME.safe,
    background: 'rgba(34, 197, 94, 0.14)',
    border: 'rgba(34, 197, 94, 0.36)'
  },
  SUSPICIOUS: {
    label: 'Suspicious',
    color: THEME.suspicious,
    background: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.36)'
  },
  DANGEROUS: {
    label: 'Dangerous',
    color: THEME.dangerous,
    background: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(239, 68, 68, 0.36)'
  },
  UNVERIFIED: {
    label: 'Unverified',
    color: THEME.unverified,
    background: 'rgba(148, 163, 184, 0.14)',
    border: 'rgba(148, 163, 184, 0.36)'
  }
};

export function getRiskStyle(verdict) {
  return RISK_STYLES[verdict] || RISK_STYLES.UNVERIFIED;
}
