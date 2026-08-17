import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireAccessLevel } from '../access-level.decorator';
import { AccessLevel } from '../access-level.enum';
import { CourierCompanyVo } from '../modules/courier-company/vo/courier-company.vo';
import { CourierCompanyService } from '../modules/courier-company/courier-company.service';

@ApiTags('client')
@ApiBearerAuth('bearer')
@RequireAccessLevel(AccessLevel.CLIENT)
@Controller('client/courier-companies')
export class ClientCourierCompanyController {
  constructor(private readonly courierCompanyService: CourierCompanyService) {}

  @Get()
  @ApiOperation({ summary: '获取已启用的快递公司列表' })
  @ApiOkResponse({ type: [CourierCompanyVo] })
  async listCompanies(): Promise<CourierCompanyVo[]> {
    return this.courierCompanyService.listAllEnabledCompanies();
  }
}
