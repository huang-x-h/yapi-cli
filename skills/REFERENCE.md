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
| `--pid` | ✅ | 项目 ID |
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

> 参数提取（`@RequestParam` / `@PathVariable` / `@RequestBody`）暂未实现，目前 `create-from-java` 创建的接口不包含参数细节。如需参数，请通过 YApi API 直接调用 `interface/save` 后续补充。

## 已知约束与踩坑记录

### 1. 删除接口需要用户登录
`interface/del` 接口需要 session 认证（用户密码登录），项目 Token 无删除权限。需在 YApi 后台手动删除。

### 2. 更新接口时必须传入完整字段
`interface/save` 用于更新时，必须同时传入以下字段，否则返回"服务器出错"：
- `id` — 接口ID
- `pid` — 项目ID
- `catid` — 分类ID
- `title` — 接口标题
- `path` — 请求路径
- `method` — HTTP方法

脚本的 `update-interface` 命令已支持 `--pid` 参数（需同时传入 `--pid` 和 `--catid`），使用方式：
```bash
node yapi-api.mjs update-interface --id 200818 --pid 3101 --catid 30325 --status done
```

### 3. JSON Schema 参数名称显示
YApi 的 JSON Schema 渲染器中：
- **根节点为 `array` / 基本类型（`string`、`integer`、`number` 等）**：最外层不显示参数名称
- **根节点为 `object` 类型**：属性名会作为参数名称显示
- 要让参数名显示（如 `dtoList`、`requestBody`），需将根节点改为 `object`，把实际类型作为命名属性包裹：
  ```json
  {
    "type": "object",
    "title": "请求参数",
    "properties": {
      "dtoList": {
        "type": "array",
        "items": { ... }
      }
    }
  }
  ```
  基本类型同理：
  ```json
  {
    "type": "object",
    "properties": {
      "requestBody": {
        "type": "string",
        "description": "原始请求体"
      }
    }
  }
  ```

### 4. req_params 的用途
`req_params` 字段用于 **URL 路径参数**（如 `/api/user/{id}` 中的 `id`），不用于 JSON 请求体的参数名称。不要混淆。

### 5. 编码问题
Windows Bash 环境下，curl 内嵌中文 JSON 可能出现乱码。推荐写 `.mjs` 脚本用 Node.js 的 fetch 发送请求，确保 UTF-8 编码正确。

### 6. 获取项目 ID
调用 `/api/project/get?token=<TOKEN>` 即可获取项目信息（含 `_id`），无需额外步骤。

### 7. 请求体/响应体 Schema 格式
设置 `req_body_is_json_schema: true` / `res_body_is_json_schema: true` 后，YApi 使用 JSON Schema 渲染树形参数结构。
- Schema 的 `title` 字段用作参数显示名
- Schema 的 `description` 字段用作参数描述
- 支持 `example` 字段显示示例值
