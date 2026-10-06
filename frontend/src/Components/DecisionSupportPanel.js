import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Decision Support panel.
 *
 * Read-only presentation of the rule-based assessment returned by
 * GET DecisionSupport/summary. It reports evidence and a suggested action;
 * it never decides for DOST personnel and offers no approve/reject control.
 */

const API_BASE = 'http://localhost:8080';

const CLASS_META = {
  CRITICAL: { label: 'Critical', icon: '\u{1F534}', bg: '#FDE7E9', text: '#B42318', border: '#FDA29B' },
  AT_RISK: { label: 'At Risk', icon: '\u{1F7E0}', bg: '#FFF4E5', text: '#B54708', border: '#FEC84B' },
  NEEDS_ATTENTION: { label: 'Needs Attention', icon: '\u{1F7E1}', bg: '#FFFAEB', text: '#B54708', border: '#FEDF89' },
  INSUFFICIENT_DATA: { label: 'Insufficient Data', icon: '\u{26AA}', bg: '#F2F4F7', text: '#475467', border: '#D0D5DD' },
  ON_TRACK: { label: 'On Track', icon: '\u{1F7E2}', bg: '#ECFDF3', text: '#027A48', border: '#A6F4C5' },
};

const money = (value) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Compact badge for a classification, matching the summary cards. */
export function ClassificationBadge({ classification, size = 'sm' }) {
  const meta = CLASS_META[classification] || CLASS_META.INSUFFICIENT_DATA;
  const padding = size === 'sm' ? '0.2rem 0.5rem' : '0.3rem 0.7rem';
  const fontSize = size === 'sm' ? '0.72rem' : '0.8rem';

  return (
    <span
      className="d-inline-flex align-items-center gap-1 fw-semibold"
      style={{
        backgroundColor: meta.bg,
        color: meta.text,
        border: `1px solid ${meta.border}`,
        borderRadius: '9999px',
        padding,
        fontSize,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  );
}

export { CLASS_META };

const DecisionSupportPanel = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/DecisionSupport/summary`);
      setData(response.data);
    } catch (err) {
      setError(err?.message || 'Unable to load Decision Support analysis.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="card radius-10 border p-3 ds-panel">
        <div className="ds-loading">Running Decision Support checks…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card radius-10 border p-3 ds-panel">
        <div className="ds-loading text-danger">
          Decision Support unavailable: {error}
        </div>
      </div>
    );
  }

  const counts = data?.counts || {};
  const order = ['CRITICAL', 'AT_RISK', 'NEEDS_ATTENTION', 'INSUFFICIENT_DATA', 'ON_TRACK'];
  const projects = data?.projects || [];
  const initialRows = 5;
  const visible = showAll ? projects : projects.slice(0, initialRows);

  const summaryCards = order
    .filter((key) => (counts[key] || 0) > 0)
    .map((key) => ({ key, ...CLASS_META[key], count: counts[key] || 0 }));

  return (
    <div className="ds-panel">
      <div className="card radius-10 border p-3 mb-3 ds-summary-card">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div>
            <h6 className="card-title fw-bold mb-0">Decision Support Overview</h6>
            <small className="text-secondary">
              Rule-based indicators from recorded project data · evaluated {data?.evaluatedAt}
            </small>
          </div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={load}>
            <i className="fa-solid fa-sync me-1"></i>Re-run
          </button>
        </div>

        <div className="row g-2">
          {summaryCards.map((card) => (
            <div className="col-6 col-md-3 col-xl-auto flex-grow-1" key={card.key}>
              <div
                className="ds-stat d-flex align-items-center gap-2"
                style={{ backgroundColor: card.bg, borderColor: card.border }}
              >
                <span aria-hidden="true" className="ds-stat-icon">{card.icon}</span>
                <div>
                  <div className="ds-stat-value" style={{ color: card.text }}>{card.count}</div>
                  <div className="ds-stat-label" style={{ color: card.text }}>{card.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card radius-10 border p-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div>
            <h6 className="card-title fw-bold mb-0">Projects Requiring Attention</h6>
            <small className="text-secondary">
              Ordered by severity, then by how far the approved end date has passed.
            </small>
          </div>
          <span className="dashboard-chart-badge">{data?.attentionCount || 0} flagged</span>
        </div>

        {projects.length === 0 ? (
          <div className="ds-loading">
            No projects were flagged by the current rules.
          </div>
        ) : (
          <>
            <div className="ds-list">
              {visible.map((project) => (
                <DecisionSupportRow key={project.id} project={project} />
              ))}
            </div>

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2">
              <small className="text-secondary">
                Showing {visible.length} of {data?.attentionCount} flagged projects
                {data?.truncated ? ` (feed capped at ${data?.returned}; narrow with the year filter above)` : ''}
              </small>
              {projects.length > initialRows && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowAll((prev) => !prev)}
                >
                  {showAll ? 'Show fewer' : `Show all ${projects.length}`}
                </button>
              )}
            </div>
          </>
        )}

        <div className="ds-disclaimer mt-3">
          <i className="fa-solid fa-circle-info me-1"></i>
          {data?.disclaimer}
        </div>
      </div>
    </div>
  );
};

/**
 * One project. Shows the classification, the rule reasons with their
 * evidence, and the suggested action.
 */
export const DecisionSupportRow = ({ project }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = CLASS_META[project.classification] || CLASS_META.INSUFFICIENT_DATA;

  // A missing end date is already visible in the "Approved end date" field
  // above as "Not recorded", so repeating it here is redundant.
  const visibleGaps = (project.dataCompleteness?.gaps || []).filter(
    (gap) => !gap.startsWith('No end date on record')
  );

  return (
    <div className="ds-row" style={{ borderLeftColor: meta.border }}>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <ClassificationBadge classification={project.classification} />
            {project.projectCode ? (
              <span className="ds-code">{project.projectCode}</span>
            ) : null}
          </div>
          <div className="ds-title text-truncate" title={project.projectTitle}>
            {project.projectTitle || 'Untitled project'}
          </div>
          <div className="ds-subtitle text-truncate">
            {[project.ISP, project.implementingAgency].filter(Boolean).join(' · ') || 'No agency recorded'}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide details' : 'Why?'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="ds-detail mt-2">
          <div className="ds-detail-label">Reasons</div>
          <ul className="ds-reasons">
            {(project.reasons || []).map((reason, index) => (
              <li key={`${reason.code}-${index}`}>
                <span className="ds-reason-text">{reason.text}</span>
              </li>
            ))}
          </ul>

          {(project.recommendedActions || []).length > 0 && (
            <>
              <div className="ds-detail-label mt-2">Suggested action</div>
              <ul className="ds-actions">
                {project.recommendedActions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </>
          )}

          <EvidenceGrid evidence={project.evidence} />

          {visibleGaps.length > 0 && (
            <div className="ds-gaps mt-2">
              <strong>Record gaps:</strong> {visibleGaps.join('; ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EvidenceGrid = ({ evidence }) => {
  if (!evidence) return null;

  const items = [
    { label: 'Evaluated as of', value: evidence.asOf },
    { label: 'Status on record', value: evidence.status || '(empty)' },
    { label: 'Approved end date', value: evidence.operativeEndDate || 'Not recorded' },
    evidence.daysPastEndDate !== null && evidence.daysPastEndDate !== undefined
      ? {
        label: evidence.daysPastEndDate > 0 ? 'Days past end date' : 'Days to end date',
        value: Math.abs(evidence.daysPastEndDate),
      }
      : null,
    { label: 'End date source', value: evidence.operativeEndSource },
    evidence.extensionRecords > 0 ? { label: 'Extension records', value: evidence.extensionRecords } : null,
    {
      label: 'Programmed budget',
      value: evidence.totalProgrammedBudget > 0 ? money(evidence.totalProgrammedBudget) : 'Not recorded',
    },
    {
      label: 'Actual releases',
      value: evidence.releasesDataAvailable ? money(evidence.totalActualReleases) : 'No release data on file',
    },
  ].filter(Boolean);

  return (
    <>
      <div className="ds-detail-label mt-2">Supporting data</div>
      <div className="row g-2">
        {items.map((item) => (
          <div className="col-6 col-md-4" key={item.label}>
            <div className="ds-evidence">
              <div className="ds-evidence-label">{item.label}</div>
              <div className="ds-evidence-value">{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default DecisionSupportPanel;