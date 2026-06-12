---
name: yapi
description: Query and manage YApi interface management system. Supports querying projects, interfaces, categories, and creating interfaces from Java Controller files. Use when user wants to check API documentation, manage interfaces, or sync Java code to YApi.
---

# YApi Skill

Manage YApi via yapi-cli (`yapi-cli`). 所有配置从项目根目录的 `.env` 文件读取，无需全局配置。

## Quick Start

项目根目录创建 `.env` 文件：

```bash
YAPI_HOST=http://your-yapi.com
YAPI_PROJECT_TOKEN=xxx-your-token-xxx
YAPI_USERNAME=yourname
```

## Workflows

### 1. 查看分类和接口

**User says**: "查看{项目}的分类"

```bash
yapi-cli categories <projectId> | grep "<分类关键字>"
```

**User says**: "查看{项目}的接口"

```bash
yapi-cli interfaces <projectId>
```

### 2. 查看接口详情

**User says**: "查看接口{id}详情"

```bash
yapi-cli interface <interfaceId>
```

### 3. 按分类查看接口

**User says**: "查看{项目}的{分类名}接口"

```bash
# 获取分类列表
yapi-cli categories <projectId> | grep "<分类关键字>"

# 查看分类下接口
yapi-cli interfaces <projectId> --cat <catId>
```

### 4. 搜索接口

**User says**: "搜索{关键字}相关接口"

```bash
yapi-cli search "<关键字>"
```

### 5. 解析 Java Controller 预览

**User says**: "分析下 UserController.java 有哪些接口"

```bash
yapi-cli parse-java UserController.java
```

### 6. 从 Java Controller 自动创建接口到 YApi（核心功能）

**User says**: "把 UserController.java 的所有接口创建到 YApi 上，放到分类{cid}下"

```bash
# 直接创建，--username 自动从 .env 读取
yapi-cli create-from-java UserController.java --catid <catId>
```

**User says**: "先预览再创建"

```bash
# 预览模式
yapi-cli create-from-java UserController.java --catid <catId> --dry-run

# 确认后创建
yapi-cli create-from-java UserController.java --catid <catId>
```

### 7. 手动创建接口

**User says**: "创建一个 GET 接口 /api/user/list，标题叫用户列表"

```bash
yapi-cli create-interface \
  --title "用户列表" \
  --path /api/user/list \
  --method GET \
  --catid <catid>
```

### 8. 更新和删除接口

**User says**: "把接口{id}的状态改为已完成"

```bash
yapi-cli update-interface --id <interfaceId> --status done
```

**User says**: "删除接口{id}"

```bash
# 会弹出确认提示
yapi-cli delete-interface <interfaceId>
# 或用 --yes 跳过确认
yapi-cli delete-interface <interfaceId> --yes
```

### 9. 查看配置

**User says**: "查看当前配置"

```bash
yapi-cli config list
```

## 配置说明

所有配置从 `.env` 文件读取（也支持系统环境变量覆盖），**不需要** `~/.yapi-cli/config.json`。

| 变量 | 说明 | 示例 |
|------|------|------|
| `YAPI_HOST` | YApi 服务地址（必填） | `http://your-yapi.com` |
| `YAPI_PROJECT_TOKEN` | 项目 Token（必填） | `xxx-your-token-xxx` |
| `YAPI_USERNAME` | 默认创建人（可选） | `admin` |

加载顺序：系统环境变量 > `.env` 文件

## Command Reference

| Command | Description |
|---------|-------------|
| Command | Description |
|---------|-------------|
| `config list` | Show config from .env |
| `categories <projectId>` | List categories |
| `interfaces <projectId>` | List interfaces |
| `interface <id>` | Get interface detail |
| `search "<keyword>"` | Search interfaces |
| `parse-java <file>` | Parse Java Controller |
| `create-interface [options]` | Create interface |
| `create-from-java <file> [options]` | Parse Java + create in YApi |
| `update-interface [options]` | Update interface |
| `delete-interface <id>` | Delete interface (requires confirmation)

## 接口参数详解

### create-interface 选项

| 选项 | 说明 |
|------|------|
| `--title` | 接口标题（必填） |
| `--path` | 请求路径（必填） |
| `--method` | HTTP 方法（必填） |
| `--pid` | 项目 ID（可选，YApi 从 token 推导） |
| `--catid` | 分类 ID |
| `--desc` | 接口描述 |
| `--username` | 创建人用户名 |
| `--req-query` | 查询参数（JSON 数组） |
| `--req-body-other` | 请求体（JSON，自动表格展示） |
| `--res-body` | 响应体（JSON，自动表格展示） |

### create-from-java 选项

| 选项 | 说明 |
|------|------|
| `--pid` | 项目 ID（可选） |
| `--catid` | 分类 ID |
| `--username` | 创建人用户名（默认从 .env 读取） |
| `--method` | 只创建指定的方法名 |
| `--dry-run` | 预览模式 |

## Java Controller 解析规则

- **类级别**: `@RequestMapping("/api/v1")`（路径前缀）
- **方法注解**: `@GetMapping` `@PostMapping` `@PutMapping` `@DeleteMapping` `@PatchMapping` `@RequestMapping`
- **参数**: `@RequestParam` → 查询参数、`@PathVariable` → 路径参数、`@RequestBody` → 请求体参数
- **文档**: Javadoc 注释

## 输出格式

默认 JSON。使用 `--format table` 输出表格。

```bash
yapi-cli interfaces <projectId> --format table
```
