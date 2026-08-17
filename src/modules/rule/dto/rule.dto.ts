import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRuleRequestDto {
  @ApiPropertyOptional({ type: 'string', example: '粉丝团榜单规则' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  titleImage?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  backgroundImage?: string;
}
