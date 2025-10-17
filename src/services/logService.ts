interface LogEntry {
  timestamp: string;
  message: string;
  type: 'generation' | 'processing' | 'reset' | 'info';
}

class LogService {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  addLog(message: string, type: LogEntry['type'] = 'info') {
    const log: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    
    this.logs.push(log);
    
    // Keep only last 100 logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    console.log(`[${log.timestamp}] ${message}`);
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logService = new LogService();