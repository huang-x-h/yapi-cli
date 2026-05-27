# YApi CLI

YApi 接口管理平台 CLI 工具，供 AI Agent 调用操作 YApi 系统。

## 安装

```bash
npm install -g @huang.xinghui/yapi-cli
```

## 配置

```bash
# 设置 YApi 地址
yapi-cli config set host http://your-yapi.com

# 登录项目（绑定 projectId 和 token）
yapi-cli login <projectId> <token>

# 查看当前配置
yapi-cli config list
```

## 多项目切换

```bash
# 列出所有已配置的项目 token
yapi-cli tokens

# 切换当前项目
yapi-cli switch <projectId>
```

## 常用命令

```bash
# 查看项目详情
yapi-cli project <projectId>

# 查看分类
yapi-cli categories <projectId>

# 查看接口列表
yapi-cli interfaces <projectId>

# 查看接口详情
yapi-cli interface <interfaceId>

# 搜索接口
yapi-cli search "关键词"

# 查看项目全部数据
yapi-cli list <projectId>
```

## 命令参考

| 命令                        | 说明           |
| --------------------------- | -------------- |
| `config set host <url>`     | 设置 YApi 地址 |
| `config list`               | 查看配置       |
| `login <projectId> <token>` | 登录项目       |
| `switch <projectId>`        | 切换项目       |
| `tokens`                    | 列出项目 token |
| `project <id>`              | 项目详情       |
| `categories <projectId>`    | 分类列表       |
| `interfaces <projectId>`    | 接口列表       |
| `interface <id>`            | 接口详情       |
| `search <keyword>`          | 搜索           |
| `list <projectId>`          | 项目全量数据   |

## 配置文件

`~/.yapi-cli/config.json`

```json
{
  "host": "http://your-yapi.com",
  "currentProjectId": "3101",
  "projectTokens": {
    "3101": "xxx-token-xxx"
  }
}
```
