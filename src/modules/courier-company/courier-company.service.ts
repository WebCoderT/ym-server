import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { AccessLevel } from '../../access-level.enum';
import {
  buildPaginationMeta,
  calcSkip,
  PaginationRequestDto,
} from '../../common/dto/pagination.dto';
import { BUSINESS_MESSAGES } from '../../common/messages/business.messages';
import { CourierCompanyEntity } from './entities/courier-company.entity';
import { CreateCourierCompanyRequestDto, UpdateCourierCompanyRequestDto } from './dto/courier-company.dto';
import { CourierCompanyVo, CourierCompanyListResponseVo } from './vo/courier-company.vo';

/**
 * 快递公司服务
 * 提供快递公司的查询、创建、更新、删除功能
 */
@Injectable()
export class CourierCompanyService {
  constructor(
    @InjectRepository(CourierCompanyEntity)
    private readonly courierCompanyRepo: Repository<CourierCompanyEntity>,
  ) {}

  /**
   * 分页获取快递公司列表
   */
  async listCompanies(
    pagination: PaginationRequestDto = {},
  ): Promise<CourierCompanyListResponseVo> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 10;

    const [items, total] = await this.courierCompanyRepo.findAndCount({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      skip: calcSkip(page, pageSize),
      take: pageSize,
    });

    return {
      audience: AccessLevel.ADMIN,
      items: items.map((c) => this.toDto(c)),
      pagination: buildPaginationMeta(total, page, pageSize),
    };
  }

  /**
   * 获取快递公司详情
   */
  async getCompany(id: string): Promise<CourierCompanyVo> {
    const company = await this.courierCompanyRepo.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(BUSINESS_MESSAGES.COURIER_COMPANY.NOT_FOUND(id));
    }
    return this.toDto(company);
  }

  /**
   * 创建快递公司
   */
  async createCompany(body: CreateCourierCompanyRequestDto): Promise<CourierCompanyVo> {
    const company = this.courierCompanyRepo.create({
      name: body.name,
      code: body.code ?? null,
      type: body.type ?? null,
      enabled: body.enabled ?? true,
      sortOrder: body.sortOrder ?? 0,
    });
    await this.courierCompanyRepo.save(company);
    return this.toDto(company);
  }

  /**
   * 更新快递公司
   */
  async updateCompany(
    id: string,
    body: UpdateCourierCompanyRequestDto,
  ): Promise<CourierCompanyVo> {
    const company = await this.courierCompanyRepo.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(BUSINESS_MESSAGES.COURIER_COMPANY.NOT_FOUND(id));
    }

    if (body.name !== undefined) company.name = body.name;
    if (body.code !== undefined) company.code = body.code;
    if (body.type !== undefined) company.type = body.type;
    if (body.enabled !== undefined) company.enabled = body.enabled;
    if (body.sortOrder !== undefined) company.sortOrder = body.sortOrder;

    await this.courierCompanyRepo.save(company);
    return this.toDto(company);
  }

  /**
   * 删除快递公司
   */
  async deleteCompany(id: string): Promise<void> {
    const company = await this.courierCompanyRepo.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(BUSINESS_MESSAGES.COURIER_COMPANY.NOT_FOUND(id));
    }
    await this.courierCompanyRepo.remove(company);
  }

  /**
   * 获取全部已启用的快递公司（不分页，供客户端 / 发货选择使用）
   */
  async listAllEnabledCompanies(): Promise<CourierCompanyVo[]> {
    const items = await this.courierCompanyRepo.find({
      where: { enabled: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
    return items.map((c) => this.toDto(c));
  }

  /**
   * 根据名称查找快递公司
   * @param name - 快递公司名称
   * @returns 快递公司实体，未找到返回 null
   */
  async findByName(name: string): Promise<CourierCompanyEntity | null> {
    return this.courierCompanyRepo.findOne({ where: { name } });
  }

  /**
   * 校验快递公司是否存在
   */
  async validateCompanyExists(id: string): Promise<void> {
    const exists = await this.courierCompanyRepo.exist({ where: { id } });
    if (!exists) {
      throw new NotFoundException(BUSINESS_MESSAGES.COURIER_COMPANY.NOT_FOUND(id));
    }
  }

  /* ========== 数据初始化 ========== */

  private readonly logger = new Logger(CourierCompanyService.name);

  /** xlsx 固定文件名 */
  private static readonly XLSX_FILE_NAME = '快递公司.xlsx';

  /** 可能的表头名称映射 */
  private static readonly NAME_HEADERS = ['公司名称', '名称', '公司名', 'name'];
  private static readonly CODE_HEADERS = ['公司编码', '编码', '快递编码', 'code'];
  private static readonly TYPE_HEADERS = ['公司类型', '类型', '快递类型', 'type'];

  /**
   * 从 xlsx 文件初始化快递公司数据
   *
   * 读取 server/data/快递公司.xlsx，按行导入数据库。
   * 已存在同名公司则跳过，不覆盖。
   *
   * @returns 导入结果（新增数、跳过数、总数）
   */
  async initFromXlsx(): Promise<{ inserted: number; skipped: number; total: number }> {
    const dataDir = path.resolve(__dirname, '../../../data');
    const xlsxFile = path.join(dataDir, CourierCompanyService.XLSX_FILE_NAME);

    if (!fs.existsSync(xlsxFile)) {
      throw new NotFoundException(
        `未找到数据文件，请将 xlsx 文件放置到以下目录：${dataDir}，文件名：${CourierCompanyService.XLSX_FILE_NAME}`,
      );
    }

    const { read: xlsxRead, utils: xlsxUtils } = await import('xlsx');
    const fileBuffer = fs.readFileSync(xlsxFile);
    const workbook = xlsxRead(fileBuffer);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new NotFoundException('xlsx 文件中没有工作表');
    }

    const sheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = xlsxUtils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
    });

    if (rows.length < 2) {
      return { inserted: 0, skipped: 0, total: 0 };
    }

    // 解析表头
    const headers = rows[0].map((h) => String(h).trim());
    const nameIdx = this.findColumnIndex(headers, CourierCompanyService.NAME_HEADERS);
    const codeIdx = this.findColumnIndex(headers, CourierCompanyService.CODE_HEADERS);
    const typeIdx = this.findColumnIndex(headers, CourierCompanyService.TYPE_HEADERS);

    if (nameIdx === -1) {
      throw new NotFoundException(
        `无法识别"公司名称"列，表头: ${headers.join(', ')}，支持的列名: ${CourierCompanyService.NAME_HEADERS.join(' / ')}`,
      );
    }

    // 过滤有效数据行
    const dataRows = rows.slice(1).filter((row) => {
      const name = String(row[nameIdx] || '').trim();
      return name.length > 0;
    });

    // 查询已存在的公司名称
    const existingNames = new Set(
      (await this.courierCompanyRepo.find({ select: ['name'] })).map((c) => c.name),
    );

    let inserted = 0;
    let skipped = 0;
    const currentMaxSort = await this.courierCompanyRepo
      .createQueryBuilder('c')
      .select('MAX(c.sortOrder)', 'maxSort')
      .getRawOne()
      .then((r) => Number(r?.maxSort) || 0);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const name = String(row[nameIdx] || '').trim();
      const code = codeIdx >= 0 ? String(row[codeIdx] || '').trim() || null : null;
      const type = typeIdx >= 0 ? String(row[typeIdx] || '').trim() || null : null;

      if (existingNames.has(name)) {
        skipped++;
        continue;
      }

      const entity = this.courierCompanyRepo.create({
        name,
        code,
        type,
        enabled: true,
        sortOrder: currentMaxSort + inserted + 1,
      });
      await this.courierCompanyRepo.save(entity);
      existingNames.add(name);
      inserted++;
    }

    this.logger.log(`快递公司初始化完成：新增 ${inserted}，跳过 ${skipped}，共 ${dataRows.length} 条`);
    return { inserted, skipped, total: dataRows.length };
  }

  /**
   * 在表头行中查找匹配的列索引
   */
  private findColumnIndex(headers: string[], candidates: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const h = (headers[i] || '').trim().toLowerCase();
      if (candidates.some((c) => c.toLowerCase() === h)) {
        return i;
      }
    }
    return -1;
  }

  private toDto(entity: CourierCompanyEntity): CourierCompanyVo {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      type: entity.type,
      enabled: entity.enabled,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
