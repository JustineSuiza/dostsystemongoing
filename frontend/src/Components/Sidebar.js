import React, { useState } from 'react';
import './Sidebar.css';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Archives from './Archives';

const Sidebar = ({ openModal, openSidebar, closeSidebar }) => {
  const location = useLocation();
  const [expandedByToggle, setExpandedByToggle] = useState(false);
  const [expandedByHover, setExpandedByHover] = useState(false);
  const [expandedReports, setExpandedReports] = useState(false);
  const [expandedSettings, setExpandedSettings] = useState(false);
  const [sidebarTriggeredByHover, setSidebarTriggeredByHover] = useState(false);
  const [userLvl, setUserLvl] = useState(localStorage.getItem('user_lvl'));

  const handleToggleClick = () => {
    if (expandedByToggle || expandedReports || expandedSettings) {
      setExpandedByToggle(false);
      setExpandedReports(false);
      setExpandedSettings(false);
      setExpandedByHover(false);
      setSidebarTriggeredByHover(false);
      closeSidebar();
    } else {
      setExpandedByToggle(true);
      setExpandedByHover(true);
      setSidebarTriggeredByHover(false);
      openSidebar();
    }
  };

  const handleMouseEnter = () => {
    if (!expandedByToggle && !sidebarTriggeredByHover) {
      setExpandedByHover(true);
      //toggleSidebar();
    }
  };

  const handleMouseLeave = () => {
    if (!expandedReports && !expandedByToggle && !expandedSettings) {
      setExpandedByHover(false);
      setSidebarTriggeredByHover(false);
      //toggleSidebar();
    }
  };

  const handleReportClick = () => {
    setExpandedReports(!expandedReports);
    setExpandedByHover(true);
    setSidebarTriggeredByHover(true); 
    openSidebar();
  };

  const handleSettingClick = () => {
    setExpandedSettings(!expandedSettings);
    setExpandedByHover(true);
    setSidebarTriggeredByHover(true);
    openSidebar();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleDropdownClick = () => {
    const dropdownToggle = document.querySelector('.sidebar-link[data-bs-toggle="dropdown"]');
    if (dropdownToggle) {
      dropdownToggle.click();
    }
  };

  return (
    <aside
      className={`sidebar border-end ${expandedByToggle || expandedByHover ? 'showw' : null}`}
      id='sidebar'
    >
      <div className='header-toggle' onClick={handleToggleClick}>
        <i className={`fas fa-bars ${expandedByToggle || expandedByHover ? 'fa-solid fa-xmark' : null}`} style={{ color: '#313638' }}></i>
      </div>
      {/* <nav onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}> */}
      <nav>
        <ul className="sidebar-nav">
          <li className="sidebar-item">
            <Link to="/DOST/" className={`sidebar-link ${isActive('/DOST') ? 'active' : ''} ${isActive('/DOST/') ? 'active' : ''}`}>
              <i className="fa-solid fa-house"></i>
              {(expandedByToggle || expandedByHover) && <label>Dashboard</label>}
            </Link>
          </li>
          {/* <li className="sidebar-item">
              <Link to="/add-project" className={`sidebar-link ${isActive('/add-project') ? 'active' : ''}`}>
              <i className="fa-solid fa-plus fs-5"></i>
                {(expandedByToggle || expandedByHover) && <label>Add Project</label>}
              </Link>
            </li> */}
          <li className="sidebar-item">
            <a className={`sidebar-link collapsed w-auto has-dropdown ${isActive('/DOST/Proposals') ? 'active' : ''} ${isActive('/DOST/Projects') ? 'active' : ''} ${isActive('/DOST/Budgets') ? 'active' : ''} ${isActive('/DOST/Investment-Per-Banner-Program') ? 'active' : ''} ${isActive('/DOST/Releases') ? 'active' : ''} ${isActive('/DOST/Counterpart-Funds') ? 'active' : ''} ${isActive('/DOST/Future-SandT-Directions') ? 'active' : ''} ${expandedReports ? 'showw' : null}`} onClick={handleReportClick}>
              <i className="fa-solid fa-chart-bar"></i>
              {(expandedByToggle || expandedByHover) && (
                <label>
                  Reports
                  <span>
                    <i className={`fa-solid ${expandedReports ? 'fa-caret-down' : 'fa-caret-right'} ms-5`}></i>
                  </span>
                </label>
              )}
            </a>
            <ul className={`sidebar-dropdown list-unstyled collapse ${expandedReports ? 'show' : null}`}>
              <li className="sidebar-item">
                <Link to="/DOST/Projects" className={`sidebar-link`}>
                  <i className="fa-solid fa-pen" style={{ color: 'transparent' }}></i>
                  {(expandedByToggle || expandedByHover) && <label>Projects</label>}
                </Link>
              </li>
              <li className="sidebar-item dropend">
                <a type='button' className={`sidebar-link`} data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="fa-solid fa-pen" style={{ color: 'transparent' }}></i>
                  {(expandedByToggle || expandedByHover) && <label>Proposals <span><i className="fa-solid fa-caret-right ms-5"></i></span></label>}
                </a>
                <ul className="dropdown-menu border-0 p-0 m-0 mt-4 h-auto w-auto shadow-lg text-start">
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Proposals/Concept" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '220px' }}>Concept Proposal</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Proposals" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '220px' }}>Proposal Page</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Proposals/Fullblown" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '220px' }}>Fullblown Proposal</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Proposals/IDD" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '220px' }}>IDD Proposal</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </li>
              <li className="sidebar-item dropend">
                <a type='button' className={`sidebar-link`} data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="fa-solid fa-pen" style={{ color: 'transparent' }}></i>
                  {(expandedByToggle || expandedByHover) && <label>Goals <span><i className="fa-solid fa-caret-right ms-5"></i></span></label>}
                </a>
                <ul className="dropdown-menu border-0 p-0 m-0 mt-4 h-auto w-auto shadow-lg text-start">
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Goals" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '220px' }}>Goals</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Gaps" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '220px' }}>Gaps</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </li>
              <li className="sidebar-item dropend">
                <a type='button' className={`sidebar-link`} data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="fa-solid fa-pen" style={{ color: 'transparent' }}></i>
                  {(expandedByToggle || expandedByHover) && <label>Major <span><i className="fa-solid fa-caret-right ms-5"></i></span></label>}
                </a>
                <ul className="dropdown-menu border-0 p-0 m-0 mt-4 h-auto w-auto shadow-lg text-start">
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Major" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '220px' }}>Major Milestone</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Major-Accomplishment" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '220px' }}>Major Accomplishment</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Major-Programs" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '220px' }}>CY 2026-2028 Major Programs</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </li>
              <li className="sidebar-item dropend">
                <a type='button' className={`sidebar-link`} data-bs-toggle="dropdown" aria-expanded="false">
                  <i className="fa-solid fa-pen" style={{ color: 'transparent' }}></i>
                  {(expandedByToggle || expandedByHover) && <label>Budget <span><i className="fa-solid fa-caret-right ms-5"></i></span></label>}
                </a>
                <ul className="dropdown-menu border-0 p-0 m-0 mt-4 h-auto w-auto shadow-lg text-start">
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Budgets" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '200px' }}>Budget Masterlist</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Releases" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '200px' }}>GIA Releases</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Counterpart-Funds" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '200px' }}>Counterpart Funds</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                                <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Future-SandT-Directions" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '200px' }}>Future S&T Directions</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '12.5px', paddingTop: '2px' }}>
                          <Link to="/DOST/Investment-Per-Banner-Program" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '200px' }}>Investment per Banner Program</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li className='m-1 notif-item'>
                    <div className=" d-flex align-items-center">
                      <div className='d-flex flex-column float'>
                        <div className='fw-medium' style={{ fontSize: '13px', paddingTop: '2px' }}>
                          <Link to="/DOST/Indirect-Cost-Summary" className={`dropdown-item`} onClick={handleDropdownClick} style={{ width: '200px' }}>Indirect Cost Summary</Link>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
          {/* <li className="sidebar-item">
              <a href="#" className="sidebar-link">
                <i className="fa-solid fa-circle-user"></i>
                {(expandedByToggle || expandedByHover) && <label>Account</label>}
              </a>
            </li> */}
          <li className="sidebar-item">
            <a className={`sidebar-link collapsed has-dropdown ${isActive('/DOST/Archive') ? 'active' : ''} ${expandedSettings ? 'showw' : null}`} onClick={handleSettingClick}>
              <i className="fa-solid fa-gear"></i>
              {(expandedByToggle || expandedByHover) && (
                <label>
                  Settings
                  <span>
                    <i className={`fa-solid ${expandedSettings ? 'fa-caret-down' : 'fa-caret-right'} ms-5`}></i>
                  </span>
                </label>
              )}
            </a>
            <ul className={`sidebar-dropdown list-unstyled collapse ${expandedSettings ? 'show' : null}`}>
              <li className="sidebar-item">
                {(expandedByToggle || expandedByHover) && <Archives />}
              </li>
            </ul>
          </li>
          {userLvl === '0' && (
          <li className="sidebar-item">
            <Link to="/DOST/Users" className={`sidebar-link ${isActive('/DOST/Users') ? 'active' : ''}`}>
              <i className="fa-solid fa-circle-user"></i>
              {(expandedByToggle || expandedByHover) && <label>Accounts</label>}
              </Link>
          </li>
          )}
          {/* <li className="sidebar-item">
            <Link to="/DOST/UserProfile" className={`sidebar-link ${isActive('/DOST/UserProfile') ? 'active' : ''}`}>
            <i className="fa-solid fa-circle-info"></i>
              {(expandedByToggle || expandedByHover) && <label>Information</label>}
            </Link>
          </li> */}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
