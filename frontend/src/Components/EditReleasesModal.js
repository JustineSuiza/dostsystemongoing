import React, { useEffect, useState } from 'react';
import {regions, provinces, cities, barangays} from 'select-philippines-address';
import CurrencyInput from 'react-currency-input-field';
import { updateImportedProject, updateImportedRelease } from '../firestoreImports';

const EditReleasesModal = ({ isEditModalOpen, closeModal, project, refresh, showToastF }) => {

    const [programmedAmount, setProgrammedAmount] = useState('');
    const [regionIA, setRegionIA] = useState('');
    const [particulars, setParticulars] = useState('');
    const [dvNo, setDVNo] = useState('');
    const [dateOfRelease, setDateOfRelease] = useState('');
    const [month, setMonth] = useState('');
    const [actualRelease, setActualRelease] = useState('');
    const [remarksReleases, setRemarksReleases] = useState('');
    const [statusReleases, setStatusReleases] = useState('');
	const [showToast, setShowToast] = useState(false);
	const [showToastSuccess, setShowToastSuccess] = useState(false);
	const [toastTimeout, setToastTimeout] = useState(null);
    const [saveError, setSaveError] = useState('');

    const [regionData, setRegion] = useState([]);
    const [provinceData, setProvince] = useState([]);
    const [cityData, setCity] = useState([]);
    const [barangayData, setBarangay] = useState([]);

    const [regionAddr, setRegionAddr] = useState("");
    const [provinceAddr, setProvinceAddr] = useState("");
    const [cityAddr, setCityAddr] = useState("");
    const [barangayAddr, setBarangayAddr] = useState("");

    useEffect(() => {
        if (project && project.releaseData) {
            setProgrammedAmount(project.releaseData.programmedAmount || '');
            setRegionIA(project.releaseData.regionIA || '');
            setParticulars(project.releaseData.particulars || '');
            setDVNo(project.releaseData.dvNo || '');
            setDateOfRelease(project.releaseData.dateOfRelease || '');
            setMonth(project.releaseData.month || '');
            setActualRelease(project.releaseData.actualRelease || '');
            setRemarksReleases(project.releaseData.remarksReleases || '');
            setStatusReleases(project.releaseData.statusReleases || '');
        } else {
            // Handle the case when project or project.releaseData is null or undefined
        }
    }, [project]);
    

    const updateProposal = async (e) => {
        e.preventDefault();

        const releaseData = project?.releaseData || {};
        const updates = {
            programmedAmount,
            regionIA,
            particulars,
            dvNo,
            dateOfRelease,
            month,
            actualRelease,
            remarksReleases,
            statusReleases,
        };
        const isChanged = Object.entries(updates).some(
            ([field, value]) => String(value ?? '') !== String(releaseData[field] ?? '')
        );
    
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
            if (releaseData.id) {
                await updateImportedRelease(releaseData.id, updates);
            } else {
                await updateImportedProject(project.id, {
                    releaseData: { ...releaseData, ...updates },
                });
            }
            closeModal();
			refresh();
            showToastF();
            clear();
        } catch (error) {
            console.error('Error updating releases:', error);
            setSaveError(error.message || 'Unable to save the release. Please try again.');
        }
    };

    const clear = () => {
        setProgrammedAmount('');
        setRegionIA('');
        setParticulars('');
        setDVNo('');
        setDateOfRelease('');
        setMonth('');
        setActualRelease('');
        setRemarksReleases('');
        setStatusReleases('');
    };

    const handleRemarksReleasesChange = (e) => {
		const selectedValue = e.target.textContent;
		const parentMenu = e.target.closest('.dropdown-menu');
		if (parentMenu && parentMenu.classList.contains('dropdown-submenu')) {
			setRemarksReleases(`Released (${selectedValue})`);
		} else {
			setRemarksReleases(selectedValue);
		}
	};

    const handleRegionChange = (e) => {
        setRegionIA(e.target.innerText);
    }  

    const region = () => {
        regions().then(response => {
            setRegion(response);
        });
    }

    const province = (e) => {
        setRegionAddr(e.target.selectedOptions[0].text);
        provinces(e.target.value).then(response => {
            setProvince(response);
            setCity([]);
            setBarangay([]);
        });
    }

    const city = (e) => {
        setProvinceAddr(e.target.selectedOptions[0].text);
        cities(e.target.value).then(response => {
            setCity(response);
        });
    }

    const barangay = (e) => {
        setCityAddr(e.target.selectedOptions[0].text);
        barangays(e.target.value).then(response => {
            setBarangay(response);
        });
    }

    const brgy = (e) => {
        setBarangayAddr(e.target.selectedOptions[0].text);
    }

    useEffect(() => {
        region()
    }, [])
    

    return (
        <div>
            <form onSubmit={updateProposal}>
                <div className={`modal fade modal-overlay ${isEditModalOpen ? 'show' : ''}`} tabIndex="-1" style={{ display: isEditModalOpen ? 'block' : 'none' }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content p-2">
                            <div className="modal-header border-0">
                                <h1 className="modal-title fw-semibold" style={{ fontSize: '18px' }}>Edit Releases</h1>
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
								<div className="row pt-3">
                                    <div className="col">
                                        <label className="pb-2">Programmed Amount</label>
                                        <CurrencyInput
                                            name="input-name"
                                            placeholder="Please enter a number"
                                            value={programmedAmount ? programmedAmount : ''}
                                            decimalsLimit={2}
                                            onValueChange={(value) => setProgrammedAmount(value)}
                                            className="form-control"
                                        />
                                    </div>
								</div>
                                <div className="row pt-3">
                                    <div className="col">
                                        <label className="pb-2">Region of IA</label>
                                        <input
                                            className="form-control w-100 dropdown-toggle"
                                            id="dropRegionReleases"
                                            data-bs-toggle="dropdown"
                                            aria-haspopup="true"
                                            aria-expanded="false"
                                            value={regionIA}
                                            onChange={(e) => setRegionIA(e.target.value)}
                                            onSelect={region}
                                            placeholder='Select Region'
                                            
                                        />
                                        <ul className="dropdown-menu p-0" aria-labelledby="dropRegionReleases">
                                            {
                                                regionData && regionData.length > 0 && regionData.map((item) => <li className="dropdown-item" key={item.region_code} value={item.region_code} onClick={handleRegionChange}>{item.region_name}</li>)
                                            }
                                        </ul>
									</div>
                                </div>
                                <div className="row pt-3">
                                    <div className="col">
										<label className="pb-2">Particulars/Schedule</label>
										<input type="text" className="form-control" value={particulars} onChange={(e) => setParticulars(e.target.value)} />
									</div>
                                    <div className="col">
										<label className="pb-2">DV No.</label>
										<input type="text" className="form-control" value={dvNo} onChange={(e) => setDVNo(e.target.value)} />
									</div>
                                </div>
                                <div className="row pt-3">
                                    <div className="col">
										<label className="pb-2">Date of Release/Transferred (FAIS)</label>
										<input
                                            type="date"
                                            className="form-control"
                                            value={dateOfRelease}
                                            onChange={(e) => {
                                                const selectedDate = new Date(e.target.value);
                                                const monthName = selectedDate.toLocaleString('default', { month: 'long' });
                                                const year = selectedDate.getFullYear();
                                                
                                                // Set the Date of Release
                                                setDateOfRelease(e.target.value);
                                                
                                                // Update the month input field with the formatted value (e.g., "September 2024")
                                                setMonth(`${monthName} ${year}`);
                                            }}
                                        />
									</div>
                                    <div className="col">
										<label className="pb-2">Month</label>
										<input type="text" className="form-control" value={month} onChange={(e) => setMonth(e.target.value)} />
									</div>
                                    <div className="col">
										<label className="pb-2">Actual Release per FAIS/DV/ADA</label>
										<CurrencyInput
                                            name="input-name"
                                            placeholder="Please enter a number"
                                            value={actualRelease ? actualRelease : ''}
                                            decimalsLimit={2}
                                            onValueChange={(value) => setActualRelease(value)}
                                            className="form-control"
                                        />
									</div>
                                </div>
								<div className="row pt-3">
                                    <div className='col'>
                                        <label className="pb-2">Remarks</label>
                                        <input
                                            className="form-control w-100 dropdown-toggle"
                                            id="dropRemarksReleasesEdit"
                                            data-bs-toggle="dropdown"
                                            aria-haspopup="true"
                                            aria-expanded="false"
                                            value={remarksReleases}
                                            onChange={(e) => setRemarksReleases(e.target.value)}
                                            placeholder='Select Remarks'
                                            
                                        />
                                        <ul className="dropdown-menu p-0" aria-labelledby="dropRemarksReleasesEdit">
                                            <li className="dropdown-item" onClick={handleRemarksReleasesChange}>Budget Section for Budget Obligation</li>
                                            <li className="dropdown-item" onClick={handleRemarksReleasesChange}>Accounting Section for Review</li>
                                            <li className="dropdown-item" onClick={handleRemarksReleasesChange}>With ADA</li>
                                            <li className="dropdown-item" style={{ paddingInlineStart: '11px', paddingBottom: '0', paddingInlineEnd: '11px' }}>
                                                Released
                                                <input
                                                    className='border-0 p-1'
                                                    type="date"
                                                    onChange={(e) => setRemarksReleases(`Released (${e.target.value})`)}
                                                    style={{ borderRadius: '5px', marginInlineStart: '80px' }}
                                                />
                                            </li>
                                            <li className="dropdown-item" style={{ paddingInlineStart: '0', paddingBottom: '0', paddingInlineEnd: '0' }}>
                                                <input
                                                    className='border-0 p-1 ps-3 w-100'
                                                    type="text"
                                                    placeholder="Other..."
                                                    onChange={(e) => setRemarksReleases(`${e.target.value}`)}
                                                    style={{ borderRadius: '5px' }}
                                                />
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="col">
										<label className="pb-2">Status</label>
										<input type="text" className="form-control" value={statusReleases} onChange={(e) => setStatusReleases(e.target.value)} />
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

export default EditReleasesModal;
