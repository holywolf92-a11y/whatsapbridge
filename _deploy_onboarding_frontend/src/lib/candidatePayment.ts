export function normalizeCandidatePaymentAmount(value: unknown, fallback = 0): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = typeof value === 'number'
    ? value
    : Number(String(value).replace(/,/g, '').trim());

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.round(parsed));
}

export function formatCandidatePaymentAmount(value: unknown): string {
  const amount = normalizeCandidatePaymentAmount(value, 0);
  return `${amount.toLocaleString('en-PK')} PKR`;
}