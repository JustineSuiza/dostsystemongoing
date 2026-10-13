import {
  aggregateAnnualRows,
  canEditProject,
  getEmbeddedBudgetRows,
  getProjectDurationYears,
  parseImportedAmount,
} from './firestoreImports';

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

  it('returns each calendar year covered by the effective project duration', () => {
    expect(getProjectDurationYears({
      originalStart: '2015-04-01',
      originalEnd: '2017-03-31',
    })).toEqual(['2015', '2016', '2017']);
    expect(getProjectDurationYears({
      originalStart: '2015-04-01',
      originalEnd: '2017-03-31',
      changeStart: '2016-01-01',
      changeImplementationDate: '2018-12-31',
    })).toEqual(['2016', '2017', '2018']);
  });

  it('uses saved project budget rows ahead of older imported budget rows', () => {
    expect(getEmbeddedBudgetRows({
      budgetData: [{ year: 2015, amount: 100 }],
      budgetArray: [{ year: 2015, amount: 50 }],
      budget: { 2015: 25 },
    })).toEqual([{ year: 2015, amount: 100 }]);
  });

  it('allows only administrators and level 1 users to edit projects', () => {
    expect(canEditProject('0')).toBe(true);
    expect(canEditProject(1)).toBe(true);
    expect(canEditProject('2')).toBe(false);
    expect(canEditProject(undefined)).toBe(false);
  });
});
