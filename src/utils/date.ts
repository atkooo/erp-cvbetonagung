/**
 * Date utility functions — centralized date formatting helpers.
 * Semua manipulasi tanggal/waktu dari ISO string harus menggunakan fungsi ini,
 * bukan melakukan string manipulation manual di tiap file.
 */

/**
 * Format ISO datetime string ke format tanggal DD-MM-YYYY.
 * @example formatDate('2026-06-13T07:00:00Z') → '13-06-2026'
 */
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

/**
 * Format ISO datetime string ke format datetime YYYY-MM-DD HH:MM:SS (19 chars).
 * Digunakan untuk menggantikan pola: dto.created_at.replace('T', ' ').replace('.000000Z', '').substring(0, 19)
 * @example formatDateTime('2026-06-13T07:04:45.000000Z') → '2026-06-13 07:04:45'
 */
export const formatDateTime = (isoString: string | null | undefined): string => {
  if (!isoString || isoString === '-') return '-';
  try {
    // Handle both 'Z' UTC and offset formats
    const normalized = isoString.replace('T', ' ').replace(/\.\d+Z?$/, '').substring(0, 19);
    return normalized || '-';
  } catch {
    return '-';
  }
};

/**
 * Format ISO datetime string ke format pendek YYYY-MM-DD HH:MM (16 chars).
 * Digunakan untuk menggantikan pola: dto.schedule_at.replace('T', ' ').replace('.000000Z', '').substring(0, 16)
 * @example formatDateTimeShort('2026-06-13T07:04:45Z') → '2026-06-13 07:04'
 */
export const formatDateTimeShort = (isoString: string | null | undefined): string => {
  const full = formatDateTime(isoString);
  return full === '-' ? '-' : full.substring(0, 16);
};

/**
 * Konversi Date object atau string ke format API date YYYY-MM-DD.
 * Digunakan untuk menggantikan pola: new Date().toISOString().split('T')[0]
 * @example toApiDate(new Date()) → '2026-06-13'
 */
export const toApiDate = (date: Date | string = new Date()): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

/**
 * Konversi Date object ke format API datetime YYYY-MM-DD HH:MM:SS.
 * Digunakan untuk menggantikan pola: new Date().toISOString().replace('T', ' ').substring(0, 19)
 * @example toApiDateTime(new Date()) → '2026-06-13 07:04:45'
 */
export const toApiDateTime = (date: Date = new Date()): string => {
  return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '').substring(0, 19);
};
