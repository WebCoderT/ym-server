import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AccessLevel } from '../../../access-level.enum';
import { PaginationMeta } from '../../../common/dto/pagination.dto';
import {
  GrowthRecordType,
  TaskStatus,
  TaskType,
} from '../entities/member.entity';

/**
 * 会员档案 DTO
 * 用于展示用户的会员等级、成长值及积分信息
 */
export class MemberProfileDto {
  /** 档案记录唯一标识 */
  @ApiProperty({ type: 'string', example: '10001' })
  id!: string;

  /** 用户唯一标识 */
  @ApiProperty({ type: 'string', example: 'user_10001' })
  userId!: string;

  /** 当前会员等级 */
  @ApiProperty({ type: Number, example: 3 })
  level!: number;

  /** 当前成长值 */
  @ApiProperty({ type: Number, example: 1500 })
  growthValue!: number;

  /** 累计积分 */
  @ApiProperty({ type: Number, example: 500 })
  totalPoints!: number;

  /** 档案创建时间 */
  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  createdAt!: string;
}

/**
 * 会员任务 DTO
 * 用于展示任务的基本信息及用户是否已完成
 */
export class MemberTaskDto {
  /** 任务唯一标识 */
  @ApiProperty({ type: 'string', example: '10001' })
  id!: string;

  /** 任务标题 */
  @ApiProperty({ type: 'string', example: '每日签到' })
  title!: string;

  /** 任务描述，可能为空 */
  @ApiProperty({ type: 'string', example: '登录小程序完成签到', nullable: true })
  description!: string | null;

  /** 任务类型：每日、每周、周期 */
  @ApiProperty({ enum: TaskType, example: TaskType.DAILY })
  type!: TaskType;

  /** 完成任务获得的积分 */
  @ApiProperty({ type: Number, example: 10 })
  points!: number;

  /** 完成任务获得的成长值 */
  @ApiProperty({ type: Number, example: 5 })
  growthReward!: number;

  /** 用户是否已完成该任务 */
  @ApiProperty({ type: Boolean, example: false })
  completed!: boolean;
}

/**
 * 会员任务记录 DTO
 * 用于展示用户完成任务的记录详情
 */
export class MemberTaskRecordDto {
  /** 任务记录唯一标识 */
  @ApiProperty({ type: 'string', example: '10001' })
  id!: string;

  /** 用户唯一标识 */
  @ApiProperty({ type: 'string', example: 'user_10001' })
  userId!: string;

  /** 任务标题 */
  @ApiProperty({ type: 'string', example: '每日签到' })
  taskTitle!: string;

  /** 完成任务获得的积分 */
  @ApiProperty({ type: Number, example: 10 })
  points!: number;

  /** 完成任务获得的成长值 */
  @ApiProperty({ type: Number, example: 5 })
  growthReward!: number;

  /** 任务完成时间 */
  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  completedAt!: string;
}

/**
 * 成长记录 DTO
 * 用于展示单条成长记录的详细信息
 */
export class GrowthRecordDto {
  /** 成长记录唯一标识 */
  @ApiProperty({ type: 'string', example: '10001' })
  id!: string;

  /** 成长记录类型：任务、消费、升级、登录 */
  @ApiProperty({ enum: GrowthRecordType, example: GrowthRecordType.TASK })
  type!: GrowthRecordType;

  /** 成长值变动量 */
  @ApiProperty({ type: Number, example: 10 })
  delta!: number;

  /** 变动后的成长值余额 */
  @ApiProperty({ type: Number, example: 1500 })
  balanceAfter!: number;

  /** 成长记录描述，可能为空 */
  @ApiProperty({ type: 'string', example: '完成每日签到', nullable: true })
  description!: string | null;

  /** 成长记录创建时间 */
  @ApiProperty({ type: 'string', example: '2026-05-26T10:00:00.000Z' })
  createdAt!: string;
}

/**
 * 会员档案响应 DTO
 * 用于返回用户会员档案的完整信息
 */
export class MemberProfileResponseDto {
  /** 受众级别 */
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.CLIENT })
  audience!: AccessLevel;

  /** 会员档案详情 */
  @ApiProperty({ type: MemberProfileDto })
  profile!: MemberProfileDto;
}

/**
 * 会员任务列表响应 DTO
 * 用于返回用户视角的任务列表
 */
export class MemberTaskListResponseDto {
  /** 受众级别 */
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.CLIENT })
  audience!: AccessLevel;

  /** 会员任务列表 */
  @ApiProperty({ type: [MemberTaskDto] })
  items!: MemberTaskDto[];
}

/**
 * 会员任务记录列表响应 DTO
 * 用于返回用户已完成任务的记录列表
 */
export class MemberTaskRecordListResponseDto {
  /** 受众级别 */
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.CLIENT })
  audience!: AccessLevel;

  /** 会员任务记录列表 */
  @ApiProperty({ type: [MemberTaskRecordDto] })
  items!: MemberTaskRecordDto[];
}

/**
 * 成长记录列表响应 DTO
 * 用于返回用户的成长记录列表
 */
export class GrowthRecordListResponseDto {
  /** 受众级别 */
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.CLIENT })
  audience!: AccessLevel;

  /** 成长记录列表 */
  @ApiProperty({ type: [GrowthRecordDto] })
  items!: GrowthRecordDto[];
}

/**
 * 创建任务请求 DTO
 * 用于管理员提交创建会员任务的请求参数
 */
export class CreateTaskRequestDto {
  /** 任务标题 */
  @ApiProperty({ type: 'string', example: '每日签到' })
  @IsString()
  title!: string;

  /** 任务描述（可选） */
  @ApiPropertyOptional({ example: '登录小程序完成签到' })
  @IsOptional()
  @IsString()
  description?: string;

  /** 任务类型 */
  @ApiProperty({ enum: TaskType, example: TaskType.DAILY })
  @IsEnum(TaskType)
  type!: TaskType;

  /** 完成任务获得的积分 */
  @ApiProperty({ example: 10 })
  @IsNumber()
  points!: number;

  /** 完成任务获得的成长值 */
  @ApiProperty({ example: 5 })
  @IsNumber()
  growthReward!: number;
}

/**
 * 更新任务请求 DTO
 * 用于管理员提交更新会员任务的请求参数，所有字段均为可选
 */
export class UpdateTaskRequestDto {
  /** 任务标题（可选） */
  @ApiPropertyOptional({ example: '每日签到 V2' })
  @IsOptional()
  @IsString()
  title?: string;

  /** 任务描述（可选） */
  @ApiPropertyOptional({ example: '更新后的描述' })
  @IsOptional()
  @IsString()
  description?: string;

  /** 任务类型（可选） */
  @ApiPropertyOptional({ enum: TaskType, example: TaskType.DAILY })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  /** 任务状态（可选） */
  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.ACTIVE })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  /** 完成任务获得的积分（可选） */
  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  points?: number;

  /** 完成任务获得的成长值（可选） */
  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  growthReward?: number;
}

/**
 * 管理员任务列表响应 DTO
 * 用于返回管理员视角的全部会员任务列表
 */
export class AdminTaskListResponseDto {
  /** 受众级别 */
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.ADMIN })
  audience!: AccessLevel;

  /** 会员任务列表 */
  @ApiProperty({ type: [MemberTaskDto] })
  items!: MemberTaskDto[];

  /** 分页元数据 */
  @ApiProperty({ type: PaginationMeta })
  pagination!: PaginationMeta;
}
