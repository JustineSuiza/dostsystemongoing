import { aggregateAnnualRows, parseImportedAmount } from './firestoreImports';

describe('Firestore import value normalization', () => {
  it('parses numeric and formatted currency values', () => {
    expect(parseImportedAmount(1250.5)).toBe(1250.5);
    expect(parseImportedAmount('$1,250.50')).toBe(1250.5);
    expect(parseImportedAmount('(1,250.50)')).toBe(-1250.5);
    expect(parseImportedAmount('')).toBe(0);
  });

  it('maps Y-number budget rows to calendar years and sums matching rows', () => {
    expect(aggregateAnnualRows([
      { year: 'Y1', amount: '1,000.25' },
      { year: 'Year 2', amount: 250 },
      { year: 'Y1', amount: 50 },
    ], 2024)).toEqual({
      2024: 1050.25,
      2025: 250,
    });
  });

  it('preserves calendar years when a start year is unavailable', () => {
    expect(aggregateAnnualRows([
      { year: '2025', amount: '800' },
    ], null)).toEqual({ 2025: 800 });
  });
});
