import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import AnalysisView from './components/AnalysisView';
import { Upload, FileText, AlertCircle, Play, Clipboard, Trash2 } from 'lucide-react';
import { GeminiModel, AnalysisResult } from './types';
import { analyzeLogData } from './services/geminiService';
import { readFileContent, detectFileType } from './utils/fileParsers';

const DEFAULT_SYSTEM_PROMPT = `You are a Tier 3 SOC Analyst (Security Operations Center). 
Your task is to analyze the provided security log data or packet summary and output the results in the specified JSON format.

1. **Threat Score**: Calculate a numeric score (0-100) based on the severity of threats found.
2. **Timeline**: Extract a chronological timeline of significant events.
   - LIMIT to the top 20 most critical events to ensure valid JSON output.
   - Keep descriptions concise (under 15 words).
3. **MITRE Mapping**: Map observed behaviors to specific MITRE ATT&CK Tactics and Techniques (e.g., T1190, T1078).
4. **Markdown Report**: Write a human-readable report for the 'markdownReport' field. 
   - Use Markdown headers (##) for sections: "Executive Summary", "Detected Threats", "Technical Details", "Recommended Remediation".
   - In the "Detected Threats" section, bold the threat name and severity (e.g., **CRITICAL: SQL Injection**).
   - Keep the text professional, technical, and actionable.
   - Be concise. Avoid fluff.

Identify anomalies like Brute Force, SQLi, C2 beacons, XSS, or Buffer Overflows. If input is binary/PCAP, look for magic bytes or cleartext signatures.`;

const App: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(GeminiModel.FLASH);
  
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  
  // File Upload State
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  // Paste Input State
  const [pastedContent, setPastedContent] = useState<string>('');

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
    setFileType(detectFileType(file.name));
    setAnalysisResult(null);
    
    try {
      // For demo purposes, we limit large files to first 50KB to avoid token limits
      const content = await readFileContent(file);
      const truncatedContent = content.slice(0, 50000); 
      setFileContent(truncatedContent);
    } catch (err) {
      setError("Failed to read file. Please try another file.");
      console.error(err);
    }
  };

  const handleClear = () => {
    setAnalysisResult(null);
    setError(null);
    
    if (inputMode === 'upload') {
      setFileContent(null);
      setFileName(null);
      setFileType(null);
      // Reset the input value so the same file can be selected again if desired
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
      setPastedContent('');
    }
  };

  const handleAnalyze = async () => {
    const contentToAnalyze = inputMode === 'upload' ? fileContent : pastedContent;

    if (!contentToAnalyze || contentToAnalyze.trim().length === 0) {
      setError(inputMode === 'upload' ? "Please upload a file first." : "Please paste some text to analyze.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeLogData(contentToAnalyze, selectedModel, systemPrompt);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setError("Analysis failed. Ensure your API Key is valid and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-black font-sans selection:bg-emerald-500/30">
      <Sidebar 
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        onResetSystemPrompt={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
      
      <main className="ml-80 flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex justify-between items-end border-b border-zinc-800 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Threat Intelligence Dashboard</h2>
              <p className="text-zinc-400">Upload security artifacts or paste logs for automated AI inspection.</p>
            </div>
          </header>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Method Tabs */}
          <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-lg w-fit border border-zinc-800">
            <button
              onClick={() => { setInputMode('upload'); setError(null); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                inputMode === 'upload' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>File Upload</span>
            </button>
            <button
              onClick={() => { setInputMode('paste'); setError(null); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                inputMode === 'paste' 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clipboard className="w-4 h-4" />
              <span>Paste Text</span>
            </button>
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            {inputMode === 'upload' ? (
              <div className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-xl p-8 transition-colors hover:bg-zinc-900 hover:border-emerald-500/50 group">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    accept=".log,.txt,.csv,.json,.pcap,.pcapng"
                  />
                  
                  {!fileName ? (
                    <>
                      <div className="p-4 bg-zinc-950 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-8 h-8 text-zinc-500 group-hover:text-emerald-500" />
                      </div>
                      <div className="text-center">
                        <label htmlFor="file-upload" className="cursor-pointer text-emerald-400 hover:text-emerald-300 font-medium">
                          Click to upload
                        </label>
                        <span className="text-zinc-500"> or drag and drop</span>
                        <p className="text-xs text-zinc-600 mt-2">Supports LOG, TXT, CSV, PCAP (Text extraction)</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-4 w-full justify-between bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <FileText className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{fileName}</div>
                          <div className="text-xs text-zinc-500 uppercase tracking-wider">{fileType}</div>
                        </div>
                      </div>
                      <label htmlFor="file-upload" className="text-xs text-zinc-400 hover:text-white cursor-pointer underline">
                        Change File
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                <textarea 
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  placeholder="Paste raw logs, HTTP headers, or suspicious strings here..."
                  className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                  spellCheck={false}
                />
                <div className="absolute bottom-4 right-4 text-xs text-zinc-600">
                  {pastedContent.length} chars
                </div>
              </div>
            )}

            {/* Analyze Button & Preview (Upload Mode Only) */}
            <div className="flex flex-col space-y-4">
               {/* Show preview ONLY if in upload mode and file is selected */}
               {inputMode === 'upload' && fileContent && !analysisResult && (
                 <div className="space-y-2">
                   <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">File Content Preview (First 50KB)</h3>
                   <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-500 overflow-x-auto h-48 whitespace-pre-wrap scrollbar-thin">
                     {fileContent}
                   </div>
                 </div>
               )}

               {/* Action Bar */}
               <div className="flex justify-end pt-2 space-x-3">
                 <button
                   onClick={handleClear}
                   disabled={isAnalyzing}
                   className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear {inputMode === 'upload' ? 'File' : 'Text'}</span>
                 </button>

                 <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || (inputMode === 'upload' ? !fileContent : !pastedContent)}
                    className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center space-x-2">
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                         <span>Analyzing Artifacts...</span>
                      </span>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Analyze for Threats</span>
                      </>
                    )}
                  </button>
               </div>
            </div>
          </div>

          {/* Analysis Result */}
          <AnalysisView analysis={analysisResult} isAnalyzing={isAnalyzing} />

        </div>
      </main>
    </div>
  );
};

export default App;