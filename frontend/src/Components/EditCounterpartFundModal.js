import React, { useEffect, useState } from 'react';
import CurrencyInput from 'react-currency-input-field';
import { getProjectDurationYears, updateImportedCounterpartFunds } from '../firestoreImports';

const EditCounterpartFundModal = ({ isEditModalOpen, closeModal, project, refresh, showToastF }) => {

    const [counterFund, setCounterFund] = useState([]); 
    const [totalFund, setTotalFund] = useState('');
    const [remarks, setRemarks] = useState('');

	const [showToast, setShowToast] = useState(false);
	const [toastTimeout, setToastTimeout] = useState(null);
    const [saveError, setSaveError] = useState('');

    const fixedYears = Array.from({ length: 15 }, (_, i) => 2016 + i);

    useEffect(() => {
        if (project) {
            const existingYears = Object.keys(project.counterFund || {})
                .filter((year) => /^\d{4}$/.test(year));
            const durationYears = getProjectDurationYears(project);
            const years = [...new Set([
                ...durationYears,
                ...existingYears,
            ])].sort((first, second) => Number(first) - Number(second));
            const fundYears = years.length > 0 ? years : fixedYears.map(String);
            const fundArray = fundYears.map((year) => {
                const value = project.counterFund?.[year];
                const amount = value === undefined || value === null || value === ''
                    ? ''
                    : (typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value);
                return { year: Number(year), amount };
            });

            setCounterFund(fundArray);
            const calculatedTotal = fundArray.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
            setTotalFund(calculatedTotal || 0);
            setRemarks(project.remarks || '');
        } else {
            // Initialize with fixed years empty
            const emptyArray = fixedYears.map(year => ({ year, amount: '' }));
            setCounterFund(emptyArray);
            setTotalFund(0);
            setRemarks('');
        }
    }, [project]);
    

    const updateFund = async (e) => {
        e.preventDefault();

        const isFundChanged = counterFund.some(({ year, amount }) => (
            Number(amount || 0) !== Number(project?.counterFund?.[year] || 0)
        ));
        const isRemarksChanged = (remarks ?? '') !== (project?.remarks ?? '');
        const isChanged = isFundChanged || isRemarksChanged;
    
        if (!isChanged) {
            setShowToast(true);
            if (toastTimeout) {
                clearTimeout(toastTimeout);
            }
            const timeout = setTimeout(() => {
                setShowToast(false);
            }, 5000);
            setToastTimeout(timeout);
            return;
        }
    
        try {
            setSaveError('');
            await updateImportedCounterpartFunds(
                project,
                counterFund.map(({ year, amount }) => ({ year, amount })),
                remarks
            );
            closeModal();
			refresh();
            showToastF();
        } catch (error) {
            console.error('Error updating fund:', error);
            setSaveError(error.message || 'Unable to save counterpart funds. Please try again.');
        }
    };

    const handleFundChange = (index, amount) => {
        const updatedFundData = [...counterFund];
        updatedFundData[index].amount = amount;
        setCounterFund(updatedFundData);
    };
      
    useEffect(() => {
        const calculateTotalFund = () => {
            const total = counterFund.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
            setTotalFund(total);
        };
        calculateTotalFund();
    }, [counterFund]);  

    return (
        <div>
            <form onSubmit={updateFund}>
                <div className={`modal fade modal-overlay ${isEditModalOpen ? 'show' : ''}`} tabIndex="-1" style={{ display: isEditModalOpen ? 'block' : 'none' }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content p-2">
                            <div className="modal-header border-0">
                                <h1 className="modal-title fw-semibold" style={{ fontSize: '18px' }}>Edit Counterpart Fund</h1>
                                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
                                <div
									className="toast position-absolute top-10 start-50 translate-middle-x bg-danger"
									style={{ display: showToast ? 'block' : 'none' }}
									role="alert"
									aria-live="assertive"
									aria-atomic="true"
								>
									<div className="d-flex">
										<div className="toast-body text-white">
											Nothing changed
										</div>
									</div>	
								</div>
                            </div>
                            <div className="modal-body">
                                {saveError && (
                                    <div className="alert alert-danger" role="alert">
                                        {saveError}
                                    </div>
                                )}
                                <div className='container p-3 mt-2 rounded'>
                                    <h5 className='mb-3'><b>Edit Counterpart Funds</b></h5>

                                    {/* Project header fields (read-only) */}
                                    <div className="row">
                                        <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">Project Title</label>
                                            <input type="text" className="form-control form-control-sm" value={project ? project.projectTitle : ''} readOnly />
                                        </div>
                                        <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">ISP</label>
                                            <input type="text" className="form-control form-control-sm" value={project ? project.ISP : ''} readOnly />
                                        </div>
                                        <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">Implementing Agency</label>
                                            <input type="text" className="form-control form-control-sm" value={project ? project.implementingAgency : ''} readOnly />
                                        </div>
                                        <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">Program Leader</label>
                                            <input type="text" className="form-control form-control-sm" value={project ? project.programLeader : ''} readOnly />
                                        </div>
                                        <div className="col-12 col-md-6 mb-3">
                                            <label className="form-label">Duration</label>
                                            <input type="text" className="form-control form-control-sm" value={project ? ((project.changeStart || project.originalStart) && (project.changeImplementationDate || project.originalEnd) ? `${new Date(project.changeStart || project.originalStart).toLocaleDateString()} - ${new Date(project.changeImplementationDate || project.originalEnd).toLocaleDateString()}` : '') : ''} readOnly />
                                        </div>
                                    </div>

                                    {/* Top boxed area removed as requested */}

                                    {/* Year inputs as stacked single-column form groups (one per row) */}
                                    <div className="row">
                                        {counterFund.length === 0 && (
                                            <div className='col-12 text-muted mb-3'>No fund rows yet. Click "Generate Funds Fields" to create year fields.</div>
                                        )}
                                        {counterFund.map((item, index) => (
                                            <div key={index} className="col-12 col-md-3 mb-3">
                                                <label className="form-label">Year {item.year}</label>
                                                <CurrencyInput
                                                    id={`input-${index}`}
                                                    name={`input-name-${index}`}
                                                    placeholder="Enter amount"
                                                    value={item.amount !== '' && item.amount !== null ? item.amount : ''}
                                                    decimalsLimit={2}
                                                    onValueChange={(value) => handleFundChange(index, value === undefined || value === null || value === '' ? '' : parseFloat(value))}
                                                    className='form-control form-control-sm'
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Computed Total Fund (updates when year amounts change) */}
                                    <div className="row mt-2">
                                        <div className="col-12 mb-3">
                                            <label className="form-label">Total Fund</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={typeof totalFund === 'number' ? totalFund.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : (totalFund ? parseFloat(totalFund.toString().replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')}
                                                readOnly
                                            />
                                        </div>
                                    </div>

                                    {/* Remarks (compact) */}
                                    <div className="row mt-2">
                                        <div className="col-12 col-md-3 mb-3">
                                            <label className="form-label">Remarks</label>
                                            <input type="text" className="form-control form-control-sm" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-outline px-3 py-2 border text-black" onClick={closeModal} style={{ fontSize: '14px' }}>Cancel</button>
                                <button className="btn btn-dark px-3 py-2 border" style={{ fontSize: '14px' }}>Update</button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default EditCounterpartFundModal;
