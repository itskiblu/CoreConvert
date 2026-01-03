
import React from 'react';
import { ICONS } from '../constants';

interface PrivacyContentProps {
  onBack: () => void;
}

export const PrivacyContent: React.FC<PrivacyContentProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <button 
        onClick={onBack}
        className="mb-8 bg-black dark:bg-white text-brutalYellow dark:text-black px-6 py-2 font-black uppercase text-xs neubrutal-shadow-sm flex items-center gap-2 transition-colors duration-100 neubrutal-button-active outline-none"
      >
        <div className="rotate-180 scale-75"><ICONS.Download /></div>
        Back to App
      </button>

      <div className="bg-white dark:bg-zinc-900 neubrutal-border neubrutal-shadow p-8 md:p-12 space-y-10">
        <header>
          <h1 className="text-4xl md:text-6xl font-black text-black dark:text-white uppercase tracking-tighter leading-none mb-4">
            Privacy <span className="text-brutalYellow brutal-text-stroke">Policy</span>
          </h1>
          <p className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </header>

        <section className="space-y-4">
          <div className="inline-block bg-brutalYellow text-black px-4 py-1 font-black uppercase text-sm neubrutal-border mb-2">
            The Golden Rule
          </div>
          <p className="text-lg font-bold text-black dark:text-white leading-relaxed">
            CoreConvert is built on a "Local-First" philosophy. We believe your files belong to you, and your computer is powerful enough to handle your data without sending it across the world.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">1. Local Processing</h3>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              When you convert an image, CSV, or JSON file, the entire process happens inside your web browser. We use the Web Canvas API and File API to transform data. No bytes of your uploaded files ever touch our servers.
            </p>
          </div>

          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">2. No Persistence</h3>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              We do not use databases, local storage for your files, or any form of tracking that identifies you. Once you refresh the page or close the tab, the temporary memory used for conversion is cleared.
            </p>
          </div>

          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">3. Zero Data Export</h3>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              This application is strictly client-side. Unlike other converters, we don't send your data to any external APIs or third-party servers. Your privacy is protected by the architecture itself.
            </p>
          </div>

          <div className="neubrutal-border p-6 space-y-3">
            <h3 className="font-black text-xl uppercase text-black dark:text-white">4. Cookies & Analytics</h3>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
              CoreConvert does not use tracking cookies. We might use localStorage strictly to remember your preference for Dark Mode or UI settings.
            </p>
          </div>
        </div>

        <footer className="pt-8 border-t-2 border-dashed border-black dark:border-white/20">
          <p className="text-xs font-black uppercase text-center text-gray-700 dark:text-gray-300">
            STAY SIMPLE, STAY PRIVATE, STAY BRUTAL.
          </p>
        </footer>
      </div>
    </div>
  );
};
