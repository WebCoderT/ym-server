import { ApiProperty } from '@nestjs/swagger';

export class QuickNavItemVo {
  @ApiProperty({ type: String, description: '导航项 ID' })
  id!: string;

  @ApiProperty({ type: String, description: '图标 URL' })
  icon!: string;

  @ApiProperty({ type: String, description: '显示文字' })
  label!: string;

  @ApiProperty({ type: String, description: '跳转地址' })
  url!: string;

  @ApiProperty({ type: String, description: '跳转方式' })
  openType!: string;

  @ApiProperty({ type: Number, description: '排序号' })
  sort!: number;
}
