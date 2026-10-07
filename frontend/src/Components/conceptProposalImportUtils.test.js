import { normalizeImportedConceptProposalRows } from './conceptProposalImportUtils';
import { reconcileProposalRows } from './proposalImportUtils';

describe('normalizeImportedConceptProposalRows', () => {
  it('maps imported spreadsheet rows into concept proposal objects', () => {
    const importedRows = [
      {
        Classification: 'R&D',
        'Date Received': '2024-01-01',
        'Date Actioned': '2024-01-02',
        'Lead TRD': 'SERD',
        'Concept Proposal Title': 'Sample Proposal',
        'Project Leader': 'Juan Dela Cruz',
        'Implementing Agency': 'DOST',
        'Proposed Budget': '100000',
        Status: 'Submitted',
      },
    ];

    const result = normalizeImportedConceptProposalRows(importedRows);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      classification: 'R&D',
      dateReceived: '2024-01-01',
      dateActioned: '2024-01-02',
      leadTRD: 'SERD',
      conceptTitle: 'Sample Proposal',
      projectLeader: 'Juan Dela Cruz',
      implementingAgency: 'DOST',
      proposedBudget: '100000',
      status: 'Submitted',
      files: '',
    });
    expect(result[0]).not.toHaveProperty('id');
  });

  it('adds new proposals and updates matching records on re-import', () => {
    const imported = normalizeImportedConceptProposalRows([
      { 'Concept Proposal Title': 'Existing proposal', 'Project Leader': 'Jane Doe', Status: 'Updated' },
      { 'Concept Proposal Title': 'New proposal', 'Project Leader': 'John Doe' },
      { 'Concept Proposal Title': '', 'Project Leader': 'Missing title' },
    ]);
    const result = reconcileProposalRows(imported, [
      { id: 'existing-id', conceptTitle: 'Existing proposal', projectLeader: 'Jane Doe', status: 'Old' },
    ], 'conceptTitle');

    expect(result.additions.map(({ conceptTitle }) => conceptTitle)).toEqual(['New proposal']);
    expect(result.updates).toEqual([['existing-id', expect.objectContaining({ status: 'Updated' })]]);
    expect(result.skippedCount).toBe(1);
  });
});
