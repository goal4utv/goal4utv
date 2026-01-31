// src/components/DateFilter.jsx
import React from 'react';
import { getRelativeDate } from '../utils/date';

const DateFilter = ({ selectedDate, onSelectDate }) => {
  const dates = [
    { label: 'Yesterday', value: getRelativeDate(-1), className: 'btn-yesterday' },
    { label: 'Today', value: getRelativeDate(0), className: 'btn-today' },
    { label: 'Tomorrow', value: getRelativeDate(1), className: 'btn-tomorrow' },
  ];

  return (
    <div className="date-filter">
      {dates.map((d) => (
        <button
          key={d.value}
          className={`filter-btn ${d.className} ${selectedDate === d.value ? 'active' : ''}`}
          onClick={() => onSelectDate(d.value)}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
};

export default DateFilter;