import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from "react-router-dom";
import DataTable from 'react-data-table-component';
import './GenerateReport.css'
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Tooltip } from 'react-tooltip';
import * as XLSX from 'xlsx';

const normalizeRegionLabel = (region) => {
    if (!region) return '';

    const normalized = String(region).trim();
    const aliases = {
        'Region I: Ilocos Region': 'Region I (Ilocos Region)',
        'Region II: Cagayan Valley': 'Region II (Cagayan Valley)',
        'Region III: Central Luzon': 'Region III (Central Luzon)',
        'Region IV-A: CALABARZON': 'Region IV-A (CALABARZON)',
        'Region IV-B: MIMAROPA': 'Region IV-B (MIMAROPA)',
        'Region V: Bicol Region': 'Region V (Bicol Region)',
        'Region VI: Western Visayas': 'Region VI (Western Visayas)',
        'Region VII: Central Visayas': 'Region VII (Central Visayas)',
        'Region VIII: Eastern Visayas': 'Region VIII (Eastern Visayas)',
        'Region IX: Zamboanga Peninsula': 'Region IX (Zamboanga Peninsula)',
        'Region X: Northern Mindanao': 'Region X (Northern Mindanao)',
        'Region XI: Davao Region': 'Region XI (Davao Region)',
        'Region XII: SOCCSKSARGEN': 'Region XII (SOCCSKSARGEN)',
        'Region XIII: Caraga': 'Region XIII (Caraga)',
        'NCR: National Capital Region': 'National Capital Region (NCR)',
        'NCR: National Capital Region (Metro Manila)': 'National Capital Region (NCR)',
        'National Capital Region': 'National Capital Region (NCR)',
        'CAR: Cordillera Administrative Region': 'Cordillera Administrative Region (CAR)',
        'Autonomous Region in Muslim Mindanao': 'Autonomous Region in Muslim Mindanao (ARMM)',
        'Bangsamoro Autonomous Region in Muslim Mindanao': 'Autonomous Region in Muslim Mindanao (ARMM)',
    };

    return aliases[normalized] || normalized;
};

export const matchesReportFilters = (item, filters = {}) => {
    const {
        selectedStatus = [],
        selectedFunding = [],
        selectedRegion = [],
        selectedTagging = [],
    } = filters;

    const statusValue = item.status || item.remarks;
    const normalizedTagging = (item.tagging || '').toString().trim().toLowerCase();
    const normalizedSelectedTagging = selectedTagging.map(tag => (tag || '').toString().trim().toLowerCase());

    if (selectedStatus.length > 0 && !selectedStatus.includes(statusValue)) {
        return false;
    }

    if (selectedFunding.length > 0 && !selectedFunding.includes(item.funding)) {
        return false;
    }

    const itemRegion = normalizeRegionLabel(item.region || item.releaseData?.regionIA);
    const normalizedSelectedRegions = selectedRegion.map(normalizeRegionLabel);
    if (normalizedSelectedRegions.length > 0 && !normalizedSelectedRegions.includes(itemRegion)) {
        return false;
    }

    if (selectedTagging.length > 0) {
        if (!normalizedTagging || !normalizedSelectedTagging.includes(normalizedTagging)) {
            return false;
        }
    }

    return true;
};

export const GenerateReport = ({ sidebarExpanded }) => {
    const [originalInfo, setOriginalInfo] = useState([]);
    const [info, setInfo] = useState([]);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [selectedYears, setSelectedYears] = useState([]);
    const location = useLocation();
    const state = location.state;
    const [filterValue, setFilterValue] = useState('');
    const [selectedStatus, setSelectedStatus] = useState([]);
    const [selectedFunding, setSelectedFunding] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState([]);
    const [selectedTagging, setSelectedTagging] = useState([]);

    useEffect(() => {
        // getInfo();
    }, []);

    // const getInfo = async () => {
    //     try {
    //         const response = await axios.get('http://localhost:8080/Projects/');
    //         setOriginalInfo(response.data);
    //         setInfo(response.data);
    //     } catch (error) {
    //         console.error('Error fetching data:', error);
    //     }
    // };

    const handleFundingToggle = (funding) => {
        if (selectedFunding.includes(funding)) {
            setSelectedFunding(selectedFunding.filter(f => f !== funding));
        } else {
            setSelectedFunding([...selectedFunding, funding]);
        }
    };    

    const handleRegionToggle = (region) => {
        if (selectedRegion.includes(region)) {
            setSelectedRegion(selectedRegion.filter(item => item !== region));
        } else {
            setSelectedRegion([...selectedRegion, region]);
        }
    };

    const handleStatusToggle = (status) => {
        if (selectedStatus.includes(status)) {
            setSelectedStatus(selectedStatus.filter(r => r !== status));
        } else {
            setSelectedStatus([...selectedStatus, status]);
        }
    };    

    const handleTaggingToggle = (tag) => {
        if (selectedTagging.includes(tag)) {
            setSelectedTagging(selectedTagging.filter(item => item !== tag));
        } else {
            setSelectedTagging([...selectedTagging, tag]);
        }
    };

    const handleColumnToggle = (title) => {
        if (selectedColumns.includes(title)) {
            setSelectedColumns(selectedColumns.filter(col => col !== title));
        } else {
            setSelectedColumns([...selectedColumns, title]);
        }
    };

    const formatColumnName = (columnName) => {
        let formattedName = columnName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        if (formattedName === "Mande") {
            formattedName = "M&E";
        } else if (formattedName === "Created_at") {
            formattedName = "Created At";
        } else if (formattedName === "Created_by") {
            formattedName = "Created By";
        }
        
        // Remove "Release Data" part if it exists
        formattedName = formattedName.replace('Release Data', '').trim();
    
        // Split column name by "." to handle nested properties
        const parts = formattedName.split('.');
        formattedName = parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '); // Capitalize each part
        
        return formattedName;
    };
    

    const getColumnTitles = () => {
        if (!state || !state.length) return [];
    
        const getAllKeys = (obj) => {
            let keys = [];
            for (const key in obj) {
                if (typeof obj[key] === 'object') {
                    keys.push(...getAllKeys(obj[key]).map(subKey => `${key}.${subKey}`));
                } else if (
                    key !== 'id' &&
                    key !== 'project_id' &&
                    key !== 'updated_at' &&
                    key !== 'deleted_at' &&
                    key !== 'created_at' 
                ) {
                    keys.push(key);
                }
            }
            return keys;
        };
    
        const columnTitles = Object.keys(state[0]).
            filter(
                title => title !== 'id' &&
                    title !== 'sixPSData' &&
                    title !== 'counterFund' &&
                    title !== 'updated_at' &&
                    title !== 'deleted_at' &&
                    title !== 'counterpartFundData' &&
                    title !== 'totalBudget' &&
                    title !== 'budget' &&
                    title !== 'releaseData' &&
                    title !== 'sixPs' &&
                    title !== 'fileData'
            );
    
        // Add releaseData properties to columnTitles if they exist in the state
        if (state[0].releaseData) {
            columnTitles.push('releaseData');
            Object.keys(state[0].releaseData).forEach(key => {
                // Exclude the 'id' property within the releaseData object
                if (key !== 'id' && key !== 'project_id' && key !== 'created_at' && key !== 'updated_at' && key !== 'deleted_at') {
                    columnTitles.push(`releaseData.${key}`);
                }
            });
        }

        const index = columnTitles.indexOf('releaseData');
        if (index !== -1) {
            columnTitles.splice(index, 1);
        }
    
        return columnTitles;
    };    

    const generateColumns = () => {
        const releaseDataColumns = ['actualRelease', 'dateOfRelease']; // Add any other releaseData properties here if needed
    
        return selectedColumns.map(column => ({
            name: formatColumnName(column),
            selector: row => {
                // Check if the column is a releaseData property
                if (releaseDataColumns.includes(column) && row.releaseData) {
                    return row.releaseData[column];
                } else {
                    return row[column];
                }
            },
            sortable: true,
            wrap: true,
            width: 'auto', // Adjust width as needed
        }));
    };

    // const filterDataBySelectedColumns = () => {
    //     if (!state || !state.length) return [];
        
    //     // Filter data by year
    //     const filteredData = filterDataByYear();
    
    //     return filteredData.map(item => {
    //         const filteredItem = {};
    
    //         // Check if releaseData is selected
    //         if (selectedColumns.includes('releaseData')) {
    //             filteredItem.releaseData = item.releaseData;
    //         }
    
    //         // Iterate over selected columns and add data to filteredItem
    //         selectedColumns.forEach(column => {
    //             if (column !== 'releaseData') {
    //                 filteredItem[column] = getColumnValue(item, column);
    //             }
    //         });
    
    //         return filteredItem;
    //     });
    // };
    
    const filterDataBySelectedColumns = () => {
        if (!state || !state.length) return [];
    
        // Filter data by year
        const filteredData = filterDataByYear();
    
        return filteredData.map(item => {
            if (!matchesReportFilters(item, { selectedStatus, selectedFunding, selectedRegion, selectedTagging })) {
                return false;
            }
    
            const filteredItem = {};
    
            // Check if releaseData is selected
            if (selectedColumns.includes('releaseData')) {
                filteredItem.releaseData = item.releaseData;
            }
    
            // Iterate over selected columns and add data to filteredItem
            selectedColumns.forEach(column => {
                if (column !== 'releaseData') {
                    filteredItem[column] = getColumnValue(item, column);
                }
            });
    
            return filteredItem;
        }).filter(Boolean); // Remove falsy values (i.e., items that were filtered out)
    };
         
    
    // Helper function to get value of nested properties
    const getColumnValue = (item, column) => {
        const keys = column.split('.');
        let value = item;
        for (const key of keys) {
            if (value[key]) {
                value = value[key];
            } else {
                return ''; // Return empty string if property doesn't exist
            }
        }
        return value;
    };
    
    const exportToExcel = () => {
        const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const fileName = 'Generated_Report'; // Update with your desired file name
        
        let exportData = filterDataBySelectedColumns();
    
        // Create an array of arrays representing rows and columns
        const rows = exportData.map(row => {
            return selectedColumns.map(column => {
                return row[column];
            });
        });
    
        // Add headers as the first row
        rows.unshift(selectedColumns.map(column => formatColumnName(column)));
    
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);
    
        // Add the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Data Export');
    
        // Save the workbook
        XLSX.writeFile(wb, fileName + fileExtension);
    };

    const downloadWordFile = async () => {
        const currentDate = new Date().toISOString().split('T')[0];
        const filteredData = filterDataBySelectedColumns();

        const paragraphs = filteredData.map((row, index) => {
            const textRuns = [];
            Object.keys(row).forEach(key => {
                textRuns.push(new TextRun({
                    text: `${formatColumnName(key)}: ${row[key]} `,
                    break: 1.5,
                    font: { name: 'Arial' },
                }));
            });
            return new Paragraph({ children: textRuns });
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
                                    font: { name: 'Arial' },
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
    
    const filterDataByYear = () => {
        if (selectedYears.length === 0) return state;
        return state.filter(item => {
            const start = item.changeStart || item.originalStart; // Use changeStart if available
            return selectedYears.includes(new Date(start).getFullYear());
        });
    };

    const handleYearToggle = (year) => {
        if (selectedYears.includes(year)) {
            setSelectedYears(selectedYears.filter(selectedYear => selectedYear !== year));
        } else {
            setSelectedYears([...selectedYears, year]);
        }
    };

    const uniqueYears = state.reduce((acc, item) => {
        const year = new Date(item.changeStart || item.originalStart).getFullYear(); // Use changeStart if available
        if (year && !acc.includes(year)) {
            acc.push(year);
        }
        return acc;
    }, []);
    

    return (
        <div className='row'>
            <div className="col-lg-10">
                <div className="d-flex justify-content-between pt-5 align-items-center">
                    <label className='h5 fw-semibold pt-2'>Generate Report</label>
                    <div className="d-flex align-items-center">
                        <div className='sample me-3 excelgenerateTooltip' style={{ borderRadius: '50px', padding: '7px 3px 2px 3px' }}>
                            <Tooltip anchorSelect=".excelgenerateTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                                Export to Excel
                            </Tooltip>
                            <button type="button" className="btn border-0" data-bs-toggle="tooltip" onClick={exportToExcel}>
                                <i className="fa-solid fa-file-excel fs-5"></i>
                            </button>
                        </div>
                        <div className='sample me-3 generateTooltip' style={{ borderRadius: '50px', padding: '7px 3px 2px 3px' }}>
                            <Tooltip anchorSelect=".generateTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                                Export to Word File
                            </Tooltip>
                            <button type="button" className="btn border-0" data-bs-toggle="tooltip" onClick={downloadWordFile}>
                                <i className="fa-solid fa-file-word fs-5"></i>
                            </button>
                        </div>
                    </div>
                </div>
                {selectedColumns.length > 0 && ( 
                    <>
                        <DataTable
                            columns={generateColumns()}
                            data={filterDataBySelectedColumns()}
                            pagination
                            responsive
                            highlightOnHover
                            striped
                            className='pt-5'
                            style={{ paddingLeft: sidebarExpanded ? '300px' : '150px', transition: 'padding-left 0.3s', width: '10px' }}
                        />
                        
                    </>
                )}
            </div>
            <div className='col-lg-2' style={{ minHeight: '90vh', backgroundColor: '#EEEEEE', position: 'sticky', top: 0 }}>
                <div className="py-2">
                    <h6>Filter Table By:</h6>
                    <textarea
                        className="form-control dropdown-toggle"
                        id="dropFIlter"
                        data-bs-toggle="dropdown"
                        aria-haspopup="true"
                        aria-expanded="false"
                        style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}
                        value={selectedColumns.length > 0 ? selectedColumns.map(formatColumnName).join(', ') : ''}
                        onChange={(e) => setSelectedColumns(e.target.value.split(', '))}
                        placeholder='Select Columns'
                        autoComplete='off'
                    />
                    <ul
                        className={`dropdown-menu p-2 filter-dropdown ${getColumnTitles().length > 10 ? 'scrollable-dropdown' : ''}`}
                        style={{
                            marginTop: '-20px',
                            minWidth: '280px',
                            maxWidth: 'calc(100vw - 20px)',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 1055,
                        }}
                    >
                        {getColumnTitles().map((title, index) => (
                            <div key={index} className="form-check">
                                <input 
                                    type='checkbox' 
                                    className='form-check-input' 
                                    id={`titleCheckbox-${title}`} 
                                    onChange={() => handleColumnToggle(title)}
                                    checked={selectedColumns.includes(title)}
                                />
                                <label 
                                    className="form-check-label" 
                                    htmlFor={`titleCheckbox-${title}`} 
                                    style={{ fontSize: '14px' }}
                                >
                                    {formatColumnName(title)} {/* Display the formatted column name */}
                                </label>
                            </div>
                        ))}
                    </ul>
                </div>
                <div className="py-2">
                    <div className="dropdown">
                        <div
                            className="d-flex align-items-center justify-content-between px-2 py-2 rounded border bg-white"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            style={{ cursor: 'pointer', fontSize: '14px' }}
                        >
                            <span className="d-flex align-items-center gap-2">
                                <i className="fa-solid fa-calendar"></i>
                                <span>Filter Year</span>
                            </span>
                            <i className="fa-solid fa-chevron-down"></i>
                        </div>
                        <ul className="dropdown-menu p-2 filter-dropdown" style={{ minWidth: '100%' }}>
                            {uniqueYears
                                .sort((a, b) => a - b)
                                .map((year, index) => (
                                    <li key={index}>
                                        <div className="form-check">
                                            <input
                                                type='checkbox'
                                                className='form-check-input'
                                                id={`yearCheckbox-${year}`}
                                                onChange={() => handleYearToggle(year)}
                                                checked={selectedYears.includes(year)}
                                            />
                                            <label
                                                className="form-check-label"
                                                htmlFor={`yearCheckbox-${year}`}
                                                style={{ fontSize: '14px' }}
                                            >
                                                {year}
                                            </label>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    </div>
                </div>
                <div className="py-2">
                    <div className="dropdown">
                        <div
                            className="d-flex align-items-center justify-content-between px-2 py-2 rounded border bg-white"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            style={{ cursor: 'pointer', fontSize: '14px' }}
                        >
                            <span className="d-flex align-items-center gap-2">
                                <i className="fa-solid fa-list-check"></i>
                                <span>Filter Status</span>
                            </span>
                            <i className="fa-solid fa-chevron-down"></i>
                        </div>
                        <ul className="dropdown-menu p-2 filter-dropdown" style={{ minWidth: '100%' }}>
                            {['New', 'On-going', 'Completed', 'Liquidated', 'Ongoing Liquidation', 'Unliquidated', 'Cleared', 'Interminated', 'Terminated'].map((status, index) => (
                                <li key={index}>
                                    <div className="form-check">
                                        <input
                                            type='checkbox'
                                            className='form-check-input'
                                            id={`statusCheckbox-${status}`}
                                            onChange={() => handleStatusToggle(status)}
                                            checked={selectedStatus.includes(status)}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={`statusCheckbox-${status}`}
                                            style={{ fontSize: '14px' }}
                                        >
                                            {status}
                                        </label>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="py-2">
                    <div className="dropdown">
                        <div
                            className="d-flex align-items-center justify-content-between px-2 py-2 rounded border bg-white"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            style={{ cursor: 'pointer', fontSize: '14px' }}
                        >
                            <span className="d-flex align-items-center gap-2">
                                <i className="fa-solid fa-tags"></i>
                                <span>Filter Tagging</span>
                            </span>
                            <i className="fa-solid fa-chevron-down"></i>
                        </div>
                        <ul className="dropdown-menu p-2 filter-dropdown" style={{ minWidth: '100%' }}>
                            {['Smart', 'Climate change', 'Biodive'].map((tag, index) => (
                                <li key={index}>
                                    <div className="form-check">
                                        <input
                                            type='checkbox'
                                            className='form-check-input'
                                            id={`taggingCheckbox-${tag}`}
                                            onChange={() => handleTaggingToggle(tag)}
                                            checked={selectedTagging.includes(tag)}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={`taggingCheckbox-${tag}`}
                                            style={{ fontSize: '14px' }}
                                        >
                                            {tag}
                                        </label>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="py-2">
                    <div className="dropdown">
                        <div
                            className="d-flex align-items-center justify-content-between px-2 py-2 rounded border bg-white"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            style={{ cursor: 'pointer', fontSize: '14px' }}
                        >
                            <span className="d-flex align-items-center gap-2">
                                <i className="fa-solid fa-coins"></i>
                                <span>Filter Funding</span>
                            </span>
                            <i className="fa-solid fa-chevron-down"></i>
                        </div>
                        <ul className="dropdown-menu p-2 filter-dropdown" style={{ minWidth: '100%' }}>
                            {['PCAARRD GIA', 'DOST GIA'].map((funding, index) => (
                                <li key={index}>
                                    <div className="form-check">
                                        <input
                                            type='checkbox'
                                            className='form-check-input'
                                            id={`fundingCheckbox-${funding}`}
                                            onChange={() => handleFundingToggle(funding)}
                                            checked={selectedFunding.includes(funding)}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={`fundingCheckbox-${funding}`}
                                            style={{ fontSize: '14px' }}
                                        >
                                            {funding}
                                        </label>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="py-2">
                    <div className="dropdown">
                        <div
                            className="d-flex align-items-center justify-content-between px-2 py-2 rounded border bg-white"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            style={{ cursor: 'pointer', fontSize: '14px' }}
                        >
                            <span className="d-flex align-items-center gap-2">
                                <i className="fa-solid fa-location-dot"></i>
                                <span>Filter Regions</span>
                            </span>
                            <i className="fa-solid fa-chevron-down"></i>
                        </div>
                        <ul className="dropdown-menu p-2 filter-dropdown" style={{ minWidth: '100%' }}>
                            {[
                                'Region I (Ilocos Region)',
                                'Region II (Cagayan Valley)',
                                'Region III (Central Luzon)',
                                'Region IV-A (CALABARZON)',
                                'Region IV-B (MIMAROPA)',
                                'Region V (Bicol Region)',
                                'Region VI (Western Visayas)',
                                'Region VII (Central Visayas)',
                                'Region VIII (Eastern Visayas)',
                                'Region IX (Zamboanga Peninsula)',
                                'Region X (Northern Mindanao)',
                                'Region XI (Davao Region)',
                                'Region XII (SOCCSKSARGEN)',
                                'National Capital Region (NCR)',
                                'Cordillera Administrative Region (CAR)',
                                'Autonomous Region in Muslim Mindanao (ARMM)',
                                'Region XIII (Caraga)',
                            ].map((region, index) => (
                                <li key={index}>
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id={`regionCheckbox-${index}`}
                                            onChange={() => handleRegionToggle(region)}
                                            checked={selectedRegion.includes(region)}
                                        />
                                        <label className="form-check-label" htmlFor={`regionCheckbox-${index}`} style={{ fontSize: '14px' }}>
                                            {region}
                                        </label>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
    
}
