import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const EditUserProfile = ({ isEditModalOpen, closeModal, user, refresh }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setError('');
    }
  }, [user]);

  const updateUser = async (event) => {
    event.preventDefault();
    if (!user || !firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      localStorage.setItem('first_name', firstName.trim());
      await refresh();
      closeModal();
    } catch (updateError) {
      console.error('Error updating Firebase user profile:', updateError);
      setError('Unable to update your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return ReactDOM.createPortal(
    <form onSubmit={updateUser}>
      <div
        className={`modal fade modal-overlay ${isEditModalOpen ? 'show' : ''}`}
        tabIndex="-1"
        style={{ display: isEditModalOpen ? 'block' : 'none' }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content p-2">
            <div className="modal-header border-0">
              <h1 className="modal-title fw-semibold" style={{ fontSize: '18px' }}>Edit Profile</h1>
              <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="profile-first-name" className="form-label">First Name</label>
                <input
                  id="profile-first-name"
                  type="text"
                  className="form-control"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="profile-last-name" className="form-label">Last Name</label>
                <input
                  id="profile-last-name"
                  type="text"
                  className="form-control"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
              </div>
              {error && <div className="alert alert-danger" role="alert">{error}</div>}
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-outline px-3 py-2 border text-black" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-dark px-3 py-2 border" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>,
    document.body
  );
};

export default EditUserProfile;
