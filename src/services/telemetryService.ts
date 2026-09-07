/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AnalyticsEvent {
  eventName: string;
  category: string;
  userId?: string;
  timestamp: string;
  payload?: Record<string, any>;
}

class TelemetryService {
  private isProduction = process.env.NODE_ENV === 'production';
  private eventQueue: AnalyticsEvent[] = [];

  constructor() {
    this.initGlobalHandlers();
  }

  private initGlobalHandlers() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.reportError(event.error || new Error(event.message), {
          source: 'window.onerror',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.reportError(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          { source: 'window.onunhandledrejection' }
        );
      });
    }
  }

  log(level: LogLevel, category: string, message: string, details?: any) {
    const timestamp = new Date().toISOString();
    const formatted = `[SoccerBridge Telemetry] [${timestamp}] [${level.toUpperCase()}] [${category}]: ${message}`;

    if (level === 'error') {
      console.error(formatted, details || '');
    } else if (level === 'warn') {
      console.warn(formatted, details || '');
    } else if (!this.isProduction || level === 'info') {
      console.log(formatted, details || '');
    }
  }

  trackEvent(eventName: string, category: string, userId?: string, payload?: Record<string, any>) {
    const event: AnalyticsEvent = {
      eventName,
      category,
      userId,
      timestamp: new Date().toISOString(),
      payload,
    };

    this.eventQueue.push(event);
    this.log('info', `Analytics:${category}`, eventName, payload);

    if (this.eventQueue.length > 20) {
      this.flushEvents();
    }
  }

  reportError(error: Error, context?: Record<string, any>) {
    this.log('error', 'CrashReporter', error.message, {
      stack: error.stack,
      ...context,
    });
  }

  async measure<T>(label: string, asyncFn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await asyncFn();
      const duration = (performance.now() - start).toFixed(2);
      this.log('info', 'Performance', `${label} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = (performance.now() - start).toFixed(2);
      this.log('error', 'Performance', `${label} failed after ${duration}ms`, error);
      throw error;
    }
  }

  flushEvents() {
    if (this.eventQueue.length === 0) return;
    // Batch process or sync analytics
    this.log('info', 'Analytics', `Flushed ${this.eventQueue.length} analytics events`);
    this.eventQueue = [];
  }
}

export const telemetry = new TelemetryService();
