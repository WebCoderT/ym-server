import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessLevel } from '../../access-level.enum';
import { buildPaginationMeta, calcSkip, PaginationRequestDto } from '@common/dto/pagination.dto';
import { BUSINESS_MESSAGES } from '@common/messages/business.messages';
import { UserEntity } from '@modules/user/entities/user.entity';
import {
  CreateMemberLevelRequestDto,
  MemberLevelDto,
  MemberLevelListResponseDto,
  UpdateMemberLevelRequestDto,
  UserMemberLevelResponseDto,
} from './dto/member-level.dto';
import { StorageConfigService } from '../storage/storage-config.service';
import { MemberLevelEntity } from './entities/member-level.entity';

/**
 * 会员等级服务
 * 提供会员等级的 CRUD、用户等级计算及特权查询等功能
 */
@Injectable()
export class MemberLevelService {
  constructor(
    @InjectRepository(MemberLevelEntity)
    private readonly memberLevelRepo: Repository<MemberLevelEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly storageConfig: StorageConfigService,
  ) {}

  /**
   * 创建会员等级
   */
  async create(body: CreateMemberLevelRequestDto): Promise<MemberLevelDto> {
    const entity = this.memberLevelRepo.create({
      name: body.name,
      level: body.level,
      minSpending: body.minSpending,
      icon: this.storageConfig.normalizeFileUrl(body.icon),
      privileges: {
        goodsDiscount: body.privileges?.goodsDiscount ?? null,
        earlyTicket: body.privileges?.earlyTicket ?? false,
        fastRefund: body.privileges?.fastRefund ?? false,
      },
    });

    const savedEntity = await this.memberLevelRepo.save(entity);
    const loadedEntity = await this.memberLevelRepo.findOne({
      where: { id: savedEntity.id },
    });

    if (!loadedEntity) {
      throw new Error('Failed to create member level');
    }

    return this.toDto(loadedEntity);
  }

  /**
   * 更新会员等级
   */
  async update(id: string, body: UpdateMemberLevelRequestDto): Promise<MemberLevelDto> {
    const entity = await this.memberLevelRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(BUSINESS_MESSAGES.MEMBER_LEVEL.NOT_FOUND(id));
    }

    if (body.name !== undefined) entity.name = body.name;
    if (body.level !== undefined) entity.level = body.level;
    if (body.minSpending !== undefined) entity.minSpending = body.minSpending;
    if (body.icon !== undefined) entity.icon = this.storageConfig.normalizeFileUrl(body.icon);
    if (body.privileges !== undefined) {
      entity.privileges = {
        goodsDiscount: body.privileges.goodsDiscount ?? null,
        earlyTicket: body.privileges.earlyTicket ?? false,
        fastRefund: body.privileges.fastRefund ?? false,
      };
    }

    await this.memberLevelRepo.save(entity);
    return this.toDto(entity);
  }

  /**
   * 获取会员等级列表
   */
  async getList(query: PaginationRequestDto = {}): Promise<MemberLevelListResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [items, total] = await this.memberLevelRepo.findAndCount({
      order: { level: 'ASC' },
      skip: calcSkip(page, pageSize),
      take: pageSize,
    });

    return {
      audience: AccessLevel.ADMIN,
      items: items.map((item) => this.toDto(item)),
      pagination: buildPaginationMeta(total, page, pageSize),
    };
  }

  /**
   * 获取所有会员等级（不分页）
   */
  async getAll(): Promise<MemberLevelDto[]> {
    const items = await this.memberLevelRepo.find({ order: { level: 'ASC' } });
    return items.map((item) => this.toDto(item));
  }

  /**
   * 获取用户当前会员等级
   */
  async getUserLevel(userId: string): Promise<UserMemberLevelResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalSpending = 0; // 简化版本，实际需要计算用户总消费

    const levels = await this.memberLevelRepo.find({ order: { level: 'ASC' } });
    const currentLevel = [...levels].reverse().find((l) => totalSpending >= l.minSpending) ?? null;

    return {
      audience: AccessLevel.CLIENT,
      userId,
      totalSpending,
      currentLevel: currentLevel ? this.toDto(currentLevel) : null,
      nextLevel: null,
    };
  }

  /**
   * 删除会员等级
   */
  async delete(id: string): Promise<void> {
    const entity = await this.memberLevelRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(BUSINESS_MESSAGES.MEMBER_LEVEL.NOT_FOUND(id));
    }
    await this.memberLevelRepo.remove(entity);
  }

  /**
   * 转换为 DTO
   */
  private toDto(entity: MemberLevelEntity): MemberLevelDto {
    return {
      id: entity.id,
      name: entity.name,
      level: entity.level,
      minSpending: entity.minSpending,
      icon: entity.icon ? String(this.storageConfig.resolveFileUrl(entity.icon)) : null,
      privileges: entity.privileges,
    };
  }
}
