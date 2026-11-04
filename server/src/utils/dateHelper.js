// Get date formatted as YYYY-MM-DD for timezone or local server time
export const getTodayDateString = (offsetHours = 5.5) => {
  // Support IST (UTC+5.5) or local system time
  const now = new Date();
  // We can calculate YYYY-MM-DD in local time
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (date = new Date()) => {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
