
import { loadScript } from './scriptLoader';

export async function fontToTtf(file: File): Promise<Blob> {
    await loadScript('opentype');
    const buffer = await file.arrayBuffer();
    // @ts-ignore
    const opentype = window.opentype;
    
    return new Promise((resolve, reject) => {
        try {
            const font = opentype.parse(buffer);
            const outBuffer = font.toArrayBuffer();
            resolve(new Blob([outBuffer], { type: 'font/ttf' }));
        } catch (e) {
            reject(new Error("Failed to parse font."));
        }
    });
}

export async function fontToOtf(file: File): Promise<Blob> {
    await loadScript('opentype');
    const buffer = await file.arrayBuffer();
    // @ts-ignore
    const opentype = window.opentype;
    
    return new Promise((resolve, reject) => {
        try {
            const font = opentype.parse(buffer);
            const outBuffer = font.toArrayBuffer();
            // OpenType.js generates SFNT structure. The extension determines how the OS treats it,
            // though ideally we'd check if outlines are CFF or TrueType.
            // For general conversion purposes, renaming to .otf is often sufficient if the table structure is valid SFNT.
            resolve(new Blob([outBuffer], { type: 'font/otf' }));
        } catch (e) {
            reject(new Error("Failed to parse font."));
        }
    });
}

export async function fontToWoff(file: File): Promise<Blob> {
    await loadScript('opentype');
    await loadScript('pako');
    const buffer = await file.arrayBuffer();
    // @ts-ignore
    const opentype = window.opentype;
    // @ts-ignore
    const pako = window.pako;

    if (!pako) throw new Error("Pako library not loaded for compression.");

    return new Promise((resolve, reject) => {
        try {
            const font = opentype.parse(buffer);
            const ttfBuffer = font.toArrayBuffer();
            const woffBuffer = ttfToWoffBytes(ttfBuffer, pako);
            resolve(new Blob([woffBuffer], { type: 'font/woff' }));
        } catch (e) {
            console.error(e);
            reject(new Error("Failed to convert to WOFF."));
        }
    });
}

function ttfToWoffBytes(ttfBuffer: ArrayBuffer, pako: any): Uint8Array {
    const view = new DataView(ttfBuffer);
    const numTables = view.getUint16(4);
    
    // WOFF Header is 44 bytes
    const flavor = view.getUint32(0);
    const totalSfntSize = ttfBuffer.byteLength;
    
    // Process Tables
    const tables: any[] = [];
    let offset = 12; // Start of Table Directory in TTF
    
    let woffTableDirectorySize = 0;
    
    for (let i = 0; i < numTables; i++) {
        const tag = view.getUint32(offset);
        const checkSum = view.getUint32(offset + 4);
        const tableOffset = view.getUint32(offset + 8);
        const origLength = view.getUint32(offset + 12);
        
        const tableData = new Uint8Array(ttfBuffer, tableOffset, origLength);
        
        // Compress table
        const compressedData = pako.deflate(tableData);
        
        // Use compressed if smaller, else uncompressed
        let compLength = compressedData.length;
        let finalData = compressedData;
        
        if (compLength >= origLength) {
            compLength = origLength;
            finalData = tableData;
        }
        
        // Pad to 4-byte boundary
        const padding = (4 - (compLength % 4)) % 4;
        
        tables.push({
            tag,
            checkSum,
            origLength,
            compLength,
            data: finalData,
            padding
        });
        
        woffTableDirectorySize += 20; // 4*5 bytes per entry
        offset += 16;
    }
    
    // Calculate total size
    // Header(44) + Directory(20 * numTables) + Data
    let totalSize = 44 + woffTableDirectorySize;
    for (const t of tables) {
        totalSize += t.compLength + t.padding;
    }
    
    const woffBuffer = new Uint8Array(totalSize);
    const woffView = new DataView(woffBuffer.buffer);
    
    // Write Header
    // signature 'wOFF'
    woffView.setUint32(0, 0x774F4646); 
    woffView.setUint32(4, flavor);
    woffView.setUint32(8, totalSize);
    woffView.setUint16(12, numTables);
    woffView.setUint16(14, 0); // reserved
    woffView.setUint32(16, totalSfntSize);
    woffView.setUint16(20, 1); // majorVersion
    woffView.setUint16(22, 0); // minorVersion
    woffView.setUint32(24, 0); // metaOffset
    woffView.setUint32(28, 0); // metaLength
    woffView.setUint32(32, 0); // metaOrigLength
    woffView.setUint32(36, 0); // privOffset
    woffView.setUint32(40, 0); // privLength
    
    // Write Table Directory & Data
    let dirOffset = 44;
    let dataOffset = 44 + woffTableDirectorySize;
    
    for (const t of tables) {
        // Directory Entry
        woffView.setUint32(dirOffset, t.tag);
        woffView.setUint32(dirOffset + 4, dataOffset);
        woffView.setUint32(dirOffset + 8, t.compLength);
        woffView.setUint32(dirOffset + 12, t.origLength);
        woffView.setUint32(dirOffset + 16, t.checkSum);
        
        // Write Data
        woffBuffer.set(t.data, dataOffset);
        
        // Update offsets
        dirOffset += 20;
        dataOffset += t.compLength + t.padding; // Padding is naturally zero-filled by Uint8Array init
    }
    
    return woffBuffer;
}

export async function fontToJson(file: File): Promise<Blob> {
    await loadScript('opentype');
    const buffer = await file.arrayBuffer();
    // @ts-ignore
    const opentype = window.opentype;
    
    return new Promise((resolve, reject) => {
        try {
            const font = opentype.parse(buffer);
            // We strip out the functions and circular references by just dumping the tables and basic info
            const info = {
                names: font.names,
                unitsPerEm: font.unitsPerEm,
                ascender: font.ascender,
                descender: font.descender,
                numberOfGlyphs: font.numGlyphs,
                tables: Object.keys(font.tables),
                // Sampling some glyph data
                sampleGlyphs: {} as any
            };

            // Capture 'A' to 'Z' data
            for(let i = 65; i <= 90; i++) {
                const char = String.fromCharCode(i);
                const glyph = font.charToGlyph(char);
                if (glyph) {
                    info.sampleGlyphs[char] = {
                        advanceWidth: glyph.advanceWidth,
                        leftSideBearing: glyph.leftSideBearing,
                        path: glyph.getPath(0, 0, 72).toPathData(2)
                    };
                }
            }

            const jsonStr = JSON.stringify(info, null, 2);
            resolve(new Blob([jsonStr], { type: 'application/json' }));
        } catch (e) {
            reject(new Error("Failed to extract font data."));
        }
    });
}

export async function fontToCss(file: File): Promise<Blob> {
    const buffer = await file.arrayBuffer();
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            const fileName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
            const css = `
@font-face {
    font-family: '${fileName}';
    src: url('${base64}') format('truetype');
    font-weight: normal;
    font-style: normal;
}

/* Usage */
.font-${fileName} {
    font-family: '${fileName}', sans-serif;
}
            `.trim();
            resolve(new Blob([css], { type: 'text/css' }));
        };
        reader.onerror = () => reject(new Error("Failed to encode font."));
        reader.readAsDataURL(file);
    });
}
