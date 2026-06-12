# YApi API Reference

## 配置

所有配置从 `.env` 文件读取。

| 变量 | 说明 |
|------|------|
| `YAPI_HOST` | YApi 服务地址（必填） |
| `YAPI_PROJECT_TOKEN` | 项目 Token（必填） |
| `YAPI_USERNAME` | 默认创建人（可选） |

## 命令参考

| 命令 | 说明 |
|------|------|
| `config` | 查看当前配置 |
| `categories <projectId>` | 分类列表 |
| `interfaces <projectId> [--cat <id>]` | 接口列表 |
| `interface <id>` | 接口详情 |
| `search <keyword> [--project <id>]` | 搜索 |
| `parse-java <file>` | 解析 Java Controller |
| `create-interface --title --path --method [options]` | 创建接口 |
| `create-from-java <file> [--catid] [--dry-run]` | Java 解析 + 创建 |
| `update-interface --id <id> [options]` | 更新接口 |
| `delete-interface <id> [--yes]` | 删除接口 |
| `add-category <projectId> <name>` | 添加分类 |

## create-interface 选项

| 选项 | 说明 |
|------|------|
| `--title` | 接口标题（必填） |
| `--path` | 请求路径（必填） |
| `--method` | HTTP 方法（必填） |
| `--pid` | 项目 ID（可选） |
| `--catid` | 分类 ID |
| `--desc` | 接口描述 |
| `--status` | 状态（undone/done） |
| `--req-body-other` | 请求体 JSON |
| `--res-body` | 响应体 JSON |

## create-from-java 选项

| 选项 | 说明 |
|------|------|
| `--catid` | 分类 ID |
| `--username` | 创建人（默认 .env） |
| `--method` | 只创建指定方法 |
| `--dry-run` | 预览模式 |

## Java Controller 解析规则

- **类级别**: `@RequestMapping("/api")` → 路径前缀
- **方法**: `@GetMapping` `@PostMapping` `@PutMapping` `@DeleteMapping` `@PatchMapping` `@RequestMapping`
- **参数**: `@RequestParam`/`@PathVariable`/`@RequestBody`
- **文档**: Javadoc 注释
