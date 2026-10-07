const proposalIdentity = (row, titleField) => (
  `${String(row[titleField] || '').trim().toLowerCase()}|${String(row.projectLeader || '').trim().toLowerCase()}`
);

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

export const reconcileProposalRows = (importedRows, existingRows, titleField) => {
  const existingByIdentity = new Map(
    existingRows.map((row) => [proposalIdentity(row, titleField), row])
  );
  const additions = [];
  const updates = new Map();
  const addedIdentities = new Set();
  let skippedCount = 0;

  importedRows.forEach((row) => {
    if (!row[titleField]) {
      skippedCount += 1;
      return;
    }

    const identity = proposalIdentity(row, titleField);
    const existing = existingByIdentity.get(identity);
    if (existing) {
      updates.set(existing.id, Object.fromEntries(
        Object.entries(row).filter(([, value]) => value !== '')
      ));
    } else if (addedIdentities.has(identity)) {
      skippedCount += 1;
    } else {
      additions.push(row);
      addedIdentities.add(identity);
    }
  });

  return { additions, updates: [...updates.entries()], skippedCount };
};
