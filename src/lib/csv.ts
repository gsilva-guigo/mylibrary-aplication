/**
 * CSV no formato que o Excel em português abre direto: separador ";",
 * BOM UTF-8 no início (acentos corretos) e quebras de linha CRLF.
 */

export function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  const lines = [header, ...rows].map((r) => r.map(csvCell).join(';'));
  return '﻿' + lines.join('\r\n');
}
