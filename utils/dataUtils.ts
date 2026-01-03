

import { ConversionType } from '../types';
import jsYaml from 'js-yaml';

interface ConversionResult {
  url: string;
  name: string;
  blob: Blob;
}

/**
 * Main entry point for data conversion (JSON, CSV, YAML, XML, SQL, XLSX).
 * Pattern: Parse Input -> Intermediate JS Object -> Serialize to Output
 */
export async function convertDataFile(file: File, type: ConversionType): Promise<ConversionResult> {
  const isBinaryInput = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  let data: any;

  // 1. Parse Input
  try {
    if (isBinaryInput) {
       const arrayBuffer = await file.arrayBuffer();
       data = await parseXLSX(arrayBuffer);
    } else {
       const text = await file.text();
       if (file.name.endsWith('.json')) {
         data = JSON.parse(text);
       } else if (file.name.endsWith('.csv')) {
         data = parseCSV(text);
       } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
         data = jsYaml.load(text);
       } else if (file.name.endsWith('.xml')) {
         data = parseXML(text);
       } else if (file.name.endsWith('.tsv')) {
          data = parseCSV(text, '\t'); 
       } else if (file.name.endsWith('.sql')) {
          data = parseSQL(text);
       } else {
         // Fallback sniffing
         const t = text.trim();
         if (t.startsWith('{') || t.startsWith('[')) data = JSON.parse(text);
         else if (t.startsWith('<')) data = parseXML(text);
         else if (t.match(/INSERT\s+INTO/i) || t.match(/CREATE\s+TABLE/i)) data = parseSQL(text);
         else data = parseCSV(text); // Default to CSV if unknown
       }
    }
  } catch (e) {
    throw new Error(`Failed to parse input file: ${(e as Error).message}`);
  }

  // 2. Transform / Serialize
  let output: string | Blob = '';
  let mime = 'text/plain';
  let ext = 'txt';

  switch (type) {
    case 'DATA_TO_CSV':
      output = toCSV(data);
      mime = 'text/csv';
      ext = 'csv';
      break;

    case 'DATA_TO_JSON':
      output = JSON.stringify(data, null, 2);
      mime = 'application/json';
      ext = 'json';
      break;
    
    case 'DATA_PRETTIFY':
      output = JSON.stringify(data, null, 2);
      mime = 'application/json';
      ext = 'json';
      break;

    case 'DATA_MINIFY':
      output = JSON.stringify(data);
      mime = 'application/json';
      ext = 'json';
      break;

    case 'DATA_TO_YAML':
      output = jsYaml.dump(data);
      mime = 'text/yaml';
      ext = 'yaml';
      break;

    case 'DATA_TO_XML':
      output = toXML(data);
      mime = 'application/xml';
      ext = 'xml';
      break;
    
    case 'DATA_TO_TSV':
      output = toCSV(data, '\t');
      mime = 'text/tab-separated-values';
      ext = 'tsv';
      break;

    case 'DATA_TO_SQL':
      output = toSQL(data, file.name.split('.')[0] || 'table_name');
      mime = 'application/sql';
      ext = 'sql';
      break;

    case 'DATA_TO_XLSX':
      output = await toXLSX(data);
      mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      ext = 'xlsx';
      break;

    default:
      throw new Error(`Unsupported data conversion: ${type}`);
  }

  const blob = output instanceof Blob ? output : new Blob([output], { type: mime });
  const url = URL.createObjectURL(blob);
  const name = file.name.split('.').slice(0, -1).join('.') + '.' + ext;

  return { url, name, blob };
}

// --- Parsers ---

async function parseXLSX(buffer: ArrayBuffer): Promise<any[]> {
    // Dynamic import
    // @ts-ignore
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(firstSheet);
}

function parseCSV(text: string, delimiter = ','): any[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV splitting (doesn't handle commas inside quotes perfectly, but good enough for client-side util)
    let row: string[];
    
    if (delimiter === ',') {
        // Regex to handle quoted commas
        const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g); 
        // Fallback if regex fails (simple split)
        row = matches ? matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"')) : lines[i].split(delimiter);
        
        // If the regex method missed empty columns or failed, fallback to simple split
        if (!row || row.length !== headers.length) {
             row = lines[i].split(delimiter);
        }
    } else {
        row = lines[i].split(delimiter);
    }

    const obj: any = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j]?.trim() || '';
    }
    result.push(obj);
  }
  return result;
}

function parseXML(text: string): any {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  return xmlToJson(xmlDoc.documentElement);
}

function xmlToJson(xml: Element): any {
  let obj: any = {};

  if (xml.nodeType === 1) { // element
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
      for (let j = 0; j < xml.attributes.length; j++) {
        const attribute = xml.attributes.item(j);
        if(attribute) obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType === 3) { // text
    obj = xml.nodeValue;
  }

  if (xml.hasChildNodes()) {
    for(let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i) as Element;
      const nodeName = item.nodeName;
      
      if (nodeName === '#text' && !item.nodeValue?.trim()) continue;

      if (typeof(obj[nodeName]) === "undefined") {
        const val = nodeName === '#text' ? item.nodeValue : xmlToJson(item);
        if (val) obj[nodeName] = val;
        if (nodeName === '#text' && Object.keys(obj).length === 1) obj = val;
      } else {
        if (typeof(obj[nodeName].push) === "undefined") {
          const old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
}

function parseSQL(text: string): any[] {
  const result: any[] = [];
  
  // Try to find column definitions if available in CREATE TABLE (heuristic)
  // This is hard to do robustly without a full parser, so we rely mainly on INSERT INTO patterns.
  
  // Heuristic A: INSERT INTO table (col1, col2) VALUES ...
  // Regex: INSERT INTO [optional quote]name[optional quote] (cols) VALUES ...
  const insertWithColsRegex = /INSERT\s+INTO\s+[\`"']?[\w\.]+[\`"']?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/gmi;
  
  let match;
  let found = false;
  
  // Clone text for regex
  let s = text;
  
  while ((match = insertWithColsRegex.exec(s)) !== null) {
      found = true;
      const cols = match[1].split(',').map(c => c.trim().replace(/^['"`]|['"`]$/g, ''));
      const valuesStr = match[2];
      const rows = parseSQLValuesString(valuesStr);
      
      rows.forEach(row => {
          if (row.length === cols.length) {
              const obj: any = {};
              cols.forEach((col, i) => obj[col] = row[i]);
              result.push(obj);
          }
      });
  }
  
  if (found) return result;
  
  // Heuristic B: INSERT INTO table VALUES ... (No columns specified)
  // We will assign generic column names col1, col2...
  const insertNoColsRegex = /INSERT\s+INTO\s+[\`"']?[\w\.]+[\`"']?\s*VALUES\s*([\s\S]+?);/gmi;
  
  while ((match = insertNoColsRegex.exec(s)) !== null) {
      const valuesStr = match[1];
      const rows = parseSQLValuesString(valuesStr);
      rows.forEach(row => {
         const obj: any = {};
         row.forEach((val, i) => obj[`col_${i+1}`] = val);
         result.push(obj);
      });
  }
  
  return result;
}

function parseSQLValuesString(str: string): any[][] {
    const rows: any[][] = [];
    let currentRow: any[] = [];
    let currentVal = '';
    let inQuote = false;
    let quoteChar = '';
    let depth = 0;
    
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        
        if (inQuote) {
            if (char === quoteChar) {
                if (str[i+1] === quoteChar) {
                    currentVal += quoteChar;
                    i++;
                } else {
                    inQuote = false;
                }
            } else {
                currentVal += char;
            }
        } else {
            if (char === "'" || char === '"' || char === '`') {
                inQuote = true;
                quoteChar = char;
            } else if (char === '(') {
                if (depth === 0) {
                    currentRow = [];
                    currentVal = '';
                } else {
                    currentVal += char;
                }
                depth++;
            } else if (char === ')') {
                depth--;
                if (depth === 0) {
                    currentRow.push(cleanSQLVal(currentVal));
                    currentVal = '';
                    rows.push(currentRow);
                } else {
                    currentVal += char;
                }
            } else if (char === ',') {
                if (depth === 1) {
                    currentRow.push(cleanSQLVal(currentVal));
                    currentVal = '';
                } else if (depth > 1) {
                    currentVal += char;
                }
            } else {
                if (depth >= 1) currentVal += char;
            }
        }
    }
    return rows;
}

function cleanSQLVal(val: string): any {
    const v = val.trim();
    if (v.toUpperCase() === 'NULL') return null;
    if (!isNaN(Number(v)) && v !== '') return Number(v);
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"')) || (v.startsWith('`') && v.endsWith('`'))) {
        return v.substring(1, v.length - 1);
    }
    return v;
}

// --- Serializers ---

async function toXLSX(data: any): Promise<Blob> {
    // Dynamic import
    // @ts-ignore
    const XLSX = await import('xlsx');
    
    const arr = Array.isArray(data) ? data : [data];
    const worksheet = XLSX.utils.json_to_sheet(arr);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    
    const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function toCSV(data: any, delimiter = ','): string {
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) return '';

  const headers = Array.from(new Set(arr.flatMap(Object.keys)));
  
  const csvRows = [
    headers.join(delimiter),
    ...arr.map(row => 
      headers.map(fieldName => {
        let val = (row as any)[fieldName] ?? '';
        val = String(val).replace(/"/g, '""'); 
        return `"${val}"`;
      }).join(delimiter)
    )
  ];

  return csvRows.join('\n');
}

function toXML(data: any, rootName = 'root'): string {
  let xml = '';
  
  if (Array.isArray(data)) {
    data.forEach(item => {
      xml += toXML(item, 'item');
    });
  } else if (typeof data === 'object' && data !== null) {
    Object.keys(data).forEach(key => {
      let nodeName = key;
      if (nodeName === '@attributes') return;
      
      // Clean invalid xml tag chars
      nodeName = nodeName.replace(/[^a-zA-Z0-9_\-]/g, '_'); 
      if (/^\d/.test(nodeName)) nodeName = '_' + nodeName;

      xml += `<${nodeName}>`;
      xml += toXML(data[key], nodeName);
      xml += `</${nodeName}>`;
    });
  } else {
    xml += String(data).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  
  if (rootName === 'root') {
      return `<?xml version="1.0" encoding="UTF-8"?>\n<root>${xml}</root>`;
  }
  return xml;
}

function toSQL(data: any, tableName: string): string {
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) return '';
  
  // Sanitize table name
  const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
  
  const headers = Object.keys(arr[0]);
  const columns = headers.map(h => h.replace(/[^a-zA-Z0-9_]/g, '_')).join(', ');
  
  const values = arr.map(row => {
    const vals = headers.map(h => {
      const v = (row as any)[h];
      if (typeof v === 'number') return v;
      if (v === null || v === undefined) return 'NULL';
      return `'${String(v).replace(/'/g, "''")}'`;
    });
    return `(${vals.join(', ')})`;
  }).join(',\n');
  
  return `INSERT INTO ${safeTableName} (${columns}) VALUES\n${values};`;
}
