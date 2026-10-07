import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import axios from 'axios';
import * as XLSX from 'xlsx';
import AddInvestmentPerBannerProgramModal from './AddInvestmentPerBannerProgramModal';
import './InvestmentPerBannerProgram.css';
import { deleteImportedRow, listImportedRows, saveImportedRows, updateImportedRow } from '../firestoreImports';

const InvestmentPerBannerProgram = ({ sidebarExpanded }) => {
    const [data, setData] = useState([]);
    const [filterValue, setFilterValue] = useState('');
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState(null);
    const [yearDetails, setYearDetails] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        year: '',
        strategicBudget: '',
        resultsBudget: '',
        policyBudget: '',
        capacityBudget: '',
        ids: {},
    });

    const bannerPrograms = [
        'Strategic R&D',
        'R&D Results utilization',
        'Policy Research and Advocacy',
        'Capacity Building and R&D Governance',
    ];

    const years = Array.from(
        new Set(
            data
                .map((row) => parseInt(row.year, 10))
                .filter((year) => Number.isFinite(year))
        )
    ).sort((a, b) => a - b);

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
        getData();
    }, []);

    const getData = async () => {
        try {
            setData(await listImportedRows('futureDirections'));
        } catch (error) {
            console.error('Error fetching Investment per Banner Program data:', error);
        }
    };

    const handleSearchChange = (e) => {
        setFilterValue(e.target.value);
    };

    const parseBudget = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        const normalized = value.toString().replace(/,/g, '').trim();
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const formatPeso = (amount) => {
        return `₱${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const tableRows = years.map((year) => {
        const yearData = data.filter((row) => parseInt(row.year, 10) === year);
        const result = {
            year,
            total: 0,
        };

        bannerPrograms.forEach((program) => {
            result[program] = yearData
                .filter((row) => row.bannerProgram === program)
                .reduce((sum, row) => sum + parseBudget(row.budget), 0);
            result.total += result[program];
        });

        return result;
    });

    const filteredTableRows = tableRows.filter((row) => {
        if (!filterValue) return true;
        const normalizedSearch = filterValue.toString().toLowerCase();
        const matchesYear = row.year.toString().includes(normalizedSearch);
        const matchesProgram = bannerPrograms.some((program) => row[program].toString().toLowerCase().includes(normalizedSearch));
        return matchesYear || matchesProgram;
    });

    const exportToExcel = () => {
        const exportRows = filteredTableRows.map((row) => {
            const exportRow = {
                Year: row.year,
            };
            bannerPrograms.forEach((program) => {
                exportRow[program] = row[program];
            });
            exportRow.Total = row.total;
            return exportRow;
        });

        const ws = XLSX.utils.json_to_sheet(exportRows);
        ws['!cols'] = [
            { wch: 12 },
            ...bannerPrograms.map(() => ({ wch: 20 })),
            { wch: 20 },
        ];

        const wb = { Sheets: { 'Investment per Banner Program': ws }, SheetNames: ['Investment per Banner Program'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Investment per Banner Program.xlsx';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleViewDetails = (year) => {
        const details = data.filter((row) => parseInt(row.year, 10) === year);
        setSelectedYear(year);
        setYearDetails(details);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedYear(null);
        setYearDetails([]);
    };

    const handleDeleteYear = async (year) => {
        if (!window.confirm(`Delete all records for year ${year}?`)) return;
        const items = data.filter((row) => parseInt(row.year, 10) === year);
        try {
            // Attempt to delete each item by id if present
            const deletions = items.map(async (item) => {
                if (item.id) {
                    await deleteImportedRow('futureDirections', item.id);
                }
            });
            await Promise.all(deletions);
        } catch (err) {
            console.error('Error deleting year records:', err);
            alert('Error deleting records. Check console for details.');
        }
        getData();
    };

    const handleOpenEdit = (year) => {
        const items = data.filter((row) => parseInt(row.year, 10) === year);
        const ids = {};
        const values = {};
        items.forEach((it) => {
            ids[it.bannerProgram] = it.id || null;
            values[it.bannerProgram] = it.budget || '';
        });
        setEditForm({
            year,
            strategicBudget: values['Strategic R&D'] || '',
            resultsBudget: values['R&D Results utilization'] || '',
            policyBudget: values['Policy Research and Advocacy'] || '',
            capacityBudget: values['Capacity Building and R&D Governance'] || '',
            ids,
        });
        setIsEditModalOpen(true);
    };

    const handleEditInput = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        const updates = [
            { program: 'Strategic R&D', value: editForm.strategicBudget },
            { program: 'R&D Results utilization', value: editForm.resultsBudget },
            { program: 'Policy Research and Advocacy', value: editForm.policyBudget },
            { program: 'Capacity Building and R&D Governance', value: editForm.capacityBudget },
        ];

        try {
            const calls = updates.map(async (u) => {
                const payload = {
                    bannerProgram: u.program,
                    year: editForm.year,
                    budget: u.value,
                };
                const id = editForm.ids[u.program];
                if (id) {
                    // update existing
                    await updateImportedRow('futureDirections', id, payload);
                } else {
                    await saveImportedRows('futureDirections', [payload]);
                }
            });
            await Promise.all(calls);
        } catch (err) {
            console.error('Error saving edits:', err);
            alert('Error saving changes. Check console.');
        }
        setIsEditModalOpen(false);
        getData();
    };

    const columns = [
        { name: 'Year', selector: row => row.year, sortable: true, width: '100px' },
        ...bannerPrograms.map(program => ({
            name: program,
            selector: row => formatPeso(row[program]),
            sortable: true,
            right: true,
            minWidth: '200px'
        })),
        { name: 'Total', selector: row => formatPeso(row.total), sortable: true, right: true, width: '150px' },
        {
            name: 'Actions',
            cell: (row) => (
                <div className="dropdown dropstart">
                    <button className="btn btn-outline rounded-circle" style={{ paddingInline: '11px' }} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i className="fa-solid fa-ellipsis"></i>
                    </button>
                    <ul className="dropdown-menu border-0 p-0 m-0 h-auto w-auto shadow-lg text-start">
                        <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => handleViewDetails(row.year)}>
                            <div className="d-flex align-items-center">
                                <div className='p-1 px-2 pt-1 me-1'>
                                    <i className="bi bi-info-circle fs-5"></i>
                                </div>
                                <div className='d-flex flex-column'>
                                    <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>View Details</div>
                                </div>
                            </div>
                        </li>
                        <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => handleOpenEdit(row.year)}>
                            <div className="d-flex align-items-center">
                                <div className='p-1 px-2 pt-1 me-1'>
                                    <i className="bi bi-pencil-square fs-5"></i>
                                </div>
                                <div className='d-flex flex-column'>
                                    <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>Edit</div>
                                </div>
                            </div>
                        </li>
                        <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => handleDeleteYear(row.year)}>
                            <div className="d-flex align-items-center">
                                <div className='p-1 px-2 pt-1 me-1'>
                                    <i className="bi bi-trash fs-5 text-danger"></i>
                                </div>
                                <div className='d-flex flex-column'>
                                    <div className='fw-medium text-danger' style={{ fontSize: '13px', paddingTop: '2px' }}>Delete</div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            ), width: '100px'
        }
    ];

    const customStyles = {
        table: {
            style: {
                borderCollapse: 'separate',
            }
        },
        tableWrapper: {
            style: {
                borderRadius: '0',
                border: '0',
            }
        },
        headRow: {
            style: {
                borderBottomWidth: '1px',
                borderBottomColor: '#e9ecef',
            }
        },
        rows: {
            style: {
                minHeight: '72px',
                borderBottomWidth: '1px',
                borderBottomColor: '#e9ecef',
            }
        },
        cells: {
            style: {
                borderBottomWidth: '0px',
            }
        }
    };

    const sortedData = [...filteredTableRows];

    return (
        <article className={`pt-5 pb-5 ${sidebarExpanded ? 'ps-4 pe-4' : 'ps-3 pe-3'}`}>
            <div className="d-flex justify-content-between align-items-start flex-wrap">
                <div>
                    <label className='h5 fw-semibold pt-2'>Investment per Banner Program</label>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap investment-actions">
                    <div className="me-3" style={{ minWidth: '240px' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={filterValue}
                                onChange={handleSearchChange}
                                className="form-control"
                                style={{ width: '100%', fontSize: '14px' }}
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
                                />
                            )}
                        </div>
                    </div>
                    <AddInvestmentPerBannerProgramModal refresh={getData} />
                    <div className='me-3'>
                        <button type="button" className="btn investment-icon-button" onClick={getData} title="Refresh">
                            <i className="fa-solid fa-sync fs-5"></i>
                        </button>
                    </div>
                    <div className='me-3'>
                        <button type="button" className="btn investment-icon-button" onClick={exportToExcel} title="Export to Excel">
                            <i className="fa-solid fa-file-excel fs-5"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="card investment-card rounded-3">
                    <div className="card-body p-0">
                        <div className="table-responsive investment-table-wrapper">
                            <DataTable
                                className={`investment-table ${!isMobile ? 'pt-5' : ''}`}
                                columns={columns}
                                data={sortedData}
                                pagination
                                responsive
                                highlightOnHover
                                customStyles={customStyles}
                                paginationPerPage={isMobile ? 5 : 10}
                                paginationRowsPerPageOptions={isMobile ? [5,10,15] : [10,25,50]}
                                style={{ paddingLeft: !isMobile && sidebarExpanded ? (isTablet ? '250px' : '300px') : (isMobile ? '0px' : '150px'), transition: 'padding-left 0.3s', fontSize: isMobile ? '12px' : '14px' }}
                            />
                            {isViewModalOpen && (
                                <div className="major-modal-backdrop">
                                    <div className="major-modal card p-3">
                                        <h5 className="mb-3">Investment Details — {selectedYear}</h5>
                                        <div className="mb-3">
                                            <table className="table mb-3">
                                                <thead>
                                                    <tr>
                                                        <th>Banner Program</th>
                                                        <th className="text-end">Budget</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bannerPrograms.map((program) => {
                                                        const amount = yearDetails
                                                            .filter((r) => r.bannerProgram === program)
                                                            .reduce((sum, r) => sum + parseBudget(r.budget), 0);
                                                        return (
                                                            <tr key={program}>
                                                                <td>{program}</td>
                                                                <td className="text-end">{formatPeso(amount)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            <div className="d-flex justify-content-end gap-2">
                                                <button className="btn btn-secondary" onClick={handleCloseViewModal}>Close</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {isEditModalOpen && (
                                <div className="major-modal-backdrop">
                                    <div className="major-modal card p-3">
                                        <h5 className="mb-3">Edit Investment — {editForm.year}</h5>
                                        <form onSubmit={handleSubmitEdit}>
                                            <div className="row g-3">
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label">Strategic R&D</label>
                                                    <input name="strategicBudget" className="form-control" value={editForm.strategicBudget} onChange={handleEditInput} />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label">R&D Results utilization</label>
                                                    <input name="resultsBudget" className="form-control" value={editForm.resultsBudget} onChange={handleEditInput} />
                                                </div>
                                            </div>
                                            <div className="row g-3 mt-3">
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label">Policy Research and Advocacy</label>
                                                    <input name="policyBudget" className="form-control" value={editForm.policyBudget} onChange={handleEditInput} />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label">Capacity Building and R&D Governance</label>
                                                    <input name="capacityBudget" className="form-control" value={editForm.capacityBudget} onChange={handleEditInput} />
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-end gap-2 mt-4">
                                                <button type="button" className="btn btn-outline-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                                <button type="submit" className="btn btn-primary">Save Changes</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default InvestmentPerBannerProgram;
