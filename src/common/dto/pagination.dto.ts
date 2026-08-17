import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 分页请求参数 DTO
 * 用于列表接口的统一分页入参
 */
export class PaginationRequestDto {
  /** 当前页码，从 1 开始 */
  @ApiPropertyOptional({ example: 1, description: '当前页码，从 1 开始' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  /** 每页条数 */
  @ApiPropertyOptional({ example: 5, description: '每页条数' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 5;
}

/**
 * 分页元数据（使用 class 以便 Swagger 正确生成 OpenAPI 类型）
 */
export class PaginationMeta {
  /** 总记录数 */
  @ApiProperty({ type: Number, description: '总记录数' })
  total: number;
  /** 当前页码 */
  @ApiProperty({ type: Number, description: '当前页码' })
  page: number;
  /** 每页条数 */
  @ApiProperty({ type: Number, description: '每页条数' })
  pageSize: number;
  /** 总页数 */
  @ApiProperty({ type: Number, description: '总页数' })
  totalPages: number;
}

/**
 * 构造分页响应元数据
 */
export function buildPaginationMeta(total: number, page: number, pageSize: number): PaginationMeta {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 计算 skip 值
 */
export function calcSkip(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
