
export interface ContractAnalysis {
  status: 'fair' | 'irregular' | 'critical';
  interestRate: number;
  averageMarketRate: number;
  irregularities: Irregularity[];
  estimatedMonthlySavings: number;
  totalPotentialSavings: number;
  installmentsRemaining: number;
  currentInstallmentValue: number;
  legalArguments: string[];
}

export interface Irregularity {
  title: string;
  description: string;
  legalReference: string;
  impact: 'low' | 'medium' | 'high';
}

export enum AppStep {
  AUTH = 'auth',
  LANDING = 'landing',
  UPLOAD = 'upload',
  ANALYSIS = 'analysis',
  RESULTS = 'results',
  NEGOTIATION = 'negotiation'
}

export interface User {
  name: string;
  email: string;
  picture: string;
}

export type NegotiationStage = 'sac' | 'reclame-aqui' | 'consumidor-gov';

export interface UserSession {
  fileName?: string;
  fileData?: string;
  analysis?: ContractAnalysis;
  currentStage?: NegotiationStage;
}
