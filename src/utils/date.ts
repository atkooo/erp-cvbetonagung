/**
 * Date utility functions — centralized date formatting helpers with timezone support.
 * Mendukung preferensi zona waktu: WIB (UTC+7), WITA (UTC+8), WIT (UTC+9), atau Otomatis (Browser).
 */

export interface TimezoneOption {
  id: string;
  label: string;
  abbr: string;
  offset: string;
  regions: string;
}

export const INDONESIAN_TIMEZONES: TimezoneOption[] = [
  {
    id: 'Asia/Jakarta',
    label: 'WIB (Waktu Indonesia Barat)',
    abbr: 'WIB',
    offset: 'UTC+7',
    regions: 'Jawa, Sumatera, Kalimantan Barat & Tengah',
  },
  {
    id: 'Asia/Makassar',
    label: 'WITA (Waktu Indonesia Tengah)',
    abbr: 'WITA',
    offset: 'UTC+8',
    regions: 'Bali, NTB, NTT, Sulawesi, Kalsel, Kaltim, Kaltara',
  },
  {
    id: 'Asia/Jayapura',
    label: 'WIT (Waktu Indonesia Timur)',
    abbr: 'WIT',
    offset: 'UTC+9',
    regions: 'Maluku, Maluku Utara, Papua',
  },
  {
    id: 'auto',
    label: 'Otomatis (Sesuai Lokasi Perangkat)',
    abbr: 'AUTO',
    offset: 'Deteksi Otomatis',
    regions: 'Mengikuti jam dan zona waktu browser pengguna',
  },
];

/**
 * Mengambil preferensi zona waktu tersimpan dari localStorage atau default ke WIB.
 */
export const getTimezonePreference = (): string => {
  const saved = localStorage.getItem('app_timezone');
  if (saved) return saved;

  // Fallback to company profile if available
  try {
    const compStored = localStorage.getItem('erp_company_profile');
    if (compStored) {
      const parsed = JSON.parse(compStored);
      if (parsed.timezone) return parsed.timezone;
    }
  } catch {}

  return 'Asia/Jakarta'; // Default WIB untuk CV Beton Agung
};

/**
 * Menyimpan preferensi zona waktu ke localStorage dan mengirimkan custom event.
 */
export const setTimezonePreference = (tz: string): void => {
  localStorage.setItem('app_timezone', tz);
  window.dispatchEvent(new CustomEvent('erp_timezone_changed', { detail: { timezone: tz } }));
};

/**
 * Mengembalikan IANA timezone string yang aktif digunakan (misal: 'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura').
 */
export const getResolvedTimezone = (): string => {
  const pref = getTimezonePreference();
  if (pref !== 'auto') {
    return pref;
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
  } catch {
    return 'Asia/Jakarta';
  }
};

/**
 * Mengembalikan singkatan zona waktu (WIB / WITA / WIT).
 */
export const getTimezoneAbbr = (date: Date = new Date(), customTimezone?: string): string => {
  const tz = customTimezone || getResolvedTimezone();

  if (tz === 'Asia/Jakarta' || tz === 'Asia/Pontianak') return 'WIB';
  if (tz === 'Asia/Makassar' || tz === 'Asia/Ujung_Pandang' || tz === 'Asia/Denpasar') return 'WITA';
  if (tz === 'Asia/Jayapura') return 'WIT';

  // Deteksi berdasarkan selisih menit offset terhadap UTC jika tz browser lain di Indonesia
  try {
    const invDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    const diffHours = Math.round((invDate.getTime() - date.getTime()) / (3600 * 1000));
    if (diffHours === 7) return 'WIB';
    if (diffHours === 8) return 'WITA';
    if (diffHours === 9) return 'WIT';
  } catch {}

  const offsetHours = Math.round(-date.getTimezoneOffset() / 60);
  if (offsetHours === 7) return 'WIB';
  if (offsetHours === 8) return 'WITA';
  if (offsetHours === 9) return 'WIT';

  return 'WIB';
};

/**
 * Helper untuk normalisasi string tanggal/waktu ke objek Date yang valid.
 */
function parseToDate(isoString: string | null | undefined): Date | null {
  if (!isoString || isoString === '-') return null;
  const trimmed = String(isoString).trim();
  if (!trimmed) return null;

  // Jika format YYYY-MM-DD saja, parse sebagai waktu lokal agar tanggal tidak bergeser
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // Jika datetime tanpa timezone suffix (e.g. "2026-10-07 07:00:00"), tambahkan 'Z' karena database backend menyimpannya dalam UTC
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const normalized = trimmed.replace(' ', 'T') + 'Z';
    const date = new Date(normalized);
    if (!isNaN(date.getTime())) return date;
  }

  const date = new Date(trimmed);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Format tanggal ke DD-MM-YYYY sesuai zona waktu yang aktif.
 * @example formatDate('2026-06-13T07:00:00Z') → '13-06-2026'
 */
export const formatDate = (isoString: string | null | undefined): string => {
  if (!isoString || isoString === '-') return '-';

  // Jika hanya string tanggal polos (YYYY-MM-DD), langsung format balik DD-MM-YYYY agar tidak terkena shift
  if (typeof isoString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(isoString.trim())) {
    const [y, m, d] = isoString.trim().split('-');
    return `${d}-${m}-${y}`;
  }

  const date = parseToDate(isoString);
  if (!date) return typeof isoString === 'string' ? isoString : '-';

  try {
    const tz = getResolvedTimezone();
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: tz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    // Format id-ID biasanya "DD/MM/YYYY" -> ubah ke "DD-MM-YYYY"
    return formatter.format(date).replace(/\//g, '-');
  } catch {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
};

/**
 * Format ISO datetime string ke format datetime DD-MM-YYYY HH:mm:ss [ZONA] (atau opsi tanpa zona).
 * @example formatDateTime('2026-10-07T07:04:45.000000Z') → '07-10-2026 14:04:45 WIB'
 */
export const formatDateTime = (
  isoString: string | null | undefined,
  showTzSuffix: boolean = true
): string => {
  if (!isoString || isoString === '-') return '-';
  const date = parseToDate(isoString);
  if (!date) return '-';

  try {
    const tz = getResolvedTimezone();
    const parts = new Intl.DateTimeFormat('id-ID', {
      timeZone: tz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    const day = get('day');
    const month = get('month');
    const year = get('year');
    const hour = get('hour');
    const minute = get('minute');
    const second = get('second');

    const formatted = `${day}-${month}-${year} ${hour}:${minute}:${second}`;
    if (!showTzSuffix) return formatted;

    const abbr = getTimezoneAbbr(date, tz);
    return `${formatted} ${abbr}`;
  } catch {
    return date.toLocaleString();
  }
};

/**
 * Format ISO datetime string ke format pendek DD-MM-YYYY HH:mm [ZONA].
 * @example formatDateTimeShort('2026-10-07T07:04:45Z') → '07-10-2026 14:04 WIB'
 */
export const formatDateTimeShort = (
  isoString: string | null | undefined,
  showTzSuffix: boolean = true
): string => {
  if (!isoString || isoString === '-') return '-';
  const date = parseToDate(isoString);
  if (!date) return '-';

  try {
    const tz = getResolvedTimezone();
    const parts = new Intl.DateTimeFormat('id-ID', {
      timeZone: tz,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    const day = get('day');
    const month = get('month');
    const year = get('year');
    const hour = get('hour');
    const minute = get('minute');

    const formatted = `${day}-${month}-${year} ${hour}:${minute}`;
    if (!showTzSuffix) return formatted;

    const abbr = getTimezoneAbbr(date, tz);
    return `${formatted} ${abbr}`;
  } catch {
    return date.toLocaleString();
  }
};

/**
 * Konversi Date object atau string ke format API date YYYY-MM-DD.
 */
export const toApiDate = (date: Date | string = new Date()): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

/**
 * Konversi Date object ke format API datetime YYYY-MM-DD HH:MM:SS.
 */
export const toApiDateTime = (date: Date = new Date()): string => {
  return date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '').substring(0, 19);
};
