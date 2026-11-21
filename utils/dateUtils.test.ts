import { describe, it, expect } from 'vitest';
import { normalizeDate, parseDate, compareDates, formatDate, getEffectiveDurationDays, isFinancialDuration, calculateElapsedDays, formatDurationArabic } from './dateUtils';

describe('normalizeDate', () => {
    it('returns empty string for null/undefined/empty input', () => {
        expect(normalizeDate(null)).toBe('');
        expect(normalizeDate(undefined)).toBe('');
        expect(normalizeDate('')).toBe('');
    });

    it('converts YYYY-MM-DD to DD/MM/YYYY', () => {
        expect(normalizeDate('2024-05-09')).toBe('09/05/2024');
    });

    it('converts DD-MM-YYYY to DD/MM/YYYY', () => {
        expect(normalizeDate('09-05-2024')).toBe('09/05/2024');
    });

    it('pads single-digit day/month in DD/MM/YYYY', () => {
        expect(normalizeDate('9/5/2024')).toBe('09/05/2024');
    });

    it('converts Excel serial number', () => {
        // 45234 serial corresponds to a 2023-11 date; just assert format shape
        const result = normalizeDate('45234');
        expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('returns input unchanged if unrecognized', () => {
        expect(normalizeDate('not-a-date')).toBe('not-a-date');
    });
});

describe('parseDate', () => {
    it('returns Date object for valid DD/MM/YYYY', () => {
        const d = parseDate('09/05/2024');
        expect(d).not.toBeNull();
        expect(d!.getFullYear()).toBe(2024);
        expect(d!.getMonth()).toBe(4); // May is 0-indexed
        expect(d!.getDate()).toBe(9);
    });

    it('returns null for invalid input', () => {
        expect(parseDate('')).toBeNull();
        expect(parseDate('invalid')).toBeNull();
    });
});

describe('compareDates', () => {
    it('orders dates chronologically', () => {
        expect(compareDates('01/01/2024', '02/01/2024')).toBeLessThan(0);
        expect(compareDates('02/01/2024', '01/01/2024')).toBeGreaterThan(0);
        expect(compareDates('01/01/2024', '01/01/2024')).toBe(0);
    });
});

describe('formatDate', () => {
    it('formats a Date object to DD/MM/YYYY', () => {
        const d = new Date(2024, 4, 9);
        expect(formatDate(d)).toBe('09/05/2024');
    });

    it('formats a string via normalizeDate', () => {
        expect(formatDate('2024-05-09')).toBe('09/05/2024');
    });

    it('returns empty string for invalid', () => {
        expect(formatDate(null)).toBe('');
    });
});

describe('duration helpers', () => {
    it('detects financial (month-based) durations', () => {
        expect(isFinancialDuration('3m')).toBe(true);
        expect(isFinancialDuration('3 شهر')).toBe(true);
        expect(isFinancialDuration('3mois')).toBe(true);
        expect(isFinancialDuration('45')).toBe(false);
    });

    it('calculates effective days (30 days per month)', () => {
        expect(getEffectiveDurationDays('3m')).toBe(90);
        expect(getEffectiveDurationDays('3 شهر')).toBe(90);
        expect(getEffectiveDurationDays('45')).toBe(45);
        expect(getEffectiveDurationDays('')).toBe(0);
    });

    it('calculates elapsed days with calendar and financial rule', () => {
        const start = new Date(2024, 0, 1);
        const end = new Date(2024, 0, 11);
        expect(calculateElapsedDays(start, end, false)).toBe(10);
        expect(calculateElapsedDays(start, end, true)).toBe(10);
    });

    it('formats durations in Arabic', () => {
        expect(formatDurationArabic('1m')).toBe('شهر واحد');
        expect(formatDurationArabic('2m')).toBe('شهران');
        expect(formatDurationArabic('5m')).toBe('5 أشهر');
        expect(formatDurationArabic('1')).toBe('يوم واحد');
        expect(formatDurationArabic('5')).toBe('5 أيام');
    });
});
