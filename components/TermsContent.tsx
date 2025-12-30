
import React from 'react';
import { ICONS } from '../constants';

interface TermsContentProps {
  onBack: () => void;
}

export const TermsContent: React.FC<TermsContentProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <button 
        onClick={onBack}
        className="mb-8 bg-black dark:bg-white text-brutalYellow dark:text-black px-6 py-2 font-black uppercase text-xs neubrutal-shadow-sm flex items-center gap-2 transition-colors duration-100 neubrutal-button-active outline-none"
      >
        <div className="rotate-180 scale-75"><ICONS.Download /></div>
        Back to Converter
      </button>

      <div className="bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow p-8 md:p-12 space-y-10">
        <header>
          <h1 className="text-4xl md:text-6xl font-black text-black dark:text-white uppercase tracking-tighter leading-none mb-4">
            Terms of <span className="text-brutalYellow brutal-text-stroke">Service</span>
          </h1>
          <p className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Effective Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        <section className="space-y-4">
          <div className="inline-block bg-brutalYellow text-black px-4 py-1 font-black uppercase text-sm neubrutal-border mb-2">
            Agreement
          </div>
          <p className="text-lg font-bold text-black dark:text-white leading-relaxed">
            By using CoreConvert, you agree to these terms. It's a tool provided for your convenience, with conversion running entirely in your environment.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">1. License to Use</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              CoreConvert is provided for personal and commercial use at no cost. You are free to use the converted files however you wish. The software is provided "as-is" without any specific license restrictions on the output.
            </p>
          </div>

          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">2. No Warranty</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              We provide no guarantee that the conversion will be 100% accurate or that the service will be available at all times. Use this tool at your own risk. We are not liable for any data loss resulting from browser crashes or conversion errors.
            </p>
          </div>

          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">3. Prohibited Use</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Do not attempt to reverse engineer the core conversion logic for malicious purposes or use the tool to facilitate any illegal activities.
            </p>
          </div>

          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">4. Modifications</h3>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              We reserve the right to modify or discontinue the tool at any time. As this is a client-side application, you can continue to use any version currently cached in your browser.
            </p>
          </div>
        </div>

        <footer className="pt-8 border-t-2 border-dashed border-black dark:border-white/20">
          <p className="text-xs font-black uppercase text-center text-gray-500">
            Simple tools, simple terms, Stay brutal.
          </p>
        </footer>
      </div>
    </div>
  );
};
