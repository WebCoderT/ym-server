import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

/**
 * 批量设置佩戴勋章请求 DTO
 */
export class SetWornMedalsRequestDto {
  /** 要佩戴的勋章ID列表（按顺序排列，前面的排在前面） */
  @ApiProperty({ type: [String], description: '要佩戴的勋章ID列表' })
  @IsArray()
  @IsString({ each: true })
  medalIds!: string[];
}
