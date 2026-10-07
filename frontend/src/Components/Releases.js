import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import { Tooltip } from 'react-tooltip';
import { useLocation } from "react-router-dom";
import './Dashboard.css';
import EditReleasesModal from './EditReleasesModal';
import FilterReleasesModal from './FilterReleasesModal';
import { listImportedProjects, parseImportedAmount, saveProjectRelatedRows } from '../firestoreImports';

const Releases = ({ data, sidebarExpanded }) => {
    const [originalInfo, setOriginalInfo] = useState([]);
    const [info, setInfo] = useState([]);
    const [filterValue, setFilterValue] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [yearlyTotals, setYearlyTotals] = useState({});
    const [availableYears, setAvailableYears] = useState([]);
    const [availableISP, setAvailableISP] = useState([]);
    const [showToast, setShowToast] = useState(false);
    const [toastTimeout, setToastTimeout] = useState(null);
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
        getInfo();
    }, []);

    useEffect(() => {
        if (state) {
            setFilterValue(state);
        }
    }, [state]);

    // Auto-refresh data when page becomes visible (e.g., after editing)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                getInfo();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const getInfo = async () => {
        const projects = await listImportedProjects();
        setOriginalInfo(projects);
        setInfo(projects);
        fetchAvailableYears(projects);
        fetchAvailableISPs(projects);
    };

    const refreshData = () => {
        getInfo();
        setFilterValue('')
    };

    const deleteProduct = async (id) => {
        await axios.delete(`http://localhost:8080/Projects/${id}`);
        getInfo();
    };

    const handleFilterChange = (e) => {
        setFilterValue(e.target.value);
    };

    const handleEditModalOpen = (project) => {
        setSelectedProject(project);
        setIsEditModalOpen(true);
    };

    const filteredData = info.filter((row) =>
        Object.values(row).some(
            (value) =>
                value &&
                value.toString().toLowerCase().includes(filterValue.toLowerCase())
        )
    );

    const sortedData = [...filteredData].sort((a, b) => b.id - a.id);

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
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    const findColumn = (row, ...possibleNames) => {
                        const rowKeys = Object.keys(row);
                        for (let name of possibleNames) {
                            if (row[name] !== undefined) return row[name];
                            const found = rowKeys.find(key => key.toLowerCase() === name.toLowerCase());
                            if (found) return row[found];
                            const partial = rowKeys.find(key => key.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(key.toLowerCase()));
                            if (partial) return row[partial];
                        }
                        return null;
                    };

                    const rowsToImport = jsonData.map(row => ({
                        projectTitle: findColumn(row, 'Project Title', 'Project', 'Project Name') || null,
                        programmedAmount: findColumn(row, 'Programmed Amount', 'programmedAmount', 'Amount') || null,
                        regionIA: findColumn(row, 'Region of IA', 'regionIA', 'Region') || null,
                        particulars: findColumn(row, 'Particulars', 'particulars', 'Particulars/Schedule') || null,
                        dvNo: findColumn(row, 'DV No.', 'dvNo', 'DV') || null,
                        dateOfRelease: findColumn(row, 'Date of Release', 'dateOfRelease', 'Date') || null,
                        month: findColumn(row, 'Month', 'month') || null,
                        actualRelease: findColumn(row, 'Actual Release', 'actualRelease', 'Actual') || null,
                        remarksReleases: findColumn(row, 'Remarks', 'remarksReleases', 'Remarks (Releases)') || null,
                        statusReleases: findColumn(row, 'Status', 'statusReleases', 'Status (Releases)') || null,
                    })).filter(r => r.projectTitle);

                    if (rowsToImport.length > 0) {
                        const result = await saveProjectRelatedRows('releases', rowsToImport);
                        alert(`Imported ${result.importedCount} release rows to Firebase.${result.skippedCount ? ` Skipped ${result.skippedCount} rows that did not match an imported project.` : ''}`);
                        await getInfo();
                    } else {
                        alert('No valid release rows were found in the selected file.');
                    }
                } catch (error) {
                    console.error('Error importing releases:', error);
                    alert('Error importing releases: ' + error.message);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Error reading file: ' + error.message);
        }
        event.target.value = '';
    };

    const exportToExcel = () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const fileName = 'GIA Releases';
    
        const headers = [
            'No.',
            'ISP',
            'Project Title',
            'Programmed Amount',
            'Total Budget',
            'Implementing Agency',
            'Region of IA',
            'Duration',
            'Particulars/Schedule',
            'Funding',
            'DV No.',
            'Date of Release/Transferred (FAIS)',
            'Month',
            'Actual Release per FAIS/DV/ADA',
            'Remarks',
            'New/Ongoing',
            'Status'
        ];
    
        const exportData = filteredData.map((row, index) => {
            const duration = (() => {
                let startDate, endDate;
                if (!row.originalStart || !row.originalEnd) return ''; 
                if (row.changeStart || row.changeImplementationDate) {
                    startDate = new Date(row.changeStart || row.originalStart);
                    endDate = new Date(row.changeImplementationDate || row.originalEnd);
                } else {
                    startDate = new Date(row.originalStart);
                    endDate = new Date(row.originalEnd);
                }
                const formatDateString = date => date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
                let duration = `${formatDateString(startDate)} - ${formatDateString(endDate)}`;
    
                const appendExtension = extension => {
                    const [extStart, extEnd] = extension.split(' - ');
                    const extStartDate = new Date(extStart);
                    const extEndDate = new Date(extEnd);
                    if (!isNaN(extStartDate.getTime()) && !isNaN(extEndDate.getTime())) {
                        return ` (${formatDateString(extStartDate)} - ${formatDateString(extEndDate)})`;
                    }
                    return '';
                };
    
                if (row.secondExtension && (row.changeStart || row.changeImplementationDate) || row.secondExtension && !(row.changeStart || row.changeImplementationDate)) {
                    duration += ` (Second Extension: ${appendExtension(row.secondExtension)})`;
                } else if (row.firstExtension && (row.changeStart || row.changeImplementationDate) || row.firstExtension && !(row.changeStart || row.changeImplementationDate)) {
                    duration += ` (First Extension: ${appendExtension(row.firstExtension)})`;
                }
    
                return duration;
            })();
    
            const rowData = {
                'No.': index + 1,
                'ISP': row.ISP,
                'Project Title': row.projectTitle,
                'Programmed Amount': row.releaseData.programmedAmount,
                'Total Budget': row.totalBudget,
                'Implementing Agency': row.implementingAgency,
                'Region of IA': row.releaseData.regionIA,
                'Duration': duration,
                'Particulars/Schedule': row.releaseData.particulars,
                'Funding': row.funding,
                'DV No.': row.releaseData.dvNo,
                'Date of Release/Transferred (FAIS)': formatDate(row.releaseData.dateOfRelease),
                'Month': row.releaseData.month,
                'Actual Release per FAIS/DV/ADA': row.releaseData.actualRelease,
                'Remarks': row.releaseData.remarksReleases,
                'New/Ongoing': row.remarks,
                'Status': row.releaseData.statusReleases
            };
    
            return rowData;
        });
    
        // Convert the data to a worksheet
        const ws = XLSX.utils.json_to_sheet(exportData, { header: headers });
    
        // Set column widths
        const columnWidths = [
            { wch: 5 }, // 'No.'
            { wch: 20 }, // 'ISP'
            { wch: 30 }, // 'Project Title'
            { wch: 20 }, // 'Programmed Amount'
            { wch: 20 }, // 'Total Budget'
            { wch: 30 }, // 'Implementing Agency'
            { wch: 20 }, // 'Region of IA'
            { wch: 30 }, // 'Duration'
            { wch: 30 }, // 'Particulars/Schedule'
            { wch: 20 }, // 'Funding'
            { wch: 20 }, // 'DV No.'
            { wch: 30 }, // 'Date of Release/Transferred (FAIS)'
            { wch: 15 }, // 'Month'
            { wch: 20 }, // 'Actual Release per FAIS/DV/ADA'
            { wch: 20 }, // 'Remarks'
            { wch: 20 }, // 'New/Ongoing'
            { wch: 20 }, // 'Status'
        ];
        
        ws['!cols'] = columnWidths;
    
        // Create workbook and add worksheet
        const wb = { Sheets: { 'Data Export': ws }, SheetNames: ['Data Export'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
        // Create a Blob from the data and trigger download
        const data = new Blob([excelBuffer], { type: fileType });
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + fileExtension;
        a.click();
    };
    

    function formatDate(timestamp) {
        if (!timestamp) {
            return "";
        }
    
        // Split the timestamp by comma to handle multiple dates/ranges
        const dateParts = timestamp.split(", ");
        const formattedParts = dateParts.map(part => {
            if (part.includes(" - ")) {
                const dates = part.split(" - ");
                if (dates.length === 2) {
                    return `${formatSingleDate(dates[0])} - ${formatSingleDate(dates[1])}`;
                }
            } else {
                return formatSingleDate(part);
            }
        });
    
        return formattedParts.join(", ");
    }
    
    function formatSingleDate(dateStr) {
        const date = new Date(dateStr);
        
        if (isNaN(date.getTime())) {
            return "";
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
        { name: 'No.', selector: (row, index) => index + 1, sortable: true, width: '70px' },
        { name: 'ISP', selector: (row) => row.ISP, sortable: true, wrap: true },
        { name: 'Project Title', selector: (row) => row.projectTitle, sortable: true, wrap: true, width: '180px' },
        { name: (<div>Programmed Amount</div>), selector: (row) => row.releaseData.programmedAmount, sortable: true, wrap: true, width: '140px' },
        { name: 'Total Budget', selector: (row) => row.totalBudget, sortable: true, wrap: true, width: '140px' },
        { name: (<div>Implementing Agency</div>), selector: (row) => row.implementingAgency, sortable: true, wrap: true },
        { name: 'Region of IA', selector: (row) => row.releaseData.regionIA, sortable: true, wrap: true, width: '140px' },
        {
            name: 'Duration',
            selector: (row) => {
                let startDate, endDate;
                if (!row.originalStart || !row.originalEnd) {
                    return ''; // Handle case where start or end date is missing
                }

                if (row.changeStart || row.changeImplementationDate) {
                    startDate = new Date(row.changeStart || row.originalStart);
                    endDate = new Date(row.changeImplementationDate || row.originalEnd);
                } else {
                    startDate = new Date(row.originalStart);
                    endDate = new Date(row.originalEnd);
                }

                const formatDateString = (date) => {
                    return date.toLocaleDateString('en-US', {
                        month: 'long',
                        day: '2-digit',
                        year: 'numeric'
                    });
                };

                const startDateString = formatDateString(startDate);
                const endDateString = formatDateString(endDate);

                let duration = `${startDateString} - ${endDateString}`;

                const appendExtension = (extension) => {
                    const [extensionStart, extensionEnd] = extension.split(' - ');
                    const extensionStartDate = new Date(extensionStart);
                    const extensionEndDate = new Date(extensionEnd);
                    if (!isNaN(extensionStartDate.getTime()) && !isNaN(extensionEndDate.getTime())) {
                        const extStartDateString = formatDateString(extensionStartDate);
                        const extEndDateString = formatDateString(extensionEndDate);
                        return ` (${extStartDateString} - ${extEndDateString})`;
                    }
                    return '';
                };

                if (row.secondExtension && !(row.changeStart || row.changeImplementationDate) || row.secondExtension && (row.changeStart || row.changeImplementationDate)) {
                    duration += ` (Second Extension: ${appendExtension(row.secondExtension)})`;
                } else if (row.firstExtension && !(row.changeStart || row.changeImplementationDate) || row.firstExtension && (row.changeStart || row.changeImplementationDate)) {
                    duration += ` (First Extension: ${appendExtension(row.firstExtension)})`;
                }

                return duration;
            },
            sortable: true,
            wrap: true,
            width: '150px'

        },
        { name: (<div>Particulars/Schedule</div>), selector: (row) => row.releaseData.particulars, sortable: true, wrap: true },
        { name: 'Funding', selector: (row) => row.funding, sortable: true, wrap: true },
        { name: 'DV No.', selector: (row) => row.releaseData.dvNo, sortable: true, wrap: true, width: '100px' },
        { name: (<div>Date of Release/Transferred (FAIS)</div>), selector: (row) => formatDate(row.releaseData.dateOfRelease), sortable: true, wrap: true },
        { name: 'Month', selector: (row) => row.releaseData.month, sortable: true, wrap: true },
        { name: (<div>Actual Release per FAIS/DV/ADA</div>), selector: (row) => row.releaseData.actualRelease, sortable: true, wrap: true },
        { name: 'Remarks', selector: (row) => row.releaseData.remarksReleases, sortable: true, wrap: true },
        {
            name: 'New/Ongoing',
            selector: (row) => (
                <div className={`badge p-2 ${row.remarks === 'New' ? 'bg-warning' : row.remarks === 'Ongoing' ? 'bg-primary' : row.remarks === 'Completed' ? 'bg-success' : 'bg-danger'}`}>
                    {row.remarks}
                </div>
            ),
            sortable: true,
            wrap: true,
            width: '130px'
        },
        { name: 'Status', selector: (row) => row.releaseData.statusReleases, sortable: true, wrap: true },
        {
            name: 'Actions',
            cell: (row) => (
                <>
                    <div className="dropdown">
                        <button className="btn btn-outline rounded-circle" style={{ paddingInline: '11px' }} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i className="fa-solid fa-ellipsis"></i>
                        </button>
                        <ul className="dropdown-menu border-0 p-0 m-0 h-auto w-auto shadow-lg text-start">
                            <li className='m-1 notif-item' style={{ width: '200px' }} onClick={() => handleEditModalOpen(row)}>
                                <div className=" d-flex align-items-center">
                                    <div className='p-1 px-2 pt-1 me-1'>
                                        <i className="bi bi-pencil-square fs-5"></i>
                                    </div>
                                    <div className='d-flex flex-column float'>
                                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>Edit</div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>
                </>
            ),
            width: '160px'
        },
    ];

    const calculateBudgetOverallTotal = () => {
        let overallTotal = 0;

        filteredData.forEach(project => {
            if (project.totalBudget) {
                overallTotal += parseImportedAmount(project.totalBudget);
            }
        });

        return overallTotal;
    };

    const calculateProgrammedOverallTotal = () => {
        let overallTotal = 0;

        filteredData.forEach(project => {
            if (project.releaseData.programmedAmount) {
                overallTotal += parseImportedAmount(project.releaseData.programmedAmount);
            }
        });

        return overallTotal;
    };

    const calculateActualOverallTotal = () => {
        let overallTotal = 0;

        filteredData.forEach(project => {
            if (project.releaseData.actualRelease) {
                overallTotal += parseImportedAmount(project.releaseData.actualRelease);
            }
        });

        return overallTotal;
    };

    const applyFilter = (filterData) => {
        const { ISP, programTitle, responsiblePerson, funding, remarks, originalStart } = filterData;
    
        console.log('Filter Data:', filterData);
    
        const filteredData = originalInfo.filter((row) => {
            const rowStart = new Date(row.changeStart || row.originalStart).getFullYear(); // Use changeStart if available
    
            const matchesISP = !ISP || ISP.length === 0 || ISP.includes(row.ISP);
            const matchesProgramTitle = !programTitle || row.programTitle.toLowerCase().includes(programTitle.toLowerCase());
            const matchesResponsiblePerson = !responsiblePerson || row.responsiblePerson.toLowerCase().includes(responsiblePerson.toLowerCase());
            const matchesFunding = !funding || row.funding.toLowerCase().includes(funding.toLowerCase());
            const matchesRemarks = !remarks || remarks.length === 0 || remarks.includes(row.remarks);
            const matchesYear = !originalStart || originalStart.length === 0 || originalStart.includes(rowStart);
    
            return matchesISP && matchesProgramTitle && matchesResponsiblePerson && matchesFunding && matchesRemarks && matchesYear;
        });
    
        console.log('Filtered Data:', filteredData);
    
        setInfo(filteredData);
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

    return (
        <article className={`pt-5 pb-5 ${isMobile ? 'ps-3 pe-3' : isTablet ? 'ps-4 pe-4' : 'pe-5'}`}>
            <EditReleasesModal
                isEditModalOpen={isEditModalOpen}
                closeModal={() => setIsEditModalOpen(false)}
                project={selectedProject}
                refresh={refreshData}
                showToastF={showToastF}
            />
            <div className="d-flex justify-content-between align-items-center">
                <label className='h5 fw-semibold pt-2'>GIA Releases</label>
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
                    <FilterReleasesModal
                        applyFilter={applyFilter}
                        availableYears={availableYears}
                        availableISP={availableISP}
                    />
                    <div className='sample me-3 refreshTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
                        <Tooltip anchorSelect=".refreshTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                            Refresh
                        </Tooltip>
                        <button type="button" className="btn border-0" onClick={refreshData} data-bs-toggle="tooltip" data-bs-title="Refresh">
                            <i className="fa-solid fa-sync fs-5"></i>
                        </button>
                    </div>
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
                            id="importReleasesFile" 
                            onChange={importFromExcel} 
                            accept=".xlsx,.xls" 
                            style={{ display: 'none' }} 
                        />
                        <button 
                            type="button" 
                            className="btn border-0 importTooltip" 
                            onClick={() => document.getElementById('importReleasesFile').click()}
                            data-bs-toggle="tooltip" 
                            data-bs-title="Import from Excel"
                        >
                            <i className="fa-solid fa-upload fs-5"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div className='dashboard-summary-row pt-4'>
                <div className='dashboard-summary-col'>
                    <div className='card radius-10 border dashboard-summary-card'>
                        <div className='card-body' style={{ padding: '25px 20px 25px 35px' }}>
                            <div className='dashboard-summary-icon' style={{ backgroundColor: '#E0F2F1', borderRadius: '50px', padding: '10px', marginRight: '15px' }}>
                                <i className='fa-solid fa-equals fs-5 p-1' style={{ color: '#009688' }}></i>
                            </div>
                            <div className='dashboard-summary-content'>
                                <p className='mb-0 text-dark fs-4 fw-bold'>{calculateBudgetOverallTotal().toLocaleString()}</p>
                                <p className='text-secondary h6' style={{ fontSize: '15px' }}>Overall Budget</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='dashboard-summary-col'>
                    <div className='card radius-10 border dashboard-summary-card'>
                        <div className='card-body' style={{ padding: '25px 20px 25px 35px' }}>
                            <div className='dashboard-summary-icon' style={{ backgroundColor: '#E0F2F1', borderRadius: '50px', padding: '10px', marginRight: '15px' }}>
                                <i className='fa-solid fa-equals fs-5 p-1' style={{ color: '#009688' }}></i>
                            </div>
                            <div className='dashboard-summary-content'>
                                <p className='mb-0 text-dark fs-4 fw-bold'>{calculateProgrammedOverallTotal().toLocaleString()}</p>
                                <p className='text-secondary h6' style={{ fontSize: '15px' }}>Programmed Budget</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='dashboard-summary-col'>
                    <div className='card radius-10 border dashboard-summary-card'>
                        <div className='card-body' style={{ padding: '25px 20px 25px 35px' }}>
                            <div className='dashboard-summary-icon' style={{ backgroundColor: '#E0F2F1', borderRadius: '50px', padding: '10px', marginRight: '15px' }}>
                                <i className='fa-solid fa-equals fs-5 p-1' style={{ color: '#009688' }}></i>
                            </div>
                            <div className='dashboard-summary-content'>
                                <p className='mb-0 text-dark fs-4 fw-bold'>{calculateActualOverallTotal().toLocaleString()}</p>
                                <p className='text-secondary h6' style={{ fontSize: '15px' }}>Actual Releases</p>
                            </div>
                        </div>
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

export default Releases