export interface PsychrometricData {
  dryTemp: number;
  wetTemp: number;
  isPsychrometer: boolean;
  confidence?: number;
}

export interface CalculationResult extends PsychrometricData {
  relativeHumidity: number;
  dewPoint?: number;
}

export interface TrainingExample {
  id: string;
  timestamp: number;
  imageUrl: string; // Base64
  correctedDry: number;
  correctedWet: number;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}