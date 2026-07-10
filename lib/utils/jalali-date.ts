import { formatFaDigits, normalizeDigits } from "@/lib/utils/number-format";

const G_DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const J_DAYS_IN_MONTH = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

export function isoToJalaliDisplay(value?: string | null): string {
  if (!value) return "";
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  const [jy, jm, jd] = gregorianToJalali(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
  return formatFaDigits(
    `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`,
  );
}

export function jalaliDisplayToIso(value: string): string | null {
  const normalized = normalizeDigits(value).replace(/-/g, "/").trim();
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;
  const jy = Number(match[1]);
  const jm = Number(match[2]);
  const jd = Number(match[3]);
  if (!isValidJalaliDate(jy, jm, jd)) return null;
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

export function jalaliPartsFromIso(value?: string | null): [number, number, number] | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return gregorianToJalali(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

export function todayJalaliParts(): [number, number, number] {
  const today = new Date();
  return gregorianToJalali(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  );
}

export function getJalaliMonthLength(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

export function isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
  if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return false;
  if (jm < 1 || jm > 12) return false;
  return jd >= 1 && jd <= getJalaliMonthLength(jy, jm);
}

function isJalaliLeapYear(jy: number): boolean {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ];
  let jp = breaks[0];
  let jump = 0;
  for (let i = 1; i < breaks.length; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }
  let n = jy - jp;
  if (jump - n < 6) n = n - jump + Math.floor((jump + 4) / 33) * 33;
  return ((((n + 1) % 33) - 1) % 4) === 0;
}

function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const gy2 = gy - 1600;
  const gm2 = gm - 1;
  const gd2 = gd - 1;
  let gDayNo =
    365 * gy2 +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400);
  for (let i = 0; i < gm2; ++i) gDayNo += G_DAYS_IN_MONTH[i];
  if (gm2 > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) gDayNo += 1;
  gDayNo += gd2;
  let jDayNo = gDayNo - 79;
  const jNp = Math.floor(jDayNo / 12053);
  jDayNo %= 12053;
  let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo %= 1461;
  if (jDayNo >= 366) {
    jy += Math.floor((jDayNo - 1) / 365);
    jDayNo = (jDayNo - 1) % 365;
  }
  let jm = 0;
  for (; jm < 11 && jDayNo >= J_DAYS_IN_MONTH[jm]; ++jm) {
    jDayNo -= J_DAYS_IN_MONTH[jm];
  }
  return [jy, jm + 1, jDayNo + 1];
}

function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  const jy2 = jy - 979;
  const jm2 = jm - 1;
  const jd2 = jd - 1;
  let jDayNo = 365 * jy2 + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4);
  for (let i = 0; i < jm2; ++i) jDayNo += J_DAYS_IN_MONTH[i];
  jDayNo += jd2;
  let gDayNo = jDayNo + 79;
  let gy = 1600 + 400 * Math.floor(gDayNo / 146097);
  gDayNo %= 146097;
  let leap = true;
  if (gDayNo >= 36525) {
    gDayNo -= 1;
    gy += 100 * Math.floor(gDayNo / 36524);
    gDayNo %= 36524;
    if (gDayNo >= 365) gDayNo += 1;
    else leap = false;
  }
  gy += 4 * Math.floor(gDayNo / 1461);
  gDayNo %= 1461;
  if (gDayNo >= 366) {
    leap = false;
    gDayNo -= 1;
    gy += Math.floor(gDayNo / 365);
    gDayNo %= 365;
  }
  let gm = 0;
  for (
    ;
    gm < 11 &&
    gDayNo >= G_DAYS_IN_MONTH[gm] + (gm === 1 && leap ? 1 : 0);
    gm++
  ) {
    gDayNo -= G_DAYS_IN_MONTH[gm] + (gm === 1 && leap ? 1 : 0);
  }
  return [gy, gm + 1, gDayNo + 1];
}
