import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import { Tooltip } from 'react-tooltip';
import { useLocation } from "react-router-dom";
import './Dashboard.css';
import FilterBudgetModal from './FilterBudgetModal';

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

const Budgets = ({ data, sidebarExpanded }) => {
    const [originalInfo, setOriginalInfo] = useState([]);
    const [info, setInfo] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [yearlyTotals, setYearlyTotals] = useState({});
    const [availableYears, setAvailableYears] = useState([]);
    const [availableISP, setAvailableISP] = useState([]);

    const location = useLocation();
    const state = location.state;
    const [filterValue, setFilterValue] = useState('');
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
        const response = await axios.get('http://localhost:8080/Projects');
        setOriginalInfo(response.data);
        setInfo(response.data);
        calculateYearlyTotals(response.data);
        fetchAvailableYears(response.data);
        fetchAvailableISPs(response.data);
    };

    // Helper to get budget value for a given row and calendar year
    const getBudgetValueForYear = (row, year) => {
        if (!row) return 0;
        // determine project start/end
        let startYear, endYear;
        if (row.changeStart || row.changeImplementationDate) {
            startYear = new Date(row.changeStart || row.originalStart).getFullYear();
            endYear = new Date(row.changeImplementationDate || row.originalEnd).getFullYear();
        } else if (row.originalStart && row.originalEnd) {
            startYear = new Date(row.originalStart).getFullYear();
            endYear = new Date(row.originalEnd).getFullYear();
        }

        const yearNum = parseInt(year);
        const withinDuration = (startYear && endYear) ? (yearNum >= startYear && yearNum <= endYear) : true;
        if (!withinDuration) return 0;

        if (!row.budget) return 0;

        // prefer calendar year keys
        let val = row.budget[year];
        if (val === undefined) {
            if (startYear) {
                const idx = yearNum - startYear + 1;
                if (idx >= 1 && row.budget[String(idx)] !== undefined) {
                    val = row.budget[String(idx)];
                }
            }
        }

        if (val === undefined || val === null || val === '') return 0;
        const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : Number(val);
        return isNaN(num) ? 0 : num;
    };

    const computeRowTotal = (row) => {
        return allYears.reduce((acc, y) => acc + getBudgetValueForYear(row, y), 0);
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

                    const autoDetectColumns = (data) => {
                        const sample = data.slice(0, 30);
                        const headers = Object.keys(sample[0] || {});
                        const scores = {};

                        headers.forEach(h => {
                            const vals = sample.map(r => r[h]).filter(v => v !== undefined && v !== null && v !== '');
                            const nv = vals.length;
                            let yearCount = 0, amountCount = 0, textCount = 0;
                            vals.forEach(v => {
                                const s = String(v).trim();
                                if (/^\d{4}$/.test(s) && parseInt(s) > 1900 && parseInt(s) < 2100) yearCount++;
                                const num = parseFloat(String(s).replace(/[^0-9.-]/g, ''));
                                if (!isNaN(num) && /[0-9]/.test(s)) amountCount++;
                                if (/[a-zA-Z]/.test(s)) textCount++;
                            });
                            scores[h] = {
                                yearScore: nv ? yearCount / nv : 0,
                                amountScore: nv ? amountCount / nv : 0,
                                textScore: nv ? textCount / nv : 0
                            };
                        });

                        // pick best header by score for each type
                        const pickBest = (key) => {
                            let best = null, bestScore = -1;
                            headers.forEach(h => {
                                const s = scores[h];
                                const val = s ? s[key] : 0;
                                if (val > bestScore) {
                                    bestScore = val; best = h;
                                }
                            });
                            return { header: best, score: bestScore };
                        };

                        const yearPick = pickBest('yearScore');
                        const amountPick = pickBest('amountScore');
                        const textPick = pickBest('textScore');

                        // ensure uniqueness: if duplicates, pick next-best
                        const used = new Set();
                        const chooseUnique = (preferredOrder) => {
                            for (let pref of preferredOrder) {
                                let bestH = null; let bestS = -1;
                                headers.forEach(h => {
                                    if (used.has(h)) return;
                                    const s = scores[h] ? scores[h][pref] : 0;
                                    if (s > bestS) { bestS = s; bestH = h; }
                                });
                                if (bestH) { used.add(bestH); return { header: bestH, score: bestS }; }
                            }
                            return { header: null, score: 0 };
                        };

                        const detectedYear = chooseUnique(['yearScore', 'amountScore', 'textScore']);
                        const detectedAmount = chooseUnique(['amountScore', 'textScore', 'yearScore']);
                        const detectedTitle = chooseUnique(['textScore', 'amountScore', 'yearScore']);
                        const detectedTotal = chooseUnique(['amountScore', 'textScore', 'yearScore']);

                        return {
                            projectTitle: detectedTitle.header,
                            year: detectedYear.header,
                            amount: detectedAmount.header,
                            totalBudget: detectedTotal.header
                        };
                    };

                    console.log('Parsed sheet jsonData (first 10 rows):', jsonData.slice(0, 10));

                    // Detect columns automatically if headers don't match expected names
                    const mapping = autoDetectColumns(jsonData);
                    console.log('Auto-detected mapping:', mapping);

                    const rowsToImport = jsonData.map(row => {
                        const getVal = (colNames) => {
                            // Try explicit name matching first
                            const explicit = findColumn(row, ...colNames);
                            if (explicit !== null) return explicit;
                            // Then try detected header
                            const det = mapping[colNames[0] === 'Project Title' ? 'projectTitle' : (colNames[0] === 'Year' ? 'year' : (colNames[0] === 'Amount' ? 'amount' : 'totalBudget'))];
                            if (det && row[det] !== undefined) return row[det];
                            return null;
                        };

                        return {
                            projectTitle: getVal(['Project Title', 'Project', 'Project Name']) || null,
                            year: getVal(['Year', 'year']) || null,
                            amount: getVal(['Amount', 'amount', 'Value']) || null,
                            totalBudget: getVal(['Total', 'Total Budget', 'totalBudget']) || null,
                        };
                    }).filter(r => r.projectTitle && r.year && (r.amount !== null && r.amount !== undefined && r.amount !== ''));
                    
                    console.log('rowsToImport (first 20):', rowsToImport.slice(0, 20));
                    const response = await axios.post('http://localhost:8080/ImportBudgets', rowsToImport);
                    if (response.status === 200) {
                        alert('Budgets imported successfully!');
                        getInfo();
                    }
                } catch (error) {
                    console.error('Error importing budgets:', error);
                    alert('Error importing budgets: ' + error.message);
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
        const fileName = 'Budget Masterlist';
    
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
                    // Determine duration for export: only include values for years within project duration
                    let startYear, endYear;
                    if (row.changeStart || row.changeImplementationDate) {
                        startYear = new Date(row.changeStart || row.originalStart).getFullYear();
                        endYear = new Date(row.changeImplementationDate || row.originalEnd).getFullYear();
                    } else if (row.originalStart && row.originalEnd) {
                        startYear = new Date(row.originalStart).getFullYear();
                        endYear = new Date(row.originalEnd).getFullYear();
                    }
                    const yearNum = parseInt(year);
                    const withinDuration = (startYear && endYear) ? (yearNum >= startYear && yearNum <= endYear) : true;

                    if (withinDuration) {
                        // prefer calendar year keys
                        if (row.budget && row.budget[year] !== undefined) {
                            acc[year] = parseFloat(row.budget[year].toString().replace(/,/g, ''));
                        } else {
                            // map numeric indexes to calendar years using startYear
                            if (startYear) {
                                const idx = yearNum - startYear + 1;
                                if (idx >= 1 && row.budget && row.budget[String(idx)] !== undefined) {
                                    acc[year] = parseFloat(row.budget[String(idx)].toString().replace(/,/g, ''));
                                } else {
                                    acc[year] = 0;
                                }
                            } else {
                                acc[year] = 0;
                            }
                        }
                    } else {
                        acc[year] = '';
                    }
                    return acc;
                }, {}),
                'Total': computeRowTotal(row),
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
        const wb = { Sheets: { 'Budget Masterlist': ws }, SheetNames: ['Budget Masterlist'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
        // Create a Blob from the data and trigger download
        const data = new Blob([excelBuffer], { type: fileType });
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName + fileExtension;
        a.click();
    };

    const allYears = (() => {
        // Always show headers from 2011 through 2030. Also include any years found in project budgets.
        const defaultYears = Array.from({ length: 2030 - 2011 + 1 }, (_, i) => String(2011 + i));
            const years = originalInfo.reduce((acc, project) => {
                const projectYears = project.budget ? Object.keys(project.budget) : [];
                projectYears.forEach(year => {
                    const yearNum = parseInt(year);
                    // only include calendar year keys (>=2011). Skip numeric indices like 1,2,3,4
                    if (!isNaN(yearNum) && yearNum >= 2011 && !acc.includes(year)) {
                        acc.push(year);
                    }
                });
                return acc;
            }, []);

            // Ensure default range years are present
            defaultYears.forEach(year => {
                if (!years.includes(year)) {
                    years.push(year);
                }
            });

        return years.sort((a, b) => parseInt(a) - parseInt(b));
    })();

    const columns = [
        { name: 'No.', selector: (row, index) => index + 1, sortable: true, width: '70px' },
        { name: 'ISP', selector: (row) => row.ISP, sortable: true, wrap: true },
        {
            name: 'Program Title',
            selector: (row) => row.programTitle ?? '',
            cell: (row) => React.createElement(ProjectTitleCell, { title: row.programTitle ?? '' }),
            sortable: true,
            wrap: true,
            width: '180px',
        },
        {
            name: 'Project Title',
            selector: (row) => row.projectTitle ?? '',
            cell: (row) => React.createElement(ProjectTitleCell, { title: row.projectTitle ?? '' }),
            sortable: true,
            wrap: true,
            width: '180px',
        },
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
                // Determine project duration years
                let startYear, endYear;
                if (row.changeStart || row.changeImplementationDate) {
                    startYear = new Date(row.changeStart || row.originalStart).getFullYear();
                    endYear = new Date(row.changeImplementationDate || row.originalEnd).getFullYear();
                } else if (row.originalStart && row.originalEnd) {
                    startYear = new Date(row.originalStart).getFullYear();
                    endYear = new Date(row.originalEnd).getFullYear();
                }

                const yearNum = parseInt(year);
                // If duration is not available, fall back to showing value if present
                const withinDuration = (startYear && endYear) ? (yearNum >= startYear && yearNum <= endYear) : true;

                if (!withinDuration) return '';

                if (!row.budget) return '';

                // prefer calendar year keys
                let val = row.budget[year];
                if (val === undefined) {
                    // map numeric index keys (1,2,3...) to calendar years using startYear
                    if (startYear) {
                        const idx = yearNum - startYear + 1;
                        if (idx >= 1 && row.budget[String(idx)] !== undefined) {
                            val = row.budget[String(idx)];
                        }
                    }
                }

                if (val === undefined || val === null || val === '') return '';
                const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : Number(val);
                return isNaN(num) ? '' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            },
            sortable: true,
        })),
        { name: 'Total', selector: (row) => {
            const total = computeRowTotal(row);
            return total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    ];

    const calculateYearlyTotals = (data) => {
        const totals = {};

        // Initialize totals for allYears
        allYears.forEach(y => totals[y] = 0);

        data.forEach(project => {
            // determine project start year for numeric index mapping
            let startYear;
            if (project.changeStart || project.changeImplementationDate) {
                startYear = new Date(project.changeStart || project.originalStart).getFullYear();
            } else if (project.originalStart) {
                startYear = new Date(project.originalStart).getFullYear();
            }

            allYears.forEach(year => {
                const yearNum = parseInt(year);
                // only consider years within duration if start/end exist
                let withinDuration = true;
                if (project.changeStart || project.changeImplementationDate) {
                    const s = new Date(project.changeStart || project.originalStart).getFullYear();
                    const e = new Date(project.changeImplementationDate || project.originalEnd).getFullYear();
                    withinDuration = yearNum >= s && yearNum <= e;
                } else if (project.originalStart && project.originalEnd) {
                    const s = new Date(project.originalStart).getFullYear();
                    const e = new Date(project.originalEnd).getFullYear();
                    withinDuration = yearNum >= s && yearNum <= e;
                }

                if (!withinDuration) return;

                let value = 0;
                if (project.budget) {
                    // prefer calendar year keys
                    if (project.budget[year] !== undefined) {
                        value = parseFloat(String(project.budget[year]).replace(/,/g, '')) || 0;
                    } else {
                        // map numeric index keys (1,2,3...) to calendar years using startYear
                        if (startYear) {
                            const idx = yearNum - startYear + 1;
                            if (idx >= 1 && project.budget[String(idx)] !== undefined) {
                                value = parseFloat(String(project.budget[String(idx)]).replace(/,/g, '')) || 0;
                            }
                        }
                    }
                }

                totals[year] = (totals[year] || 0) + value;
            });
        });

        setYearlyTotals(totals);
    };

    const calculateOverallTotal = () => {
        let overallTotal = 0;
        filteredData.forEach(project => {
            overallTotal += computeRowTotal(project);
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
            <div className="d-flex justify-content-between align-items-center">
                <label className='h5 fw-semibold pt-2'>Budget Masterlist</label>
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
                    <FilterBudgetModal
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
                            id="importBudgetsFile" 
                            onChange={importFromExcel} 
                            accept=".xlsx,.xls" 
                            style={{ display: 'none' }} 
                        />
                        <button 
                            type="button" 
                            className="btn border-0 importTooltip" 
                            onClick={() => document.getElementById('importBudgetsFile').click()}
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
                                <p className='text-secondary h6' style={{ fontSize: '15px' }}>Overall Budget Total</p>
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

        </article>
    )
}

export default Budgets