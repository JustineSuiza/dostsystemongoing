import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import './Dashboard.css';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from "chart.js";
import { Tooltip as ReactTooltip, Tooltip } from 'react-tooltip';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from 'react-router-dom';

const regionCoordinates = {
  "Region I (Ilocos Region)": [120.6200, 16.0832],
  "Region II (Cagayan Valley)": [121.8107, 16.9754],
  "Region III (Central Luzon)": [120.7120, 15.4828],
  "Region IV-A (CALABARZON)": [121.0794, 14.1008],
  "Region IV-B (MIMAROPA)": [118.7365, 9.8432],
  "Region V (Bicol Region)": [123.4137, 13.4210],
  "Region VI (Western Visayas)": [122.5373, 11.0050],
  "Region VII (Central Visayas)": [124.0641, 9.8169],
  "Region VIII (Eastern Visayas)": [125.0388, 12.2446],
  "Region IX (Zamboanga Peninsula)": [123.2588, 8.1541],
  "Region X (Northern Mindanao)": [124.6857, 8.0202],
  "Region XI (Davao Region)": [126.0893, 7.3042],
  "Region XII (SOCCSKSARGEN)": [124.6857, 6.2707],
  "National Capital Region (NCR)": [121.0223, 14.6091],
  "Cordillera Administrative Region (CAR)": [121.1719, 17.3513],
  "Autonomous Region in Muslim Mindanao (ARMM)": [124.2422, 6.9568],
  "Region XIII (Caraga)": [125.7407, 8.8015],
};

const normalizeRegionLabel = (region) => {
  if (!region) return '';

  const normalized = String(region).trim();
  const aliasMap = {
    'Region I: Ilocos Region': 'Region I (Ilocos Region)',
    'Region II: Cagayan Valley': 'Region II (Cagayan Valley)',
    'Region III: Central Luzon': 'Region III (Central Luzon)',
    'Region IV-A: CALABARZON': 'Region IV-A (CALABARZON)',
    'Region IV-B: MIMAROPA': 'Region IV-B (MIMAROPA)',
    'Region V: Bicol Region': 'Region V (Bicol Region)',
    'Region VI: Western Visayas': 'Region VI (Western Visayas)',
    'Region VII: Central Visayas': 'Region VII (Central Visayas)',
    'Region VIII: Eastern Visayas': 'Region VIII (Eastern Visayas)',
    'Region IX: Zamboanga Peninsula': 'Region IX (Zamboanga Peninsula)',
    'Region X: Northern Mindanao': 'Region X (Northern Mindanao)',
    'Region XI: Davao Region': 'Region XI (Davao Region)',
    'Region XII: SOCCSKSARGEN': 'Region XII (SOCCSKSARGEN)',
    'Region XIII: Caraga': 'Region XIII (Caraga)',
    'NCR: National Capital Region (Metro Manila)': 'National Capital Region (NCR)',
    'NCR: National Capital Region': 'National Capital Region (NCR)',
    'National Capital Region': 'National Capital Region (NCR)',
    'CAR: Cordillera Administrative Region': 'Cordillera Administrative Region (CAR)',
    'Autonomous Region in Muslim Mindanao': 'Autonomous Region in Muslim Mindanao (ARMM)',
    'Bangsamoro Autonomous Region in Muslim Mindanao': 'Autonomous Region in Muslim Mindanao (ARMM)',
  };

  return aliasMap[normalized] || normalized;
};

ChartJS.register(...registerables);

// Normalize status strings coming from edit forms (e.g. "On-going" vs "Ongoing")
const normalizeStatus = (remarks) => {
  if (!remarks) return '';
  const r = remarks.toString().toLowerCase().replace(/[-\s]/g, '');
  if (r.includes('ongoing') || r === 'ongoing') return 'Ongoing';
  if (r.includes('new')) return 'New';
  if (r.includes('completed') || r.includes('complete')) return 'Completed';
  if (r.includes('cleared')) return 'Cleared';
  if (r.includes('interminat') || r.includes('interminated')) return 'Interminated';
  if (r.includes('terminated')) return 'Terminated';
  return remarks;
};

const Dashboard = () => {
  const [info, setInfo] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [indirectSummaryTotals, setIndirectSummaryTotals] = useState({
    totalReleases: 0,
    totalObligation: 0,
    runningBalance: 0,
    forPayment: 0,
    anticipatedBalance: 0,
  });
  const mapContainerRef = useRef(null);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedYearsProposal, setSelectedYearsProposal] = useState([]);
  const [filteredInfo, setFilteredInfo] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedRegionFilters, setSelectedRegionFilters] = useState([]);
  const [ispOptions, setIspOptions] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN?.trim();
  const hasValidMapboxToken = Boolean(mapboxToken?.startsWith('pk.') && mapboxToken.length > 30);

  // Handle responsive breakpoints
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

  const navigate = useNavigate();

  useEffect(() => {
    getInfo();
    getProposal();
    getIndirectCostSummary();
  }, []);

  useEffect(() => {
    let animationTimeout;
    const animateChart = () => {
      // Animate the chart after a delay
      animationTimeout = setTimeout(() => {
        // Render the chart animation
        // Then initialize the map
        initializeMap();
      }, 500); // Adjust the delay as needed
    };

    animateChart();

    return () => clearTimeout(animationTimeout);
  }, [info, selectedRegionFilters]);

  const initializeMap = () => {
    if (!hasValidMapboxToken || !mapContainerRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [122.4376, 12.3674],
      zoom: 5,
    });

    const filteredProjects = info
      .filter(project => normalizeStatus(project.status || project.remarks) !== "Terminated")
      .filter(project => {
        if (!selectedRegionFilters || selectedRegionFilters.length === 0) return true;
        return selectedRegionFilters.includes(normalizeRegionLabel(project.region || project.releaseData?.regionIA));
      });

    const regionToDisplay = filteredProjects.map(project => normalizeRegionLabel(project.region || project.releaseData?.regionIA));

    const projectsCount = {};
    regionToDisplay.forEach(region => {
      if (!region) return;
      projectsCount[region] = (projectsCount[region] || 0) + 1;
    });

    Object.keys(regionCoordinates).forEach(region => {
      if (regionToDisplay.includes(region)) {
        const coordinates = regionCoordinates[region];

        const popupContent = document.createElement('div');
        popupContent.className = 'custom-popup';
        popupContent.innerHTML = `<label>${region}</label><p>Number of projects: ${projectsCount[region]}</p>`;

        // Add click event listener to popup content
        popupContent.addEventListener('click', () => {
          // Do something when popup content is clicked, e.g., open a link or show more information
          console.log('Popup content clicked:', region);
          navigate("/DOST/Projects", { state: region });
        });

        const popup = new mapboxgl.Popup({ offset: 25, closeOnClick: true, closeButton: false })
          .setDOMContent(popupContent);

        new mapboxgl.Marker({ color: 'red' })
          .setLngLat(coordinates)
          .addTo(map)
          .setPopup(popup)
          .togglePopup();
      }
    });

    return () => map.remove();
  };


  const getInfo = async () => {
    const info = await axios.get('http://localhost:8080/Projects');
    setInfo(info.data);
  };

  const getProposal = async () => {
    const info = await axios.get('http://localhost:8080/Proposals');
    setProposals(info.data);
  };

  const getIndirectCostSummary = async () => {
    try {
      const response = await axios.get('http://localhost:8080/IndirectCostSummary');
      const data = Array.isArray(response.data) ? response.data : [];
      const totals = data.reduce(
        (acc, row) => ({
          totalReleases: acc.totalReleases + Number(row.totalReleases || 0),
          totalObligation: acc.totalObligation + Number(row.totalObligation || 0),
          runningBalance: acc.runningBalance + Number(row.runningBalance || 0),
          forPayment: acc.forPayment + Number(row.forPayment || 0),
          anticipatedBalance: acc.anticipatedBalance + (Number(row.runningBalance || 0) - Number(row.forPayment || 0)),
        }),
        {
          totalReleases: 0,
          totalObligation: 0,
          runningBalance: 0,
          forPayment: 0,
          anticipatedBalance: 0,
        }
      );
      setIndirectSummaryTotals(totals);
    } catch (error) {
      console.error('Error loading Indirect Cost Summary totals:', error);
    }
  };

  const refreshData = () => {
    getInfo();
    getIndirectCostSummary();
  };

  const clearFilter = () => {
    setSelectedYears([]);
    getInfo();
  };

  const clearFilterProposal = () => {
    setSelectedYearsProposal([]);
    getProposal();
  };

  const validYears = info
    .map(project => new Date(project.changeStart || project.originalStart).getFullYear())
    .filter((year, index, self) => !isNaN(year) && self.indexOf(year) === index)
    .sort((a, b) => a - b);


  const validYearsProposal = proposals
    .map(proposal => new Date(proposal.date).getFullYear())
    .filter((year, index, self) => !isNaN(year) && self.indexOf(year) === index)
    .sort((a, b) => a - b);

  const applyYearFilter = () => {
    if (selectedYears.length > 0) {
      const filteredInfo = info.filter(project => {
        const startYear = new Date(project.changeStart || project.originalStart).getFullYear();
        return selectedYears.includes(startYear);
      });
      setInfo(filteredInfo);
    } else {
      // If no years are selected, reset the data to its original state
      getInfo();
    }
  };


  const applyYearFilterProposal = () => {
    if (selectedYearsProposal.length > 0) {
      const filteredInfo = proposals.filter(proposal =>
        selectedYearsProposal.includes(new Date(proposal.date).getFullYear())
      );
      setProposals(filteredInfo);
    } else {
      // If no years are selected, reset the data to its original state
      getProposal();
    }
  };

  const handleYearChange = (e, year) => {
    if (e.target.checked) {
      setSelectedYears(prevSelectedYears => [...prevSelectedYears, year]);
    } else {
      setSelectedYears(prevSelectedYears => prevSelectedYears.filter(y => y !== year));
    }
    // Note: Don't call refreshData here, as it will trigger a refresh every time a checkbox is clicked
  };

  const handleYearChangeProposal = (e, year) => {
    if (e.target.checked) {
      setSelectedYearsProposal(prevSelectedYears => [...prevSelectedYears, year]);
    } else {
      setSelectedYearsProposal(prevSelectedYears => prevSelectedYears.filter(y => y !== year));
    }
    // Note: Don't call refreshData here, as it will trigger a refresh every time a checkbox is clicked
  };

  let ongoingProjects = [];
  let newProjects = [];
  let completedProjects = [];
  let terminatedProjects = [];
  let clearedProjects = [];
  let interminatedProjects = [];
  let totalProjects = 0;

  if (info.length > 0) {
    totalProjects = info.length;
    ongoingProjects = info.filter((project) => normalizeStatus(project.status || project.remarks) === 'Ongoing');
    newProjects = info.filter((project) => normalizeStatus(project.status || project.remarks) === 'New');
    completedProjects = info.filter((project) => normalizeStatus(project.status || project.remarks) === 'Completed');
    terminatedProjects = info.filter((project) => normalizeStatus(project.status || project.remarks) === 'Terminated');
    clearedProjects = info.filter((project) => normalizeStatus(project.status || project.remarks) === 'Cleared');
    interminatedProjects = info.filter((project) => normalizeStatus(project.status || project.remarks) === 'Interminated');
  }

  const projectStatusPercent = (count) =>
    totalProjects ? ((count / totalProjects) * 100).toFixed(0) : '0';

  const projectStatusSummaryCards = [
    {
      id: 'ongoing',
      label: 'Ongoing',
      count: ongoingProjects.length,
      iconClass: 'fa-solid fa-arrows-rotate',
      iconBg: '#E1F5FE',
      iconColor: '#03A9F4',
    },
    {
      id: 'new',
      label: 'New',
      count: newProjects.length,
      iconClass: 'fa-regular fa-square-plus',
      iconBg: '#FFF3E0',
      iconColor: '#FF9800',
    },
    {
      id: 'completed',
      label: 'Completed',
      count: completedProjects.length,
      iconClass: 'fa-regular fa-circle-check',
      iconBg: '#E8F5E9',
      iconColor: '#4CAF50',
    },
    {
      id: 'cleared',
      label: 'Cleared',
      count: clearedProjects.length,
      iconClass: 'fa-solid fa-broom',
      iconBg: '#E0F7FA',
      iconColor: '#00ACC1',
    },
    {
      id: 'interminated',
      label: 'Interminated',
      count: interminatedProjects.length,
      iconClass: 'fa-solid fa-hourglass-half',
      iconBg: '#FFF0F4',
      iconColor: '#FF6F61',
    },
    {
      id: 'terminated',
      label: 'Terminated',
      count: terminatedProjects.length,
      iconClass: 'fa-solid fa-ban',
      iconBg: '#FFEBEE',
      iconColor: '#F44336',
    },
  ];

  let approvedProposals = [];
  let disapprovedProposals = [];
  let resubmissionProposals = [];
  let underEvaluationProposals = [];
  let revisionProposals = [];

  if (proposals && proposals.length > 0) {
    approvedProposals = proposals.filter((project) => project.remarks === 'Approved');
    disapprovedProposals = proposals.filter((project) => project.remarks === 'Disapproved');
    resubmissionProposals = proposals.filter((project) => project.remarks === 'Resubmission');
    underEvaluationProposals = proposals.filter((project) => project.remarks === 'Under Evaluation');
    revisionProposals = proposals.filter((project) => project.remarks === 'Revision');
  }

  // Proposal category counts sourced from localStorage (Concept, Fullblown, IDD)
  const conceptProposals = (() => {
    try { return JSON.parse(localStorage.getItem('conceptProposals') || '[]'); } catch { return []; }
  })();
  const fullblownProposals = (() => {
    try { return JSON.parse(localStorage.getItem('fullblownProposals') || '[]'); } catch { return []; }
  })();
  const iddProposals = (() => {
    try { return JSON.parse(localStorage.getItem('iddProposals') || '[]'); } catch { return []; }
  })();

  const conceptCount = conceptProposals.length;
  const fullblownCount = fullblownProposals.length;
  const iddCount = iddProposals.length;

  // Total is the sum of the three proposal categories displayed in the breakdown
  const combinedTotal = conceptCount + fullblownCount + iddCount;

  // Denominator for category percentages must be the sum of the same categories,
  // otherwise percentages won't add up to 100% when API/localStorage counts differ.
  const categoryTotal = conceptCount + fullblownCount + iddCount;
  const percentOf = (count) => (categoryTotal ? ((count / categoryTotal) * 100).toFixed(0) : 0);

  const proposalCategorySummaryCards = [
    {
      id: 'concept',
      label: 'Concept Proposal',
      count: conceptCount,
      iconClass: 'fa-solid fa-file-lines',
      iconBg: '#E3F2FD',
      iconColor: '#1976D2',
    },
    {
      id: 'fullblown',
      label: 'Fullblown Proposal',
      count: fullblownCount,
      iconClass: 'fa-solid fa-file-circle-check',
      iconBg: '#F3E5F5',
      iconColor: '#8E24AA',
    },
    {
      id: 'idd',
      label: 'IDD Proposal',
      count: iddCount,
      iconClass: 'fa-solid fa-file-prescription',
      iconBg: '#E8F5E9',
      iconColor: '#2E7D32',
    },
  ];

  const truncateLabel = (label, maxLength = 20) => {
    if (!label) return '';
    if (label.length > maxLength) {
      return label.substring(0, maxLength) + '...';
    }
    return label;
  };

  // Modern executive analytics color palette
  const CHART_COLORS = {
    blue: '#3B82F6',
    blueDark: '#2563EB',
    emerald: '#10B981',
    emeraldDark: '#059669',
    cyan: '#06B6D4',
    cyanDark: '#0891B2',
    violet: '#8B5CF6',
    violetDark: '#7C3AED',
    amber: '#F59E0B',
    amberDark: '#D97706',
    rose: '#EF4444',
    roseDark: '#DC2626',
    indigo: '#6366F1',
    indigoDark: '#4F46E5',
    pink: '#EC4899',
    pinkDark: '#DB2777',
    slate: '#64748B',
    slateDark: '#334155',
  };

  const STATUS_COLOR_MAP = {
    Ongoing: CHART_COLORS.blue,
    New: CHART_COLORS.emerald,
    Completed: CHART_COLORS.cyan,
    Cleared: CHART_COLORS.violet,
    Interminated: CHART_COLORS.amber,
    Terminated: CHART_COLORS.rose,
  };

  const ISP_PALETTE = [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#6366F1', '#14B8A6',
    '#F97316', '#84CC16', '#A855F7', '#0EA5E9'
  ];

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '₱0';
    return '₱' + Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const formatCompactCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '₱0';
    const num = Number(val);
    if (Math.abs(num) >= 1e9) return '₱' + (num / 1e9).toFixed(1) + 'B';
    if (Math.abs(num) >= 1e6) return '₱' + (num / 1e6).toFixed(1) + 'M';
    if (Math.abs(num) >= 1e3) return '₱' + (num / 1e3).toFixed(0) + 'K';
    return '₱' + num.toLocaleString();
  };

  const pieChartDataProposals = {
    labels: ['Concept', 'Fullblown', 'IDD'],
    datasets: [{
      data: [
        conceptCount,
        fullblownCount,
        iddCount
      ],
      backgroundColor: [CHART_COLORS.blue, CHART_COLORS.violet, CHART_COLORS.emerald],
      hoverBackgroundColor: [CHART_COLORS.blueDark, CHART_COLORS.violetDark, CHART_COLORS.emeraldDark],
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  };

  // Build status distribution for Concept Proposals (for adjacent chart)
  const conceptStatusCounts = conceptProposals.reduce((acc, cur) => {
    const s = (cur.status || cur.remarks || 'Unspecified');
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const conceptStatusLabels = Object.keys(conceptStatusCounts);
  const conceptStatusData = conceptStatusLabels.map(l => conceptStatusCounts[l]);
  const statusColorMap = {
    'Approved': CHART_COLORS.emerald,
    'Endorsed': CHART_COLORS.emeraldDark,
    'Disapproved': CHART_COLORS.rose,
    'Resubmission': CHART_COLORS.amber,
    'Under Evaluation': CHART_COLORS.blue,
    'Revision': CHART_COLORS.violet,
    'For revision': CHART_COLORS.amberDark,
    'Other': CHART_COLORS.slate,
    'Unspecified': '#CBD5E1'
  };
  const conceptStatusColors = conceptStatusLabels.map(l => statusColorMap[l] || '#94A3B8');
  const pieChartDataConceptStatus = {
    labels: conceptStatusLabels,
    datasets: [{
      data: conceptStatusData,
      backgroundColor: conceptStatusColors,
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  };

  const normalizeFullblownStatus = (value) => {
    const status = (value || '').toString().trim();
    if (!status || status.toLowerCase() === 'unspecified') {
      return null;
    }
    return status;
  };

  const normalizeIddStatus = (value) => {
    const status = (value || '').toString().trim();
    if (!status) return 'Other';
    const lower = status.toLowerCase();
    if (lower.includes('endorse')) return 'Endorsed';
    if (lower.includes('revision')) return 'For revision';
    if (lower === 'for evaluation' || lower === 'for evaluation ') return 'Other';
    return 'Other';
  };

  // Fullblown proposal status distribution
  const fullblownStatusCounts = fullblownProposals.reduce((acc, cur) => {
    const status = normalizeFullblownStatus(cur.status || cur.remarks);
    if (!status) return acc;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const fullblownStatusLabels = Object.keys(fullblownStatusCounts);
  const fullblownStatusData = fullblownStatusLabels.map(l => fullblownStatusCounts[l]);
  const fullblownStatusColors = fullblownStatusLabels.map(l => statusColorMap[l] || '#94A3B8');
  const pieChartDataFullblownStatus = {
    labels: fullblownStatusLabels,
    datasets: [{
      data: fullblownStatusData,
      backgroundColor: fullblownStatusColors,
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  };

  // IDD proposal status distribution
  const iddStatusCounts = iddProposals.reduce((acc, cur) => {
    const status = normalizeIddStatus(cur.status || cur.remarks);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  const iddStatusLabels = Object.keys(iddStatusCounts);
  const iddStatusData = iddStatusLabels.map(l => iddStatusCounts[l]);
  const iddStatusColors = iddStatusLabels.map(l => statusColorMap[l] || '#94A3B8');
  const pieChartDataIddStatus = {
    labels: iddStatusLabels,
    datasets: [{
      data: iddStatusData,
      backgroundColor: iddStatusColors,
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  };

  const pieChartData = {
    labels: ['Ongoing', 'New', 'Completed', 'Cleared', 'Interminated', 'Terminated'],
    datasets: [{
      data: [
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'Ongoing').length,
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'New').length,
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'Completed').length,
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'Cleared').length,
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'Interminated').length,
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'Terminated').length,
      ],
      backgroundColor: [
        STATUS_COLOR_MAP.Ongoing,
        STATUS_COLOR_MAP.New,
        STATUS_COLOR_MAP.Completed,
        STATUS_COLOR_MAP.Cleared,
        STATUS_COLOR_MAP.Interminated,
        STATUS_COLOR_MAP.Terminated,
      ],
      hoverBackgroundColor: [
        CHART_COLORS.blueDark,
        CHART_COLORS.emeraldDark,
        CHART_COLORS.cyanDark,
        CHART_COLORS.violetDark,
        CHART_COLORS.amberDark,
        CHART_COLORS.roseDark,
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  };

  const statusBarChartData = {
    labels: ['Ongoing', 'New', 'Completed', 'Cleared', 'Interminated', 'Terminated'],
    datasets: [{
      label: 'Projects',
      data: [
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'Ongoing').length,
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'New').length,
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'Completed').length,
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'Cleared').length,
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'Interminated').length,
        info.filter(p => normalizeStatus(p.status || p.remarks) === 'Terminated').length,
      ],
      backgroundColor: [
        STATUS_COLOR_MAP.Ongoing,
        STATUS_COLOR_MAP.New,
        STATUS_COLOR_MAP.Completed,
        STATUS_COLOR_MAP.Cleared,
        STATUS_COLOR_MAP.Interminated,
        STATUS_COLOR_MAP.Terminated,
      ],
      hoverBackgroundColor: [
        CHART_COLORS.blueDark,
        CHART_COLORS.emeraldDark,
        CHART_COLORS.cyanDark,
        CHART_COLORS.violetDark,
        CHART_COLORS.amberDark,
        CHART_COLORS.roseDark,
      ],
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 38,
    }]
  };

  const indirectCostPieData = {
    labels: ['Total Releases', 'Total Obligation/Expenses', 'Running Balance', 'For Payment', 'Anticipated Balance'],
    datasets: [{
      data: [
        indirectSummaryTotals.totalReleases,
        indirectSummaryTotals.totalObligation,
        indirectSummaryTotals.runningBalance,
        indirectSummaryTotals.forPayment,
        indirectSummaryTotals.anticipatedBalance,
      ],
      backgroundColor: [CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.emerald, CHART_COLORS.pink, CHART_COLORS.violet],
      hoverBackgroundColor: [CHART_COLORS.blueDark, CHART_COLORS.amberDark, CHART_COLORS.emeraldDark, CHART_COLORS.pinkDark, CHART_COLORS.violetDark],
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  };

  // Modern dark slate tooltip
  const modernTooltip = {
    backgroundColor: '#0F172A',
    titleColor: '#F8FAFC',
    bodyColor: '#F1F5F9',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    padding: { top: 8, bottom: 8, left: 12, right: 12 },
    cornerRadius: 8,
    boxPadding: 4,
    usePointStyle: true,
    titleFont: { family: "'Inter', 'Segoe UI', sans-serif", size: 12, weight: '600' },
    bodyFont: { family: "'Inter', 'Segoe UI', sans-serif", size: 12 },
  };

  const modernDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    spacing: 2,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          boxWidth: 8,
          boxHeight: 8,
          color: '#475569',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
        },
      },
      tooltip: {
        ...modernTooltip,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed !== undefined ? context.parsed : context.raw;
            const total = context.dataset.data.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return ` ${label}: ${Number(value).toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  const modernCurrencyDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    spacing: 2,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          boxWidth: 8,
          boxHeight: 8,
          color: '#475569',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
        },
      },
      tooltip: {
        ...modernTooltip,
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed !== undefined ? context.parsed : context.raw;
            const total = context.dataset.data.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return ` ${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const modernBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          boxWidth: 8,
          boxHeight: 8,
          color: '#475569',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
        },
      },
      tooltip: modernTooltip,
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: '#64748B',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.8)',
          borderDash: [4, 4],
          drawBorder: false,
        },
        ticks: {
          color: '#64748B',
          precision: 0,
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
        },
      },
    },
  };

  const modernCurrencyBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        ...modernTooltip,
        callbacks: {
          label: function (context) {
            const value = context.raw || (context.parsed && context.parsed.y) || 0;
            return ` ${context.dataset.label || context.label}: ${formatCurrency(value)}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          color: '#64748B',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.8)',
          borderDash: [4, 4],
          drawBorder: false,
        },
        ticks: {
          color: '#64748B',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
          callback: (value) => formatCompactCurrency(value),
        },
      },
    },
  };

  const modernStackedRegionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          boxWidth: 8,
          boxHeight: 8,
          color: '#475569',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
        },
      },
      tooltip: modernTooltip,
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false, drawBorder: false },
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 45,
          color: '#64748B',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 10, weight: '500' },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.8)',
          borderDash: [4, 4],
          drawBorder: false,
        },
        ticks: {
          color: '#64748B',
          precision: 0,
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
        },
      },
    },
  };

  const modernStackedRegionBudgetOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          boxWidth: 8,
          boxHeight: 8,
          color: '#475569',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
        },
      },
      tooltip: {
        ...modernTooltip,
        callbacks: {
          label: function (context) {
            const value = context.raw || (context.parsed && context.parsed.y) || 0;
            return ` ${context.dataset.label}: ${formatCurrency(value)}`;
          }
        }
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false, drawBorder: false },
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 45,
          color: '#64748B',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 10, weight: '500' },
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.8)',
          borderDash: [4, 4],
          drawBorder: false,
        },
        ticks: {
          color: '#64748B',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
          callback: (value) => formatCompactCurrency(value),
        },
      },
    },
  };

  const modernLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        ...modernTooltip,
        callbacks: {
          label: function (context) {
            const value = context.raw || (context.parsed && context.parsed.y) || 0;
            return ` Total Budget: ${formatCurrency(value)}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 45,
          color: '#64748B',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 10, weight: '500' },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.8)',
          borderDash: [4, 4],
          drawBorder: false,
        },
        ticks: {
          color: '#64748B',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
          callback: (value) => formatCompactCurrency(value),
        },
      },
    },
  };

  // Backwards compatible aliases
  const options = modernDoughnutOptions;
  const option = modernStackedRegionOptions;

  const getISPData = () => {
    const ispData = {};
    info.forEach((project) => {
        const isp = project.ISP;
        if (isp && !isp.includes('Inland Biodiversity')) {
            ispData[isp] = ispData[isp] ? ispData[isp] + 1 : 1;
        }
    });
    return ispData;
  };

  const getInlandBiodiversityData = () => {
    const inlandData = { new: 0, ongoing: 0, completed: 0 };
    info.forEach((project) => {
      const isp = project.ISP;
      // Check if the project matches any selected filters
        if (isp && isp.includes('Inland Biodiversity') && (selectedFilters.length === 0 || selectedFilters.some(filter => isp.includes(filter)))) {
          const status = normalizeStatus(project.status || project.remarks);
          if (status === 'New') {
            inlandData.new += 1;
          } else if (status === 'Ongoing') {
            inlandData.ongoing += 1;
          } else if (status === 'Completed') {
            inlandData.completed += 1;
          }
        }
    });
    return inlandData;
  };

  const getISPPerData = () => {
    const ispData = {};
    info.forEach((project) => {
        const isp = project.ISP;
        // Exclude Inland Biodiversity from ISP per data
        if (isp && !isp.includes('Inland Biodiversity')) {
            if (!ispData[isp]) {
              ispData[isp] = { new: 0, ongoing: 0, completed: 0 };
            }
            const status = normalizeStatus(project.status || project.remarks);
            if (status === 'New') {
              ispData[isp].new += 1;
            } else if (status === 'Ongoing') {
              ispData[isp].ongoing += 1;
            } else if (status === 'Completed') {
              ispData[isp].completed += 1;
            }
        }
    });
    return ispData;
  };

  const ispData = getISPData();
  const ispPerData = getISPPerData();
  const inlandBiodiversityData = getInlandBiodiversityData();

  const ispChartData = {
    labels: Object.keys(ispData),
    datasets: [{
      data: Object.values(ispData),
      backgroundColor: ISP_PALETTE,
      borderWidth: 2,
      borderColor: '#ffffff',
    }]
  };

  // Extract unique ISP options that include 'Inland Biodiversity'
  const extractIspOptions = () => {
    const uniqueISPs = new Set();
    info.forEach((project) => {
      const isp = project.ISP;
      if (isp && isp.includes('Inland Biodiversity')) {
        uniqueISPs.add(isp);
      }
    });
    return [...uniqueISPs];
  };

  // Handle checkbox change for filters
  const handleFilterChange = (event, filter) => {
    if (event.target.checked) {
      setSelectedFilters([...selectedFilters, filter]);
    } else {
      setSelectedFilters(selectedFilters.filter(f => f !== filter));
    }
  };

  // useEffect to update ispOptions whenever info changes
  useEffect(() => {
    setIspOptions(extractIspOptions());
  }, [info]);

  const generateChartData = (data) => {
    return {
      labels: ['New', 'Ongoing', 'Completed'],
      datasets: [{
        data: [data.new, data.ongoing, data.completed],
        backgroundColor: [STATUS_COLOR_MAP.New, STATUS_COLOR_MAP.Ongoing, STATUS_COLOR_MAP.Completed],
        hoverBackgroundColor: [CHART_COLORS.emeraldDark, CHART_COLORS.blueDark, CHART_COLORS.cyanDark],
        borderWidth: 2,
        borderColor: '#ffffff',
      }]
    };
  };

  const generateInlandChartData = () => {
    return generateChartData(getInlandBiodiversityData());
  };

  const calculateTotalBudgetByISP = () => {
    const totalBudgetByISP = {};
    info.forEach((project) => {
      const isp = project.ISP;
      const budgetString = project.totalBudget;
      if (budgetString !== null) {
        const budget = parseFloat(budgetString.replace(/,/g, '') || 0);
        if (!totalBudgetByISP[isp]) {
          totalBudgetByISP[isp] = budget;
        } else {
          totalBudgetByISP[isp] += budget;
        }
      }
    });
    return totalBudgetByISP;
  };

  const totalBudgetByISP = calculateTotalBudgetByISP();
  const truncatedBLabels = Object.keys(totalBudgetByISP).map(label => truncateLabel(label, 16));

  const lineChartData = {
    labels: truncatedBLabels,
    datasets: [
      {
        label: 'Total Budget by ISP',
        data: Object.values(totalBudgetByISP),
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderColor: CHART_COLORS.blue,
        borderWidth: 2.5,
        tension: 0.35,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: CHART_COLORS.blue,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: CHART_COLORS.blue,
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const ispBudgetBarData = {
    labels: truncatedBLabels,
    datasets: [
      {
        label: 'Total Budget by ISP',
        data: Object.values(totalBudgetByISP),
        backgroundColor: CHART_COLORS.indigo,
        hoverBackgroundColor: CHART_COLORS.indigoDark,
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 32,
      },
    ],
  };


  const calculateBudgetOverallTotal = () => {
    let overallTotal = 0;

    info.forEach(project => {
      if (project.totalBudget) {
        overallTotal += parseFloat(project.totalBudget.replace(/,/g, ''));
      }
    });

    return overallTotal;
  };

  const calculateNewBudgetOverallTotal = () => {
    let overallTotal = 0;

    const newProjects = info.filter((project) => normalizeStatus(project.status || project.remarks) === 'New');
    newProjects.forEach(project => {
      if (project.totalBudget) {
        overallTotal += parseFloat(project.totalBudget.replace(/,/g, ''));
      }
    });

    return overallTotal;
  };

  const calculateOngoingBudgetOverallTotal = () => {
    let overallTotal = 0;

    const newProjects = info.filter((project) => normalizeStatus(project.status || project.remarks) === 'Ongoing');
    newProjects.forEach(project => {
      if (project.totalBudget) {
        overallTotal += parseFloat(project.totalBudget.replace(/,/g, ''));
      }
    });

    return overallTotal;
  };

  const calculateProgrammedOverallTotal = () => {
    let overallTotal = 0;

    info.forEach(project => {
      if (project.releaseData?.programmedAmount) {
        overallTotal += parseFloat(String(project.releaseData.programmedAmount).replace(/,/g, ''));
      }
    });

    return overallTotal;
  };

  const calculateActualOverallTotal = () => {
    let overallTotal = 0;

    info.forEach(project => {
      if (project.releaseData?.actualRelease) {
        overallTotal += parseFloat(String(project.releaseData.actualRelease).replace(/,/g, ''));
      }
    });

    return overallTotal;
  };

  const budgetReleaseSummaryCards = [
    {
      id: 'overall-budget',
      label: 'Overall Total Budget',
      value: calculateBudgetOverallTotal().toLocaleString(),
      iconClass: 'fa-solid fa-equals',
      iconBg: '#E0F2F1',
      iconColor: '#009688',
    },
    {
      id: 'programmed',
      label: 'Total Programmed Budget',
      value: calculateProgrammedOverallTotal().toLocaleString(),
      iconClass: 'fa-solid fa-calculator',
      iconBg: '#E1F5FE',
      iconColor: '#03A9F4',
    },
    {
      id: 'actual-releases',
      label: 'Total Actual Releases',
      value: calculateActualOverallTotal().toLocaleString(),
      iconClass: 'fa-solid fa-money-bill-transfer',
      iconBg: '#FFF3E0',
      iconColor: '#FF9800',
    },
    {
      id: 'new-budget',
      label: 'Total for New',
      value: calculateNewBudgetOverallTotal().toLocaleString(),
      iconClass: 'fa-regular fa-square-plus',
      iconBg: '#E8F5E9',
      iconColor: '#4CAF50',
    },
    {
      id: 'ongoing-budget',
      label: 'Total for Ongoing',
      value: calculateOngoingBudgetOverallTotal().toLocaleString(),
      iconClass: 'fa-solid fa-arrows-rotate',
      iconBg: '#FFEBEE',
      iconColor: '#F44336',
    },
  ];

  const sumOfReleasesData1 = {
    labels: ['New', 'Ongoing', 'Total Budget'],
    datasets: [
      {
        label: 'Budget',
        data: [
          calculateNewBudgetOverallTotal(),
          calculateOngoingBudgetOverallTotal(),
          calculateBudgetOverallTotal()
        ],
        backgroundColor: [STATUS_COLOR_MAP.New, STATUS_COLOR_MAP.Ongoing, CHART_COLORS.indigo],
        hoverBackgroundColor: [CHART_COLORS.emeraldDark, CHART_COLORS.blueDark, CHART_COLORS.indigoDark],
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 52,
      }
    ]
  };

  const sumOfReleasesData2 = {
    labels: ['Programmed Budget', 'Actual Releases'],
    datasets: [
      {
        label: 'Releases',
        data: [
          calculateProgrammedOverallTotal(),
          calculateActualOverallTotal()
        ],
        backgroundColor: [CHART_COLORS.blue, CHART_COLORS.emerald],
        hoverBackgroundColor: [CHART_COLORS.blueDark, CHART_COLORS.emeraldDark],
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 52,
      }
    ]
  };

  const getProjectsByStatusAndAgency = () => {
    const projectsByStatusAndAgency = {};

    info.forEach((project) => {
      const status = normalizeStatus(project.status || project.remarks);
      const agency = project.implementingAgency;

      if (status !== 'Terminated' && agency) { // Exclude terminated projects and projects without an agency
        if (!projectsByStatusAndAgency[agency]) {
          projectsByStatusAndAgency[agency] = { New: 0, Ongoing: 0, Completed: 0 };
        }

        projectsByStatusAndAgency[agency][status]++;
      }
    });

    return projectsByStatusAndAgency;
  };

  const getProjectsByRegionAndStatus = () => {
    const projectsByRegionAndStatus = {};

    info.forEach((project) => {
      const status = normalizeStatus(project.status || project.remarks);
      const region = normalizeRegionLabel(project.region || project.releaseData?.regionIA);

      if (status !== 'Terminated' && region) { // Exclude terminated projects and projects without a region
        if (selectedRegionFilters && selectedRegionFilters.length > 0 && !selectedRegionFilters.includes(region)) {
          return;
        }

        if (!projectsByRegionAndStatus[region]) {
          projectsByRegionAndStatus[region] = { New: 0, Ongoing: 0, Completed: 0 };
        }

        projectsByRegionAndStatus[region][status]++;
      }
    });

    return projectsByRegionAndStatus;
  };

  const getTotalBudgetByRegionAndStatus = () => {
    const budgetByRegionAndStatus = {};

    info.forEach((project) => {
      const status = normalizeStatus(project.status || project.remarks);
      const region = normalizeRegionLabel(project.region || project.releaseData?.regionIA);
      const budget = project.totalBudget ? parseFloat(project.totalBudget.replace(/,/g, '')) : 0;

      if (status !== 'Terminated' && region) { // Exclude terminated projects and projects without a region
        if (selectedRegionFilters && selectedRegionFilters.length > 0 && !selectedRegionFilters.includes(region)) {
          return;
        }

        if (!budgetByRegionAndStatus[region]) {
          budgetByRegionAndStatus[region] = { New: 0, Ongoing: 0, Completed: 0 };
        }

        budgetByRegionAndStatus[region][status] += budget;
      }
    });

    return budgetByRegionAndStatus;
  };


  const projectsByStatusAndAgency = getProjectsByStatusAndAgency();

  const agencyLabels = Object.keys(projectsByStatusAndAgency);
  const newCounts = agencyLabels.map((agency) => projectsByStatusAndAgency[agency].New);
  const ongoingCounts = agencyLabels.map((agency) => projectsByStatusAndAgency[agency].Ongoing);
  const completedCounts = agencyLabels.map((agency) => projectsByStatusAndAgency[agency].Completed);

  // Use truncateLabel function to truncate long labels
  const truncatedLabels = agencyLabels.map(label => truncateLabel(label, 30));

  const barChartData = {
    labels: truncatedLabels,
    datasets: [
      {
        label: 'New',
        data: newCounts,
        backgroundColor: STATUS_COLOR_MAP.New,
        hoverBackgroundColor: CHART_COLORS.emeraldDark,
        barThickness: 12,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Ongoing',
        data: ongoingCounts,
        backgroundColor: STATUS_COLOR_MAP.Ongoing,
        hoverBackgroundColor: CHART_COLORS.blueDark,
        barThickness: 12,
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Completed',
        data: completedCounts,
        backgroundColor: STATUS_COLOR_MAP.Completed,
        hoverBackgroundColor: CHART_COLORS.cyanDark,
        barThickness: 12,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  // Restore vertical bars but improve label handling and tooltips
  const agencyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          boxWidth: 8,
          boxHeight: 8,
          color: '#475569',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
        },
      },
      tooltip: {
        ...modernTooltip,
        mode: 'index',
        intersect: false,
        callbacks: {
          title: (contexts) => {
            // show full agency name in tooltip title using original agencyLabels
            if (!contexts || !contexts.length) return '';
            const idx = contexts[0].dataIndex;
            return agencyLabels[idx] || contexts[0].label;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: false, drawBorder: false },
        ticks: {
          autoSkip: true,
          maxRotation: 45,
          minRotation: 45,
          precision: 0,
          color: '#64748B',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 10, weight: '500' },
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.8)',
          borderDash: [4, 4],
          drawBorder: false,
        },
        ticks: {
          precision: 0,
          color: '#64748B',
          font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11, weight: '500' },
        }
      }
    },
    elements: { bar: { borderWidth: 0, maxBarThickness: 24, borderRadius: 4, borderSkipped: false } }
  };

  const projectsByRegionAndStatus = getProjectsByRegionAndStatus();

  const regionLabels = Object.keys(projectsByRegionAndStatus);
  const statusLabels = ['New', 'Ongoing', 'Completed'];

  const truncatedRLabels = regionLabels.map(label => truncateLabel(label, 10));

  const regionData = {
    labels: truncatedRLabels,
    datasets: statusLabels.map((status) => ({
      label: status,
      data: regionLabels.map((region) => projectsByRegionAndStatus[region][status] || 0),
      backgroundColor: status === 'New' ? STATUS_COLOR_MAP.New : status === 'Ongoing' ? STATUS_COLOR_MAP.Ongoing : STATUS_COLOR_MAP.Completed,
      hoverBackgroundColor: status === 'New' ? CHART_COLORS.emeraldDark : status === 'Ongoing' ? CHART_COLORS.blueDark : CHART_COLORS.cyanDark,
      borderRadius: 4,
      borderSkipped: false,
    })),
  };

  const budgetByRegionAndStatus = getTotalBudgetByRegionAndStatus();

  const regionLabelss = Object.keys(budgetByRegionAndStatus);
  const statusLabelss = ['New', 'Ongoing', 'Completed'];

  const truncatedRSLabels = regionLabelss.map(label => truncateLabel(label, 10));

  const regionDataWithBudget = {
    labels: truncatedRSLabels,
    datasets: statusLabelss.map((status) => ({
      label: status,
      data: regionLabelss.map((region) => budgetByRegionAndStatus[region][status] || 0),
      backgroundColor: status === 'New' ? STATUS_COLOR_MAP.New : status === 'Ongoing' ? STATUS_COLOR_MAP.Ongoing : STATUS_COLOR_MAP.Completed,
      hoverBackgroundColor: status === 'New' ? CHART_COLORS.emeraldDark : status === 'Ongoing' ? CHART_COLORS.blueDark : CHART_COLORS.cyanDark,
      borderRadius: 4,
      borderSkipped: false,
    })),
  };

  const calculateRegionWiseProjects = () => {
    const regionProjects = {};
    info.forEach((project) => {
      if (normalizeStatus(project.status || project.remarks) !== 'Terminated') {
        const region = normalizeRegionLabel(project.region || project.releaseData?.regionIA);
        if (!region) return;
        if (selectedRegionFilters && selectedRegionFilters.length > 0 && !selectedRegionFilters.includes(region)) return;
        regionProjects[region] = (regionProjects[region] || 0) + 1;
      }
    });
    return regionProjects;
  };

  const regionProjects = calculateRegionWiseProjects();

  return (
    <article className={`dashboard-container pt-5 pb-5 ${isMobile ? 'ps-3 pe-3' : isTablet ? 'ps-4 pe-4' : 'pe-5'}`}>

      <div className="d-flex justify-content-between align-items-center">
        <label className='h4 py-2 fw-bold'>Dashboard</label>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <h6 className='pt-1 fw-semibold'>Programs/Projects Summary</h6>
        <div className="d-flex align-items-center">
          <div className='sample dropdown me-3 filterTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
            <ReactTooltip anchorSelect=".filterTooltip" style={{ borderRadius: '10px', fontSize: '12px' }}>
              Filter
            </ReactTooltip>
            <button type="button" className="btn border-0" data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside">
              <i className="fa-solid fa-filter fs-5"></i>
            </button>
            <ul className="dropdown-menu dropdown-submenu p-2 dropdown-menu-lg-end">
              <label className="pb-2">Year:</label>
              {validYears.map(year => (
                <div key={year} className="form-check">
                  <input
                    type="checkbox"
                    id={`yearCheckbox-${year}`}
                    value={year}
                    checked={selectedYears.includes(year)}
                    onChange={(e) => handleYearChange(e, year)}
                    className="form-check-input me-2"
                  />
                  <label htmlFor={`yearCheckbox-${year}`} className="form-check-label me-4">
                    {year}
                  </label>
                </div>
              ))}
              <div className="d-flex justify-content-end">
                <div className='resetTooltip me-auto'>
                  <Tooltip anchorSelect=".resetTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                    Reset
                  </Tooltip>
                  <button type="button" className="btn btn-outline rounded-circle py-1 px-2" onClick={clearFilter}><i className="fa-solid fa-arrow-rotate-right"></i></button>
                </div>
                <div className='applyTooltip'>
                  <Tooltip anchorSelect=".applyTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                    Apply
                  </Tooltip>
                  <button type="button" className="btn btn-outline rounded-circle py-1 px-2" onClick={applyYearFilter}><i className="fa-solid fa-check text-success"></i></button>
                </div>
              </div>
            </ul>
          </div>
          <div className='sample me-3 refreshTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
            <ReactTooltip anchorSelect=".refreshTooltip" style={{ borderRadius: '10px', fontSize: '12px' }}>
              Refresh
            </ReactTooltip>
            <button type="button" className="btn border-0" onClick={refreshData} data-bs-toggle="tooltip" data-bs-title="Refresh">
              <i className="fa-solid fa-sync fs-5"></i>
            </button>
          </div>
        </div>
      </div>

      <div className='row pb-4'>
        <div className='col-lg-4'>
          <div className='dashboard-projects-summary pt-4'>
            <div className='card radius-10 border dashboard-summary-card dashboard-summary-total-card'>
              <div className='card-body dashboard-summary-total-body'>
                <div
                  className='dashboard-summary-icon dashboard-summary-icon--sm'
                  style={{ backgroundColor: '#E0F2F1' }}
                >
                  <i className='fa-solid fa-equals' style={{ color: '#009688' }}></i>
                </div>
                <div className='dashboard-summary-content'>
                  <p className='dashboard-summary-value dashboard-summary-value--total mb-0 text-dark fw-bold'>
                    {totalProjects}
                  </p>
                  <p className='dashboard-summary-label mb-0 text-secondary'>Total Projects</p>
                </div>
              </div>
            </div>

            <div className='dashboard-summary-status-grid'>
              {projectStatusSummaryCards.map((card) => (
                <div key={card.id} className='card radius-10 border dashboard-summary-card dashboard-summary-status-card'>
                  <div className='card-body dashboard-summary-status-body'>
                    <div
                      className='dashboard-summary-icon dashboard-summary-icon--sm'
                      style={{ backgroundColor: card.iconBg }}
                    >
                      <i className={card.iconClass} style={{ color: card.iconColor }}></i>
                    </div>
                    <p className='dashboard-summary-value mb-1 text-dark fw-bold'>
                      {card.count} ({projectStatusPercent(card.count)}%)
                    </p>
                    <p className='dashboard-summary-label mb-0 text-secondary'>{card.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className='col'>
          <div className="row g-3 pt-2 pt-4">
            <div className="col-12 col-xl-6">
              <div className="card radius-10 border p-3 dashboard-chart-card h-100">
                <div className="card-body p-0 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="card-title fw-bold text-start mb-0">Status Distribution</h6>
                      <small className="text-secondary">Proportional breakdown</small>
                    </div>
                    <span className="dashboard-chart-badge">Doughnut</span>
                  </div>
                  <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '260px' }}>
                    <Doughnut data={pieChartData} options={modernDoughnutOptions} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-6">
              <div className="card radius-10 border p-3 dashboard-chart-card h-100">
                <div className="card-body p-0 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h6 className="card-title fw-bold text-start mb-0">Status Comparison</h6>
                      <small className="text-secondary">Direct project volume</small>
                    </div>
                    <span className="dashboard-chart-badge">Volume</span>
                  </div>
                  <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '260px' }}>
                    <Bar
                      data={statusBarChartData}
                      options={{
                        ...modernBarOptions,
                        plugins: {
                          ...modernBarOptions.plugins,
                          legend: { display: false }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h6 className='pt-4 pb-2 fw-bold'>Programs/Projects per ISP Summary</h6>
      <div className='row g-3 pt-2 pb-4'>
        <div className="col-lg-3 col-md-6">
          <div className="card radius-10 border p-3 dashboard-chart-card h-100">
            <div className="card-body p-0 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h6 className="card-title fw-bold text-start mb-0">Projects per ISP</h6>
                  <small className="text-secondary">All ISPs overall</small>
                </div>
                <span className="dashboard-chart-badge">{Object.keys(ispData).length} ISPs</span>
              </div>
              <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '230px' }}>
                <Doughnut data={ispChartData} options={modernDoughnutOptions} />
              </div>
            </div>
          </div>
        </div>
        {Object.keys(ispPerData).map((isp) => {
          const remarks = ispPerData[isp];
          if (isp && remarks && (remarks.new || remarks.ongoing || remarks.completed)) {
            const ispTotal = (remarks.new || 0) + (remarks.ongoing || 0) + (remarks.completed || 0);
            return (
              <div className="col-lg-3 col-md-4 col-sm-6" key={isp}>
                <div className="card radius-10 border p-3 dashboard-chart-card h-100">
                  <div className="card-body p-0 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="card-title fw-bold text-start mb-0 text-truncate" title={isp}>{isp}</h6>
                      <span className="dashboard-chart-badge">{ispTotal}</span>
                    </div>
                    <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '230px' }}>
                      <Doughnut data={generateChartData(remarks)} options={modernDoughnutOptions} />
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            return null;
          }
        })}

        <div className="col-lg-3 col-md-4 col-sm-6">
          <div className="card radius-10 border p-3 dashboard-chart-card h-100">
            <div className="card-body p-0 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start flex-wrap mb-2">
                <div>
                  <h6 className="card-title fw-bold mb-0">Inland Biodiversity</h6>
                  <small className="text-secondary">Filtered ISP view</small>
                </div>
                <div className="dropdown" style={{ fontWeight: 'normal' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary border-0"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    data-bs-auto-close="outside"
                  >
                    <i className="fa-solid fa-filter"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-submenu p-2 dropdown-menu-lg-end" style={{ width: '19rem' }}>
                    <label className="pb-2 fw-semibold">Select Filters:</label>
                    {ispOptions.map((optionItem, index) => (
                      <div key={index} className="form-check">
                        <input
                          type="checkbox"
                          id={`filterCheckbox-${index}`}
                          value={optionItem}
                          checked={selectedFilters.includes(optionItem)}
                          onChange={(e) => handleFilterChange(e, optionItem)}
                          className="form-check-input me-2"
                        />
                        <label htmlFor={`filterCheckbox-${index}`} className="form-check-label me-4">
                          {optionItem}
                        </label>
                      </div>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '230px' }}>
                <Doughnut data={generateInlandChartData()} options={modernDoughnutOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-between align-items-center">
        <h6 className='pt-1 fw-bold'>Budget</h6>
        <div className="d-flex align-items-center">

        </div>
      </div>

      <div className='row pt-2 pb-4'>
        <div className=''>
          <div className='row g-3 pt-4'>
            <div className='col'>
              <div className='card radius-10 border'>
                <div className='card-body' style={{ padding: isMobile ? '15px' : '25px 20px 25px 35px' }}>
                  <div className='d-flex align-items-center'>
                    <div className='' style={{ backgroundColor: '#E0F2F1', borderRadius: '50px', padding: '10px' }}>
                      <i className='fa-solid fa-equals fs-5 p-1' style={{ color: '#009688' }}></i>
                    </div>
                    <div className='ps-4'>
                      <p className='mb-0 text-dark fs-5 fw-bold'>{calculateBudgetOverallTotal().toLocaleString()}</p>
                      <p className='text-secondary h6' style={{ fontSize: isMobile ? '13px' : '15px' }}>Overall Total Budget</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='col'>
          <div className="row g-3 pt-2 pt-4">
            <div className="col-12 col-xl-6">
              <div className="card radius-10 border p-3 dashboard-chart-card h-100">
                <div className="card-body p-0 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h6 className="card-title fw-bold text-start mb-0">Total Budget Trend per ISP</h6>
                      <small className="text-secondary">Smooth curve across ISP categories</small>
                    </div>
                    <span className="dashboard-chart-badge">Trend</span>
                  </div>
                  <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '260px' }}>
                    <Line data={lineChartData} options={modernLineOptions} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-6">
              <div className="card radius-10 border p-3 dashboard-chart-card h-100">
                <div className="card-body p-0 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h6 className="card-title fw-bold text-start mb-0">ISP Budget Allocation</h6>
                      <small className="text-secondary">Comparative budget by ISP</small>
                    </div>
                    <span className="dashboard-chart-badge">Bar</span>
                  </div>
                  <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '260px' }}>
                    <Bar data={ispBudgetBarData} options={modernCurrencyBarOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <h6 className='pt-1 fw-bold'>Budget Releases</h6>
        <div className="d-flex align-items-center">

        </div>
      </div>

      <div className='row pt-2 pb-4'>
        <div className='col-lg-4'>
          <div className='dashboard-projects-summary pt-4'>
            <div className='dashboard-summary-status-grid'>
              {budgetReleaseSummaryCards.map((card) => (
                <div key={card.id} className='card radius-10 border dashboard-summary-card dashboard-summary-status-card'>
                  <div className='card-body dashboard-summary-status-body'>
                    <div
                      className='dashboard-summary-icon dashboard-summary-icon--sm'
                      style={{ backgroundColor: card.iconBg }}
                    >
                      <i className={card.iconClass} style={{ color: card.iconColor }}></i>
                    </div>
                    <p className='dashboard-summary-value mb-1 text-dark fw-bold'>{card.value}</p>
                    <p className='dashboard-summary-label mb-0 text-secondary'>{card.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className='col'>
          <div className="row g-3 pt-2 pt-4">
            <div className="col-12 col-xl-6">
              <div className="card radius-10 border p-3 dashboard-chart-card h-100">
                <div className="card-body p-0 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h6 className="card-title fw-bold text-start mb-0">Budget by Project Status</h6>
                      <small className="text-secondary">New vs Ongoing vs Total Allocation</small>
                    </div>
                    <span className="dashboard-chart-badge">Status</span>
                  </div>
                  <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '260px' }}>
                    <Bar data={sumOfReleasesData1} options={modernCurrencyBarOptions} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-6">
              <div className="card radius-10 border p-3 dashboard-chart-card h-100">
                <div className="card-body p-0 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h6 className="card-title fw-bold text-start mb-0">Programmed vs Actual Releases</h6>
                      <small className="text-secondary">Programmed budget vs actual disbursement</small>
                    </div>
                    <span className="dashboard-chart-badge">Disbursement</span>
                  </div>
                  <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '260px' }}>
                    <Bar data={sumOfReleasesData2} options={modernCurrencyBarOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <h6 className='pt-1 fw-bold'>Implementing Agencies</h6>
        <div className="d-flex align-items-center">

        </div>
      </div>

      <div className='row g-3 pt-2 pb-4'>
        <div className="col-12 col-xl-6">
          <div className="card radius-10 border p-3 dashboard-chart-card h-100">
            <div className="card-body p-0 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h6 className="card-title fw-bold text-start mb-0">Implementing Agencies</h6>
                  <small className="text-secondary">Project counts across agencies</small>
                </div>
                <span className="dashboard-chart-badge">{agencyLabels.length} Agencies</span>
              </div>
              <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '300px' }}>
                <Bar data={barChartData} options={agencyOptions} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-6">
          <div className="card radius-10 border p-3 dashboard-chart-card h-100">
            <div className="card-body p-0 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h6 className="card-title fw-bold text-start mb-0">Projects per Region</h6>
                  <small className="text-secondary">Status distribution across regions</small>
                </div>
                <span className="dashboard-chart-badge">{regionLabels.length} Regions</span>
              </div>
              <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '300px' }}>
                <Bar data={regionData} options={modernStackedRegionOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='row g-3 pt-2 pb-4'>
        <div className="col-12 col-xl-6">
          <div className="card radius-10 border p-3 dashboard-chart-card h-100">
            <div className="card-body p-0 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h6 className="card-title fw-bold text-start mb-0">GIA Funding Per Region</h6>
                  <small className="text-secondary">Grants-in-aid budget distribution by region</small>
                </div>
                <span className="dashboard-chart-badge">Budget</span>
              </div>
              <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '300px' }}>
                <Bar data={regionDataWithBudget} options={modernStackedRegionBudgetOptions} />
              </div>
            </div>
          </div>
        </div>
        <div className='col-12 col-xl-6'>
          <div className='card radius-10 border p-3 dashboard-chart-card h-100'>
            <div className='card-body p-0 d-flex flex-column'>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h6 className='card-title fw-bold text-start mb-0'>Indirect Cost Summary Overview</h6>
                  <small className="text-secondary">Releases, obligations, and balances</small>
                </div>
                <span className="dashboard-chart-badge">Financial</span>
              </div>
              <div className='dashboard-chart flex-grow-1' style={{ width: '100%', minHeight: '300px' }}>
                <Doughnut data={indirectCostPieData} options={modernCurrencyDoughnutOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h6 className='pt-1 pb-4 fw-bold'>Projects per Regions</h6>
          {selectedRegionFilters.length > 0 && (
            <span className='badge rounded-pill bg-primary'>
              {selectedRegionFilters.length} selected
            </span>
          )}
        </div>
        <div className='d-flex align-items-center'>
          <div className='sample dropdown me-3 regionFilterTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
            <ReactTooltip anchorSelect='.regionFilterTooltip' style={{ borderRadius: '10px', fontSize: '12px' }}>
              Filter by region
            </ReactTooltip>
            <button id='regionFilterButton' type='button' className='btn border-0' data-bs-toggle='dropdown' aria-expanded='false' data-bs-auto-close='outside'>
              <i className='fa-solid fa-filter fs-5'></i>
            </button>
            <div className='dropdown-menu p-3' aria-labelledby='regionFilterButton' style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <button type='button' className='dropdown-item fw-bold' onClick={() => setSelectedRegionFilters([])}>
                All Regions
              </button>
              <div className='dropdown-divider' />
              {Object.keys(regionCoordinates).map(region => (
                <label key={region} className='dropdown-item d-flex align-items-center mb-1' style={{ cursor: 'pointer' }}>
                  <input
                    type='checkbox'
                    className='form-check-input me-2'
                    checked={selectedRegionFilters.includes(region)}
                    onChange={() => {
                      setSelectedRegionFilters(prev => {
                        if (prev.includes(region)) {
                          return prev.filter(item => item !== region);
                        }
                        return [...prev, region];
                      });
                    }}
                  />
                  <span>{region}</span>
                </label>
              ))}
            </div>
          </div>
          {selectedRegionFilters.length > 0 && (
            <button type='button' className='btn btn-outline-secondary btn-sm' onClick={() => setSelectedRegionFilters([])}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className='row pt-2 pb-4'>
        <div className='col-lg-4'>
          <div className='row row-cols-lg-2 g-3 pt-4'>
            <div className='col-lg-12'>
              <div className='card radius-10 border' style={{ maxHeight: '756px', overflowY: 'auto' }}>
                <div className='card-body'>
                  <table className='table'>
                    <thead>
                      <tr>
                        <th>Region</th>
                        <th>Total Projects</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(regionProjects).map(([region, totalProjects], index) => (
                        <tr key={index}>
                          <td>{region}</td>
                          <td>{totalProjects}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className='col'>
          <div className="row g-3 pt-2 pt-4">
            <div className="col">
              <div className="card radius-10 border" style={{ height: '80vh' }}> {/* Set card height */}
                <div className="card-body p-0" style={{ height: '100%' }}> {/* Ensure card-body fills the card */}
                  <div className="" style={{ height: '100%', width: '100%' }}> {/* Ensure full width and height */}
                    <div
                      ref={mapContainerRef}
                      style={{
                        height: '100%',
                        width: '100%',
                        borderRadius: '10px',
                        display: hasValidMapboxToken ? 'block' : 'grid',
                        placeItems: 'center',
                        padding: '2rem',
                        textAlign: 'center',
                      }}
                    >
                      {!hasValidMapboxToken && (
                        <p className="text-muted mb-0">
                          Add your real Mapbox public token to frontend/.env.local, then restart the frontend.
                        </p>
                      )}
                    </div> {/* Ensure map container fills the parent */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center">
        <h6 className='pt-1 fw-bold'>Proposals</h6>
        <div className="d-flex align-items-center">
          <div className='sample dropdown me-3 filterTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
            <ReactTooltip anchorSelect=".filterTooltip" style={{ borderRadius: '10px', fontSize: '12px' }}>
              Filter
            </ReactTooltip>
            <button type="button" className="btn border-0" data-bs-toggle="dropdown" aria-expanded="false" data-bs-auto-close="outside">
              <i className="fa-solid fa-filter fs-5"></i>
            </button>
            <ul className="dropdown-menu dropdown-submenu p-2 dropdown-menu-lg-end">
              <label className="pb-2">Year:</label>
              {validYearsProposal.map(year => (
                <div key={year} className="form-check">
                  <input
                    type="checkbox"
                    id={`yearCheckbox-${year}`}
                    value={year}
                    checked={selectedYearsProposal.includes(year)}
                    onChange={(e) => handleYearChangeProposal(e, year)}
                    className="form-check-input me-2"
                  />
                  <label htmlFor={`yearCheckbox-${year}`} className="form-check-label me-4">
                    {year}
                  </label>
                </div>
              ))}
              <div className="d-flex justify-content-end">
                <div className='resetTooltip me-auto'>
                  <Tooltip anchorSelect=".resetTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                    Reset
                  </Tooltip>
                  <button type="button" className="btn btn-outline rounded-circle py-1 px-2" onClick={clearFilterProposal}><i className="fa-solid fa-arrow-rotate-right"></i></button>
                </div>
                <div className='applyTooltip'>
                  <Tooltip anchorSelect=".applyTooltip" style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)' }}>
                    Apply
                  </Tooltip>
                  <button type="button" className="btn btn-outline rounded-circle py-1 px-2" onClick={applyYearFilterProposal}><i className="fa-solid fa-check text-success"></i></button>
                </div>
              </div>
            </ul>
          </div>
          <div className='sample me-3 refreshTooltip' style={{ borderRadius: '50px', padding: '7px 2px 2px 2px' }}>
            <ReactTooltip anchorSelect=".refreshTooltip" style={{ borderRadius: '10px', fontSize: '12px' }}>
              Refresh
            </ReactTooltip>
            <button type="button" className="btn border-0" onClick={refreshData} data-bs-toggle="tooltip" data-bs-title="Refresh">
              <i className="fa-solid fa-sync fs-5"></i>
            </button>
          </div>
        </div>
      </div>

      <div className='row pt-2 pb-4'>
        <div className='col-lg-4'>
          <div className='dashboard-projects-summary pt-4'>
            <div className='card radius-10 border dashboard-summary-card dashboard-summary-total-card'>
              <div className='card-body dashboard-summary-total-body'>
                <div
                  className='dashboard-summary-icon dashboard-summary-icon--sm'
                  style={{ backgroundColor: '#EEEEEE' }}
                >
                  <i className='fa-solid fa-equals' style={{ color: '#000' }}></i>
                </div>
                <div className='dashboard-summary-content'>
                  <p className='dashboard-summary-value dashboard-summary-value--total mb-0 text-dark fw-bold'>
                    {combinedTotal}
                  </p>
                  <p className='dashboard-summary-label mb-0 text-secondary'>Total Proposals</p>
                </div>
              </div>
            </div>

            <div className='dashboard-summary-status-grid'>
              {proposalCategorySummaryCards.map((card) => (
                <div key={card.id} className='card radius-10 border dashboard-summary-card dashboard-summary-status-card'>
                  <div className='card-body dashboard-summary-status-body'>
                    <div
                      className='dashboard-summary-icon dashboard-summary-icon--sm'
                      style={{ backgroundColor: card.iconBg }}
                    >
                      <i className={card.iconClass} style={{ color: card.iconColor }}></i>
                    </div>
                    <p className='dashboard-summary-value mb-1 text-dark fw-bold'>
                      {card.count} ({percentOf(card.count)}%)
                    </p>
                    <p className='dashboard-summary-label mb-0 text-secondary'>{card.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className='col'>
          <div className="row g-3 pt-2 pt-4">
            <div className="col-12 col-md-6">
              <div className="card radius-10 border p-3 dashboard-chart-card h-100">
                <div className="card-body p-0 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h6 className="card-title fw-bold text-start mb-0">Proposal Distribution</h6>
                      <small className="text-secondary">By category</small>
                    </div>
                    <span className="dashboard-chart-badge">{combinedTotal} Total</span>
                  </div>
                  <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '210px' }}>
                    <Doughnut data={pieChartDataProposals} options={modernDoughnutOptions} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="card radius-10 border p-3 dashboard-chart-card h-100">
                <div className="card-body p-0 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h6 className="card-title fw-bold text-start mb-0">Concept Proposal Status</h6>
                      <small className="text-secondary">Evaluation stages</small>
                    </div>
                    <span className="dashboard-chart-badge">{conceptCount}</span>
                  </div>
                  <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '210px' }}>
                    <Doughnut data={pieChartDataConceptStatus} options={modernDoughnutOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row g-3 pt-3">
            <div className="col-12 col-md-6">
              <div className="card radius-10 border p-3 dashboard-chart-card h-100">
                <div className="card-body p-0 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h6 className="card-title fw-bold text-start mb-0">Fullblown Proposal Status</h6>
                      <small className="text-secondary">Evaluation stages</small>
                    </div>
                    <span className="dashboard-chart-badge">{fullblownCount}</span>
                  </div>
                  <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '210px' }}>
                    <Doughnut data={pieChartDataFullblownStatus} options={modernDoughnutOptions} />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="card radius-10 border p-3 dashboard-chart-card h-100">
                <div className="card-body p-0 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <h6 className="card-title fw-bold text-start mb-0">IDD Proposal Status</h6>
                      <small className="text-secondary">Evaluation stages</small>
                    </div>
                    <span className="dashboard-chart-badge">{iddCount}</span>
                  </div>
                  <div className="dashboard-chart flex-grow-1" style={{ width: '100%', minHeight: '210px' }}>
                    <Doughnut data={pieChartDataIddStatus} options={modernDoughnutOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default Dashboard;
