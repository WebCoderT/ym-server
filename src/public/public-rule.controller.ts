import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RuleService } from '../modules/rule/rule.service';
import { RuleVo, RuleListResponseVo } from '../modules/rule/vo/rule.vo';
import { AccessLevel } from '../access-level.enum';
import { RequireAccessLevel } from '../access-level.decorator';

/**
 * 公开规则控制器
 * 供客户端获取规则内容
 */
@ApiTags('public-rule')
@RequireAccessLevel(AccessLevel.PUBLIC)
@Controller('rules')
export class PublicRuleController {
  constructor(private readonly ruleService: RuleService) {}

  /**
   * 获取全部规则列表
   */
  @Get()
  @ApiOperation({ summary: 'List all rules' })
  @ApiOkResponse({ type: RuleListResponseVo })
  async listRules(): Promise<RuleListResponseVo> {
    return this.ruleService.listRules(AccessLevel.PUBLIC);
  }

  /**
   * 根据编码获取单条规则
   */
  @Get(':code')
  @ApiOperation({ summary: 'Get rule by code' })
  @ApiOkResponse({ type: RuleVo })
  async getRuleByCode(@Param('code') code: string): Promise<RuleVo> {
    return this.ruleService.getRuleByCode(code);
  }
}
