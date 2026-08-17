/**
 * 全局日志拦截器
 *
 * 统一在控制台打印所有 HTTP 请求的完整流转信息，包括：
 * - 请求进入：请求 ID、方法、路径、查询参数、请求体、用户信息、客户端 IP
 * - 请求返回：状态码、处理耗时、响应体摘要
 * - 异常发生：状态码、耗时、错误信息
 *
 * 输出采用 ANSI 着色，便于在终端中快速识别：
 * - 2xx 绿色 / 3xx 青色 / 4xx 黄色 / 5xx 红色
 * - 慢请求（>300ms）黄色 / 极慢（>1000ms）红色
 *
 * 敏感字段（password / token / idCard / phone 等）自动掩码为 ***
 */
import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomBytes } from 'crypto';

/** ANSI 转义码 */
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/** 需要掩码的敏感字段关键字（不区分大小写） */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'idcard',
  'phone',
  'creditcard',
  'cookie',
];

/** 跳过的路径前缀（静态资源、健康检查、文档） */
const SKIP_PREFIXES = ['/swagger', '/api/docs', '/favicon', '/health'];

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest();
    const response = http.getResponse();

    const method = request.method;
    const url: string = request.originalUrl || request.url;

    // 跳过静态资源和文档请求的日志，避免刷屏
    if (SKIP_PREFIXES.some((p) => url.startsWith(p))) {
      return next.handle();
    }

    const requestId = randomBytes(4).toString('hex');
    const query = request.query ?? {};
    const body = request.body ?? {};
    const ip = request.ip || request.connection?.remoteAddress || '-';
    const userAgent: string = request.get('user-agent') || '-';

    // 从 JWT 负载中提取用户信息（由 AuthGuard 注入到 request.user）
    const user = request.user;
    const userId = user?.userId ?? user?.id ?? user?.sub ?? '-';
    const accessLevel = user?.accessLevel ?? '-';

    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // ── 请求进入日志 ──
    this.printRequestLine({
      requestId,
      timestamp,
      method,
      url,
      query,
      body,
      ip,
      userAgent,
      userId,
      accessLevel,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;
          this.printResponseLine({ requestId, method, url, statusCode, duration, data });
        },
        error: (err: unknown) => {
          const statusCode =
            err instanceof Error && 'status' in err ? (err as { status: number }).status : 500;
          const duration = Date.now() - startTime;
          const message = err instanceof Error ? err.message : String(err);
          this.printErrorLine({ requestId, method, url, statusCode, duration, message });
        },
      }),
    );
  }

  /**
   * 打印请求进入日志
   */
  private printRequestLine(params: {
    requestId: string;
    timestamp: string;
    method: string;
    url: string;
    query: Record<string, unknown>;
    body: Record<string, unknown>;
    ip: string;
    userAgent: string;
    userId: string | number;
    accessLevel: string;
  }): void {
    const { requestId, timestamp, method, url, query, body, ip, userAgent, userId, accessLevel } =
      params;

    const lines: string[] = [];

    // 顶部装饰线 + 元信息
    lines.push(
      `${C.gray}┌──────────────────────────────────────────────────────────────${C.reset}`,
    );
    lines.push(
      `${C.gray}│${C.reset} ${C.cyan}▶ REQ${C.reset}  ${C.gray}${timestamp}${C.reset}  ${C.dim}[${requestId}]${C.reset}`,
    );
    lines.push(
      `${C.gray}│${C.reset} ${C.bold}${method.padEnd(7)}${C.reset}${C.blue}${url}${C.reset}`,
    );

    // 客户端信息行
    const uaShort = userAgent.length > 48 ? `${userAgent.substring(0, 48)}…` : userAgent;
    lines.push(
      `${C.gray}│${C.reset} ${C.dim}IP${C.reset} ${ip}  ${C.dim}User${C.reset} ${userId}${accessLevel !== '-' ? `(${accessLevel})` : ''}  ${C.dim}UA${C.reset} ${uaShort}`,
    );

    // 查询参数
    if (Object.keys(query).length > 0) {
      lines.push(`${C.gray}│${C.reset} ${C.dim}Query${C.reset} ${this.safeStringify(query)}`);
    }

    // 请求体（敏感字段掩码）
    if (Object.keys(body).length > 0) {
      lines.push(
        `${C.gray}│${C.reset} ${C.dim}Body${C.reset}  ${this.safeStringify(this.maskSensitive(body))}`,
      );
    }

    console.log(lines.join('\n'));
  }

  /**
   * 打印响应日志
   */
  private printResponseLine(params: {
    requestId: string;
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    data: unknown;
  }): void {
    const { requestId, method, url, statusCode, duration, data } = params;

    const statusColor = this.getStatusColor(statusCode);
    const durationColor = this.getDurationColor(duration);

    // 响应摘要：对象取前 3 个键，其它类型截断显示
    let summary = '';
    if (data !== undefined && data !== null) {
      if (typeof data === 'object') {
        const keys = Object.keys(data as object);
        summary =
          keys.length > 0
            ? `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? ', …' : ''}}`
            : '{}';
      } else {
        const str = String(data);
        summary = str.length > 60 ? `${str.substring(0, 60)}…` : str;
      }
    }

    const lines: string[] = [];
    lines.push(
      `${C.gray}│${C.reset} ${statusColor}${C.bold}◀ ${statusCode}${C.reset}  ${durationColor}${duration}ms${C.reset}  ${C.dim}${summary}${C.reset}`,
    );
    lines.push(
      `${C.gray}└──────────────────────────────────────────────────────────────${C.reset}`,
    );

    console.log(lines.join('\n'));
  }

  /**
   * 打印错误日志
   */
  private printErrorLine(params: {
    requestId: string;
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    message: string;
  }): void {
    const { requestId, statusCode, duration, message } = params;

    const lines: string[] = [];
    lines.push(
      `${C.gray}│${C.reset} ${C.red}${C.bold}✖ ${statusCode}${C.reset}  ${C.red}${duration}ms${C.reset}  ${C.red}${message}${C.reset}`,
    );
    lines.push(
      `${C.gray}└──────────────────────────────────────────────────────────────${C.reset}`,
    );

    console.error(lines.join('\n'));
  }

  /**
   * 根据状态码返回对应的 ANSI 颜色
   */
  private getStatusColor(statusCode: number): string {
    if (statusCode >= 500) return C.red;
    if (statusCode >= 400) return C.yellow;
    if (statusCode >= 300) return C.cyan;
    return C.green;
  }

  /**
   * 根据耗时返回对应的 ANSI 颜色（>1s 红 / >300ms 黄 / 其它绿）
   */
  private getDurationColor(duration: number): string {
    if (duration > 1000) return C.red;
    if (duration > 300) return C.yellow;
    return C.green;
  }

  /**
   * 将对象序列化为字符串，循环引用时降级为 [Unserializable]
   */
  private safeStringify(obj: unknown): string {
    try {
      return JSON.stringify(obj);
    } catch {
      return '[Unserializable]';
    }
  }

  /**
   * 递归掩码敏感字段
   * 匹配规则：键名包含 password / token / secret / authorization / idcard / phone / creditcard / cookie
   */
  private maskSensitive(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.maskSensitive(item));
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
        result[key] = '***';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.maskSensitive(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}
