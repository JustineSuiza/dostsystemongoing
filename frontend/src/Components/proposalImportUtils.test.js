import { formatProposalDetailValue } from './proposalImportUtils';

describe('proposal detail values', () => {
  it('formats Firestore timestamps instead of rendering objects as React children', () => {
    const timestamp = { toDate: () => new Date('2026-10-07T12:00:00.000Z') };

    expect(formatProposalDetailValue(timestamp)).toBe(new Date('2026-10-07T12:00:00.000Z').toLocaleString());
  });

  it('formats arrays and plain objects as displayable text', () => {
    expect(formatProposalDetailValue(['one', 2])).toBe('one, 2');
    expect(formatProposalDetailValue({ code: 'A1' })).toBe('{"code":"A1"}');
  });

  it('uses a placeholder for missing values', () => {
    expect(formatProposalDetailValue(undefined)).toBe('-');
    expect(formatProposalDetailValue('')).toBe('-');
  });
});
