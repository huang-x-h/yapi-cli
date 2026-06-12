---
name: yapi
description: Query and manage YApi interface management system. Supports querying projects, interfaces, categories, and creating interfaces from Java Controller files. Use when user wants to check API documentation, manage interfaces, or sync Java code to YApi.
---

# YApi Skill

通过 `yapi-api.js` 操作 YApi，无需安装任何 npm 包，只需 Node.js 18+。

## Setup

**通过 Agent 下载**：Agent 会自动在项目根目录放置 `yapi-api.js`，如果不存在请告知用户。

项目根目录创建 `.env` 文件：

```bash
YAPI_HOST=http://your-yapi.com
YAPI_PROJECT_TOKEN=xxx-your-token-xxx
YAPI_USERNAME=yourname
```

## Workflows

所有命令通过 `node yapi-api.js <command>` 执行。

### 1. 查询分类和接口

```bash
node yapi-api.js categories <projectId>
node yapi-api.js interfaces <projectId>
node yapi-api.js interfaces <projectId> --cat <catId>
```

### 2. 查看接口详情 / 搜索

```bash
node yapi-api.js interface <interfaceId>
node yapi-api.js search "<关键字>" --project <projectId>
```

### 3. 解析 Java Controller

```bash
node yapi-api.js parse-java UserController.java
```

### 4. 从 Java 创建接口到 YApi（核心）

```bash
# 预览 → 确认
node yapi-api.js create-from-java UserController.java --catid <catId> --dry-run
node yapi-api.js create-from-java UserController.java --catid <catId>

# 只创建某个方法
node yapi-api.js create-from-java UserController.java --catid <catId> --method getUserList
```

### 5. 手动创建 / 更新 / 删除

```bash
# 创建
node yapi-api.js create-interface --title "用户列表" --path /api/user/list --method GET --catid <catId>

# 更新状态
node yapi-api.js update-interface --id <interfaceId> --status done

# 删除（需二次确认）
node yapi-api.js delete-interface <interfaceId>
node yapi-api.js delete-interface <interfaceId> --yes    # 跳过确认
```

### 6. 查看配置

```bash
node yapi-api.js config
```
