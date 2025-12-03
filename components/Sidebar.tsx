import React from 'react';
import { Settings, ShieldAlert, Cpu, RotateCcw } from 'lucide-react';
import { GeminiModel } from '../types';

interface SidebarProps {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  onResetSystemPrompt: () => void;
  selectedModel: GeminiModel;
  setSelectedModel: (model: GeminiModel) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  systemPrompt,
  setSystemPrompt,
  onResetSystemPrompt,
  selectedModel,
  setSelectedModel
}) => {
  return (
    <aside className="w-80 bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <ShieldAlert className="w-8 h-8 text-emerald-500" />
        <h1 className="text-xl font-bold tracking-wider text-emerald-500">LOG<span className="text-white">WHISPERER</span></h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className="flex items-center space-x-2 text-sm font-semibold text-zinc-400 mb-2">
            <Cpu className="w-4 h-4" />
            <span>Analysis Engine</span>
          </label>
          <div className="space-y-2">
             <button
              onClick={() => setSelectedModel(GeminiModel.FLASH)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                selectedModel === GeminiModel.FLASH
                  ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-medium">Gemini 2.5 Flash</div>
              <div className="text-xs opacity-70 mt-1">Fast inference for real-time log parsing.</div>
            </button>
            <button
              onClick={() => setSelectedModel(GeminiModel.PRO)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                selectedModel === GeminiModel.PRO
                  ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-medium">Gemini 3 Pro</div>
              <div className="text-xs opacity-70 mt-1">Deep reasoning for complex attack vectors.</div>
            </button>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2 text-sm font-semibold text-zinc-400 mb-2">
            <Settings className="w-4 h-4" />
            <span>System Persona</span>
          </label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-none font-mono"
            placeholder="Define the AI analyst persona..."
          />
          <div className="flex justify-between items-start mt-2">
            <p className="text-xs text-zinc-500 flex-1 mr-2">
              Override instructions to tailor the analysis style.
            </p>
            <button 
              onClick={onResetSystemPrompt}
              className="flex items-center space-x-1 text-xs text-emerald-500 hover:text-emerald-400 transition-colors whitespace-nowrap"
              title="Reset to default prompt"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Default</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-6 border-t border-zinc-800">
        <div className="flex items-center space-x-2 text-xs text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>System Operational</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;