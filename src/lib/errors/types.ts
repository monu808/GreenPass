export enum ErrorType {
  FORM = 'FORM',
  DATA_FETCH = 'DATA_FETCH',
  CHART = 'CHART',
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: Error | unknown;
  timestamp: number;
  componentStack?: string;
  component?: string;
  operation?: string;
}

export interface ErrorRecoveryAction {
  label: string;
  onClick: () => void | Promise<void>;
  primary?: boolean;
}
