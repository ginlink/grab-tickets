import { Controller, Get } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { DataObj } from '@/common/class/data-obj.class';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get('/test')
  async test() {
    const data = await this.toolsService.test();
    return DataObj.create(data);
  }

  @Get('/init')
  async init() {
    const data = await this.toolsService.init();
    return DataObj.create(data);
  }
}
