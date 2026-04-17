import jsPDF from 'jspdf';
import type { Transaction } from '@/store/api/walletApi';
import { formatMoney, formatDate } from './format';

export const downloadReceipt = (tx: Transaction) => {
  const doc = new jsPDF();
  // Header band
  doc.setFillColor(7, 135, 179);
  doc.rect(0, 0, 210, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Lipaxe', 16, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Transaction receipt', 16, 30);

  doc.setTextColor(20, 88, 118);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(tx.description, 16, 56);

  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const rows: [string, string][] = [
    ['Reference', tx.reference],
    ['Type', tx.type],
    ['Direction', tx.direction === 'in' ? 'Incoming' : 'Outgoing'],
    ['Status', tx.status],
    ['Counterparty', tx.counterparty],
    ['Amount', `${tx.direction === 'out' ? '-' : '+'} ${formatMoney(tx.amount, tx.currency)}`],
    ...(tx.fee ? [['Fee', formatMoney(tx.fee, tx.currency)] as [string, string]] : []),
    ['Date', formatDate(tx.createdAt)],
  ];

  let y = 70;
  rows.forEach(([k, v]) => {
    doc.setTextColor(120, 120, 120);
    doc.text(k, 16, y);
    doc.setTextColor(20, 20, 20);
    doc.text(String(v), 90, y);
    y += 10;
  });

  doc.setDrawColor(220, 230, 240);
  doc.line(16, y + 4, 194, y + 4);

  doc.setTextColor(140, 140, 140);
  doc.setFontSize(9);
  doc.text('This receipt is generated automatically by Lipaxe and serves as proof of transaction.', 16, y + 14);
  doc.text(`Generated on ${formatDate(new Date().toISOString())}`, 16, y + 20);

  doc.save(`Lipaxe-${tx.reference}.pdf`);
};
