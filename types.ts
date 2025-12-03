export enum FileType {
  LOG = 'LOG',
  PCAP = 'PCAP',
  UNKNOWN = 'UNKNOWN',
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface TimelineEvent {
  timestamp: string;
  description: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface MitreItem {
  tactic: string; // e.g., "Initial Access"
  id: string;     // e.g., "T1190"
  name: string;   // e.g., "Exploit Public-Facing Application"
}

export interface AnalysisResult {
  threatScore: number;
  markdownReport: string;
  timeline: TimelineEvent[];
  mitreMapping: MitreItem[];
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview',
}