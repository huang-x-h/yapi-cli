# YApi CLI Reference

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
| `config list` | Show config from .env |
| `categories <projectId>` | List categories |
| `interfaces <projectId>` | List interfaces |
| `interface <id>` | Get interface detail |
| `search "<keyword>"` | Search interfaces |
| `parse-java <file>` | Parse Java Controller |
| `create-interface [options]` | Create interface |
| `create-from-java <file> [options]` | Parse Java + create in YApi |
| `update-interface [options]` | Update interface |
| `delete-interface <id>` | Delete interface (requires confirmation) |

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
