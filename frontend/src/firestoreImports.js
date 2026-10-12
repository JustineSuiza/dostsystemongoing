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

export const canEditProject = (userLevel) => ['0', '1'].includes(String(userLevel));

const requireProjectEditor = async () => {
  if (!auth.currentUser) {
    throw new Error('Sign in before editing a project.');
  }

  const profile = await getDoc(doc(db, 'users', auth.currentUser.uid));
  if (!profile.exists() || !canEditProject(profile.data().user_lvl)) {
    throw new Error('Only administrator and level 1 accounts can edit projects.');
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

export const updateImportedProject = async (id, updates) => {
  await requireProjectEditor();
  await updateDoc(doc(db, 'projects', id), removeUndefined(updates));
};

export const deleteImportedRow = async (collectionName, id) => {
  await requireAdministrator();
  await deleteDoc(doc(db, collectionName, id));
};

const archiveCollectionForSource = (collectionName) => (
  collectionName === 'projects' ? 'archivedProjects' : 'archivedProposals'
);

const isArchivableCollection = (collectionName) => (
  ['projects', 'proposals', 'fullblownProposals', 'conceptProposals', 'iddProposals'].includes(collectionName)
);

export const archiveImportedRow = async (collectionName, id) => {
  if (!isArchivableCollection(collectionName)) {
    throw new Error(`The ${collectionName} collection cannot be archived.`);
  }

  await requireAdministrator();
  const sourceReference = doc(db, collectionName, id);
  const sourceSnapshot = await getDoc(sourceReference);
  if (!sourceSnapshot.exists()) {
    throw new Error('This item no longer exists and could not be archived.');
  }

  const archiveCollection = archiveCollectionForSource(collectionName);
  const archiveReference = doc(collection(db, archiveCollection));
  const batch = writeBatch(db);
  batch.set(archiveReference, {
    type: collectionName === 'projects' ? 'Projects' : 'Proposals',
    sourceCollection: collectionName,
    sourceId: id,
    data: sourceSnapshot.data(),
    archivedBy: auth.currentUser.uid,
    archivedAt: serverTimestamp(),
  });
  batch.delete(sourceReference);
  await batch.commit();
};

export const listArchivedRows = async () => {
  const [projects, proposals] = await Promise.all([
    getDocs(collection(db, 'archivedProjects')),
    getDocs(collection(db, 'archivedProposals')),
  ]);

  return [
    ...projects.docs.map((snapshot) => ({
      ...snapshot.data().data,
      id: snapshot.id,
      sourceId: snapshot.data().sourceId,
      sourceCollection: snapshot.data().sourceCollection,
      archiveCollection: 'archivedProjects',
      type: 'Projects',
      archivedAt: snapshot.data().archivedAt,
    })),
    ...proposals.docs.map((snapshot) => ({
      ...snapshot.data().data,
      id: snapshot.id,
      sourceId: snapshot.data().sourceId,
      sourceCollection: snapshot.data().sourceCollection,
      archiveCollection: 'archivedProposals',
      type: 'Proposals',
      archivedAt: snapshot.data().archivedAt,
    })),
  ];
};

export const restoreArchivedRow = async (archiveCollection, archiveId) => {
  if (!['archivedProjects', 'archivedProposals'].includes(archiveCollection)) {
    throw new Error('Invalid archive collection.');
  }

  await requireAdministrator();
  const archiveReference = doc(db, archiveCollection, archiveId);
  const archiveSnapshot = await getDoc(archiveReference);
  if (!archiveSnapshot.exists()) {
    throw new Error('This archived item no longer exists.');
  }

  const archived = archiveSnapshot.data();
  if (!isArchivableCollection(archived.sourceCollection) || !archived.sourceId || !archived.data) {
    throw new Error('The archived item is missing valid restore data.');
  }
  if (archiveCollectionForSource(archived.sourceCollection) !== archiveCollection) {
    throw new Error('The archived item is stored in the wrong archive.');
  }

  const sourceReference = doc(db, archived.sourceCollection, archived.sourceId);
  if ((await getDoc(sourceReference)).exists()) {
    throw new Error('An item with the original ID already exists and cannot be restored safely.');
  }

  const batch = writeBatch(db);
  batch.set(sourceReference, archived.data);
  batch.delete(archiveReference);
  await batch.commit();
};

export const deleteArchivedRow = async (archiveCollection, archiveId) => {
  if (!['archivedProjects', 'archivedProposals'].includes(archiveCollection)) {
    throw new Error('Invalid archive collection.');
  }

  await requireAdministrator();
  await deleteDoc(doc(db, archiveCollection, archiveId));
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
