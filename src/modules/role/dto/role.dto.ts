import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleRequestDto {
  @ApiProperty({ type: String, example: '检票员' })
  @IsString()
  @MaxLength(64)
  name!: string;

  @ApiProperty({ type: String, example: 'TICKET_CHECKER' })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [String], example: ['client:*', 'staff:ticket:verify'] })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];

  @ApiPropertyOptional({ type: Number, example: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateRoleRequestDto {
  @ApiPropertyOptional({ type: String })
  @IsString()
  @MaxLength(64)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({ type: Number })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class AssignRoleRequestDto {
  @ApiProperty({ type: String, description: '角色 ID' })
  @IsString()
  roleId!: string;
}
