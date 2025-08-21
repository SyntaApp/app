import { type Service } from "../core/ServiceManager";
import debug from "../../constants/debug";

/**
 * Defines the severity/importance of log messages.
 * Higher numeric values indicate more severe log levels.
 */
export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

/**
 * Log scope type that defines the source of a log message.
 * Includes predefined common scopes and allows custom string values.
 */
export type LogScope = "app" | "renderer";

/**
 * Additional meta related to a log.
 * @example
 * ...catch(err) {
 *   logger.error("An error occurred while doing something", {error: err}) // err passed as additional meta
 * }
 */
export type Context = Record<string, unknown>;

/**
 * Represents a structured log entry..
 * Used for storing and transmitting log records across different parts of the application.
 */
export interface LogRecord {
  message: string;
  timestamp: string; // ISO timestamp
  level: LogLevel; // "DEBUG" | "INFO" | ...
  scope: LogScope; // Defaults to "app"
  ctx?: Context;
}

/**
 * Represents a log transports that handle the output of log records.
 * Transports determine where and how log messages are written (console, file, etc.).
 */
export type Transport = (rec: LogRecord) => void;

/**
 * # Logger
 *
 * Provides structured logging with levels, scopes, and formatting.
 */
export default class Logger implements Service {
  private transports: Transport[] = [];
  private isDebug = debug;

  constructor() {
    // Create transports arr - cant inline, console transport wont exist yet!
    this.transports = [this._consoleTransport];
  }

  public debug(msg: string, ctx?: Context) {
    this.route(LogLevel.DEBUG, msg, ctx);
  }
  public info(msg: string, ctx?: Context) {
    this.route(LogLevel.INFO, msg, ctx);
  }
  public warn(msg: string, ctx?: Context) {
    this.route(LogLevel.WARN, msg, ctx);
  }
  public error(msg: string, ctx?: Context) {
    this.route(LogLevel.ERROR, msg, ctx);
  }

  /**
   * Creates a sub logger used to auto apply certain pre-specified data.
   */
  public with(baseCtx: Context): Logger {
    const parent = this;

    const methods = ["info", "debug", "warn", "error"] as const;
    const methodMap = Object.fromEntries(
      methods.map((method) => [
        method,
        (...[m, c]: [string, Context]) =>
          parent[method](m, { ...baseCtx, ...c }),
      ])
    );

    return {
      ...parent,
      ...methodMap,
    } as Logger;
  }

  /**
   * Creates a performance span for timing operations.
   * Returns an object with an end method that logs the elapsed time.
   *
   * @example
   * ```typescript
   * const span = logger.startSpan('compile-swc', { file });
   * try {/* work * /} finally { span.end() }
   * ```
   */
  public startSpan(name: string, ctx?: Context) {
    const t0 = performance.now();
    const logger = this.with({ span: name, ...ctx });
    return {
      end: (more?: Context) => {
        const ms = +(performance.now() - t0).toFixed(2);
        logger.info(`${name} completed`, { ms, ...more });
        return ms;
      },
    };
  }

  /**
   * Formats a log and emits it to transports.
   */
  private route(level: LogLevel, message: string, ctx?: Context) {
    // Return if not in debug & log is debug
    if (level === LogLevel.DEBUG && !this.isDebug) return;

    const rec = this.format(level, message, ctx);
    this.emit(rec);
  }

  // Transport management
  public addTransport(t: Transport) {
    this.transports.push(t);
  }
  public removeTransport(t: Transport) {
    this.transports = this.transports.filter((x) => x !== t);
  }

  /**
   * Emits a log to transports.
   */
  private emit(rec: LogRecord) {
    for (const t of this.transports) t(rec);
  }

  // --------------- Helpers ------------------- //

  /**
   * Creates a log record from values.
   */
  private format(level: LogLevel, message: string, ctx?: Context): LogRecord {
    return {
      message,
      timestamp: new Date().toISOString(),
      level,
      scope: (ctx?.scope as LogScope) || "app",
      ctx,
    };
  }

  // -------------- Other --------------- //

  /**
   * Default console logging transport.
   * Should not be manually called internally or externally ever!
   */
  private _consoleTransport = (rec: LogRecord) => {
    const line = `[${rec.timestamp}] ${rec.message}`;
    const meta = rec.ctx ? rec.ctx : "";
    switch (rec.level) {
      case LogLevel.DEBUG:
        return console.debug(line, meta);
      case LogLevel.INFO:
        return console.log(line, meta);
      case LogLevel.WARN:
        return console.warn(line, meta);
      case LogLevel.ERROR:
        return console.error(line, meta);
    }
  };
}
