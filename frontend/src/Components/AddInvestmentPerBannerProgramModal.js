import React, { useState } from 'react';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import './InvestmentPerBannerProgram.css';
import { saveImportedRows } from '../firestoreImports';

const AddInvestmentPerBannerProgramModal = ({ refresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        year: '',
        strategicBudget: '',
        resultsBudget: '',
        policyBudget: '',
        capacityBudget: '',
    });

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({
            year: '',
            strategicBudget: '',
            resultsBudget: '',
            policyBudget: '',
            capacityBudget: '',
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const directionsToImport = [
            {
                industrySituation: null,
                goals: null,
                bannerProgram: 'Strategic R&D',
                programProject: null,
                year: formData.year,
                budget: formData.strategicBudget,
                pillar: null,
                strategy: null,
            },
            {
                industrySituation: null,
                goals: null,
                bannerProgram: 'R&D Results utilization',
                programProject: null,
                year: formData.year,
                budget: formData.resultsBudget,
                pillar: null,
                strategy: null,
            },
            {
                industrySituation: null,
                goals: null,
                bannerProgram: 'Policy Research and Advocacy',
                programProject: null,
                year: formData.year,
                budget: formData.policyBudget,
                pillar: null,
                strategy: null,
            },
            {
                industrySituation: null,
                goals: null,
                bannerProgram: 'Capacity Building and R&D Governance',
                programProject: null,
                year: formData.year,
                budget: formData.capacityBudget,
                pillar: null,
                strategy: null,
            },
        ];

        try {
            await saveImportedRows('futureDirections', directionsToImport);
            handleCloseModal();
            refresh();
        } catch (error) {
            console.error('Error adding Investment per Banner Program record:', error);
            alert('Error adding record: ' + (error.response?.data?.messages?.error || error.message));
        }
    };

    return (
        <>
            <div className='me-3 addNewTooltip'>
                <Tooltip anchorSelect='.addNewTooltip' style={{ borderRadius: '10px', fontSize: '12px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2), 0 6px 20px rgba(0, 0, 0, 0.19)' }}>
                    Add Investment record
                </Tooltip>
                <button
                    type='button'
                    className='btn investment-icon-button'
                    onClick={handleOpenModal}
                    data-bs-toggle='tooltip'
                    data-bs-title='Add Investment record'
                >
                    <i className='fa-solid fa-plus fs-5'></i>
                </button>
            </div>

            <div className={`modal fade ${isModalOpen ? 'show' : ''}`}
                style={{ display: isModalOpen ? 'block' : 'none' }}
                tabIndex='-1'
                data-bs-backdrop='static'
                aria-labelledby='addInvestmentModalLabel'
                aria-hidden='true'
            >
                <div className='modal-dialog modal-lg modal-dialog-centered'>
                    <div className='modal-content'>
                        <div className='modal-header'>
                            <h5 className='modal-title' id='addInvestmentModalLabel'>Add Investment per Banner Program Record</h5>
                            <button
                                type='button'
                                className='btn-close'
                                onClick={handleCloseModal}
                                aria-label='Close'
                            ></button>
                        </div>
                        <div className='modal-body'>
                            <form onSubmit={handleSubmit}>
                                <div className='row g-3'>
                                    <div className='col-12 col-md-6'>
                                        <label htmlFor='year' className='form-label'>Year</label>
                                        <input
                                            type='number'
                                            className='form-control'
                                            id='year'
                                            name='year'
                                            value={formData.year}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className='col-12 col-md-6'>
                                        <label htmlFor='totalBudget' className='form-label'>Total Budget</label>
                                        <input
                                            type='text'
                                            className='form-control'
                                            id='totalBudget'
                                            value={
                                                [
                                                    formData.strategicBudget,
                                                    formData.resultsBudget,
                                                    formData.policyBudget,
                                                    formData.capacityBudget,
                                                ]
                                                    .map((value) => parseFloat(value.toString().replace(/,/g, '')) || 0)
                                                    .reduce((sum, value) => sum + value, 0)
                                                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            }
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className='row g-3 mt-3'>
                                    <div className='col-12 col-md-6'>
                                        <label htmlFor='strategicBudget' className='form-label'>Strategic R&D</label>
                                        <input
                                            type='text'
                                            className='form-control'
                                            id='strategicBudget'
                                            name='strategicBudget'
                                            value={formData.strategicBudget}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className='col-12 col-md-6'>
                                        <label htmlFor='resultsBudget' className='form-label'>R&D Results utilization</label>
                                        <input
                                            type='text'
                                            className='form-control'
                                            id='resultsBudget'
                                            name='resultsBudget'
                                            value={formData.resultsBudget}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className='row g-3 mt-3'>
                                    <div className='col-12 col-md-6'>
                                        <label htmlFor='policyBudget' className='form-label'>Policy Research and Advocacy</label>
                                        <input
                                            type='text'
                                            className='form-control'
                                            id='policyBudget'
                                            name='policyBudget'
                                            value={formData.policyBudget}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className='col-12 col-md-6'>
                                        <label htmlFor='capacityBudget' className='form-label'>Capacity Building and R&D Governance</label>
                                        <input
                                            type='text'
                                            className='form-control'
                                            id='capacityBudget'
                                            name='capacityBudget'
                                            value={formData.capacityBudget}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className='modal-footer border-0 mt-4'>
                                    <button
                                        type='button'
                                        className='btn btn-outline-secondary'
                                        onClick={handleCloseModal}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type='submit'
                                        className='btn btn-primary'
                                    >
                                        Add Record
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            {isModalOpen && <div className='modal-backdrop fade show'></div>}
        </>
    );
};

export default AddInvestmentPerBannerProgramModal;
