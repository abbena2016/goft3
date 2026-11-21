export const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '0,00';
    let cleanAmount = amount;
    // Prevent -0 and float precision issues close to 0 from formatting as -0,00
    if (Math.abs(amount) < 0.005) {
        cleanAmount = 0;
    }
    return new Intl.NumberFormat('de-DE', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(cleanAmount);
};

// Used when user focuses input to edit (removes grouping dots for easier editing)
export const formatCurrencyForInput = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '';
    let cleanAmount = amount;
    if (Math.abs(amount) < 0.005) {
        cleanAmount = 0;
    }
    return new Intl.NumberFormat('de-DE', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        useGrouping: false
    }).format(cleanAmount);
};

export const parseCurrency = (input: string | number | null | undefined): number => {
    if (!input) return 0;
    if (typeof input === 'number') return input;

    let cleaned = input.toString();

    // Remove thousands separator (.)
    cleaned = cleaned.replace(/\./g, '');

    // Replace decimal separator (,) with (.) for JS float parsing
    cleaned = cleaned.replace(/,/g, '.');

    // Remove any other non-numeric characters except . and -
    cleaned = cleaned.replace(/[^0-9.-]/g, '');

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
};

export const formatAmountInput = (value: string): string => {
    if (!value) return value;
    // Special handling for decimal insertion using the dot key on a numeric keypad.
    // Replace the last dot with a comma, if there's no comma present yet.
    if (!value.includes(',')) {
        const lastDotIndex = value.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            return value.substring(0, lastDotIndex) + ',' + value.substring(lastDotIndex + 1);
        }
    }
    return value;
};