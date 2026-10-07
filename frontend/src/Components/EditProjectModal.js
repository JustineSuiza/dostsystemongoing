import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CurrencyInput from 'react-currency-input-field';
import { updateImportedRow } from '../firestoreImports';

const remarkOptions = [
    'No Terminal Report',
    'No Financial Report',
    'No Terminal and Financial Report',
    'Executive Summary of Terminal Technical Accomplishment Report',
    'Terminal Financial Report (FR)',
    'Report of Disbursement (ROD) and Report of Checks Issued (RCI)',
    'List of Equipment Purchased (LEP)',
    'Property Acknowledgement Receipt (PAR)',
    'Journal Entry Voucher (JEV) relative to the equipment purchased',
    'List of Personnel Involved',
    'Publishable or pre-print manuscript, as may be applicable',
    'Appraisal/Assessment Report c/o the Monitoring Agency',
    'Official Receipt/Validated LDDAP-ADA/Deposit Slip for reversion of Unexpended Balance',
];

const EditProjectModal = ({ isEditModalOpen, closeModal, project, refresh, showToastF }) => {

    const [ISP, setISP] = useState('');
    const [projectCode, setProjectCode] = useState('');
    const [programCode, setProgramCode] = useState('');
    const [programTitle, setProgramTitle] = useState('');
    const [projectTitle, setProjectTitle] = useState('');
    const [responsiblePerson, setResponsiblePerson] = useState('');
    const [funding, setFunding] = useState('');
    const [region, setRegion] = useState('');
    const [bannerProgram, setBannerProgram] = useState('');
    const [pillar, setPillar] = useState('');
    const [strategy, setStrategy] = useState('');
    const [budget, setBudget] = useState([]);
    const [totalBudget, setTotalBudget] = useState('');
    const [implementingAgency, setImplementingAgency] = useState('');
    const [programLeader, setProgramLeader] = useState('');
    const [projectLeader, setProjectLeader] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [postalAddress, setPostalAddress] = useState('');
    const [cooperatingAgency, setCooperatingAgency] = useState('');
    const [originalStart, setOriginalStart] = useState('');
    const [originalEnd, setOriginalEnd] = useState('');
    const [changeStart, setChangeStart] = useState('');
    const [changeImplementationDate, setChangeImplementationDate] = useState('');
    const [firstExtension, setFirstExtension] = useState({ type: 'single', value: '' });
    const [secondExtension, setSecondExtension] = useState({ type: 'single', value: '' });
    const [inceptionMeeting, setInceptionMeeting] = useState({ type: 'single', value: '', end: '' });
    const [programReview, setProgramReview] = useState([{ type: 'single', value: '' }]);
    const [terminalReview, setTerminalReview] = useState([{ type: 'single', value: '' }]);
    const [submissionTerminal, setSubmissionTerminal] = useState('');
    const [objectives, setObjectives] = useState('');
    const [description, setDescription] = useState('');
    const [deliverables, setDeliverables] = useState('');
    const [beneficiaries, setBeneficiaries] = useState('');
    const [dcY1Approval, setDcY1Approval] = useState('');
    const [gcY1Approval, setGcY1Approval] = useState('');
    const [execomY1Approval, setExecomY1Approval] = useState('');
    const [dcY2Renewal, setDcY2Renewal] = useState('');
    const [gcY2Renewal, setGcY2Renewal] = useState('');
    const [status, setStatus] = useState('');
    const [remarks, setRemarks] = useState('');
    const [tagging, setTagging] = useState('');
    const [sixPs, setSixPs] = useState([]);
    const [mande, setMandE] = useState([{ type: 'single', value: '', comment: '' }]);
    const [y1BudgetRealignment, setY1BudgetRealignment] = useState([{ type: 'single', value: '' }]);
    const [y2BudgetRealignment, setY2BudgetRealignment] = useState([{ type: 'single', value: '' }]);
    const [y3BudgetRealignment, setY3BudgetRealignment] = useState([{ type: 'single', value: '' }]);
    const [selectedYear, setSelectedYear] = useState('');
    const handleYearChange = (e) => setSelectedYear(e.target.value);
    const [showToast, setShowToast] = useState(false);
    const [toastTimeout, setToastTimeout] = useState(null);
    const [execomY2Renewal, setExecomY2Renewal] = useState('');
    const [dcY3Renewal, setDcY3Renewal] = useState('');
    const [gcY3Renewal, setGcY3Renewal] = useState('');
    const [execomY3Renewal, setExecomY3Renewal] = useState('');
    const [publicationEntries, setPublicationEntries] = useState({});
    const [productEntries, setProductEntries] = useState({});
    const [patentEntries, setPatentEntries] = useState({});
    const [peopleEntries, setPeopleEntries] = useState({});
    const [placesEntries, setPlacesEntries] = useState({});
    const [policyEntries, setPolicyEntries] = useState({});

    const toIsoDate = (date) => {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDateForInput = (value) => {
        if (value === null || value === undefined || value === '') return '';
        if (value instanceof Date) return toIsoDate(value);

        const text = String(value).trim();
        if (!text) return '';

        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

        const dmy = text.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
        if (dmy) {
            const first = Number(dmy[1]);
            const second = Number(dmy[2]);
            const year = Number(dmy[3]);

            if (first > 12 && second <= 12) {
                return toIsoDate(new Date(year, second - 1, first));
            }

            const date = new Date(year, first - 1, second);
            if (!Number.isNaN(date.getTime())) return toIsoDate(date);

            const altDate = new Date(year, second - 1, first);
            if (!Number.isNaN(altDate.getTime())) return toIsoDate(altDate);
        }

        const ymd = text.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})$/);
        if (ymd) {
            const year = Number(ymd[1]);
            const month = Number(ymd[2]);
            const day = Number(ymd[3]);
            const date = new Date(year, month - 1, day);
            if (!Number.isNaN(date.getTime())) return toIsoDate(date);
        }

        const parsed = new Date(text);
        if (!Number.isNaN(parsed.getTime())) {
            return toIsoDate(parsed);
        }

        return '';
    };

    useEffect(() => {
        if (!isEditModalOpen || !project) return;

        const parseDateRangeValue = (value) => {
            const trimmed = (value || '').trim();
            if (!trimmed) return { type: 'single', value: '', end: '' };
            if (trimmed.includes(' - ')) {
                const [start, end] = trimmed.split(' - ').map(part => part.trim());
                return { type: 'range', value: start, end };
            }
            return { type: 'single', value: trimmed, end: '' };
        };

        setISP(project.ISP || '');
        setProjectCode(project.projectCode || '');
        setProgramCode(project.programCode || '');
        setProgramTitle(project.programTitle || '');
        setProjectTitle(project.projectTitle || '');
        setResponsiblePerson(project.responsiblePerson || '');
        setFunding(project.funding || '');
        setImplementingAgency(project.implementingAgency || '');
        setProgramLeader(project.programLeader || '');
        setProjectLeader(project.projectLeader || '');
        setEmailAddress(project.emailAddress || '');
        setContactNumber(project.contactNumber || '');
        setPostalAddress(project.postalAddress || '');
        setCooperatingAgency(project.cooperatingAgency || '');
        setOriginalStart(parseDateForInput(project.originalStart || ''));
        setOriginalEnd(parseDateForInput(project.originalEnd || ''));
        setChangeStart(parseDateForInput(project.changeStart || ''));
        setChangeImplementationDate(parseDateForInput(project.changeImplementationDate || ''));
        setFirstExtension(parseDateRangeValue(project.firstExtension || ''));
        setSecondExtension(parseDateRangeValue(project.secondExtension || ''));
        setObjectives(project.objectives || '');
        setDescription(project.description || '');
        setDeliverables(project.deliverables || '');
        setBeneficiaries(project.beneficiaries || '');
        setDcY1Approval(parseDateForInput(project.dcY1Approval || ''));
        setGcY1Approval(parseDateForInput(project.gcY1Approval || ''));
        setExecomY1Approval(parseDateForInput(project.execomY1Approval || ''));
        setDcY2Renewal(parseDateForInput(project.dcY2Renewal || ''));
        setGcY2Renewal(parseDateForInput(project.gcY2Renewal || ''));
        setExecomY2Renewal(parseDateForInput(project.execomY2Renewal || ''));
        setDcY3Renewal(parseDateForInput(project.dcY3Renewal || ''));
        setGcY3Renewal(parseDateForInput(project.gcY3Renewal || ''));
        setExecomY3Renewal(parseDateForInput(project.execomY3Renewal || ''));
        setSubmissionTerminal(project.submissionTerminal || '');
        setStatus(project.status || '');
        setRemarks(project.remarks || '');
        setTagging(project.tagging || '');
        setRegion(project.region || '');
        setBannerProgram(project.bannerProgram || '');
        setPillar(project.pillar || '');
        setStrategy(project.strategy || '');

        const budgetArray = project.budgetArray || (project.budget && typeof project.budget === 'object'
            ? Object.entries(project.budget).map(([year, amount]) => {
                const parsedAmount = typeof amount === 'string' 
                    ? Number(String(amount).replace(/,/g, '')) || 0
                    : Number(amount) || 0;
                return {
                    year: Number(year),
                    amount: parsedAmount,
                };
            })
            : []);
        setBudget(budgetArray);

        const trimmedInception = (project.inceptionMeeting || '').trim();
        let parsedInception;
        if (trimmedInception.includes(' - ')) {
            const [start, end] = trimmedInception.split(' - ');
            parsedInception = { type: 'range', value: start, end };
        } else {
            parsedInception = { type: 'single', value: trimmedInception, end: '' };
        }
        setInceptionMeeting(parsedInception);

        const parsedPReview = (project.programReview || '').split(',').filter(date => date.trim()).map(date => {
            const trimmedDate = date.trim();
            if (trimmedDate.includes(' - ')) {
                const [start, end] = trimmedDate.split(' - ');
                return { type: 'range', value: start, end };
            }
            return { type: 'single', value: trimmedDate, end: '' };
        });
        setProgramReview(parsedPReview.length > 0 ? parsedPReview : [{ type: 'single', value: '' }]);

        const parsedTReview = (project.terminalReview || '').split(',').filter(date => date.trim()).map(date => {
            const trimmedDate = date.trim();
            if (trimmedDate.includes(' - ')) {
                const [start, end] = trimmedDate.split(' - ');
                return { type: 'range', value: start, end };
            }
            return { type: 'single', value: trimmedDate, end: '' };
        });
        setTerminalReview(parsedTReview.length > 0 ? parsedTReview : [{ type: 'single', value: '' }]);

        const sixPsArray = project.sixPs
            ? Object.keys(project.sixPs).map((key) => {
                const sixPsItem = project.sixPs[key];
                const yearValue = (sixPsItem.year !== null && sixPsItem.year !== undefined && sixPsItem.year !== '') ? sixPsItem.year : key;
                return {
                    year: yearValue,
                    targetPublication: sixPsItem.targetPublication,
                    actualaccomplishmentPeer: sixPsItem.actualaccomplishmentPeer,
                    actualaccomplishmentJournal: sixPsItem.actualaccomplishmentJournal,
                    actualaccomplishmentPresented: sixPsItem.actualaccomplishmentPresented,
                    details: sixPsItem.details,
                    actualaccomplishmentIEC: sixPsItem.actualaccomplishmentIEC,
                    targetProduct: sixPsItem.targetProduct,
                    techName: sixPsItem.techName,
                    techDescription: sixPsItem.techDescription,
                    targetPatent: sixPsItem.targetPatent,
                    agency: sixPsItem.agency,
                    techNamePro: sixPsItem.techNamePro,
                    statusSix: sixPsItem.statusSix,
                    dost: sixPsItem.dost,
                    patentNumber: sixPsItem.patentNumber,
                    targetPeople: sixPsItem.targetPeople,
                    namesBS: sixPsItem.namesBS,
                    namesMS: sixPsItem.namesMS,
                    namesPhD: sixPsItem.namesPhD,
                    targetPlaces: sixPsItem.targetPlaces,
                    cooperators: sixPsItem.cooperators,
                    international: sixPsItem.international,
                    privateSixPS: sixPsItem.privateSixPS,
                    targetPolicy: sixPsItem.targetPolicy,
                    policyRecommendation: sixPsItem.policyRecommendation,
                };
            })
            .filter(item => {
                const yearNum = parseInt(item.year);
                const isNumericIndex = !isNaN(yearNum) && yearNum < 100;
                return item.year && item.year !== '0' && item.year !== 0 && !isNumericIndex;
            })
            : [];
        setSixPs(sixPsArray);

        const pubEntries = {};
        const prodEntries = {};
        const patEntries = {};
        const peopleEnt = {};
        const placesEnt = {};
        const policyEnt = {};

        sixPsArray.forEach(item => {
            pubEntries[item.year] = [{ target: item.targetPublication, actual: item.actualaccomplishmentPeer }];
            prodEntries[item.year] = [{ target: item.targetProduct, actual: item.techName }];
            patEntries[item.year] = [{ target: item.targetPatent, actual: item.techNamePro }];
            peopleEnt[item.year] = [{ target: item.targetPeople, actual: item.namesBS }];
            placesEnt[item.year] = [{ target: item.targetPlaces, actual: item.cooperators }];
            policyEnt[item.year] = [{ target: item.targetPolicy, actual: item.policyRecommendation }];
        });

        setPublicationEntries(pubEntries);
        setProductEntries(prodEntries);
        setPatentEntries(patEntries);
        setPeopleEntries(peopleEnt);
        setPlacesEntries(placesEnt);
        setPolicyEntries(policyEnt);
    }, [isEditModalOpen, project]);

    const handleMandEChange = (index, field, value, type) => {
        const newDates = [...mande];
        newDates[index][field] = value;
        if (type) newDates[index].type = type;
        setMandE(newDates);
    };

    const handleY1BudgetChange = (index, field, value, type) => {
        const newDates = [...y1BudgetRealignment];
        newDates[index][field] = value;
        newDates[index].type = type;
        setY1BudgetRealignment(newDates);
    };

    const handleY2BudgetChange = (index, field, value, type) => {
        const newDates = [...y2BudgetRealignment];
        newDates[index][field] = value;
        newDates[index].type = type;
        setY2BudgetRealignment(newDates);
    };

    const handleY3BudgetChange = (index, field, value, type) => {
        const newDates = [...y3BudgetRealignment];
        newDates[index][field] = value;
        newDates[index].type = type;
        setY3BudgetRealignment(newDates);
    };

    const handleFirstExtensionChange = (field, value) => {
        setFirstExtension({ ...firstExtension, [field]: value });
    };

    const handleSecondExtensionChange = (field, value) => {
        setSecondExtension({ ...secondExtension, [field]: value });
    };

    const handleInceptionChange = (field, value) => {
        setInceptionMeeting({ ...inceptionMeeting, [field]: value });
    };

    const handleProgramReviewChange = (index, field, value, type) => {
        const newDates = [...programReview];
        newDates[index][field] = value;
        if (type) newDates[index].type = type;
        setProgramReview(newDates);
    };

    const handleTerminalReviewChange = (index, field, value, type) => {
        const newDates = [...terminalReview];
        newDates[index][field] = value;
        if (type) newDates[index].type = type;
        setTerminalReview(newDates);
    };

    const handleRemovePReview = (index) => {
        const newDates = [...programReview];
        newDates.splice(index, 1);
        setProgramReview(newDates);
    };

    const handleAddPReview = () => {
        setProgramReview([...programReview, { type: 'single', value: '' }]);
    };

    const handleRemoveTReview = (index) => {
        const newDates = [...terminalReview];
        newDates.splice(index, 1);
        setTerminalReview(newDates);
    };

    const handleAddTReview = () => {
        setTerminalReview([...terminalReview, { type: 'single', value: '' }]);
    };

    const handleRemoveMandE = (index) => {
        const newDates = [...mande];
        newDates.splice(index, 1);
        setMandE(newDates);
    };

    const handleAddMandE = () => {
        setMandE([...mande, { type: 'single', value: '', comment: '' }]);
    };

    const handleRemoveY1Budget = (index) => {
        const newDates = [...y1BudgetRealignment];
        newDates.splice(index, 1);
        setY1BudgetRealignment(newDates);
    };

    const handleAddY1Budget = () => {
        setY1BudgetRealignment([...y1BudgetRealignment, { type: 'single', value: '' }]);
    };

    const handleRemoveY2Budget = (index) => {
        const newDates = [...y2BudgetRealignment];
        newDates.splice(index, 1);
        setY2BudgetRealignment(newDates);
    };

    const handleAddY2Budget = () => {
        setY2BudgetRealignment([...y2BudgetRealignment, { type: 'single', value: '' }]);
    };

    const handleRemoveY3Budget = (index) => {
        const newDates = [...y3BudgetRealignment];
        newDates.splice(index, 1);
        setY3BudgetRealignment(newDates);
    };

    const handleAddY3Budget = () => {
        setY3BudgetRealignment([...y3BudgetRealignment, { type: 'single', value: '' }]);
    };

    const handleAddPublicationEntry = (year) => {
        const newEntries = { ...publicationEntries };
        if (!newEntries[year]) {
            newEntries[year] = [];
        }
        newEntries[year].push({ target: '', actual: '' });
        setPublicationEntries(newEntries);
    };

    const handleRemovePublicationEntry = (year, index) => {
        const newEntries = { ...publicationEntries };
        newEntries[year].splice(index, 1);
        setPublicationEntries(newEntries);
    };

    const handlePublicationEntryChange = (year, index, field, value) => {
        const newEntries = { ...publicationEntries };
        newEntries[year][index][field] = value;
        setPublicationEntries(newEntries);
    };

    const handleAddProductEntry = (year) => {
        const newEntries = { ...productEntries };
        if (!newEntries[year]) {
            newEntries[year] = [];
        }
        newEntries[year].push({ target: '', actual: '' });
        setProductEntries(newEntries);
    };

    const handleRemoveProductEntry = (year, index) => {
        const newEntries = { ...productEntries };
        newEntries[year].splice(index, 1);
        setProductEntries(newEntries);
    };

    const handleProductEntryChange = (year, index, field, value) => {
        const newEntries = { ...productEntries };
        newEntries[year][index][field] = value;
        setProductEntries(newEntries);
    };

    const handleAddPatentEntry = (year) => {
        const newEntries = { ...patentEntries };
        if (!newEntries[year]) {
            newEntries[year] = [];
        }
        newEntries[year].push({ target: '', actual: '' });
        setPatentEntries(newEntries);
    };

    const handleRemovePatentEntry = (year, index) => {
        const newEntries = { ...patentEntries };
        newEntries[year].splice(index, 1);
        setPatentEntries(newEntries);
    };

    const handlePatentEntryChange = (year, index, field, value) => {
        const newEntries = { ...patentEntries };
        newEntries[year][index][field] = value;
        setPatentEntries(newEntries);
    };

    const handleAddPeopleEntry = (year) => {
        const newEntries = { ...peopleEntries };
        if (!newEntries[year]) {
            newEntries[year] = [];
        }
        newEntries[year].push({ target: '', actual: '' });
        setPeopleEntries(newEntries);
    };

    const handleRemovePeopleEntry = (year, index) => {
        const newEntries = { ...peopleEntries };
        newEntries[year].splice(index, 1);
        setPeopleEntries(newEntries);
    };

    const handlePeopleEntryChange = (year, index, field, value) => {
        const newEntries = { ...peopleEntries };
        newEntries[year][index][field] = value;
        setPeopleEntries(newEntries);
    };

    const handleAddPlacesEntry = (year) => {
        const newEntries = { ...placesEntries };
        if (!newEntries[year]) {
            newEntries[year] = [];
        }
        newEntries[year].push({ target: '', actual: '' });
        setPlacesEntries(newEntries);
    };

    const handleRemovePlacesEntry = (year, index) => {
        const newEntries = { ...placesEntries };
        newEntries[year].splice(index, 1);
        setPlacesEntries(newEntries);
    };

    const handlePlacesEntryChange = (year, index, field, value) => {
        const newEntries = { ...placesEntries };
        newEntries[year][index][field] = value;
        setPlacesEntries(newEntries);
    };

    const handleAddPolicyEntry = (year) => {
        const newEntries = { ...policyEntries };
        if (!newEntries[year]) {
            newEntries[year] = [];
        }
        newEntries[year].push({ target: '', actual: '' });
        setPolicyEntries(newEntries);
    };

    const handleRemovePolicyEntry = (year, index) => {
        const newEntries = { ...policyEntries };
        newEntries[year].splice(index, 1);
        setPolicyEntries(newEntries);
    };

    const handlePolicyEntryChange = (year, index, field, value) => {
        const newEntries = { ...policyEntries };
        newEntries[year][index][field] = value;
        setPolicyEntries(newEntries);
    };

    const updateProject = async (e) => {
        e.preventDefault();

        const formatValue = (data) => {
            if (data.type === 'range') {
                return data.value + ' - ' + data.end;
            }
            return data.value;
        };

        const formatValuemande = (data) => {
            if (data.type === 'range') {
                return `${data.value} - ${data.end} (${data.comment})`;
            }
            return `${data.value} (${data.comment})`;
        };

        const formattedMandE = mande.map(formatValuemande).join(', ');
        const formattedFirstExtension = formatValue(firstExtension);
        const formattedSecondExtension = formatValue(secondExtension);
        const formattedInception = formatValue(inceptionMeeting);
        const formattedY1Budget = y1BudgetRealignment.map(formatValue).join(', ');
        const formattedY2Budget = y2BudgetRealignment.map(formatValue).join(', ');
        const formattedY3Budget = y3BudgetRealignment.map(formatValue).join(', ');
        const formattedPReview = programReview.map(formatValue).join(', ');
        const formattedTReview = terminalReview.map(formatValue).join(', ');

        const isBudgetChanged = project.budgetArray && JSON.stringify(budget) !== JSON.stringify(project.budgetArray);
        const parseBudgetAmount = (value) => Number(String(value ?? '').replace(/,/g, '')) || 0;
        const isTotalBudgetChanged = parseBudgetAmount(totalBudget) !== parseBudgetAmount(project.totalBudget);
        const originalSixPs = project.sixPsArray || Object.values(project.sixPs || {});
        const isSixPsChanged = JSON.stringify(sixPs) !== JSON.stringify(originalSixPs);


        const isChanged =
            ISP !== project.ISP ||
            projectCode !== project.projectCode ||
            programCode !== project.programCode ||
            programTitle !== project.programTitle ||
            projectTitle !== project.projectTitle ||
            responsiblePerson !== project.responsiblePerson ||
            funding !== project.funding ||
            isBudgetChanged ||
            isTotalBudgetChanged ||
            implementingAgency !== project.implementingAgency ||
            programLeader !== project.programLeader ||
            projectLeader !== project.projectLeader ||
            emailAddress !== project.emailAddress ||
            contactNumber !== project.contactNumber ||
            postalAddress !== project.postalAddress ||
            cooperatingAgency !== project.cooperatingAgency ||
            originalStart !== project.originalStart ||
            originalEnd !== project.originalEnd ||
            changeStart !== project.changeStart ||
            changeImplementationDate !== project.changeImplementationDate ||
            formattedFirstExtension !== project.firstExtension ||
            formattedSecondExtension !== project.secondExtension ||
            objectives !== project.objectives ||
            formattedInception !== project.inceptionMeeting ||
            formattedPReview !== project.programReview ||
            formattedTReview !== project.terminalReview ||
            submissionTerminal !== project.submissionTerminal ||
            region !== project.region ||
            description !== project.description ||
            deliverables !== project.deliverables ||
            beneficiaries !== project.beneficiaries ||
            dcY1Approval !== project.dcY1Approval ||
            gcY1Approval !== project.gcY1Approval ||
            execomY1Approval !== project.execomY1Approval ||
            dcY2Renewal !== project.dcY2Renewal ||
            gcY2Renewal !== project.gcY2Renewal ||
            execomY2Renewal !== project.execomY2Renewal ||
            dcY3Renewal !== project.dcY3Renewal ||
            gcY3Renewal !== project.gcY3Renewal ||
            execomY3Renewal !== project.execomY3Renewal ||
            formattedMandE !== project.mande ||
            formattedY1Budget !== project.y1BudgetRealignment ||
            formattedY2Budget !== project.y2BudgetRealignment ||
            formattedY3Budget !== project.y3BudgetRealignment ||
            status !== project.status ||
            remarks !== project.remarks ||
            tagging !== project.tagging ||
            bannerProgram !== project.bannerProgram ||
            pillar !== project.pillar ||
            strategy !== project.strategy ||
            isSixPsChanged;
            // isFileChanged ||

        if (!isChanged) {
            setShowToast(true);
            if (toastTimeout) {
                clearTimeout(toastTimeout);
            }
            const timeout = setTimeout(() => {
                setShowToast(false);
            }, 5000);
            setToastTimeout(timeout);
            return;
        }

        try {
            const updatedSixPs = sixPs.map(item => {
                const pubEntry = publicationEntries[item.year] ? publicationEntries[item.year][0] : null;
                const prodEntry = productEntries[item.year] ? productEntries[item.year][0] : null;
                const patEntry = patentEntries[item.year] ? patentEntries[item.year][0] : null;
                const peopleEntry = peopleEntries[item.year] ? peopleEntries[item.year][0] : null;
                const placesEntry = placesEntries[item.year] ? placesEntries[item.year][0] : null;
                const policyEntry = policyEntries[item.year] ? policyEntries[item.year][0] : null;

                return {
                    ...item,
                    targetPublication: pubEntry ? pubEntry.target : item.targetPublication,
                    actualaccomplishmentPeer: pubEntry ? pubEntry.actual : item.actualaccomplishmentPeer,
                    targetProduct: prodEntry ? prodEntry.target : item.targetProduct,
                    techName: prodEntry ? prodEntry.actual : item.techName,
                    targetPatent: patEntry ? patEntry.target : item.targetPatent,
                    techNamePro: patEntry ? patEntry.actual : item.techNamePro,
                    targetPeople: peopleEntry ? peopleEntry.target : item.targetPeople,
                    namesBS: peopleEntry ? peopleEntry.actual : item.namesBS,
                    targetPlaces: placesEntry ? placesEntry.target : item.targetPlaces,
                    cooperators: placesEntry ? placesEntry.actual : item.cooperators,
                    targetPolicy: policyEntry ? policyEntry.target : item.targetPolicy,
                    policyRecommendation: policyEntry ? policyEntry.actual : item.policyRecommendation,
                };
            });

            await updateImportedRow('projects', project.id, {
                ISP: ISP,
                programCode: programCode,
                programTitle: programTitle,
                projectCode: projectCode,
                projectTitle: projectTitle,
                responsiblePerson: responsiblePerson,
                funding: funding,
                budget: budget.map(item => ({ year: item.year, amount: item.amount })),
                totalBudget: totalBudget,
                implementingAgency: implementingAgency,
                programLeader: programLeader,
                projectLeader: projectLeader,
                emailAddress: emailAddress,
                contactNumber: contactNumber,
                postalAddress: postalAddress,
                cooperatingAgency: cooperatingAgency,
                originalStart: originalStart,
                originalEnd: originalEnd,
                changeStart: changeStart,
                changeImplementationDate: changeImplementationDate,
                firstExtension: formattedFirstExtension,
                secondExtension: formattedSecondExtension,
                objectives: objectives,
                description: description,
                deliverables: deliverables,
                beneficiaries: beneficiaries,
                region: region,
                dcY1Approval: dcY1Approval,
                gcY1Approval: gcY1Approval,
                execomY1Approval: execomY1Approval,
                dcY2Renewal: dcY2Renewal,
                gcY2Renewal: gcY2Renewal,
                execomY2Renewal: execomY2Renewal,
                dcY3Renewal: dcY3Renewal,
                gcY3Renewal: gcY3Renewal,
                execomY3Renewal: execomY3Renewal,
                mande: formattedMandE,
                y1BudgetRealignment: formattedY1Budget,
                y2BudgetRealignment: formattedY2Budget,
                y3BudgetRealignment: formattedY3Budget,
                status: status,
                bannerProgram: bannerProgram,
                pillar: pillar,
                strategy: strategy,
                tagging: tagging,
                remarks: remarks,
                sixPs: Object.fromEntries(updatedSixPs.map((item) => [String(item.year), item])),
            });

            console.log('Project updated successfully');
            closeModal();
            refresh();
            showToastF();
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Unable to save the project. Please check your connection and administrator access, then try again.');
        }
    };

    const generateFields = () => {
        // Handle imported projects that might not have start/end dates
        if (!project.originalStart || !project.originalEnd) {
            alert('Please set Original Start and Original End dates first');
            return;
        }

        try {
            const startYear = new Date(project.originalStart).getFullYear();
            const endYear = new Date(project.originalEnd).getFullYear();
            const years = endYear - startYear + 1;

            const newSixPsData = Array.from({ length: years }, (_, index) => {
                const year = startYear + index;
                return { year: year.toString(), targetPublication: '', actualaccomplishmentPeer: '', actualaccomplishmentJournal: '', actualaccomplishmentPresented: '', details: '', actualaccomplishmentIEC: '', targetProduct: '', techName: '', techDescription: '', targetPatent: '', agency: '', techNamePro: '', statusSix: '', dost: '', patentNumber: '', targetPeople: '', namesBS: '', namesMS: '', namesPhD: '', targetPlaces: '', cooperators: '', international: '', privateSixPS: '', targetPolicy: '', policyRecommendation: '' };
            });

            setSixPs(newSixPsData);
            
            // Initialize all entries
            const pubEntries = {};
            const prodEntries = {};
            const patEntries = {};
            const peopleEnt = {};
            const placesEnt = {};
            const policyEnt = {};
            
            newSixPsData.forEach(item => {
                pubEntries[item.year] = [{ target: '', actual: '' }];
                prodEntries[item.year] = [{ target: '', actual: '' }];
                patEntries[item.year] = [{ target: '', actual: '' }];
                peopleEnt[item.year] = [{ target: '', actual: '' }];
                placesEnt[item.year] = [{ target: '', actual: '' }];
                policyEnt[item.year] = [{ target: '', actual: '' }];
            });
            
            setPublicationEntries(pubEntries);
            setProductEntries(prodEntries);
            setPatentEntries(patEntries);
            setPeopleEntries(peopleEnt);
            setPlacesEntries(placesEnt);
            setPolicyEntries(policyEnt);
        } catch (error) {
            alert('Error generating fields. Please check the start and end dates.');
            console.error(error);
        }
    };

    const handleFieldChange = (index, field, value) => {
        const updatedData = [...sixPs];
        updatedData[index][field] = value;
        setSixPs(updatedData);
    };

    const handleISPChange = (e) => {
        const selectedValue = e.target.textContent;
        const parentMenu = e.target.closest('.dropdown-menu');
        if (parentMenu && parentMenu.classList.contains('dropdown-submenu')) {
            setISP(`Inland Biodiversity (${selectedValue})`);
        } else {
            setISP(selectedValue);
        }
    };

    const handleResPerChange = (e) => {
        setResponsiblePerson(e.target.innerText);
    };

    const handleFundingChange = (e) => {
        setFunding(e.target.innerText);
    };

    // const handleImplementingChange = (e) => {
    //     setImplementingAgency(e.target.innerText);
    // }

    // const handleCooperatingChange = (e) => {
    //     setCooperatingAgency(e.target.innerText);
    // }  

    const handleRemarksChange = (e) => {
        setRemarks(e.target.innerText);
    }

    const handleRemarkCheckboxChange = (remark) => {
        const selectedRemarks = remarks ? remarks.split(' | ') : [];
        const updatedRemarks = selectedRemarks.includes(remark)
            ? selectedRemarks.filter((selectedRemark) => selectedRemark !== remark)
            : [...selectedRemarks, remark];

        setRemarks(updatedRemarks.join(' | '));
    };

    // const handleDOSTChange = (e) => {
    //     setDOST(e.target.innerText);
    // } 

    const generateBudgetFields = () => {
        const startYear = new Date(originalStart).getFullYear();
        const endYear = new Date(originalEnd).getFullYear();
        const years = endYear - startYear + 1;

        const newBudgetData = Array.from({ length: years }, (_, index) => {
            const year = startYear + index;
            return { year, amount: '' };
        });

        setBudget(newBudgetData);
    };

    const handleBudgetChange = (index, amount) => {
        const updatedBudgetData = [...budget];
        updatedBudgetData[index].amount = amount;
        setBudget(updatedBudgetData);
    };

    // const handleImplementationFileChange = (e) => {
    //     setImplementationFile(e.target.files[0]);
    // };
    // const handleExtensionFileChange = (e) => {
    //     setExtensionFile(e.target.files[0]);
    // };
    // const handleRealignmentFileChange = (e) => {
    //     setRealignmentFile(e.target.files[0]);
    // };

    useEffect(() => {
        const calculateTotalBudget = () => {
            const total = budget.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
            setTotalBudget(total);
        };
        calculateTotalBudget();
    }, [budget]);

    if (!isEditModalOpen || !project) {
        return null;
    }

    return (
        <div>
            <form onSubmit={updateProject}>
                <div className={`modal fade modal-overlay ${isEditModalOpen ? 'show' : ''}`} tabIndex="-1" style={{ display: isEditModalOpen ? 'block' : 'none' }}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: '80rem' }}>
                        <div className="modal-content p-2">
                            <div className="modal-header border-0">
                                <h1 className="modal-title fw-semibold" style={{ fontSize: '18px' }}>Edit Project</h1>
                                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
                                <div
                                    className="toast position-absolute top-10 start-50 translate-middle-x bg-danger"
                                    style={{ display: showToast ? 'block' : 'none' }}
                                    role="alert"
                                    aria-live="assertive"
                                    aria-atomic="true"
                                >
                                    <div className="d-flex">
                                        <div className="toast-body text-white">
                                            Nothing changed
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-body">
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Project Details</b></h5>
                                    <div className="row pt-3">
                                        <div className='col-md-4'>
                                            <label className="pb-2">ISP</label>
                                            <input
                                                className="form-control dropdown-toggle"
                                                type="text"
                                                id="dropISPEdit"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={ISP}
                                                onChange={(e) => setISP(e.target.value)}
                                                placeholder='Select ISP'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropISPEdit">
                                                <li className="dropdown-item" onClick={handleISPChange}>MilkFish</li>
                                                <li className="dropdown-item" onClick={handleISPChange}>Mangrove Crab</li>
                                                <li className="dropdown-item" onClick={handleISPChange}>Shrimp</li>
                                                <li className="dropdown-item" onClick={handleISPChange}>Tilapia</li>
                                                <li className="dropdown-item" onClick={handleISPChange}>Mussel</li>
                                                <li className="dropdown-item" onClick={handleISPChange}>Aquafeeds</li>
                                                <li className="dropdown-item">
                                                    Inland Biodiversity &raquo;
                                                    <ul className="dropdown-menu dropdown-submenu p-0" style={{ marginTop: '-20px' }}>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Lakes</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Knifefish</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Tawilis</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Ayungin</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Catfish</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Climbing Perch</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Eel</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Goby</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Cyprinids</li>
                                                        <li className="dropdown-itemm">
                                                            <input
                                                                className='ps-2 border-0 p-2'
                                                                type="text"
                                                                placeholder="Other..."
                                                                onChange={(e) => setISP(`Inland Biodiversity (${e.target.value})`)}
                                                                style={{ borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px' }}
                                                            />
                                                        </li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className='col-md-4'>
                                            <label className="pb-2">PALIHAN Code(project)</label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                value={projectCode}
                                                onChange={(e) => setProjectCode(e.target.value)}
                                                placeholder='Enter PALIHAN Code(project)'
                                            />
                                        </div>
                                        <div className='col-md-4'>
                                            <label className="pb-2">PALIHAN Code(program)</label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                value={programCode}
                                                onChange={(e) => setProgramCode(e.target.value)}
                                                placeholder='Enter PALIHAN Code(program)'
                                            />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Program Title</label>
                                            <textarea type="text" className="form-control" value={programTitle} onChange={(e) => setProgramTitle(e.target.value)} />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Project Title</label>
                                            <textarea type="text" className="form-control" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Responsible Person</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropResPer"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={responsiblePerson}
                                                onChange={(e) => setResponsiblePerson(e.target.value)}
                                                placeholder='Select Responsible Person'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropResPer">
                                                <li className="dropdown-item" onClick={handleResPerChange}>ATC</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>VGS</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>CVA</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>FFCM</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>KLT</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>GMDO</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>JJSV</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>GRO</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>STG</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>GES</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>AMSP</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>MAI</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>EBRD</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>RBR</li>
                                                <li className="dropdown-itemm">
                                                    <input
                                                        className='ps-2 border-0 p-2'
                                                        type="text"
                                                        placeholder="Other..."
                                                        onChange={(e) => setResponsiblePerson(e.target.value)}
                                                        style={{ borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px' }}
                                                    />
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Funding</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropFunding"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={funding}
                                                onChange={(e) => setFunding(e.target.value)}
                                                placeholder='Select Funding'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropFunding">
                                                <li className="dropdown-item" onClick={handleFundingChange}>DOST GIA</li>
                                                <li className="dropdown-item" onClick={handleFundingChange}>PCAARRD GIA</li>
                                            </ul>
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Implementing Agency</label>
                                            <input type="text" className="form-control" value={implementingAgency} onChange={(e) => setImplementingAgency(e.target.value)} />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Program Leader</label>
                                            <input type="text" className="form-control" value={programLeader} onChange={(e) => setProgramLeader(e.target.value)} />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Project Leader</label>
                                            <input type="text" className="form-control" value={projectLeader} onChange={(e) => setProjectLeader(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Email Address</label>
                                            <input type="email" className="form-control" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Contact Number</label>
                                            <input type="text" className="form-control" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Postal Address</label>
                                            <input type="text" className="form-control" value={postalAddress} onChange={(e) => setPostalAddress(e.target.value)} />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Cooperating Agency</label>
                                            <input type="text" className="form-control" value={cooperatingAgency} onChange={(e) => setCooperatingAgency(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Objectives</label>
                                            <textarea type="text" className="form-control" value={objectives} onChange={(e) => setObjectives(e.target.value)} />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Description</label>
                                            <textarea type="text" className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Deliverables</label>
                                            <textarea type="text" className="form-control" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Beneficiaries</label>
                                            <textarea type="text" className="form-control" value={beneficiaries} onChange={(e) => setBeneficiaries(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Region</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropRegionEdit"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={region}
                                                onChange={(e) => setRegion(e.target.value)}
                                                placeholder='Select Region'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropRegionEdit">
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region I (Ilocos Region)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region II (Cagayan Valley)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region III (Central Luzon)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region IV-A (CALABARZON)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region IV-B (MIMAROPA)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region V (Bicol Region)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region VI (Western Visayas)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region VII (Central Visayas)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region VIII (Eastern Visayas)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region IX (Zamboanga Peninsula)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region X (Northern Mindanao)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region XI (Davao Region)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region XII (SOCCSKSARGEN)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>National Capital Region (NCR)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Cordillera Administrative Region (CAR)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Autonomous Region in Muslim Mindanao (ARMM)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region XIII (Caraga)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Project Duration</b></h5>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">Originally Approved Start Date</label>
                                            <input type="date" className="form-control" value={originalStart} onChange={(e) => setOriginalStart(e.target.value)} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">Originally Approved End Date</label>
                                            <input type="date" className="form-control" value={originalEnd} onChange={(e) => setOriginalEnd(e.target.value)} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">New Implementation Start Date</label>
                                            <input type="date" className="form-control" value={changeStart} onChange={(e) => setChangeStart(e.target.value)} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">New Implementation End Date</label>
                                            <input type="date" className="form-control" value={changeImplementationDate} onChange={(e) => setChangeImplementationDate(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">First Extension</label>
                                            <div className="pb-2 d-flex align-items-center">
                                                <div className='pb-2'>
                                                    <input
                                                        type="radio"
                                                        value="single"
                                                        checked={firstExtension.type === 'single'}
                                                        onChange={() => handleFirstExtensionChange('type', 'single')}
                                                    />
                                                    <label className='me-2'>Single</label>
                                                    <input
                                                        type="radio"
                                                        value="range"
                                                        checked={firstExtension.type === 'range'}
                                                        onChange={() => handleFirstExtensionChange('type', 'range')}
                                                    />
                                                    <label className='me-2'>Range</label>
                                                </div>
                                                {firstExtension.type === 'single' ? (
                                                    <div className='pb-2'>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={firstExtension.value || ''}
                                                            onChange={(e) => handleFirstExtensionChange('value', e.target.value)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className='pb-2 d-flex align-items-center'>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={firstExtension.value || ''}
                                                            onChange={(e) => handleFirstExtensionChange('value', e.target.value)}
                                                        />
                                                        <label className='mx-2'>-</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={firstExtension.end || ''}
                                                            onChange={(e) => handleFirstExtensionChange('end', e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">2nd Extension</label>
                                            <div className="pb-2 d-flex align-items-center">
                                                <div className='pb-2'>
                                                    <input
                                                        type="radio"
                                                        value="single"
                                                        checked={secondExtension.type === 'single'}
                                                        onChange={() => handleSecondExtensionChange('type', 'single')}
                                                    />
                                                    <label className='me-2'>Single</label>
                                                    <input
                                                        type="radio"
                                                        value="range"
                                                        checked={secondExtension.type === 'range'}
                                                        onChange={() => handleSecondExtensionChange('type', 'range')}
                                                    />
                                                    <label className='me-2'>Range</label>
                                                </div>
                                                {secondExtension.type === 'single' ? (
                                                    <div className='pb-2'>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={secondExtension.value || ''}
                                                            onChange={(e) => handleSecondExtensionChange('value', e.target.value)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className='pb-2 d-flex align-items-center'>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={secondExtension.value || ''}
                                                            onChange={(e) => handleSecondExtensionChange('value', e.target.value)}
                                                        />
                                                        <label className='mx-2'>-</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={secondExtension.end || ''}
                                                            onChange={(e) => handleSecondExtensionChange('end', e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* <div className='row pt-3'>
                                        <div className='col'>
                                            <label className="pb-2">Supporting File (Change Implementation)</label>
                                            <input type="file" className='form-control' onChange={handleImplementationFileChange} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">Supporting File (Extension)</label>
                                            <input type="file" className='form-control' onChange={handleExtensionFileChange} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">Supporting File (Budget Realignment)</label>
                                            <input type="file" className='form-control' onChange={handleRealignmentFileChange} />
                                        </div>
                                    </div> */}
                                    <div className='row pt-3'>
                                        {!budget.length ? (
                                            <div className='col'>
                                                <button type="button" className="btn btn-dark px-3 py-2 border" onClick={generateBudgetFields} style={{ fontSize: '14px' }}>
                                                    Generate Budget Fields
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Budget</b></h5>
                                    <div className="row pt-3">
                                        {budget.map((item, index) => (
                                            <div key={index} className="col">
                                                <label className="pb-2">Year {index + 1}</label>
                                                <CurrencyInput
                                                    id={`input-${index}`}
                                                    name={`input-name-${index}`}
                                                    placeholder="Enter amount"
                                                    value={item.amount && item.amount !== 0 ? item.amount : ''}
                                                    decimalsLimit={2}
                                                    onValueChange={(value) => handleBudgetChange(index, parseFloat(value) || 0)}
                                                    className='form-control'
                                                />
                                            </div>
                                        ))}
                                        <div className="col">
                                            <label className="pb-2">Total Budget</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={totalBudget !== undefined && totalBudget !== null && totalBudget !== '' ? (typeof totalBudget === 'number' ? totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : parseFloat(totalBudget.toString().replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : '0.00'}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Meetings</b></h5>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">Inception Meeting</label>
                                            <div className="pb-2 d-flex align-items-center">
                                                <div className='pb-2'>
                                                    <input
                                                        type="radio"
                                                        value="single"
                                                        checked={inceptionMeeting.type === 'single'}
                                                        onChange={() => handleInceptionChange('type', 'single')}
                                                    />
                                                    <label className='me-2'>Single</label>
                                                    <input
                                                        type="radio"
                                                        value="range"
                                                        checked={inceptionMeeting.type === 'range'}
                                                        onChange={() => handleInceptionChange('type', 'range')}
                                                    />
                                                    <label className='me-2'>Range</label>
                                                </div>
                                                {inceptionMeeting.type === 'single' ? (
                                                    <div className='pb-2'>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={inceptionMeeting.value || ''}
                                                            onChange={(e) => handleInceptionChange('value', e.target.value)}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className='pb-2 d-flex align-items-center'>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={inceptionMeeting.value || ''}
                                                            onChange={(e) => handleInceptionChange('value', e.target.value)}
                                                        />
                                                        <label className='mx-2'>-</label>
                                                        <input
                                                            type="date"
                                                            className="form-control"
                                                            value={inceptionMeeting.end || ''}
                                                            onChange={(e) => handleInceptionChange('end', e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">M&E</label>
                                            <span className="btn p-0 px-2" onClick={handleAddMandE}>
                                                <i className="bi bi-plus-circle text-primary"></i>
                                            </span>
                                            {mande.map((date, index) => (
                                                <div key={index} className="d-flex align-items-start pb-2">
                                                    <div className="me-3 my-2">
                                                        <input
                                                            type="radio"
                                                            value="single"
                                                            checked={date.type === 'single'}
                                                            onChange={(e) => handleMandEChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className="form-check-label ms-1 me-2">Single</label>
                                                        <input
                                                            type="radio"
                                                            value="range"
                                                            checked={date.type === 'range'}
                                                            onChange={(e) => handleMandEChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className="form-check-label ms-1 me-2">Range</label>
                                                    </div>
                                                    {date.type === 'single' ? (
                                                        <div className="me-3">
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleMandEChange(index, 'value', e.target.value, 'single')}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex align-items-center me-3">
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleMandEChange(index, 'value', e.target.value, 'range')}
                                                            />
                                                            <label className="mx-2">-</label>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.end || ''}
                                                                onChange={(e) => handleMandEChange(index, 'end', e.target.value, 'range')}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex-grow-1 me-3">
                                                        <textarea
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="Comment"
                                                            value={date.comment || ''}
                                                            onChange={(e) => handleMandEChange(index, 'comment', e.target.value)}
                                                            rows="1"
                                                        />
                                                    </div>
                                                    <span className="btn p-0 text-danger my-2" onClick={() => handleRemoveMandE(index)}>
                                                        <i className="bi bi-dash-circle"></i>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Approvals</b></h5>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">DC Y1 Approval</label>
                                            <input type="date" className="form-control" value={dcY1Approval} onChange={(e) => setDcY1Approval(e.target.value)} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">GC Y1 Approval</label>
                                            <input type="date" className="form-control" value={gcY1Approval} onChange={(e) => setGcY1Approval(e.target.value)} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">Execom Y1 Approval</label>
                                            <input type="date" className="form-control" value={execomY1Approval} onChange={(e) => setExecomY1Approval(e.target.value)} />
                                        </div>
                                    </div>
                                    <h5 className='pt-3'><b>Renewals</b></h5>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">DC Y2 Renewal</label>
                                            <input type="date" className="form-control" value={dcY2Renewal} onChange={(e) => setDcY2Renewal(e.target.value)} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">GC Y2 Renewal</label>
                                            <input type="date" className="form-control" value={gcY2Renewal} onChange={(e) => setGcY2Renewal(e.target.value)} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">Execom Y2 Renewal</label>
                                            <input type="date" className="form-control" value={execomY2Renewal} onChange={(e) => setExecomY2Renewal(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">DC Y3 Renewal</label>
                                            <input type="date" className="form-control" value={dcY3Renewal} onChange={(e) => setDcY3Renewal(e.target.value)} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">GC Y3 Renewal</label>
                                            <input type="date" className="form-control" value={gcY3Renewal} onChange={(e) => setGcY3Renewal(e.target.value)} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">Execom Y3 Renewal</label>
                                            <input type="date" className="form-control" value={execomY3Renewal} onChange={(e) => setExecomY3Renewal(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Budget Realignment</b></h5>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className='pb-2'>Y1 Budget Realignment</label>
                                            <span className='btn p-0 px-2' onClick={handleAddY1Budget}><i className="bi bi-plus-circle text-primary"></i></span>
                                            {y1BudgetRealignment.map((date, index) => (
                                                <div key={index} className="pb-2 d-flex align-items-center">
                                                    <div className="pb-2">
                                                        <input
                                                            type="radio"
                                                            value="single"
                                                            checked={date.type === 'single'}
                                                            onChange={(e) => handleY1BudgetChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className='me-2'>Single</label>
                                                        <input
                                                            type="radio"
                                                            value="range"
                                                            checked={date.type === 'range'}
                                                            onChange={(e) => handleY1BudgetChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className='me-2'>Range</label>
                                                    </div>
                                                    {date.type === 'single' ? (
                                                        <div className='pb-2'>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleY1BudgetChange(index, 'value', e.target.value, 'single')}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className='pb-2 d-flex align-items-center'>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleY1BudgetChange(index, 'value', e.target.value, 'range')}
                                                            />
                                                            <label className='mx-2'>-</label>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.end || ''}
                                                                onChange={(e) => handleY1BudgetChange(index, 'end', e.target.value, 'range')}
                                                            />
                                                        </div>
                                                    )}
                                                    <span className="btn p-0 mx-2 mb-1 text-danger" onClick={() => handleRemoveY1Budget(index)}><i className="bi bi-dash-circle"></i></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Y2 Budget Realignment</label>
                                            <span className='btn p-0 px-2' onClick={handleAddY2Budget}><i className="bi bi-plus-circle text-primary"></i></span>
                                            {y2BudgetRealignment.map((date, index) => (
                                                <div key={index} className="pb-2 d-flex align-items-center">
                                                    <div className="pb-2">
                                                        <input
                                                            type="radio"
                                                            value="single"
                                                            checked={date.type === 'single'}
                                                            onChange={(e) => handleY2BudgetChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className='me-2'>Single</label>
                                                        <input
                                                            type="radio"
                                                            value="range"
                                                            checked={date.type === 'range'}
                                                            onChange={(e) => handleY2BudgetChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className='me-2'>Range</label>
                                                    </div>
                                                    {date.type === 'single' ? (
                                                        <div className='pb-2'>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleY2BudgetChange(index, 'value', e.target.value, 'single')}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className='pb-2 d-flex align-items-center'>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleY2BudgetChange(index, 'value', e.target.value, 'range')}
                                                            />
                                                            <label className='mx-2'>-</label>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.end || ''}
                                                                onChange={(e) => handleY2BudgetChange(index, 'end', e.target.value, 'range')}
                                                            />
                                                        </div>
                                                    )}
                                                    <span className="btn p-0 mx-2 mb-1 text-danger" onClick={() => handleRemoveY2Budget(index)}><i className="bi bi-dash-circle"></i></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Y3 Budget Realignment</label>
                                            <span className='btn p-0 px-2' onClick={handleAddY3Budget}><i className="bi bi-plus-circle text-primary"></i></span>
                                            {y3BudgetRealignment.map((date, index) => (
                                                <div key={index} className="pb-2 d-flex align-items-center">
                                                    <div className="pb-2">
                                                        <input
                                                            type="radio"
                                                            value="single"
                                                            checked={date.type === 'single'}
                                                            onChange={(e) => handleY3BudgetChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className='me-2'>Single</label>
                                                        <input
                                                            type="radio"
                                                            value="range"
                                                            checked={date.type === 'range'}
                                                            onChange={(e) => handleY3BudgetChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className='me-2'>Range</label>
                                                    </div>
                                                    {date.type === 'single' ? (
                                                        <div className='pb-2'>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleY3BudgetChange(index, 'value', e.target.value, 'single')}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className='pb-2 d-flex align-items-center'>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleY3BudgetChange(index, 'value', e.target.value, 'range')}
                                                            />
                                                            <label className='mx-2'>-</label>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.end || ''}
                                                                onChange={(e) => handleY3BudgetChange(index, 'end', e.target.value, 'range')}
                                                            />
                                                        </div>
                                                    )}
                                                    <span className="btn p-0 mx-2 mb-1 text-danger" onClick={() => handleRemoveY3Budget(index)}><i className="bi bi-dash-circle"></i></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Reviews</b></h5>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">Program Review</label>
                                            <span className='btn p-0 px-2' onClick={handleAddPReview}><i className="bi bi-plus-circle text-primary"></i></span>
                                            {programReview.map((date, index) => (
                                                <div key={index} className="pb-2 d-flex align-items-center">
                                                    <div className="pb-2">
                                                        <input
                                                            type="radio"
                                                            value="single"
                                                            checked={date.type === 'single'}
                                                            onChange={(e) => handleProgramReviewChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className='me-2'>Single</label>
                                                        <input
                                                            type="radio"
                                                            value="range"
                                                            checked={date.type === 'range'}
                                                            onChange={(e) => handleProgramReviewChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className='me-2'>Range</label>
                                                    </div>
                                                    {date.type === 'single' ? (
                                                        <div className='pb-2'>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleProgramReviewChange(index, 'value', e.target.value, 'single')}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className='pb-2 d-flex align-items-center'>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleProgramReviewChange(index, 'value', e.target.value, 'range')}
                                                            />
                                                            <label className='mx-2'>-</label>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.end || ''}
                                                                onChange={(e) => handleProgramReviewChange(index, 'end', e.target.value, 'range')}
                                                            />
                                                        </div>
                                                    )}
                                                    <span className="btn p-0 mx-2 mb-1 text-danger" onClick={() => handleRemovePReview(index)}><i className="bi bi-dash-circle"></i></span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">Terminal Review</label>
                                            <span className='btn p-0 px-2' onClick={handleAddTReview}><i className="bi bi-plus-circle text-primary"></i></span>
                                            {terminalReview.map((date, index) => (
                                                <div key={index} className="pb-2 d-flex align-items-center">
                                                    <div className="pb-2">
                                                        <input
                                                            type="radio"
                                                            value="single"
                                                            checked={date.type === 'single'}
                                                            onChange={(e) => handleTerminalReviewChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className='me-2'>Single</label>
                                                        <input
                                                            type="radio"
                                                            value="range"
                                                            checked={date.type === 'range'}
                                                            onChange={(e) => handleTerminalReviewChange(index, 'type', e.target.value, e.target.value)}
                                                        />
                                                        <label className='me-2'>Range</label>
                                                    </div>
                                                    {date.type === 'single' ? (
                                                        <div className='pb-2'>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleTerminalReviewChange(index, 'value', e.target.value, 'single')}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className='pb-2 d-flex align-items-center'>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.value || ''}
                                                                onChange={(e) => handleTerminalReviewChange(index, 'value', e.target.value, 'range')}
                                                            />
                                                            <label className='mx-2'>-</label>
                                                            <input
                                                                type="date"
                                                                className="form-control"
                                                                value={date.end || ''}
                                                                onChange={(e) => handleTerminalReviewChange(index, 'end', e.target.value, 'range')}
                                                            />
                                                        </div>
                                                    )}
                                                    <span className="btn p-0 mx-2 mb-1 text-danger" onClick={() => handleRemoveTReview(index)}><i className="bi bi-dash-circle"></i></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className='row pb-2'>
                                        <div className='col'>
                                            <label className="pb-2">Submission/Acceptance of Terminal Report</label>
                                            <input type="date" className="form-control" value={submissionTerminal} onChange={(e) => setSubmissionTerminal(e.target.value)} />
                                        </div>
                                        <div className='col'></div>
                                    </div>
                                </div>
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Status</b></h5>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">Status</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropStatus"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                placeholder='Select Status'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropStatus">
                                                <li className="dropdown-item" onClick={() => setStatus('')}>Select Status</li>
                                                <li className="dropdown-item" onClick={(e) => setStatus(e.target.innerText)}>New</li>
                                                <li className="dropdown-item" onClick={(e) => setStatus(e.target.innerText)}>On-going</li>
                                                <li className="dropdown-item" onClick={(e) => setStatus(e.target.innerText)}>Completed</li>
                                                <li className="dropdown-item" onClick={(e) => setStatus(e.target.innerText)}>Liquidated</li>
                                                <li className="dropdown-item" onClick={(e) => setStatus(e.target.innerText)}>Ongoing Liquidation</li>
                                                <li className="dropdown-item" onClick={(e) => setStatus(e.target.innerText)}>Unliquidated</li>
                                                <li className="dropdown-item" onClick={(e) => setStatus(e.target.innerText)}>Cleared</li>
                                                <li className="dropdown-item" onClick={(e) => setStatus(e.target.innerText)}>Interminated</li>
                                                <li className="dropdown-item" onClick={(e) => setStatus(e.target.innerText)}>Terminated</li>
                                            </ul>
                                        </div>
                                        <div className='col' style={{ opacity: status === 'Completed' ? 1 : 0.5 }}>
                                            <label className="pb-2">Remarks</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropRemarks"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder='Select Remarks'
                                                disabled={status !== 'Completed'}
                                            />
                                            <ul
                                                className="dropdown-menu p-0"
                                                aria-labelledby="dropRemarks"
                                                style={{
                                                    maxHeight: '240px',
                                                    overflowY: 'auto',
                                                    whiteSpace: 'normal',
                                                    pointerEvents: status === 'Completed' ? 'auto' : 'none',
                                                }}
                                            >
                                                <li className="dropdown-item" onClick={() => setRemarks('')}>Select Remarks</li>
                                                {remarkOptions.map((remark) => (
                                                    <li className="dropdown-item" key={remark}>
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`remark-${remark}`}
                                                                checked={remarks.split(' | ').includes(remark)}
                                                                onChange={() => handleRemarkCheckboxChange(remark)}
                                                            />
                                                            <label className="form-check-label" htmlFor={`remark-${remark}`}>
                                                                {remark}
                                                            </label>
                                                        </div>
                                                    </li>
                                                ))}
                                                <li className="dropdown-item" onClick={() => setRemarks('')}>Others</li>
                                            </ul>
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">Banner Program</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropBannerProgram"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={bannerProgram}
                                                onChange={(e) => setBannerProgram(e.target.value)}
                                                placeholder='Select Banner Program'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropBannerProgram">
                                                <li className="dropdown-item" onClick={() => setBannerProgram('')}>Select Banner Program</li>
                                                <li className="dropdown-item" onClick={(e) => setBannerProgram(e.target.innerText)}>Strategic R&D</li>
                                                <li className="dropdown-item" onClick={(e) => setBannerProgram(e.target.innerText)}>R&D Results utilization</li>
                                                <li className="dropdown-item" onClick={(e) => setBannerProgram(e.target.innerText)}>Policy Research and Advocacy</li>
                                                <li className="dropdown-item" onClick={(e) => setBannerProgram(e.target.innerText)}>Capacity Building and R&D Governance</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">Pillar</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropPillar"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={pillar}
                                                onChange={(e) => setPillar(e.target.value)}
                                                placeholder='Select Pillar'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropPillar">
                                                <li className="dropdown-item" onClick={() => setPillar('')}>Select Pillar</li>
                                                <li className="dropdown-item" onClick={(e) => setPillar(e.target.innerText)}>Pillar 1: Human Well-Being</li>
                                                <li className="dropdown-item" onClick={(e) => setPillar(e.target.innerText)}>Pillar 2: Wealth Creation</li>
                                                <li className="dropdown-item" onClick={(e) => setPillar(e.target.innerText)}>Pillar 3: Wealth Protection</li>
                                                <li className="dropdown-item" onClick={(e) => setPillar(e.target.innerText)}>Pillar 4: Sustainability</li>
                                            </ul>
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">Strategy</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropStrategy"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={strategy}
                                                onChange={(e) => setStrategy(e.target.value)}
                                                placeholder='Select Strategy'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropStrategy">
                                                <li className="dropdown-item" onClick={() => setStrategy('')}>Select Strategy</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 1: Achieve Quality Science Education and Enhance Employability of S&T Talents</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 2: Ensure Food Security</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 3: Improve Health and Nutrition</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 4: Improve Access to Clean Water, Clothing, and Shelter</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 5: Advance Research, Development, and Innovation</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 6: Scale-up Technology Adoption, Utilization and Commercialization</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 7: Strengthen Provision of STI Support Services for the Production and Manufacturing Sectors</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 8: Boost Intellectual Property Management and Protection for Locally-developed Technologies</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 9: Advance Disaster Risk Reduction Management and Processes</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 10: Improve Monitoring and Warning Systems for Risk Reduction</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 11: Strengthen Capacities for Local Disaster Risk Reduction and Management (DRRM)</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 12: Enhance Climate and Disaster Risk Resilience</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 13: Intensify Environmental Sustainability</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 14: Enhance Ecosystem Resilience</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 15: Establish Smart and Sustainable Communities</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 16: Improve Access to Clean and Green Energy</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 17: Institutionalize Science Communication</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 18: Build Robust Institutional Capacity</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 19: Roll-out S&T-enabled Systems for Seamless Operations</li>
                                                <li className="dropdown-item" onClick={(e) => setStrategy(e.target.innerText)}>Strategy 20: Enhance Linkages for Science, Technology, Innovation, and Entrepreneurship Cooperation</li>
                                            </ul>
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">Tagging</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropTagging"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={tagging}
                                                onChange={(e) => setTagging(e.target.value)}
                                                placeholder='Select Tagging'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropTagging">
                                                <li className="dropdown-item" onClick={() => setTagging('')}>Select Tagging</li>
                                                <li className="dropdown-item" onClick={(e) => setTagging(e.target.innerText)}>Smart</li>
                                                <li className="dropdown-item" onClick={(e) => setTagging(e.target.innerText)}>Climate change</li>
                                                <li className="dropdown-item" onClick={(e) => setTagging(e.target.innerText)}>Biodive</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>6Ps</b></h5>
                                    {sixPs && sixPs.length > 0 ? (
                                        <>
                                            <select value={selectedYear} onChange={handleYearChange} className="form-select mb-3">
                                                <option value="">Select Year</option>
                                                {sixPs.map((item) => (
                                                    <option key={item.year} value={item.year}>{item.year}</option>
                                                ))}
                                            </select>
                                            {selectedYear && (
                                                <>
                                                    {sixPs.map((item, index) => (
                                                        <div key={index}>
                                                            {item.year === selectedYear && (
                                                                <>
                                                                    <h6 className='pt-3 fw-bold'>Year: {item.year}</h6>
                                                                    <div className="d-flex justify-content-between align-items-center pt-3">
                                                                        <h6 className='fw-semibold mb-0'>Publication</h6>
                                                                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddPublicationEntry(item.year)}>
                                                                            <i className="bi bi-plus"></i> Add Target
                                                                        </button>
                                                                    </div>
                                                                    {publicationEntries[item.year] && publicationEntries[item.year].map((entry, entryIndex) => (
                                                                        <div key={entryIndex} className="row pt-3">
                                                                            <div className='col'>
                                                                                <label className="pb-2">Target {entryIndex + 1}</label>
                                                                                <textarea type="text" className="form-control" value={entry.target} onChange={(e) => handlePublicationEntryChange(item.year, entryIndex, 'target', e.target.value)} rows="1" />
                                                                            </div>
                                                                            <div className='col'>
                                                                                <label className="pb-2">Actual {entryIndex + 1}</label>
                                                                                <div className="d-flex">
                                                                                    <textarea type="text" className="form-control" value={entry.actual} onChange={(e) => handlePublicationEntryChange(item.year, entryIndex, 'actual', e.target.value)} rows="1" />
                                                                                    {publicationEntries[item.year].length > 1 && (
                                                                                        <button type="button" className="btn btn-sm btn-danger ms-2" onClick={() => handleRemovePublicationEntry(item.year, entryIndex)}>
                                                                                            <i className="bi bi-trash"></i>
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <div className="d-flex justify-content-between align-items-center pt-3">
                                                                        <h6 className='fw-semibold mb-0'>Product</h6>
                                                                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddProductEntry(item.year)}>
                                                                            <i className="bi bi-plus"></i> Add Target
                                                                        </button>
                                                                    </div>
                                                                    {productEntries[item.year] && productEntries[item.year].map((entry, entryIndex) => (
                                                                        <div key={entryIndex} className="row pt-3">
                                                                            <div className='col'>
                                                                                <label className="pb-2">Target {entryIndex + 1}</label>
                                                                                <textarea type="text" className="form-control" value={entry.target} onChange={(e) => handleProductEntryChange(item.year, entryIndex, 'target', e.target.value)} rows="1" />
                                                                            </div>
                                                                            <div className='col'>
                                                                                <label className="pb-2">Actual {entryIndex + 1}</label>
                                                                                <div className="d-flex">
                                                                                    <textarea type="text" className="form-control" value={entry.actual} onChange={(e) => handleProductEntryChange(item.year, entryIndex, 'actual', e.target.value)} rows="1" />
                                                                                    {productEntries[item.year].length > 1 && (
                                                                                        <button type="button" className="btn btn-sm btn-danger ms-2" onClick={() => handleRemoveProductEntry(item.year, entryIndex)}>
                                                                                            <i className="bi bi-trash"></i>
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <div className="d-flex justify-content-between align-items-center pt-3">
                                                                        <h6 className='fw-semibold mb-0'>Patent</h6>
                                                                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddPatentEntry(item.year)}>
                                                                            <i className="bi bi-plus"></i> Add Target
                                                                        </button>
                                                                    </div>
                                                                    {patentEntries[item.year] && patentEntries[item.year].map((entry, entryIndex) => (
                                                                        <div key={entryIndex} className="row pt-3">
                                                                            <div className='col'>
                                                                                <label className="pb-2">Target {entryIndex + 1}</label>
                                                                                <textarea type="text" className="form-control" value={entry.target} onChange={(e) => handlePatentEntryChange(item.year, entryIndex, 'target', e.target.value)} rows="1" />
                                                                            </div>
                                                                            <div className='col'>
                                                                                <label className="pb-2">Actual {entryIndex + 1}</label>
                                                                                <div className="d-flex">
                                                                                    <textarea type="text" className="form-control" value={entry.actual} onChange={(e) => handlePatentEntryChange(item.year, entryIndex, 'actual', e.target.value)} rows="1" />
                                                                                    {patentEntries[item.year].length > 1 && (
                                                                                        <button type="button" className="btn btn-sm btn-danger ms-2" onClick={() => handleRemovePatentEntry(item.year, entryIndex)}>
                                                                                            <i className="bi bi-trash"></i>
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <div className="d-flex justify-content-between align-items-center pt-3">
                                                                        <h6 className='fw-semibold mb-0'>People and Services</h6>
                                                                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddPeopleEntry(item.year)}>
                                                                            <i className="bi bi-plus"></i> Add Target
                                                                        </button>
                                                                    </div>
                                                                    {peopleEntries[item.year] && peopleEntries[item.year].map((entry, entryIndex) => (
                                                                        <div key={entryIndex} className="row pt-3">
                                                                            <div className='col'>
                                                                                <label className="pb-2">Target {entryIndex + 1}</label>
                                                                                <textarea type="text" className="form-control" value={entry.target} onChange={(e) => handlePeopleEntryChange(item.year, entryIndex, 'target', e.target.value)} rows="1" />
                                                                            </div>
                                                                            <div className='col'>
                                                                                <label className="pb-2">Actual {entryIndex + 1}</label>
                                                                                <div className="d-flex">
                                                                                    <input type="text" className="form-control" value={entry.actual} onChange={(e) => handlePeopleEntryChange(item.year, entryIndex, 'actual', e.target.value)} />
                                                                                    {peopleEntries[item.year].length > 1 && (
                                                                                        <button type="button" className="btn btn-sm btn-danger ms-2" onClick={() => handleRemovePeopleEntry(item.year, entryIndex)}>
                                                                                            <i className="bi bi-trash"></i>
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <div className="d-flex justify-content-between align-items-center pt-3">
                                                                        <h6 className='fw-semibold mb-0'>Places and Partnership</h6>
                                                                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddPlacesEntry(item.year)}>
                                                                            <i className="bi bi-plus"></i> Add Target
                                                                        </button>
                                                                    </div>
                                                                    {placesEntries[item.year] && placesEntries[item.year].map((entry, entryIndex) => (
                                                                        <div key={entryIndex} className="row pt-3">
                                                                            <div className='col'>
                                                                                <label className="pb-2">Target {entryIndex + 1}</label>
                                                                                <textarea type="text" className="form-control" value={entry.target} onChange={(e) => handlePlacesEntryChange(item.year, entryIndex, 'target', e.target.value)} rows="1" />
                                                                            </div>
                                                                            <div className='col'>
                                                                                <label className="pb-2">Actual {entryIndex + 1}</label>
                                                                                <div className="d-flex">
                                                                                    <input type="text" className="form-control" value={entry.actual} onChange={(e) => handlePlacesEntryChange(item.year, entryIndex, 'actual', e.target.value)} />
                                                                                    {placesEntries[item.year].length > 1 && (
                                                                                        <button type="button" className="btn btn-sm btn-danger ms-2" onClick={() => handleRemovePlacesEntry(item.year, entryIndex)}>
                                                                                            <i className="bi bi-trash"></i>
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <div className="d-flex justify-content-between align-items-center pt-3">
                                                                        <h6 className='fw-semibold mb-0'>Policy</h6>
                                                                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddPolicyEntry(item.year)}>
                                                                            <i className="bi bi-plus"></i> Add Target
                                                                        </button>
                                                                    </div>
                                                                    {policyEntries[item.year] && policyEntries[item.year].map((entry, entryIndex) => (
                                                                        <div key={entryIndex} className="row pt-3">
                                                                            <div className='col'>
                                                                                <label className="pb-2">Target {entryIndex + 1}</label>
                                                                                <input type="text" className="form-control" value={entry.target} onChange={(e) => handlePolicyEntryChange(item.year, entryIndex, 'target', e.target.value)} />
                                                                            </div>
                                                                            <div className='col'>
                                                                                <label className="pb-2">Actual {entryIndex + 1}</label>
                                                                                <div className="d-flex">
                                                                                    <input type="text" className="form-control" value={entry.actual} onChange={(e) => handlePolicyEntryChange(item.year, entryIndex, 'actual', e.target.value)} />
                                                                                    {policyEntries[item.year].length > 1 && (
                                                                                        <button type="button" className="btn btn-sm btn-danger ms-2" onClick={() => handleRemovePolicyEntry(item.year, entryIndex)}>
                                                                                            <i className="bi bi-trash"></i>
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className='col'>
                                            <button type="button" className="btn btn-dark px-3 py-2 border" onClick={generateFields} style={{ fontSize: '14px' }}>
                                                Generate Fields
                                            </button>
                                        </div>
                                    )}
                                </div>



                                {/* <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Files</b></h5>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">For Budget Realignment</label>
                                            <input type="file" className="form-control" onChange={(e) => handleBudgetRealignmentFileChange(e.target.files[0])} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">For Change Implementation Date</label>
                                            <input type="file" className="form-control" onChange={(e) => handleChangeImplementationFileChange(e.target.files[0])} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">For Extension</label>
                                            <input type="file" className="form-control" onChange={(e) => handleExtensionFileChange(e.target.files[0])} />
                                        </div>
                                    </div>
                                </div> */}
                            </div>
                            <div className="modal-footer border-0">
                                <button type="button" className="btn btn-outline px-3 py-2 border text-black" style={{ fontSize: '14px' }} onClick={closeModal}>Cancel</button>
                                <button className="btn btn-dark px-3 py-2 border" style={{ fontSize: '14px' }}>Update</button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default EditProjectModal;
