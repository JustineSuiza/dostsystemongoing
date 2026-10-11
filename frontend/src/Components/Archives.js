import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
    deleteArchivedRow,
    listArchivedRows,
    restoreArchivedRow,
} from '../firestoreImports';

const Archives = () => {
    const [archiveData, setArchiveData] = useState([]);
    const [error, setError] = useState('');

    const fetchArchiveData = async () => {
        try {
            setError('');
            setArchiveData(await listArchivedRows());
        } catch (error) {
            console.error('Error fetching archived data:', error);
            setError(`Unable to load archived items: ${error.message}`);
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

    const handleDelete = async (item) => {
        if (!window.confirm(`Permanently delete this archived ${item.type === 'Proposals' ? 'proposal' : 'project'}?`)) {
            return false;
        }

        try {
            await deleteArchivedRow(item.archiveCollection, item.id);
            await fetchArchiveData();
            return true;
        } catch (error) {
            console.error('Error deleting archived data:', error);
            alert(`Unable to permanently delete this archived item: ${error.message}`);
            return false;
        }
    };

    const handleUnarchive = async (item) => {
        try {
            await restoreArchivedRow(item.archiveCollection, item.id);
            await fetchArchiveData();
            if (item.type === 'Projects') {
                window.dispatchEvent(new Event('projectCreated'));
            } else {
                window.dispatchEvent(new Event('proposalRestored'));
            }
            window.dispatchEvent(new Event('archiveUpdated'));
        } catch (error) {
            console.error('Error unarchiving data:', error);
            alert(`Unable to restore this archived item: ${error.message}`);
        }
    };

    const formatArchivedDate = (value) => {
        if (!value) return '-';
        const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
        return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
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
                            {error && <div className="alert alert-danger" role="alert">{error}</div>}
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th scope="col">Project Name</th>
                                        <th scope="col">Date Archived</th>
                                        <th scope="col">Type</th>
                                        {localStorage.getItem('user_lvl') === '0' && (
                                            <th scope="col" colSpan={2}>Action</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {archiveData.map((item) => (
                                        <tr key={getArchiveKey(item)}>
                                            <td className='w-50'>{item.projectTitle || item.proposalTitle || item.conceptTitle || '-'}</td>
                                            <td>{formatArchivedDate(item.archivedAt)}</td>
                                            <td>{item.type}</td> 
                                            {localStorage.getItem('user_lvl') === '0' && (
                                                <>
                                                    <td style={{ width: '10px' }}><i className="bi bi-box-arrow-up text-primary" style={{ cursor: 'pointer' }} title="Unarchive" onClick={() => handleUnarchive(item)}></i></td>
                                                    <td><i className="bi bi-trash-fill text-danger" style={{ cursor: 'pointer' }} title="Delete Permanently" onClick={() => handleDelete(item)}></i></td>
                                                </>
                                            )}
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
