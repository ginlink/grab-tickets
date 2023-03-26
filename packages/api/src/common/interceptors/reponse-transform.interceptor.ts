import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AjaxResult } from '../class/ajax-result.class';
import { DecoratorEnums } from 'enums/decoratorEnums';

@Injectable()
export class ReponseTransformInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // getHandler 值将覆盖 getClass上面的值
        const keep = this.reflector.getAllAndOverride<boolean>(
          DecoratorEnums.KEEP_KEY,
          [context.getHandler(), context.getClass()],
        );
        if (keep) {
          return data;
        }
        const response = context.switchToHttp().getResponse();
        response.header('Content-Type', 'application/json; charset=utf-8');
        return AjaxResult.success(data);
      }),
    );
  }
}
