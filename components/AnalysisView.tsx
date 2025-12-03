import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Terminal, Clock, Shield, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AnalysisResult, MitreItem, TimelineEvent } from '../types';

interface AnalysisViewProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
}

const TACTIC_ORDER = [
  "Reconnaissance",
  "Resource Development",
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Command and Control",
  "Exfiltration",
  "Impact"
];

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis, isAnalyzing }) => {
  // Mock data fallback if analysis is null (though normally we show loading state)
  const score = analysis?.threatScore || 0;
  
  // Calculate stats for the chart based on the timeline if available, otherwise mock
  const timelineStats = analysis?.timeline.reduce((acc, event) => {
    const sev = event.severity === 'INFO' ? 'Info' : 
                event.severity === 'LOW' ? 'Warn' : 
                event.severity === 'MEDIUM' ? 'Warn' :
                event.severity === 'HIGH' ? 'Error' : 'Critical';
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { name: 'Info', count: timelineStats?.['Info'] || 0, color: '#3f3f46' },
    { name: 'Warn', count: timelineStats?.['Warn'] || 0, color: '#fbbf24' },
    { name: 'Error', count: timelineStats?.['Error'] || 0, color: '#f87171' },
    { name: 'Critical', count: timelineStats?.['Critical'] || 0, color: '#ef4444' },
  ];

  // Group MITRE techniques by tactic
  const groupedMitre = analysis?.mitreMapping.reduce((acc, item) => {
    if (!acc[item.tactic]) acc[item.tactic] = [];
    acc[item.tactic].push(item);
    return acc;
  }, {} as Record<string, MitreItem[]>) || {};

  // Sort tactics by standard Kill Chain order
  const sortedTactics = Object.keys(groupedMitre).sort((a, b) => {
    const idxA = TACTIC_ORDER.findIndex(t => t.toLowerCase() === a.toLowerCase());
    const idxB = TACTIC_ORDER.findIndex(t => t.toLowerCase() === b.toLowerCase());
    // If not found in known list, append to end
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  const getSeverityColor = (sev: string) => {
    switch(sev) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-black';
      case 'LOW': return 'bg-blue-500 text-white';
      default: return 'bg-zinc-700 text-zinc-300';
    }
  };

  const getSeverityDot = (sev: string) => {
    switch(sev) {
      case 'CRITICAL': return 'bg-red-500 border-red-900';
      case 'HIGH': return 'bg-orange-500 border-orange-900';
      case 'MEDIUM': return 'bg-yellow-500 border-yellow-900';
      case 'LOW': return 'bg-blue-500 border-blue-900';
      default: return 'bg-zinc-600 border-zinc-900';
    }
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-zinc-400 space-y-4 animate-pulse">
        <Activity className="w-12 h-12 text-emerald-500 animate-spin" />
        <div className="text-lg font-mono">Running Heuristic Analysis...</div>
        <div className="text-sm">Querying Knowledge Base...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
        <Terminal className="w-12 h-12 mb-4 opacity-50" />
        <p>Ready to analyze. Upload a file to begin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center items-center shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent group-hover:from-emerald-500/10 transition-all" />
          <h3 className="text-zinc-400 text-sm uppercase tracking-wider mb-2 font-semibold">Threat Score</h3>
          <div className={`text-5xl font-black ${score > 75 ? 'text-red-500' : score > 40 ? 'text-yellow-500' : 'text-emerald-500'}`}>
            {score}
          </div>
          <div className="text-xs text-zinc-600 mt-2 font-mono">CONFIDENCE: HIGH</div>
        </div>

        <div className="md:col-span-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-lg">
           <h3 className="text-zinc-400 text-sm uppercase tracking-wider mb-2 font-semibold">Event Severity Distribution</h3>
           <div className="h-24">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{fill: '#71717a', fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px'}}
                    itemStyle={{color: '#e4e4e7'}}
                    cursor={{fill: '#27272a'}}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analysis Text (Left Column) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Analyst Report
              </h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                AI GENERATED
              </span>
            </div>
            <div className="prose prose-invert prose-sm max-w-none font-mono text-zinc-300">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-emerald-400 mt-6 mb-4 border-b border-emerald-500/20 pb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold text-emerald-400 mt-6 mb-3 uppercase tracking-wide" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-bold text-emerald-300 mt-4 mb-2" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-yellow-400 font-bold" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-2 ml-2" {...props} />,
                  li: ({node, ...props}) => <li className="pl-2" {...props} />,
                  code: ({node, ...props}) => <code className="bg-zinc-800 text-emerald-200 px-1 py-0.5 rounded text-xs" {...props} />,
                  pre: ({node, ...props}) => <pre className="bg-black/50 border border-zinc-800 p-4 rounded-lg overflow-x-auto my-4 text-xs text-zinc-400" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                }}
              >
                {analysis.markdownReport}
              </ReactMarkdown>
            </div>
          </div>
          
           {/* MITRE ATT&CK Timeline Flow */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
               <Shield className="w-5 h-5 text-emerald-400" />
               <h2 className="text-lg font-semibold text-emerald-400">MITRE ATT&CK® Kill Chain Flow</h2>
            </div>
            
            {sortedTactics.length === 0 ? (
               <div className="text-zinc-500 text-center py-8 text-sm italic">No MITRE techniques mapped.</div>
            ) : (
              <div className="relative">
                <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900/50">
                  {sortedTactics.map((tactic, index) => {
                    const techniques = groupedMitre[tactic];
                    const isLast = index === sortedTactics.length - 1;
                    
                    return (
                      <div key={tactic} className="flex items-center shrink-0">
                         {/* Card */}
                         <div className="w-64 bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex flex-col h-full min-h-[140px] hover:border-emerald-500/30 transition-colors shadow-lg">
                           <div className="mb-2 pb-2 border-b border-zinc-800/50 flex justify-between items-center">
                             <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider truncate">{tactic}</h3>
                             <span className="text-[10px] text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded">{index + 1}</span>
                           </div>
                           
                           <div className="flex-1 space-y-2 overflow-y-auto max-h-[150px] scrollbar-thin">
                              {techniques.map((tech) => (
                                <div key={tech.id} className="bg-zinc-900/50 border border-zinc-800/50 p-2 rounded text-xs">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-mono bg-emerald-900/20 text-emerald-400 px-1 rounded border border-emerald-500/10">
                                      {tech.id}
                                    </span>
                                  </div>
                                  <div className="text-zinc-400 leading-tight">{tech.name}</div>
                                </div>
                              ))}
                           </div>
                         </div>
                         
                         {/* Connector Arrow */}
                         {!isLast && (
                           <div className="mx-2 text-zinc-700">
                             <ArrowRight className="w-5 h-5" />
                           </div>
                         )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-[10px] text-zinc-600 mt-2 italic">
                  Techniques detected across the attack lifecycle
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Actions */}
        <div className="space-y-6">
          {/* Timeline Module */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-800">
               <Clock className="w-5 h-5 text-emerald-400" />
               <h2 className="text-lg font-semibold text-emerald-400">Attack Timeline</h2>
            </div>
            
            <div className="relative border-l-2 border-zinc-800 ml-3 space-y-6 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
              {analysis.timeline && analysis.timeline.length > 0 ? (
                analysis.timeline.map((event, idx) => (
                  <div key={idx} className="ml-6 relative">
                    <span className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 ${getSeverityDot(event.severity)} shadow-[0_0_10px_rgba(0,0,0,0.5)] bg-zinc-900`}></span>
                    <div className="flex flex-col">
                      <span className="text-xs font-mono text-zinc-500 mb-1">{event.timestamp}</span>
                      <p className="text-sm text-zinc-300">{event.description}</p>
                      <span className={`text-[10px] font-bold mt-1 w-fit px-1.5 rounded ${getSeverityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="ml-6 text-zinc-500 text-sm italic">No specific timeline events extracted.</div>
              )}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
             <h3 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">Quick Actions</h3>
             <div className="space-y-3">
               <button className="w-full flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 transition-colors group">
                 <span className="text-sm">Export JSON Report</span>
                 <Terminal className="w-4 h-4 text-zinc-600 group-hover:text-emerald-500" />
               </button>
               <button className="w-full flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 transition-colors group">
                 <span className="text-sm">Flag for Tier 4 Review</span>
                 <AlertTriangle className="w-4 h-4 text-zinc-600 group-hover:text-yellow-500" />
               </button>
               <button className="w-full flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg hover:border-emerald-500/50 hover:text-emerald-400 transition-colors group">
                 <span className="text-sm">Mark as False Positive</span>
                 <CheckCircle className="w-4 h-4 text-zinc-600 group-hover:text-green-500" />
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;