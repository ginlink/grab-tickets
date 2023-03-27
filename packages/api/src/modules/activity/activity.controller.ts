import { Controller, Get, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { DataObj } from '@/common/class/data-obj.class';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('list')
  async list(@Query() query: any) {
    const data = await this.activityService.list(query);
    return DataObj.create(data);
  }

  @Get('detail')
  async detail(@Query('aid') aid: string) {
    const data = await this.activityService.getDetail(aid);
    return DataObj.create(data);
  }
}
