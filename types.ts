
export interface ColorStimulus {
  id: string;
  name: string;
  hex: string;
  complementName: string;
  complementHex: string;
  description: string;
}

export interface ExperimentResult {
  id: string;
  participantId: string;
  timestamp: number;
  colorName: string;
  colorHex: string;
  stareDuration: number;
  persistenceDuration: number;
  aiInsight?: string;
  isSynced?: boolean;
}

export enum ExperimentPhase {
  IDLE = 'IDLE',
  CONFIGURING = 'CONFIGURING',
  STARING = 'STARING',
  PERSISTENCE = 'PERSISTENCE',
  RESULTS = 'RESULTS',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD'
}
