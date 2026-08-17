/**
 * API 请求监控拦截器
 *
 * 全局拦截所有 HTTP 请求，将请求信息异步写入数据库。
 * 采用「先响应后写入」策略，不阻塞请求处理。
 */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiMonitorService } from '../modules/api-monitor/api-monitor.service';
import { SessionService } from '../modules/session/session.service';
import { AccessLevel } from '../access-level.enum';
import { getBearerTokenFromRequestSafe } from '../auth-token';

/** 最大截断长度 */
const MAX_BODY_LEN = 2048;
const MAX_ERROR_LEN = 500;
const MAX_UA_LEN = 300;

/** 不需要监控的路径前缀 */
const SKIP_PREFIXES = [
  '/swagger',
  '/api/docs',
  '/images/',
  '/favicon',
];

function shouldSkip(url: string): boolean {
  return SKIP_PREFIXES.some((p) => url.startsWith(p));
}

function truncate(str: string | null | undefined, max: number): string | undefined {
  if (!str) return undefined;
  return str.length > max ? str.slice(0, max) : str;
}

function estimateSize(data: unknown): number {
  if (!data) return 0;
  try {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  } catch {
    return 0;
  }
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? '';
}

@Injectable()
export class ApiMonitorInterceptor implements NestInterceptor {
  constructor(
    private readonly monitorService: ApiMonitorService,
    private readonly sessionService: SessionService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const startTime = Date.now();
    const method = request.method;
    const url = request.url;

    // 跳过不需要监控的路径
    if (shouldSkip(url)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.recordLog(context, request, response, duration, undefined, data, method, url);
        },
        error: (err: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode =
            err && typeof err === 'object' && 'status' in err
              ? (err as { status: number }).status
              : 500;
          const message =
            err instanceof Error ? err.message : String(err);

          // 设置响应状态码（错误情况下可能未设置）
          if (!response.statusCode || response.statusCode < 400) {
            response.status(statusCode);
          }

          this.recordLog(
            context,
            request,
            response,
            duration,
            truncate(message, MAX_ERROR_LEN),
            null,
            method,
            url,
          );
        },
      }),
    );
  }

  private recordLog(
    context: ExecutionContext,
    request: Request,
    response: Response,
    duration: number,
    errorMessage: string | undefined,
    responseData: unknown,
    method: string,
    url: string,
  ) {
    // 提取用户信息
    let userId: string | null = null;
    let accessLevel: string | null = null;

    let sessionId: string | null = null;

    try {
      const token = getBearerTokenFromRequestSafe(request);
      if (token) {
        const { verifyAuthToken } = require('../auth-token');
        const payload = verifyAuthToken(token);
        userId = payload.sub;
        accessLevel = payload.role;
        sessionId = payload.sessionId;
      }
    } catch {
      // 未认证请求，userId 和 accessLevel 保持 null
    }

    // 刷新会话活跃 TTL + 记录用户最新会话（异步，不阻塞）
    if (sessionId) {
      this.sessionService.touch(sessionId).catch(() => {});
      if (userId) {
        this.sessionService.recordUserSession(userId, sessionId).catch(() => {});
      }
    }

    // 如果没有从 token 获取到 accessLevel，尝试从路由元数据获取
    if (!accessLevel) {
      accessLevel =
        this.reflector.get<string>('accessLevel', context.getHandler()) ?? null;
    }

    // 估算响应体大小
    const responseSize = estimateSize(responseData);

    // 获取 handler 名称
    const handlerName = `${context.getClass().name}.${context.getHandler().name}`;

    const queryStr = Object.keys(request.query).length > 0
      ? JSON.stringify(request.query)
      : undefined;

    const bodyStr = request.body && Object.keys(request.body).length > 0
      ? truncate(JSON.stringify(request.body), MAX_BODY_LEN)
      : undefined;

    this.monitorService.record({
      method,
      url: truncate(url, 500),
      requestPath: truncate(request.path, 300),
      queryParams: queryStr,
      requestBody: bodyStr,
      statusCode: response.statusCode,
      duration,
      success: response.statusCode >= 200 && response.statusCode < 400,
      errorMessage,
      accessLevel,
      userId,
      clientIp: getClientIp(request),
      userAgent: truncate(request.headers['user-agent'] ?? null, MAX_UA_LEN),
      requestSize: estimateSize(request.body),
      responseSize,
      handlerName: truncate(handlerName, 100),
    });
  }
}
