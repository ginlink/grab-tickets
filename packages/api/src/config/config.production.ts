import { defineConfig } from './defineConfig';

export default defineConfig({
  jwt: {
    secret: process.env.JWT_SECRET || '123456',
  },
  // 数据库 配置
  database: {
    uri: 'mongodb://root:admin@localhost:27018/nodejs_cloumn?authSource=admin',
  },
  // redis 配置
  redis: {
    config: {
      url: 'redis://localhost:6381/0',
    },
  },
});
