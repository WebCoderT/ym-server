import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * API 请求日志表
 * 记录所有 HTTP 请求的完整信息，用于监控和审计
 */
@Entity('api_logs')
@Index(['createdAt'])
@Index(['method', 'url'])
@Index(['statusCode'])
@Index(['userId'])
@Index(['duration'])
export class ApiLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** HTTP 方法 */
  @Column({ type: 'varchar', length: 10 })
  method: string;

  /** 请求路径（含 query string） */
  @Column({ type: 'varchar', length: 500 })
  url: string;

  /** 纯路径（不含 query） */
  @Column({ name: 'request_path', type: 'varchar', length: 300 })
  requestPath: string;

  /** 查询参数 JSON */
  @Column({ type: 'text', nullable: true })
  queryParams: string | null;

  /** 请求体 JSON（截断至 2KB） */
  @Column({ type: 'text', nullable: true })
  requestBody: string | null;

  /** 响应状态码 */
  @Column({ name: 'status_code', type: 'int' })
  statusCode: number;

  /** 处理耗时（毫秒） */
  @Column({ type: 'int' })
  duration: number;

  /** 是否成功（2xx） */
  @Column({ type: 'boolean', default: true })
  success: boolean;

  /** 错误信息（截断至 500 字符） */
  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  /** 访问级别：admin / client / public */
  @Column({ name: 'access_level', type: 'varchar', length: 20, nullable: true })
  accessLevel: string | null;

  /** 用户 ID（从 JWT 解析） */
  @Column({ name: 'user_id', type: 'varchar', length: 36, nullable: true })
  userId: string | null;

  /** 客户端 IP */
  @Column({ name: 'client_ip', type: 'varchar', length: 45, nullable: true })
  clientIp: string | null;

  /** User-Agent */
  @Column({ name: 'user_agent', type: 'varchar', length: 300, nullable: true })
  userAgent: string | null;

  /** 请求体大小（字节） */
  @Column({ name: 'request_size', type: 'int', default: 0 })
  requestSize: number;

  /** 响应体大小（字节，估算） */
  @Column({ name: 'response_size', type: 'int', default: 0 })
  responseSize: number;

  /** 路由 handler 名称（如 ClientUserController.getProfile） */
  @Column({ name: 'handler_name', type: 'varchar', length: 100, nullable: true })
  handlerName: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
