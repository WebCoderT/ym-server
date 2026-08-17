import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessLevel } from '../../../access-level.enum';

export class RoleVo {
  @ApiProperty({ type: String, example: '1' })
  id!: string;

  @ApiProperty({ type: String, example: '用户管理员' })
  name!: string;

  @ApiProperty({ type: String, example: 'USER_MANAGER' })
  code!: string;

  @ApiPropertyOptional({ type: String, example: '可核验门票的特殊用户' })
  description!: string | null;

  @ApiProperty({ type: [String], example: ['client:*', 'staff:ticket:verify'] })
  permissions!: string[];

  @ApiProperty({ type: Boolean, example: true })
  isSystem!: boolean;

  @ApiProperty({ type: Number, example: 0 })
  sortOrder!: number;

  @ApiProperty({ type: String })
  createdAt!: string;

  @ApiProperty({ type: String })
  updatedAt!: string;
}

export class RoleListResponseVo {
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.ADMIN })
  audience!: AccessLevel;

  @ApiProperty({ type: [RoleVo] })
  items!: RoleVo[];
}

export class UserRoleVo {
  @ApiProperty({ type: String })
  roleId!: string;

  @ApiProperty({ type: String })
  roleName!: string;

  @ApiProperty({ type: String })
  roleCode!: string;

  @ApiProperty({ type: [String] })
  permissions!: string[];

  @ApiProperty({ type: String })
  assignedAt!: string;
}

export class UserRoleListResponseVo {
  @ApiProperty({ enum: AccessLevel, example: AccessLevel.ADMIN })
  audience!: AccessLevel;

  @ApiProperty({ type: [UserRoleVo] })
  items!: UserRoleVo[];
}
