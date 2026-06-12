# YApi CLI

YApi 接口管理平台 CLI 工具，供 AI Agent 调用操作 YApi 系统。

支持自动解析 Java Controller 类创建接口到 YApi。

**所有配置从项目根目录 `.env` 文件读取，无需全局配置。**

## 安装

```bash
npm install -g @huang.xinghui/yapi-cli
```

## 配置

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```bash
# YApi 服务地址（必填）
YAPI_HOST=http://your-yapi.com

# 项目 Token（必填，从 YApi 项目设置 -> Token 管理获取）
YAPI_PROJECT_TOKEN=xxx-your-token-xxx

# 默认创建人（可选，接口创建者的用户名）
YAPI_USERNAME=admin
```

**配置加载顺序**：系统环境变量 > `.env` 文件

## Java Controller 自动创建接口（核心功能）

支持解析 Spring 注解，自动提取路径、HTTP 方法、参数等信息。

### 解析预览

```bash
yapi-cli parse-java UserController.java
```

### 一键创建到 YApi

```bash
# 直接创建（--username 自动从 .env 读取）
yapi-cli create-from-java UserController.java --catid 456

# 只创建某个方法
yapi-cli create-from-java UserController.java --catid 456 --method getUserList

# 先预览
yapi-cli create-from-java UserController.java --catid 456 --dry-run
```

### 手动创建接口

```bash
yapi-cli create-interface \
  --title "用户列表" \
  --path /api/v1/users/list \
  --method GET \
  --catid 456
```

### 更新和删除

```bash
# 更新接口
yapi-cli update-interface --id 123 --title "新标题" --status done

# 删除接口（需二次确认）
yapi-cli delete-interface 123
# 或用 --yes 跳过确认
yapi-cli delete-interface 123 --yes
```

## 常用查询命令

```bash
yapi-cli config list          # 查看当前配置
yapi-cli categories <id>      # 分类列表
yapi-cli interfaces <id>      # 接口列表
yapi-cli interface <id>       # 接口详情
yapi-cli search "关键词"       # 搜索
```

## 命令参考

| 命令 | 说明 |
|------|------|
| `config list` | 查看配置（从 .env 读取） |
| `categories <projectId>` | 分类列表 |
| `interfaces <projectId>` | 接口列表 |
| `interface <id>` | 接口详情 |
| `search <keyword>` | 搜索 |
| `parse-java <file>` | 解析 Java Controller |
| `create-interface [options]` | 创建接口 |
| `create-from-java <file> [options]` | Java 解析 + 创建 |
| `update-interface [options]` | 更新接口 |
| `delete-interface <id>` | 删除接口（需二次确认） |

## 环境变量参考

| 变量 | 说明 |
|------|------|
| `YAPI_HOST` | YApi 服务地址（必填） |
| `YAPI_PROJECT_TOKEN` | 项目 Token（必填） |
| `YAPI_USERNAME` | 默认创建人（可选） |
