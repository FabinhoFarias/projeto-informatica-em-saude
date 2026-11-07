export interface ImportResult {
  headers: string[];
  rows: string[][];
  totalRows: number;
  importedRows: number;
  correctedLocations: number;
  warnings: string[];
}
