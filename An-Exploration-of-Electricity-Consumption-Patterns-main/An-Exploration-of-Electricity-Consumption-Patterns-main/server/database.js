export const REGION_MAP = {
  NR: 'Northern',
  WR: 'Western',
  SR: 'Southern',
  ER: 'Eastern',
  NER: 'Northeastern',
};

export function classifyPhase(dateStr) {
  const d = parseDate(dateStr);
  const lockdownStart = new Date(2020, 2, 1);
  const lockdownEnd = new Date(2020, 5, 30);
  const recoveryEnd = new Date(2020, 11, 5);

  if (d < lockdownStart) return 'Pre-Lockdown';
  if (d <= lockdownEnd) return 'Lockdown';
  if (d <= recoveryEnd) return 'Recovery';
  return 'Post-Period';
}

export function parseDate(dateStr) {
  const [day, month, yearPart] = dateStr.split('/');
  const year = parseInt(yearPart.split(' ')[0], 10);
  return new Date(year, parseInt(month, 10) - 1, parseInt(day, 10));
}

export function formatDateISO(dateStr) {
  const d = parseDate(dateStr);
  return d.toISOString().slice(0, 10);
}
