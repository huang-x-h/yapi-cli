---
name: yapi
description: Query and manage YApi interface management system. Supports querying projects, interfaces, categories, and creating interfaces from Java Controller files. Use when user wants to check API documentation, manage interfaces, or sync Java code to YApi.
---

# YApi Skill

通过纯 Node.js 脚本 `yapi-api.js` 操作 YApi，无需安装任何 npm 包。

## Setup

**首次使用：**

1. 把技能目录里的 `yapi-api.js` 复制到项目根目录（如果不存在）
2. 项目根目录创建 `.env` 文件：

```bash
YAPI_HOST=http://your-yapi.com
YAPI_PROJECT_TOKEN=xxx-your-token-xxx
YAPI_USERNAME=yourname
```

> Token 在 YApi 项目设置 → Token 管理获取。Token 是项目级的，服务端自动识别项目。

## 命令

所有命令通过 `node yapi-api.js <command>` 执行。

### 查询

```bash
node yapi-api.js categories <projectId>
node yapi-api.js interfaces <projectId>
node yapi-api.js interfaces <projectId> --cat <catId>
node yapi-api.js interface <interfaceId>
node yapi-api.js search "<keyword>" --project <projectId>
```

### Java Controller 解析 + 创建（核心）

```bash
# 解析预览
node yapi-api.js parse-java UserController.java

# 预览创建效果（不实际创建）
node yapi-api.js create-from-java UserController.java --catid <catId> --dry-run

# 创建到 YApi
node yapi-api.js create-from-java UserController.java --catid <catId>

# 只创建某个方法
node yapi-api.js create-from-java UserController.java --catid <catId> --method getUserList
```

### 手动创建 / 更新 / 删除

```bash
# 创建
node yapi-api.js create-interface --title "用户列表" --path /api/user/list --method GET --catid <catId>

# 更新
node yapi-api.js update-interface --id <interfaceId> --status done

# 删除（需二次确认）
node yapi-api.js delete-interface <interfaceId>
node yapi-api.js delete-interface <interfaceId> --yes
```

### 其他

```bash
node yapi-api.js config                              # 查看配置
node yapi-api.js add-category <projectId> <name>     # 添加分类
```

> 详细参数和说明见 [REFERENCE.md](REFERENCE.md)
