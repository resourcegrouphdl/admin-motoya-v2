// ====================================================================
// INTERFACES DE AUDITORÍA Y LOGGING
// ====================================================================

import { ActionType } from "./enums";

export interface IAuditLog {
  id: string;
  userId: string;
  action: ActionType;
  details: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export interface IUserSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  lastActivity: Date;
}
