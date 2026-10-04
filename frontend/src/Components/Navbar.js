import React, { useState, useEffect } from 'react';
import logo from './Images/logo pcaarrd.png';
import './Navbar.css'
import { Tooltip } from 'react-tooltip'
import AddProjectModal from './AddProjectModal';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { Container, Row, Col, Card, Toast } from 'react-bootstrap';
import EditUserProfile from './EditUserProfile';

const Navbar = ({ sidebarExpanded }) => {

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [first_name, setFirstName] = useState('');
  const currentDate = new Date();

  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      setCurrentTime(now);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('id');
    if (userId) {
      fetchUserProfile(userId);
    }
  }, []);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      const storedFirstName = localStorage.getItem('first_name');
      setFirstName(storedFirstName);
    }
  }, []);

  const updateFirstName = (newFirstName) => {
    setFirstName(newFirstName);
  };

  const handleLogout = async () => {
    try {
      const response = await axios.get('http://localhost:8080/Logout', { validateStatus: false });

      if (response.status === 302) {
        window.location.reload();
        navigate("/login");
      } else {
        localStorage.removeItem('isLoggedIn');
        navigate("/login");
        window.location.reload();
        console.log('Successfully logged out');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const handleEditModalOpen = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

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

  return (
    <header className='header d-flex justify-content-between align-items-center pe-5 border border-end-0'
    style={{ paddingLeft: sidebarExpanded ? '300px' : '150px', transition: 'padding-left 0.3s' }}>

      <img className="logo" src={logo} />
      <label className="title-header me-auto">
        <span>DOST - PCAARRD</span>
        <span className="separator">|</span>
        <span>IARRD</span>
      </label>
      {/* <div className='sample me-3 addTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
        <Tooltip anchorSelect=".addTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
          Add new project
        </Tooltip>
        <button type="button" className="btn border-0" onClick={() => setIsAddModalOpen(true)}>
          <i className="fa-solid fa-plus fs-5"></i>
        </button>
      </div> */}
      {first_name && (
        <div className="d-flex align-items-center me-4">
          <span className="me-2">Welcome, {first_name}</span>
          {/* Add your user icon or dropdown menu here */}
        </div>
      )}
      <EditUserProfile 
        isEditModalOpen={isEditModalOpen} 
        closeModal={() => setIsEditModalOpen(false)} 
        user={selectedUser} 
        refresh={() => fetchUserProfile(localStorage.getItem('id'))} 
      />
      <AddProjectModal />
      <div className="d-flex align-items-center">
        <div className='sample me-3 accountTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
          <Tooltip anchorSelect=".accountTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
            Account
          </Tooltip>
          <button type="button" className="btn border-0" style={{ width: '40px' }} data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside">
            <i className="fa-solid fa-user fs-5"></i>
          </button>
          <ul className="dropdown-menu border-0 p-0 m-0 h-auto shadow-lg dropdown-menu-lg-end" style={{ width: '360px' }}>
            <li className='m-0 my-2 mx-2 p-2 text-center'>
              {user && (
                <>
                  <label className='h6 fw-semibold'>{user.first_name} {user.last_name}</label><br></br>
                  <label className='' style={{ fontSize: '15px' }}>{user.email}</label>
                </>
              )}
            </li>
            <li className='m-0 notif-item my-2 mx-2' onClick={() => handleEditModalOpen(user)}>
              <div className=" p-2 d-flex align-items-center">
                <div className='p-1 px-2' style={{ marginInlineEnd: '20px' }}>
                  <i className="fa-solid fa-user-pen"></i>
                </div>
                <div className='d-flex flex-column'>
                  <div className='fw-semibold'>Manage Account</div>
                </div>
              </div>
            </li>
            <li className='m-0 notif-item my-2 mx-2' onClick={handleLogout}>
              <div className=" p-2 d-flex align-items-center">
                <div className='p-1 px-2 me-4'>
                  <i className="fa-solid fa-right-from-bracket"></i>
                </div>
                <div className='d-flex flex-column'>
                  <div className='fw-semibold'>Log Out</div>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div className='sample me-4 dateTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
          <Tooltip anchorSelect=".dateTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
            Date and Time
          </Tooltip>
          <button type="button" className="btn border-0" style={{ width: '40px' }} data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
            <i className="fa-solid fa-calendar fs-5"></i>
          </button>
          <ul className="dropdown-menu border-0 p-0 m-0 shadow-lg dropdown-menu-lg-end" style={{ width: '315px', maxHeight: '360px' }}>
            <li className='m-0'>
              <DayPicker 
                defaultMonth={currentDate} 
                modifiersStyles={{
                  today: { backgroundColor: '#000', color: '#fff', borderRadius: '5px' },
                }}
              />
            </li>
            <li className='m-2 text-center fw-semibold fs-5'>
              <i className="fa-solid fa-clock me-3"></i>
              {currentTime}
            </li>
          </ul>
        </div>
        {/* <div className='me-3 border shadow-sm pe-none' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px', width: '250px' }}>
          <button type="button" className="btn border-0 w-100">
            <i className="fa-solid fa-calendar fs-5 me-3" style={{ color: '#48C4D3' }}></i>
            <label className="date-time" style={{ color: '#48C4D3' }}>{currentDateTime.toLocaleString()}</label>
          </button>
        </div> */}
      </div>

      {/* <ul className="nav ms-auto m-0 p-0">
        <li className="nav-item">
            <form className="d-flex me-3" role="search">
                <input className="form-control me-3" type="search" placeholder="Search" aria-label="Search" />
                <button className="btn btn-outline-success" type="submit">Search</button>
            </form>
        </li>
        <li className='nav-item p-0'>
          <div style={{ paddingTop: '10px' }}>
            <i className="fa-regular fa-calendar me-3" style={{ fontSize: 28, color: '#48C4D3' }}></i>
            <label className="date-time">{currentDateTime.toLocaleString()}</label>
          </div>
        </li>
        <li className="nav-item p-0">
          <button type="button" className="btn btn-secondary border-white bg-transparent" data-bs-toggle="dropdown" aria-expanded="false" style={{ width: '60px', paddingTop: '10px' }}>
            <i className="fa-solid fa-circle-user BTN" style={{ fontSize: 30, color: '#48C4D3' }}></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-lg-end">
            <li><button className="dropdown-item" type="button">Action</button></li>
            <li><button className="dropdown-item" type="button">Another action</button></li>
            <li><button className="dropdown-item" type="button">Something else here</button></li>
          </ul>
        </li>
      </ul> */}
    </header>
  );
}

export default Navbar;
