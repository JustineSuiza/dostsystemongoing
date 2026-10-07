import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import DataTable from 'react-data-table-component';
import axios from 'axios';
import './InvestmentPerBannerProgram.css';
import './IndirectCostSummary.css';
import { listImportedRows, saveImportedRows } from '../firestoreImports';

const API_URL = 'http://localhost:8080/IndirectCostSummary';
const VOUCHER_API_URL = 'http://localhost:8080/DisbursementVoucher';

const IndirectCostSummary = ({ sidebarExpanded }) => {
    const [rows, setRows] = useState([]);
    const [filterValue, setFilterValue] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [modalRows, setModalRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingIds, setEditingIds] = useState(new Set()); // Track which rows are from edits

    // Voucher state
    const [voucherModal, setVoucherModal] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [selectedItemName, setSelectedItemName] = useState('');
    const [vouchers, setVouchers] = useState([]);
    const [modalVouchers, setModalVouchers] = useState([]);
    const [selectedNewRowIndex, setSelectedNewRowIndex] = useState(null);
    const [vouchersMap, setVouchersMap] = useState({}); // Map of item id to vouchers
    const [pendingVouchersByNewRow, setPendingVouchersByNewRow] = useState({});

    // Load imported records from Firestore on component mount.
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await listImportedRows('indirectCostSummaries');
            setRows(data);
            
            const vMap = {};
            for (let item of data) {
                vMap[item.id] = [];
            }
            setVouchersMap(vMap);
            return data;
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error loading Indirect Cost Summary data');
        } finally {
            setLoading(false);
        }
    };

    const fetchVouchersForItem = async (itemId) => {
        if (!itemId) return [];
        try {
            const response = await axios.get(`${VOUCHER_API_URL}/byIndirectCost/${itemId}`);
            const data = Array.isArray(response.data) ? response.data : [];
            setVouchersMap(prev => ({ ...prev, [itemId]: data }));
            return data;
        } catch (error) {
            console.error('Error loading vouchers:', error);
            return [];
        }
    };

    // use empty string for numeric inputs so user typing replaces placeholder 0
    const makeEmpty = () => ({ tempKey: Date.now() + Math.random(), item: '', totalReleases: '', totalObligation: '', latestRealignment: '', runningBalance: '', forPayment: '' });

    const openAdd = () => {
        setModalRows([makeEmpty()]);
        setEditingIds(new Set());
        setIsAddOpen(true);
    };

    const modalAddRow = () => {
        setModalRows(prev => [...prev, makeEmpty()]);
    };

    const handleModalRowChange = (index, field, value) => {
        setModalRows(prev => prev.map((r, i) => {
            if (i === index) {
                const updated = { ...r, [field]: value };
                
                // Auto-calculate running balance when totalReleases or totalObligation changes
                if (field === 'totalReleases' || field === 'totalObligation') {
                    const totalReleases = field === 'totalReleases' ? Number(value || 0) : Number(r.totalReleases || 0);
                    const totalObligation = field === 'totalObligation' ? Number(value || 0) : Number(r.totalObligation || 0);
                    updated.runningBalance = totalReleases - totalObligation;

                    // When Total Releases is entered, set Latest Realignment to the same value
                    if (field === 'totalReleases') {
                        updated.latestRealignment = value;
                    }
                }

                // If forPayment changes or runningBalance changes, we could auto-calc anticipated in UI (display-only)
                
                return updated;
            }
            return r;
        }));
    };

    const removeModalRow = (index) => {
        setModalRows(prev => prev.filter((_, i) => i !== index));
    };

    const saveNewRow = async () => {
        // validate
        for (let r of modalRows) {
            if (!r.item || r.item.toString().trim() === '') {
                alert('Please fill Item name for all rows before saving');
                return;
            }
        }

        try {
            setLoading(true);
            const isNewAdd = editingIds.size === 0; // True if adding new rows, false if editing
            const firstItemName = modalRows[0]?.item || '';
            
            const prepared = modalRows.map(r => ({
                ...(r.id ? { id: r.id } : {}), // Include id only if it exists (for updates)
                item: r.item,
                totalReleases: Number(r.totalReleases || 0),
                totalObligation: Number(r.totalObligation || 0),
                latestRealignment: Number(r.latestRealignment || 0),
                runningBalance: Number(r.runningBalance || 0),
                forPayment: Number(r.forPayment || 0),
            }));

            // Save to backend
            const response = await axios.post(`${API_URL}/bulkSave`, prepared);
            const insertedIds = response.data?.inserted_ids || {};
            
            // Reload data from backend and get fresh list
            const fresh = await loadData();
            setIsAddOpen(false);

            // If there are vouchers added for a new (unsaved) row, persist them now
            if (selectedNewRowIndex !== null) {
                const newRowId = insertedIds[selectedNewRowIndex] ?? null;
                let newRow = null;
                if (newRowId) {
                    newRow = Array.isArray(fresh) ? fresh.find(r => Number(r.id) === Number(newRowId)) : null;
                }

                const preparedRow = prepared[selectedNewRowIndex];
                if (!newRow && preparedRow) {
                    newRow = Array.isArray(fresh)
                        ? fresh.find(r => r.item === preparedRow.item && Number(r.totalReleases) === Number(preparedRow.totalReleases) && Number(r.totalObligation) === Number(preparedRow.totalObligation) && Number(r.forPayment) === Number(preparedRow.forPayment))
                        : null;
                }

                const pendingVouchers = pendingVouchersByNewRow[selectedNewRowIndex] || (modalVouchers[0] || []);

                if (newRow && pendingVouchers.length > 0) {
                    const vouchersToSave = pendingVouchers.map(v => ({
                        indirect_cost_id: newRow.id,
                        dv_number: v.dv_number || '',
                        item_description: v.item_description || '',
                        amount: Number(v.amount || 0),
                    })).filter(v => v.dv_number || v.item_description);

                    if (vouchersToSave.length > 0) {
                        await axios.post(`${VOUCHER_API_URL}/bulkSave`, vouchersToSave);
                        await loadData();
                    }
                }

                setPendingVouchersByNewRow(prev => {
                    const copy = { ...prev };
                    delete copy[selectedNewRowIndex];
                    return copy;
                });
            }
            setSelectedNewRowIndex(null);
            
            setModalRows([]);
            setEditingIds(new Set());
        } catch (error) {
            console.error('Error saving rows:', error);
            alert('Error saving rows: ' + (error.response?.data?.messages?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => setFilterValue(e.target.value);

    const exportToExcel = () => {
        const exportRows = rows.map(r => ({
            Items: r.item,
            'Total Releases (1)': r.totalReleases,
            'Total Obligation/Expenses (2)': r.totalObligation,
            'Latest Realignment': r.latestRealignment || 0,
            'Running Balance (3)': r.runningBalance,
            'For Payment (4)': r.forPayment,
            'Anticipated Balance (3-4)': parseFloat((r.runningBalance - r.forPayment).toFixed(2)),
        }));

        const ws = XLSX.utils.json_to_sheet(exportRows);
        ws['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
        const wb = { Sheets: { 'Indirect Cost Summary': ws }, SheetNames: ['Indirect Cost Summary'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Indirect Cost Summary.xlsx';
        a.click();
        URL.revokeObjectURL(url);
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
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(sheet);
                    
                    // Build rows directly from file
                    const parsed = json.map(j => ({
                        item: j.Items || j.Item || j['Items'] || '',
                        totalReleases: Number(j['Total Releases (1)'] || j['Total Releases'] || j['Total'] || 0),
                        totalObligation: Number(j['Total Obligation/Expenses (2)'] || j['Total Obligation'] || 0),
                        latestRealignment: Number(j['Latest Realignment'] || j['Latest Realignment (2)'] || 0),
                        runningBalance: Number(j['Running Balance (3)'] || j['Running Balance'] || 0),
                        forPayment: Number(j['For Payment (4)'] || j['For Payment'] || 0),
                    })).filter(r => r.item && r.item.toString().trim() !== '');

                    if (parsed.length === 0) {
                        alert('No valid data found in the file');
                        return;
                    }

                    setLoading(true);
                    await saveImportedRows('indirectCostSummaries', parsed);
                    await loadData();
                    alert(`Imported ${parsed.length} rows successfully!`);
                } catch (error) {
                    console.error('Error processing import:', error);
                    alert('Error importing file: ' + error.message);
                } finally {
                    setLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            console.error('Error importing excel', err);
            alert('Error importing file: ' + err.message);
        }
        event.target.value = '';
    };

    const handleEditRow = (row) => {
        setModalRows([{
            tempKey: row.id || Date.now() + Math.random(),
            id: row.id,
            item: row.item,
            totalReleases: row.totalReleases,
            totalObligation: row.totalObligation,
            runningBalance: row.runningBalance,
            forPayment: row.forPayment
        }]);
        setEditingIds(new Set([row.id]));
        setIsAddOpen(true);
    };

    const handleDeleteRow = async (id) => {
        if (window.confirm('Are you sure you want to delete this row?')) {
            try {
                setLoading(true);
                await axios.delete(`${API_URL}/${id}`);
                await loadData();
            } catch (error) {
                console.error('Error deleting row:', error);
                alert('Error deleting row: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    // Voucher functions
    const openVoucherModal = async (row) => {
        const isSavedRow = Boolean(row.id);

        setSelectedItemId(isSavedRow ? row.id : null);
        setSelectedItemName(row.item);
        setSelectedNewRowIndex(isSavedRow ? null : row.tempKey ?? null);

        if (isSavedRow) {
            await fetchVouchersForItem(row.id);
            setModalVouchers([[]]);
            setVoucherModal(true);
            return;
        }

        setModalVouchers([pendingVouchersByNewRow[row.tempKey] ? [...pendingVouchersByNewRow[row.tempKey]] : []]);
        setVoucherModal(true);
    };

    const addVoucherRow = () => {
        setModalVouchers(prev => {
            const copy = Array.isArray(prev) ? [...prev] : [];
            const list = Array.isArray(copy[0]) ? [...copy[0]] : [];
            list.push({ dv_number: '', item_description: '', amount: '' });
            copy[0] = list;
            return copy;
        });
    };

    const handleVoucherChange = (index, field, value) => {
        setModalVouchers(prev => {
            const copy = Array.isArray(prev) ? [...prev] : [];
            const list = Array.isArray(copy[0]) ? [...copy[0]] : [];
            if (index >= 0 && index < list.length) {
                list[index] = { ...list[index], [field]: value };
            }
            copy[0] = list;
            return copy;
        });
    };

    const removeVoucherRow = (index) => {
        setModalVouchers(prev => {
            const copy = Array.isArray(prev) ? [...prev] : [];
            const list = Array.isArray(copy[0]) ? [...copy[0]] : [];
            copy[0] = list.filter((_, i) => i !== index);
            return copy;
        });
    };

    const saveVouchers = async () => {
        // Validate
        for (let v of modalVouchers[0] || []) {
            if ((!v.dv_number || v.dv_number.toString().trim() === '') && (!v.item_description || v.item_description.toString().trim() === '')) {
                alert('Please fill DV Number or Item Description for all vouchers before saving');
                return;
            }
        }

        // If this modal was opened for a new (unsaved) row, keep vouchers in state and close modal.
        if (!selectedItemId && selectedNewRowIndex !== null) {
            // Keep vouchers for this unsaved row so they are visible again if reopened
            setPendingVouchersByNewRow(prev => ({
                ...prev,
                [selectedNewRowIndex]: modalVouchers[0] || []
            }));
            setVoucherModal(false);
            return;
        }

        try {
            setLoading(true);
            const prepared = (modalVouchers[0] || []).map(v => ({
                ...(v.id ? { id: v.id } : {}),
                indirect_cost_id: selectedItemId,
                dv_number: v.dv_number || '',
                item_description: v.item_description || '',
                amount: Number(v.amount || 0),
            })).filter(v => v.dv_number || v.item_description);

            if (prepared.length > 0) {
                await axios.post(`${VOUCHER_API_URL}/bulkSave`, prepared);
            }

            await loadData();
            setVoucherModal(false);
            setModalVouchers([]);
            setSelectedItemId(null);
        } catch (error) {
            console.error('Error saving vouchers:', error);
            alert('Error saving vouchers: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteVoucher = async (voucherId) => {
        if (window.confirm('Delete this voucher?')) {
            try {
                setLoading(true);
                await axios.delete(`${VOUCHER_API_URL}/${voucherId}`);
                await loadData();
            } catch (error) {
                console.error('Error deleting voucher:', error);
                alert('Error deleting voucher: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };

    const getVoucherTotal = (itemId) => {
        return (vouchersMap[itemId] || []).reduce((sum, v) => sum + Number(v.amount || 0), 0);
    };

    const getAdjustedBalance = (row) => {
        const voucherTotal = getVoucherTotal(row.id);
        return (row.runningBalance || 0) - voucherTotal;
    };

    const filteredRows = rows.filter(r => r.item.toLowerCase().includes(filterValue.toLowerCase()));


    return (
        <article className={`pt-5 pb-5 ${sidebarExpanded ? 'ps-4 pe-4' : 'ps-3 pe-3'}`}>
            {loading && (
                <div className="d-flex justify-content-center align-items-center mb-3">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}
            <div className="d-flex justify-content-between align-items-start flex-wrap">
                <div>
                    <label className='h5 fw-semibold pt-2'>Indirect Cost Summary</label>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
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
                        </div>
                    </div>
                    <div className='me-3 d-flex align-items-center' style={{ gap: 8 }}>
                        <button className='btn' title='Filter' style={{ width: 40, height: 40, borderRadius: '50%', background: '#efefef', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className='fa-solid fa-filter' style={{ color: '#333' }}></i>
                        </button>

                        <button type='button' className='btn' onClick={openAdd} title='Add' disabled={loading} style={{ width: 40, height: 40, borderRadius: '50%', background: '#efefef', border: '1px solid #e6e6e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className='fa-solid fa-plus' style={{ fontSize: 16, color: '#333' }}></i>
                        </button>

                        <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
                            <button className='btn' title='Export to Excel' onClick={exportToExcel} disabled={loading} style={{ width: 40, height: 40, borderRadius: '50%', background: '#efefef', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className='fa-solid fa-file-excel' style={{ color: '#1b6b2a' }}></i>
                            </button>
                            <label className='btn' title='Import' style={{ width: 40, height: 40, borderRadius: '50%', background: '#efefef', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
                                <input type='file' accept='.xlsx,.xls' onChange={importFromExcel} disabled={loading} style={{ display: 'none' }} />
                                <i className='fa-solid fa-file-import' style={{ color: '#333' }}></i>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="card rounded-3">
                    <div className="card-body p-3">
                        {isAddOpen && (
                            <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex='-1'>
                                                <div className="modal-dialog modal-xl modal-dialog-centered">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Add Row</h5>
                                            <button type="button" className="btn-close" onClick={() => setIsAddOpen(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                                                            <div className='mb-2'>
                                                                                <div className='d-flex justify-content-between align-items-center'>
                                                                                    <label className='h6 mb-0'>Items to add</label>
                                                                                    <button className='btn btn-sm btn-outline' onClick={modalAddRow}>Add +</button>
                                                                                </div>
                                                                            </div>
                                                                            {modalRows.map((mr, i) => (
                                                                                <div key={mr.id || mr.tempKey} className='mb-3 p-2 border rounded'>
                                                                                    <div className='d-flex justify-content-between align-items-start'>
                                                                                        <label className='form-label'>Item {i + 1}</label>
                                                                                        {modalRows.length > 1 && (
                                                                                            <button className='btn btn-sm btn-link text-danger' onClick={() => removeModalRow(i)} style={{ textDecoration: 'none' }}>Remove</button>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className='mb-2'>
                                                                                        <input className='form-control' value={mr.item} onChange={e => handleModalRowChange(i, 'item', e.target.value)} placeholder='Item name' />
                                                                                    </div>
                                                                                    <div className='row g-2'>
                                                                                        <div className='col'>
                                                                                            <label className='form-label'>Total Releases</label>
                                                                                            <input className='form-control' type='number' value={mr.totalReleases} onChange={e => handleModalRowChange(i, 'totalReleases', e.target.value)} />
                                                                                        </div>
                                                                                        <div className='col'>
                                                                                            <label className='form-label'>Total Obligation/Expenses</label>
                                                                                            <input className='form-control' type='number' value={mr.totalObligation} onChange={e => handleModalRowChange(i, 'totalObligation', e.target.value)} />
                                                                                        </div>
                                                                                        <div className='col'>
                                                                                            <label className='form-label'>Latest Realignment</label>
                                                                                            <input className='form-control' type='number' value={mr.latestRealignment} onChange={e => handleModalRowChange(i, 'latestRealignment', e.target.value)} />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className='row g-2 mt-2'>
                                                                                        <div className='col'>
                                                                                            <label className='form-label'>Running Balance</label>
                                                                                            <div className='form-control' style={{ background: '#f8f9fa', borderColor: '#dee2e6', color: '#495057' }}>
                                                                                                {Number(mr.runningBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className='col'>
                                                                                            <label className='form-label'>For Payment</label>
                                                                                            <input className='form-control' type='number' value={mr.forPayment} onChange={e => handleModalRowChange(i, 'forPayment', e.target.value)} />
                                                                                        </div>
                                                                                        <div className='col'>
                                                                                            <label className='form-label'>Anticipated Balance</label>
                                                                                            <div className='form-control' style={{ background: '#f8f9fa', borderColor: '#dee2e6', color: '#495057' }}>
                                                                                                {Number((Number(mr.runningBalance || 0) - Number(mr.forPayment || 0)) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className='mt-2'>
                                                                                        <button type='button' className='btn btn-sm btn-outline-primary w-100' onClick={() => {
                                                                                            // Open voucher modal for an unsaved/new row (we track index)
                                                                                            setSelectedNewRowIndex(i);
                                                                                            setSelectedItemId(null);
                                                                                            setSelectedItemName(mr.item || `Item ${i + 1}`);
                                                                                            setModalVouchers([pendingVouchersByNewRow[i] ? [...pendingVouchersByNewRow[i]] : []]);
                                                                                            setVoucherModal(true);
                                                                                        }}>
                                                                                            <i className='bi bi-receipt me-1'></i>Add Vouchers
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                        </div>
                                        <div className="modal-footer">
                                            <button className='btn btn-outline' onClick={() => setIsAddOpen(false)}>Cancel</button>
                                            <button className='btn btn-dark' onClick={saveNewRow}>Save</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Voucher Modal */}
                        {voucherModal && (
                            <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }} tabIndex='-1'>
                                <div className="modal-dialog modal-lg modal-dialog-centered">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Disbursement Vouchers - {selectedItemName}</h5>
                                            <button type="button" className="btn-close" onClick={() => setVoucherModal(false)}></button>
                                        </div>
                                        <div className="modal-body">
                                            <div className='mb-3'>
                                                <div className='d-flex justify-content-between align-items-center mb-3'>
                                                    <label className='h6 mb-0'>Add Vouchers</label>
                                                    <button className='btn btn-sm btn-primary' onClick={addVoucherRow}>+ Add Voucher</button>
                                                </div>
                                                {vouchersMap[selectedItemId] && vouchersMap[selectedItemId].length > 0 && (
                                                    <div className='alert alert-info mb-3'>
                                                        <strong>Total Deductions:</strong> {Number(getVoucherTotal(selectedItemId) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Existing Vouchers */}
                                            {vouchersMap[selectedItemId] && vouchersMap[selectedItemId].length > 0 && (
                                                <div className='mb-4'>
                                                    <h6 className='border-bottom pb-2'>Existing Vouchers</h6>
                                                    <div className='table-responsive'>
                                                        <table className='table table-sm table-bordered mb-0'>
                                                            <thead className='table-light'>
                                                                <tr>
                                                                    <th>DV Number</th>
                                                                    <th>Item/Description</th>
                                                                    <th>Amount</th>
                                                                    <th style={{ width: '50px' }}>Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {vouchersMap[selectedItemId].map((v) => (
                                                                    <tr key={v.id}>
                                                                        <td>{v.dv_number || '-'}</td>
                                                                        <td>{v.item_description || '-'}</td>
                                                                        <td className='text-end'>{Number(v.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                        <td className='text-center'>
                                                                            <button className='btn btn-sm btn-danger' onClick={() => deleteVoucher(v.id)}>
                                                                                <i className='bi bi-trash'></i>
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* New Voucher Rows */}
                                            {modalVouchers[0] && modalVouchers[0].length > 0 && (
                                                <div className='mb-3'>
                                                    <h6 className='border-bottom pb-2'>New Vouchers</h6>
                                                    {modalVouchers[0].map((v, i) => (
                                                        <div key={i} className='mb-3 p-2 border rounded'>
                                                            <div className='d-flex justify-content-between align-items-start mb-2'>
                                                                <label className='form-label'>Voucher {i + 1}</label>
                                                                {modalVouchers[0].length > 1 && (
                                                                    <button className='btn btn-sm btn-link text-danger' onClick={() => removeVoucherRow(i)} style={{ textDecoration: 'none' }}>Remove</button>
                                                                )}
                                                            </div>
                                                            <div className='row g-2'>
                                                                <div className='col-md-4'>
                                                                    <label className='form-label'>DV Number</label>
                                                                    <input className='form-control' value={v.dv_number || ''} onChange={e => handleVoucherChange(i, 'dv_number', e.target.value)} placeholder='DV #' />
                                                                </div>
                                                                <div className='col-md-5'>
                                                                    <label className='form-label'>Item/Description</label>
                                                                    <input className='form-control' value={v.item_description || ''} onChange={e => handleVoucherChange(i, 'item_description', e.target.value)} placeholder='Description' />
                                                                </div>
                                                                <div className='col-md-3'>
                                                                    <label className='form-label'>Amount</label>
                                                                    <input className='form-control' type='number' value={v.amount || ''} onChange={e => handleVoucherChange(i, 'amount', e.target.value)} placeholder='0.00' />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="modal-footer">
                                            <button className='btn btn-outline' onClick={() => setVoucherModal(false)}>Close</button>
                                            <button className='btn btn-dark' onClick={saveVouchers}>Save Vouchers</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="table-responsive">
                            {/* Use DataTable for consistent Projects table design */}
                            {/* TOTAL row rendered separately below to stay pinned at bottom */}
                            <DataTable
                                columns={[
                                    { name: 'Items', selector: row => row.item || '', sortable: true, wrap: true },
                                    { name: 'Total Releases', cell: row => <div className='indirect-num'>{Number(row.totalReleases || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>, sortable: true, sortFunction: (a,b) => Number(a.totalReleases || 0) - Number(b.totalReleases || 0) },
                                    { name: 'Total Obligation/Expenses', cell: row => <div className='indirect-num'>{Number(row.totalObligation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>, sortable: true, sortFunction: (a,b) => Number(a.totalObligation || 0) - Number(b.totalObligation || 0) },
                                    { name: 'Latest Realignment', cell: row => <div className='indirect-num'>{Number(row.latestRealignment || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>, sortable: true, sortFunction: (a,b) => Number(a.latestRealignment || 0) - Number(b.latestRealignment || 0) },
                                    { name: 'Running Balance', cell: row => {
                                        const adjusted = getAdjustedBalance(row);
                                        return <div className='indirect-num'>{Number(adjusted || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>;
                                    }, sortable: true, sortFunction: (a,b) => getAdjustedBalance(a) - getAdjustedBalance(b) },
                                    { name: 'For Payment', cell: row => <div className='indirect-num'>{Number(row.forPayment || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>, sortable: true, sortFunction: (a,b) => Number(a.forPayment || 0) - Number(b.forPayment || 0) },
                                    { name: 'Anticipated Balance', cell: row => {
                                        const adjusted = getAdjustedBalance(row);
                                        const anticipated = adjusted - Number(row.forPayment || 0);
                                        return <div className={'indirect-num' + (anticipated < 0 ? ' text-danger' : '')}>{Number(anticipated || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>;
                                    }, sortable: true, sortFunction: (a,b) => (getAdjustedBalance(a) - Number(a.forPayment || 0)) - (getAdjustedBalance(b) - Number(b.forPayment || 0)) },
                                    { name: 'Actions', cell: row => (
                                        <div className="dropdown dropstart">
                                            <button className="btn btn-outline rounded-circle" style={{ paddingInline: '11px' }} type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                <i className="fa-solid fa-ellipsis"></i>
                                            </button>
                                            <ul className="dropdown-menu border-0 p-0 m-0 h-auto w-auto shadow-lg text-start">
                                                <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => openVoucherModal(row)}>
                                                    <div className="d-flex align-items-center">
                                                        <div className='p-1 px-2 pt-1 me-1'>
                                                            <i className="bi bi-receipt fs-5" style={{ color: '#0d6efd' }}></i>
                                                        </div>
                                                        <div className='d-flex flex-column'>
                                                            <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px', color: '#0d6efd' }}>Edit Voucher</div>
                                                        </div>
                                                    </div>
                                                </li>
                                                <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => handleEditRow(row)}>
                                                    <div className="d-flex align-items-center">
                                                        <div className='p-1 px-2 pt-1 me-1'>
                                                            <i className="bi bi-pencil-square fs-5"></i>
                                                        </div>
                                                        <div className='d-flex flex-column'>
                                                            <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>Edit</div>
                                                        </div>
                                                    </div>
                                                </li>
                                                <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => handleDeleteRow(row.id)}>
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
                                    ), width: '100px' },
                                ]}
                                data={filteredRows}
                                noHeader
                                responsive
                                striped
                                highlightOnHover
                                pagination
                                paginationPerPage={10}
                                paginationRowsPerPageOptions={[10,25,50]}
                                paginationComponentOptions={{
                                    rowsPerPageText: 'Rows per page:',
                                    rangeSeparatorText: 'of',
                                }}
                                className='indirect-summary-datatable'
                            />
                            
                            {/* Separate TOTAL row - always pinned at bottom */}
                            {filteredRows.length > 0 && (
                                <table className='indirect-total-table'>
                                    <tbody>
                                        <tr className='indirect-total-row'>
                                            <td className='indirect-col-item'><strong>TOTAL</strong></td>
                                            <td className='indirect-col-num'><strong>{Number(filteredRows.reduce((a,r)=>a+Number(r.totalReleases||0),0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                            <td className='indirect-col-num'><strong>{Number(filteredRows.reduce((a,r)=>a+Number(r.totalObligation||0),0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                                                <td className='indirect-col-num'><strong>{Number(filteredRows.reduce((a,r)=>a+getAdjustedBalance(r),0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                                                <td className='indirect-col-num'><strong>{Number(filteredRows.reduce((a,r)=>a+Number(r.latestRealignment||0),0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                                                <td className='indirect-col-num'><strong>{Number(filteredRows.reduce((a,r)=>a+Number(r.forPayment||0),0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                                                <td className='indirect-col-num'><strong>{Number(filteredRows.reduce((a,r)=>a+(getAdjustedBalance(r)-Number(r.forPayment||0)),0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                            <td className='indirect-col-actions'></td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default IndirectCostSummary;
