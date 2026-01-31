// src/utils/date.js

export const formatDateISO = (date) => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const getRelativeDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatDateISO(date);
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Returns nice label for headers (e.g., "Today, 12 Oct")
export const getReadableDate = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};