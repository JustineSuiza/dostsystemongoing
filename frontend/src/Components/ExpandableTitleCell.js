import React, { useState } from 'react';

export const getProjectDurationText = (project) => {
  if (!project.originalStart || !project.originalEnd) return '';

  const startDate = new Date(project.changeStart || project.originalStart);
  const endDate = new Date(project.changeImplementationDate || project.originalEnd);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return '';

  const formatDate = (date) => date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
  });
  let duration = `${formatDate(startDate)} - ${formatDate(endDate)}`;
  const extension = project.secondExtension || project.firstExtension;

  if (extension) {
    const [extensionStart, extensionEnd] = extension.split(' - ');
    const extensionStartDate = new Date(extensionStart);
    const extensionEndDate = new Date(extensionEnd);
    if (!Number.isNaN(extensionStartDate.getTime()) && !Number.isNaN(extensionEndDate.getTime())) {
      const extensionLabel = `${formatDate(extensionStartDate)} - ${formatDate(extensionEndDate)}`;
      duration += ` (${project.secondExtension ? 'Second' : 'First'} Extension: ${extensionLabel})`;
    }
  }

  return duration;
};

const ExpandableTitleCell = ({ title }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <span
      title={title}
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        display: isExpanded ? 'block' : '-webkit-box',
        width: '100%',
        overflow: 'hidden',
        textOverflow: isExpanded ? 'clip' : 'ellipsis',
        whiteSpace: isExpanded ? 'normal' : undefined,
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: isExpanded ? 'unset' : 3,
        overflowWrap: 'anywhere',
        cursor: 'pointer',
      }}
    >
      {title}
    </span>
  );
};

export default ExpandableTitleCell;
