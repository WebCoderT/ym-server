import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessLevel } from '../../access-level.enum';
import {
  buildPaginationMeta,
  calcSkip,
  PaginationRequestDto,
} from '../../common/dto/pagination.dto';
import { BUSINESS_MESSAGES } from '../../common/messages/business.messages';
import {
  CreateTaskRequestDto,
  GrowthRecordDto,
  GrowthRecordListResponseDto,
  MemberProfileDto,
  MemberProfileResponseDto,
  MemberTaskDto,
  MemberTaskListResponseDto,
  MemberTaskRecordDto,
  MemberTaskRecordListResponseDto,
  UpdateTaskRequestDto,
  AdminTaskListResponseDto,
} from './dto/member.dto';
import {
  GrowthRecordType,
  MemberGrowthRecordEntity,
  MemberProfileEntity,
  MemberTaskEntity,
  MemberTaskRecordEntity,
  TaskStatus,
} from './entities/member.entity';

/**
 * 会员服务
 * 提供会员档案查询、任务列表、任务完成、成长记录、任务管理及管理员任务列表等核心功能
 */
@Injectable()
export class MemberService {
  /**
   * 会员等级成长值阈值表
   * 下标 0 对应等级 1，依次类推；成长值达到对应阈值即可升级
   */
  private readonly levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

  constructor(
    /** 会员档案实体仓储：用于操作 member_profiles 表 */
    @InjectRepository(MemberProfileEntity)
    private readonly profileRepo: Repository<MemberProfileEntity>,
    /** 会员任务实体仓储：用于操作 member_tasks 表 */
    @InjectRepository(MemberTaskEntity)
    private readonly taskRepo: Repository<MemberTaskEntity>,
    /** 会员任务记录实体仓储：用于操作 member_task_records 表 */
    @InjectRepository(MemberTaskRecordEntity)
    private readonly taskRecordRepo: Repository<MemberTaskRecordEntity>,
    /** 会员成长记录实体仓储：用于操作 member_growth_records 表 */
    @InjectRepository(MemberGrowthRecordEntity)
    private readonly growthRepo: Repository<MemberGrowthRecordEntity>,
  ) {}

  /**
   * 获取会员档案
   * 查询指定用户的会员档案；若不存在则自动创建初始档案
   *
   * @param userId - 用户唯一标识
   * @returns 会员档案响应 DTO
   */
  async getProfile(userId: string): Promise<MemberProfileResponseDto> {
    let profile = await this.profileRepo.findOne({ where: { userId } });

    if (!profile) {
      // 用户首次访问会员中心：创建初始档案
      profile = this.profileRepo.create({
        userId,
        level: 1,
        growthValue: 0,
        totalPoints: 0,
      });
      await this.profileRepo.save(profile);
    }

    return {
      audience: AccessLevel.CLIENT,
      profile: this.toProfileDto(profile),
    };
  }

  /**
   * 获取任务列表
   * 查询当前有效的任务列表，并标记用户已完成的任务
   *
   * @param userId - 用户唯一标识
   * @returns 会员任务列表响应 DTO
   */
  async getTaskList(userId: string): Promise<MemberTaskListResponseDto> {
    const tasks = await this.taskRepo.find({
      where: { status: TaskStatus.ACTIVE },
    });

    const records = await this.taskRecordRepo.find({
      where: { userId },
    });

    // 提取用户已完成的任务ID集合
    const completedTaskIds = new Set(
      records.filter((r) => r.completed).map((r) => r.taskId),
    );

    return {
      audience: AccessLevel.CLIENT,
      items: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        type: t.type,
        points: t.points,
        growthReward: t.growthReward,
        completed: completedTaskIds.has(t.id),
      })),
    };
  }

  /**
   * 完成任务
   * 标记指定任务为已完成，增加用户成长值，并返回全部已完成任务记录
   *
   * @param userId - 用户唯一标识
   * @param taskId - 任务唯一标识
   * @returns 会员任务记录列表响应 DTO
   * @throws NotFoundException 当任务不存在时抛出
   */
  async completeTask(
    userId: string,
    taskId: string,
  ): Promise<MemberTaskRecordListResponseDto> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException(BUSINESS_MESSAGES.MEMBER_TASK.NOT_FOUND(taskId));
    }

    let record = await this.taskRecordRepo.findOne({
      where: { userId, taskId },
    });

    if (!record) {
      // 首次完成该任务：创建新记录
      record = this.taskRecordRepo.create({
        userId,
        taskId,
        completed: true,
        completedAt: new Date(),
      });
    } else {
      // 重复完成任务：更新完成状态与时间
      record.completed = true;
      record.completedAt = new Date();
    }

    await this.taskRecordRepo.save(record);

    // 增加用户成长值
    await this.addGrowth(userId, task.growthReward, GrowthRecordType.TASK, `完成任务：${task.title}`);

    // 查询该用户全部已完成任务记录
    const allRecords = await this.taskRecordRepo.find({
      where: { userId },
      order: { completedAt: 'DESC' },
    });

    // 构建任务ID到任务实体的映射，用于补充任务标题等信息
    const taskMap = new Map<string, MemberTaskEntity>();
    const allTasks = await this.taskRepo.find();
    for (const t of allTasks) {
      taskMap.set(t.id, t);
    }

    return {
      audience: AccessLevel.CLIENT,
      items: allRecords
        .filter((r) => r.completed)
        .map((r) => {
          const t = taskMap.get(r.taskId);
          return {
            id: r.id,
            userId: r.userId,
            taskTitle: t?.title ?? '未知任务',
            points: t?.points ?? 0,
            growthReward: t?.growthReward ?? 0,
            completedAt: r.completedAt!.toISOString(),
          };
        }),
    };
  }

  /**
   * 获取成长记录列表
     * 查询指定用户的全部成长记录，按创建时间降序排列
   *
   * @param userId - 用户唯一标识
   * @returns 成长记录列表响应 DTO
   */
  async getGrowthRecords(
    userId: string,
  ): Promise<GrowthRecordListResponseDto> {
    const records = await this.growthRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      audience: AccessLevel.CLIENT,
      items: records.map((r) => this.toGrowthRecordDto(r)),
    };
  }

  /**
   * 创建任务
   * 根据请求参数创建新任务并保存到数据库
   *
   * @param body - 创建任务的请求参数
   * @returns 会员任务 DTO
   */
  async createTask(body: CreateTaskRequestDto): Promise<MemberTaskDto> {
    const task = this.taskRepo.create({
      title: body.title,
      description: body.description ?? null,
      type: body.type,
      points: body.points,
      growthReward: body.growthReward,
      status: TaskStatus.ACTIVE,
    });

    await this.taskRepo.save(task);

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      points: task.points,
      growthReward: task.growthReward,
      completed: false,
    };
  }

  /**
   * 更新任务
   * 根据任务ID与请求参数更新任务信息，仅更新传入的字段
   *
   * @param taskId - 任务唯一标识
   * @param body - 更新任务的请求参数
   * @returns 更新后的会员任务 DTO
   * @throws NotFoundException 当任务不存在时抛出
   */
  async updateTask(
    taskId: string,
    body: UpdateTaskRequestDto,
  ): Promise<MemberTaskDto> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException(BUSINESS_MESSAGES.MEMBER_TASK.NOT_FOUND(taskId));
    }

    // 按需更新各字段
    if (body.title !== undefined) task.title = body.title;
    if (body.description !== undefined)
      task.description = body.description ?? null;
    if (body.type !== undefined) task.type = body.type;
    if (body.points !== undefined) task.points = body.points;
    if (body.growthReward !== undefined) task.growthReward = body.growthReward;
    if (body.status !== undefined) task.status = body.status;

    await this.taskRepo.save(task);

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      points: task.points,
      growthReward: task.growthReward,
      completed: false,
    };
  }

  /**
   * 删除任务
   * 根据任务ID删除任务记录
   *
   * @param taskId - 任务唯一标识
   * @throws NotFoundException 当任务不存在时抛出
   */
  async deleteTask(taskId: string): Promise<void> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException(BUSINESS_MESSAGES.MEMBER_TASK.NOT_FOUND(taskId));
    }

    await this.taskRepo.remove(task);
  }

  /**
   * 查询管理员视角的全部任务
   * 返回系统中所有任务的列表，按创建时间降序排列
   *
   * @param pagination - 分页请求参数
   * @returns 管理员任务列表响应 DTO
   */
  async listAdminTasks(
    pagination: PaginationRequestDto = {},
  ): Promise<AdminTaskListResponseDto> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 5;

    const [tasks, total] = await this.taskRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: calcSkip(page, pageSize),
      take: pageSize,
    });

    return {
      audience: AccessLevel.ADMIN,
      items: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        type: t.type,
        points: t.points,
        growthReward: t.growthReward,
        completed: false,
      })),
      pagination: buildPaginationMeta(total, page, pageSize),
    };
  }

  /**
   * 增加用户成长值
   * 更新用户会员档案的成长值与等级，并创建对应的成长记录
   *
   * @param userId - 用户唯一标识
   * @param delta - 增加的成长值
   * @param type - 成长记录类型
   * @param description - 成长记录描述
   */
  private async addGrowth(
    userId: string,
    delta: number,
    type: GrowthRecordType,
    description: string,
  ): Promise<void> {
    let profile = await this.profileRepo.findOne({ where: { userId } });

    if (!profile) {
      // 用户尚未有会员档案：创建初始档案
      profile = this.profileRepo.create({
        userId,
        level: 1,
        growthValue: 0,
        totalPoints: 0,
      });
    }

    // 累加成长值并重新计算等级
    profile.growthValue += delta;
    profile.level = this.calculateLevel(profile.growthValue);

    await this.profileRepo.save(profile);

    // 创建成长记录
    const record = this.growthRepo.create({
      userId,
      type,
      delta,
      balanceAfter: profile.growthValue,
      description,
    });

    await this.growthRepo.save(record);
  }

  /**
   * 根据成长值计算会员等级
   * 从最高阈值向下遍历，找到当前成长值对应的等级
   *
   * @param growthValue - 当前成长值
   * @returns 计算后的会员等级
   */
  private calculateLevel(growthValue: number): number {
    for (let i = this.levelThresholds.length - 1; i >= 0; i--) {
      if (growthValue >= this.levelThresholds[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * 将会员档案实体转换为 DTO
   *
   * @param profile - 会员档案实体
   * @returns 会员档案 DTO
   */
  private toProfileDto(profile: MemberProfileEntity): MemberProfileDto {
    return {
      id: profile.id,
      userId: profile.userId,
      level: profile.level,
      growthValue: profile.growthValue,
      totalPoints: profile.totalPoints,
      createdAt: profile.createdAt.toISOString(),
    };
  }

  /**
   * 将成长记录实体转换为 DTO
   *
   * @param record - 成长记录实体
   * @returns 成长记录 DTO
   */
  private toGrowthRecordDto(record: MemberGrowthRecordEntity): GrowthRecordDto {
    return {
      id: record.id,
      type: record.type,
      delta: record.delta,
      balanceAfter: record.balanceAfter,
      description: record.description,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
