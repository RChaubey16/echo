/** Leading characters that make spreadsheet apps treat a cell as a formula (OWASP CSV injection). */
const FORMULA_TRIGGERS = new Set(["=", "+", "-", "@", "\t", "\r"]);

/**
 * Escapes one value as a CSV cell, guarding against formula injection.
 *
 * A cell that starts with a formula trigger gets a leading apostrophe so Excel, Sheets and
 * Numbers show it as text. Cells with quotes, commas or line breaks are quoted (RFC 4180).
 *
 * @param value - The cell value; null and undefined become an empty cell.
 * @returns The escaped cell.
 */
export function csvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && text.length > 0 && FORMULA_TRIGGERS.has(text[0]!)) {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Joins cells into one CSV line, ending with CRLF as RFC 4180 asks.
 *
 * @param cells - The row's values, in column order.
 * @returns The CSV line.
 */
export function csvRow(cells: ReadonlyArray<string | number | boolean | null | undefined>): string {
  return `${cells.map(csvCell).join(",")}\r\n`;
}
