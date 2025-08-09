import { ReqService, type Service } from "../core/ServiceManager";

/**
 * Log scope type that defines the source of a log message.
 * Includes predefined common scopes and allows custom string values.
 */
export type LogScope =
  | "app"
  | "ipc"
  | "window"
  | "security"
  | "crash"
  | (string & {});

/**
 * What level the log is.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Extra context to provide allong with the log message.
 * E.G: Erroring when there is a malformed obj and providing the obj as ctx.
 */
export interface LogContext {
  [k: string]: unknown;
}

/**
 * Represents a structured log entry with timestamp, level, message, and optional metadata.
 * Used for storing and transmitting log records across different parts of the application.
 */
export interface LogRecord {
  ts: string; // ISO timestamp
  lvl: LogLevel; // "DEBUG" | "INFO" | ...
  msg: string;
  scope?: LogScope;
  ctx?: LogContext; // extra context/meta
  pid?: number;
  proc?: "browser" | "renderer" | "worker";
  winId?: number; // when available
}

type Transport = (rec: LogRecord) => void;

/**
 * # Logger
 *
 * Provides structured logging with levels, scopes, and enhanced formatting.
 * Wraps the existing logging methods from App.ts with additional functionality.
 */
export default class Logger implements Service {
  private transports: Transport[];

  constructor(public readonly isDebug: boolean) {
    // Create transports arr - cant inline, cnsl transport wont exist yet!
    this.transports = [this._consoleTransport];
  }

  public init() {}

  /**
   * Creates a sub logger used to aply
   * @param baseMeta - A base obejct of meta data to apply to each log.
   */
  public with(scope: LogScope, baseCtx?: LogContext): Logger {
    const parent = this;

    type DefParams = [string, LogContext];
    return {
      ...parent,
      info(...[m, c]: DefParams) {
        parent.info(m, { ...baseCtx, ...c, scope });
      },
      debug(...[m, c]: DefParams) {
        parent.debug(m, { ...baseCtx, ...c, scope });
      },
      warn(...[m, c]: DefParams) {
        parent.warn(m, { ...baseCtx, ...c, scope });
      },
      error(...[m, err]: [string, any]) {
        parent.error(m, { ...err?.ctx, scope });
      },
    } as Logger;
  }

  public debug(msg: string, ctx: LogContext) {
    this.route(LogLevel.DEBUG, msg, ctx);
  }
  public info(msg: string, ctx: LogContext) {
    this.route(LogLevel.INFO, msg, ctx);
  }
  public warn(msg: string, ctx: LogContext) {
    this.route(LogLevel.WARN, msg, ctx);
  }
  public error(msg: string, err?: unknown & LogContext) {
    // Essentially sanitise err
    const ctx =
      typeof err === "object"
        ? (err as LogContext)
        : { detail: this.safeValue(err) };

    this.route(LogLevel.ERROR, msg, ctx);
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
  public startSpan(name: string, ctx?: LogContext) {
    const t0 = performance.now();
    const logger = this.with("perf", { span: name, ...ctx });
    return {
      end: (more?: LogContext) => {
        const ms = +(performance.now() - t0).toFixed(2);
        logger.info(`${name} completed`, { ms, ...more });
        return ms;
      },
    };
  }

  /**
   * Routes a new log.
   */
  private route(level: LogLevel, message: string, ctx?: LogContext) {
    // Return if not in debug & log is debug
    if (level === LogLevel.DEBUG && !this.debug) return;

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
   * Emits a log to all transports.
   */
  private emit(rec: LogRecord) {
    for (const t of this.transports) t(rec);
  }

  // --------------- Helpers ------------------- //

  /**
   * Creates a proper log from values.
   */
  private format(lvl: LogLevel, message: string, ctx?: LogContext): LogRecord {
    return {
      ts: new Date().toISOString(),
      lvl,
      msg: message,
      scope: (ctx?.scope as LogScope) || undefined,
      ctx,
      pid: process.pid,
      proc: (process as any).type ?? "browser",
    };
  }

  /**
   * Safely converts any value to a JSON-serializable format.
   * Handles Error objects by extracting their properties and provides
   * fallback string conversion for non-serializable values.
   */
  private safeValue(v: unknown) {
    if (v instanceof Error)
      return { name: v.name, message: v.message, stack: v.stack };
    try {
      JSON.stringify(v);
      return v;
    } catch {
      return String(v);
    }
  }

  // -------------- Other --------------- //

  /**
   * Default console logging transport.
   * Should not be manually called internally or externally ever!
   */
  private _consoleTransport = (rec: LogRecord) => {
    // todo: improve cnsl transport
    // support prod & dev logs.

    const line = `[Synta:${rec.lvl}] ${rec.msg}`;
    const meta = rec.ctx ? rec.ctx : "";
    switch (rec.lvl) {
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
