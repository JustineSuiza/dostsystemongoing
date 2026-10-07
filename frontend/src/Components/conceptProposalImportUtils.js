export const normalizeImportedConceptProposalRows = (rows = []) => {
  const sanitize = (v) => {
    if (v === undefined || v === null) return '';
    const s = String(v);
    // remove newlines, collapse whitespace, trim
    return s.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const normalizeKey = (k = '') => k.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const findValue = (row, ...candidates) => {
    for (const c of candidates) {
      if (row[c] !== undefined && row[c] !== null && String(row[c]).toString().trim() !== '') return sanitize(row[c]);
    }
    const lowerKeys = Object.keys(row || {}).reduce((acc, key) => {
      acc[normalizeKey(key)] = row[key];
      return acc;
    }, {});
    for (const c of candidates) {
      const nk = normalizeKey(c);
      if (lowerKeys[nk] !== undefined && lowerKeys[nk] !== null && String(lowerKeys[nk]).toString().trim() !== '') return sanitize(lowerKeys[nk]);
    }
    return '';
  };

  return (rows || [])
    .filter(Boolean)
    .map((row) => ({
      classification: findValue(row, 'Classification', 'classification'),
      dateReceived: findValue(row, 'Date Received', 'dateReceived', 'date_received'),
      dateActioned: findValue(row, 'Date Actioned', 'dateActioned', 'date_actioned'),
      leadTRD: findValue(row, 'Lead TRD', 'leadTRD', 'lead_trd'),
      conceptTitle: findValue(row, 'Concept Proposal Title', 'Title of Concept Proposal', 'Proposal Title', 'conceptTitle', 'title', 'concept_proposal_title'),
      projectLeader: findValue(row, 'Project Leader', 'Project Proponent', 'Proponent', 'projectLeader', 'project_leader'),
      implementingAgency: findValue(row, 'Implementing Agency', 'Implementing Institution', 'Agency', 'implementingAgency', 'implementing_agency'),
      proposedBudget: findValue(row, 'Proposed Budget', 'Proposed Amount', 'Budget', 'proposedBudget', 'proposed_budget'),
      status: findValue(row, 'Status', 'status'),
      files: '',
    }));
};
