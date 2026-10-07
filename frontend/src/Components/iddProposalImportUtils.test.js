import { normalizeImportedIDDProposalRows } from './iddProposalImportUtils';
import { reconcileProposalRows } from './proposalImportUtils';

describe('normalizeImportedIDDProposalRows', () => {
  it('maps IDD spreadsheet headers into proposal fields', () => {
    const [row] = normalizeImportedIDDProposalRows([{
      Classification: 'R&D',
      'Date Received': '2025-02-03',
      'Lead TRD': 'IDD',
      'IDD Proposal Title': 'Sample IDD proposal',
      Proponent: 'Juan Dela Cruz',
      Agency: 'DOST',
      'Proposed Amount': '100000',
      Remarks: 'For Evaluation',
    }]);

    expect(row).toMatchObject({
      classification: 'R&D',
      dateReceived: '2025-02-03',
      leadTRD: 'IDD',
      proposalTitle: 'Sample IDD proposal',
      projectLeader: 'Juan Dela Cruz',
      implementingAgency: 'DOST',
      proposedBudget: '100000',
      status: 'For Evaluation',
    });

  });

  it('adds and updates IDD rows by proposal title and project leader', () => {
    const imported = normalizeImportedIDDProposalRows([
      { 'IDD Proposal Title': 'Existing proposal', 'Project Leader': 'Jane Doe', Status: 'Updated' },
      { 'IDD Proposal Title': 'New proposal', 'Project Leader': 'John Doe' },
    ]);
    const result = reconcileProposalRows(imported, [
      { id: 'existing-id', proposalTitle: 'Existing proposal', projectLeader: 'Jane Doe', status: 'Old' },
    ], 'proposalTitle');

    expect(result.additions.map(({ proposalTitle }) => proposalTitle)).toEqual(['New proposal']);
    expect(result.updates).toEqual([['existing-id', expect.objectContaining({ status: 'Updated' })]]);
  });
});
