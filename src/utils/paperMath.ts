/**
 * Paper Wholesaler & Distributor Mathematical Helpers
 */

// Formats currency in INR format (e.g., ₹ 1,45,000.00)
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹ 0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount);
}

// Formats plain number with Indian comma grouping (e.g. 1,50,000)
export function formatNumber(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(val);
}

// Calculates standard 500-sheet ream weight in Kilograms
// Formula: (Length_inches * Width_inches * GSM) / 3100
export function calculateReamWeightKg(lengthInches: number, widthInches: number, gsm: number): number {
  if (!lengthInches || !widthInches || !gsm) return 0;
  const weight = (lengthInches * widthInches * gsm) / 3100;
  return Math.round(weight * 100) / 100; // Round to 2 decimals
}

// Parses paper size string like "23x36" or "25x36" or "20x30"
export function parseSizeInches(sizeStr?: string): { length: number; width: number } {
  if (!sizeStr || typeof sizeStr !== 'string') return { length: 0, width: 0 };
  const safeStr = sizeStr.toLowerCase();
  const parts = safeStr.split('x').map(p => parseFloat(p.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { length: parts[0], width: parts[1] };
  }
  // Standard A4 fallback
  if (safeStr.includes('a4')) {
    return { length: 8.27, width: 11.69 };
  }
  return { length: 0, width: 0 };
}

// GST Tax Calculation Helper
export function calculateGst(taxableAmount: number, gstRatePct: number): {
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
} {
  const totalGst = Math.round((taxableAmount * (gstRatePct / 100)) * 100) / 100;
  const half = Math.round((totalGst / 2) * 100) / 100;
  return {
    cgstAmount: half,
    sgstAmount: half,
    igstAmount: totalGst,
    totalGst
  };
}

// Round financial value to 2 decimal places safely
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

// Converts Indian Rupee number into English Words
export function numberToWords(num: number): string {
  if (isNaN(num) || num === null || num === undefined || num === 0) return 'Zero Rupees Only';
  
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  const rounded = Math.round(num);
  const words = inWords(rounded).trim();
  return words ? words + ' Rupees Only' : 'Zero Rupees Only';
}

