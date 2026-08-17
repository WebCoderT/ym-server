import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { NotificationTargetPage } from '../enums/notification-target-page.enum';

/**
 * 创建通知请求 DTO
 */
export class CreateNotificationRequestDto {
  @ApiProperty({ type: 'string', example: '某某明星已经退出，请注意' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content!: string;

  @ApiProperty({ enum: NotificationTargetPage, example: NotificationTargetPage.STAR })
  @IsEnum(NotificationTargetPage)
  targetPage!: NotificationTargetPage;
}

/**
 * 更新通知请求 DTO
 */
export class UpdateNotificationRequestDto {
  @ApiPropertyOptional({ type: 'string', example: '更新后的通知内容' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content?: string;

  @ApiPropertyOptional({ enum: NotificationTargetPage, example: NotificationTargetPage.INDEX })
  @IsOptional()
  @IsEnum(NotificationTargetPage)
  targetPage?: NotificationTargetPage;
}

/**
 * 确认通知请求 DTO
 */
export class ConfirmNotificationRequestDto {
  @ApiProperty({ type: 'string', example: '1' })
  @Type(() => String)
  @IsString()
  @IsNotEmpty()
  notificationId!: string;
}
