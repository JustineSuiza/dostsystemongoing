import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import { Tooltip } from 'react-tooltip';
import { useLocation } from "react-router-dom";
import './Dashboard.css';
import EditCounterpartFundModal from './EditCounterpartFundModal';
import FilterCounterpartFundModal from './FilterCounterpartFundModal';
import { listImportedProjects, parseImportedAmount, saveProjectRelatedRows } from '../firestoreImports';

const CounterpartFunds = ({ data, sidebarExpanded }) => {
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
        console.log(info)
    }, []);

    const getInfo = async () => {
        const projects = await listImportedProjects();
        setOriginalInfo(projects);
        setInfo(projects);
        calculateYearlyTotals(projects);
        fetchAvailableYears(projects);
        fetchAvailableISPs(projects);
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
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    // Flexible column matching helper
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
                        year: findColumn(row, 'Year', 'year') || null,
                        amount: findColumn(row, 'Amount', 'amount', 'Value') || null,
                        totalFund: findColumn(row, 'Total', 'Total Fund', 'totalFund') || null,
                    })).filter(r => r.projectTitle && r.year && (r.amount !== null && r.amount !== undefined && r.amount !== ''));

                    // Send to backend for processing
                    if (rowsToImport.length > 0) {
                        const result = await saveProjectRelatedRows('counterpartFunds', rowsToImport);
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 3000);
                        if (result.skippedCount) {
                            alert(`Imported ${result.importedCount} rows to Firebase. Skipped ${result.skippedCount} rows that did not match an imported project.`);
                        }
                        await getInfo();
                    } else {
                        alert('No valid counterpart fund rows were found in the selected file.');
                    }
                } catch (error) {
                    console.error('Error importing counterpart funds:', error);
                    alert('Error importing counterpart funds: ' + error.message);
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

    const exportToExcel = () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const fileName = 'Counterpart Funds';
    
        const headers = [
            'No.',
            'ISP',
            'Program Title',
            'Project Title',
            'Implementing Agency',
            'Program Leader',
            'Duration',
            ...allYears,
            'Total',
            'Remarks'
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
                'Program Title': row.programTitle,
                'Project Title': row.projectTitle,
                'Implementing Agency': row.implementingAgency,
                'Program Leader': row.programLeader,
                'Duration': duration,
                ...allYears.reduce((acc, year) => {
                    if (row.counterFund && row.counterFund[year]) {
                        const yearNum = parseInt(year);
                        // Only include if year is valid (> 0)
                        if (!isNaN(yearNum) && yearNum > 0) {
                            acc[year] = parseFloat(row.counterFund[year].toString().replace(/,/g, ''));
                        }
                    } else {
                        acc[year] = 0;
                    }
                    return acc;
                }, {}),
                'Total': parseImportedAmount(row.counterpartFundData?.totalFund),
                'Remarks': row.remarks,
            };
    
            return rowData;
        });
    
        // Calculate the column for each year and the total budget column
        const yearColumns = allYears.map((year, index) => {
            return String.fromCharCode(65 + headers.indexOf(year));
        });
    
        const totalColumn = String.fromCharCode(65 + headers.indexOf('Total'));
    
        // Add an extra row for yearly totals and overall total
        const totalsRow = allYears.reduce((acc, year, index) => {
            const yearColumn = yearColumns[index];
            const totalFormula = exportData.length > 0 ? `SUM(${yearColumn}2:${yearColumn}${exportData.length + 1})` : '0';
            acc[year] = { f: totalFormula };
            return acc;
        }, {});
    
        totalsRow['Total'] = { f: `SUM(${totalColumn}2:${totalColumn}${exportData.length + 1})` };
    
        const yearlyTotalsRow = {
            'No.': '',
            'ISP': 'Yearly Total',
            'Program Title': '',
            'Project Title': '',
            'Implementing Agency': '',
            'Program Leader': '',
            'Duration': '',
            ...totalsRow,
            'Remarks': ''
        };
    
        exportData.push(yearlyTotalsRow);
    
        // Convert the data to a worksheet
        const ws = XLSX.utils.json_to_sheet(exportData, { header: headers });
    
        // Set column widths
        const columnWidths = [
            { wch: 5 }, // 'No.'
            { wch: 20 }, // 'ISP'
            { wch: 30 }, // 'Program Title'
            { wch: 30 }, // 'Project Title'
            { wch: 30 }, // 'Implementing Agency'
            { wch: 30 }, // 'Program Leader'
            { wch: 30 }, // 'Duration'
            ...allYears.map(() => ({ wch: 20 })), // Width for each year
            { wch: 20 }, // 'Total'
            { wch: 30 }, // 'Remarks'
        ];
        
        ws['!cols'] = columnWidths;
    
        // Create workbook and add worksheet
        const wb = { Sheets: { 'Counterpart Funds': ws }, SheetNames: ['Counterpart Funds'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
        // Create a Blob from the data and trigger download
        const data = new Blob([excelBuffer], { type: fileType });
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + fileExtension;
        a.click();
    };


    // Define fixed years 2016-2030, then add any additional years from data
    const fixedYears = Array.from({ length: 15 }, (_, i) => String(2016 + i)); // 2016-2030
    const allYears = [
        ...fixedYears,
        ...originalInfo.reduce((years, project) => {
            const projectYears = project.counterFund ? Object.keys(project.counterFund) : [];
            projectYears.forEach(year => {
                // Filter out invalid years (0, "0", null, or non-numeric values)
                const yearNum = parseInt(year);
                if (!isNaN(yearNum) && yearNum > 0 && !fixedYears.includes(year) && !years.includes(year)) {
                    years.push(year);
                }
            });
            return years;
        }, [])
    ].sort((a, b) => parseInt(a) - parseInt(b));

    const columns = [
        { name: 'No.', selector: (row, index) => index + 1, sortable: true, width: '70px' },
        { name: 'ISP', selector: (row) => row.ISP, sortable: true, wrap: true },
        { name: 'Project Title', selector: (row) => row.projectTitle, sortable: true, wrap: true, width: '180px' },
        { name: (<div>Implementing Agency</div>), selector: (row) => row.implementingAgency, sortable: true, wrap: true },
        { name: 'Program Leader', selector: (row) => row.programLeader, sortable: true, wrap: true, width: '160px' },
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
        ...allYears.map(year => ({
            name: year,
            selector: row => {
                if (!row.counterFund) return '';
                const value = row.counterFund[year];
                // Handle both string and numeric values
                if (typeof value === 'string') {
                    return parseFloat(value.replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                return value ? value.toLocaleString() : '';
            },
            sortable: true,
        })),
        { name: 'Total', selector: (row) => {
            if (row.counterpartFundData && row.counterpartFundData.totalFund) {
                const value = parseImportedAmount(row.counterpartFundData.totalFund);
                return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            return '0.00';
        }, sortable: true, wrap: true, width: '140px' },
        {
            name: 'Remarks',
            selector: (row) => (
                <div className={`badge p-2 ${row.remarks === 'New' ? 'bg-warning' : row.remarks === 'Ongoing' ? 'bg-primary' : row.remarks === 'Completed' ? 'bg-success' : 'bg-danger'}`}>
                    {row.remarks}
                </div>
            ),
            sortable: true,
            wrap: true,
            width: '130px'
        },
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

    const calculateYearlyTotals = (data) => {
        const totals = {};

        data.forEach(project => {
            if (project.counterFund) {
                Object.keys(project.counterFund).forEach(year => {
                    // Filter out invalid years (0, "0", null, or non-numeric values)
                    const yearNum = parseInt(year);
                    if (!isNaN(yearNum) && yearNum > 0) {
                        const budgetValue = parseImportedAmount(project.counterFund[year]);
                        totals[year] = (totals[year] || 0) + budgetValue;
                    }
                });
            }
        });

        setYearlyTotals(totals);
    };

    const calculateOverallTotal = () => {
        let overallTotal = 0;
    
        filteredData.forEach(project => {
            if (project.counterpartFundData && project.counterpartFundData.totalFund) {
                overallTotal += parseImportedAmount(project.counterpartFundData.totalFund);
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
    
    const sortedData = [...filteredData].sort((a, b) => b.id - a.id);

    const overallTotal = calculateOverallTotal();
    
    return (
        <article className={`pt-5 pb-5 ${isMobile ? 'ps-3 pe-3' : isTablet ? 'ps-4 pe-4' : 'pe-5'}`}>
            <EditCounterpartFundModal
                isEditModalOpen={isEditModalOpen}
                closeModal={() => setIsEditModalOpen(false)}
                project={selectedProject}
                refresh={refreshData}
                showToastF={showToastF}
            />
            <div className="d-flex justify-content-between align-items-center">
                <label className='h5 fw-semibold pt-2'>Counterpart Funds</label>
                <div className="d-flex align-items-center">
                    <div className="me-4">
                        <div style={{ position: 'relative', width: isMobile ? '160px' : '260px' }}>
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
                                        zIndex: 1,
                                    }}
                                    onClick={() => setFilterValue('')}
                                />
                            )}
                        </div>
                    </div>
                    <FilterCounterpartFundModal
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
                            id="importCounterpartFundsFile" 
                            onChange={importFromExcel} 
                            accept=".xlsx,.xls" 
                            style={{ display: 'none' }} 
                        />
                        <button 
                            type="button" 
                            className="btn border-0 importTooltip" 
                            onClick={() => document.getElementById('importCounterpartFundsFile').click()}
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
                                <p className='mb-0 text-dark fs-4 fw-bold'>{calculateOverallTotal().toLocaleString()}</p>
                                <p className='text-secondary h6' style={{ fontSize: '15px' }}>Overall Counterpart Fund Total</p>
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

            <div className="">
                <h6 className='fw-bold'>Yearly Totals</h6>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Year</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(yearlyTotals).map(year => (
                            <tr key={year}>
                                <td>{year}</td>
                                <td>{parseFloat(yearlyTotals[year]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-2">
                <h6>Overall Total: {parseFloat(overallTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h6>
            </div>

            {/* <div className="yearly-totals">
                <strong>Yearly Totals:</strong>
                {allYears.map(year => (
                    <span key={year} className="year-total">{year}: {yearlyTotals[year] ? yearlyTotals[year].toLocaleString() : '0.00'} </span>
                ))}
                <span className="overall-total">Overall Total: {calculateOverallTotal().toLocaleString()}</span>
            </div> */}
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

export default CounterpartFunds