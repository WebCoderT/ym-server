/**
 * 管理员认证数据传输对象模块
 * 本模块定义了管理员认证流程中使用的各类 DTO，
 * 包括管理员登录请求等数据结构。
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/**
 * 管理员登录请求数据传输对象
 * 客户端使用该对象提交管理员登录所需的凭证信息。
 */
export class AdminLoginRequestDto {
  /**
   * 管理员登录用户名
   * 必须为字符串类型，且最小长度为 3 个字符。
   * 示例值为 'admin'。
   */
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(3)
  username!: string;

  /**
   * 管理员登录密码
   * 必须为字符串类型，且最小长度为 8 个字符，以保障密码安全性。
   * 示例值为 'Admin@123456'。
   */
  @ApiProperty({ example: 'Admin@123456' })
  @IsString()
  @MinLength(8)
  password!: string;
}
