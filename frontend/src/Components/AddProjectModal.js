import React, { forwardRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Modal.css';
import './AddProjectModal.css';
import ReactDOM from 'react-dom';
import { Tooltip } from 'react-tooltip';
import CurrencyInput from 'react-currency-input-field';

const remarkOptions = [
    'No Terminal Report',
    'No Financial Report',
    'No Terminal and Financial Report',
    'Executive Summary of Terminal Technical Accomplishment Report',
    'Terminal Financial Report (FR)',
    'Report of Disbursement (ROD) and Report of Checks Issued (RCI)',
    'List of Equipment Purchased (LEP)',
    'Property Acknowledgement Receipt (PAR)',
    'Journal Entry Voucher (JEV) relative to the equipment purchased',
    'List of Personnel Involved',
    'Publishable or pre-print manuscript, as may be applicable',
    'Appraisal/Assessment Report c/o the Monitoring Agency',
    'Official Receipt/Validated LDDAP-ADA/Deposit Slip for reversion of Unexpended Balance',
];

const AddProjectModal = () => {
    const [projectCode, setProjectCode] = useState('');
    const [ISP, setISP] = useState('');
    const [programCode, setProgramCode] = useState('');
    const [programTitle, setProgramTitle] = useState('');
	const [projectTitle, setProjectTitle] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [responsiblePerson, setResponsiblePerson] = useState('');
    const [funding, setFunding] = useState('');
    const [budget, setBudget] = useState([]); 
    const [budgetY1, setBudgetY1] = useState('');
    const [budgetY2, setBudgetY2] = useState('');
    const [budgetY3, setBudgetY3] = useState('');
    const [totalBudget, setTotalBudget] = useState(0);
    const [implementingAgency, setImplementingAgency] = useState('');
    const [projectLeader, setProjectLeader] = useState('');
    const [programLeader, setProgramLeader] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [postalAddress, setPostalAddress] = useState('');
    const [cooperatingAgency, setCooperatingAgency] = useState('');
    const [smallestUnit, setSmallestUnit] = useState('');
    const [address, setAddress] = useState('');
    const [region, setRegion] = useState('');
    const [originalStart, setOriginalStart] = useState('');
    const [originalEnd, setOriginalEnd] = useState('');
    const [newImplementationStart, setNewImplementationStart] = useState('');
    const [newImplementationEnd, setNewImplementationEnd] = useState('');
    const [implementationApprovalDate, setImplementationApprovalDate] = useState('');
    // const [changeStart, setChangeStart] = useState('');
    // const [changeImplementationDate, setChangeImplementationDate] = useState('');
    // const [firstExtension, setFirstExtension] = useState('');
    // const [secondExtension, setSecondExtension] = useState('');
    const [objectives, setObjectives] = useState('');
    const [deliverables, setDeliverables] = useState('');
    const [beneficiaries, setBeneficiaries] = useState('');
    // const [inceptionMeeting, setInceptionMeeting] = useState([null, null]);
    // const [mande, setMandE] = useState('');
    // const [status, setStatus] = useState('');
    // const [remarks, setRemarks] = useState('');
    // const [programReview, setProgramReview] = useState('');
    // const [terminalReview, setTerminalReview] = useState('');
    const [status, setStatus] = useState('');
    const [remarks, setRemarks] = useState('');

    const [first_name, setFirstName] = useState('');
    const [last_name, setLastName] = useState('');

    const [user, setUser] = useState(null);

    const [showToast, setShowToast] = useState(false);
	const [showToastSuccess, setShowToastSuccess] = useState(false);
	const [toastTimeout, setToastTimeout] = useState(null);

    const navigate = useNavigate();

    // const [startDate, endDate] = inceptionMeeting;

    useEffect(() => {
        const userId = localStorage.getItem('id');
        if (userId) {
          fetchUserProfile(userId);
        }
        console.log(userId)
    }, []);

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
          navigate("/login");
        } else {
          const storedFirstName = localStorage.getItem('first_name');
          const storedLastName = localStorage.getItem('last_name');
          setFirstName(storedFirstName);
          setLastName(storedLastName);
        }
    }, []);

    const fetchUserProfile = async (userId) => {
    try {
        const response = await fetch(`http://localhost:8080/Accounts/${userId}`);
        if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        } else {
        console.error('Failed to fetch user profile');
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
    };

    const saveProject = async (e) => {
        e.preventDefault();
    
        // Check if at least one field has a value
        const hasValue = Boolean(
            projectCode || ISP || programCode || programTitle || projectTitle || responsiblePerson || funding ||
            implementingAgency || projectLeader || programLeader || emailAddress ||
            contactNumber || postalAddress || cooperatingAgency || smallestUnit || address || region || originalStart ||
            originalEnd || newImplementationStart || newImplementationEnd || implementationApprovalDate || objectives || projectDescription || deliverables || beneficiaries ||
            status || remarks
        );
    
        if (!hasValue) {
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
            await axios.post('http://localhost:8080/Projects', {
                projectCode,
                ISP,
                programCode,
                programTitle,
                projectTitle,
                responsiblePerson,
                funding,
                budget: [],
                budgetY1,
                budgetY2,
                budgetY3,
                totalBudget,
                implementingAgency,
                projectLeader,
                programLeader,
                emailAddress,
                contactNumber,
                postalAddress,
                cooperatingAgency,
                smallestUnit,
                address,
                region,
                originalStart,
                originalEnd,
                newImplementationStart,
                newImplementationEnd,
                implementationApprovalDate,
                objectives,
                description: projectDescription,
                deliverables,
                beneficiaries,
                // inceptionMeeting,
                // mande,
                // programReview,
                // terminalReview,
                status,
                remarks,
                created_by: `${first_name} ${last_name}`,
            });
            console.log('Project saved successfully');
            window.dispatchEvent(new Event('projectCreated'));
            setShowToastSuccess(true);
            if (toastTimeout) {
                clearTimeout(toastTimeout);
            }
            const timeout = setTimeout(() => {
                setShowToastSuccess(false);
            }, 5000);
            clear();
        } catch (error) {
            console.error('Error saving proposal:', error);
        }
    }
    
    const clear = () => {
        setProjectCode('');
        setISP('');
        setProgramTitle('');
        setProjectTitle('');
        setResponsiblePerson('');
        setFunding('');
        setBudget([]);
        setBudget([]);
        setBudgetY1('');
        setBudgetY2('');
        setBudgetY3('');
        setTotalBudget(0);
        setImplementingAgency('');
        setProjectLeader('');
        setProgramLeader('');
        setEmailAddress('');
        setContactNumber('');
        setPostalAddress('');
        setCooperatingAgency('');
        setSmallestUnit('');
        setAddress('');
        setRegion('');
        setOriginalEnd('');
        setOriginalStart('');
        setNewImplementationStart('');
        setNewImplementationEnd('');
        setImplementationApprovalDate('');
        setObjectives('');
        setProjectDescription('');
        setBeneficiaries('');
        setDeliverables('');
        setStatus('');
        setRemarks('');
    };

    const handleISPChange = (e) => {
		const selectedValue = e.target.textContent;
		const parentMenu = e.target.closest('.dropdown-menu');
		if (parentMenu && parentMenu.classList.contains('dropdown-submenu')) {
			setISP(`Inland Biodiversity (${selectedValue})`);
		} else {
			setISP(selectedValue);
		}
	};

    const handleResPerChange = (e) => {
		setResponsiblePerson(e.target.innerText);
	};

    const handleFundingChange = (e) => {
		setFunding(e.target.innerText);
	};

    const handleStatusChange = (e) => {
        setStatus(e.target.innerText);
    };

    // const handleImplementingChange = (e) => {
    //     setImplementingAgency(e.target.innerText);
    // }

    // const handleCooperatingChange = (e) => {
    //     setCooperatingAgency(e.target.innerText);
    // }  

    const handleRemarksChange = (e) => {
        setRemarks(e.target.innerText);
    };

    const handleRemarkCheckboxChange = (remark) => {
        const selectedRemarks = remarks ? remarks.split(' | ') : [];
        const updatedRemarks = selectedRemarks.includes(remark)
            ? selectedRemarks.filter((selectedRemark) => selectedRemark !== remark)
            : [...selectedRemarks, remark];

        setRemarks(updatedRemarks.join(' | '));
    };

    const handleOriginalStartChange = (e) => {
        setOriginalStart(e.target.value);
    };

    const handleOriginalEndChange = (e) => {
        setOriginalEnd(e.target.value);
    };

    useEffect(() => {
        const total = Number(budgetY1 || 0) + Number(budgetY2 || 0) + Number(budgetY3 || 0);
        setTotalBudget(total);
    }, [budgetY1, budgetY2, budgetY3]);

    const generateBudgetFields = () => {
        const startYear = new Date(originalStart).getFullYear();
        const endYear = new Date(originalEnd).getFullYear();
        const years = endYear - startYear + 1;

        const newBudgetData = Array.from({ length: years }, (_, index) => {
            const year = startYear + index;
            return { year, amount: '' };
        });

        setBudget(newBudgetData);
    };

    useEffect(() => {
        // Check if both originalStart and originalEnd have values
        if (originalStart && originalEnd) {
            generateBudgetFields();
        }
    }, [originalStart, originalEnd]);
    

    // const handleBudgetChange = (index, amount) => {
    //     const updatedBudgetData = [...budget];
    //     updatedBudgetData[index].amount = amount;
    //     setBudget(updatedBudgetData);
    // };
      
    // useEffect(() => {
    //     const calculateTotalBudget = () => {
    //         const total = budget.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    //         setTotalBudget(total);
    //     };
    //     calculateTotalBudget();
    // }, [budget]);
    
    return (
        <div>
            <div className='sample me-3 addTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
                <Tooltip anchorSelect=".addTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                    New project
                </Tooltip>
                <button type="button" className="btn border-0" data-bs-toggle="modal" data-bs-target="#add">
                <i className="fa-solid fa-plus fs-5"></i>
                </button>
            </div>
            {ReactDOM.createPortal(
            <form onSubmit={saveProject}>
                <div className="modal fade" id="add" tabIndex="-1" aria-labelledby="exampleModalLabel" data-bs-backdrop="static" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable custom-modal-dialog" style={{ maxWidth: '80rem' }}>
                        <div className="modal-content p-2">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-semibold" style={{ fontSize: '18px' }}>Add Project</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={clear} aria-label="Close"></button>
                                <div
                                    className="toast position-absolute top-10 start-50 translate-middle-x bg-success"
                                    style={{ display: showToastSuccess ? 'block' : 'none' }}
                                    role="alert"
                                    aria-live="assertive"
                                    aria-atomic="true"
                                >
                                    <div className="d-flex">
                                        <div className="toast-body text-white">
                                            Project saved successfully.
                                        </div>
                                    </div>	
                                </div>
                            </div>
                            <div className="modal-body">
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Project Details</b></h5>
                                    <div className="row pt-3">
                                        <div className='col-md-4'>
                                            <label className="pb-2">ISP</label>
                                            <input
                                                className="form-control dropdown-toggle"
                                                type="text"
                                                id="dropISPAdd"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={ISP}
                                                onChange={(e) => setISP(e.target.value)}
                                                placeholder='Select ISP'
                                                readOnly
                                                required
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropISPAdd">
                                                <li className="dropdown-item" onClick={handleISPChange}>MilkFish</li>
                                                <li className="dropdown-item" onClick={handleISPChange}>Mangrove Crab</li>
                                                <li className="dropdown-item" onClick={handleISPChange}>Shrimp</li>
                                                <li className="dropdown-item" onClick={handleISPChange}>Tilapia</li>
                                                <li className="dropdown-item" onClick={handleISPChange}>Mussel</li>
                                                <li className="dropdown-item" onClick={handleISPChange}>Aquafeeds</li>
                                                <li className="dropdown-item">
                                                    Inland Biodiversity &raquo;
                                                    <ul className="dropdown-menu dropdown-submenu p-0" style={{ marginTop: '-20px' }}>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Lakes</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Knifefish</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Tawilis</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Ayungin</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Catfish</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Climbing Perch</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Eel</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Goby</li>
                                                        <li className="dropdown-item" onClick={handleISPChange}>Cyprinids</li>
                                                        <li className="dropdown-itemm">
                                                            <input
                                                                className='ps-2 border-0 p-2'
                                                                type="text"
                                                                placeholder="Other..."
                                                                onChange={(e) => setISP(`Inland Biodiversity (${e.target.value})`)}
                                                                style={{ borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px' }}
                                                            />
                                                        </li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className='col-md-4'>
                                            <label className="pb-2">PALIHAN Code(project)</label>
                                            <input type="number" className="form-control" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} required />
                                        </div>
                                        <div className='col-md-4'>
                                            <label className="pb-2">PALIHAN Code(program)</label>
                                            <input type="text" className="form-control" value={programCode} onChange={(e) => setProgramCode(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Program Title</label>
                                            <textarea type="text" className="form-control" value={programTitle} onChange={(e) => setProgramTitle(e.target.value)} required />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Project Title</label>
                                            <textarea type="text" className="form-control" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Responsible Person</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropResPer"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={responsiblePerson}
                                                onChange={(e) => setResponsiblePerson(e.target.value)}
                                                placeholder='Select Responsible Person'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropResPer">
                                                <li className="dropdown-item" onClick={handleResPerChange}>ATC</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>VGS</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>CVA</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>FFCM</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>KLT</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>GMDO</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>JJSV</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>GRO</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>STG</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>GES</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>AMSP</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>MAI</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>EBRD</li>
                                                <li className="dropdown-item" onClick={handleResPerChange}>RBR</li>
                                                <li className="dropdown-itemm">
                                                    <input
                                                        className='ps-2 border-0 p-2'
                                                        type="text"
                                                        placeholder="Other..."
                                                        onChange={(e) => setResponsiblePerson(e.target.value)}
                                                        style={{ borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px' }}
                                                    />
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Funding</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropFunding"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={funding}
                                                onChange={(e) => setFunding(e.target.value)}
                                                placeholder='Select Funding'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropFunding">
                                                <li className="dropdown-item" onClick={handleFundingChange}>DOST GIA</li>
                                                <li className="dropdown-item" onClick={handleFundingChange}>PCAARRD GIA</li>
                                            </ul>
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Implementing Agency</label>
                                            <input type="text" className="form-control" value={ implementingAgency } onChange={ (e) => setImplementingAgency(e.target.value) } />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Program Leader</label>
                                            <input type="text" className="form-control" value={ programLeader } onChange={ (e) => setProgramLeader(e.target.value) } />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Project Leader</label>
                                            <input type="text" className="form-control" value={ projectLeader } onChange={ (e) => setProjectLeader(e.target.value) } />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Email Address</label>
                                            <input type="email" className="form-control" value={ emailAddress } onChange={ (e) => setEmailAddress(e.target.value) } />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Contact Number</label>
                                            <input type="number" className="form-control" value={ contactNumber } onChange={ (e) => setContactNumber(e.target.value) } />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Address</label>
                                            <input type="text" className="form-control" value={ address } onChange={ (e) => setAddress(e.target.value) } />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Cooperating Agency</label>
                                            <input type="text" className="form-control" value={ cooperatingAgency } onChange={ (e) => setCooperatingAgency(e.target.value) } />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Objectives</label>
                                            <textarea className="form-control" value={ objectives } onChange={ (e) => setObjectives(e.target.value) } rows="2" />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Project Description</label>
                                            <textarea className="form-control" value={ projectDescription } onChange={ (e) => setProjectDescription(e.target.value) } rows="2" />
                                        </div>
                                        <div className="col">
                                            <label className="pb-2">Smallest Unit</label>
                                            <input type="text" className="form-control" value={ smallestUnit } onChange={ (e) => setSmallestUnit(e.target.value) } />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className="col">
                                            <label className="pb-2">Region</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropRegion"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={region}
                                                onChange={(e) => setRegion(e.target.value)}
                                                placeholder='Select Region'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropRegion">
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region I (Ilocos Region)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region II (Cagayan Valley)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region III (Central Luzon)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region IV-A (CALABARZON)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region IV-B (MIMAROPA)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region V (Bicol Region)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region VI (Western Visayas)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region VII (Central Visayas)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region VIII (Eastern Visayas)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region IX (Zamboanga Peninsula)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region X (Northern Mindanao)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region XI (Davao Region)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region XII (SOCCSKSARGEN)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>National Capital Region (NCR)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Cordillera Administrative Region (CAR)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Autonomous Region in Muslim Mindanao (ARMM)</li>
                                                <li className="dropdown-item" onClick={(e) => setRegion(e.target.innerText)}>Region XIII (Caraga)</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Project Duration</b></h5>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">Originally Approved Start Date</label>
                                            <input type="date" className="form-control" value={originalStart} onChange={handleOriginalStartChange} required/>
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">Originally Approved End Date</label>
                                            <input type="date" className="form-control" value={ originalEnd } onChange={handleOriginalEndChange} required/>
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">New Implementation Start Date</label>
                                            <input type="date" className="form-control" value={newImplementationStart} onChange={(e) => setNewImplementationStart(e.target.value)} />
                                        </div>
                                        <div className='col'>
                                            <label className="pb-2">New Implementation End Date</label>
                                            <input type="date" className="form-control" value={newImplementationEnd} onChange={(e) => setNewImplementationEnd(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">Project Implementation Approval Date</label>
                                            <input type="date" className="form-control" value={implementationApprovalDate} onChange={(e) => setImplementationApprovalDate(e.target.value)} />
                                        </div>
                                    </div>
                                    {/* <div className="row pt-3">
                                        <div className='col'>
                                            <button type="button" className="btn btn-dark px-3 py-2 border" onClick={generateBudgetFields} style={{ fontSize: '14px' }}>
                                                Generate Yearly Fields
                                            </button>
                                        </div>
                                    </div> */}
                                </div>
                                {/* <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Budget</b></h5>
                                    <div className="row pt-3">
                                        {budget.map((item, index) => (
                                            <div key={index} className="col">
                                                <label className="pb-2">Year {item.year}</label>
                                                <CurrencyInput
                                                    id={`input-${index}`}
                                                    name={`input-name-${index}`}
                                                    placeholder="Enter amount"
                                                    defaultValue={item.amount ? item.amount : ''}
                                                    decimalsLimit={2}
                                                    onValueChange={(value) => handleBudgetChange(index, parseFloat(value))}
                                                    className='form-control'
                                                />
                                            </div>
                                        ))}
                                        <div className="col">
                                            <label className="pb-2">Total Budget</label>
                                            <input type="text" className="form-control" value={ totalBudget.toLocaleString() } onChange={ (e) => setTotalBudget(e.target.value) } readOnly/>
                                        </div>
                                    </div>
                                </div> */}
                                <div className='container border p-4 mt-3 rounded'>
                                    <h5><b>Status</b></h5>
                                    <div className="row pt-3">
                                        <div className='col'>
                                            <label className="pb-2">Status</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropStatus"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                placeholder='Select Status'
                                                readOnly
                                            />
                                            <ul className="dropdown-menu p-0" aria-labelledby="dropStatus">
                                                <li className="dropdown-item" onClick={handleStatusChange}>New</li>
                                                <li className="dropdown-item" onClick={handleStatusChange}>On-going</li>
                                                <li className="dropdown-item" onClick={handleStatusChange}>Completed</li>
                                                <li className="dropdown-item" onClick={handleStatusChange}>Liquidated</li>
                                                <li className="dropdown-item" onClick={handleStatusChange}>Ongoing Liquidation</li>
                                                <li className="dropdown-item" onClick={handleStatusChange}>Unliquidated</li>
                                                <li className="dropdown-item" onClick={handleStatusChange}>Cleared</li>
                                                <li className="dropdown-item" onClick={handleStatusChange}>Interminated</li>
                                                <li className="dropdown-item" onClick={handleStatusChange}>Terminated</li>
                                            </ul>
                                        </div>
                                        <div className='col' style={{ opacity: status === 'Completed' ? 1 : 0.5 }}>
                                            <label className="pb-2">Remarks</label>
                                            <input
                                                className="form-control w-100 dropdown-toggle"
                                                id="dropRemarks"
                                                data-bs-toggle="dropdown"
                                                aria-haspopup="true"
                                                aria-expanded="false"
                                                value={remarks}
                                                onChange={(e) => setRemarks(e.target.value)}
                                                placeholder='Select Remarks'
                                                disabled={status !== 'Completed'}
                                            />
                                            <ul
                                                className="dropdown-menu p-0"
                                                aria-labelledby="dropRemarks"
                                                style={{
                                                    maxHeight: '240px',
                                                    overflowY: 'auto',
                                                    whiteSpace: 'normal',
                                                    pointerEvents: status === 'Completed' ? 'auto' : 'none',
                                                }}
                                            >
                                                <li className="dropdown-item" onClick={() => setRemarks('')}>Select Remarks</li>
                                                {remarkOptions.map((remark) => (
                                                    <li className="dropdown-item" key={remark}>
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`remark-${remark}`}
                                                                checked={remarks.split(' | ').includes(remark)}
                                                                onChange={() => handleRemarkCheckboxChange(remark)}
                                                            />
                                                            <label className="form-check-label" htmlFor={`remark-${remark}`}>
                                                                {remark}
                                                            </label>
                                                        </div>
                                                    </li>
                                                ))}
                                                <li className="dropdown-item" onClick={() => setRemarks('')}>Others</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button type="button" className="btn btn-outline px-3 py-2 border text-black" data-bs-dismiss="modal" onClick={clear} style={{ fontSize: '14px' }}>Cancel</button>
                                <button className="btn btn-dark px-3 py-2 border" style={{ fontSize: '14px' }} disabled={!(
                                    ISP || programTitle || projectTitle || responsiblePerson || funding ||
                                    implementingAgency || programLeader || emailAddress ||
                                    contactNumber || postalAddress || cooperatingAgency || originalStart ||
                                    originalEnd || objectives || projectDescription || deliverables || beneficiaries ||
                                    status || remarks
                                )}>Save Project</button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>,
                document.body
            )}
        </div>
    )
}

export default AddProjectModal