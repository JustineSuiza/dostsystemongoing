import React, { useState, useEffect, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { Tooltip } from 'react-tooltip';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const Users = ({ sidebarExpanded }) => {
  const [users, setUsers] = useState([]);
  const [filterValue, setFilterValue] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState('');

  const getUsers = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map((userDocument) => ({
        ...userDocument.data(),
        id: userDocument.id,
      })));
      setError('');
    } catch (fetchError) {
      console.error('Error fetching Firebase users:', fetchError);
      setError('Unable to load accounts. Make sure you are signed in as an administrator.');
    }
  }, []);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleApproved = async (userId) => {
    setApprovingId(userId);
    setError('');
    try {
      await updateDoc(doc(db, 'users', userId), { user_lvl: '1' });
      await getUsers();
    } catch (approvalError) {
      console.error('Error approving Firebase user:', approvalError);
      setError('Unable to approve the account. Please try again.');
    } finally {
      setApprovingId(null);
    }
  };

  const formatDate = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  };

  const filteredUsers = users.filter((user) =>
    Object.values(user).some((value) =>
      value && value.toString().toLowerCase().includes(filterValue.toLowerCase())
    )
  );

  const columns = [
    { name: 'No.', selector: (row, index) => index + 1, sortable: true, width: '80px' },
    { name: 'First Name', selector: (row) => row.first_name, sortable: true, wrap: true },
    { name: 'Last Name', selector: (row) => row.last_name, sortable: true, wrap: true },
    { name: 'Email', selector: (row) => row.email, sortable: true, wrap: true },
    {
      name: 'User Level',
      selector: (row) => row.user_lvl === '0' ? 'Administrator' : row.user_lvl === '1' ? 'Approved' : 'Pending',
      sortable: true,
      wrap: true,
    },
    { name: 'Date Created', selector: (row) => formatDate(row.created_at), sortable: true, wrap: true },
    {
      name: 'Actions',
      cell: (row) => row.user_lvl === '2' && (
        <button
          type="button"
          className="btn btn-outline-success btn-sm"
          disabled={approvingId === row.id}
          onClick={() => handleApproved(row.id)}
        >
          {approvingId === row.id ? 'Approving...' : 'Approve account'}
        </button>
      ),
      width: '180px',
    },
  ];

  return (
    <article className={`pt-5 pb-5 ${isMobile ? 'ps-3 pe-3' : isTablet ? 'ps-4 pe-4' : 'pe-5'}`}>
      <div className="d-flex justify-content-between align-items-center">
        <label className="h5 fw-semibold pt-2">Accounts</label>
        <div className="d-flex align-items-center">
          <input
            type="search"
            className="form-control me-2"
            placeholder="Search accounts"
            aria-label="Search accounts"
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
          />
          <div className="sample me-3 refreshTooltip" style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
            <Tooltip anchorSelect=".refreshTooltip" style={{ borderRadius: '10px', fontSize: '12px' }}>
              Refresh
            </Tooltip>
            <button type="button" className="btn border-0" onClick={getUsers} aria-label="Refresh accounts">
              <i className="fa-solid fa-sync fs-5"></i>
            </button>
          </div>
        </div>
      </div>
      {error && <div className="alert alert-danger mt-3" role="alert">{error}</div>}
      <DataTable
        columns={columns}
        data={filteredUsers}
        pagination
        responsive
        highlightOnHover
        striped
        paginationPerPage={isMobile ? 5 : 10}
        paginationRowsPerPageOptions={isMobile ? [5, 10, 15] : [10, 25, 50]}
        className={!isMobile ? 'pt-5' : ''}
        style={{
          paddingLeft: !isMobile && sidebarExpanded ? (isTablet ? '250px' : '300px') : (isMobile ? '0px' : '150px'),
          transition: 'padding-left 0.3s',
          fontSize: isMobile ? '12px' : '14px',
        }}
      />
    </article>
  );
};

export default Users;
