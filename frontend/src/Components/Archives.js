import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactDOM from 'react-dom';

const Archives = () => {
    const [archiveData, setArchiveData] = useState([]);

    const fetchArchiveData = async () => {
        try {
            const [projectsResponse, proposalsResponse] = await Promise.all([
                axios.get('http://localhost:8080/ArchiveProjects'),
                axios.get('http://localhost:8080/ArchiveProposals'),
            ]);
            const modifiedData = [
                ...projectsResponse.data.map(item => ({ ...item, type: 'Projects' })),
                ...proposalsResponse.data.map(item => ({ ...item, type: 'Proposals' })),
            ];

            setArchiveData(modifiedData);
        } catch (error) {
            console.error('Error fetching archived data:', error);
        }
    };

    useEffect(() => {
        // Fetch archived data from the backend when the component mounts
        fetchArchiveData();

        const handleArchiveUpdated = () => {
            fetchArchiveData();
        };

        window.addEventListener('archiveUpdated', handleArchiveUpdated);

        const archiveModal = document.getElementById('archive');
        if (archiveModal) {
            archiveModal.addEventListener('show.bs.modal', fetchArchiveData);
        }

        return () => {
            window.removeEventListener('archiveUpdated', handleArchiveUpdated);
            if (archiveModal) {
                archiveModal.removeEventListener('show.bs.modal', fetchArchiveData);
            }
        };
    }, []);

    const getArchiveKey = (item) => `${item.type}-${item.id}`;

    const handleDelete = async (item, confirmDelete = true) => {
        if (confirmDelete && !window.confirm(`Permanently delete this archived ${item.type === 'Proposals' ? 'proposal' : 'project'}?`)) {
            return false;
        }

        try {
            const endpoint = item?.type === 'Proposals' ? 'ArchiveProposals' : 'ArchiveProjects';
            await axios.delete(`http://localhost:8080/${endpoint}/${item.id}`);
            // After successful deletion, remove the deleted item from archiveData
            setArchiveData(prevData => prevData.filter(archiveItem => getArchiveKey(archiveItem) !== getArchiveKey(item)));
            return true;
        } catch (error) {
            console.error('Error deleting archived data:', error);
            alert(`Unable to delete this archived item: ${error.response?.data?.messages?.error || error.message}`);
            return false;
        }
    };

    const handleUnarchive = async (item) => {
        try {
            if (item.type === 'Projects') {
                const budget = item.budget && !Array.isArray(item.budget)
                    ? Object.entries(item.budget).map(([year, amount]) => ({
                        year: Number(year),
                        amount: Number(String(amount ?? '').replace(/,/g, '')) || 0,
                    }))
                    : (item.budget || []).map((budgetItem) => ({
                        year: Number(budgetItem.year),
                        amount: Number(budgetItem.amount) || 0,
                    }));

                const restoreData = {
                    projectCode: item.projectCode || '',
                    programCode: item.programCode || '',
                    ISP: item.ISP || '',
                    programTitle: item.programTitle || '',
                    projectTitle: item.projectTitle || '',
                    responsiblePerson: item.responsiblePerson || '',
                    funding: item.funding || '',
                    implementingAgency: item.implementingAgency || '',
                    programLeader: item.programLeader || '',
                    projectLeader: item.projectLeader || '',
                    emailAddress: item.emailAddress || '',
                    contactNumber: item.contactNumber || '',
                    postalAddress: item.postalAddress || '',
                    cooperatingAgency: item.cooperatingAgency || '',
                    originalStart: item.originalStart || '',
                    originalEnd: item.originalEnd || '',
                    changeStart: item.changeStart || '',
                    changeImplementationDate: item.changeImplementationDate || '',
                    firstExtension: item.firstExtension || '',
                    secondExtension: item.secondExtension || '',
                    objectives: item.objectives || '',
                    description: item.description || '',
                    deliverables: item.deliverables || '',
                    beneficiaries: item.beneficiaries || '',
                    status: item.status || '',
                    remarks: item.remarks || '',
                    tagging: item.tagging || '',
                    budget,
                };

                await axios.post('http://localhost:8080/Projects', restoreData);
                if (!await handleDelete(item, false)) return;
                window.dispatchEvent(new Event('projectCreated'));
                window.dispatchEvent(new Event('archiveUpdated'));
                return;
            }

            const restoreData = {
                ISP: item.ISP,
                programTitle: item.programTitle,
                projectTitle: item.projectTitle,
                responsiblePerson: item.responsiblePerson,
                implementingAgency: item.implementingAgency,
                programLeader: item.programLeader || '',
                leadTRD: item.leadTRD,
                funding: item.funding,
                quarter: item.quarter,
                date: item.date,
                remarks: item.remarks,
            };

            await axios.post('http://localhost:8080/Proposals', restoreData);
            // After successful unarchiving, delete the item from the archive
            if (!await handleDelete(item, false)) return;
            window.dispatchEvent(new Event('proposalRestored'));
            window.dispatchEvent(new Event('archiveUpdated'));
        } catch (error) {
            console.error('Error unarchiving data:', error);
            alert(`Unable to restore this archived item: ${error.response?.data?.messages?.error || error.message}`);
        }
    };

    return (
        <div>
            {/* <div className='samplee mx-3' style={{ borderRadius: '10px', padding: '7px 2px 2px 2px' }}>
                <button type="button" className="btn border-0 w-100" data-bs-toggle="modal" data-bs-target="#archive">
                    <i className="fa-solid fa-box-archive fs-5"></i>
                </button>

            </div> */}
            <li className="sidebar-item">
                <a type='button' className={`sidebar-link`} data-bs-toggle="modal" aria-expanded="false" data-bs-target="#archive">
                  <i className="fa-solid fa-box-archive fs-5" style={{ color: 'transparent' }}></i>
                  <label>Archive</label>
                </a>
            </li>
            {ReactDOM.createPortal(
            <div className="modal fade" id="archive" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl">
                    <div className="modal-content p-2">
                        <div className="modal-header border-0">
                            <h5 className="modal-title fw-semibold" style={{ fontSize: '18px' }}>Archived Projects</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th scope="col">Project Name</th>
                                        <th scope="col">Date Archived</th>
                                        <th scope="col">Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {archiveData.map((item) => (
                                        <tr key={getArchiveKey(item)}>
                                            <td className='w-50'>{item.projectTitle}</td>
                                            <td>{item.created_at}</td> 
                                            <td>{item.type}</td> 
                                            <td style={{ width: '10px' }}><i className="bi bi-box-arrow-up text-primary" style={{ cursor: 'pointer' }} onClick={() => handleUnarchive(item)}></i></td>
                                            <td><i className="bi bi-trash-fill text-danger" style={{ cursor: 'pointer' }} onClick={() => handleDelete(item)}></i></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="modal-footer border-0">
                            <button type="button" className="btn btn-outline px-3 py-2 border text-black" data-bs-dismiss="modal" style={{ fontSize: '14px' }}>Cancel</button>
                            <button className="btn btn-dark px-3 py-2 border" style={{ fontSize: '14px' }} data-bs-dismiss="modal">Done</button>
                        </div>
                    </div>
                </div>
            </div>,
                document.body
            )}
        </div>
    );
};

export default Archives;
