import React, { useEffect, useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import './Modal.css';

const DeleteUserModal = ({ isModalOpen, closeModal, user, refresh }) => {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isModalOpen) {
            setDeleting(false);
            setError('');
        }
    }, [isModalOpen, user]);

    if (!user) return null;

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'this account';

    const handleDelete = async () => {
        setDeleting(true);
        setError('');
        try {
            await deleteDoc(doc(db, 'users', user.id));
            refresh();
            closeModal();
        } catch (deleteError) {
            console.error('Error deleting user:', deleteError);
            setError('Unable to delete the account. Please try again.');
            setDeleting(false);
        }
    };

    return (
        <div className={`modal fade modal-overlay ${isModalOpen ? 'show' : ''}`} tabIndex="-1" style={{ display: isModalOpen ? 'block' : 'none' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header border-0">
                        <div className="d-flex align-items-center">
                            <div className='me-2 d-flex align-items-center justify-content-center' style={{ backgroundColor: '#FDEAEA', borderRadius: '50%', width: '42px', height: '42px' }}>
                                <i className="bi bi-exclamation-triangle fs-5" style={{ color: '#dc3545' }}></i>
                            </div>
                            <h1 className="modal-title fw-semibold mb-0" style={{ fontSize: '18px' }}>Delete account</h1>
                        </div>
                        <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" disabled={deleting}></button>
                    </div>
                    <div className="modal-body pt-1">
                        {error && <div className="alert alert-danger" role="alert">{error}</div>}
                        <p className="mb-0" style={{ fontSize: '14px' }}>
                            Are you sure you want to delete <strong>{fullName}</strong>
                            {user.email ? <> (<span>{user.email}</span>)</> : null}?
                            This permanently removes the account record and cannot be undone.
                        </p>
                    </div>
                    <div className="modal-footer border-0">
                        <button type="button" className="btn btn-outline px-3 py-2 border text-black" onClick={closeModal} disabled={deleting} style={{ fontSize: '14px' }}>Cancel</button>
                        <button type="button" className="btn btn-danger px-3 py-2 border-0" onClick={handleDelete} disabled={deleting} style={{ fontSize: '14px' }}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteUserModal;
