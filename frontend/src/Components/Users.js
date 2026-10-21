import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import DataTable from 'react-data-table-component';
import { Tooltip } from 'react-tooltip';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Switch from 'react-switch';
import './Proposals.css';
import EditUserModal from './EditUserModal';
import AutoSendScheduleModal from './AutoSendScheduleModal';
import { describeSchedule } from '../autoSendScheduler';

const UserActionsDropdown = ({ row, isApproving, isToggling, onApprove, onEdit, onToggleAutoSend, onSchedule }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    const position = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const menuWidth = 250;
      const top = rect.bottom + 4;
      const left = Math.max(8, Math.min(rect.left - menuWidth, window.innerWidth - menuWidth - 8));
      setMenuStyle({
        top: `${top}px`,
        left: `${left}px`,
        maxHeight: `calc(100vh - ${top + 8}px)`,
        overflowY: 'auto',
      });
    };

    position();
    window.addEventListener('scroll', position, true);
    window.addEventListener('resize', position);

    const handleOutsideClick = (e) => {
      const menu = menuRef.current;
      const button = buttonRef.current;
      if (menu && !menu.contains(e.target) && button && !button.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('scroll', position, true);
      window.removeEventListener('resize', position);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const canApprove = row.user_lvl === '2';

  return (
    <>
      <button
        ref={buttonRef}
        className="btn btn-outline rounded-circle"
        style={{ paddingInline: '11px' }}
        type="button"
        aria-label="Account actions"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="fa-solid fa-ellipsis"></i>
      </button>
      {isOpen &&
        createPortal(
          <ul
            ref={menuRef}
            className="dropdown-menu border-0 p-0 m-0 h-auto w-auto shadow-lg text-start show"
            style={{ position: 'fixed', zIndex: 1060, minWidth: '250px', ...menuStyle }}
          >
            {canApprove && (
              <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => { setIsOpen(false); if (!isApproving) onApprove(row.id); }}>
                <div className="d-flex align-items-center">
                  <div className='p-1 px-2 pt-1 me-1'>
                    <i className="bi bi-person-check fs-5"></i>
                  </div>
                  <div className='d-flex flex-column'>
                    <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>{isApproving ? 'Approving...' : 'Approve account'}</div>
                  </div>
                </div>
              </li>
            )}
            <li><hr className="dropdown-divider m-1" /></li>
            <li className='m-1' style={{ width: '210px' }} onClick={(e) => e.stopPropagation()}>
              <div className="d-flex align-items-center justify-content-between px-2 py-1">
                <div className='d-flex flex-column pe-2'>
                  <div className='fw-medium' style={{ fontSize: '13px' }}>Auto-send Project Excel</div>
                  <div className='text-muted text-truncate' style={{ fontSize: '11px', maxWidth: '140px' }} title={row.email}>Send to {row.email}</div>
                </div>
                <Switch
                  onChange={(checked) => onToggleAutoSend(row, checked)}
                  checked={!!row.auto_send_excel}
                  disabled={isToggling}
                  height={16}
                  width={32}
                  handleDiameter={14}
                  uncheckedIcon={false}
                  checkedIcon={false}
                  offColor="#adb5bd"
                  onColor="#0d6efd"
                  aria-label="Auto-send Project Excel"
                />
              </div>
            </li>
            <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => { setIsOpen(false); onSchedule(row); }}>
              <div className="d-flex align-items-center">
                <div className='p-1 px-2 pt-1 me-1'>
                  <i className="bi bi-calendar-event fs-5"></i>
                </div>
                <div className='d-flex flex-column'>
                  <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>Schedule Sending</div>
                  <div className='text-muted' style={{ fontSize: '11px' }}>{describeSchedule(row.auto_send_schedule)}</div>
                </div>
              </div>
            </li>
            <li className='m-1 notif-item' style={{ width: '210px' }} onClick={() => { setIsOpen(false); onEdit(row); }}>
              <div className="d-flex align-items-center">
                <div className='p-1 px-2 pt-1 me-1'>
                  <i className="bi bi-pencil-square fs-5"></i>
                </div>
                <div className='d-flex flex-column'>
                  <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>Edit</div>
                </div>
              </div>
            </li>
          </ul>,
          document.body
        )}
    </>
  );
};

const Users = ({ sidebarExpanded }) => {
  const [users, setUsers] = useState([]);
  const [filterValue, setFilterValue] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [approvingId, setApprovingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleUser, setScheduleUser] = useState(null);

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

  const handleEditOpen = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const toggleAutoSend = async (user, checked) => {
    setTogglingId(user.id);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.id), { auto_send_excel: checked });
      await getUsers();
    } catch (toggleError) {
      console.error('Error updating auto-send setting:', toggleError);
      setError('Unable to update the auto-send setting. Please try again.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleScheduleOpen = (user) => {
    setScheduleUser(user);
    setIsScheduleModalOpen(true);
  };

  const handleScheduleClose = () => {
    setIsScheduleModalOpen(false);
    setScheduleUser(null);
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
      cell: (row) => (
        <UserActionsDropdown
          row={row}
          isApproving={approvingId === row.id}
          isToggling={togglingId === row.id}
          onApprove={handleApproved}
          onEdit={handleEditOpen}
          onToggleAutoSend={toggleAutoSend}
          onSchedule={handleScheduleOpen}
        />
      ),
      width: '120px',
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
      {selectedUser && (
        <EditUserModal
          isEditModalOpen={isEditModalOpen}
          closeModal={handleEditClose}
          user={selectedUser}
          refresh={getUsers}
        />
      )}
      {scheduleUser && (
        <AutoSendScheduleModal
          isModalOpen={isScheduleModalOpen}
          closeModal={handleScheduleClose}
          user={scheduleUser}
          refresh={getUsers}
        />
      )}
    </article>
  );
};

export default Users;
