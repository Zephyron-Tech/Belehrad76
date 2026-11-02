/**
 * CSV pro český Excel: oddělovač středník, UTF-8 s BOM, řádky CRLF.
 * Buňky začínající =, +, -, @ se ošetří proti CSV injection.
 */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const lines = rows.map((row) => row.map(cell).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[";\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}
