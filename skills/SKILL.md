---
name: yapi
description: Query YApi interface management system for projects, interfaces, categories. Use when user wants to check API documentation, interface lists, or any YApi related queries.
---

# YApi Skill

Query YApi via yapi-cli (`yapi-cli`)

## Quick Start

```bash
# 设置 YApi 地址
yapi-cli config set host http://your-yapi.com

# 登录项目（绑定 projectId 和 token）
yapi-cli login <projectId> <token>

# 切换项目
yapi-cli switch <projectId>
```

## Workflows

### 1. 查询项目数据

**User says**: "查看{项目名}项目"

```bash
# Step 1: 获取项目详情
yapi-cli project <projectId>

# Step 2: 查看项目全部数据
yapi-cli list <projectId>
```

### 2. 查看接口详情

**User says**: "查看接口{id}详情"

```bash
yapi-cli interface <interfaceId>
```

### 3. 按分类查看接口

**User says**: "查看{项目}的{分类名}接口"

```bash
# Step 1: 获取分类
yapi-cli categories <projectId> | grep "<分类关键字>"

# Step 2: 查看分类下接口
yapi-cli interfaces <projectId> --cat <catId>
```

### 4. 搜索接口

**User says**: "搜索{关键字}相关接口"

```bash
yapi-cli search "<关键字>"
```

## Command Reference

| Command | Description |
|---------|-------------|
| `config set host <url>` | Set YApi host |
| `config list` | Show config |
| `login <projectId> <token>` | Login project |
| `switch <projectId>` | Switch project |
| `tokens` | List project tokens |
| `project <id>` | Get project detail |
| `categories <projectId>` | List categories |
| `interfaces <projectId>` | List interfaces |
| `interface <id>` | Get interface detail |
| `interface <id> --with-case` | Get interface with test cases |
| `search "<keyword>"` | Search interfaces |
| `list <projectId>` | List project data (categories + interfaces) |

## Filter Options

**Interfaces**:
- `--cat <id>` - Filter by category
- `--status <status>` - undone/done/deprecated
- `--tag <tag>` - Filter by tag

## Output Format

Default JSON. Use `--format table` for table output.

```bash
yapi-cli interfaces <projectId> --format table
```

## Token Management

Get token from: Project Settings -> Token Management

Config file: `~/.yapi-cli/config.json`