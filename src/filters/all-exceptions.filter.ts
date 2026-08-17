import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ExceptionFilter,
} from '@nestjs/common';

/**
 * 全局异常响应体结构
 */
interface ErrorResponse {
  /** HTTP 状态码 */
  statusCode: number;
  /** 错误时间戳 */
  timestamp: string;
  /** 请求路径 */
  path: string;
  /** 错误类型标识 */
  error: string;
  /** 人类可读的错误描述 */
  message: string;
  /** 字段级验证错误详情（仅在存在时返回） */
  details?: Record<string, string[]>;
}

/**
 * 全局异常过滤器
 *
 * 捕获应用中所有未处理的异常，统一格式化后返回给客户端。
 * 核心职责：
 * 1. 将 NestJS HTTP 异常（如 BadRequestException、NotFoundException）转换为标准响应体
 * 2. 将 class-validator 字段级验证错误扁平化为 `details` 对象
 * 3. 将未知异常（如服务层抛出的 Error）包装为 500 响应，但生产环境隐藏堆栈
 * 4. 统一写入日志
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const statusCode = this.resolveStatus(exception);
    const { message, error, details } = this.resolveBody(exception, statusCode);

    const body: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
      ...(details && Object.keys(details).length > 0 ? { details } : {}),
    };

    // 开发环境输出完整异常日志；生产环境不泄露内部堆栈
    const isDev = process.env.NODE_ENV !== 'production';
    if (statusCode >= 500 || isDev) {
      this.logger.error(
        `${request.method} ${request.url} → ${statusCode}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // 如果响应已经发送（如流式响应中途出错），避免重复写入
    if (!response.headersSent) {
      response.status(statusCode).json(body);
    }
  }

  /**
   * 根据异常类型解析 HTTP 状态码
   */
  private resolveStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * 根据异常类型解析响应体字段
   *
   * 对 class-validator 产生的 BadRequestException 做特殊处理：
   * - 将 ValidationError[] 数组扁平化为 { fieldName: [message1, message2] } 对象
   * - 收集所有字段错误到一个 `details` 字段中
   */
  private resolveBody(
    exception: unknown,
    statusCode: number,
  ): { message: string; error: string; details?: Record<string, string[]> } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse() as
        | string
        | { error?: string; message?: unknown; statusCode?: number };

      if (typeof res === 'string') {
        return { message: res, error: exception.name };
      }

      const rawMessage = res.message;

      // class-validator 验证失败时 message 为 ValidationError[] 数组
      if (Array.isArray(rawMessage) && rawMessage.length > 0) {
        const firstError = rawMessage[0];
        // 确认是验证错误对象（含 constraints 或 children）
        if (
          typeof firstError === 'object' &&
          firstError !== null &&
          ('constraints' in firstError || 'property' in firstError)
        ) {
          const details = this.flattenValidationErrors(rawMessage);
          return {
            message: '请求参数校验失败',
            error: 'BadRequestException',
            details,
          };
        }
      }

      // 普通字符串数组消息（如 forbidNonWhitelisted 产生的数组）
      if (Array.isArray(rawMessage)) {
        return {
          message: rawMessage.join('; '),
          error: res.error ?? exception.name,
        };
      }

      return {
        message: typeof rawMessage === 'string' ? rawMessage : '请求处理失败',
        error: res.error ?? exception.name,
      };
    }

    // 未知异常（如服务层抛出的 Error）
    const isDev = process.env.NODE_ENV !== 'production';
    if (exception instanceof Error) {
      return {
        message: isDev ? exception.message : '服务器内部错误',
        error: 'InternalServerError',
      };
    }

    return {
      message: '服务器内部错误',
      error: 'InternalServerError',
    };
  }

  /**
   * 将 class-validator 的 ValidationError[] 扁平化为字段名到错误消息列表的映射
   */
  private flattenValidationErrors(errors: unknown[], prefix = ''): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const err of errors) {
      if (typeof err !== 'object' || err === null) continue;
      const e = err as Record<string, unknown>;
      const property = String(e.property ?? '');
      const path = prefix ? `${prefix}.${property}` : property;

      // 提取当前字段的直接约束错误
      const constraints = e.constraints as Record<string, string> | undefined;
      if (constraints) {
        result[path] = Object.values(constraints);
      }

      // 递归处理嵌套验证错误
      const children = e.children as unknown[] | undefined;
      if (children && children.length > 0) {
        const nested = this.flattenValidationErrors(children, path);
        Object.assign(result, nested);
      }
    }

    return result;
  }
}
