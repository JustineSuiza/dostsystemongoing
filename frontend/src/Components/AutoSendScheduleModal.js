import React, { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { WEEKDAY_LABELS, sendProjectsExcel } from '../autoSendScheduler';
import './Modal.css'

const AutoSendScheduleModal = ({ isModalOpen, closeModal, user, refresh }) => {

    const [frequency, setFrequency] = useState('daily');
    const [day, setDay] = useState(String(new Date().getDay()));
    const [time, setTime] = useState('08:00');
    const [saveError, setSaveError] = useState('');
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);

    useEffect(() => {
        if (user && isModalOpen) {
            const schedule = user.auto_send_schedule || {};
            setFrequency(schedule.frequency || 'daily');
            setDay(schedule.day !== undefined && schedule.day !== null
                ? String(schedule.day)
                : (schedule.frequency === 'monthly' ? '1' : String(new Date().getDay())));
            setTime(schedule.time || '08:00');
            setSaveError('');
            setSaving(false);
            setSending(false);
            setSendResult(null);
        }
    }, [user, isModalOpen]);

    const dayOptions = frequency === 'weekly'
        ? WEEKDAY_LABELS.map((label, index) => ({ value: String(index), label }))
        : Array.from({ length: 31 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }));

    const sendNow = async () => {
        if (!user?.email || sending) return;

        setSending(true);
        setSendResult(null);
        try {
            await sendProjectsExcel(user.email, { firstName: user.first_name, context: 'manual' });
            setSendResult({ type: 'success', message: `Projects Excel sent to ${user.email}.` });
        } catch (error) {
            console.error('Instant send failed:', error);
            setSendResult({ type: 'error', message: 'Unable to send the email. Make sure the backend (spark serve) is running.' });
        } finally {
            setSending(false);
        }
    };

    const saveSchedule = async (e) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setSaveError('');
        try {
            await updateDoc(doc(db, 'users', user.id), {
                auto_send_schedule: {
                    ...(user.auto_send_schedule || {}),
                    frequency,
                    day: frequency === 'daily' ? null : Number(day),
                    time,
                },
            });
            closeModal();
            refresh();
        } catch (error) {
            console.error('Error saving send schedule:', error);
            setSaveError('Unable to save the schedule. Please try again.');
            setSaving(false);
        }
    };

    return (
        <div>
            <form onSubmit={saveSchedule}>
                <div className={`modal fade modal-overlay ${isModalOpen ? 'show' : ''}`} tabIndex="-1" style={{ display: isModalOpen ? 'block' : 'none' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content p-2">
                            <div className="modal-header border-0">
                                <h1 className="modal-title fw-semibold" style={{ fontSize: '18px' }}>Schedule Sending</h1>
                                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button>
                            </div>
                            <div className="modal-body">
                                {saveError && <div className="alert alert-danger" role="alert">{saveError}</div>}
                                {sendResult && (
                                    <div className={`alert alert-${sendResult.type === 'success' ? 'success' : 'danger'}`} role="alert">
                                        {sendResult.message}
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="form-label">Send to</label>
                                    <input type="email" className="form-control" value={user?.email || ''} readOnly />
                                    <div className="form-text">The Excel file is sent to this account's email address.</div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Send every</label>
                                    <select
                                        className="form-select"
                                        value={frequency}
                                        onChange={(e) => {
                                            const nextFrequency = e.target.value;
                                            setFrequency(nextFrequency);
                                            if (nextFrequency === 'monthly' && Number(day) > 31) setDay('1');
                                        }}
                                    >
                                        <option value="daily">Day</option>
                                        <option value="weekly">Week</option>
                                        <option value="monthly">Month</option>
                                    </select>
                                </div>
                                {frequency !== 'daily' && (
                                    <div className="mb-3">
                                        <label className="form-label">{frequency === 'weekly' ? 'Day of week' : 'Day of month'}</label>
                                        <select className="form-select" value={day} onChange={(e) => setDay(e.target.value)}>
                                            {dayOptions.map((option) => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <label className="form-label">Time</label>
                                    <input type="time" className="form-control" value={time} onChange={(e) => setTime(e.target.value)} required />
                                </div>
                                <div className="alert alert-secondary mb-0" style={{ fontSize: '13px' }}>
                                    Projects Excel will be emailed to <strong>{user?.email || 'this account'}</strong> automatically.
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button type="button" className="btn btn-outline px-3 py-2 border text-black" onClick={closeModal} style={{ fontSize: '14px' }}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-outline px-3 py-2 border"
                                    style={{ fontSize: '14px' }}
                                    onClick={sendNow}
                                    disabled={sending || !user?.email}
                                >
                                    <i className={`bi ${sending ? 'bi-hourglass-split' : 'bi-send'} me-1`}></i>
                                    {sending ? 'Sending...' : 'Send Now'}
                                </button>
                                <button className="btn btn-dark px-3 py-2 border" style={{ fontSize: '14px' }} disabled={saving}>{saving ? 'Saving...' : 'Save Schedule'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default AutoSendScheduleModal;
