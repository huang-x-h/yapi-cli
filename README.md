# YApi CLI

YApi 接口管理平台 CLI 工具，支持自动解析 Java Controller 创建接口到 YApi。

## 两种用法

### 方式一：独立脚本（推荐，无需安装）

把 `yapi-api.js` 放到项目根目录，`node yapi-api.js <command>` 直接使用：

```bash
# 先创建 .env
YAPI_HOST=http://your-yapi.com
YAPI_PROJECT_TOKEN=xxx
YAPI_USERNAME=yourname

# 使用
node yapi-api.js categories <projectId>
node yapi-api.js parse-java UserController.java
node yapi-api.js create-from-java UserController.java --catid <catId>
```

> 仅需 Node.js 18+，无任何 npm 依赖。

### 方式二：全局安装

```bash
npm install -g @huang.xinghui/yapi-cli
yapi-cli categories <projectId>
```

## .env 配置

```bash
YAPI_HOST=http://your-yapi.com
YAPI_PROJECT_TOKEN=xxx-your-token-xxx
YAPI_USERNAME=admin
```

## 命令一览

| 命令 | 说明 |
|------|------|
| `config` | 查看配置 |
| `categories <projectId>` | 分类列表 |
| `interfaces <projectId>` | 接口列表 |
| `interface <id>` | 接口详情 |
| `search <keyword>` | 搜索 |
| `parse-java <file>` | 解析 Java Controller |
| `create-interface` | 创建接口 |
| `create-from-java` | Java 解析 + 创建 |
| `update-interface` | 更新接口 |
| `delete-interface` | 删除接口（需确认） |

## 环境变量

| 变量 | 说明 |
|------|------|
| `YAPI_HOST` | YApi 地址（必填） |
| `YAPI_PROJECT_TOKEN` | 项目 Token（必填） |
| `YAPI_USERNAME` | 默认创建人（可选） |
