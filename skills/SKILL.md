---
name: yapi
description: Query and manage YApi interface management system. Supports querying projects, interfaces, categories, and creating interfaces from Java Controller files. Use when user wants to check API documentation, manage interfaces, or sync Java code to YApi.
---

# YApi Skill

Manage YApi via `yapi-cli`. 所有配置从 `.env` 文件读取。

## Quick Start

项目根目录创建 `.env` 文件，填入 YApi 地址、Token 和用户名：

```bash
YAPI_HOST=http://your-yapi.com
YAPI_PROJECT_TOKEN=xxx-your-token-xxx
YAPI_USERNAME=yourname
```

## Workflows

### 1. 查询分类和接口

**User says**: "查看{项目}的分类 / 接口"

```bash
yapi-cli categories <projectId>        # 分类列表
yapi-cli interfaces <projectId>         # 接口列表
yapi-cli interfaces <projectId> --cat <catId>  # 指定分类
```

### 2. 查看接口详情

**User says**: "查看接口{id}详情 / 搜索{keyword}"

```bash
yapi-cli interface <interfaceId>
yapi-cli search "<关键字>" --project <projectId>
```

### 3. 解析 Java Controller

**User says**: "分析下 UserController.java 有哪些接口"

```bash
yapi-cli parse-java UserController.java
```

### 4. 从 Java 创建接口到 YApi（核心功能）

**User says**: "把 UserController.java 的接口创建到 YApi 上，放到分类{cid}下"

```bash
# 预览 → 确认
yapi-cli create-from-java UserController.java --catid <catId> --dry-run
yapi-cli create-from-java UserController.java --catid <catId>

# 只创建某个方法
yapi-cli create-from-java UserController.java --catid <catId> --method getUserList
```

### 5. 手动创建接口

**User says**: "创建一个 GET 接口 /api/user/list，标题叫用户列表"

```bash
yapi-cli create-interface --title "用户列表" --path /api/user/list --method GET --catid <catId>
```

### 6. 更新和删除接口

**User says**: "把接口{id}状态改已完成 / 删除接口{id}"

```bash
yapi-cli update-interface --id <interfaceId> --status done
yapi-cli delete-interface <interfaceId>          # 需二次确认
yapi-cli delete-interface <interfaceId> --yes    # 跳过确认
```

### 7. 查看配置

**User says**: "查看当前配置"

```bash
yapi-cli config list
```

> 完整命令参考和参数详解见 [REFERENCE.md](REFERENCE.md)
