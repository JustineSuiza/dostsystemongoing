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

export const normalizeImportedIDDProposalRows = (rows = []) => (
  rows.filter(Boolean).map((row) => ({
    classification: findValue(row, 'Classification'),
    dateReceived: findValue(row, 'Date Received', 'Date Received/Date Submitted'),
    dateActioned: findValue(row, 'Date Actioned', 'Date Evaluated'),
    leadTRD: findValue(row, 'Lead TRD'),
    proposalTitle: findValue(row, 'Proposal Title', 'IDD Proposal Title', 'Concept Proposal Title', 'Project Title', 'Title'),
    projectLeader: findValue(row, 'Project Leader', 'Project Proponent', 'Proponent'),
    implementingAgency: findValue(row, 'Implementing Agency', 'Implementing Institution', 'Agency'),
    proposedBudget: findValue(row, 'Proposed Budget', 'Proposed Amount', 'Budget'),
    status: findValue(row, 'Status', 'Remarks'),
    statusSpecify: findValue(row, 'Status Specify', 'Status Specify (Others)'),
    files: '',
  }))
);
