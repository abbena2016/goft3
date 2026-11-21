import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyForInput, parseCurrency, formatAmountInput } from './currencyUtils';

describe('formatCurrency', () => {
    it('formats with two decimal places using de-DE (comma decimal)', () => {
        expect(formatCurrency(1234.5)).toBe('1.234,50');
        expect(formatCurrency(0)).toBe('0,00');
        expect(formatCurrency(0.001)).toBe('0,00'); // near-zero prevention
    });

    it('handles null/undefined', () => {
        expect(formatCurrency(null)).toBe('0,00');
        expect(formatCurrency(undefined)).toBe('0,00');
    });
});

describe('formatCurrencyForInput', () => {
    it('formats without grouping and without forced decimals', () => {
        expect(formatCurrencyForInput(1234.5)).toBe('1234,5');
        expect(formatCurrencyForInput(1000)).toBe('1000');
    });

    it('handles null/undefined as empty', () => {
        expect(formatCurrencyForInput(null)).toBe('');
        expect(formatCurrencyForInput(undefined)).toBe('');
    });
});

describe('parseCurrency', () => {
    it('parses strings with thousands separator and comma decimal', () => {
        expect(parseCurrency('1.234,50')).toBe(1234.5);
        expect(parseCurrency('1234,50')).toBe(1234.5);
        expect(parseCurrency('1000')).toBe(1000);
    });

    it('handles numbers directly', () => {
        expect(parseCurrency(42.5)).toBe(42.5);
    });

    it('returns 0 for invalid input', () => {
        expect(parseCurrency('')).toBe(0);
        expect(parseCurrency(null)).toBe(0);
        expect(parseCurrency(undefined)).toBe(0);
        expect(parseCurrency('abc')).toBe(0);
    });
});

describe('formatAmountInput', () => {
    it('replaces last dot with comma', () => {
        expect(formatAmountInput('1234.5')).toBe('1234,5');
    });

    it('leaves value unchanged if comma already present', () => {
        expect(formatAmountInput('1234,5')).toBe('1234,5');
    });

    it('does nothing for empty input', () => {
        expect(formatAmountInput('')).toBe('');
    });
});
