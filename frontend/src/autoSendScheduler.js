import * as XLSX from 'xlsx';
import axios from 'axios';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { listImportedProjects } from './firestoreImports';

const API_BASE = 'http://localhost:8080';

// Google Apps Script web app that sends the Excel report by Gmail — Firebase
// Hosting is static-only (no PHP backend), so the live site posts here
// instead of /sendEmailExcel. Must match deploy/SendExcelEmail.gs.
const EXCEL_EMAIL_ENDPOINT =
  process.env.REACT_APP_EXCEL_EMAIL_URL ||
  'https://script.google.com/macros/s/AKfycbyNkrqlze6JIclcty6ykEipuXFoer2lTxPbENqLNemTe-JHFY-QP1zjnyAcPb0xxOK-yg/exec';
const EXCEL_EMAIL_TOKEN = 'dost-excel-send-2026';

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const buildProjectsExcelBase64 = (projects) => {
  const exportData = projects.map((row, index) => ({
    'No.': index + 1,
    'ISP': row.ISP,
    'Program Title': row.programTitle,
    'Program Leader': row.programLeader || '',
    'PALIHAN Code(project)': row.projectCode,
    'Project Title': row.projectTitle,
    'Project Leader': row.projectLeader || row.programLeader || '',
    'Funding': row.funding,
    'Implementing Agency': row.implementingAgency,
    'Email Address': row.emailAddress,
    'Contact Number': row.contactNumber,
    'Postal Address': row.postalAddress,
    'Cooperating Agency': row.cooperatingAgency,
    'Original Start': row.originalStart,
    'Original End': row.originalEnd,
    'Change Start': row.changeStart,
    'Change of Implementation Date': row.changeImplementationDate,
    'First Extension': row.firstExtension,
    'Second Extension': row.secondExtension,
    'Objectives': row.objectives,
    'Description': row.description,
    'Deliverables': row.deliverables,
    'Beneficiaries': row.beneficiaries,
    'DC Y1 Approval': row.dcY1Approval,
    'GC Y1 Approval': row.gcY1Approval,
    'Execom Y1 Approval': row.execomY1Approval,
    'DC Y2 Renewal': row.dcY2Renewal,
    'GC Y2 Renewal': row.gcY2Renewal,
    'Execom Y2 Renewal': row.execomY2Renewal,
    'DC Y3 Renewal': row.dcY3Renewal,
    'GC Y3 Renewal': row.gcY3Renewal,
    'Execom Y3 Renewal': row.execomY3Renewal,
    'Inception Meeting': row.inceptionMeeting,
    'M&E': row.mande,
    'Y1 Budget Realignment': row.y1BudgetRealignment,
    'Y2 Budget Realignment': row.y2BudgetRealignment,
    'Y3 Budget Realignment': row.y3BudgetRealignment,
    'Program Review': row.programReview,
    'Terminal Review': row.terminalReview,
    'Status': row.status,
    'Remarks': row.remarks,
    'Project Accomplishments': row.projectAccomplishment,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
  return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
};

export const describeSchedule = (schedule) => {
  if (!schedule || !schedule.time) return 'No schedule set';
  let frequencyText = 'Daily';
  if (schedule.frequency === 'weekly') {
    frequencyText = `Every ${WEEKDAY_LABELS[Number(schedule.day)] || 'Sunday'}`;
  } else if (schedule.frequency === 'monthly') {
    frequencyText = `Day ${schedule.day || 1} of each month`;
  }
  return `${frequencyText} at ${schedule.time}`;
};

export const isScheduleDue = (schedule, now = new Date()) => {
  if (!schedule || !schedule.time) return false;

  const timeParts = schedule.time.split(':');
  const dueTime = new Date(now);
  dueTime.setHours(Number(timeParts[0]) || 0, Number(timeParts[1]) || 0, 0, 0);
  if (now.getTime() < dueTime.getTime()) return false;

  const lastSent = schedule.last_sent ? new Date(schedule.last_sent) : null;
  const alreadySentToday = Boolean(lastSent) && lastSent.toDateString() === now.toDateString();
  if (alreadySentToday) return false;

  if (schedule.frequency === 'weekly') {
    return now.getDay() === Number(schedule.day);
  }
  if (schedule.frequency === 'monthly') {
    return now.getDate() === Number(schedule.day);
  }
  return true;
};

let isRunning = false;

export const sendProjectsExcel = async (to, { firstName = '', context = 'scheduled' } = {}) => {
  const projects = await listImportedProjects();
  const contentBase64 = buildProjectsExcelBase64(projects);
  const today = new Date().toLocaleDateString();
  const fileName = `DOST-Projects-${new Date().toISOString().slice(0, 10)}.xlsx`;
  const payload = {
    to,
    subject: `DOST Projects Report - ${today}`,
    message: `Hello ${firstName || ''},\n\nAttached is the DOST Projects Excel report for ${today}. This report was sent ${context === 'manual' ? 'on demand' : 'automatically based on the schedule set for your account'}.`,
    fileName,
    contentBase64,
  };

  if (EXCEL_EMAIL_ENDPOINT) {
    // text/plain keeps this a CORS "simple request" — Apps Script has no
    // OPTIONS handler, so application/json would be blocked by preflight.
    const response = await axios.post(
      EXCEL_EMAIL_ENDPOINT,
      JSON.stringify({ ...payload, token: EXCEL_EMAIL_TOKEN }),
      { headers: { 'Content-Type': 'text/plain;charset=utf-8' } }
    );
    const data = response.data;
    if (!data || data.ok !== true) {
      const apiError = new Error((data && data.error) || 'The email service did not confirm the send.');
      apiError.apiError = apiError.message;
      throw apiError;
    }
    return response;
  }

  return axios.post(`${API_BASE}/sendEmailExcel`, payload);
};

export const runAutoSendScheduler = async () => {
  if (isRunning || !auth.currentUser) return;

  isRunning = true;
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const dueUsers = snapshot.docs
      .map((userDocument) => ({ ...userDocument.data(), id: userDocument.id }))
      .filter((user) => user.auto_send_excel && user.email && isScheduleDue(user.auto_send_schedule));

    if (dueUsers.length === 0) return;

    for (const user of dueUsers) {
      try {
        await sendProjectsExcel(user.email, { firstName: user.first_name, context: 'scheduled' });
        await updateDoc(doc(db, 'users', user.id), {
          'auto_send_schedule.last_sent': new Date().toISOString(),
        });
        console.log(`Auto-sent projects Excel to ${user.email}`);
      } catch (sendError) {
        console.error(`Unable to auto-send projects Excel to ${user.email}:`, sendError);
      }
    }
  } catch (schedulerError) {
    console.error('Auto-send scheduler failed:', schedulerError);
  } finally {
    isRunning = false;
  }
};
