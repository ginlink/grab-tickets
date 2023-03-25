## Metaproxies Monorepo 库

项目包含 dragon官网和 dashboard 两个项目

### 开发

> ⚠️ 请使用 yarn 包管理器，本项目由 yarn + lerna 构建的 Monorepo 库

装包，如遇到问题，[请阅读](#问题)

```sh
yarn
```

启动 dashboard 项目

```sh
yarn dev:db
```

启动 官网 项目

```sh
yarn dev:of
```

到对应目录开发即可

### 构建

同时构建 dashboard 和官网

```sh
yarn build
```

单独构建

```sh
yarn build:db
# 或者
yarn build:of
```

### 发布

发布 `0.1.2` 版本，并携带changelog

```sh
npx lerna version 0.1.2 --conventional-commits
```

### 问题

1.【装包】connect ECONNREFUSED [0.0.0.0:443](http://0.0.0.0:443) ⚠ gifsicle pre-build test failed

原因：网络问题

解决方案：挂代理，并复制到终端代理，再次运行 yarn

