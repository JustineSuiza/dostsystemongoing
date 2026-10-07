import React, { useState, useEffect, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import * as XLSX from 'xlsx';
import './Goals.css';
import { normalizeImportedConceptProposalRows } from './conceptProposalImportUtils';
import { formatProposalDetailValue, reconcileProposalRows } from './proposalImportUtils';
import { deleteImportedRow, listImportedRows, saveImportedRows, updateImportedRow } from '../firestoreImports';

const ConceptProposalPage = ({ sidebarExpanded }) => {
  const [rows, setRows] = useState([]);
  const [filterValue, setFilterValue] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await listImportedRows('conceptProposals'));
    } catch (loadError) {
      console.error('Error loading concept proposals from Firestore:', loadError);
      setError(loadError.message || 'Unable to load concept proposals from Firebase.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filtered = rows.filter(r =>
    (r.classification || '').toLowerCase().includes(filterValue.toLowerCase()) ||
    (r.conceptTitle || '').toLowerCase().includes(filterValue.toLowerCase()) ||
    (r.projectLeader || '').toLowerCase().includes(filterValue.toLowerCase())
  );

  const handleRefresh = () => {
    loadRows();
    setFilterValue('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newRow = {
      classification: form.classification.value,
      dateReceived: form.dateReceived.value,
      dateActioned: form.dateActioned.value,
      leadTRD: form.leadTRD.value,
      conceptTitle: form.conceptTitle.value,
      projectLeader: form.projectLeader.value,
      implementingAgency: form.implementingAgency.value,
      proposedBudget: form.proposedBudget.value,
      status: form.status.value,
      files: ''
    };
    try {
      await saveImportedRows('conceptProposals', [newRow]);
      await loadRows();
      setIsAddOpen(false);
    } catch (saveError) {
      console.error('Error saving concept proposal:', saveError);
      alert('Unable to save concept proposal: ' + saveError.message);
    }
  };

  const exportToExcel = () => {
    const exportRows = filtered.map(r => ({
      Classification: r.classification,
      'Date Received': r.dateReceived,
      'Date Actioned': r.dateActioned,
      'Lead TRD': r.leadTRD,
      'Concept Proposal Title': r.conceptTitle,
      'Project Leader': r.projectLeader,
      'Implementing Agency': r.implementingAgency,
      'Proposed Budget': r.proposedBudget,
      Status: r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = { Sheets: { Data: ws }, SheetNames: ['Data'] };
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ConceptProposals.xlsx'; a.click(); URL.revokeObjectURL(url);
  };

  const importFromExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = (file.name || '').split('.').pop().toLowerCase();

    const processWorkbook = async (workbook) => {
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      const importedRows = normalizeImportedConceptProposalRows(jsonData);
      const existingRows = await listImportedRows('conceptProposals');
      const { additions, updates, skippedCount } = reconcileProposalRows(importedRows, existingRows, 'conceptTitle');
      if (additions.length === 0 && updates.length === 0) {
        const headers = Object.keys(jsonData[0] || {}).join(', ');
        alert(`No concept proposals could be imported. Found ${jsonData.length} rows, but none had a recognized concept title. Detected columns: ${headers || 'none'}.`);
        return;
      }
      if (additions.length) await saveImportedRows('conceptProposals', additions);
      await Promise.all(updates.map(([id, row]) => updateImportedRow('conceptProposals', id, row)));
      await loadRows();
      alert(`Concept proposal import complete: ${additions.length} added, ${updates.length} updated, ${skippedCount} rows skipped because they had no title.`);
    };

    try {
      if (extension === 'csv') {
        const text = await file.text();
        const workbook = XLSX.read(text, { type: 'string' });
        await processWorkbook(workbook);
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        await processWorkbook(workbook);
      }
    } catch (error) {
      console.error('Error importing concept proposals:', error);
      alert('Error importing concept proposals: ' + (error && error.message ? error.message : error));
    } finally {
      event.target.value = '';
    }
  };

  const columns = [
    { name: 'Classification', selector: row => row.classification || '-', sortable: true, minWidth: '140px', grow: 1 },
    { name: 'Date Received', selector: row => row.dateReceived || '-', sortable: true, minWidth: '120px', grow: 1 },
    { name: 'Date Actioned', selector: row => row.dateActioned || '-', sortable: true, minWidth: '120px', grow: 1 },
    { name: 'Lead TRD', selector: row => row.leadTRD || '-', sortable: true, minWidth: '120px', grow: 1 },
    { name: 'Concept Proposal Title', selector: row => row.conceptTitle || '-', sortable: true, wrap: true, minWidth: '280px', grow: 2, cell: row => <div style={{whiteSpace:'normal', wordBreak:'break-word', overflowWrap:'break-word', display:'block', width:'100%'}}>{row.conceptTitle || '-'}</div> },
    { name: 'Project Leader', selector: row => row.projectLeader || '-', sortable: true, minWidth: '150px', grow: 1 },
    { name: 'Implementing Agency', selector: row => row.implementingAgency || '-', sortable: true, minWidth: '160px', grow: 1 },
    { name: 'Proposed Budget', selector: row => row.proposedBudget || '-', sortable: true, minWidth: '130px', grow: 1 },
    { name: 'Status', selector: row => row.status || '-', sortable: true, minWidth: '120px', grow: 0 },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="dropdown dropstart">
          <button className="btn btn-outline rounded-circle" style={{ paddingInline: '11px' }} type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i className="fa-solid fa-ellipsis"></i>
          </button>
          <ul className="dropdown-menu border-0 p-0 m-0 h-auto w-auto shadow-lg text-start">
            <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => handleView(row)}>
              <div className="d-flex align-items-center">
                <div className='p-1 px-2 pt-1 me-1'>
                  <i className="bi bi-eye fs-5"></i>
                </div>
                <div className='d-flex flex-column'>
                  <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>View Details</div>
                </div>
              </div>
            </li>
            <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => handleEdit(row)}>
              <div className="d-flex align-items-center">
                <div className='p-1 px-2 pt-1 me-1'>
                  <i className="bi bi-pencil-square fs-5"></i>
                </div>
                <div className='d-flex flex-column'>
                  <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>Edit</div>
                </div>
              </div>
            </li>
            <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => handleFiles(row)}>
              <div className="d-flex align-items-center">
                <div className='p-1 px-2 pt-1 me-1'>
                  <i className="bi bi-paperclip fs-5"></i>
                </div>
                <div className='d-flex flex-column'>
                  <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>Add / Update Files</div>
                </div>
              </div>
            </li>
            <li className='m-1 notif-item text-danger' style={{ width: '210px' }} onClick={() => handleDelete(row)}>
              <div className="d-flex align-items-center">
                <div className='p-1 px-2 pt-1 me-1'>
                  <i className="bi bi-trash fs-5"></i>
                </div>
                <div className='d-flex flex-column'>
                  <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>Delete</div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      ),
      button: true,
      width: '120px',
    },
  ];

  const [editingRow, setEditingRow] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isFilesOpen, setIsFilesOpen] = useState(false);
  const [fileInput, setFileInput] = useState(null);

  const handleView = (row) => {
    setEditingRow(row);
    setIsViewOpen(true);
  };

  const handleEdit = (row) => {
    setEditingRow(row);
    setIsEditOpen(true);
  };

  const handleFiles = (row) => {
    setEditingRow(row);
    setIsFilesOpen(true);
  };

  const handleDelete = async (row) => {
    if (window.confirm(`Delete concept proposal "${row.conceptTitle || 'this proposal'}"?`)) {
      try {
        await deleteImportedRow('conceptProposals', row.id);
        await loadRows();
      } catch (error) {
        console.error('Error deleting concept proposal:', error);
        alert('Unable to archive this proposal. It was not deleted.');
      }
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const updates = Object.fromEntries(Object.entries(editingRow).filter(([key]) => !['id', '_importedBy', '_importedAt'].includes(key)));
      await updateImportedRow('conceptProposals', editingRow.id, updates);
      await loadRows();
      setIsEditOpen(false);
      setEditingRow(null);
    } catch (saveError) {
      console.error('Error updating concept proposal:', saveError);
      alert('Unable to update concept proposal: ' + saveError.message);
    }
  };

  const saveFiles = async (e) => {
    e.preventDefault();
    try {
      if (fileInput) {
        await updateImportedRow('conceptProposals', editingRow.id, { files: fileInput.name });
        await loadRows();
      }
      setFileInput(null);
      setIsFilesOpen(false);
      setEditingRow(null);
    } catch (saveError) {
      console.error('Error updating concept proposal file name:', saveError);
      alert('Unable to update proposal file: ' + saveError.message);
    }
  };

  return (
    <article className={`pt-5 pb-5 pe-5 ps-4`}> 
      <div className="d-flex justify-content-between align-items-center flex-wrap">
        <label className='h5 fw-semibold pt-2'>Concept Proposal</label>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="me-3" style={{ minWidth: '280px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search..."
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="form-control"
                style={{ width: '100%' }}
              />
              {filterValue && (
                <button className="btn btn-close" style={{ position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)', zIndex: 1 }} onClick={() => setFilterValue('')}></button>
              )}
            </div>
          </div>

          <div className='sample me-3' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
            <button type="button" className="btn border-0" onClick={() => setIsAddOpen(true)}>
              <i className="fa-solid fa-plus fs-5"></i>
            </button>
          </div>

          <div className='sample me-3' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
            <input id="importConceptProposalFile" type="file" accept=".xlsx,.xls,.csv" onChange={importFromExcel} style={{ display: 'none' }} />
            <button type="button" className="btn border-0" onClick={() => document.getElementById('importConceptProposalFile').click()}>
              <i className="fa-solid fa-file-import fs-5"></i>
            </button>
          </div>

          <div className='sample me-3' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
            <button type="button" className="btn border-0" onClick={handleRefresh}>
              <i className="fa-solid fa-sync fs-5"></i>
            </button>
          </div>

          <div className='sample me-3' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
            <button type="button" className="btn border-0" onClick={exportToExcel}>
              <i className="fa-solid fa-file-excel fs-5"></i>
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}

      <div className='table-responsive pt-4 goals-table-wrapper major-table-wrapper'>
        {loading ? (
          <div className="text-center py-4">Loading concept proposals…</div>
        ) : (
        <DataTable
          columns={columns}
          data={filtered}
          pagination
          responsive
          highlightOnHover
          striped
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10,25,50]}
          className={'pt-5 major-table'}
        />
        )}
      </div>

      {isAddOpen && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <form className="modal-content" onSubmit={handleAdd}>
              <div className="modal-header">
                <h5 className="modal-title">Add Concept Proposal</h5>
                <button type="button" className="btn-close" onClick={() => setIsAddOpen(false)}></button>
              </div>
              <div className="modal-body">
                <div className='row g-3'>
                  <div className='col-md-4'>
                    <label className='form-label'>Classification</label>
                    <select name="classification" className='form-select' defaultValue="">
                      <option value="">Select Classification</option>
                      <option value="R&D">R&D</option>
                      <option value="Non-R&D">Non-R&D</option>
                      <option value="Innovative Start-Ups">Innovative Start-Ups</option>
                    </select>
                  </div>
                  <div className='col-md-4'>
                    <label className='form-label'>Date Received</label>
                    <input name="dateReceived" type="date" className='form-control' />
                  </div>
                  <div className='col-md-4'>
                    <label className='form-label'>Date Actioned</label>
                    <input name="dateActioned" type="date" className='form-control' />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label'>Lead TRD</label>
                    <select name="leadTRD" className='form-select'>
                      <option value="">Select Lead TRD</option>
                      <option value="SERD">SERD</option>
                      <option value="IDD">IDD</option>
                      <option value="TTPD">TTPD</option>
                      <option value="FERD">FERD</option>
                      <option value="ARMRD">ARMRD</option>
                      <option value="IARRD">IARRD</option>
                      <option value="MRRD">MRRD</option>
                      <option value="CRD">CRD</option>
                      <option value="LRD">LRD</option>
                      <option value="OED-ARMSS">OED-ARMSS</option>
                      <option value="OED-RD">OED-RD</option>
                    </select>
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label'>Concept Proposal Title</label>
                    <input name="conceptTitle" className='form-control' />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label'>Project Leader</label>
                    <input name="projectLeader" className='form-control' />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label'>Implementing Agency</label>
                    <input name="implementingAgency" className='form-control' />
                  </div>
                  <div className='col-md-4'>
                    <label className='form-label'>Proposed Budget</label>
                    <input name="proposedBudget" className='form-control' />
                  </div>
                  <div className='col-md-4'>
                    <label className='form-label'>Status</label>
                    <select name="status" className='form-select'>
                      <option value="">Select</option>
                      <option value="For Submission of fullblown">For Submission of fullblown</option>
                      <option value="Disapproved">Disapproved</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewOpen && editingRow && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Concept Proposal Details</h5>
                <button type="button" className="btn-close" onClick={() => { setIsViewOpen(false); setEditingRow(null); }}></button>
              </div>
              <div className="modal-body">
                <dl className="row">
                  {Object.entries(editingRow).filter(([key]) => key !== 'id' && !key.startsWith('_')).map(([k, v]) => (
                    <React.Fragment key={k}>
                      <dt className="col-sm-4 text-capitalize">{k.replace(/([A-Z])/g, ' $1')}</dt>
                      <dd className="col-sm-8">{formatProposalDetailValue(v)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setIsViewOpen(false); setEditingRow(null); }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && editingRow && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <form className="modal-content" onSubmit={saveEdit}>
              <div className="modal-header">
                <h5 className="modal-title">Edit Concept Proposal</h5>
                <button type="button" className="btn-close" onClick={() => { setIsEditOpen(false); setEditingRow(null); }}></button>
              </div>
              <div className="modal-body">
                <div className='row g-3'>
                  <div className='col-md-4'>
                    <label className='form-label'>Classification</label>
                    <select value={editingRow.classification || ''} onChange={(e) => setEditingRow(prev => ({ ...prev, classification: e.target.value }))} className='form-select'>
                      <option value="">Select Classification</option>
                      <option value="R&D">R&D</option>
                      <option value="Non-R&D">Non-R&D</option>
                      <option value="Innovative Start-Ups">Innovative Start-Ups</option>
                    </select>
                  </div>
                  <div className='col-md-4'>
                    <label className='form-label'>Date Received</label>
                    <input value={editingRow.dateReceived || ''} onChange={(e) => setEditingRow(prev => ({ ...prev, dateReceived: e.target.value }))} type="date" className='form-control' />
                  </div>
                  <div className='col-md-4'>
                    <label className='form-label'>Date Actioned</label>
                    <input value={editingRow.dateActioned || ''} onChange={(e) => setEditingRow(prev => ({ ...prev, dateActioned: e.target.value }))} type="date" className='form-control' />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label'>Lead TRD</label>
                    <select value={editingRow.leadTRD || ''} onChange={(e) => setEditingRow(prev => ({ ...prev, leadTRD: e.target.value }))} className='form-select'>
                      <option value="">Select Lead TRD</option>
                      <option value="SERD">SERD</option>
                      <option value="IDD">IDD</option>
                      <option value="TTPD">TTPD</option>
                      <option value="FERD">FERD</option>
                      <option value="ARMRD">ARMRD</option>
                      <option value="IARRD">IARRD</option>
                      <option value="MRRD">MRRD</option>
                      <option value="CRD">CRD</option>
                      <option value="LRD">LRD</option>
                      <option value="OED-ARMSS">OED-ARMSS</option>
                      <option value="OED-RD">OED-RD</option>
                    </select>
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label'>Concept Proposal Title</label>
                    <input value={editingRow.conceptTitle || ''} onChange={(e) => setEditingRow(prev => ({ ...prev, conceptTitle: e.target.value }))} className='form-control' />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label'>Project Leader</label>
                    <input value={editingRow.projectLeader || ''} onChange={(e) => setEditingRow(prev => ({ ...prev, projectLeader: e.target.value }))} className='form-control' />
                  </div>
                  <div className='col-md-6'>
                    <label className='form-label'>Implementing Agency</label>
                    <input value={editingRow.implementingAgency || ''} onChange={(e) => setEditingRow(prev => ({ ...prev, implementingAgency: e.target.value }))} className='form-control' />
                  </div>
                  <div className='col-md-4'>
                    <label className='form-label'>Proposed Budget</label>
                    <input value={editingRow.proposedBudget || ''} onChange={(e) => setEditingRow(prev => ({ ...prev, proposedBudget: e.target.value }))} className='form-control' />
                  </div>
                  <div className='col-md-4'>
                    <label className='form-label'>Status</label>
                    <select value={editingRow.status || ''} onChange={(e) => setEditingRow(prev => ({ ...prev, status: e.target.value }))} className='form-select'>
                      <option value="">Select</option>
                      <option value="For Submission of fullblown">For Submission of fullblown</option>
                      <option value="Disapproved">Disapproved</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setIsEditOpen(false); setEditingRow(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFilesOpen && editingRow && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-dialog-centered modal-md">
            <form className="modal-content" onSubmit={saveFiles}>
              <div className="modal-header">
                <h5 className="modal-title">Add / Update Files</h5>
                <button type="button" className="btn-close" onClick={() => { setIsFilesOpen(false); setEditingRow(null); }}></button>
              </div>
              <div className="modal-body">
                <div className='mb-3'>
                  <label className='form-label'>Choose file</label>
                  <input type="file" className='form-control' onChange={(e) => setFileInput(e.target.files[0])} />
                </div>
                <div>
                  Current file: {editingRow.files || 'None'}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setIsFilesOpen(false); setEditingRow(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </article>
  );
};

export default ConceptProposalPage;
