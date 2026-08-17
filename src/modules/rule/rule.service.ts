import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageConfigService } from '../storage/storage-config.service';
import { RuleEntity } from './entities/rule.entity';
import { UpdateRuleRequestDto } from './dto/rule.dto';
import { RuleVo, RuleListResponseVo } from './vo/rule.vo';
import { AccessLevel } from '../../access-level.enum';

/** 预置规则编码 */
const SEED_RULES = [
  { code: 'fan_club_ranking', title: '粉丝团榜单规则', content: '', backgroundImage: null },
  { code: 'card_draw', title: '抽卡规则', content: '', backgroundImage: null },
];

/**
 * 规则服务
 * 提供规则的查询与修改功能
 * 系统初始化时自动创建预置规则，不允许新增/删除，只允许修改
 */
@Injectable()
export class RuleService implements OnModuleInit {
  private readonly logger = new Logger(RuleService.name);

  constructor(
    @InjectRepository(RuleEntity)
    private readonly ruleRepo: Repository<RuleEntity>,
    private readonly storageConfig: StorageConfigService,
  ) {}

  /**
   * 模块初始化时检查并创建预置规则
   */
  async onModuleInit(): Promise<void> {
    for (const seed of SEED_RULES) {
      const existing = await this.ruleRepo.findOne({ where: { code: seed.code } });
      if (!existing) {
        const rule = this.ruleRepo.create(seed);
        await this.ruleRepo.save(rule);
        this.logger.log(`[规则初始化] 创建预置规则: ${seed.code}`);
      }
    }
  }

  /**
   * 获取全部规则列表
   */
  async listRules(audience: AccessLevel): Promise<RuleListResponseVo> {
    const rules = await this.ruleRepo.find({ order: { id: 'ASC' } });
    return {
      audience,
      items: await Promise.all(rules.map((r) => this.toDto(r))),
    };
  }

  /**
   * 根据编码获取单条规则
   */
  async getRuleByCode(code: string): Promise<RuleVo> {
    const rule = await this.ruleRepo.findOne({ where: { code } });
    if (!rule) {
      throw new NotFoundException(`规则 ${code} 不存在`);
    }
    return this.toDto(rule);
  }

  /**
   * 更新规则（只允许修改标题、内容、背景图）
   */
  async updateRule(code: string, body: UpdateRuleRequestDto): Promise<RuleVo> {
    const rule = await this.ruleRepo.findOne({ where: { code } });
    if (!rule) {
      throw new NotFoundException(`规则 ${code} 不存在`);
    }

    if (body.title !== undefined) rule.title = body.title;
    if (body.titleImage !== undefined) {
      rule.titleImage = body.titleImage ? this.storageConfig.normalizeFileUrl(body.titleImage) : null;
    }
    if (body.content !== undefined) rule.content = body.content;
    if (body.backgroundImage !== undefined) {
      rule.backgroundImage = body.backgroundImage
        ? this.storageConfig.normalizeFileUrl(body.backgroundImage)
        : null;
    }

    await this.ruleRepo.save(rule);
    return this.toDto(rule);
  }

  /**
   * 将规则实体转换为 DTO
   */
  private async toDto(rule: RuleEntity): Promise<RuleVo> {
    return {
      id: rule.id,
      code: rule.code,
      title: rule.title,
      titleImage: await this.storageConfig.resolveFileUrl(rule.titleImage),
      content: rule.content,
      backgroundImage: await this.storageConfig.resolveFileUrl(rule.backgroundImage),
      updatedAt: rule.updatedAt.toISOString(),
    };
  }
}
