import { parseImportedAmount } from './firestoreImports';

const SEVERITY = {
  ON_TRACK: 0,
  NEEDS_ATTENTION: 1,
  INSUFFICIENT_DATA: 2,
  AT_RISK: 3,
  CRITICAL: 4,
};

const CLOSED_STATUSES = ['completed', 'terminated', 'interminated', 'cleared'];
const ACTIVE_STATUSES = ['ongoing', 'on-going', 'new'];

const normalizeStatus = (raw) => {
  const value = String(raw || '').trim().toLowerCase().replace(/[-\s]/g, '');
  if (!value) return '';
  if (value.includes('ongoing')) return 'ongoing';
  if (value.includes('new')) return 'new';
  if (value.includes('completed') || value.includes('complete')) return 'completed';
  if (value.includes('interminat')) return 'interminated';
  if (value.includes('terminated')) return 'terminated';
  if (value.includes('cleared')) return 'cleared';
  return String(raw).trim().toLowerCase();
};

const getLastDate = (raw) => {
  const text = String(raw || '').trim();
  if (!text) return null;
  const dates = [];
  const addDate = (year, month, day) => {
    const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (
      parsed.getUTCFullYear() === Number(year)
      && parsed.getUTCMonth() === Number(month) - 1
      && parsed.getUTCDate() === Number(day)
    ) dates.push(parsed);
  };
  [...text.matchAll(/(\d{4})-(\d{1,2})-(\d{1,2})/g)].forEach(([, year, month, day]) => addDate(year, month, day));
  const monthNumbers = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  [...text.matchAll(/([A-Z][a-z]{2,8})\s+(\d{1,2}),?\s+(\d{4})/g)].forEach(([, month, day, year]) => {
    const monthNumber = monthNumbers[month.slice(0, 3).toLowerCase()];
    if (monthNumber) addDate(year, monthNumber, day);
  });

  if (dates.length) return new Date(Math.max(...dates.map((date) => date.getTime())));
  const years = text.match(/\b\d{4}\b/g);
  return years ? new Date(Date.UTC(Math.max(...years.map(Number)), 11, 31)) : null;
};

const dateOnly = (date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
const dateString = (date) => date ? date.toISOString().slice(0, 10) : null;
const signedDays = (from, to) => Math.round((dateOnly(to) - dateOnly(from)) / 86400000);
const quote = (value) => {
  const text = String(value || '').trim();
  return text ? `"${text}"` : '(empty)';
};
const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const formatAmount = (value) => parseImportedAmount(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const escalate = (current, next) => SEVERITY[next] > SEVERITY[current] ? next : current;

const normalizeTitle = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
const belongsToProject = (row, project) => (
  row.projectId === project.id
  || [
    project.projectTitle,
    project.programTitle,
    project.projectCode,
  ].some((title) => normalizeTitle(title) && normalizeTitle(title) === normalizeTitle(row.projectTitle))
);

const assessProject = (project, budgetRows, releaseRows, asOf) => {
  const statusRaw = String(project.status || project.remarks || '').trim();
  const status = normalizeStatus(statusRaw);
  const active = ACTIVE_STATUSES.includes(status);
  const closed = CLOSED_STATUSES.includes(status);
  const originalStart = getLastDate(project.originalStart);
  const originalEnd = getLastDate(project.originalEnd);
  const extensions = [
    project.firstExtension,
    project.secondExtension,
    project.changeImplementationDate,
  ].map((value) => String(value || ''));
  const extensionDates = extensions.map(getLastDate).filter(Boolean);
  const extensionEnd = extensionDates.length
    ? new Date(Math.max(...extensionDates.map((date) => date.getTime())))
    : null;
  const extensionCount = extensionDates.length + extensions.filter((value) => /2nd extension|second extension/i.test(value)).length;
  const operativeEnd = originalEnd && extensionEnd
    ? (originalEnd > extensionEnd ? originalEnd : extensionEnd)
    : originalEnd || extensionEnd;
  const budgetByYear = {};
  budgetRows.forEach((row) => {
    const amount = parseImportedAmount(row.amount);
    if (row.year !== null && row.year !== undefined && amount > 0) {
      const year = String(row.year);
      budgetByYear[year] = (budgetByYear[year] || 0) + amount;
    }
  });
  const totalProgrammed = budgetRows.reduce((total, row) => Math.max(total, parseImportedAmount(row.totalBudget)), 0);
  const totalActual = releaseRows.reduce((total, row) => total + parseImportedAmount(row.actualRelease), 0);
  const totalReleaseProgrammed = releaseRows.reduce((total, row) => total + parseImportedAmount(row.programmedAmount), 0);
  const releasesHaveData = releaseRows.some((row) => parseImportedAmount(row.actualRelease) !== 0 || parseImportedAmount(row.programmedAmount) !== 0);
  let classification = 'ON_TRACK';
  const reasons = [];
  const actions = [];
  const gaps = [];
  const addReason = (code, text, evidence) => reasons.push({ code, text, evidence });

  if (!originalEnd && !extensionEnd) {
    gaps.push('No end date on record (originalEnd is empty or unparseable)');
    addReason('SCHEDULE_DATA_MISSING', 'No usable end date is recorded, so schedule performance cannot be assessed.', `originalEnd = ${quote(project.originalEnd)}; firstExtension = ${quote(project.firstExtension)}`);
    classification = escalate(classification, 'INSUFFICIENT_DATA');
    actions.push('Enter the project end date so the schedule can be assessed.');
  }

  if (operativeEnd && active) {
    const overdue = signedDays(operativeEnd, asOf);
    if (overdue > 0) {
      const level = overdue > 180 ? 'CRITICAL' : 'AT_RISK';
      classification = escalate(classification, level);
      addReason(
        overdue > 180 ? 'OVERDUE_BEYOND_EXTENSION' : 'OVERDUE_ACTIVE',
        `Status is recorded as "${statusRaw}" but the approved end date (${formatDate(operativeEnd)}) passed ${overdue} days ago.`,
        `status = ${quote(statusRaw)}; operative end date = ${dateString(operativeEnd)}; days overdue = ${overdue}`
      );
      actions.push(overdue > 180
        ? 'Prioritize for review: confirm whether the project is being extended, terminated, or requires a new approval.'
        : 'Request an updated schedule or a formal extension from the project leader.');
      if (extensionCount >= 2) {
        addReason('REPEATED_EXTENSION', `${extensionCount} extension records are on file for this project.`, extensions.join(' | '));
        actions.push('Review the extension history for repeated slippage and consider a revised implementation plan.');
      }
    }
  }

  if (operativeEnd && !statusRaw && !closed && signedDays(operativeEnd, asOf) > 0) {
    const overdue = signedDays(operativeEnd, asOf);
    gaps.push('Status field is empty, so current project state is unverified');
    classification = escalate(classification, 'NEEDS_ATTENTION');
    addReason(
      'STATUS_UNVERIFIED',
      `The approved end date (${formatDate(operativeEnd)}) has passed by ${overdue} days, but no project status is recorded. This may mean the record is out of date rather than that the project is delayed.`,
      `status = (empty); operative end date = ${dateString(operativeEnd)}; days past = ${overdue}`
    );
    actions.push('Verify the current project status and update the record; classification cannot be confirmed until it is set.');
  }

  if (operativeEnd && active && !closed) {
    const remaining = signedDays(asOf, operativeEnd);
    if (remaining >= 0 && remaining <= 90) {
      classification = escalate(classification, 'NEEDS_ATTENTION');
      addReason('DEADLINE_NEAR', `The approved end date is ${remaining} days away (on ${formatDate(operativeEnd)}).`, `status = ${quote(statusRaw)}; end date = ${dateString(operativeEnd)}; days remaining = ${remaining}`);
      actions.push('Confirm that remaining deliverables and fund obligations can still be completed within the approved end date.');
    }
  }

  if (active && Object.keys(budgetByYear).length === 0) {
    gaps.push('No budget records on file for an ongoing project');
    classification = escalate(classification, 'NEEDS_ATTENTION');
    addReason('BUDGET_DATA_MISSING', 'The project is recorded as ongoing but no yearly budget allocation is on file.', `budget rows = 0; totalBudget = ${quote(project.totalBudget)}`);
    actions.push('Load or confirm the yearly budget allocation so fund utilization can be reviewed.');
  }

  if (totalProgrammed > 0 && releasesHaveData && totalActual > 0) {
    const denominator = totalReleaseProgrammed > 0 ? totalReleaseProgrammed : totalProgrammed;
    const utilization = (totalActual / denominator) * 100;
    if (utilization < 50 && active) {
      classification = escalate(classification, 'NEEDS_ATTENTION');
      addReason('LOW_FUND_UTILIZATION', `Actual releases are ${utilization.toFixed(1)}% of the programmed amount while the project is ongoing.`, `actual releases = ${formatAmount(totalActual)}; programmed = ${totalReleaseProgrammed > 0 ? formatAmount(totalReleaseProgrammed) : 'not recorded'}; total budget = ${formatAmount(totalProgrammed)}`);
      actions.push('Review the reason for low fund utilization and whether the programmed amount should be realigned.');
    }
  }

  if (closed) {
    addReason('PROJECT_CLOSED', `The project is recorded as "${statusRaw}".`, `status = ${quote(statusRaw)}`);
  }
  if (statusRaw && !active && !closed) {
    gaps.push(`unrecognized status value: ${statusRaw}`);
    addReason('STATUS_UNRECOGNIZED', `Status "${statusRaw}" is not one of the recognized values (New, Ongoing, Completed, Cleared, Interminated, Terminated), so the project could not be evaluated against schedule rules.`, `status = ${quote(statusRaw)}`);
    classification = escalate(classification, 'INSUFFICIENT_DATA');
    actions.push('Correct the status value to a recognized option so automated checks can evaluate the project.');
  }
  if (reasons.length === 0) {
    addReason('NO_ISSUE_DETECTED', 'No rule was triggered by the recorded data for this project.', `start = ${dateString(originalStart) || 'not recorded'}; end = ${dateString(operativeEnd) || 'not recorded'}; status = ${quote(statusRaw)}; budget years = ${Object.keys(budgetByYear).length}; release rows with data = ${releasesHaveData ? releaseRows.length : 0}`);
    classification = 'ON_TRACK';
  }
  if (classification === 'ON_TRACK' && actions.length === 0) actions.push('No action indicated by the recorded data. Continue routine monitoring.');

  const labels = {
    CRITICAL: 'Critical',
    AT_RISK: 'At Risk',
    NEEDS_ATTENTION: 'Needs Attention',
    INSUFFICIENT_DATA: 'Insufficient Data',
    ON_TRACK: 'On Track',
  };
  return {
    id: project.id,
    projectCode: project.projectCode || '',
    projectTitle: project.projectTitle || '',
    programTitle: project.programTitle || '',
    ISP: project.ISP || '',
    implementingAgency: project.implementingAgency || '',
    classification,
    label: labels[classification],
    severity: SEVERITY[classification],
    reasons,
    recommendedActions: [...new Set(actions)],
    evidence: {
      asOf: dateString(asOf),
      status: statusRaw,
      statusNormalized: status,
      originalStart: dateString(originalStart),
      originalEnd: dateString(originalEnd),
      operativeEndDate: dateString(operativeEnd),
      operativeEndSource: !operativeEnd ? 'none' : extensionEnd && (!originalEnd || extensionEnd > originalEnd) ? 'latest extension on record' : 'original end date',
      extensionRecords: extensionCount,
      daysPastEndDate: operativeEnd ? signedDays(operativeEnd, asOf) : null,
      totalProgrammedBudget: totalProgrammed,
      totalActualReleases: totalActual,
      releasesDataAvailable: releasesHaveData,
    },
    supportingData: {
      budgetRows: budgetRows.length,
      budgetYears: Object.keys(budgetByYear).length,
      budgetByYear,
      releaseRows: releasesHaveData ? releaseRows.length : 0,
      releaseCount: releasesHaveData ? releaseRows.length : 0,
      totalProgrammed: totalReleaseProgrammed,
      totalActual,
      utilizationPct: totalReleaseProgrammed > 0 ? Number(((totalActual / totalReleaseProgrammed) * 100).toFixed(2)) : null,
    },
    freeTextContext: {
      deliverables: String(project.deliverables || '').trim().slice(0, 600),
      beneficiaries: String(project.beneficiaries || '').trim().slice(0, 600),
      projectAccomplishment: String(project.projectAccomplishment || '').trim().slice(0, 600),
    },
    dataCompleteness: { complete: gaps.length === 0, gaps },
    disclaimer: 'Rule-based indicator generated from recorded data. Not an automated decision — a DOST officer must review and decide.',
  };
};

export const buildDecisionSupportSummary = ({ projects, budgets, releases, asOf = new Date() }) => {
  const assessments = projects.map((project) => assessProject(
    project,
    budgets.filter((row) => belongsToProject(row, project)),
    releases.filter((row) => belongsToProject(row, project)),
    asOf
  ));
  const attention = assessments.filter((project) => project.classification !== 'ON_TRACK')
    .sort((a, b) => b.severity - a.severity || (b.evidence.daysPastEndDate ?? -99999) - (a.evidence.daysPastEndDate ?? -99999));
  const counts = Object.fromEntries(Object.keys(SEVERITY).map((classification) => [
    classification,
    assessments.filter((project) => project.classification === classification).length,
  ]));
  const shown = attention.slice(0, 100);

  return {
    counts,
    total: assessments.length,
    attentionCount: attention.length,
    returned: shown.length,
    truncated: attention.length > shown.length,
    projects: shown,
    evaluatedAt: dateString(asOf),
    disclaimer: 'Rule-based indicators from recorded project data only. These support human review and do not replace a DOST officer’s assessment.',
  };
};
