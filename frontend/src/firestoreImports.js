import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';

const MAX_BATCH_SIZE = 450;

const normalizeTitle = (title) => String(title || '').trim().replace(/\s+/g, ' ').toLowerCase();

export const parseImportedAmount = (value) => {
  const text = String(value ?? '').trim();
  const isNegative = text.startsWith('(') && text.endsWith(')');
  const normalized = text.replace(/[^\d.-]/g, '');
  const parsed = typeof value === 'number' ? value : Number.parseFloat(normalized);
  const amount = isNegative ? -parsed : parsed;
  return Number.isFinite(amount) ? amount : 0;
};

export const aggregateAnnualRows = (rows, startYear) => {
  const values = {};

  rows.forEach((row) => {
    const year = String(row.year ?? '').trim();
    const ordinal = year.match(/^(?:Y|YEAR\s*)(\d+)$/i);
    const normalizedYear = ordinal ? ordinal[1] : year;
    const amount = parseImportedAmount(row.amount);

    if (!normalizedYear) return;
    if (ordinal && Number.isFinite(startYear)) {
      const calendarYear = String(startYear + Number(ordinal[1]) - 1);
      values[calendarYear] = (values[calendarYear] || 0) + amount;
    } else {
      values[normalizedYear] = (values[normalizedYear] || 0) + amount;
    }
  });

  return values;
};

const getProjectStartYear = (project) => {
  const start = project.changeStart || project.originalStart;
  if (!start) return null;
  const year = new Date(start).getFullYear();
  return Number.isFinite(year) ? year : null;
};

const removeUndefined = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => item === undefined ? null : removeUndefined(item));
  }

  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, removeUndefined(item)])
    );
  }

  return value;
};

const requireAdministrator = async () => {
  if (!auth.currentUser) {
    throw new Error('Sign in with an administrator account before importing data.');
  }

  const profile = await getDoc(doc(db, 'users', auth.currentUser.uid));
  if (!profile.exists() || profile.data().user_lvl !== '0') {
    throw new Error('Only an administrator can import data.');
  }
};

export const saveImportedRows = async (collectionName, rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('No importable rows were found.');
  }

  await requireAdministrator();
  let savedCount = 0;

  for (let offset = 0; offset < rows.length; offset += MAX_BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = rows.slice(offset, offset + MAX_BATCH_SIZE);

    chunk.forEach((row) => {
      const reference = doc(collection(db, collectionName));
      batch.set(reference, {
        ...removeUndefined(row),
        _importedBy: auth.currentUser.uid,
        _importedAt: serverTimestamp(),
      });
    });

    await batch.commit();
    savedCount += chunk.length;
  }

  return savedCount;
};

export const saveProjectRelatedRows = async (collectionName, rows) => {
  const projects = await listImportedRows('projects');
  const matchedRows = [];

  rows.forEach((row) => {
    const title = normalizeTitle(row.projectTitle);
    const project = projects.find((candidate) => [
      candidate.projectTitle,
      candidate.programTitle,
      candidate.projectCode,
    ].some((candidateTitle) => normalizeTitle(candidateTitle) === title));

    if (project) {
      matchedRows.push({ ...row, projectId: project.id });
    }
  });

  if (matchedRows.length === 0) {
    throw new Error('No rows matched a project in Firestore. Import the project spreadsheet first and check the project titles.');
  }

  const importedCount = await saveImportedRows(collectionName, matchedRows);
  return { importedCount, skippedCount: rows.length - importedCount };
};

export const listImportedRows = async (collectionName) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
};

export const updateImportedRow = async (collectionName, id, updates) => {
  await requireAdministrator();
  await updateDoc(doc(db, collectionName, id), removeUndefined(updates));
};

export const deleteImportedRow = async (collectionName, id) => {
  await requireAdministrator();
  await deleteDoc(doc(db, collectionName, id));
};

export const listImportedProjects = async () => {
  const [projects, budgets, releases, counterpartFunds] = await Promise.all([
    listImportedRows('projects'),
    listImportedRows('budgets'),
    listImportedRows('releases'),
    listImportedRows('counterpartFunds'),
  ]);

  return projects.map((project) => {
    const projectTitles = new Set([
      normalizeTitle(project.projectTitle),
      normalizeTitle(project.programTitle),
      normalizeTitle(project.projectCode),
    ].filter(Boolean));
    const relatedToProject = (row) => (
      row.projectId === project.id || projectTitles.has(normalizeTitle(row.projectTitle))
    );
    const projectBudgets = budgets.filter(relatedToProject);
    const projectReleases = releases.filter(relatedToProject);
    const projectFunds = counterpartFunds.filter(relatedToProject);
    const startYear = getProjectStartYear(project);
    const embeddedBudgets = Array.isArray(project.budgetData) ? project.budgetData : [];
    const budgetRows = projectBudgets.length > 0 ? projectBudgets : embeddedBudgets;
    const budget = aggregateAnnualRows(budgetRows, startYear);
    const budgetTotal = budgetRows.reduce((sum, row) => sum + parseImportedAmount(row.amount), 0);
    const counterFund = aggregateAnnualRows(projectFunds, startYear);
    const fundTotal = projectFunds.some((fund) => fund.amount !== null && fund.amount !== undefined && fund.amount !== '')
      ? projectFunds.reduce((sum, fund) => sum + parseImportedAmount(fund.amount), 0)
      : parseImportedAmount(projectFunds[0]?.totalFund);

    return {
      ...project,
      budget: budgetRows.length > 0 ? budget : (project.budget || {}),
      budgetArray: budgetRows.length > 0
        ? budgetRows.map((row) => ({ year: row.year, amount: parseImportedAmount(row.amount) }))
        : (project.budgetArray || []),
      totalBudget: budgetRows.length > 0 ? budgetTotal : project.totalBudget,
      budgetData: budgetRows,
      releaseData: projectReleases[0] || project.releaseData || {},
      counterFund: projectFunds.length > 0 ? counterFund : (project.counterFund || {}),
      counterpartFundData: projectFunds.length > 0
        ? { ...projectFunds[0], totalFund: fundTotal }
        : (project.counterpartFundData || {}),
      fileData: project.fileData || {},
      sixPs: project.sixPs || {},
    };
  });
};
