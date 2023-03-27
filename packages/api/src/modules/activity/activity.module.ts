import { Module, forwardRef } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { TicketCodeModule } from '../ticket-code/ticket-code.module';

@Module({
  imports: [forwardRef(() => TicketCodeModule)],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
