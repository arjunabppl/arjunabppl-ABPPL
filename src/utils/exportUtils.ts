import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ColumnDefinition {
  header: string;
  dataKey: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: any) => string | number;
  width?: number; // for Excel column widths
}

export interface SummaryStat {
  label: string;
  value: string | number;
}

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  dateRange?: { start: string; end: string };
  generatedBy?: string;
  fileName: string;
  summaryStats?: SummaryStat[];
  columns: ColumnDefinition[];
  data: any[];
  footers?: (string | number)[][];
  orientation?: 'portrait' | 'landscape';
}

export interface ExcelExportOptions {
  fileName: string;
  sheetName: string;
  title: string;
  subtitle?: string;
  dateRange?: { start: string; end: string };
  summaryStats?: SummaryStat[];
  columns: ColumnDefinition[];
  data: any[];
  totalsRow?: Record<string, string | number>;
}

export interface MultiSheetExcelOptions {
  fileName: string;
  sheets: {
    sheetName: string;
    title: string;
    columns: ColumnDefinition[];
    data: any[];
    totalsRow?: Record<string, string | number>;
  }[];
}

// ----------------------------------------------------------------------
// EXCEL EXPORT (Single Sheet)
// ----------------------------------------------------------------------
export function exportToExcel(options: ExcelExportOptions): void {
  const {
    fileName,
    sheetName = 'Report',
    title,
    subtitle,
    dateRange,
    summaryStats,
    columns,
    data,
    totalsRow
  } = options;

  const rows: any[][] = [];

  // Header Title block
  rows.push(['AMRITESHWAR BALAJI PAPER PVT. LTD. - ERP SYSTEM']);
  rows.push([title.toUpperCase()]);
  if (subtitle) {
    rows.push([subtitle]);
  }
  if (dateRange) {
    rows.push([`Period: ${dateRange.start} to ${dateRange.end} | Generated on: ${new Date().toLocaleString()}`]);
  } else {
    rows.push([`Generated on: ${new Date().toLocaleString()}`]);
  }
  rows.push([]); // blank row

  // Summary stats if any
  if (summaryStats && summaryStats.length > 0) {
    rows.push(['SUMMARY KEY INDICATORS:']);
    summaryStats.forEach(stat => {
      rows.push([stat.label, stat.value]);
    });
    rows.push([]); // blank row
  }

  // Column Headers
  const headerRow = columns.map(c => c.header);
  rows.push(headerRow);

  // Data rows
  data.forEach(row => {
    const rowData = columns.map(col => {
      const rawVal = row[col.dataKey];
      if (col.format) {
        return col.format(rawVal, row);
      }
      return rawVal !== undefined && rawVal !== null ? rawVal : '';
    });
    rows.push(rowData);
  });

  // Totals Row
  if (totalsRow) {
    const totalsData = columns.map((col, idx) => {
      if (idx === 0 && !totalsRow[col.dataKey]) {
        return 'TOTAL / GRAND TOTAL';
      }
      return totalsRow[col.dataKey] !== undefined ? totalsRow[col.dataKey] : '';
    });
    rows.push(totalsData);
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Auto column widths
  const colWidths = columns.map((col, idx) => {
    let maxLen = col.header.length;
    data.forEach(row => {
      const val = col.format ? col.format(row[col.dataKey], row) : row[col.dataKey];
      const strLen = val ? String(val).length : 0;
      if (strLen > maxLen) maxLen = strLen;
    });
    return { wch: Math.max(maxLen + 4, col.width || 12) };
  });
  ws['!cols'] = colWidths;

  // Create workbook and append
  const wb = XLSX.utils.book_new();
  const safeSheetName = sheetName.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  // Write file
  const fullFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, fullFileName);
}

// ----------------------------------------------------------------------
// MULTI-SHEET EXCEL EXPORT (All Reports Bundle)
// ----------------------------------------------------------------------
export function exportMultiSheetExcel(options: MultiSheetExcelOptions): void {
  const { fileName, sheets } = options;
  const wb = XLSX.utils.book_new();

  sheets.forEach(sheet => {
    const rows: any[][] = [];
    rows.push(['AMRITESHWAR BALAJI PAPER PVT. LTD. - ERP']);
    rows.push([sheet.title.toUpperCase()]);
    rows.push([`Generated on: ${new Date().toLocaleString()}`]);
    rows.push([]);

    // Table Headers
    const headerRow = sheet.columns.map(c => c.header);
    rows.push(headerRow);

    // Data rows
    sheet.data.forEach(row => {
      const rowData = sheet.columns.map(col => {
        const rawVal = row[col.dataKey];
        if (col.format) {
          return col.format(rawVal, row);
        }
        return rawVal !== undefined && rawVal !== null ? rawVal : '';
      });
      rows.push(rowData);
    });

    // Totals Row
    if (sheet.totalsRow) {
      const totalsData = sheet.columns.map((col, idx) => {
        if (idx === 0 && !sheet.totalsRow[col.dataKey]) {
          return 'TOTAL';
        }
        return sheet.totalsRow[col.dataKey] !== undefined ? sheet.totalsRow[col.dataKey] : '';
      });
      rows.push(totalsData);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Col widths
    const colWidths = sheet.columns.map(col => {
      let maxLen = col.header.length;
      sheet.data.forEach(row => {
        const val = col.format ? col.format(row[col.dataKey], row) : row[col.dataKey];
        const strLen = val ? String(val).length : 0;
        if (strLen > maxLen) maxLen = strLen;
      });
      return { wch: Math.max(maxLen + 4, col.width || 12) };
    });
    ws['!cols'] = colWidths;

    const safeSheetName = sheet.sheetName.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  });

  const fullFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, fullFileName);
}

// ----------------------------------------------------------------------
// PDF EXPORT (Vectorized with jsPDF & AutoTable)
// ----------------------------------------------------------------------
export function exportToPdf(options: PdfExportOptions): void {
  const {
    title,
    subtitle,
    dateRange,
    generatedBy = 'ABPPL ERP System',
    fileName,
    summaryStats,
    columns,
    data,
    footers,
    orientation = 'portrait'
  } = options;

  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Company Brand Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('AMRITESHWAR BALAJI PAPER PVT. LTD.', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('ERP Enterprise Management System &bull; GSTIN: 27AABCA1234F1Z5', 14, 18);

  // Date / Timestamp on Header Right
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  const printDate = `Generated: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(printDate, pageWidth - 14, 11, { align: 'right' });
  doc.text(`User: ${generatedBy}`, pageWidth - 14, 18, { align: 'right' });

  // Document Title & Subtitle Section
  let currentY = 32;

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, 14, currentY);
  currentY += 5;

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(subtitle, 14, currentY);
    currentY += 5;
  }

  if (dateRange) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`Reporting Period: ${dateRange.start} to ${dateRange.end}`, 14, currentY);
    currentY += 6;
  }

  // Summary Stat Tiles (KPI Box in PDF)
  if (summaryStats && summaryStats.length > 0) {
    const tileMargin = 14;
    const availableWidth = pageWidth - (tileMargin * 2);
    const count = summaryStats.length;
    const tileWidth = (availableWidth - ((count - 1) * 3)) / count;
    const tileHeight = 15;

    summaryStats.forEach((stat, idx) => {
      const tileX = tileMargin + (idx * (tileWidth + 3));
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(tileX, currentY, tileWidth, tileHeight, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(stat.label.toUpperCase(), tileX + 3, currentY + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(String(stat.value), tileX + 3, currentY + 11.5);
    });

    currentY += tileHeight + 6;
  } else {
    currentY += 2;
  }

  // Prepare table headers & rows
  const tableHeaders = columns.map(c => c.header);
  const tableRows = data.map(row => {
    return columns.map(col => {
      const val = row[col.dataKey];
      if (col.format) {
        return String(col.format(val, row));
      }
      return val !== undefined && val !== null ? String(val) : '-';
    });
  });

  // Prepare column style alignment map
  const columnStylesMap: Record<number, { halign?: 'left' | 'center' | 'right' }> = {};
  columns.forEach((col, idx) => {
    if (col.align) {
      columnStylesMap[idx] = { halign: col.align };
    }
  });

  // Generate Table using autoTable
  autoTable(doc, {
    startY: currentY,
    head: [tableHeaders],
    body: tableRows,
    foot: footers || undefined,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.5
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59], // slate-800
      cellPadding: 2.2
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    footStyles: {
      fillColor: [226, 232, 240], // slate-200
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2.5
    },
    columnStyles: columnStylesMap,
    margin: { left: 14, right: 14, top: 28, bottom: 18 },
    didDrawPage: (dataHook) => {
      // Header for pages > 1
      if (dataHook.pageNumber > 1) {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`AMRITESHWAR BALAJI PAPER - ${title.toUpperCase()}`, 14, 8);
        doc.text(`Page ${dataHook.pageNumber}`, pageWidth - 14, 8, { align: 'right' });
      }

      // Footer
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        'This is a computer generated business report from ABPPL ERP. Confidential.',
        14,
        pageHeight - 8
      );
      doc.text(
        `Page ${dataHook.pageNumber}`,
        pageWidth - 14,
        pageHeight - 8,
        { align: 'right' }
      );
    }
  });

  const fullFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  doc.save(fullFileName);
}
