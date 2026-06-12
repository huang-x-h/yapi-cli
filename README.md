# YApi Skill

YApi 接口管理技能，供 AI Agent 通过 `npx skills add` 安装使用。

## 安装

```bash
npx skills add huang-x-h/yapi-cli -g
```

## 使用

1. Agent 会把 `skills/yapi-api.js` 复制到项目根目录
2. 项目根目录创建 `.env`：

```bash
YAPI_HOST=http://your-yapi.com
YAPI_PROJECT_TOKEN=xxx-your-token-xxx
YAPI_USERNAME=yourname
```

3. 运行命令：

```bash
node yapi-api.js categories <projectId>
node yapi-api.js parse-java UserController.java
node yapi-api.js create-from-java UserController.java --catid <catId>
```

## 文件结构

```
yapi-cli/
├── skills/
│   ├── SKILL.md         # 技能指令
│   ├── REFERENCE.md     # 命令参考
│   └── yapi-api.js      # 独立脚本（无 npm 依赖）
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
| `delete-interface` | 删除接口 |
| `add-category` | 添加分类 |

## 环境变量

| 变量 | 说明 |
|------|------|
| `YAPI_HOST` | YApi 地址（必填） |
| `YAPI_PROJECT_TOKEN` | 项目 Token（必填） |
| `YAPI_USERNAME` | 默认创建人（可选） |

## 依赖

仅需 Node.js 18+。`yapi-api.js` 使用 Node.js 内置模块（fetch/fs/path），无任何外部依赖。
