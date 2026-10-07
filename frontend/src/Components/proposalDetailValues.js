export const formatProposalDetailValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.map(formatProposalDetailValue).join(', ');
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') return value.toDate().toLocaleString();
    return JSON.stringify(value);
  }
  return String(value);
};
