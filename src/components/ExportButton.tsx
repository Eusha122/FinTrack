'use client';

import React from 'react';
import { Transaction, AccountBalances } from '@/lib/types';
import { formatMoney } from '@/lib/parser';
import { format } from 'date-fns';
import { FileDown } from 'lucide-react';

interface ExportButtonProps {
  transactions: Transaction[];
  balances: AccountBalances;
  getMonthlyData: (month: string) => { income: number; expense: number; categories: Record<string, number>; cashSpent: number; bankSpent: number };
}

export default function ExportButton({ transactions, balances, getMonthlyData }: ExportButtonProps) {
  const handleExport = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const monthly = getMonthlyData(currentMonth);

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Report', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(now, 'MMMM d, yyyy')}`, 14, 30);

    // Balance summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Balances', 14, 44);

    autoTable(doc, {
      startY: 48,
      head: [['Account', 'Balance']],
      body: [
        ['Total', formatMoney(balances.total)],
        ['Cash', formatMoney(balances.cash)],
        ['Bank', formatMoney(balances.bank)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [67, 97, 238] },
    });

    // Monthly summary
    const afterBalances = (doc as unknown as Record<string, unknown>).lastAutoTable as { finalY: number } | undefined;
    const y1 = (afterBalances?.finalY || 80) + 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Monthly Summary - ${format(now, 'MMMM yyyy')}`, 14, y1);

    autoTable(doc, {
      startY: y1 + 4,
      head: [['Metric', 'Amount']],
      body: [
        ['Income', formatMoney(monthly.income)],
        ['Expenses', formatMoney(monthly.expense)],
        ['Net', formatMoney(monthly.income - monthly.expense)],
        ['Cash Spending', formatMoney(monthly.cashSpent)],
        ['Bank Spending', formatMoney(monthly.bankSpent)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [67, 97, 238] },
    });

    // Top categories
    const catEntries = Object.entries(monthly.categories).sort((a, b) => b[1] - a[1]);
    if (catEntries.length > 0) {
      const afterMonthly = (doc as unknown as Record<string, unknown>).lastAutoTable as { finalY: number } | undefined;
      const y2 = (afterMonthly?.finalY || 120) + 10;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Categories', 14, y2);

      autoTable(doc, {
        startY: y2 + 4,
        head: [['Category', 'Amount', '% of Total']],
        body: catEntries.map(([name, amt]) => [
          name,
          formatMoney(amt),
          `${monthly.expense > 0 ? Math.round((amt / monthly.expense) * 100) : 0}%`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [67, 97, 238] },
      });
    }

    // Transaction list (recent 50)
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Transactions', 14, 22);

    const recentTxs = transactions.slice(0, 50);
    autoTable(doc, {
      startY: 26,
      head: [['Date', 'Type', 'Category', 'Account', 'Amount', 'Note']],
      body: recentTxs.map(tx => [
        format(new Date(tx.date), 'MMM d, yyyy'),
        tx.type,
        tx.category,
        tx.account,
        `${tx.type === 'income' ? '+' : '-'}${formatMoney(tx.amount)}`,
        tx.note || '',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [67, 97, 238] },
      styles: { fontSize: 8 },
    });

    doc.save(`finance-report-${currentMonth}.pdf`);
  };

  return (
    <button className="btn btn-outline" onClick={handleExport}>
      <FileDown size={16} /> Export PDF Report
    </button>
  );
}
