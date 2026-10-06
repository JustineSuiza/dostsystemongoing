import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import Navbar from './Navbar';
import AddProposalModal from './AddProposalModal';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import './Sidebar.css';
import Proposals from './Proposals';
import AddProjectModal from './AddProjectModal';
import BackToTopButton from './BackToTopButton';
import Projects from './Projects';
import Budgets from './Budgets';
import InvestmentPerBannerProgram from './InvestmentPerBannerProgram';
import IndirectCostSummary from './IndirectCostSummary';
import Signup from './Signup';
import axios from 'axios';
import Releases from './Releases';
import CounterpartFunds from './CounterpartFunds';
import Archives from './Archives';
import Users from './Users'
import UserProfile from './UserProfile';
import { GenerateReport } from './GenerateReport';
import FileUpload from './FileUpload';
import FutureSandTDirections from './FutureSandTDirections';
import Goals from './Goals';
import Gaps from './Gaps';
import Major from './Major';
import MajorAccomplishment from './MajorAccomplishment';
import MajorPrograms from './MajorPrograms';
import ConceptProposalPage from './ConceptProposalPage';
import FullblownProposalPage from './FullblownProposalPage';
import IDDProposalPage from './IDDProposalPage';

const Main = () => {
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const navigate = useNavigate();

    const openAddModal = () => {
        setIsAddModalOpen(true);
    };

    const closeModal = () => {
        setIsAddModalOpen(false);
    };

    const openSidebar = () => {
        setSidebarExpanded(true); 
    };
    
    const closeSidebar = () => {
        setSidebarExpanded(false); 
    };
    

    const toggleSidebar = () => {
        setSidebarExpanded(!sidebarExpanded);
    };

    return (
        <div>
            <main style={{ display: 'flex', width: '100%' }}>  
                <header className='z-1'>
                    <Navbar sidebarExpanded={sidebarExpanded} />
                </header>
                <aside style={{ width: sidebarExpanded ? '200px' : '50px', transition: 'width 0.3s' }}>
                    <Sidebar openSidebar={openSidebar} closeSidebar={closeSidebar} toggleSidebar={toggleSidebar} sidebarExpanded={sidebarExpanded} />
                </aside>
                <article 
                    style={{ 
                        flex: '1', 
                        transition: 'margin-left 0.3s',
                        width: sidebarExpanded ? 'calc(100% - 200px)' : 'calc(100% - 50px)',
                         }}>
                    <Routes>
                        <Route path="" element={<Dashboard sidebarExpanded={sidebarExpanded} />} />
                        <Route path="Proposals" element={<Proposals />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Proposals/Concept" element={<ConceptProposalPage />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Proposals/Fullblown" element={<FullblownProposalPage />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Proposals/IDD" element={<IDDProposalPage />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Projects" element={<Projects />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Budgets" element={<Budgets />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Investment-Per-Banner-Program" element={<InvestmentPerBannerProgram />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Indirect-Cost-Summary" element={<IndirectCostSummary />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Goals" element={<Goals />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Gaps" element={<Gaps />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Major" element={<Major />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Major-Accomplishment" element={<MajorAccomplishment />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Major-Programs" element={<MajorPrograms />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Releases" element={<Releases />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Counterpart-Funds" element={<CounterpartFunds />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Future-SandT-Directions" element={<FutureSandTDirections />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Archive" element={<Archives />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Users" element={<Users />} sidebarExpanded={sidebarExpanded} />
                        <Route path="UserProfile" element={<UserProfile />} sidebarExpanded={sidebarExpanded} />
                        <Route path="Generate-Report" element={<GenerateReport />} sidebarExpanded={sidebarExpanded} />
                        <Route path="FileUpload" element={<FileUpload />} sidebarExpanded={sidebarExpanded} />
                    </Routes>
                </article>
                <BackToTopButton />
            </main>
        </div>
    );
};

export default Main;