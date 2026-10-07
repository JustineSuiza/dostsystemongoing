import {
  normalizeImportedFullblownProposalRows,
  reconcileFullblownProposalRows,
} from './fullblownProposalImportUtils';

describe('normalizeImportedFullblownProposalRows', () => {
  it('recognizes the Concept Proposal Title column used in the fullblown spreadsheet', () => {
    const result = normalizeImportedFullblownProposalRows([{
      Classification: '',
      'Date Received': '',
      'Date Actioned': '',
      'Lead TRD': 'IDD',
      'Concept Proposal Title': 'Upgrading the Freshwater Multi-Species Hatchery',
      'Project Leader': 'Mr. Walter L. Pacunana',
      'Implementing Agency': 'PSAU',
      'Proposed Budget': '',
      Status: '',
    }]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      leadTRD: 'IDD',
      proposalTitle: 'Upgrading the Freshwater Multi-Species Hatchery',
      projectLeader: 'Mr. Walter L. Pacunana',
      implementingAgency: 'PSAU',
    });
  });

  it('recognizes title headers despite punctuation and case differences', () => {
    const [result] = normalizeImportedFullblownProposalRows([{
      'FULL-BLOWN PROPOSAL TITLE': 'Example proposal',
      Proponent: 'Example leader',
      Agency: 'Example agency',
      Remarks: 'For evaluation',
    }]);

    expect(result).toMatchObject({
      proposalTitle: 'Example proposal',
      projectLeader: 'Example leader',
      implementingAgency: 'Example agency',
      status: 'For evaluation',
    });
  });

  it('updates already-imported proposals and adds new ones when a sheet is re-imported', () => {
    const imported = normalizeImportedFullblownProposalRows([
      { 'Concept Proposal Title': 'Existing proposal', 'Project Leader': 'Jane Doe', Status: 'Updated' },
      { 'Concept Proposal Title': 'New proposal', 'Project Leader': 'John Doe' },
      { 'Concept Proposal Title': '', 'Project Leader': 'No title' },
    ]);

    const result = reconcileFullblownProposalRows(imported, [
      { id: 'existing-id', proposalTitle: 'Existing proposal', projectLeader: 'Jane Doe', status: 'Old' },
    ]);

    expect(result.additions).toHaveLength(1);
    expect(result.additions[0].proposalTitle).toBe('New proposal');
    expect(result.updates).toEqual([['existing-id', expect.objectContaining({ status: 'Updated' })]]);
    expect(result.skippedCount).toBe(1);
  });
});
