import React, { useState } from 'react';
import { X, Check, Copy, Sparkles, Shield } from 'lucide-react';

interface GetAnvilModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GetAnvilModal: React.FC<GetAnvilModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'developer' | 'webstore'>('developer');

  if (!isOpen) return null;

  const handleCopyPath = () => {
    navigator.clipboard.writeText('c:\\Users\\Admin\\OneDrive\\Desktop\\Anvil\\frontend\\dist');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#171717] border border-[#2D2D2D] shadow-2xl p-6 md:p-7 text-left overflow-hidden">
        
        {/* Subtle Ambient Coral Backlight */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B5A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1F1F1F] border border-[#FF6B5A]/30 p-1.5 flex items-center justify-center">
              <img src="/icons/a-logo.png" alt="Anvil" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F5F5F5]">Install Anvil</h3>
              <p className="text-xs text-[#A7A7A7]">Manifest V3 Learning Assistant for Chrome</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#222222] hover:bg-[#2C2C2C] text-[#A7A7A7] hover:text-[#F5F5F5] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#121212] p-1 my-5 border border-[#262626]">
          <button
            type="button"
            onClick={() => setActiveTab('developer')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'developer'
                ? 'bg-[#222222] text-[#F5F5F5] shadow-xs'
                : 'text-[#737373] hover:text-[#A7A7A7]'
            }`}
          >
            Developer Mode (Instant)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('webstore')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === 'webstore'
                ? 'bg-[#222222] text-[#F5F5F5] shadow-xs'
                : 'text-[#737373] hover:text-[#A7A7A7]'
            }`}
          >
            Chrome Web Store
          </button>
        </div>

        {/* Tab Content 1: Developer Mode */}
        {activeTab === 'developer' ? (
          <div className="space-y-4 text-xs text-[#A7A7A7]">
            <p className="leading-relaxed">
              Your extension frontend is built and ready in this repository. Follow these quick steps to load it into Google Chrome:
            </p>

            <ol className="space-y-3 font-normal">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#262626] text-[#FF6B5A] font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <span>
                  Open Chrome and navigate to <code className="text-[#FF6B5A] font-mono bg-[#111111] px-1.5 py-0.5 rounded border border-[#262626]">chrome://extensions</code>
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#262626] text-[#FF6B5A] font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <span>
                  Toggle <strong>Developer mode</strong> in the top-right corner.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#262626] text-[#FF6B5A] font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <span>
                  Click <strong>Load unpacked</strong> and select your built extension directory:
                </span>
              </li>
            </ol>

            {/* Folder Path with Copy Button */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#111111] border border-[#2A2A2A] font-mono text-[11px] text-[#F5F5F5]">
              <span className="truncate mr-2">Anvil/frontend/dist</span>
              <button
                type="button"
                onClick={handleCopyPath}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222222] hover:bg-[#2A2A2A] text-xs text-[#A7A7A7] hover:text-[#F5F5F5] transition cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#27C93F]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#1B1B1B] border border-[#2A2A2A] flex items-center gap-2.5 text-[11px] text-[#A7A7A7]">
              <Sparkles className="w-4 h-4 text-[#FF6B5A] shrink-0" />
              <span>Anvil will instantly pin to your Chrome toolbar and open via side panel or content rail!</span>
            </div>
          </div>
        ) : (
          /* Tab Content 2: Chrome Web Store */
          <div className="space-y-4 text-center py-4 text-xs text-[#A7A7A7]">
            <div className="w-12 h-12 rounded-2xl bg-[#1F1F1F] border border-[#2E2E2E] mx-auto flex items-center justify-center text-[#FF6B5A]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#F5F5F5]">Chrome Web Store Listing</h4>
              <p className="mt-1 max-w-sm mx-auto leading-relaxed">
                Anvil is currently packaged with Manifest V3 and ready for store submission. Download and load unpacked locally right now to experience full functionality.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('developer')}
                className="px-5 py-2 rounded-full bg-[#FF6B5A] text-[#111111] font-bold text-xs shadow-coral hover:bg-[#FF7A6A] transition cursor-pointer"
              >
                Switch to Load Unpacked Guide
              </button>
            </div>
          </div>
        )}

        {/* Bottom Done Button */}
        <div className="mt-6 pt-4 border-t border-[#262626] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#F5F5F5] font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
