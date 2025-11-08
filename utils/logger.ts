// Centralized logging system for AI Story Weaver
// Provides structured logging, error tracking, and performance monitoring

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  stack?: string;
}

export interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxLocalStorageSize: number;
  enablePerformanceTracking: boolean;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private localStorageKey = 'ai-story-weaver-logs';
  private maxEntries = 1000;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: LogLevel.INFO,
      enableConsole: true,
      enableRemote: false,
      maxLocalStorageSize: 5 * 1024 * 1024, // 5MB
      enablePerformanceTracking: true,
      ...config,
    };

    this.sessionId = this.generateSessionId();

    // Clean up old logs on initialization
    this.cleanup();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.minLevel;
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    if (error) {
      entry.stack = error.stack;
    }

    return entry;
  }

  private async storeLocally(entry: LogEntry): Promise<void> {
    try {
      const existing = this.getLocalLogs();
      existing.push(entry);

      // Keep only the latest entries
      if (existing.length > this.maxEntries) {
        existing.splice(0, existing.length - this.maxEntries);
      }

      const logsString = JSON.stringify(existing);
      localStorage.setItem(this.localStorageKey, logsString);
    } catch (error) {
      console.warn('Failed to store log locally:', error);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.warn('Failed to send log to remote endpoint:', error);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const levelName = LogLevel[entry.level];
    const prefix = `[${entry.category}] ${levelName}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.data, entry.stack);
        break;
    }
  }

  private async log(
    level: LogLevel,
    category: string,
    message: string,
    data?: any,
    error?: Error
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, category, message, data, error);

    // Output to console
    this.outputToConsole(entry);

    // Store locally
    await this.storeLocally(entry);

    // Send to remote if enabled
    if (level >= LogLevel.ERROR) {
      await this.sendToRemote(entry);
    }
  }

  // Public logging methods
  async debug(category: string, message: string, data?: any): Promise<void> {
    await this.log(LogLevel.DEBUG, category, message, data);
  }

  async info(category: string, message: string, data?: any): Promise<void> {
    await this.log(LogLevel.INFO, category, message, data);
  }

  async warn(category: string, message: string, data?: any): Promise<void> {
    await this.log(LogLevel.WARN, category, message, data);
  }

  async error(category: string, message: string, error?: Error, data?: any): Promise<void> {
    await this.log(LogLevel.ERROR, category, message, data, error);
  }

  async fatal(category: string, message: string, error?: Error, data?: any): Promise<void> {
    await this.log(LogLevel.FATAL, category, message, data, error);
  }

  // Specialized logging methods for common use cases
  async performance(operation: string, duration: number, data?: any): Promise<void> {
    await this.info('Performance', `Operation "${operation}" took ${duration}ms`, {
      operation,
      duration,
      ...data,
    });
  }

  async apiCall(
    provider: string,
    model: string,
    duration: number,
    success: boolean,
    data?: any
  ): Promise<void> {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    await this.log(
      level,
      'API',
      `${provider}/${model} ${success ? 'succeeded' : 'failed'} in ${duration}ms`,
      {
        provider,
        model,
        duration,
        success,
        ...data,
      }
    );
  }

  async userAction(action: string, data?: any): Promise<void> {
    await this.info('UserAction', `User performed: ${action}`, {
      action,
      ...data,
    });
  }

  async errorBoundary(error: Error, errorInfo: any): Promise<void> {
    await this.error('ErrorBoundary', 'React Error Boundary triggered', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  // Log management
  getLocalLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async exportLogs(): Promise<string> {
    const logs = this.getLocalLogs();
    return JSON.stringify(logs, null, 2);
  }

  async clearLogs(): Promise<void> {
    localStorage.removeItem(this.localStorageKey);
  }

  private cleanup(): void {
    try {
      const logs = this.getLocalLogs();
      if (logs.length > this.maxEntries) {
        const trimmed = logs.slice(-this.maxEntries);
        localStorage.setItem(this.localStorageKey, JSON.stringify(trimmed));
      }
    } catch (error) {
      console.warn('Failed to cleanup logs:', error);
    }
  }

  // Performance tracking
  startTimer(label: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.performance(label, duration);
      return duration;
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current session info
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      config: this.config,
    };
  }
}

// Create singleton instance
let loggerInstance: Logger | null = null;

export function getLogger(config?: Partial<LoggerConfig>): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger(config);
  } else if (config) {
    loggerInstance.updateConfig(config);
  }
  return loggerInstance;
}

// Convenience functions for common logging scenarios
export const logger = {
  debug: (category: string, message: string, data?: any) =>
    getLogger().debug(category, message, data),

  info: (category: string, message: string, data?: any) =>
    getLogger().info(category, message, data),

  warn: (category: string, message: string, data?: any) =>
    getLogger().warn(category, message, data),

  error: (category: string, message: string, error?: Error, data?: any) =>
    getLogger().error(category, message, error, data),

  fatal: (category: string, message: string, error?: Error, data?: any) =>
    getLogger().fatal(category, message, error, data),

  performance: (operation: string, duration: number, data?: any) =>
    getLogger().performance(operation, duration, data),

  apiCall: (provider: string, model: string, duration: number, success: boolean, data?: any) =>
    getLogger().apiCall(provider, model, duration, success, data),

  userAction: (action: string, data?: any) => getLogger().userAction(action, data),

  errorBoundary: (error: Error, errorInfo: any) => getLogger().errorBoundary(error, errorInfo),

  time: (label: string) => getLogger().startTimer(label),

  export: () => getLogger().exportLogs(),
  clear: () => getLogger().clearLogs(),
};

// React hook for using logger in components
export function useLogger() {
  return {
    debug: (category: string, message: string, data?: any) => logger.debug(category, message, data),

    info: (category: string, message: string, data?: any) => logger.info(category, message, data),

    warn: (category: string, message: string, data?: any) => logger.warn(category, message, data),

    error: (category: string, message: string, error?: Error, data?: any) =>
      logger.error(category, message, error, data),

    performance: (operation: string, duration: number, data?: any) =>
      logger.performance(operation, duration, data),

    userAction: (action: string, data?: any) => logger.userAction(action, data),

    time: (label: string) => logger.time(label),
  };
}
