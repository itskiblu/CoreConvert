
import { ConversionType } from '../types';

interface ConversionResult {
  url: string;
  name: string;
  blob: Blob;
}

export async function convertDataFile(file: File, type: ConversionType): Promise<ConversionResult> {
  const isBinaryInput = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  let data: any;
  
  // Dynamic import of YAML library only when needed
  // @ts-ignore
  const jsYaml = (await import('js-yaml')).default || await import('js-yaml');

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
         const t = text.trim();
         if (t.startsWith('{') || t.startsWith('[')) data = JSON.parse(text);
         else if (t.startsWith('<')) data = parseXML(text);
         else if (t.match(/INSERT\s+INTO/i) || t.match(/CREATE\s+TABLE/i)) data = parseSQL(text);
         else data = parseCSV(text);
       }
    }
  } catch (e) {
    throw new Error(`Failed to parse input file: ${(e as Error).message}`);
  }

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
  return { url: URL.createObjectURL(blob), name: file.name.split('.').slice(0, -1).join('.') + '.' + ext, blob };
}

async function parseXLSX(buffer: ArrayBuffer): Promise<any[]> {
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
    const row = lines[i].split(delimiter);
    const obj: any = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = row[j]?.trim() || '';
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
  if (xml.nodeType === 1 && xml.attributes.length > 0) {
    obj["@attributes"] = {};
    for (let j = 0; j < xml.attributes.length; j++) {
      const attribute = xml.attributes.item(j);
      if(attribute) obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
    }
  } else if (xml.nodeType === 3) obj = xml.nodeValue;
  if (xml.hasChildNodes()) {
    for(let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i) as Element;
      if (item.nodeName === '#text' && !item.nodeValue?.trim()) continue;
      if (typeof(obj[item.nodeName]) === "undefined") {
        const val = item.nodeName === '#text' ? item.nodeValue : xmlToJson(item);
        if (val) obj[item.nodeName] = val;
      } else {
        if (!Array.isArray(obj[item.nodeName])) obj[item.nodeName] = [obj[item.nodeName]];
        obj[item.nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
}

function parseSQL(text: string): any[] {
  const result: any[] = [];
  const regex = /INSERT\s+INTO\s+[\w\.]+\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
      const cols = match[1].split(',').map(c => c.trim().replace(/^['"`]|['"`]$/g, ''));
      const valuesStr = match[2];
      const rows = valuesStr.split(/\),\s*\(/).map(r => r.replace(/[()]/g, '').split(',').map(v => v.trim().replace(/^'|'$/g, '')));
      rows.forEach(row => {
          const obj: any = {};
          cols.forEach((col, i) => obj[col] = row[i]);
          result.push(obj);
      });
  }
  return result;
}

async function toXLSX(data: any): Promise<Blob> {
    // @ts-ignore
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(Array.isArray(data) ? data : [data]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([output], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function toCSV(data: any, delimiter = ','): string {
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) return '';
  const headers = Array.from(new Set(arr.flatMap(Object.keys)));
  const csvRows = [headers.join(delimiter), ...arr.map(row => headers.map(h => `"${String((row as any)[h] ?? '').replace(/"/g, '""')}"`).join(delimiter))];
  return csvRows.join('\n');
}

function toXML(data: any, rootName = 'root'): string {
  let xml = '';
  if (Array.isArray(data)) data.forEach(item => xml += toXML(item, 'item'));
  else if (typeof data === 'object' && data !== null) {
    Object.keys(data).forEach(key => {
      if (key === '@attributes') return;
      const nodeName = key.replace(/[^a-zA-Z0-9_\-]/g, '_');
      xml += `<${nodeName}>${toXML(data[key], nodeName)}</${nodeName}>`;
    });
  } else xml += String(data).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return rootName === 'root' ? `<?xml version="1.0" encoding="UTF-8"?>\n<root>${xml}</root>` : xml;
}

function toSQL(data: any, tableName: string): string {
  const arr = Array.isArray(data) ? data : [data];
  if (arr.length === 0) return '';
  const headers = Object.keys(arr[0]);
  const columns = headers.map(h => h.replace(/[^a-zA-Z0-9_]/g, '_')).join(', ');
  const values = arr.map(row => `(${headers.map(h => {
    const v = (row as any)[h];
    return typeof v === 'number' ? v : (v === null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
  }).join(', ')})`).join(',\n');
  return `INSERT INTO ${tableName.replace(/[^a-zA-Z0-9_]/g, '_')} (${columns}) VALUES\n${values};`;
}
