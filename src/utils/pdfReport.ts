/**
 * Professional PDF Financial Report Generator for
 * SATTAR AUTO MOBILE & ELECTRICAL SERVICES
 * 
 * Rules:
 * 1. Strict accounting accuracy (Transfers excluded from Money In, Money Out, Net Cash Flow).
 * 2. Asia/Karachi timestamps & user-friendly dates.
 * 3. Multi-page pagination with repeating headers and 'Page X of Y'.
 * 4. Respective filters honored.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Account, Transaction } from '../types/finance';
import { formatDate, formatTime, formatPKR } from './accounting';

export interface PDFExportResult {
  success: boolean;
  fileName: string;
  method: 'download' | 'share' | 'saved_to_documents';
  message: string;
  uri?: string;
}

export interface PDFReportOptions {
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  filtersApplied: {
    period: string;
    account: string;
    category: string;
    type?: string;
  };
  summary: {
    totalIn: number;
    totalOut: number;
    netCashFlow: number;
    totalTransfer: number;
    countIn: number;
    countOut: number;
    countTransfer: number;
    totalCount?: number;
    countVoid?: number;
  };
  accounts: Account[];
  incomeByCategory: {
    category: string;
    amount: number;
    count: number;
  }[];
  expensesByCategory: {
    category: string;
    amount: number;
    count: number;
  }[];
  transactions: Transaction[];
  businessName?: string;
  currency?: string;
}

export async function exportFinancialReportPDF(options: PDFReportOptions): Promise<PDFExportResult> {
  const {
    periodLabel,
    startDate,
    endDate,
    filtersApplied,
    summary,
    accounts,
    incomeByCategory,
    expensesByCategory,
    transactions,
    businessName = 'SATTAR AUTO MOBILE & ELECTRICAL SERVICES',
    currency = 'PKR',
  } = options;

  // Initialize PDF in A4 portrait
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  // Current date & time in Asia/Karachi
  const now = new Date();
  const generatedDateStr = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Karachi',
  }).format(now);

  const generatedTimeStr = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Karachi',
  }).format(now);

  // 1. Header Banner & Branding
  // Dark slate header bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent stripe
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Business Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(businessName.toUpperCase(), marginX, 12);

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text('FINANCIAL REPORT & CASH FLOW AUDIT', marginX, 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Mobile-First Workshop Financial Operations · Single Source of Truth', marginX, 24);

  // Generated metadata on right side of header
  doc.setTextColor(226, 232, 240);
  doc.setFontSize(7.5);
  doc.text(`Generated: ${generatedDateStr} at ${generatedTimeStr}`, pageWidth - marginX, 13, { align: 'right' });
  doc.text(`Operational Timezone: Asia/Karachi`, pageWidth - marginX, 18, { align: 'right' });
  doc.text(`Base Currency: ${currency}`, pageWidth - marginX, 23, { align: 'right' });

  let currentY = 36;

  // 2. Report Parameters & Active Filters Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginX, currentY, contentWidth, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text('REPORT PARAMETERS', marginX + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const rangeText = startDate && endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : periodLabel;
  doc.text(`Period: `, marginX + 4, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.text(rangeText, marginX + 14, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.text(`Account Filter: `, marginX + 70, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.text(filtersApplied.account, marginX + 90, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.text(`Category Filter: `, marginX + 130, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.text(filtersApplied.category, marginX + 152, currentY + 11);

  currentY += 24;

  // 3. Section: Financial Summary KPIs
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. FINANCIAL SUMMARY', marginX, currentY);

  currentY += 3;

  // Render 4 Summary Metric Boxes
  const boxWidth = (contentWidth - 6) / 4;
  const boxHeight = 16;

  // Box 1: Money In
  doc.setFillColor(240, 253, 244); // green-50
  doc.setDrawColor(187, 247, 208); // green-200
  doc.roundedRect(marginX, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(22, 101, 52); // green-800
  doc.text('TOTAL MONEY IN', marginX + 3, currentY + 4.5);
  doc.setFontSize(9.5);
  doc.text(formatPKR(summary.totalIn), marginX + 3, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${summary.countIn} record(s)`, marginX + 3, currentY + 14);

  // Box 2: Money Out
  const box2X = marginX + boxWidth + 2;
  doc.setFillColor(255, 241, 242); // rose-50
  doc.setDrawColor(254, 205, 211); // rose-200
  doc.roundedRect(box2X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(159, 18, 57); // rose-800
  doc.text('TOTAL MONEY OUT', box2X + 3, currentY + 4.5);
  doc.setFontSize(9.5);
  doc.text(formatPKR(summary.totalOut), box2X + 3, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${summary.countOut} record(s)`, box2X + 3, currentY + 14);

  // Box 3: Net Cash Flow
  const box3X = box2X + boxWidth + 2;
  const isNetPositive = summary.netCashFlow >= 0;
  doc.setFillColor(isNetPositive ? 236 : 255, isNetPositive ? 253 : 241, isNetPositive ? 245 : 242);
  doc.setDrawColor(isNetPositive ? 167 : 254, isNetPositive ? 243 : 205, isNetPositive ? 208 : 211);
  doc.roundedRect(box3X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(isNetPositive ? 4 : 159, isNetPositive ? 120 : 18, isNetPositive ? 87 : 57);
  doc.text('NET CASH FLOW', box3X + 3, currentY + 4.5);
  doc.setFontSize(9.5);
  doc.text(formatPKR(summary.netCashFlow), box3X + 3, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Money In minus Out', box3X + 3, currentY + 14);

  // Box 4: Transfers Volume
  const box4X = box3X + boxWidth + 2;
  doc.setFillColor(238, 242, 255); // indigo-50
  doc.setDrawColor(199, 210, 254); // indigo-200
  doc.roundedRect(box4X, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(55, 48, 163); // indigo-800
  doc.text('TRANSFERS VOLUME', box4X + 3, currentY + 4.5);
  doc.setFontSize(9.5);
  doc.text(formatPKR(summary.totalTransfer), box4X + 3, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${summary.countTransfer} record(s) · Net Neutral`, box4X + 3, currentY + 14);

  currentY += boxHeight + 6;

  // 4. Section: Account Movement Table
  // Calculate movement per account for the filtered dataset
  const accountMovementMap: Record<string, { moneyIn: number; moneyOut: number; transfersIn: number; transfersOut: number }> = {};
  
  accounts.forEach((a) => {
    accountMovementMap[a.name] = { moneyIn: 0, moneyOut: 0, transfersIn: 0, transfersOut: 0 };
  });

  transactions.forEach((t) => {
    if (t.status === 'VOID') return;
    const amt = Number(t.amount) || 0;
    if (amt <= 0) return;

    if (t.type === 'IN') {
      if (!accountMovementMap[t.account]) {
        accountMovementMap[t.account] = { moneyIn: 0, moneyOut: 0, transfersIn: 0, transfersOut: 0 };
      }
      accountMovementMap[t.account].moneyIn += amt;
    } else if (t.type === 'OUT') {
      if (!accountMovementMap[t.account]) {
        accountMovementMap[t.account] = { moneyIn: 0, moneyOut: 0, transfersIn: 0, transfersOut: 0 };
      }
      accountMovementMap[t.account].moneyOut += amt;
    } else if (t.type === 'TRANSFER') {
      if (t.account) {
        if (!accountMovementMap[t.account]) {
          accountMovementMap[t.account] = { moneyIn: 0, moneyOut: 0, transfersIn: 0, transfersOut: 0 };
        }
        accountMovementMap[t.account].transfersOut += amt;
      }
      if (t.toAccount) {
        if (!accountMovementMap[t.toAccount]) {
          accountMovementMap[t.toAccount] = { moneyIn: 0, moneyOut: 0, transfersIn: 0, transfersOut: 0 };
        }
        accountMovementMap[t.toAccount].transfersIn += amt;
      }
    }
  });

  // Strict 4-column format per user specification: Account | Money In | Money Out | Net Movement
  const accountRows = Object.entries(accountMovementMap).map(([accName, m]) => {
    const net = m.moneyIn - m.moneyOut + m.transfersIn - m.transfersOut;
    return [
      accName,
      formatPKR(m.moneyIn),
      formatPKR(m.moneyOut),
      formatPKR(net),
    ];
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. ACCOUNT MOVEMENT', marginX, currentY);

  currentY += 2;

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [['Account', 'Money In', 'Money Out', 'Net Movement']],
    body: accountRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 37, halign: 'right' },
      2: { cellWidth: 37, halign: 'right' },
      3: { cellWidth: 38, halign: 'right', fontStyle: 'bold' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // 5. Section: Category Summaries (Income & Expenses) with % of Total
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. CATEGORY BREAKDOWN', marginX, currentY);

  currentY += 2;

  const incomeCatRows = incomeByCategory.map((c) => {
    const pct = summary.totalIn > 0 ? `${((c.amount / summary.totalIn) * 100).toFixed(1)}%` : '0.0%';
    return [c.category, `${c.count}`, formatPKR(c.amount), pct];
  });
  if (incomeCatRows.length === 0) {
    incomeCatRows.push(['No income records in selected filter', '0', 'PKR 0', '0.0%']);
  }

  const expenseCatRows = expensesByCategory.map((c) => {
    const pct = summary.totalOut > 0 ? `${((c.amount / summary.totalOut) * 100).toFixed(1)}%` : '0.0%';
    return [c.category, `${c.count}`, formatPKR(c.amount), pct];
  });
  if (expenseCatRows.length === 0) {
    expenseCatRows.push(['No expense records in selected filter', '0', 'PKR 0', '0.0%']);
  }

  // Two tables: Income by Category & Expenses by Category
  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [['Income Category', 'Transactions', 'Amount', '% of Income']],
    body: incomeCatRows,
    theme: 'striped',
    headStyles: {
      fillColor: [5, 150, 105], // emerald-600
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 92 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 30, halign: 'right' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [['Expense Category', 'Transactions', 'Amount', '% of Expenses']],
    body: expenseCatRows,
    theme: 'striped',
    headStyles: {
      fillColor: [225, 29, 72], // rose-600
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 92 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 30, halign: 'right' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // 6. Section: Detailed Transactions Table
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`4. TRANSACTION DETAILS (${transactions.length} Records)`, marginX, currentY);

  currentY += 2;

  const transactionRows = transactions.map((t) => {
    const isVoid = t.status === 'VOID';
    let accountDisplay = t.account;
    if (t.type === 'TRANSFER') {
      accountDisplay = `${t.account} -> ${t.toAccount || 'Account'}`;
    }

    const typeLabel = isVoid ? `${t.type} (VOID)` : t.type;
    const payeeOrCustomer = t.customer || t.payee || t.vehicle || '-';
    const desc = t.description ? (t.reference ? `${t.reference}: ${t.description}` : t.description) : (t.reference || '-');

    return [
      formatDate(t.date),
      typeLabel,
      t.category || (t.type === 'TRANSFER' ? 'Transfer' : 'General'),
      accountDisplay,
      payeeOrCustomer,
      desc,
      formatPKR(t.amount),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX, bottom: 15 },
    head: [['Date', 'Type', 'Category', 'Account(s)', 'Party/Vehicle', 'Description/Ref', 'Amount']],
    body: transactionRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 16, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 32 },
      4: { cellWidth: 26 },
      5: { cellWidth: 36 },
      6: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Color-code the type column
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val.includes('IN')) {
          data.cell.styles.textColor = [5, 150, 105];
        } else if (val.includes('OUT')) {
          data.cell.styles.textColor = [225, 29, 72];
        } else if (val.includes('TRANSFER')) {
          data.cell.styles.textColor = [79, 70, 229];
        }
      }
    },
  });

  // 7. Add Footers and "Page X of Y" to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // slate-400

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);

    // Footer left: Generated notice per specification
    doc.text(
      'Generated by Sattar Auto Mobile & Electrical Services Financial System',
      marginX,
      pageHeight - 6
    );

    // Footer center: Timezone statement
    doc.text(
      `Generated: ${generatedDateStr} ${generatedTimeStr} (PKR)`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );

    // Footer right: Page number
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 6, {
      align: 'right',
    });
  }

  // 8. Meaningful filename (Requirement 7)
  // Format: Sattar_Finance_Report_<date_or_period>.pdf
  // e.g., Sattar_Finance_Report_2026-10-09.pdf
  const karachiDateIso = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }); // YYYY-MM-DD
  let filenameSuffix = '';

  if (startDate && endDate && startDate !== endDate) {
    filenameSuffix = `${startDate}_to_${endDate}`;
  } else if (startDate) {
    filenameSuffix = startDate;
  } else if (periodLabel && periodLabel !== 'All Time' && periodLabel !== 'Custom Period') {
    const cleanLabel = periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    filenameSuffix = `${cleanLabel}_${karachiDateIso}`;
  } else {
    filenameSuffix = karachiDateIso;
  }

  const sanitizedFileName = `Sattar_Finance_Report_${filenameSuffix}.pdf`;

  // 9. Platform-Aware Native File Export (Requirements 4, 5, 6, 8, 9, 10)
  if (Capacitor.isNativePlatform()) {
    // Android (Capacitor) Native Execution
    try {
      const dataUri = doc.output('datauristring');
      const base64Data = dataUri.split(',')[1];

      if (!base64Data) {
        throw new Error('Failed to generate binary PDF data.');
      }

      // Check / request storage permissions if applicable
      try {
        const perm = await Filesystem.checkPermissions();
        if (perm.publicStorage === 'prompt' || perm.publicStorage === 'prompt-with-rationale') {
          await Filesystem.requestPermissions();
        }
      } catch (permErr) {
        console.warn('Storage permission check notice:', permErr);
      }

      // 1. Write to Cache first (guaranteed FileProvider compatible for Sharing and Opening)
      let fileUri: string | undefined;
      const cacheResult = await Filesystem.writeFile({
        path: sanitizedFileName,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });
      fileUri = cacheResult.uri;

      // 2. Also write to Documents directory (respects scoped storage)
      let savedToDocuments = false;
      try {
        const docResult = await Filesystem.writeFile({
          path: sanitizedFileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
        if (docResult && docResult.uri) {
          savedToDocuments = true;
          fileUri = docResult.uri;
        }
      } catch (docErr) {
        console.warn('Documents directory write notice:', docErr);
      }

      // 3. Native Share / Save Action (Requirements 5 & 6)
      // Opens Android native system save/share sheet allowing user to save directly to
      // Downloads, Drive, Files, or open in PDF viewer
      try {
        await Share.share({
          title: 'Sattar Finance Report',
          text: `Financial Report: ${sanitizedFileName}`,
          url: fileUri,
          dialogTitle: 'Save or Share PDF Report',
        });

        return {
          success: true,
          fileName: sanitizedFileName,
          method: 'share',
          message: 'Choose where to save your PDF (e.g. Downloads or Drive).',
          uri: fileUri,
        };
      } catch (shareErr: any) {
        // If user cancelled or dismissed the share dialog
        if (
          shareErr.message &&
          (shareErr.message.includes('cancel') ||
            shareErr.message.includes('dismiss') ||
            shareErr.message.includes('Canceled'))
        ) {
          return {
            success: true,
            fileName: sanitizedFileName,
            method: savedToDocuments ? 'saved_to_documents' : 'share',
            message: savedToDocuments
              ? `PDF saved successfully to Documents (${sanitizedFileName}).`
              : `PDF generated (${sanitizedFileName}).`,
            uri: fileUri,
          };
        }

        if (savedToDocuments) {
          return {
            success: true,
            fileName: sanitizedFileName,
            method: 'saved_to_documents',
            message: `PDF saved successfully to Documents (${sanitizedFileName}).`,
            uri: fileUri,
          };
        }

        throw shareErr;
      }
    } catch (nativeErr: any) {
      console.error('Android native export error:', nativeErr);
      throw new Error(`Android file save failed: ${nativeErr.message || 'Storage error'}`);
    }
  } else {
    // Web / GitHub Pages Browser Download (Requirement 8)
    try {
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = sanitizedFileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Clean up object URL after small timeout
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      return {
        success: true,
        fileName: sanitizedFileName,
        method: 'download',
        message: `PDF saved successfully (${sanitizedFileName}).`,
        uri: blobUrl,
      };
    } catch (webErr: any) {
      console.error('Web browser PDF download error:', webErr);
      // Fallback to doc.save if in browser
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        doc.save(sanitizedFileName);
      }
      return {
        success: true,
        fileName: sanitizedFileName,
        method: 'download',
        message: `PDF downloaded successfully (${sanitizedFileName}).`,
      };
    }
  }
}
