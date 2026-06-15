---
name: yapi
description: Query and manage YApi interface management system. Supports querying projects, interfaces, categories, and creating interfaces from Java Controller files. Use when user wants to check API documentation, manage interfaces, or sync Java code to YApi.
---

# YApi Skill

通过纯 Node.js 脚本 `yapi-api.mjs` 操作 YApi，无需安装任何 npm 包。

## Setup

**首次使用：**

1. 把技能目录里的 `yapi-api.mjs` 复制到项目根目录（如果不存在）
2. 项目根目录创建 `.env` 文件：

```bash
YAPI_HOST=http://your-yapi.com
YAPI_PROJECT_TOKEN=xxx-your-token-xxx
YAPI_USERNAME=yourname
```

> Token 在 YApi 项目设置 → Token 管理获取。Token 是项目级的，服务端自动识别项目。

## 命令

所有命令通过 `node yapi-api.mjs <command>` 执行。

### 查询

```bash
node yapi-api.mjs categories <projectId>
node yapi-api.mjs interfaces <projectId>
node yapi-api.mjs interfaces <projectId> --cat <catId>
node yapi-api.mjs interface <interfaceId>
node yapi-api.mjs search "<keyword>" --project <projectId>
```

### Java Controller 解析 + 创建（核心）

```bash
# 解析预览
node yapi-api.mjs parse-java UserController.java

# 预览创建效果（不实际创建）
node yapi-api.mjs create-from-java UserController.java --catid <catId> --dry-run

# 创建到 YApi
node yapi-api.mjs create-from-java UserController.java --catid <catId>

# 只创建某个方法
node yapi-api.mjs create-from-java UserController.java --catid <catId> --method getUserList
```

### 手动创建 / 更新 / 删除

```bash
# 创建
node yapi-api.mjs create-interface --title "用户列表" --path /api/user/list --method GET --catid <catId>

# 更新（必须同时传入 --pid、--catid 等字段，否则报错）
node yapi-api.mjs update-interface --id <interfaceId> --pid <projectId> --catid <catId> --status done
```

> 注：删除接口不在 token 权限范围内，需要在 YApi 后台手动操作。

> 注：更新接口时，`interface/save` API 必须同时传入 `pid`（项目ID）、`catid`、`title`、`path`、`method` 等完整字段，否则返回"服务器出错"。

### JSON Schema 注意事项

**更新接口并填入请求/响应Schema时**，不建议用 `update-interface` 命令的 `--req-body-other`，因为该命名不传 `pid` 等字段会导致"服务器出错"。建议直接调用 YApi API：

```bash
# 写一个.mjs脚本（参考下方）：
node update_schema.mjs
```

```javascript
// update_schema.mjs 示例
const payload = {
  id: 200818,
  pid: 3101,               // 项目ID（必填）
  catid: 30325,            // 分类ID（必填）
  title: "接口标题",
  path: "/api/path",
  method: "POST",
  req_body_other: JSON.stringify(reqSchema),
  req_body_type: "json",
  req_body_is_json_schema: true,
  res_body: JSON.stringify(resSchema),
  res_body_type: "json",
  res_body_is_json_schema: true,
  token: "xxx"
};
```

**关于Body参数名称显示：**
- YApi的JSON Schema渲染中，如果根节点类型为 `array`，最外层不显示参数名
- 要显示参数名（如 `dtoList`），需将根节点改为 `object`，把数组作为命名属性包裹：
  ```json
  {"type":"object","properties":{"dtoList":{"type":"array","items":{...}}}}
  ```

### 其他

```bash
node yapi-api.mjs config                              # 查看配置
node yapi-api.mjs add-category <projectId> <name>     # 添加分类
```

> 详细参数和说明见 [REFERENCE.md](REFERENCE.md)
