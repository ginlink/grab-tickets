import { Controller, Get, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('list')
  list(@Query() query: any) {
    return this.activityService.list(query);
  }

  @Get('detail')
  async detail(@Query('aid') aid: string) {
    const detail = await this.activityService.getDetail(aid);
    return {
      data: detail,
    };
  }
}
