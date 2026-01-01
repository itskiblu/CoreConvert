
import React from 'react';
import { ICONS, CONVERSION_OPTIONS } from '../constants';

interface AboutContentProps {
  onBack: () => void;
}

export const AboutContent: React.FC<AboutContentProps> = ({ onBack }) => {
  // Group options by category for the list
  const categories = ['Image', 'Data', 'Document', 'Audio', 'Video', '3D', 'Font', 'Utility'];
  const Icon3D = ICONS['3D'];
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <button 
        onClick={onBack}
        className="mb-8 bg-black dark:bg-white text-brutalYellow dark:text-black px-6 py-2 font-black uppercase text-xs neubrutal-shadow-sm flex items-center gap-2 transition-all duration-100 neubrutal-button-active outline-none active:scale-95"
      >
        <div className="rotate-180 scale-75"><ICONS.Download /></div>
        Back to Converter
      </button>

      <div className="bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow p-8 md:p-12 space-y-10">
        <header>
          <h1 className="text-4xl md:text-6xl font-black text-black dark:text-white uppercase tracking-tighter leading-none mb-4">
            About <span className="text-brutalYellow brutal-text-stroke">CoreConvert</span>
          </h1>
          <p className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            RAW POWER • TOTAL CONTROL
          </p>
        </header>

        <section className="space-y-4">
          <div className="inline-block bg-brutalYellow text-black px-4 py-1 font-black uppercase text-sm neubrutal-border mb-2">
            The Philosophy
          </div>
          <p className="text-lg font-bold text-black dark:text-white leading-relaxed">
            CoreConvert is the antithesis to the modern cloud-first web. We believe that your computer is a powerhouse, and your data shouldn't have to travel across the globe just to change format.
          </p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
            By leveraging advanced browser technologies including WebAssembly, the Web Audio API, and the Canvas Engine we've ported professional-grade conversion logic directly into your local environment. This is utility without compromise.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">1. Zero Latency</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              There is no "Upload" or "Download" phase. Files are read from your disk and processed instantly in your machine's memory. Your bandwidth is no longer the bottleneck; your hardware is the engine.
            </p>
          </div>

          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">2. Privacy by Default</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Security is not a feature; it's the architecture. By running the conversion engine client-side, we've removed the server-side liability entirely. Your files remain on your device, exactly where they belong.
            </p>
          </div>

          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">3. Open Standards</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              We rely on transparent web standards like CSV, JSON, and WebP. CoreConvert is designed to be a lightweight, permanent fixture in your toolkit that works offline and across all modern operating systems.
            </p>
          </div>

          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">4. No Friction</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              No accounts. No subscription models. No "pro" tiers. CoreConvert is a raw utility for developers, designers, and power users who need fast results without the corporate noise.
            </p>
          </div>
        </div>

        <section className="space-y-6 pt-4">
          <div className="inline-block bg-black dark:bg-white text-brutalYellow dark:text-black px-4 py-1 font-black uppercase text-sm neubrutal-border mb-2">
            Utility Capabilities
          </div>
          <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tight">Supported File-types:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat} className="neubrutal-border p-4 space-y-3 bg-gray-50 dark:bg-zinc-800/50 group hover:bg-brutalYellow/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center text-brutalYellow dark:text-black neubrutal-shadow-sm scale-75">
                    {cat === 'Image' && <ICONS.Image />}
                    {cat === 'Audio' && <ICONS.Music />}
                    {cat === 'Video' && <ICONS.Video />}
                    {cat === 'Data' && <ICONS.Data />}
                    {cat === 'Document' && <ICONS.Document />}
                    {cat === '3D' && <Icon3D />}
                    {cat === 'Font' && <ICONS.Font />}
                    {cat === 'Utility' && <ICONS.Utility />}
                  </div>
                  <h3 className="font-black text-lg uppercase tracking-tight text-black dark:text-white">{cat}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat === 'Data' ? (
                    ['JSON', 'CSV', 'XML', 'YAML', 'TSV', 'SQL', 'EXCEL'].map(fmt => (
                      <span key={fmt} className="bg-white dark:bg-zinc-900 border border-black dark:border-white/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-black dark:text-white">
                        {fmt}
                      </span>
                    ))
                  ) : (
                    CONVERSION_OPTIONS.filter(opt => opt.category === cat).map(opt => (
                      <span key={opt.value} className="bg-white dark:bg-zinc-900 border border-black dark:border-white/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-black dark:text-white">
                        {opt.label.replace('Convert to ', '').replace('Extract Audio ', '')}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="pt-8 border-t-2 border-dashed border-black dark:border-white/20 text-center">
          <p className="text-xs font-black uppercase text-gray-500 tracking-[0.1em]">
            Transparency is our default setting. For any further questions, view our <a href="https://github.com/itskiblu/CoreConvert" target="_blank" rel="noopener noreferrer" className="underline hover:text-black dark:hover:text-white">open-source repository</a>.
          </p>
        </footer>
      </div>
    </div>
  );
};
