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

const COLLAPSED_SIDEBAR_SLOT_WIDTH = '50px';

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
        setSidebarExpanded((prev) => !prev);
    };

    return (
        <div>
            <main style={{ display: 'flex', width: '100%' }}>  
                <header className='z-1'>
                    <Navbar sidebarExpanded={sidebarExpanded} />
                </header>
                <aside style={{ width: COLLAPSED_SIDEBAR_SLOT_WIDTH, flexShrink: 0 }}>
                    <Sidebar openSidebar={openSidebar} closeSidebar={closeSidebar} toggleSidebar={toggleSidebar} />
                </aside>
                <article
                    style={{
                        flex: '1',
                        minWidth: 0,
                    }}>
                    <Routes>
                        <Route path="" element={<Dashboard />} />
                        <Route path="Proposals" element={<Proposals />} />
                        <Route path="Proposals/Concept" element={<ConceptProposalPage />} />
                        <Route path="Proposals/Fullblown" element={<FullblownProposalPage />} />
                        <Route path="Proposals/IDD" element={<IDDProposalPage />} />
                        <Route path="Projects" element={<Projects />} />
                        <Route path="Budgets" element={<Budgets />} />
                        <Route path="Investment-Per-Banner-Program" element={<InvestmentPerBannerProgram />} />
                        <Route path="Indirect-Cost-Summary" element={<IndirectCostSummary />} />
                        <Route path="Goals" element={<Goals />} />
                        <Route path="Gaps" element={<Gaps />} />
                        <Route path="Major" element={<Major />} />
                        <Route path="Major-Accomplishment" element={<MajorAccomplishment />} />
                        <Route path="Major-Programs" element={<MajorPrograms />} />
                        <Route path="Releases" element={<Releases />} />
                        <Route path="Counterpart-Funds" element={<CounterpartFunds />} />
                        <Route path="Future-SandT-Directions" element={<FutureSandTDirections />} />
                        <Route path="Archive" element={<Archives />} />
                        <Route path="Users" element={<Users />} />
                        <Route path="UserProfile" element={<UserProfile />} />
                        <Route path="Generate-Report" element={<GenerateReport />} />
                        <Route path="FileUpload" element={<FileUpload />} />
                    </Routes>
                </article>
                <BackToTopButton />
            </main>
        </div>
    );
};

export default Main;