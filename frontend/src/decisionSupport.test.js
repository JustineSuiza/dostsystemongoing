import { buildDecisionSupportSummary } from './decisionSupport';

describe('buildDecisionSupportSummary', () => {
  const asOf = new Date('2026-10-08T00:00:00.000Z');

  it('classifies overdue active projects and verifies no network backend is needed', () => {
    const summary = buildDecisionSupportSummary({
      projects: [{
        id: 'project-1',
        projectTitle: 'Overdue project',
        status: 'Ongoing',
        originalEnd: '2024-12-31',
      }],
      budgets: [],
      releases: [],
      asOf,
    });

    expect(summary.counts.CRITICAL).toBe(1);
    expect(summary.projects[0].reasons.map(({ code }) => code)).toContain('OVERDUE_BEYOND_EXTENSION');
    expect(summary.projects[0].reasons.map(({ code }) => code)).toContain('BUDGET_DATA_MISSING');
  });

  it('uses Firestore budget and release rows linked by project id', () => {
    const summary = buildDecisionSupportSummary({
      projects: [{
        id: 'project-2',
        projectTitle: 'Funded project',
        status: 'Ongoing',
        originalEnd: '2028-06-30',
      }],
      budgets: [
        { projectId: 'project-2', year: 'Y1', amount: '1,000,000', totalBudget: '1,000,000' },
      ],
      releases: [
        { projectId: 'project-2', programmedAmount: '1,000,000', actualRelease: '200,000' },
      ],
      asOf,
    });

    expect(summary.counts.NEEDS_ATTENTION).toBe(1);
    expect(summary.projects[0].reasons.map(({ code }) => code)).toContain('LOW_FUND_UTILIZATION');
    expect(summary.projects[0].evidence.totalActualReleases).toBe(200000);
  });

  it('treats a missing status as incomplete data rather than a confirmed overrun', () => {
    const summary = buildDecisionSupportSummary({
      projects: [{ id: 'project-3', projectTitle: 'Unknown state', originalEnd: '2024-01-01' }],
      budgets: [],
      releases: [],
      asOf,
    });

    expect(summary.counts.NEEDS_ATTENTION).toBe(1);
    expect(summary.projects[0].classification).toBe('NEEDS_ATTENTION');
    expect(summary.projects[0].reasons.map(({ code }) => code)).toContain('STATUS_UNVERIFIED');
    expect(summary.projects[0].reasons.map(({ code }) => code)).not.toContain('OVERDUE_ACTIVE');
  });
});
