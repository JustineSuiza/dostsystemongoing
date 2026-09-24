import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import { Tooltip } from 'react-tooltip';
import './Projects.css'
import EditProjectModal from './EditProjectModal';
import FilterProjectModal from './FilterProjectModal';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { useLocation } from "react-router-dom";
import AddProjectFilesModal from './AddProjectFilesModal';
import ImageModal from './ImageModal';
import FileModal from './FileModal';
import { pdfjs } from 'react-pdf';
import PdfModal from './PdfModal';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const ProjectTitleCell = ({ title }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <span
            title={title}
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
                display: isExpanded ? 'block' : '-webkit-box',
                width: '100%',
                overflow: 'hidden',
                textOverflow: isExpanded ? 'clip' : 'ellipsis',
                whiteSpace: isExpanded ? 'normal' : undefined,
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: isExpanded ? 'unset' : 3,
                overflowWrap: 'anywhere',
                cursor: 'pointer',
            }}
        >
            {title}
        </span>
    );
};

const ProjectActionsDropdown = ({ row, onView, onEdit, onAddFile, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const [menuStyle, setMenuStyle] = useState({});

    useEffect(() => {
        if (!isOpen) return;

        const position = () => {
            const rect = buttonRef.current?.getBoundingClientRect();
            if (!rect) return;
            const menuWidth = 234;
            const top = rect.bottom + 4;
            const left = Math.max(8, Math.min(rect.left - menuWidth, window.innerWidth - menuWidth - 8));
            setMenuStyle({
                top: `${top}px`,
                left: `${left}px`,
                maxHeight: `calc(100vh - ${top + 8}px)`,
                overflowY: 'auto',
            });
        };

        position();
        window.addEventListener('scroll', position, true);
        window.addEventListener('resize', position);

        const handleOutsideClick = (e) => {
            const menu = menuRef.current;
            const button = buttonRef.current;
            if (menu && !menu.contains(e.target) && button && !button.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            window.removeEventListener('scroll', position, true);
            window.removeEventListener('resize', position);
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen]);

    return (
        <>
            <button
                ref={buttonRef}
                className="btn btn-outline rounded-circle"
                style={{ paddingInline: '11px' }}
                type="button"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <i className="fa-solid fa-ellipsis"></i>
            </button>
            {isOpen &&
                createPortal(
                    <ul
                        ref={menuRef}
                        className="dropdown-menu border-0 p-0 m-0 h-auto w-auto shadow-lg text-start show"
                        style={{ position: 'fixed', zIndex: 1060, minWidth: '250px', ...menuStyle }}
                    >
                        <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => setIsOpen(false)}>
                            <div className="d-flex align-items-center" data-bs-toggle="modal" data-bs-target="#viewModal" onClick={() => onView(row)}>
                                <div className='p-1 px-2 pt-1 me-1'>
                                    <i className="bi bi-info-circle fs-5"></i>
                                </div>
                                <div className='d-flex flex-column'>
                                    <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>View Project Details</div>
                                </div>
                            </div>
                        </li>
                        <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => setIsOpen(false)}>
                            <Link to="/DOST/Budgets" state={row.projectTitle} className="text-black">
                                <div className="d-flex align-items-center">
                                    <div className='p-1 px-2 pt-1 me-1'>
                                        <i className="bi bi-cash-coin fs-5"></i>
                                    </div>
                                    <div className='d-flex flex-column'>
                                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>View Budget</div>
                                    </div>
                                </div>
                            </Link>
                        </li>
                        <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => setIsOpen(false)}>
                            <Link to="/DOST/Releases" state={row.projectTitle} className="text-black">
                                <div className="d-flex align-items-center">
                                    <div className='p-1 px-2 pt-1 me-1'>
                                        <i className="bi bi-r-circle fs-5"></i>
                                    </div>
                                    <div className='d-flex flex-column'>
                                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>View Releases</div>
                                    </div>
                                </div>
                            </Link>
                        </li>
                        <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => setIsOpen(false)}>
                            <Link to="/DOST/Counterpart-Funds" state={row.projectTitle} className="text-black">
                                <div className="d-flex align-items-center">
                                    <div className='p-1 px-2 pt-1 me-1'>
                                        <i className="bi bi-wallet2 fs-5"></i>
                                    </div>
                                    <div className='d-flex flex-column'>
                                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>View Counterpart Funds</div>
                                    </div>
                                </div>
                            </Link>
                        </li>
                        <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => { setIsOpen(false); onEdit(row); }}>
                            <div className="d-flex align-items-center">
                                <div className='p-1 px-2 pt-1 me-1'>
                                    <i className="bi bi-pencil-square fs-5"></i>
                                </div>
                                <div className='d-flex flex-column float'>
                                    <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>Edit</div>
                                </div>
                            </div>
                        </li>
                        <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => { setIsOpen(false); onAddFile(row); }}>
                            <div className="d-flex align-items-center">
                                <div className='p-1 px-2 pt-1 me-1'>
                                    <i className="bi bi-folder-plus fs-5"></i>
                                </div>
                                <div className='d-flex flex-column float'>
                                    <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>Add/Update Files</div>
                                </div>
                            </div>
                        </li>
                        <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => { setIsOpen(false); onDelete(row.id); }}>
                            <div className="d-flex align-items-center">
                                <div className='p-1 px-2 pt-1 me-1'>
                                    <i className="bi bi-trash fs-5 text-danger"></i>
                                </div>
                                <div className='d-flex flex-column float'>
                                    <div className='fw-medium text-danger' style={{ fontSize: '13px', paddingTop: '2px' }}>Delete</div>
                                </div>
                            </div>
                        </li>
                    </ul>,
                    document.body
                )}
        </>
    );
};

const Projects = ({ sidebarExpanded }) => {
    const [originalInfo, setOriginalInfo] = useState([]);
    const [info, setInfo] = useState([]);
    const [filterValue, setFilterValue] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [availableYears, setAvailableYears] = useState([]);
    const [availableISP, setAvailableISP] = useState([]);

    const [nearProposals, setNearProposals] = useState([]);
    const [dueProposals, setDueProposals] = useState([]);

    const [showToast, setShowToast] = useState(false);
    const [toastTimeout, setToastTimeout] = useState(null);

    const [showModal, setShowModal] = useState(false);

    const [fileUrl, setFileUrl] = useState('');

    const [idToDelete, setIdToDelete] = useState(null);

    const [activeScrollspy, setActiveScrollspy] = useState('scrollspyHeading1');

    const [selectedYear, setSelectedYear] = useState('');

    const [isImage, setIsImage] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    // Handle responsive breakpoints
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const location = useLocation();
    const state = location.state;

    const handleYearChange = (event) => {
        const year = event.target.value;
        setSelectedYear(year);
    };

    const openModal = async (fileType) => {
        try {
            let filename;
            if (fileType === 'implementation') {
                filename = selectedProject.fileData.implementationFilename;
            } else if (fileType === 'extension') {
                filename = selectedProject.fileData.extensionFilename;
            } else if (fileType === 'realignment') {
                filename = selectedProject.fileData.realignmentFilename;
            }
    
            const response = await axios.get(`http://localhost:8080/GetFile/${filename}`, {
                responseType: 'blob'
            });
            const contentType = response.headers['content-type'];
    
            if (contentType.includes('pdf')) {
                const file = new Blob([response.data], { type: 'application/pdf' });
                const fileUrl = URL.createObjectURL(file);
                setFileUrl(fileUrl);
                setIsImage(false);
                setShowModal(true);
            } else if (contentType.includes('image')) {
                const imageUrl = URL.createObjectURL(response.data);
                setFileUrl(imageUrl);
                setIsImage(true);
                setShowModal(true);
            } else {
                console.error('Unsupported file type');
            }
        } catch (error) {
            console.error('Error fetching file:', error);
        }
    };
    

    const showToastF = () => {
        setShowToast(true);
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }
        const timeout = setTimeout(() => {
            setShowToast(false);
        }, 5000);
    }

    useEffect(() => {
        if (state) {
            setFilterValue(state);
        }
    }, [state]);

    useEffect(() => {
        getInfo();
    }, []);

    useEffect(() => {
        const handleProjectCreated = () => refreshData();
        window.addEventListener('projectCreated', handleProjectCreated);

        return () => window.removeEventListener('projectCreated', handleProjectCreated);
    }, []);

    const getProjectLeader = (row) => row.projectLeader || row.programLeader || '';
    const getProgramLeader = (row) => row.programLeader || '';

    const getInfo = async () => {
        const response = await axios.get('http://localhost:8080/Projects/');
        setOriginalInfo(response.data);
        setInfo(response.data);
        fetchAvailableISPs(response.data);
        fetchAvailableYears(response.data);
        checkNearProposals(response.data);
    };

    const refreshData = () => {
        getInfo();
        setFilterValue('');
    };

    const handleDeleteClick = (id) => {
        if (window.confirm('Are you sure you want to delete this project? All related data will also be deleted.')) {
            deleteProject(id);
        }
    };

    const deleteProject = async (id) => {
        try {
            await axios.delete(`http://localhost:8080/Projects/${id}`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            getInfo();
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Error deleting project: ' + error.message);
        }
    };

    const getProposalEndDate = (proposal) => {
        if (proposal.secondExtension) {
            // Extract the end date from the secondExtension range
            const extensionDates = proposal.secondExtension.split(' - ');
            return new Date(extensionDates[1]);
        } else if (proposal.firstExtension) {
            // Extract the end date from the firstExtension range
            const extensionDates = proposal.firstExtension.split(' - ');
            return new Date(extensionDates[1]);
        } else if (proposal.changeImplementationDate) {
            return new Date(proposal.changeImplementationDate);
        } else {
            return new Date(proposal.originalEnd);
        }
    };
    
    const checkNearProposals = (data) => {
        const currentDate = new Date('2024-06-10');
        const nearDue = data.filter((proposal) => {
            const proposalEndDate = getProposalEndDate(proposal);
            const timeDiff = proposalEndDate.getTime() - currentDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return daysDiff >= 0 && daysDiff <= 10;
        });
    
        setNearProposals(nearDue);
    };
    
    const checkDueProposals = (data) => {
        const currentDate = new Date('2024-06-10');
        const due = data.filter((proposal) => {
            const proposalEndDate = getProposalEndDate(proposal);
            const timeDiff = proposalEndDate.getTime() - currentDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return daysDiff < 0;
        });
    
        setDueProposals(due);
    };
    
    const calculateDueDate = (receivedDate) => {
        const proposalEndDate = new Date(receivedDate);
        return proposalEndDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    const calculateDaysUntilDue = (receivedDate) => {
        const currentDate = new Date('2024-06-10');
        const proposalEndDate = new Date(receivedDate);
        const timeDiff = proposalEndDate.getTime() - currentDate.getTime();
        return Math.abs(Math.ceil(timeDiff / (1000 * 3600 * 24)));
    };
    
    useEffect(() => {
        checkNearProposals(originalInfo);
        checkDueProposals(originalInfo);
    }, [originalInfo]);
    
    const allPendingProposals = [...nearProposals, ...dueProposals];
    

    const handleProjectClick = (clickedProjectId) => {
        const filteredData = originalInfo.filter((row) => row.id === clickedProjectId);
        setInfo(filteredData);
    };

    const handleFilterChange = (e) => {
        setFilterValue(e.target.value);
    };

    const filteredData = info.filter((row) =>
        Object.values(row).some(
            (value) =>
                (value && value.toString().toLowerCase().includes(filterValue.toLowerCase())) ||
                (row.releaseData && Object.values(row.releaseData).some(
                    releaseValue => releaseValue && releaseValue.toString().toLowerCase().includes(filterValue.toLowerCase())
                )) ||
                (row.counterpartFundData && Object.values(row.counterpartFundData).some(
                    counterpartValue => counterpartValue && counterpartValue.toString().toLowerCase().includes(filterValue.toLowerCase())
                )) ||
                (row.sixPSData && Object.values(row.sixPSData).some(
                    sixPSValue => sixPSValue && sixPSValue.toString().toLowerCase().includes(filterValue.toLowerCase())
                ))
        )
    );


    const normalizeStatus = (value) => {
        if (!value) return '';
        const normalized = value.toString().toLowerCase().replace(/[-\s]/g, '');
        if (normalized.includes('ongoing') || normalized === 'ongoing') return 'Ongoing';
        if (normalized.includes('new')) return 'New';
        if (normalized.includes('completed') || normalized.includes('complete')) return 'Completed';
        if (normalized.includes('terminated')) return 'Terminated';
        return value;
    };

    const applyFilter = (filterData) => {
        const { ISP, programTitle, responsiblePerson, funding, status } = filterData;

        console.log('Filter Data:', filterData);

        const filteredData = originalInfo.filter((row) => {
            const matchesISP = !ISP || ISP.length === 0 || ISP.includes(row.ISP);
            const matchesProgramTitle = !programTitle || row.programTitle.toLowerCase().includes(programTitle.toLowerCase());
            const matchesResponsiblePerson = !responsiblePerson || row.responsiblePerson.toLowerCase().includes(responsiblePerson.toLowerCase());
            const matchesFunding = !funding || funding.length === 0 || funding.includes(row.funding);
            const matchesStatus = !status || status.length === 0 || status.includes(normalizeStatus(row.status));

            return matchesISP && matchesProgramTitle && matchesResponsiblePerson && matchesFunding && matchesStatus;
        });

        console.log('Filtered Data:', filteredData);

        setInfo(filteredData);
    };

    const handleEditModalOpen = (project) => {
        setSelectedProject(project);
        setIsEditModalOpen(true);
    };

    const handleAddFileModalOpen = (project) => {
        setSelectedProject(project);
        setIsAddFileModalOpen(true);
    };

    const handleViewModal = (project) => {
        setSelectedProject(project);
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        // Convert the date to local timezone
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        // Format the date
        const formattedDate = localDate.toLocaleString();
        return formattedDate;
    }

    function formatDate(timestamp) {
        if (!timestamp) {
            return "";
        }
    
        // Split the timestamp by comma to handle multiple dates/ranges
        const dateParts = timestamp.split(", ");
        const formattedParts = dateParts.map(part => {
            let comment = "";
            let cleanPart = part;
    
            // Extract comment inside parentheses
            const commentMatch = part.match(/\(([^)]+)\)/);
            if (commentMatch) {
                comment = ` (${commentMatch[1]})`;
                cleanPart = part.replace(commentMatch[0], "").trim();
            }
    
            // Check if it's a range
            if (cleanPart.includes(" - ")) {
                const dates = cleanPart.split(" - ");
                if (dates.length === 2) {
                    return `${formatSingleDate(dates[0])} - ${formatSingleDate(dates[1])}${comment}`;
                }
            } else {
                return `${formatSingleDate(cleanPart)}${comment}`;
            }
        });
    
        return formattedParts.join(", <br />");
    }
    
    function formatSingleDate(dateStr) {
        const date = new Date(dateStr);
    
        if (isNaN(date.getTime())) {
            return dateStr; // Return the original string if the date is invalid
        }
    
        // Array of month names
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
    
        // Get the date components
        const year = date.getFullYear();
        const month = monthNames[date.getMonth()];
        const day = date.getDate();
    
        // Format the date as "Month Day, Year"
        const formattedDate = `${month} ${day.toString().padStart(2, '0')}, ${year}`;
    
        return formattedDate;
    }
    

    const columns = [
        { name: 'ISP', selector: (row) => row.ISP, sortable: true, wrap: true, width: '120px', minWidth: '120px' },
        {
            name: 'Program Title',
            selector: (row) => row.programTitle ?? '',
            cell: (row) => <ProjectTitleCell title={row.programTitle ?? ''} />,
            sortable: true,
            width: '200px',
            minWidth: '200px',
        },
        { name: 'Program Leader', selector: (row) => getProgramLeader(row), sortable: true, wrap: true, width: '180px', minWidth: '180px' },
        { name: 'PALIHAN Code(project)', selector: (row) => row.projectCode ?? '', sortable: true, wrap: true, width: '180px', minWidth: '180px' },
        {
            name: 'Project Title',
            selector: (row) => row.projectTitle ?? '',
            cell: (row) => <ProjectTitleCell title={row.projectTitle ?? ''} />,
            sortable: true,
            width: '200px',
            minWidth: '200px',
        },
        { name: 'Project Leader', selector: (row) => getProjectLeader(row), sortable: true, wrap: true, width: '180px', minWidth: '180px' },
        {
            name: 'Implementing Agency',
            selector: (row) => row.implementingAgency ?? '',
            cell: (row) => <ProjectTitleCell title={row.implementingAgency ?? ''} />,
            sortable: true,
            width: '200px',
            minWidth: '200px',
        },
        { name: 'Funding', selector: (row) => row.funding, sortable: true, wrap: true, width: '150px', minWidth: '150px' },
        { name: 'TOTAL', cell: (row) => {
            let total = 0;
            // Calculate total from budgetArray if available
            if (row.budgetArray && Array.isArray(row.budgetArray)) {
                total = row.budgetArray.reduce((acc, curr) => {
                    const amount = typeof curr.amount === 'string' 
                        ? parseFloat(curr.amount.replace(/,/g, '')) || 0 
                        : parseFloat(curr.amount) || 0;
                    return acc + amount;
                }, 0);
            } else if (row.budget && typeof row.budget === 'object') {
                // Fallback to budget object if budgetArray not available
                total = Object.keys(row.budget).reduce((acc, year) => {
                    const amount = typeof row.budget[year] === 'string'
                        ? parseFloat(row.budget[year].replace(/,/g, '')) || 0
                        : parseFloat(row.budget[year]) || 0;
                    return acc + amount;
                }, 0);
            } else if (row.totalBudget) {
                // Last resort: use totalBudget field directly
                total = parseFloat(String(row.totalBudget).replace(/,/g, '')) || 0;
            }
            return <span>{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
        }, sortable: true, wrap: true, width: '120px', minWidth: '120px' },
        { name: 'New Implementation Start Date', selector: (row) => row.changeStart, sortable: true, wrap: true, width: '180px', minWidth: '180px' },
        { name: 'New Implementation End Date', selector: (row) => row.changeImplementationDate, sortable: true, wrap: true, width: '180px', minWidth: '180px' },
        {
            name: 'Actions',
            cell: (row) => (
                <ProjectActionsDropdown
                    row={row}
                    onView={handleViewModal}
                    onEdit={handleEditModalOpen}
                    onAddFile={handleAddFileModalOpen}
                    onDelete={handleDeleteClick}
                />
            ),
            width: '100px'
        },
    ];

    const exportToExcel = () => {
        const fileType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const fileName = 'Projects';

        const exportData = filteredData.map((row, index) => ({
            'No.': index + 1,
            'ISP': row.ISP,
            'Program Title': row.programTitle,
            'Program Leader': getProgramLeader(row),
            'PALIHAN Code(project)': row.projectCode,
            'Project Title': row.projectTitle,
            'Project Leader': getProjectLeader(row),
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

        const columnWidths = [
            { wch: 5 },
            { wch: 20 },
            { wch: 30 },
            { wch: 30 },
            { wch: 30 },
            { wch: 15 },
            { wch: 30 },
            { wch: 30 },
            { wch: 30 },
            { wch: 15 },
            { wch: 40 },
            { wch: 30 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 25 },
            { wch: 15 },
            { wch: 15 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 40 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 40 },
        ];

        ws['!cols'] = columnWidths;

        const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + fileExtension;
        a.click();
    };

    const importFromExcel = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    
                    // Get all rows as arrays to preserve exact column positions
                    const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                    
                    // Find rows: headers, year labels, and data
                    let headerRow = allRows[0] || [];
                    let yearLabelRow = null;
                    let dataStartIndex = 1;
                    
                    // Look for the year label row (contains Y1, Y2, Y3, etc.)
                    for (let i = 1; i < Math.min(10, allRows.length); i++) {
                        const row = allRows[i];
                        const hasYearLabels = row.some(cell => /^y\d+$/i.test(String(cell).trim()));
                        if (hasYearLabels) {
                            yearLabelRow = row;
                            dataStartIndex = i + 1;
                            break;
                        }
                    }
                    
                    // Build budget column map from year labels
                    const budgetColumnMap = {}; // { columnIndex: 'Y1', columnIndex: 'Y2', ... }
                    if (yearLabelRow) {
                        yearLabelRow.forEach((label, idx) => {
                            const normalized = String(label).trim().toUpperCase();
                            if (/^Y\d+$/.test(normalized)) {
                                budgetColumnMap[idx] = normalized;
                            }
                        });
                    }
                    
                    // Build regular column map from header row
                    const columnMap = {};
                    headerRow.forEach((header, idx) => {
                        if (header && String(header).trim() && !budgetColumnMap[idx]) {
                            columnMap[idx] = String(header).trim();
                        }
                    });
                    
                    // Extract data rows and build objects
                    const jsonData = [];
                    for (let i = dataStartIndex; i < allRows.length; i++) {
                        const row = allRows[i];
                        const hasData = row.some(cell => cell && String(cell).trim());
                        if (!hasData) continue;
                        
                        const obj = {};
                        
                        // Map regular columns
                        Object.entries(columnMap).forEach(([idx, header]) => {
                            obj[header] = row[idx] || '';
                        });
                        
                        // Map budget columns with year labels
                        Object.entries(budgetColumnMap).forEach(([idx, yearLabel]) => {
                            obj[yearLabel] = row[idx] || '';
                        });
                        
                        jsonData.push(obj);
                    }

                    // Helper function to find column by flexible matching
                    const normalizeHeader = (text) => String(text || '')
                        .toLowerCase()
                        .replace(/[\s\-_.()]/g, '');

                    const findColumn = (row, ...possibleNames) => {
                        const rowKeys = Object.keys(row);
                        const normalizedRowKeys = rowKeys.map(normalizeHeader);

                        for (let name of possibleNames) {
                            if (row[name] !== undefined) return row[name];

                            const lowerName = name.toLowerCase();
                            const foundExact = rowKeys.find(key => key.toLowerCase() === lowerName);
                            if (foundExact) return row[foundExact];

                            const normalizedName = normalizeHeader(name);
                            const foundNormalizedExact = normalizedRowKeys.find(key => key === normalizedName);
                            if (foundNormalizedExact) {
                                const originalKey = rowKeys[normalizedRowKeys.indexOf(foundNormalizedExact)];
                                return row[originalKey];
                            }

                            const foundPartial = rowKeys.find(key => {
                                const normalizedKey = normalizeHeader(key);
                                return normalizedKey.includes(normalizedName) || normalizedName.includes(normalizedKey);
                            });
                            if (foundPartial) return row[foundPartial];
                        }

                        return null;
                    };

                    // Extract multiple year budget entries from Excel row
                    const extractBudgetData = (row) => {
                        const budgetData = [];
                        
                        // Look for Y1, Y2, Y3, Y4, etc. columns
                        for (let yearNum = 1; yearNum <= 10; yearNum++) {
                            const yearKey = `Y${yearNum}`;
                            const budgetAmount = row[yearKey];
                            
                            if (budgetAmount && String(budgetAmount).trim()) {
                                const amount = parseFloat(String(budgetAmount).replace(/,/g, ''));
                                if (!isNaN(amount) && amount > 0) {
                                    budgetData.push({
                                        year: yearNum,
                                        amount: amount
                                    });
                                }
                            }
                        }

                        return budgetData.length > 0 ? budgetData : null;
                    };

                    const toIsoDate = (date) => {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    };

                    const excelSerialToIso = (serial) => {
                        const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
                        if (Number.isNaN(date.getTime())) return null;
                        return toIsoDate(date);
                    };

                    const isExcelSerial = (value) => typeof value === 'number' && value > 30000 && value < 60000;

                    const parseFlexibleDate = (text) => {
                        if (text === null || text === undefined || text === '') return null;
                        const trimmed = String(text).replace(/\r\n/g, ' ').trim();
                        if (!trimmed) return null;

                        if (isExcelSerial(Number(trimmed))) {
                            return excelSerialToIso(Number(trimmed));
                        }

                        const mdy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                        if (mdy) {
                            const first = Number(mdy[1]);
                            const second = Number(mdy[2]);
                            const year = Number(mdy[3]);

                            // Prefer MM/DD/YYYY, but allow DD/MM/YYYY when day is > 12.
                            if (first > 12 && second <= 12) {
                                const date = new Date(year, second - 1, first);
                                if (!Number.isNaN(date.getTime())) return toIsoDate(date);
                            } else {
                                const date = new Date(year, first - 1, second);
                                if (!Number.isNaN(date.getTime())) return toIsoDate(date);
                                const altDate = new Date(year, second - 1, first);
                                if (!Number.isNaN(altDate.getTime())) return toIsoDate(altDate);
                            }
                        }

                        const parsed = new Date(trimmed);
                        if (!Number.isNaN(parsed.getTime())) {
                            return toIsoDate(parsed);
                        }

                        return null;
                    };

                    const formatExcelDateValue = (value) => {
                        if (value === null || value === undefined || value === '') return null;
                        if (isExcelSerial(value)) return excelSerialToIso(value);
                        const text = String(value).replace(/\r\n/g, ' ').trim();
                        return parseFlexibleDate(text) || text;
                    };

                    const normalizeDateRange = (value) => {
                        if (value === null || value === undefined || value === '') return null;
                        if (isExcelSerial(value)) return excelSerialToIso(value);

                        const text = String(value).replace(/\r\n/g, ' ').trim();

                        if (text.includes(' - ')) {
                            const [start, end] = text.split(' - ').map(part => part.trim());
                            const isoStart = parseFlexibleDate(start);
                            const isoEnd = parseFlexibleDate(end);
                            if (isoStart && isoEnd) return `${isoStart} - ${isoEnd}`;
                            return text;
                        }

                        const toMatch = text.match(/^(.+?)\s+to\s+(.+)$/i);
                        if (toMatch) {
                            const endPart = toMatch[2].trim();
                            const yearMatch = endPart.match(/\d{4}/);
                            const isoEnd = parseFlexibleDate(endPart);
                            let isoStart = parseFlexibleDate(toMatch[1].trim());
                            if (!isoStart && yearMatch) {
                                isoStart = parseFlexibleDate(`${toMatch[1].trim()} ${yearMatch[0]}`);
                            }
                            if (isoStart && isoEnd) return `${isoStart} - ${isoEnd}`;
                        }

                        const dashRange = text.match(/^([A-Za-z]+)\s+(\d{1,2})-(\d{1,2}),\s*(\d{4})$/);
                        if (dashRange) {
                            const [, month, day1, day2, year] = dashRange;
                            const isoStart = parseFlexibleDate(`${month} ${day1}, ${year}`);
                            const isoEnd = parseFlexibleDate(`${month} ${day2}, ${year}`);
                            if (isoStart && isoEnd) return `${isoStart} - ${isoEnd}`;
                        }

                        return formatExcelDateValue(text);
                    };

                    const normalizeMultiDateField = (value) => {
                        if (value === null || value === undefined || value === '') return null;
                        if (isExcelSerial(value)) return excelSerialToIso(value);

                        const text = String(value).replace(/\r\n/g, '\n').trim();
                        const parts = text.split(/\n+/).map(part => part.trim()).filter(Boolean);
                        const results = [];

                        parts.forEach((part) => {
                            const range = normalizeDateRange(part);
                            if (range && range.includes(' - ') && /^\d{4}-\d{2}-\d{2}/.test(range)) {
                                results.push(range);
                                return;
                            }

                            const single = formatExcelDateValue(part);
                            if (single && /^\d{4}-\d{2}-\d{2}$/.test(single)) {
                                results.push(single);
                                return;
                            }

                            const embeddedDates = part.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
                            embeddedDates.forEach((dateText) => {
                                const iso = parseFlexibleDate(dateText);
                                if (iso) results.push(iso);
                            });
                        });

                        return results.length > 0 ? [...new Set(results)].join(', ') : text;
                    };

                    const formatPhoneNumber = (value) => {
                        if (value === null || value === undefined || value === '') return null;
                        if (typeof value === 'number') {
                            return String(Math.trunc(value));
                        }
                        return String(value).replace(/\r\n/g, ' ').trim();
                    };

                    // Map Excel columns to project fields with flexible matching
                    let currentProgramTitle = '';
                    const projectsToImport = jsonData.map(row => {
                        const rawProjectTitle = findColumn(
                            row,
                            'Project Title',
                            'Project',
                            'Project Name',
                            'Title',
                            'Program/Project Title',
                            'Program Project Title'
                        );
                        const rawProgramTitle = findColumn(
                            row,
                            'Program Title',
                            'Program',
                            'Program Name',
                            'Program/Project Title',
                            'Program Project Title'
                        );
                        const projectTitle = rawProjectTitle ? String(rawProjectTitle).trim() : '';
                        const explicitProgramTitle = rawProgramTitle ? String(rawProgramTitle).trim() : '';

                        if (explicitProgramTitle) {
                            currentProgramTitle = explicitProgramTitle;
                        } else if (projectTitle && /^program\b/i.test(projectTitle)) {
                            currentProgramTitle = projectTitle;
                        }

                        const programLeaderValue = findColumn(row, 'Program Leader', 'Program Manager') || null;
                        const projectLeaderValue = findColumn(row, 'Project Leader', 'Program/Project Leader', 'Leader', 'Project Lead', 'Project Manager') || programLeaderValue || null;

                        const project = {
                            ISP: findColumn(row, 'ISP') || null,
                            programTitle: explicitProgramTitle || currentProgramTitle || null,
                            projectTitle: projectTitle || null,
                            projectCode: findColumn(row, 'PALIHAN Code(project)', 'Project Code', 'PALIHAN Code Project', 'ProjectCode') || null,
                            programCode: findColumn(row, 'PALIHAN Code(program)', 'Program Code', 'PALIHAN Code Program', 'ProgramCode') || null,
                            responsiblePerson: findColumn(row, 'Responsible Person', 'Responsible', 'Person In Charge') || null,
                            funding: findColumn(row, 'Funding', 'Funded By', 'Funding Source') || null,
                            implementingAgency: findColumn(row, 'Implementing Agency', 'Implementing', 'Agency') || null,
                            programLeader: programLeaderValue,
                            projectLeader: projectLeaderValue,
                            emailAddress: findColumn(row, 'Email Address', 'Email') || null,
                            contactNumber: formatPhoneNumber(findColumn(row, 'Contact Number', 'Telephone Number', 'Contact', 'Phone')) || null,
                            postalAddress: findColumn(row, 'Postal Address', 'Address', 'Postal') || null,
                            region: findColumn(row, 'Region', 'Region of IA', 'Region IA', 'Region of Implementing Agency') || null,
                            cooperatingAgency: findColumn(row, 'Cooperating Agency', 'Cooperating', 'Partner') || null,
                            originalStart: formatExcelDateValue(findColumn(row, 'Original Start', 'Start Date', 'Originally Approved Start Date')) || null,
                            originalEnd: formatExcelDateValue(findColumn(row, 'Original End', 'End Date', 'Originally Approved End Date')) || null,
                            changeStart: formatExcelDateValue(findColumn(row, 'Change Start', 'Changed Start', 'New Implementation Start Date', 'New Implementation Start')) || null,
                            changeImplementationDate: formatExcelDateValue(findColumn(row, 'Change End', 'Change of Implementation Date', 'Change Implementation', 'Implementation Change', 'New Implementation End Date', 'New Implementation End')) || null,
                            firstExtension: normalizeDateRange(findColumn(row, 'Project Extension', 'First Extension', '1st Extension')) || null,
                            secondExtension: normalizeDateRange(findColumn(row, 'Second Extension', '2nd Extension')) || null,
                            objectives: findColumn(row, 'Objectives', 'Objective') || null,
                            description: findColumn(row, 'Description') || null,
                            deliverables: findColumn(row, 'Deliverables', 'Deliverable') || null,
                            beneficiaries: findColumn(row, 'Beneficiaries', 'Beneficiary') || null,
                            dcY1Approval: formatExcelDateValue(findColumn(row, 'DC Y1 Approval', 'DC Y1', 'Development Council Y1')) || null,
                            gcY1Approval: formatExcelDateValue(findColumn(row, 'GC Y1 Approval', 'GC Y1', 'Governance Council Y1')) || null,
                            execomY1Approval: formatExcelDateValue(findColumn(row, 'Execom Y1 Approval', 'Execom Y1', 'Executive Committee Y1')) || null,
                            dcY2Renewal: formatExcelDateValue(findColumn(row, 'DC Y2 Renewal', 'Renewal Y2 DC', 'DC Y2')) || null,
                            gcY2Renewal: formatExcelDateValue(findColumn(row, 'GC Y2 Renewal', 'Renewal Y2 GC', 'GC Y2')) || null,
                            execomY2Renewal: formatExcelDateValue(findColumn(row, 'Execom Y2 Renewal', 'Renewal Y2 EXECOM', 'Execom Y2')) || null,
                            dcY3Renewal: formatExcelDateValue(findColumn(row, 'DC Y3 Renewal', 'Renewal Y3 DC', 'DC Y3')) || null,
                            gcY3Renewal: formatExcelDateValue(findColumn(row, 'GC Y3 Renewal', 'Renewal Y3 GC', 'GC Y3')) || null,
                            execomY3Renewal: formatExcelDateValue(findColumn(row, 'Execom Y3 Renewal', 'Renewal Y3 EXECOM', 'Execom Y3')) || null,
                            inceptionMeeting: normalizeDateRange(findColumn(row, 'Inception Meeting', 'Inception')) || null,
                            mande: normalizeMultiDateField(findColumn(row, 'M&E', 'M and E', 'Monitoring and Evaluation')) || null,
                            y1BudgetRealignment: normalizeMultiDateField(findColumn(row, 'Y1 Budget Realignment', 'Year 1 Budget')) || null,
                            y2BudgetRealignment: normalizeMultiDateField(findColumn(row, 'Y2 Budget Realignment', 'Year 2 Budget')) || null,
                            y3BudgetRealignment: normalizeMultiDateField(findColumn(row, 'Y3 Budget Realignment', 'Year 3 Budget')) || null,
                            programReview: normalizeMultiDateField(findColumn(row, 'Program Review')) || null,
                            terminalReview: normalizeMultiDateField(findColumn(row, 'Terminal Review', 'Terminal')) || null,
                            status: findColumn(row, 'Status', 'Status Of Liquidation') || null,
                            remarks: findColumn(row, 'Remarks', 'Notes', 'Comments') || null,
                            bannerProgram: findColumn(row, 'Banner Program', 'BannerProgram') || null,
                            pillar: findColumn(row, 'Pillar') || null,
                            strategy: findColumn(row, 'Strategy') || null,
                            projectAccomplishment: findColumn(row, 'Project Accomplishments', 'Project Accomplishment', 'Accomplishments') || null,
                        };

                        // Extract all budget years/amounts
                        const budgetData = extractBudgetData(row);
                        if (budgetData) {
                            project.budgetData = budgetData;
                        }
                        
                        // Filter out null values to only send data that exists
                        return Object.fromEntries(
                            Object.entries(project).filter(([, value]) => value !== null && value !== undefined && value !== '')
                        );
                    }).filter(project => project.projectTitle || project.programTitle);

                    if (projectsToImport.length === 0) {
                        alert('No importable project rows were found in the selected file. Please verify the sheet content and headers.');
                        return;
                    }

                    // Send to backend for saving/updating
                    const response = await axios.post('http://localhost:8080/ImportProjects', projectsToImport);

                    if (response.status === 200) {
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 3000);
                        // Refresh the projects list
                        getInfo();
                    }
                } catch (error) {
                    console.error('Error importing projects:', error);
                    const message = error.response?.data?.messages?.error
                        || error.response?.data?.message
                        || error.message;
                    alert('Error importing projects: ' + message);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading file: ' + error.message);
        }

        // Reset file input
        event.target.value = '';
    };

    const fetchAvailableYears = (data) => {
        const years = [...new Set(data.map(item => new Date(item.changeStart || item.originalStart).getFullYear()))] // Use changeStart if available
            .filter(year => !isNaN(year));
        years.sort((a, b) => a - b);
        setAvailableYears(years);
    };

    const fetchAvailableISPs = (data) => {
        const isps = [...new Set(data.map(item => item.ISP))]
            .filter(isp => isp); // Filters out any falsy values like null or undefined
        isps.sort(); // Sort alphabetically
        setAvailableISP(isps); // Assuming setAvailableISPs is a state setter function
    };    

    const downloadWordFile = async () => {
        const currentDate = new Date().toISOString().split('T')[0];
        const paragraphs = filteredData.map((row, index) => {
            return new Paragraph({
                children: [
                    new TextRun({
                        text: `No: ${index + 1} `,
                        break: 1.5,
                        bold: true,
                        font: {
                            name: 'Arial',
                        },
                    }),
                    new TextRun({
                        text: `ISP: ${row.ISP} `,
                        break: 1.5,
                        font: {
                            name: 'Arial',
                        },
                    }),
                    new TextRun({
                        text: `Program Title: ${row.programTitle} `,
                        break: 1.5,
                        font: {
                            name: 'Arial',
                        },
                    }),
                    new TextRun({
                        text: `Project Title: ${row.projectTitle} `,
                        break: 1.5,
                        font: {
                            name: 'Arial',
                        },
                    }),
                    new TextRun({
                        text: `Responsible Person: ${row.responsiblePerson} `,
                        break: 1.5,
                        font: {
                            name: 'Arial',
                        },
                    }),
                    new TextRun({
                        text: `Funding: ${row.funding} `,
                        break: 1.5,
                        font: {
                            name: 'Arial',
                        },
                    }),
                    new TextRun({
                        text: `Budget: ${row.totalBudget} `,
                        break: 1.5,
                        font: {
                            name: 'Arial',
                        },
                    }),
                    new TextRun({
                        text: `Remarks: ${row.remarks}`,
                        break: 1.5,
                        font: {
                            name: 'Arial',
                        },
                    }),
                    new TextRun({
                        text: `Project Accomplishments: ${row.projectAccomplishment || 'N/A'}`,
                        break: 1.5,
                        font: {
                            name: 'Arial',
                        },
                    }),
                    new TextRun({
                        text: `Created At: ${row.created_at}`,
                        break: 1.5,
                        font: {
                            name: 'Arial',
                        },
                    }),
                ],
            });
        });

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Generated Report`,
                                    break: 2,
                                    bold: true,
                                    font: {
                                        name: 'Arial',
                                    },
                                    size: 32,
                                }),
                            ]
                        }),
                        ...paragraphs,
                    ],
                },
            ],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Generated Report_${currentDate}.docx`);
    };

    const handleScrollspyClick = (id) => {
        setActiveScrollspy(id);
    };

    const sortedData = [...filteredData].sort((a, b) => b.id - a.id);

    const data = filteredData;

    // const openModal = () => {
    //     // const filename = selectedProject.fileData.implementationFilename;
    //     // setFileUrl(`http://localhost:8080/GetFile/${filename}`);
    //     setShowModal(true);
    // };

    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <article className={`pt-5 pb-5 ${isMobile ? 'ps-3 pe-3' : isTablet ? 'ps-4 pe-4' : 'pe-5'}`}>
            <div className="modal fade" id="viewModal" tabIndex="-1" aria-labelledby="exampleModalLabel" data-bs-backdrop="static" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
                    <div className="modal-content p-2">
                        <div className="modal-header border-0">
                            <h1 className="modal-title fw-semibold" style={{ fontSize: '18px' }} id="exampleModalLabel">Project Details</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body pt-0">
                            {selectedProject && (
                                <>
                                    <nav id="navbar-example2 p-0 m-0" className="navbar">
                                        <ul className="nav p-0 m-0">
                                            <li className="nav-item p-0 m-0">
                                                <a className="nav-link ps-0" href="#scrollspyHeading1" onClick={() => handleScrollspyClick('scrollspyHeading1')}>Main Details</a>
                                            </li>
                                            <li className="nav-item p-0 m-0">
                                                <a className="nav-link" href="#scrollspyHeading2" onClick={() => handleScrollspyClick('scrollspyHeading2')}>Budget</a>
                                            </li>
                                            <li className="nav-item p-0 m-0">
                                                <a className="nav-link" href="#scrollspyHeading3" onClick={() => handleScrollspyClick('scrollspyHeading3')}>GIS Release</a>
                                            </li>
                                            <li className="nav-item p-0 m-0">
                                                <a className="nav-link" href="#scrollspyHeading4" onClick={() => handleScrollspyClick('scrollspyHeading4')}>Counterpart Funds</a>
                                            </li>
                                            <li className="nav-item p-0 m-0">
                                                <a className="nav-link" href="#scrollspyHeading4" onClick={() => handleScrollspyClick('scrollspyHeading5')}>6PS</a>
                                            </li>
                                        </ul>
                                    </nav>
                                    <div data-bs-spy="scroll" data-bs-target="#navbar-example2" data-bs-root-margin="0px 0px -40%" data-bs-smooth-scroll="true" className="scrollspy-example" tabIndex="0">
                                        {activeScrollspy === 'scrollspyHeading1' && (
                                            <>
                                                <h6 className='pt-1 fw-bold' id="scrollspyHeading1"></h6>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>PALIHAN Code:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.projectCode}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>ISP:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.ISP}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col'>
                                                        <label className='h6 fw-semibold'>Program Title:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.programTitle}</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label className='h6 fw-semibold'>Project Title:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.projectTitle}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Responsible Person:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.responsiblePerson}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Funding:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.funding}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Total Budget:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>
                                                            {(() => {
                                                                let total = 0;
                                                                if (selectedProject.budgetArray && Array.isArray(selectedProject.budgetArray)) {
                                                                    total = selectedProject.budgetArray.reduce((acc, curr) => {
                                                                        const amt = curr && curr.amount !== undefined ? curr.amount : 0;
                                                                        const num = typeof amt === 'string' ? parseFloat(String(amt).replace(/,/g, '')) || 0 : Number(amt) || 0;
                                                                        return acc + num;
                                                                    }, 0);
                                                                } else if (selectedProject.budget && typeof selectedProject.budget === 'object') {
                                                                    total = Object.keys(selectedProject.budget).reduce((acc, year) => {
                                                                        const val = selectedProject.budget[year];
                                                                        const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) || 0 : Number(val) || 0;
                                                                        return acc + num;
                                                                    }, 0);
                                                                } else if (selectedProject.totalBudget) {
                                                                    const tb = selectedProject.totalBudget;
                                                                    total = typeof tb === 'string' ? parseFloat(tb.replace(/,/g, '')) || 0 : Number(tb) || 0;
                                                                }

                                                                return total > 0
                                                                    ? total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                                    : (selectedProject.totalBudget || 'No data');
                                                            })()}
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Implementing Agency:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.implementingAgency}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Project Leader:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.projectLeader || selectedProject.programLeader}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Email Address:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.emailAddress}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Contact Number:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.contactNumber}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Postal Address:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.postalAddress}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Cooperating Agency:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.cooperatingAgency}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Originally Approved Start Date:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.originalStart)}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Originally Approved End Date:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.originalEnd)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>New Implementation Start Date:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.changeStart)}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>New Implementation End Date:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.changeImplementationDate)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>1st Extension:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.firstExtension)}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>2nd Extension:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.secondExtension)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>File for Implementation Change:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <a className='' style={{ cursor: 'pointer' }} onClick={() => openModal('implementation')}>
                                                            {selectedProject.fileData.implementationFilename}
                                                        </a>
                                                    </div>

                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Extension File:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <a className='' style={{ cursor: 'pointer' }} onClick={() => openModal('extension')}>
                                                            {selectedProject.fileData.extensionFilename}
                                                        </a>
                                                    </div>

                                                    {showModal && isImage && (
                                                        <ImageModal imageUrl={fileUrl} closeModal={closeModal} />
                                                    )}

                                                    {showModal && !isImage && (
                                                        <PdfModal pdfUrl={fileUrl} closeModal={closeModal} />
                                                    )}

                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-12'>
                                                        <label className='h6 fw-semibold'>Objectives:</label>
                                                        <div style={{ whiteSpace: 'pre-wrap', textAlign: 'justify', wordBreak: 'break-word', marginTop: '0.5rem' }}>
                                                            {selectedProject.objectives || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-12'>
                                                        <label className='h6 fw-semibold'>Description:</label>
                                                        <div style={{ whiteSpace: 'pre-wrap', textAlign: 'justify', wordBreak: 'break-word', marginTop: '0.5rem' }}>
                                                            {selectedProject.description || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-12'>
                                                        <label className='h6 fw-semibold'>Deliverables:</label>
                                                        <div style={{ whiteSpace: 'pre-wrap', textAlign: 'justify', wordBreak: 'break-word', marginTop: '0.5rem' }}>
                                                            {selectedProject.deliverables || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-12'>
                                                        <label className='h6 fw-semibold'>Beneficiaries:</label>
                                                        <div style={{ whiteSpace: 'pre-wrap', textAlign: 'justify', wordBreak: 'break-word', marginTop: '0.5rem' }}>
                                                            {selectedProject.beneficiaries || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>DC Y1 Approval:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.dcY1Approval)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>GC Y1 Approval:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.gcY1Approval)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Execom Y1 Approval:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.execomY1Approval)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>DC Y2 Renewal:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.dcY2Renewal)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>GC Y2 Renewal:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.gcY2Renewal)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Execom Y2 Renewal:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.execomY2Renewal)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>DC Y3 Renewal:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.dcY3Renewal)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>GC Y3 Renewal:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.gcY3Renewal)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Execom Y3 Renewal:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.execomY3Renewal)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Inception Meeting:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.inceptionMeeting)}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>M&E:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: formatDate(selectedProject.mande) }}></label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Y1 Budget Realignment:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.y1BudgetRealignment)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Y2 Budget Realignment:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.y2BudgetRealignment)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Y3 Budget Realignment:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.y3BudgetRealignment)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Realignment File:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <a className='' style={{ cursor: 'pointer' }} onClick={() => openModal('realignment')}>
                                                            {selectedProject.fileData.realignmentFilename}
                                                        </a>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Program Review:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.programReview)}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Terminal Review:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.terminalReview)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Status:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.status}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Remarks:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label className={`badge p-2 h6 ${selectedProject.remarks === 'New' ? 'bg-warning' : selectedProject.remarks === 'Ongoing' ? 'bg-primary' : selectedProject.remarks === 'Completed' ? 'bg-success' : 'bg-danger'}`} style={{ textAlign: 'justify' }}>{selectedProject.remarks}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Banner Program:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.bannerProgram || 'N/A'}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Tagging:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.tagging || 'N/A'}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Pillar:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.pillar || 'N/A'}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Strategy:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.strategy || 'N/A'}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Project Accomplishments:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <div style={{ whiteSpace: 'pre-wrap', textAlign: 'justify', wordBreak: 'break-word' }}>
                                                            {selectedProject.projectAccomplishment || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Date Created:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatTime(selectedProject.created_at)}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Date Updated:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{formatTime(selectedProject.updated_at)}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Created By:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.created_by}</label>
                                                    </div>
                                                    <div className='col-md-3'>

                                                    </div>
                                                    <div className='col'>

                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {activeScrollspy === 'scrollspyHeading2' && (
                                            <>
                                                <h6 className='pt-1 fw-bold' id="scrollspyHeading2">Budget</h6>
                                                <div className='row pb-2'>
                                                    <div className='col'>
                                                        {selectedProject.budget && typeof selectedProject.budget === 'object' ? (
                                                            <ul>
                                                                {Object.entries(selectedProject.budget).map(([year, value]) => (
                                                                    <li key={year} className='pb-2'>
                                                                        <strong>{year}:</strong> {value}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <label style={{ textAlign: 'justify' }}>{selectedProject.budget || "No data"}</label>
                                                        )}
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Total Budget:</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label style={{ textAlign: 'justify' }}>
                                                            {(() => {
                                                                // Compute total from budgetArray or budget object, fallback to totalBudget
                                                                let total = 0;
                                                                if (selectedProject.budgetArray && Array.isArray(selectedProject.budgetArray)) {
                                                                    total = selectedProject.budgetArray.reduce((acc, curr) => {
                                                                        const amt = curr && curr.amount !== undefined ? curr.amount : 0;
                                                                        const num = typeof amt === 'string' ? parseFloat(String(amt).replace(/,/g, '')) || 0 : Number(amt) || 0;
                                                                        return acc + num;
                                                                    }, 0);
                                                                } else if (selectedProject.budget && typeof selectedProject.budget === 'object') {
                                                                    total = Object.keys(selectedProject.budget).reduce((acc, year) => {
                                                                        const val = selectedProject.budget[year];
                                                                        const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) || 0 : Number(val) || 0;
                                                                        return acc + num;
                                                                    }, 0);
                                                                } else if (selectedProject.totalBudget) {
                                                                    const tb = selectedProject.totalBudget;
                                                                    total = typeof tb === 'string' ? parseFloat(tb.replace(/,/g, '')) || 0 : Number(tb) || 0;
                                                                }

                                                                return total > 0
                                                                    ? total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                                    : (selectedProject.totalBudget || 'No data');
                                                            })()}
                                                        </label>
                                                    </div>
                                                </div>

                                            </>
                                        )}

                                        {activeScrollspy === 'scrollspyHeading3' && (
                                            <>
                                                <h6 className='pt-1 fw-bold' id="scrollspyHeading3">GIA Releases</h6>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Programmed Amount:</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label style={{ textAlign: 'justify' }}>
                                                            {Number(selectedProject.releaseData.programmedAmount).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Region of Implemeting Agency:</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.releaseData.regionIA}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Particulars/Schedule:</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.releaseData.particulars}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>DV No.:</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.releaseData.dvNo}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Date of Release/Transferred (FAIS):</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label style={{ textAlign: 'justify' }}>{formatDate(selectedProject.releaseData.dateOfRelease)}</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Month:</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.releaseData.month}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Actual Release per FAIS/DV/ADA:</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label style={{ textAlign: 'justify' }}>
                                                            {Number(selectedProject.releaseData.actualRelease).toLocaleString(undefined, {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })}
                                                        </label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Remerks:</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.releaseData.remarksReleases}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Status:</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.releaseData.statusReleases}</label>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {activeScrollspy === 'scrollspyHeading4' && (
                                            <>
                                                <h6 className='pt-1 fw-bold' id="scrollspyHeading4">Counterpart Funds</h6>
                                                <div className='row pb-2'>
                                                    <div className='col'>
                                                        {selectedProject.counterFund && typeof selectedProject.counterFund === 'object' ? (
                                                            <ul>
                                                                {Object.entries(selectedProject.counterFund).map(([year, value]) => (
                                                                    <li key={year} className='pb-2'>
                                                                        <strong>{year}:</strong> {value}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <label style={{ textAlign: 'justify' }}>{selectedProject.counterFund || "No data"}</label>
                                                        )}
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>Total Fund:</label>
                                                    </div>
                                                    <div className='col-md-3'>
                                                        <label style={{ textAlign: 'justify' }}>
                                                            {selectedProject.counterpartFundData && selectedProject.counterpartFundData.totalFund ?
                                                                selectedProject.counterpartFundData.totalFund :
                                                                "No data"}
                                                        </label>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {activeScrollspy === 'scrollspyHeading5' && (
                                            <>
                                                <h6 className='pt-1 fw-bold' id="scrollspyHeading3">6pS</h6>
                                                <div className='row pb-2'>
                                                    <div className='col-md-3'>
                                                        <label className='h6 fw-semibold'>ISP:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.ISP}</label>
                                                    </div>
                                                </div>
                                                <div className='row pb-2'>
                                                    <div className='col'>
                                                        <label className='h6 fw-semibold'>Project Title:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label style={{ textAlign: 'justify' }}>{selectedProject.projectTitle}</label>
                                                    </div>
                                                    <div className='col'>
                                                        <label className='h6 fw-semibold'>Year:</label>
                                                    </div>
                                                    <div className='col'>
                                                        <select value={selectedYear} onChange={handleYearChange} className="mb-3">
                                                            <option value="">Select Year</option>
                                                            {selectedProject && selectedProject.sixPs && Object.keys(selectedProject.sixPs).map((year) => (
                                                                <option key={year} value={year}>{year}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                {selectedYear && selectedProject.sixPs[selectedYear] && (
                                                    <>
                                                        <p className='h6 py-2 text-center fw-semibold bg-dark text-light' style={{ borderRadius: '.3rem' }}>Publication</p>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Target Publication:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].targetPublication}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Actual Accomplishment (Peer-Reviewed):</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].actualaccomplishmentPeer}</label>
                                                            </div>
                                                        </div>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Actual Accomplishment (Journal Volume, Year):</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].actualaccomplishmentJournal}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Actual Accomplishment Presented in Conferences, etc:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].actualaccomplishmentPresented}</label>
                                                            </div>
                                                        </div>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Details about the conference/ symposium, etc.:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].details}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Actual Accomplishment (IEC Materials i.e. brochures, manuals, pamphlet, leaflets, etc) Specify the type of IEC:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].actualaccomplishmentIEC}</label>
                                                            </div>
                                                        </div>
                                                        <p className='h6 py-2 text-center fw-semibold bg-dark text-light' style={{ borderRadius: '.3rem' }}>Product</p>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Target Product:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].targetProduct}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Name of Technology:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].techName}</label>
                                                            </div>
                                                        </div>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Description of the Technology:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].techDescription}</label>
                                                            </div>
                                                        </div>
                                                        <p className='h6 py-2 text-center fw-semibold bg-dark text-light' style={{ borderRadius: '.3rem' }}>Patent</p>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Target Patent:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].targetPatent}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Agency:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].agency}</label>
                                                            </div>
                                                        </div>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Name of Technology/ Protocols/ manual with IP/Patent:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].techNamePro}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Status:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].statusSix}</label>
                                                            </div>
                                                        </div>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>DOST:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].dost}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Patent Number or Application Number:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].patentNumber}</label>
                                                            </div>
                                                        </div>
                                                        <p className='h6 py-2 text-center fw-semibold bg-dark text-light' style={{ borderRadius: '.3rem' }}>People and Services</p>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Target People and Services:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].targetPeople}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Names (BS):</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].namesBS}</label>
                                                            </div>
                                                        </div>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Names (MS):</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].namesMS}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Names (PhD):</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].namesPhD}</label>
                                                            </div>
                                                        </div>
                                                        <p className='h6 py-2 text-center fw-semibold bg-dark text-light' style={{ borderRadius: '.3rem' }}>Places and Partnership</p>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Target Places and Partnership:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].targetPlaces}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Cooperators:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].cooperators}</label>
                                                            </div>
                                                        </div>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>International:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].international}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Private:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].privateSixPS}</label>
                                                            </div>
                                                        </div>
                                                        <p className='h6 py-2 text-center fw-semibold bg-dark text-light' style={{ borderRadius: '.3rem' }}>Policy</p>
                                                        <div className='row pb-2'>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Target Policy:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].targetPolicy}</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label className='h6 fw-semibold'>Policy Recommendation:</label>
                                                            </div>
                                                            <div className='col-md-3'>
                                                                <label style={{ textAlign: 'justify' }}>{selectedProject.sixPs[selectedYear].policyRecommendation}</label>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer border-0">
                            <button type="button" className="btn btn-dark px-3 py-2 border" data-bs-dismiss="modal" style={{ fontSize: '14px' }}>Ok</button>
                        </div>
                    </div>
                </div>
            </div>
            {/* <div className="modal fade" id="archiveModal" tabIndex="-1" aria-labelledby="exampleModalLabel" data-bs-backdrop="static" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content p-2">
                        <div className="modal-header border-0">
                            <h5 className="modal-title fw-semibold" style={{ fontSize: '18px' }} id="exampleModalLabel">Archive Project?</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <label>Archiving this project will remove it from the active list, but you can restore it later if needed.</label>
                        </div>
                        <div className="modal-footer border-0">
                            <button type="button" className="btn btn-outline px-3 py-2 border text-black" data-bs-dismiss="modal" style={{ fontSize: '14px' }}>Cancel</button>
                            <button type="button" className="btn btn-dark px-3 py-2 border" data-bs-dismiss="modal" style={{ fontSize: '14px' }} onClick={deleteProduct}>Archive</button>
                        </div>
                    </div>
                </div>
            </div> */}
            <EditProjectModal
                isEditModalOpen={isEditModalOpen}
                closeModal={() => {
                    setIsEditModalOpen(false);
                    setSelectedProject(null);
                }}
                project={selectedProject}
                refresh={refreshData}
                showToastF={showToastF}
            />
            <AddProjectFilesModal
                isAddFileModalOpen={isAddFileModalOpen}
                closeModal={() => setIsAddFileModalOpen(false)}
                project={selectedProject}
                refresh={refreshData}
                showToastF={showToastF}
            />
            <div className="d-flex justify-content-between align-items-center">
                <label className='h5 fw-semibold pt-2'>Projects</label>
                <div className="d-flex align-items-center">
                    <div className="me-4">
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search..."
                                value={filterValue}
                                onChange={handleFilterChange}
                            />
                            {filterValue && (
                                <button
                                    className="btn btn-close"
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: '10px',
                                        transform: 'translateY(-50%)',
                                        zIndex: '1',
                                    }}
                                    onClick={() => setFilterValue('')}
                                >
                                </button>
                            )}
                        </div>
                    </div>
                    <FilterProjectModal
                        applyFilter={applyFilter}
                        availableYears={availableYears}
                        availableISP={availableISP}
                    />
                    <div className='sample me-3 notifTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
                        <Tooltip anchorSelect=".notifTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                            Notifications
                        </Tooltip>
                        <button type="button" className="btn border-0 position-relative" style={{ width: '40px' }} data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="fa-solid fa-bell fs-5"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-lg-end border-0 p-0 w-25 h-auto shadow-lg">
                            <li>
                                <h5 className='p-3 fw-bold'>Notifications</h5>
                                {allPendingProposals.length > 0 ? (
                                    <div className='dropdown-scrollable'>
                                        <ul className='p-0'>
                                            <li>
                                                <h6 className='p-2 ms-2 fw-bold'>Near Due Projects</h6>
                                                {nearProposals.length > 0 ? (
                                                    nearProposals.map((proposal, index) => (
                                                        <div className='notif-item my-2 mx-2' key={index} onClick={() => handleProjectClick(proposal.id)}>
                                                            <div className=" ps-3 py-2 d-flex align-items-center">
                                                                <div className='px-2 me-4' style={{ borderRadius: '50%', backgroundColor: '#FFCDD2', padding: '3px' }}>
                                                                    <i className="fa-solid fa-circle-exclamation text-danger" style={{ marginTop: '5px' }}></i>
                                                                </div>
                                                                <div className='d-flex flex-column float'>
                                                                    <div className='fw-semibold'>{proposal.projectTitle}</div>
                                                                    <div className='mt-1'>
                                                                        {` 
                                                                            ${calculateDaysUntilDue(getProposalEndDate(proposal)) === 0 ? 'Due Today' :
                                                                                'Due in ' + calculateDaysUntilDue(getProposalEndDate(proposal)) + ' days ' +
                                                                                '(' + calculateDueDate(getProposalEndDate(proposal)) + ')'}
                                                                        `}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className='p-3 text-center'>
                                                        No near due projects
                                                    </div>
                                                )}
                                            </li>
                                            <li>
                                                <h6 className='p-2 mt-3 ms-2 fw-bold'>Due Projects</h6>
                                                {dueProposals.length > 0 ? (
                                                    dueProposals.map((proposal, index) => (
                                                        <div className='notif-item my-2 mx-2' key={index} onClick={() => handleProjectClick(proposal.id)}>
                                                            <div className=" ps-3 py-2 d-flex align-items-center">
                                                                <div className='p-1 px-2 me-4' style={{ borderRadius: '50%', backgroundColor: '#E0E0E0' }}>
                                                                    <i className="bi bi-file-earmark-fill"></i>
                                                                </div>
                                                                <div className='d-flex flex-column float'>
                                                                    <div className='fw-semibold'>{proposal.projectTitle}</div>
                                                                    <div className='mt-1'>
                                                                        {` 
                                                                            ${calculateDaysUntilDue(getProposalEndDate(proposal)) === 0 ? 'Due Today' :
                                                                                'Due ' + calculateDaysUntilDue(getProposalEndDate(proposal)) + ' days ago ' +
                                                                                '(' + calculateDueDate(getProposalEndDate(proposal)) + ')'}
                                                                        `}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className='p-3 text-center'>
                                                        No due projects
                                                    </div>
                                                )}
                                            </li>
                                        </ul>
                                    </div>
                                ) : (
                                    <div className='p-3 text-center'>
                                        No proposals pending
                                    </div>
                                )}
                            </li>
                        </ul>
                    </div>
                    <div className='sample me-3 refreshTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
                        <Tooltip anchorSelect=".refreshTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                            Refresh
                        </Tooltip>
                        <button type="button" className="btn border-0" onClick={refreshData} data-bs-toggle="tooltip" data-bs-title="Refresh">
                            <i className="fa-solid fa-sync fs-5"></i>
                        </button>
                    </div>
                    <div className='sample me-3 reportTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
                        <Tooltip anchorSelect=".reportTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                            Generate Report
                        </Tooltip>
                        <Link to="/DOST/Generate-Report" state={data} className="btn border-0" data-bs-toggle="tooltip" data-bs-title="Refresh">
                            <i className="fa-solid fa-chart-line fs-5"></i>
                        </Link>
                    </div>
                    {/* <div className='sample me-3 generateTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
                        <Tooltip anchorSelect=".generateTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                            Generate Report
                        </Tooltip>
                        <button type="button" className="btn border-0" data-bs-toggle="tooltip" onClick={downloadWordFile}>
                            <i className="fa-solid fa-file-contract fs-5"></i>
                        </button>
                    </div> */}
                    <div className='sample me-3 excelTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
                        <Tooltip anchorSelect=".excelTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                            Export to .xlxs
                        </Tooltip>
                        <button type="button" className="btn border-0" onClick={exportToExcel} data-bs-toggle="tooltip" data-bs-title="Export to Excel">
                            <i className="fa-solid fa-file-excel fs-5"></i>
                        </button>
                    </div>
                    <div className='sample me-3 importTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
                        <Tooltip anchorSelect=".importTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                            Import from Excel
                        </Tooltip>
                        <input 
                            type="file" 
                            id="importProjectsFile" 
                            onChange={importFromExcel} 
                            accept=".xlsx,.xls" 
                            style={{ display: 'none' }} 
                        />
                        <button 
                            type="button" 
                            className="btn border-0 importTooltip" 
                            onClick={() => document.getElementById('importProjectsFile').click()}
                            data-bs-toggle="tooltip" 
                            data-bs-title="Import from Excel"
                        >
                            <i className="fa-solid fa-upload fs-5"></i>
                        </button>
                    </div>
                </div>
            </div>


            <DataTable
                columns={columns}
                data={sortedData}
                pagination
                responsive
                highlightOnHover
                striped
                paginationPerPage={isMobile ? 5 : 10}
                paginationRowsPerPageOptions={isMobile ? [5, 10, 15] : [10, 25, 50]}
                className={!isMobile ? 'pt-5' : ''}
                style={{ 
                    paddingLeft: !isMobile && sidebarExpanded ? (isTablet ? '250px' : '300px') : (isMobile ? '0px' : '150px'), 
                    transition: 'padding-left 0.3s',
                    fontSize: isMobile ? '12px' : '14px'
                }}
            />

            <div
                className="toast position-absolute start-50 translate-middle-x bg-success"
                style={{ display: showToast ? 'block' : 'none', top: '140px' }}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
            >
                <div className="d-flex">
                    <div className="toast-body text-white">
                        Project updated successfully.
                    </div>
                </div>
            </div>
        </article>
    )
}

export default Projects