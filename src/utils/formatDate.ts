export const formatShortDateTime = (dateStr: string | Date): string => {
  if (!dateStr) return 'None';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'None';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
