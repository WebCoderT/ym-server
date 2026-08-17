import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import {
  PhoneVisibility,
  ProfileVisibility,
  RewardVisibility,
} from '../entities/user-privacy-setting.entity';

/**
 * 更新隐私设置请求 DTO
 * 用于客户端请求更新隐私配置，所有字段均为可选
 */
export class UpdatePrivacySettingRequestDto {
  /** 资料可见性（可选） */
  @ApiPropertyOptional({
    enum: ProfileVisibility,
    example: ProfileVisibility.PUBLIC,
  })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profileVisibility?: ProfileVisibility;

  /** 手机号可见性（可选） */
  @ApiPropertyOptional({
    enum: PhoneVisibility,
    example: PhoneVisibility.PRIVATE,
  })
  @IsOptional()
  @IsEnum(PhoneVisibility)
  phoneVisibility?: PhoneVisibility;

  /** 打赏记录可见性（可选） */
  @ApiPropertyOptional({
    enum: RewardVisibility,
    example: RewardVisibility.FRIENDS_ONLY,
  })
  @IsOptional()
  @IsEnum(RewardVisibility)
  rewardVisibility?: RewardVisibility;

  /** 是否允许陌生人私信（可选） */
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  allowStrangerMessage?: number;
}
