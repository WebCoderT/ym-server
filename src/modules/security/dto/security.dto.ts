import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * 注销设备请求 DTO
 */
export class LogoutDeviceRequestDto {
  @ApiProperty({ type: 'string', example: 'device-iphone-15' })
  @IsString()
  deviceId!: string;
}
