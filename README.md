# YApi Skill

YApi 接口管理 AI 技能。AI Agent 通过 `npx skills add` 安装后，可自动从 Java Controller 类创建接口到 YApi。

## 工作原理

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐
│  AI Agent       │───▶│  yapi-api.js     │───▶│  YApi 服务   │
│  (使用 skill)   │    │  (纯 Node.js 脚本) │    │             │
└─────────────────┘    └──────────────────┘    └─────────────┘
                            │    ▲
                            ▼    │
                       .env (配置)
```

`yapi-api.js` 使用纯 Node.js 内置模块，无任何 npm 依赖，仅需 Node.js 18+。

## 安装

```bash
npx skills add huang-x-h/yapi-cli -g
```

## 使用流程

### 1. 配置 .env

项目根目录创建 `.env` 文件：

```bash
YAPI_HOST=http://your-yapi.com
YAPI_PROJECT_TOKEN=xxx-your-token-xxx
YAPI_USERNAME=yourname
```

> Token 在 YApi 项目设置 → Token 管理获取。Token 是项目级，服务端自动识别项目。

### 2. 使用命令

```bash
# 查询
node yapi-api.js categories <projectId>
node yapi-api.js interfaces <projectId>
node yapi-api.js interface <id>
node yapi-api.js search "<keyword>"

# 核心：从 Java Controller 自动创建接口
node yapi-api.js parse-java UserController.java                          # 解析预览
node yapi-api.js create-from-java UserController.java --catid 456        # 实际创建
node yapi-api.js create-from-java UserController.java --catid 456 --method getUserList  # 指定方法
node yapi-api.js create-from-java UserController.java --catid 456 --dry-run  # 仅预览

# 手动创建 / 更新 / 删除
node yapi-api.js create-interface --title "用户列表" --path /api/user/list --method GET --catid 456
node yapi-api.js update-interface --id 123 --status done
node yapi-api.js delete-interface 123          # 二次确认
node yapi-api.js delete-interface 123 --yes    # 跳过确认
```

## 项目结构

```
yapi-cli/
├── skills/
│   ├── SKILL.md         技能指令（AI Agent 读取）
│   ├── REFERENCE.md     命令参考
│   └── yapi-api.js      独立脚本（无 npm 依赖）
├── .env.example
├── package.json
└── README.md
```

## 命令一览

| 命令 | 说明 |
|------|------|
| `categories <projectId>` | 分类列表 |
| `interfaces <projectId>` | 接口列表 |
| `interface <id>` | 接口详情 |
| `search <keyword>` | 搜索 |
| `parse-java <file>` | 解析 Java Controller |
| `create-interface` | 创建接口 |
| `create-from-java` | Java 解析 + 创建 |
| `update-interface` | 更新接口 |
| `delete-interface` | 删除接口（需确认） |
| `add-category` | 添加分类 |

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `YAPI_HOST` | ✅ | YApi 服务地址 |
| `YAPI_PROJECT_TOKEN` | ✅ | 项目 Token |
| `YAPI_USERNAME` |  | 默认创建人（可选） |

## 依赖

- Node.js 18+
- 无任何 npm 依赖

## License

MIT
