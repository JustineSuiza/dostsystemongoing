import React, { useState, useEffect } from 'react';
import { Tooltip } from 'react-tooltip';
import { updateImportedRow } from '../firestoreImports';

const EditFutureSandTDirectionModal = ({ direction, refresh, onClose }) => {
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [formData, setFormData] = useState({
        id: '',
        industrySituation: '',
        goals: '',
        bannerProgram: '',
        programProject: '',
        year: '',
        budget: '',
        pillar: '',
        strategy: '',
    });

    useEffect(() => {
        if (direction) {
            setFormData(direction);
        }
    }, [direction]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        onClose();
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
        try {
            await updateImportedRow('futureDirections', formData.id, formData);
            alert('Future S&T Direction updated successfully!');
            handleCloseModal();
            refresh();
        } catch (error) {
            console.error('Error updating direction:', error);
            alert('Error updating direction: ' + (error.response?.data?.messages?.error || error.message));
        }
    };

    return (
        <>
            <div className={`modal fade ${isModalOpen ? 'show' : ''}`} 
                 style={{ display: isModalOpen ? 'block' : 'none' }} 
                 tabIndex="-1" 
                 data-bs-backdrop="static" 
                 aria-labelledby="editModalLabel" 
                 aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id="editModalLabel">Edit Future S&T Direction</h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={handleCloseModal}
                                aria-label="Close"
                            ></button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="industrySituation" className="form-label">Industry Situation (Baseline)</label>
                                    <textarea
                                        className="form-control"
                                        id="industrySituation"
                                        name="industrySituation"
                                        value={formData.industrySituation}
                                        onChange={handleInputChange}
                                        rows="2"
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="goals" className="form-label">Goals</label>
                                    <textarea
                                        className="form-control"
                                        id="goals"
                                        name="goals"
                                        value={formData.goals}
                                        onChange={handleInputChange}
                                        rows="2"
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="bannerProgram" className="form-label">Banner Program</label>
                                    <select
                                        className="form-control"
                                        id="bannerProgram"
                                        name="bannerProgram"
                                        value={formData.bannerProgram}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">-- Select Banner Program --</option>
                                        <option value="Strategic R&D">Strategic R&D</option>
                                        <option value="R&D Results utilization">R&D Results utilization</option>
                                        <option value="Policy Research and Advocacy">Policy Research and Advocacy</option>
                                        <option value="Capacity Building and R&D Governance">Capacity Building and R&D Governance</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="programProject" className="form-label">Program/Project</label>
                                    <textarea
                                        className="form-control"
                                        id="programProject"
                                        name="programProject"
                                        value={formData.programProject}
                                        onChange={handleInputChange}
                                        rows="2"
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="year" className="form-label">Year</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="year"
                                        name="year"
                                        value={formData.year}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="budget" className="form-label">Budget</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="budget"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="pillar" className="form-label">Pillar</label>
                                    <select
                                        className="form-control"
                                        id="pillar"
                                        name="pillar"
                                        value={formData.pillar}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">-- Select Pillar --</option>
                                        <option value="Human & Well Being">Human & Well Being</option>
                                        <option value="Health Creation">Health Creation</option>
                                        <option value="Health Protection">Health Protection</option>
                                        <option value="Sustainability">Sustainability</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="strategy" className="form-label">Strategy</label>
                                    <select
                                        className="form-control"
                                        id="strategy"
                                        name="strategy"
                                        value={formData.strategy}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">-- Select Strategy --</option>
                                        <option value="Achieve Quality">Achieve Quality</option>
                                        <option value="Food Security">Food Security</option>
                                        <option value="Health and Nutrition Improve">Health and Nutrition Improve</option>
                                        <option value="Access to Clean Water">Access to Clean Water</option>
                                        <option value="Advance Research and Development">Advance Research and Development</option>
                                        <option value="Scale-up technology adaption">Scale-up technology adaption</option>
                                        <option value="Strengthen provision of Science, Technologuy and Innovation support">Strengthen provision of Science, Technologuy and Innovation support</option>
                                        <option value="Boost Intellectual Property">Boost Intellectual Property</option>
                                        <option value="Advance Disaster Risk Reduction Management">Advance Disaster Risk Reduction Management</option>
                                        <option value="Monitoring and Warning Systems">Monitoring and Warning Systems</option>
                                        <option value="Strengthen Capabilities for Local Disaster Risk Reduction Management">Strengthen Capabilities for Local Disaster Risk Reduction Management</option>
                                        <option value="Enhance Climate and Disaster Risk Reduction">Enhance Climate and Disaster Risk Reduction</option>
                                        <option value="Intersify environmental sustain">Intersify environmental sustain</option>
                                        <option value="Enhance ecosystem resilience">Enhance ecosystem resilience</option>
                                        <option value="Establish smart and sustain community">Establish smart and sustain community</option>
                                        <option value="Improve access clean and green">Improve access clean and green</option>
                                        <option value="Institutionize science community">Institutionize science community</option>
                                        <option value="Build robust institutional capacity">Build robust institutional capacity</option>
                                        <option value="Rollout S & T enabled system">Rollout S & T enabled system</option>
                                        <option value="Enhance lintages for Science and Technology Information Institute">Enhance lintages for Science and Technology Information Institute</option>
                                    </select>
                                </div>
                                <div className="modal-footer border-0">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary"
                                        onClick={handleCloseModal}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                    >
                                        Update Direction
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditFutureSandTDirectionModal;
