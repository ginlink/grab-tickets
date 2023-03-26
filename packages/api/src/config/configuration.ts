import { Logger } from '@nestjs/common';
import { LoggerEnum } from 'enums/enums';
import * as path from 'path';

// 配置文件接口
export interface IConfig {
  /**
   * 后台管理jwt token密钥
   */
  jwt?: {
    secret: string;
  };

  /**
   * 数据库配置
   */
  database?: {
    uri: string;
  };

  /**
   * redis 配置
   */
  redis?: {
    config: {
      url: string;
    };
  };
}

// 判断系统是否是开发环境
export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

export const SRC_DIR = path.resolve(__dirname, '..');
export const ROOT_DIR = path.resolve(__dirname, '../..');

// 根据环境变量判断使用配置
export default () => {
  let envConfig: IConfig = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    envConfig = require(`./config.${process.env.NODE_ENV}`).default;
  } catch (e) {
    const logger = new Logger(LoggerEnum.config);
    logger.error(e);
  }

  // 返回环境配置
  return envConfig;
};
