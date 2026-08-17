import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { RequirePermission } from '../permission.decorator';
import { AccessLevel } from '../access-level.enum';
import { Permission } from '../permission.enum';
import { PaginationRequestDto } from '../common/dto/pagination.dto';
import { CreateCourierCompanyRequestDto, UpdateCourierCompanyRequestDto } from '../modules/courier-company/dto/courier-company.dto';
import { CourierCompanyVo, CourierCompanyInitResultVo, CourierCompanyListResponseVo } from '../modules/courier-company/vo/courier-company.vo';
import { CourierCompanyService } from '../modules/courier-company/courier-company.service';

@ApiTags('admin-courier-companies')
@ApiBearerAuth('bearer')
@RequireAccessLevel(AccessLevel.ADMIN)
@Controller('admin/courier-companies')
export class AdminCourierCompanyController {
  constructor(private readonly courierCompanyService: CourierCompanyService) {}

  @Get()
  @ApiOperation({ summary: '获取快递公司列表（分页）' })
  @ApiOkResponse({ type: CourierCompanyListResponseVo })
  @RequirePermission(Permission.ADMIN_COURIER)
  async listCompanies(
    @Query() pagination: PaginationRequestDto,
  ): Promise<CourierCompanyListResponseVo> {
    return this.courierCompanyService.listCompanies(pagination);
  }

  @Post('init')
  @ApiOperation({ summary: '从 xlsx 文件初始化快递公司数据' })
  @ApiOkResponse({ type: CourierCompanyInitResultVo })
  @RequirePermission(Permission.ADMIN_COURIER)
  async initFromXlsx(): Promise<CourierCompanyInitResultVo> {
    return this.courierCompanyService.initFromXlsx();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取快递公司详情' })
  @ApiOkResponse({ type: CourierCompanyVo })
  @RequirePermission(Permission.ADMIN_COURIER)
  async getCompany(@Param('id') id: string): Promise<CourierCompanyVo> {
    return this.courierCompanyService.getCompany(id);
  }

  @Post()
  @ApiOperation({ summary: '创建快递公司' })
  @ApiOkResponse({ type: CourierCompanyVo })
  @RequirePermission(Permission.ADMIN_COURIER)
  async createCompany(@Body() body: CreateCourierCompanyRequestDto): Promise<CourierCompanyVo> {
    return this.courierCompanyService.createCompany(body);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新快递公司' })
  @ApiOkResponse({ type: CourierCompanyVo })
  @RequirePermission(Permission.ADMIN_COURIER)
  async updateCompany(
    @Param('id') id: string,
    @Body() body: UpdateCourierCompanyRequestDto,
  ): Promise<CourierCompanyVo> {
    return this.courierCompanyService.updateCompany(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除快递公司' })
  @ApiOkResponse({ description: '删除成功' })
  @RequirePermission(Permission.ADMIN_COURIER)
  async deleteCompany(@Param('id') id: string): Promise<void> {
    return this.courierCompanyService.deleteCompany(id);
  }
}
