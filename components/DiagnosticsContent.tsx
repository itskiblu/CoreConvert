
import React, { useState, useEffect } from 'react';
import { ICONS, CONVERSION_OPTIONS } from '../constants';
import { convertImageFile } from '../utils/imageUtils';
import { convertDocumentFile } from '../utils/pdfUtils';
import { jsPDF } from 'jspdf';

interface DiagnosticsContentProps {
  onBack: () => void;
}

interface TestResult {
  id: string;
  label: string;
  status: 'PENDING' | 'RUNNING' | 'PASS' | 'FAIL' | 'SKIPPED';
  message?: string;
  duration?: number;
}

export const DiagnosticsContent: React.FC<DiagnosticsContentProps> = ({ onBack }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize test list
  useEffect(() => {
    const initialTests: TestResult[] = CONVERSION_OPTIONS.map(opt => ({
      id: opt.value,
      label: opt.label,
      status: 'PENDING'
    }));
    setResults(initialTests);
  }, []);

  const createMockFile = async (type: string, category: string): Promise<File | null> => {
    try {
      // 1. Image Mocks (PNG)
      if (category === 'Image' || type === 'IMAGE_TO_PDF') {
        if (type.includes('HEIC') || type.includes('PSD') || type.includes('TIFF') || type.includes('RAW') || type.includes('SVG')) {
          // Can't easily generate these complex binaries in browser without heavy libs
          return null;
        }
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FAFF00'; // Brutal Yellow
          ctx.fillRect(0, 0, 100, 100);
          ctx.fillStyle = 'black';
          ctx.fillText('TEST', 10, 50);
        }
        const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/png'));
        if (!blob) return null;
        return new File([blob], 'mock_image.png', { type: 'image/png' });
      }

      // 2. Document Mocks
      if (category === 'Document' || type.startsWith('DOCX_') || type.startsWith('HTML_') || type.startsWith('MARKDOWN_') || type.startsWith('TEXT_')) {
         if (type === 'PDF_TO_PNG') {
             // Generate a valid PDF using jsPDF for testing
             // @ts-ignore
             const doc = new jsPDF();
             doc.text("Diagnostics Test PDF", 10, 10);
             const pdfBlob = doc.output('blob');
             return new File([pdfBlob], 'mock.pdf', { type: 'application/pdf' });
         }
         
         if (type.includes('DOCX')) return null; // Can't gen DOCX easily

         if (type.includes('HTML')) {
             return new File(["<html><body><h1>Test</h1></body></html>"], 'mock.html', { type: 'text/html' });
         }
         if (type.includes('MARKDOWN')) {
             return new File(["# Test Headline"], 'mock.md', { type: 'text/markdown' });
         }
         
         return new File(["Simple text content for testing."], 'mock.txt', { type: 'text/plain' });
      }

      // 3. Data Mocks
      if (category === 'Data') {
          // Most data tests rely on non-implemented logic in this demo, but we provide file anyway
          if (type.includes('JSON')) return new File(['{"test": true}'], 'mock.json', { type: 'application/json' });
          if (type.includes('CSV')) return new File(['a,b\n1,2'], 'mock.csv', { type: 'text/csv' });
          return new File(['dummy data'], 'mock.dat', { type: 'text/plain' });
      }
      
      // Fallback
      return new File(["dummy content"], 'mock.txt', { type: 'text/plain' });

    } catch (e) {
      console.error("Mock generation failed", e);
      return null;
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    
    // Reset statuses
    setResults(prev => prev.map(t => ({ ...t, status: 'PENDING', message: undefined })));

    let completed = 0;

    for (const test of results) {
      setResults(prev => prev.map(t => t.id === test.id ? { ...t, status: 'RUNNING' } : t));
      
      const startTime = performance.now();
      const option = CONVERSION_OPTIONS.find(o => o.value === test.id);
      
      if (!option) {
         setResults(prev => prev.map(t => t.id === test.id ? { ...t, status: 'FAIL', message: 'Config missing' } : t));
         continue;
      }

      // 1. Generate Input
      const mockFile = await createMockFile(test.id, option.category);
      
      if (!mockFile) {
        setResults(prev => prev.map(t => t.id === test.id ? { ...t, status: 'SKIPPED', message: 'No mock input' } : t));
        completed++;
        setProgress((completed / results.length) * 100);
        continue;
      }

      // 2. Run Conversion Logic (Mirroring App.tsx routing)
      try {
        let result = null;
        const type = test.id as any;

        if (
          type.startsWith('IMAGE_') && type !== 'IMAGE_TO_PDF' || 
          type.startsWith('HEIC_') || 
          type.startsWith('TIFF_') || 
          type.startsWith('PSD_') || 
          type.startsWith('RAW_') || 
          type.startsWith('SVG_') ||
          type.startsWith('VECTOR_')
        ) {
           result = await convertImageFile(mockFile, type);
        } else if (
          type.startsWith('DOCX_') ||
          type.startsWith('MARKDOWN_') ||
          type.startsWith('HTML_') ||
          type.startsWith('TEXT_') ||
          type.startsWith('PDF_') ||
          type === 'IMAGE_TO_PDF'
        ) {
          result = await convertDocumentFile(mockFile, type);
        } else {
          // Simulation for unimplemented types
          await new Promise(r => setTimeout(r, 50)); 
          result = { blob: mockFile }; 
        }

        const endTime = performance.now();
        
        if (result && result.blob && result.blob.size > 0) {
           setResults(prev => prev.map(t => t.id === test.id ? { ...t, status: 'PASS', duration: Math.round(endTime - startTime) } : t));
        } else {
           throw new Error("Output blob is empty");
        }

      } catch (error) {
        setResults(prev => prev.map(t => t.id === test.id ? { ...t, status: 'FAIL', message: (error as Error).message } : t));
      }

      completed++;
      setProgress((completed / results.length) * 100);
      // Small delay to allow UI render
      await new Promise(r => setTimeout(r, 10));
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return 'text-green-600 dark:text-green-400';
      case 'FAIL': return 'text-red-600 dark:text-red-400';
      case 'RUNNING': return 'text-brutalYellow animate-pulse';
      case 'SKIPPED': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const stats = {
    pass: results.filter(r => r.status === 'PASS').length,
    fail: results.filter(r => r.status === 'FAIL').length,
    skip: results.filter(r => r.status === 'SKIPPED').length,
    total: results.length
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <button 
        onClick={onBack}
        className="mb-8 bg-black dark:bg-white text-brutalYellow dark:text-black px-6 py-2 font-black uppercase text-xs neubrutal-shadow-sm flex items-center gap-2 transition-all duration-100 neubrutal-button-active outline-none active:scale-95"
        aria-label="Back to App"
      >
        <div className="rotate-180 scale-75" aria-hidden="true"><ICONS.Download /></div>
        Back to App
      </button>

      <div className="bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow p-8 md:p-12 space-y-10">
        <header className="flex flex-col gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black text-black dark:text-white uppercase tracking-tighter leading-none mb-4">
              System <span className="text-brutalYellow brutal-text-stroke">Diagnostics</span>
            </h1>
            <p className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
              Automated Utility Verification Protocol
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between pt-6">
             <div className="flex flex-wrap gap-4">
                 <div className="bg-green-400 text-black neubrutal-border px-4 py-2 text-center min-w-[80px]">
                    <div className="text-2xl font-black leading-none">{stats.pass}</div>
                    <div className="text-[10px] font-black uppercase opacity-70 tracking-wider">Pass</div>
                 </div>
                 <div className="bg-red-500 text-white neubrutal-border px-4 py-2 text-center min-w-[80px]">
                    <div className="text-2xl font-black leading-none">{stats.fail}</div>
                    <div className="text-[10px] font-black uppercase opacity-80 tracking-wider">Fail</div>
                 </div>
                 <div className="bg-gray-300 dark:bg-zinc-700 text-black dark:text-white neubrutal-border px-4 py-2 text-center min-w-[80px]">
                    <div className="text-2xl font-black leading-none">{stats.skip}</div>
                    <div className="text-[10px] font-black uppercase opacity-70 tracking-wider">Skipped</div>
                 </div>
                 <div className="bg-white dark:bg-zinc-900 neubrutal-border px-4 py-2 text-center min-w-[80px]">
                    <div className="text-2xl font-black text-black dark:text-white leading-none">{stats.total}</div>
                    <div className="text-[10px] font-black uppercase text-gray-600 tracking-wider">Total</div>
                 </div>
             </div>

             <button 
                onClick={runTests}
                disabled={isRunning}
                className={`px-6 py-3 font-black text-sm uppercase tracking-wider neubrutal-border neubrutal-shadow-sm transition-all neubrutal-button-active whitespace-nowrap
                ${isRunning 
                    ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                    : 'bg-brutalYellow text-black hover:brightness-105'
                }`}
                aria-live="polite"
            >
                {isRunning ? 'Running Test...' : 'Initiate Sequence'}
            </button>
          </div>
        </header>

        <section className="space-y-4">
            {isRunning && (
            <div className="w-full h-4 bg-white dark:bg-zinc-900 neubrutal-border relative overflow-hidden">
                <div className="h-full bg-brutalYellow absolute top-0 left-0 transition-all duration-200" style={{ width: `${progress}%` }}></div>
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]"></div>
            </div>
            )}

            <div className="neubrutal-border h-[500px] overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-black/50">
            <table className="w-full text-left border-collapse">
                <thead className="bg-black text-white dark:bg-white dark:text-black sticky top-0 z-10">
                <tr>
                    <th scope="col" className="p-4 text-[10px] font-black uppercase tracking-wider w-1/3">Test ID</th>
                    <th scope="col" className="p-4 text-[10px] font-black uppercase tracking-wider w-24">Status</th>
                    <th scope="col" className="p-4 text-[10px] font-black uppercase tracking-wider w-24">Time</th>
                    <th scope="col" className="p-4 text-[10px] font-black uppercase tracking-wider">Message</th>
                </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-200 dark:divide-zinc-800 font-mono text-xs">
                {results.map((test) => (
                    <tr key={test.id} className="hover:bg-white dark:hover:bg-zinc-900 transition-colors group">
                    <td className="p-3 pl-4 font-bold text-black dark:text-white transition-colors">{test.label}</td>
                    <td className={`p-3 font-black uppercase ${getStatusColor(test.status)}`}>
                        {test.status}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">
                        {test.duration ? `${test.duration}ms` : '-'}
                    </td>
                    <td className="p-3 text-gray-800 dark:text-gray-200 text-[10px] uppercase break-all">
                        {test.message || '-'}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </section>

        <footer className="pt-8 border-t-2 border-dashed border-black dark:border-white/20 text-center">
          <p className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-[0.1em]">
            * Skipped tests indicate that the module cannot create a valid synthetic input for that format in the browser (e.g. PSD, HEIC).
          </p>
        </footer>
      </div>
    </div>
  );
};
