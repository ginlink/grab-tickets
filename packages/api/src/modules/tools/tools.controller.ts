import { Controller, Get } from '@nestjs/common';
import { ToolsService } from './tools.service';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Get('/test')
  async test() {
    return this.toolsService.test();
  }

  @Get('/init')
  async init() {
    return this.toolsService.init();
  }
}
