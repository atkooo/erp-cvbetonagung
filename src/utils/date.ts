export const formatDate = (isoString: string | null | undefined): string => {
  if (!isoString || isoString === '-') return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return isoString;
  }
};
