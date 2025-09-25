// Utilidades de fecha/hora para Perú (America/Lima)
export const PE_TZ = 'America/Lima';

export function formatDateTimePE(d: Date, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: PE_TZ,
    ...opts,
  }).format(d);
}

export function formatDatePE(d: Date, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: PE_TZ,
    ...opts,
  }).format(d);
}

export function sameDayPE(a: Date, b: Date) {
  const aa = toStartOfDayPE(a);
  const bb = toStartOfDayPE(b);
  return aa.getTime() === bb.getTime();
}

export function toStartOfDayPE(d: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PE_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d);
  const y = Number(parts.find(p => p.type === 'year')?.value);
  const m = Number(parts.find(p => p.type === 'month')?.value) - 1;
  const day = Number(parts.find(p => p.type === 'day')?.value);
  return new Date(y, m, day, 0, 0, 0, 0);
}

export function daysAgoPE(n: number) {
  const d = toStartOfDayPE(new Date());
  d.setDate(d.getDate() - n);
  return d;
}