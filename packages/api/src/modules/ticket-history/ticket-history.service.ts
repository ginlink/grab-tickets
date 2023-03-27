import { TicketCodeService } from '@/modules/ticket-code/ticket-code.service';
import { TicketHistory } from '@/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import dayjs from 'dayjs';
import { LoggerEnum } from 'enums/enums';

@Injectable()
export class TicketHistoryService {
  private readonly logger = new Logger(LoggerEnum.ticket);

  constructor(
    @InjectModel(TicketHistory.name)
    private readonly ticketHistoryModel: ReturnModelType<typeof TicketHistory>,

    private readonly ticketCodeService: TicketCodeService,
  ) {}

  async insertHistory(aid: string, code: string, userId: string) {
    const codeInfo = await this.ticketCodeService.getInfoByCode(code);

    if (!codeInfo) {
      // 该类告警比较严重，如果出现该问题，则应迅速排查，不过这时候票已经属于该用户，问题倒不是非常严重
      this.logger.error('can not find code info, import code error', {
        aid,
        code,
      });
    }

    const history: Partial<TicketHistory> = {
      userId,
      codeId: code,
      time: dayjs().unix(),
    };

    const rowInfo = await this.ticketHistoryModel.create(history);
    if (!rowInfo) {
      this.logger.error(
        'insert history error, user will not see his ticket code',
        { rowInfo },
      );
    }

    return rowInfo;
  }
}
