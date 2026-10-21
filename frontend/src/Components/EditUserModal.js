import React, { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './Modal.css'

const EditUserProfile = ({ isEditModalOpen, closeModal, user, refresh }) => {

    const [first_name, setFirstname] = useState('');
    const [last_name, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [user_lvl, setUserlvl] = useState('');

    const [showToast, setShowToast] = useState(false);
    const [toastTimeout, setToastTimeout] = useState(null);
    const [saveError, setSaveError] = useState('');

    useEffect(() => {
        if (user) {
            setFirstname(user.first_name ?? '');
            setLastname(user.last_name ?? '');
            setEmail(user.email ?? '');
            setUserlvl(user.user_lvl ?? '');
            setSaveError('');
        }
    }, [user]);

    const updateUser = async (e) => {
        e.preventDefault();
    
        const isChanged =
        first_name !== (user.first_name ?? '') ||
        last_name !== (user.last_name ?? '') ||
        email !== (user.email ?? '') ||
        user_lvl !== (user.user_lvl ?? '');
    
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
            await updateDoc(doc(db, 'users', user.id), {
                first_name: first_name,
                last_name: last_name,
                email: email,
                user_lvl: user_lvl,
            });
            closeModal();
            refresh();
        } catch (error) {
            console.error('Error updating user:', error);
            setSaveError('Unable to save changes. Please try again.');
        }
    };

    return (
        <div>
            <form onSubmit={updateUser}>
                <div className={`modal fade modal-overlay ${isEditModalOpen ? 'show' : ''}`} tabIndex="-1" style={{ display: isEditModalOpen ? 'block' : 'none' }}>
                    <div className="modal-dialog modal-dialog-centered modal-xl">
                        <div className="modal-content p-2">
                            <div className="modal-header border-0">
                                <h1 className="modal-title fw-semibold" style={{ fontSize: '18px' }}>Edit User</h1>
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
                            {saveError && <div className="alert alert-danger" role="alert">{saveError}</div>}
                            <div className="mb-3">
                                    <label className="form-label">First Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={first_name}
                                        onChange={(e) => setFirstname(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Last Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={last_name}
                                        onChange={(e) => setLastname(e.target.value)}
                                    />
                                </div>
                                {/* <div className="mb-3">
                                    <label htmlFor="username" className="form-label">Username</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div> */}
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">User Level</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={user_lvl}
                                        onChange={(e) => setUserlvl(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer border-0">
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

export default EditUserProfile;
