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
| `create-interface [options]` | 创建接口 |
| `create-from-java <file> [options]` | 解析 Java + 创建 |
| `update-interface [options]` | 更新接口 |
| `add-category <projectId> <name> [desc]` | 添加分类 |

## create-interface 选项

| 选项 | 必填 | 说明 |
|------|------|------|
| `--title` | ✅ | 接口标题 |
| `--path` | ✅ | 请求路径 |
| `--method` | ✅ | HTTP 方法 |
| `--catid` |  | 分类 ID |
| `--desc` |  | 接口描述 |
| `--status` |  | 状态（undone/done） |
| `--req-body-other` |  | 请求体 JSON |
| `--res-body` |  | 响应体 JSON |

## create-from-java 选项

| 选项 | 说明 |
|------|------|
| `--catid` | 分类 ID |
| `--username` | 创建人（默认 .env 中的 `YAPI_USERNAME`） |
| `--method` | 只创建指定的方法名 |
| `--dry-run` | 预览模式，不实际创建 |

## update-interface 选项

| 选项 | 必填 | 说明 |
|------|------|------|
| `--id` | ✅ | 接口 ID |
| `--title` |  | 新标题 |
| `--path` |  | 新路径 |
| `--method` |  | 新 HTTP 方法 |
| `--catid` |  | 移动到新分类 |
| `--desc` |  | 新描述 |
| `--status` |  | 状态（done/undone） |
| `--req-body-other` |  | 请求体 JSON |
| `--res-body` |  | 响应体 JSON |

## Java Controller 解析

当前实现只提取以下信息：

- **类级别**: `@RequestMapping("/api")` 作为路径前缀
- **方法**: `@GetMapping` / `@PostMapping` / `@PutMapping` / `@DeleteMapping` / `@PatchMapping` / `@RequestMapping(method=POST)`
- **标题**: 优先取 Javadoc 描述，否则由方法名生成（如 `getUserList` → `Get User List`）
- **输出格式**:
  ```json
  {
    "className": "UserController",
    "methods": [
      { "methodName": "list", "title": "...", "path": "/api/users", "method": "GET", "returnType": "Result" }
    ]
  }
  ```

> 参数提取（`@RequestParam` / `@PathVariable` / `@RequestBody`）暂未实现，目前 `create-from-java` 创建的接口不包含参数细节。如需参数，请使用 `update-interface --req-body-other` 后续补充。
