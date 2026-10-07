import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import './Proposals.css'
import './Dashboard.css'
import FilterProposalModal from './FilterProposalModal';
import EditProposalModal from './EditProposalModal';
import AddProposalModal from './AddProposalModal';
import { Tooltip } from 'react-tooltip';
import { listImportedRows, saveImportedRows } from '../firestoreImports';
import { formatProposalDetailValue } from './proposalImportUtils';

const Proposals = ({ sidebarExpanded }) => {
    const [originalInfo, setOriginalInfo] = useState([]);
    const [info, setInfo] = useState([]);
    const [filterValue, setFilterValue] = useState('');
    const [nearProposals, setNearProposals] = useState([]);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [availableYears, setAvailableYears] = useState([]);
    const [availableISP, setAvailableISP] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState(null);
    const [dueProposals, setDueProposals] = useState([]);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    const [idToDelete, setIdToDelete] = useState(null);

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

    useEffect(() => {
        getInfo();

        const handleProposalRestored = () => {
            getInfo();
        };

        window.addEventListener('proposalRestored', handleProposalRestored);

        return () => {
            window.removeEventListener('proposalRestored', handleProposalRestored);
        };
    }, []);

    const getInfo = async () => {
        try {
            const proposals = await listImportedRows('proposals');
            setOriginalInfo(proposals);
            setInfo(proposals);
            setFilterValue('');
            checkNearProposals(proposals);
            checkDueProposals(proposals);
            fetchAvailableYears(proposals);
            fetchAvailableISPs(proposals);
        } catch (error) {
            console.error('Error loading proposals:', error);
        }
    };

    let totalProposals = [];
    let approvedProposals = [];
    let disapprovedProposals = [];
    let resubmissionProposals = [];
    let underEvaluationProposals = [];
    let revisionProposals = [];

    if (info.length > 0) {
        totalProposals = info.length;
        approvedProposals = info.filter((project) => project.remarks === 'Approved');
        disapprovedProposals = info.filter((project) => project.remarks === 'Disapproved');
        resubmissionProposals = info.filter((project) => project.remarks === 'Resubmission');
        underEvaluationProposals = info.filter((project) => project.remarks === 'Under Evaluation');
        revisionProposals = info.filter((project) => project.remarks === 'Revision');
    }

    const refreshData = () => {
        getInfo();
    };

    const handleDeleteClick = (id) => {
        setIdToDelete(id);
    };

    const deleteProduct = async () => {
        try {
            if (idToDelete) {
                console.log('Deleting product with ID:', idToDelete); // Log the ID to verify it
                const response = await axios.get(`http://localhost:8080/Proposals/${idToDelete}`);
                const deletedItemData = response.data;
    
                await axios.post('http://localhost:8080/ArchiveProposals', deletedItemData);

                await axios.delete(`http://localhost:8080/Proposals/${idToDelete}`);

                getInfo();
                window.dispatchEvent(new Event('archiveUpdated'));
                setIdToDelete(null);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };        

    const handleFilterChange = (e) => {
        setFilterValue(e.target.value);
    };

    const checkNearProposals = (data) => {
        const currentDate = new Date('12-21-2022');
        const nearDue = data.filter((proposal) => {
            const proposalReceivedDate = new Date(proposal.date);
            const deadlineDate = new Date(proposalReceivedDate);
            deadlineDate.setDate(deadlineDate.getDate() + 40);
            const timeDiff = deadlineDate.getTime() - currentDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return daysDiff >= 0 && daysDiff <= 10;
        });
    
        setNearProposals(nearDue);
    };

    const checkDueProposals = (data) => {
        const currentDate = new Date();
        const due = data.filter((proposal) => {
            const proposalReceivedDate = new Date(proposal.date);
            const deadlineDate = new Date(proposalReceivedDate);
            deadlineDate.setDate(deadlineDate.getDate() + 40);
            const timeDiff = deadlineDate.getTime() - currentDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return daysDiff < 0;
        });
    
        setDueProposals(due);
    };

    const calculateDueDate = (receivedDate) => {
        const proposalReceivedDate = new Date(receivedDate);
        const deadlineDate = new Date(proposalReceivedDate);
        deadlineDate.setDate(deadlineDate.getDate() + 40);
        return deadlineDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const calculateDaysUntilDue = (receivedDate) => {
        const currentDate = new Date();
        const proposalReceivedDate = new Date(receivedDate);
        const deadlineDate = new Date(proposalReceivedDate);
        deadlineDate.setDate(deadlineDate.getDate() + 40);
        
        const timeDiff = deadlineDate.getTime() - currentDate.getTime();
        
        return Math.abs(Math.ceil(timeDiff / (1000 * 3600 * 24)));
    };


    const fetchAvailableYears = (data) => {
        const years = [...new Set(data.map(item => new Date(item.date).getFullYear()))];
        setAvailableYears(years);
    };

    const fetchAvailableISPs = (data) => {
        const isps = [...new Set(data.map(item => item.ISP))]
            .filter(isp => isp); // Filters out any falsy values like null or undefined
        isps.sort(); // Sort alphabetically
        setAvailableISP(isps); // Assuming setAvailableISPs is a state setter function
    };   

    useEffect(() => {
        checkNearProposals(originalInfo);
        checkDueProposals(originalInfo);
        fetchAvailableYears(originalInfo);
    }, [originalInfo]);

    const allPendingProposals = [...nearProposals, ...dueProposals];

    const filteredData = info.filter((row) =>
        Object.values(row).some(
            (value) =>
                value &&
                value.toString().toLowerCase().includes(filterValue.toLowerCase())
        )
    );

    const applyFilter = (filterData) => {
        const { ISP, programTitle, responsiblePerson, implementingAgency, funding, leadTRD, quarter, date, remarks } = filterData;
    
        const filteredData = originalInfo.filter((row) => {
            const rowYear = new Date(row.date).getFullYear();
            const remarkMatches = !remarks || remarks.length === 0 || remarks.includes(row.remarks); // Check if remark matches the filter
    
            return (!ISP || ISP.length === 0 || ISP.includes(row.ISP)) &&
                (!programTitle || row.programTitle.toLowerCase().includes(programTitle.toLowerCase())) &&
                (!responsiblePerson || row.responsiblePerson.toLowerCase().includes(responsiblePerson.toLowerCase())) &&
                (!implementingAgency || row.implementingAgency.toLowerCase().includes(implementingAgency.toLowerCase())) &&
                (!funding || funding.length === 0 || funding.includes(row.funding)) &&
                (!leadTRD || row.leadTRD.toLowerCase().includes(leadTRD.toLowerCase())) &&
                (!quarter || row.quarter.toLowerCase().includes(quarter.toLowerCase())) &&
                (!date || date.length === 0 || date.includes(rowYear)) &&
                remarkMatches; // Include row only if the remark matches the filter
        });
    
        setInfo(filteredData);
    };    

    const handleViewModal = (proposal) => {
        setSelectedProposal(proposal);
    };

    const handleEditModalOpen = (proposal) => {
        setSelectedProposal(proposal);
        setIsEditModalOpen(true);
    };

    // Responsive columns based on device type
    const getResponsiveColumns = () => {
        const baseColumns = [
            { name: 'No.', selector: (row, index) => index + 1, sortable: true, width: isMobile ? '60px' : '80px' },
            { name: 'ISP', selector: (row) => row.ISP, sortable: true, wrap: true, hide: isMobile ? 320 : null },
            { name: 'Program Title', selector: (row) => row.programTitle, sortable: true, wrap: true, hide: isMobile ? 400 : null },
        ];

        const desktopColumns = [
            { name: 'Project Title', selector: (row) => row.projectTitle, sortable: true, wrap: true },
            { name: 'Responsible Person', selector: (row) => row.responsiblePerson, sortable: true },
            { name: 'Implementing Agency', selector: (row) => row.implementingAgency, sortable: true },
            { name: 'Project Leader', selector: (row) => row.programLeader, sortable: true },
            { name: 'Lead TRD', selector: (row) => row.leadTRD, sortable: true },
            { name: 'Funding', selector: (row) => row.funding, sortable: true },
            { name: 'Quarter', selector: (row) => row.quarter, sortable: true },
            { name: 'Date', selector: (row) => row.date, sortable: true },
            { name: 'Remarks', selector: (row) => row.remarks, sortable: true, wrap: true },
        ];

        const tabletColumns = [
            { name: 'Project Title', selector: (row) => row.projectTitle, sortable: true, wrap: true },
            { name: 'Responsible Person', selector: (row) => row.responsiblePerson, sortable: true },
            { name: 'Lead TRD', selector: (row) => row.leadTRD, sortable: true },
            { name: 'Funding', selector: (row) => row.funding, sortable: true },
            { name: 'Quarter', selector: (row) => row.quarter, sortable: true },
            { name: 'Date', selector: (row) => row.date, sortable: true },
        ];

        const actionColumn = [
            {
                name: 'Actions',
                cell: (row) => (
                    <div className="dropdown">
                        <button className="btn btn-outline rounded-circle" style={{ paddingInline: isMobile ? '8px' : '11px' }} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="fa-solid fa-ellipsis"></i>
                        </button>
                        <ul className="dropdown-menu border-0 p-0 m-0 h-auto w-auto shadow-lg text-start">
                            <li className='m-1 notif-item' style={{ width: isMobile ? '150px' : '200px' }} data-bs-toggle="modal" data-bs-target="#proposalViewModal" onClick={() => handleViewModal(row)}>
                                <div className="d-flex align-items-center">
                                    <div className='p-1 px-2 pt-1 me-1'>
                                        <i className="bi bi-info-circle fs-5"></i>
                                    </div>
                                    <div className='d-flex flex-column float'>
                                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>View Details</div>
                                    </div>
                                </div>
                            </li>
                            <li className='m-1 notif-item' style={{ width: isMobile ? '150px' : '200px' }} onClick={() => handleEditModalOpen(row)}>
                                <div className="d-flex align-items-center">
                                    <div className='p-1 px-2 pt-1 me-1'>
                                        <i className="bi bi-pencil-square fs-5"></i>
                                    </div>
                                    <div className='d-flex flex-column float'>
                                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>Edit</div>
                                    </div>
                                </div>
                            </li>
                            <li className='m-1 notif-item' style={{ width: isMobile ? '150px' : '200px' }} data-bs-toggle="modal" data-bs-target="#archiveModal" onClick={() => handleDeleteClick(row.id)}>
                                <div className="d-flex align-items-center">
                                    <div className='p-1 px-2 pt-1 me-1'>
                                        <i className="bi bi-archive fs-5 text-danger"></i>
                                    </div>
                                    <div className='d-flex flex-column float'>
                                        <div className='fw-medium text-danger' style={{ fontSize: '13px', paddingTop: '2px' }}>Archive</div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                ),
                width: isMobile ? '100px' : '160px'
            },
        ];

        if (isMobile) {
            return [...baseColumns, ...actionColumn];
        } else if (isTablet) {
            return [...baseColumns, ...tabletColumns, ...actionColumn];
        } else {
            return [...baseColumns, ...desktopColumns, ...actionColumn];
        }
    };

    const normalizeHeader = (value) => {
        return String(value || '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^a-z0-9 ]+/g, ' ')
            .replace(/\s+/g, ' ');
    };

    const matchHeader = (rowKey, candidate) => {
        const normalizedKey = normalizeHeader(rowKey);
        const normalizedCandidate = normalizeHeader(candidate);

        if (!normalizedKey) return false;
        if (normalizedKey === normalizedCandidate) return true;
        if (normalizedKey.includes(normalizedCandidate)) return true;

        const candidateTokens = normalizedCandidate.split(' ').filter(Boolean);
        return candidateTokens.every((token) => normalizedKey.includes(token));
    };

    const findColumn = (row, possibleNames) => {
        if (!Array.isArray(possibleNames)) {
            possibleNames = [possibleNames];
        }

        for (let name of possibleNames) {
            if (name && row[name] !== undefined) return row[name];
            const normalizedName = normalizeHeader(name);

            for (let key in row) {
                if (normalizeHeader(key) === normalizedName) return row[key];
            }

            for (let key in row) {
                if (matchHeader(key, name)) return row[key];
            }
        }

        // Fallback: if the normalized row key contains all tokens of any candidate name
        for (let key in row) {
            const normalizedKey = normalizeHeader(key);
            for (let name of possibleNames) {
                const candidateTokens = normalizeHeader(name).split(' ').filter(Boolean);
                if (candidateTokens.length > 0 && candidateTokens.every((token) => normalizedKey.includes(token))) {
                    return row[key];
                }
            }
        }

        return null;
    };

    const importFromExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const proposals = jsonData
                    .map(row => ({
                        ISP: findColumn(row, ['ISP', 'Agency', 'Implementing Agency']) || '',
                        programTitle: findColumn(row, ['Program Title', 'programTitle', 'Program', 'Program Name', 'Program/Project Title']) || '',
                        projectTitle: findColumn(row, ['Project Title', 'projectTitle', 'Project', 'Project Name', 'Title']) || '',
                        responsiblePerson: findColumn(row, ['Responsible Person', 'responsiblePerson', 'Responsible', 'Person In Charge', 'PIC']) || '',
                        implementingAgency: findColumn(row, ['Implementing Agency', 'implementingAgency', 'Agency', 'Implementing']) || '',
                        programLeader: findColumn(row, ['Program/Project Leader', 'programLeader', 'Leader', 'Project Leader', 'Program Leader']) || '',
                        leadTRD: findColumn(row, ['Lead TRD', 'leadTRD', 'TRD', 'TRD Lead']) || '',
                        funding: findColumn(row, ['Funding', 'funding', 'Budget', 'Amount', 'Approved Budget']) || '',
                        quarter: findColumn(row, ['Quarter', 'quarter', 'Qtr', 'Q']) || '',
                        date: findColumn(row, ['Date', 'date', 'Submission Date', 'Received Date', 'Date Received']) || '',
                        remarks: findColumn(row, ['Remarks', 'remarks', 'Notes', 'Comments', 'Status']) || '',
                    }))
                    .filter((proposal) => Object.values(proposal).some((value) => {
                        const text = String(value ?? '').trim();
                        return text !== '' && text !== 'null' && text !== 'NULL';
                    }));

                if (proposals.length === 0) {
                    alert('No importable rows were found in the selected file. Please verify the sheet content and headers.');
                    return;
                }

                const importedCount = await saveImportedRows('proposals', proposals);
                await getInfo();
                if (importedCount > 0) {
                    alert(`Successfully imported ${importedCount} proposal${importedCount === 1 ? '' : 's'} to Firebase!`);
                }
            } catch (error) {
                console.error('Error importing proposals:', error);
                alert('Error importing proposals. Please check the file format.');
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const exportToExcel = () => {
        const fileType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const fileName = 'Proposals Evaluated';
    
        const exportData = filteredData.map((row, index) => ({
            'No.': index + 1,
            'ISP': row.ISP,
            'Program Title': row.programTitle,
            'Project Title': row.projectTitle,
            'Responsible Person': row.responsiblePerson,
            'Implementing Agency': row.implementingAgency,
            'Program/Project Leader': row.implementingAgency,
            'Lead TRD': row.leadTRD,
            'Funding': row.funding,
            'Quarter': row.quarter,
            'Date': row.date,
            'Remarks': row.remarks,
        }));
    
        const ws = XLSX.utils.json_to_sheet(exportData);
    
        ws["!cols"] = [{ wpx: 80 }, { wpx: 120 }, { wpx: 120 }, { wpx: 120 }, { wpx: 150 }, { wpx: 150 }, { wpx: 150 }, { wpx: 100 }, { wpx: 100 }, { wpx: 120 }, { wpx: 200 }];
        ws["!rows"] = [{ hidden: false, hpx: 25 }];
    
        const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: fileType });
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + fileExtension;
        a.click();
    };
    
    const handleProjectClick = (clickedProjectId) => {
        const filteredData = originalInfo.filter((row) => row.id === clickedProjectId);
        setInfo(filteredData);
    };

    return (
        <article className={`pt-5 pb-5 ${isMobile ? 'ps-3 pe-3' : isTablet ? 'ps-4 pe-4' : 'pe-5'}`}>

            <EditProposalModal 
                isEditModalOpen={isEditModalOpen}
                closeModal={() => setIsEditModalOpen(false)}
                proposal={selectedProposal}
                refresh={refreshData} 
            />

            <div className="modal fade" id="proposalViewModal" tabIndex="-1" aria-labelledby="proposalViewModalLabel" data-bs-backdrop="static" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
                    <div className="modal-content p-2">
                        <div className="modal-header border-0">
                            <h1 className="modal-title fw-semibold" style={{ fontSize: '18px' }} id="proposalViewModalLabel">Proposal Details</h1>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body pt-0">
                            {selectedProposal ? (
                                <>
                                    <div className='pb-4'>
                                        <div className='row pb-2'>
                                            <div className='col-md-3'><label className='h6 fw-semibold'>ISP:</label></div>
                                            <div className='col'><label>{formatProposalDetailValue(selectedProposal.ISP)}</label></div>
                                        </div>
                                        <div className='row pb-2'>
                                            <div className='col-md-3'><label className='h6 fw-semibold'>Program Title:</label></div>
                                            <div className='col'><label>{formatProposalDetailValue(selectedProposal.programTitle)}</label></div>
                                        </div>
                                        <div className='row pb-2'>
                                            <div className='col-md-3'><label className='h6 fw-semibold'>Project Title:</label></div>
                                            <div className='col'><label>{formatProposalDetailValue(selectedProposal.projectTitle)}</label></div>
                                        </div>
                                        <div className='row pb-2'>
                                            <div className='col-md-3'><label className='h6 fw-semibold'>Responsible Person:</label></div>
                                            <div className='col'><label>{formatProposalDetailValue(selectedProposal.responsiblePerson)}</label></div>
                                        </div>
                                        <div className='row pb-2'>
                                            <div className='col-md-3'><label className='h6 fw-semibold'>Implementing Agency:</label></div>
                                            <div className='col'><label>{formatProposalDetailValue(selectedProposal.implementingAgency)}</label></div>
                                        </div>
                                        <div className='row pb-2'>
                                            <div className='col-md-3'><label className='h6 fw-semibold'>Program/Project Leader:</label></div>
                                            <div className='col'><label>{formatProposalDetailValue(selectedProposal.programLeader)}</label></div>
                                        </div>
                                        <div className='row pb-2'>
                                            <div className='col-md-3'><label className='h6 fw-semibold'>Funding:</label></div>
                                            <div className='col'><label>{formatProposalDetailValue(selectedProposal.funding)}</label></div>
                                        </div>
                                        <div className='row pb-2'>
                                            <div className='col-md-3'><label className='h6 fw-semibold'>Lead TRD:</label></div>
                                            <div className='col'><label>{formatProposalDetailValue(selectedProposal.leadTRD)}</label></div>
                                        </div>
                                        <div className='row pb-2'>
                                            <div className='col-md-3'><label className='h6 fw-semibold'>Quarter:</label></div>
                                            <div className='col'><label>{formatProposalDetailValue(selectedProposal.quarter)}</label></div>
                                        </div>
                                        <div className='row pb-2'>
                                            <div className='col-md-3'><label className='h6 fw-semibold'>Date:</label></div>
                                            <div className='col'><label>{formatProposalDetailValue(selectedProposal.date)}</label></div>
                                        </div>
                                        <div className='row pb-2'>
                                            <div className='col-md-3'><label className='h6 fw-semibold'>Remarks:</label></div>
                                            <div className='col'><label>{formatProposalDetailValue(selectedProposal.remarks)}</label></div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className='p-3'>No proposal selected.</div>
                            )}
                        </div>
                        <div className="modal-footer border-0">
                            <button type="button" className="btn btn-outline px-3 py-2 border text-black" data-bs-dismiss="modal" style={{ fontSize: '14px' }}>Close</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="modal fade" id="archiveModal" tabIndex="-1" aria-labelledby="exampleModalLabel" data-bs-backdrop="static" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content p-2">
                    <div className="modal-header border-0">
                        <h5 className="modal-title fw-semibold" style={{ fontSize: isMobile ? '16px' : '18px' }} id="exampleModalLabel">Archive Project?</h5>
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
            </div>

            <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between align-items-center'}`}>
                <label className='h5 fw-semibold pt-2'>Proposals</label>
                <div className={`d-flex ${isMobile ? 'flex-column mt-3' : 'align-items-center'}`}>
                    <div className={`${isMobile ? 'mb-2 w-100' : 'me-4'}`}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search..."
                                value={filterValue}
                                onChange={handleFilterChange}
                                style={{ width: isMobile ? '100%' : 'auto' }}
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
                    <div className={`d-flex ${isMobile ? 'justify-content-between' : ''}`}>
                        <FilterProposalModal
                            applyFilter={applyFilter}
                            availableYears={availableYears}
                            availableISP={availableISP}
                        />
                        <AddProposalModal refresh={refreshData} />
                        <div className='sample me-3 notifTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
                        <Tooltip anchorSelect=".notifTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                            Pending Proposal
                        </Tooltip>
                        <button type="button" className="btn border-0 position-relative" style={{ width: isMobile ? '35px' : '40px' }} data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="fa-solid fa-bell fs-5"></i>
                            {nearProposals.length > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ border: '4px solid #F5F5F5' }}>
                                    {nearProposals.length}
                                    <span className="visually-hidden">unread messages</span>
                                </span>
                            )}
                        </button>
                        <ul className="dropdown-menu dropdown-menu-lg-end border-0 p-0 shadow-lg" style={{ width: isMobile ? '90vw' : isTablet ? '400px' : '500px', maxWidth: '500px' }}>
                            <li>
                                <h5 className='p-3 fw-bold'>Notifications</h5>
                                {allPendingProposals.length > 0 ? (
                                    <div className='dropdown-scrollable'>
                                        <ul className='p-0'>
                                            <li>
                                                <h6 className='p-2 ms-2 fw-bold'>Near Due Proposals</h6>
                                                {nearProposals.length > 0 ? (
                                                    nearProposals.map((proposal, index) => (
                                                        <div className='notif-item my-2 mx-2' key={index} onClick={() => handleProjectClick(proposal.id)}>
                                                            <div className="ps-3 py-2 d-flex align-items-center">
                                                                <div className='px-2 me-4' style={{ borderRadius: '50%', backgroundColor: '#FFCDD2', padding: '3px' }}>
                                                                    <i className="fa-solid fa-circle-exclamation text-danger" style={{ marginTop: '5px' }}></i>
                                                                </div>
                                                                <div className='d-flex flex-column float'>
                                                                    <div className='fw-semibold' style={{ fontSize: isMobile ? '13px' : '14px' }}>{proposal.projectTitle}</div>
                                                                    <div className='mt-1' style={{ fontSize: isMobile ? '11px' : '12px' }}>
                                                                        {`${calculateDaysUntilDue(proposal.date) === 0 ? 'Due Today' : 'Due in ' + calculateDaysUntilDue(proposal.date) + ' days (' + calculateDueDate(proposal.date) + ')'}`}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className='p-3 text-center'>
                                                        No near due proposals
                                                    </div>
                                                )}
                                            </li>
                                            <li>
                                                <h6 className='p-2 mt-3 ms-2 fw-bold'>Due Proposals</h6>
                                                {dueProposals.length > 0 ? (
                                                    dueProposals.map((proposal, index) => (
                                                        <div className='notif-item my-2 mx-2' key={index} onClick={() => handleProjectClick(proposal.id)}>
                                                            <div className="ps-3 py-2 d-flex align-items-center">
                                                                <div className='p-1 px-2 me-4' style={{ borderRadius: '50%', backgroundColor: '#E0E0E0' }}>
                                                                    <i className="bi bi-file-earmark-fill"></i>
                                                                </div>
                                                                <div className='d-flex flex-column float'>
                                                                    <div className='fw-semibold' style={{ fontSize: isMobile ? '13px' : '14px' }}>{proposal.projectTitle}</div>
                                                                    <div className='mt-1' style={{ fontSize: isMobile ? '11px' : '12px' }}>
                                                                        {`${calculateDaysUntilDue(proposal.date) === 0 ? 'Due Today' : 'Due ' + calculateDaysUntilDue(proposal.date) + ' days ago (' + calculateDueDate(proposal.date) + ')'}`}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className='p-3 text-center'>
                                                        No due proposals
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
                    <div className='sample me-3 importTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
                        <Tooltip anchorSelect=".importTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                            Import from Excel
                        </Tooltip>
                        <button type="button" className="btn border-0" onClick={() => document.getElementById('importProposalsFile').click()} data-bs-toggle="tooltip" data-bs-title="Import from Excel">
                            <i className="fa-solid fa-upload fs-5"></i>
                        </button>
                        <input type="file" id="importProposalsFile" onChange={importFromExcel} accept=".xlsx,.xls" style={{ display: 'none' }} />
                    </div>
                    <div className='sample me-3 excelTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
                        <Tooltip anchorSelect=".excelTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                            Export to .xlxs
                        </Tooltip>
                        <button type="button" className="btn border-0" onClick={exportToExcel} data-bs-toggle="tooltip" data-bs-title="Export to Excel">
                            <i className="fa-solid fa-file-excel fs-5"></i>
                        </button>
                    </div>
                </div>
            </div>
            </div>

            <div className={`dashboard-summary-row pt-4 ${isMobile ? 'flex-column' : ''}`} style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: '15px',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <div className='dashboard-summary-col'>
                    <div className='card radius-10 border dashboard-summary-card'>
                        <div className='card-body' style={{ padding: isMobile ? '15px' : '25px 20px 25px 35px' }}>
                            <div className='d-flex align-items-center'>
                                <div className='dashboard-summary-icon' style={{ backgroundColor: '#EEEEEE', borderRadius: '50px', padding: '10px', marginRight: '15px' }}>
                                    <i className='fa-solid fa-equals fs-5 p-1' style={{ color: '#000' }}></i>
                                </div>
                                <div className='dashboard-summary-content'>
                                    <p className='mb-0 text-dark fs-4 fw-bold'>{totalProposals}</p>
                                    <p className='text-secondary h6' style={{ fontSize: isMobile ? '13px' : '15px' }}>Total</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='dashboard-summary-col'>
                    <div className='card radius-10 border dashboard-summary-card'>
                        <div className='card-body' style={{ padding: isMobile ? '15px' : '25px 20px 25px 35px' }}>
                            <div className='d-flex align-items-center'>
                                <div className='dashboard-summary-icon' style={{ backgroundColor: '#E8F5E9', borderRadius: '50px', padding: '10px', marginRight: '15px' }}>
                                    <i className='fa-regular fa-circle-check fs-5 p-1' style={{ color: '#4CAF50' }}></i>
                                </div>
                                <div className='dashboard-summary-content'>
                                    <p className='mb-0 text-dark fs-4 fw-bold'>{approvedProposals.length} ({((approvedProposals.length / totalProposals) * 100).toFixed()}%)</p>
                                    <p className='text-secondary h6' style={{ fontSize: isMobile ? '13px' : '15px' }}>Approved</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='dashboard-summary-col'>
                    <div className='card radius-10 border dashboard-summary-card'>
                        <div className='card-body' style={{ padding: isMobile ? '15px' : '25px 20px 25px 35px' }}>
                            <div className='d-flex align-items-center'>
                                <div className='dashboard-summary-icon' style={{ backgroundColor: '#FFEBEE', borderRadius: '50px', padding: '10px', marginRight: '15px' }}>
                                    <i className='fa-solid fa-ban fs-5 p-1' style={{ color: '#F44336' }}></i>
                                </div>
                                <div className='dashboard-summary-content'>
                                    <p className='mb-0 text-dark fs-4 fw-bold'>{disapprovedProposals.length} ({((disapprovedProposals.length / totalProposals) * 100).toFixed()}%)</p>
                                    <p className='text-secondary h6' style={{ fontSize: isMobile ? '13px' : '15px' }}>Disapproved</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='dashboard-summary-col'>
                    <div className='card radius-10 border dashboard-summary-card'>
                        <div className='card-body' style={{ padding: isMobile ? '15px' : '25px 20px 25px 35px' }}>
                            <div className='d-flex align-items-center'>
                                <div className='dashboard-summary-icon' style={{ backgroundColor: '#FFF3E0', borderRadius: '50px', padding: '10px', marginRight: '15px' }}>
                                    <i className='fa-solid fa-repeat fs-5 p-1' style={{ color: '#FF9800' }}></i>
                                </div>
                                <div className='dashboard-summary-content'>
                                    <p className='mb-0 text-dark fs-4 fw-bold'>{resubmissionProposals.length} ({((resubmissionProposals.length / totalProposals) * 100).toFixed()}%)</p>
                                    <p className='text-secondary h6' style={{ fontSize: isMobile ? '13px' : '15px' }}>Resubmission</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='dashboard-summary-col'>
                    <div className='card radius-10 border dashboard-summary-card'>
                        <div className='card-body' style={{ padding: isMobile ? '15px' : '25px 20px 25px 35px' }}>
                            <div className='d-flex align-items-center'>
                                <div className='dashboard-summary-icon' style={{ backgroundColor: '#E1F5FE', borderRadius: '50px', padding: '10px 12px', marginRight: '15px' }}>
                                    <i className='fa-solid fa-file-lines fs-5 p-1' style={{ color: '#03A9F4' }}></i>
                                </div>
                                <div className='dashboard-summary-content'>
                                    <p className='mb-0 text-dark fs-4 fw-bold'>{underEvaluationProposals.length} ({((underEvaluationProposals.length / totalProposals) * 100).toFixed()}%)</p>
                                    <p className='text-secondary h6' style={{ fontSize: isMobile ? '13px' : '15px' }}>Evaluation</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='dashboard-summary-col'>
                    <div className='card radius-10 border dashboard-summary-card'>
                        <div className='card-body' style={{ padding: isMobile ? '15px' : '25px 20px 25px 35px' }}>
                            <div className='d-flex align-items-center'>
                                <div className='dashboard-summary-icon' style={{ backgroundColor: '#D1C4E9', borderRadius: '50px', padding: '10px', marginRight: '15px' }}>
                                    <i className='fa-solid fa-file-pen fs-5 p-1 pe-0' style={{ color: '#673AB7' }}></i>
                                </div>
                                <div className='dashboard-summary-content'>
                                    <p className='mb-0 text-dark fs-4 fw-bold'>{revisionProposals.length} ({((revisionProposals.length / totalProposals) * 100).toFixed()}%)</p>
                                    <p className='text-secondary h6' style={{ fontSize: isMobile ? '13px' : '15px' }}>Revision</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table - Responsive */}
            <div className={isMobile ? 'table-responsive mt-4' : 'pt-5'} style={{ 
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                paddingLeft: 0
            }}>
                <DataTable
                    columns={getResponsiveColumns()}
                    data={filteredData}
                    pagination
                    responsive
                    highlightOnHover
                    striped
                    paginationPerPage={isMobile ? 5 : 10}
                    paginationRowsPerPageOptions={isMobile ? [5, 10, 15] : [10, 25, 50]}
                    className={!isMobile ? 'pt-5' : ''}
                    style={{ 
                        transition: 'padding-left 0.3s',
                        fontSize: isMobile ? '12px' : '14px',
                        width: '100%'
                    }}
                />
            </div>
        </article>
    );
};

export default Proposals;
