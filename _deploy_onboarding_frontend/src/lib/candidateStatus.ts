export const CANDIDATE_STATUS_VALUES = ['Applied', 'Pending', 'Deployed'] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUS_VALUES)[number];

export function normalizeCandidateStatus(status?: string | null, fallback: CandidateStatus = 'Applied'): CandidateStatus {
  const normalized = String(status || '').trim().toLowerCase();

  switch (normalized) {
    case 'applied':
      return 'Applied';
    case 'pending':
      return 'Pending';
    case 'deployed':
      return 'Deployed';
    default:
      return fallback;
  }
}

export function getCandidateStatusClasses(status?: string | null) {
  const value = normalizeCandidateStatus(status);

  switch (value) {
    case 'Applied':
      return 'bg-blue-100 text-blue-700';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'Deployed':
      return 'bg-green-100 text-green-700';
  }
}