import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import './Proposals.css'
import { Tooltip } from 'react-tooltip';
import AddFutureSandTDirectionModal from './AddFutureSandTDirectionModal';
import EditFutureSandTDirectionModal from './EditFutureSandTDirectionModal';
import { deleteImportedRow, listImportedRows } from '../firestoreImports';

const FutureSandTDirections = ({ sidebarExpanded }) => {
    const [originalInfo, setOriginalInfo] = useState([]);
    const [info, setInfo] = useState([]);
    const [filterValue, setFilterValue] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDirection, setSelectedDirection] = useState(null);

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

    const getInfo = async () => {
        try {
            const directions = await listImportedRows('futureDirections');
            setOriginalInfo(directions);
            setInfo(directions);
        } catch (error) {
            console.error('Error fetching Future S&T Directions:', error);
        }
    };

    const refreshData = () => {
        getInfo();
        setFilterValue('');
    };

    const filteredData = info.filter((row) =>
        Object.values(row).some(
            (value) =>
                value &&
                value.toString().toLowerCase().includes(filterValue.toLowerCase())
        )
    );

    const handleEditModalOpen = (direction) => {
        setSelectedDirection(direction);
        setIsEditModalOpen(true);
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setSelectedDirection(null);
    };

    const deleteDirection = async (id) => {
        if (window.confirm('Are you sure you want to delete this Future S&T Direction?')) {
            try {
                await deleteImportedRow('futureDirections', id);
                alert('Future S&T Direction deleted successfully!');
                getInfo();
            } catch (error) {
                console.error('Error deleting direction:', error);
                alert('Error deleting direction: ' + (error.response?.data?.messages?.error || error.message));
            }
        }
    };

    // Responsive columns based on device type
    const getResponsiveColumns = () => {
        const baseColumns = [
            { name: 'No.', selector: (row, index) => index + 1, sortable: true, width: isMobile ? '60px' : '80px' },
            { name: 'Industry Situation', selector: (row) => row.industrySituation, sortable: true, wrap: true, hide: isMobile ? 350 : null },
        ];

        const desktopColumns = [
            { name: 'Goals', selector: (row) => row.goals, sortable: true, wrap: true },
            { name: 'Banner Program', selector: (row) => row.bannerProgram, sortable: true, wrap: true },
            { name: 'Program/Project', selector: (row) => row.programProject, sortable: true, wrap: true },
            { name: 'Year', selector: (row) => row.year, sortable: true },
            { name: 'Budget', selector: (row) => row.budget, sortable: true },
            { name: 'Pillar', selector: (row) => row.pillar, sortable: true, wrap: true },
            { name: 'Strategy', selector: (row) => row.strategy, sortable: true, wrap: true },
        ];

        const tabletColumns = [
            { name: 'Goals', selector: (row) => row.goals, sortable: true, wrap: true },
            { name: 'Banner Program', selector: (row) => row.bannerProgram, sortable: true, wrap: true },
            { name: 'Program/Project', selector: (row) => row.programProject, sortable: true, wrap: true },
            { name: 'Year', selector: (row) => row.year, sortable: true },
            { name: 'Budget', selector: (row) => row.budget, sortable: true },
            { name: 'Pillar', selector: (row) => row.pillar, sortable: true, wrap: true },
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
                            <li className='m-1 notif-item' style={{ width: isMobile ? '150px' : '200px' }} onClick={() => deleteDirection(row.id)}>
                                <div className="d-flex align-items-center">
                                    <div className='p-1 px-2 pt-1 me-1'>
                                        <i className="bi bi-trash fs-5 text-danger"></i>
                                    </div>
                                    <div className='d-flex flex-column float'>
                                        <div className='fw-medium text-danger' style={{ fontSize: '13px', paddingTop: '2px' }}>Delete</div>
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

    const exportToExcel = () => {
        const fileType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const fileExtension = '.xlsx';
        const fileName = 'Future S&T Directions';

        const exportData = filteredData.map((row, index) => ({
            'No.': index + 1,
            'Industry Situation': row.industrySituation,
            'Goals': row.goals,
            'Banner Program': row.bannerProgram,
            'Program/Project': row.programProject,
            'Year': row.year,
            'Budget': row.budget,
            'Pillar': row.pillar,
            'Strategy': row.strategy,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);

        const columnWidths = [
            { wch: 5 },
            { wch: 30 },
            { wch: 30 },
            { wch: 30 },
            { wch: 25 },
            { wch: 10 },
            { wch: 15 },
            { wch: 15 },
            { wch: 30 },
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

    return (
        <article className={`pt-5 pb-5 ${isMobile ? 'ps-3 pe-3' : isTablet ? 'ps-4 pe-4' : 'pe-5'}`}>
            <div className="d-flex justify-content-between align-items-center flex-wrap">
                <label className='h5 fw-semibold pt-2'>Future S&T Directions</label>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                    <div className="me-3" style={{ minWidth: isMobile ? '180px' : '280px' }}>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className="form-control"
                                style={{ width: '100%', fontSize: isMobile ? '12px' : '14px' }}
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
                                ></button>
                            )}
                        </div>
                    </div>
                    <AddFutureSandTDirectionModal refresh={refreshData} />
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
                            Export to .xlsx
                        </Tooltip>
                        <button type="button" className="btn border-0" onClick={exportToExcel} data-bs-toggle="tooltip" data-bs-title="Export to Excel">
                            <i className="fa-solid fa-file-excel fs-5"></i>
                        </button>
                    </div>
                </div>
            </div>

            <DataTable
                columns={getResponsiveColumns()}
                data={filteredData}
                pagination
                responsive
                highlightOnHover
                striped
                paginationPerPage={isMobile ? 5 : 10}
                style={{
                    headCells: {
                        style: {
                            fontSize: isMobile ? '12px' : '14px',
                        },
                    },
                    cells: {
                        style: {
                            fontSize: isMobile ? '12px' : '14px',
                        },
                    },
                }}
            />

            {isEditModalOpen && selectedDirection && (
                <EditFutureSandTDirectionModal 
                    direction={selectedDirection} 
                    refresh={getInfo} 
                    onClose={handleEditModalClose}
                />
            )}
        </article>
    );
};

export default FutureSandTDirections;
