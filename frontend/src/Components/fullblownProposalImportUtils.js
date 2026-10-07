const sanitize = (value) => {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
};

const normalizeKey = (key = '') => key.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const findValue = (row, ...candidates) => {
  const normalizedRow = Object.keys(row || {}).reduce((acc, key) => {
    acc[normalizeKey(key)] = row[key];
    return acc;
  }, {});

  for (const candidate of candidates) {
    const value = normalizedRow[normalizeKey(candidate)];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return sanitize(value);
    }
  }
  return '';
};

export const normalizeImportedFullblownProposalRows = (rows = []) => (
  rows.filter(Boolean).map((row) => ({
    classification: findValue(row, 'Classification'),
    dateReceived: findValue(row, 'Date Received', 'Date Received/Date Submitted'),
    dateActioned: findValue(row, 'Date Actioned', 'Date Evaluated'),
    leadTRD: findValue(row, 'Lead TRD'),
    proposalTitle: findValue(
      row,
      'Proposal Title',
      'Fullblown Proposal Title',
      'Fullblown Title',
      'Concept Proposal Title',
      'Title'
    ),
    projectLeader: findValue(row, 'Project Leader', 'Project Proponent', 'Proponent'),
    implementingAgency: findValue(row, 'Implementing Agency', 'Implementing Institution', 'Agency'),
    proposedBudget: findValue(row, 'Proposed Budget', 'Proposed Amount', 'Budget'),
    status: findValue(row, 'Status', 'Remarks'),
    files: '',
  }))
);

export const getFullblownProposalIdentity = (row) => (
  `${String(row.proposalTitle || '').trim().toLowerCase()}|${String(row.projectLeader || '').trim().toLowerCase()}`
);

export const reconcileFullblownProposalRows = (importedRows, existingRows) => {
  const existingByIdentity = new Map(
    existingRows.map((row) => [getFullblownProposalIdentity(row), row])
  );
  const additions = [];
  const updates = new Map();
  const addedIdentities = new Set();
  let skippedCount = 0;

  importedRows.forEach((row) => {
    if (!row.proposalTitle) {
      skippedCount += 1;
      return;
    }

    const existing = existingByIdentity.get(getFullblownProposalIdentity(row));
    if (existing) {
      updates.set(existing.id, Object.fromEntries(
        Object.entries(row).filter(([, value]) => value !== '')
      ));
    } else {
      const identity = getFullblownProposalIdentity(row);
      if (addedIdentities.has(identity)) {
        skippedCount += 1;
        return;
      }
      additions.push(row);
      addedIdentities.add(identity);
    }
  });

  return { additions, updates: [...updates.entries()], skippedCount };
};
