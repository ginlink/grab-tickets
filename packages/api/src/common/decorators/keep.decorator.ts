import { SetMetadata } from '@nestjs/common';
import { DecoratorEnums } from 'enums/decoratorEnums';

export const Keep = () => SetMetadata(DecoratorEnums.KEEP_KEY, true);
