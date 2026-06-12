#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import readline from 'readline';
import client from '../src/client.js';
import { parseControllerFile, formatParsedMethods, toYApiCreatePayload } from '../src/parser.js';

const program = new Command();

function output(data, format) {
  format = format || 'json';
  if (format === 'json') {
    console.log(JSON.stringify(data, null, 2));
  } else if (format === 'table') {
    if (Array.isArray(data) && data.length > 0) {
      const keys = Object.keys(data[0]);
      const widths = keys.map(k => Math.max(k.length, ...data.map(d => String(d[k] || '').length)));
      console.log(keys.map((k, i) => k.padEnd(widths[i])).join(' | '));
      console.log(widths.map(w => '-'.repeat(w)).join('-+-'));
      data.forEach(row => {
        console.log(keys.map((k, i) => String(row[k] || '').padEnd(widths[i])).join(' | '));
      });
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

function promptConfirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// config list - 查看当前配置
program.command('config').description('show current config from .env')
  .argument('[action]', 'list')
  .action(async (action) => {
    if (action && action !== 'list') {
      console.error('Config is read-only. All settings come from .env file.');
      process.exit(1);
    }
    const host = client.getHost();
    const username = client.getDefaultUsername();
    console.log('Host: ' + (host || 'not set'));
    console.log('Default Username (creator): ' + (username || 'not set'));
    if (process.env.YAPI_HOST) console.log('  [env] YAPI_HOST=' + process.env.YAPI_HOST);
    if (process.env.YAPI_USERNAME) console.log('  [env] YAPI_USERNAME=' + process.env.YAPI_USERNAME);
    if (process.env.YAPI_PROJECT_TOKEN) console.log('  [env] YAPI_PROJECT_TOKEN=***');
  });

// categories <projectId> - 分类列表
program.command('categories').description('category list')
  .argument('<projectId>', 'project ID')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (projectId, opts) => {
    try {
      const categories = await client.listCategories(projectId);
      output(categories, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

// interfaces <projectId> - 接口列表
program.command('interfaces').description('interface list')
  .argument('<projectId>', 'project ID')
  .option('-c, --cat <catId>', 'category ID')
  .option('-s, --status <status>', 'status (undone/done/deprecated)')
  .option('-t, --tag <tag>', 'tag filter')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (projectId, opts) => {
    try {
      const interfaces = await client.listInterfaces(projectId, {
        cat: opts.cat,
        status: opts.status,
        tag: opts.tag
      });
      output(interfaces, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

// interface <id> - 接口详情
program.command('interface').description('interface detail')
  .argument('<id>', 'interface ID')
  .option('-f, --format <type>', 'format', 'json')
  .option('--with-case', 'include test cases')
  .action(async (id, opts) => {
    try {
      const iface = await client.getInterface(id, { withCase: opts.withCase });
      output(iface, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

// search <keyword> - 搜索
program.command('search').description('search interfaces')
  .argument('<keyword>', 'search keyword')
  .option('-p, --project <projectId>', 'project ID')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (keyword, opts) => {
    try {
      const results = await client.search(keyword, { projectId: opts.project });
      output(results, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

// ========== Java Controller 解析 ==========

// parse-java <filePath>
program.command('parse-java').description('parse Java Controller file')
  .argument('<filePath>', 'Java file path')
  .option('-f, --format <type>', 'format (json/text)', 'text')
  .action(async (filePath, opts) => {
    try {
      const parsed = parseControllerFile(filePath);
      if (opts.format === 'json') {
        console.log(JSON.stringify(parsed, null, 2));
      } else {
        console.log(formatParsedMethods(parsed));
      }
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

// ========== 接口创建 ==========

// create-interface - 手动创建接口
program.command('create-interface').description('create API interface in YApi')
  .requiredOption('-t, --title <title>', 'interface title')
  .requiredOption('-p, --path <path>', 'request path (e.g. /api/user/list)')
  .requiredOption('-m, --method <method>', 'HTTP method (GET/POST/PUT/DELETE/PATCH)')
  .option('--pid <pid>', 'project ID (optional, YApi derives from token)')
  .option('--catid <catid>', 'category ID')
  .option('-d, --desc <desc>', 'description')
  .option('-s, --status <status>', 'status (undone/done/deprecated)', 'undone')
  .option('--username <username>', 'creator username')
  .option('--uid <uid>', 'creator user ID')
  .option('--req-query <json>', 'query params as JSON array')
  .option('--req-headers <json>', 'request headers as JSON array')
  .option('--req-body-type <type>', 'request body type (none/form/json/raw)')
  .option('--req-body-other <json>', 'raw request body (JSON string)')
  .option('--req-body-form <json>', 'form body params as JSON array')
  .option('--res-body <json>', 'response body (JSON string)')
  .option('--res-body-type <type>', 'response body type (json/raw)', 'json')
  .option('--tag <tags>', 'tags (comma separated)')
  .action(async (opts) => {
    try {
      const params = {
        title: opts.title,
        path: opts.path,
        method: opts.method.toUpperCase(),
        pid: opts.pid,
        catid: opts.catid,
        desc: opts.desc,
        status: opts.status,
        username: opts.username || client.getDefaultUsername(),
        uid: opts.uid
      };

      if (opts.reqQuery) {
        try { params.req_query = JSON.parse(opts.reqQuery); } catch(e) { console.error('Invalid req-query JSON'); process.exit(1); }
      }
      if (opts.reqHeaders) {
        try { params.req_headers = JSON.parse(opts.reqHeaders); } catch(e) { console.error('Invalid req-headers JSON'); process.exit(1); }
      }
      if (opts.reqBodyType) params.req_body_type = opts.reqBodyType;
      if (opts.reqBodyOther) params.req_body_other = opts.reqBodyOther;
      if (opts.reqBodyForm) {
        try { params.req_body_form = JSON.parse(opts.reqBodyForm); } catch(e) { console.error('Invalid req-body-form JSON'); process.exit(1); }
      }
      if (opts.resBody) params.res_body = opts.resBody;
      if (opts.resBodyType) params.res_body_type = opts.resBodyType;
      if (opts.tag) params.tags = opts.tag.split(',').map(t => t.trim());

      // 默认开启 JSON Schema 表格展示
      if (params.req_body_other && !params.req_body_type) params.req_body_type = 'json';
      if (params.res_body && !params.resBodyType) params.res_body_type = 'json';

      const result = await client.createInterface(params);
      console.log('Interface created successfully!');
      console.log(JSON.stringify(result, null, 2));
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

// create-from-java - 解析 Java Controller 并创建到 YApi
program.command('create-from-java').description('parse Java Controller and create interfaces in YApi')
  .argument('<filePath>', 'Java Controller file path')
  .option('--pid <pid>', 'project ID (optional, YApi derives from token)')
  .option('--catid <catid>', 'category ID for all interfaces')
  .option('-u, --username <username>', 'creator username')
  .option('--uid <uid>', 'creator user ID')
  .option('-m, --method <method>', 'method name filter (only create this method)')
  .option('-d, --dry-run', 'dry run, only print parsed data, no creation')
  .action(async (filePath, opts) => {
    try {
      const parsed = parseControllerFile(filePath);

      if (parsed.methods.length === 0) {
        console.log('No API methods found in ' + filePath);
        process.exit(0);
      }

      let methods = parsed.methods;
      if (opts.method) {
        methods = methods.filter(m => m.methodName === opts.method);
        if (methods.length === 0) {
          console.error('Method "' + opts.method + '" not found in ' + filePath);
          process.exit(1);
        }
      }

      if (opts.dryRun) {
        console.log('=== DRY RUN ===');
        console.log('Creator: ' + (opts.username || client.getDefaultUsername() || opts.uid || 'default'));
        if (opts.catid) console.log('Category: ' + opts.catid);
        console.log('');
        console.log(formatParsedMethods({ ...parsed, methods }));
        console.log('=== DRY RUN (no interfaces were created) ===');
        process.exit(0);
      }

      let created = 0;
      let errors = [];

      for (const method of methods) {
        try {
          const payload = toYApiCreatePayload(method, {
            projectId: opts.pid,
            catid: opts.catid,
            username: opts.username || client.getDefaultUsername(),
            uid: opts.uid
          });

          const result = await client.createInterface(payload);
          console.log('Created: [' + method.method + '] ' + method.path + ' -> ' + (result._id || result.id || 'ok'));
          created++;
        } catch (e) {
          console.error('Failed: [' + method.method + '] ' + method.path + ' - ' + e.message);
          errors.push({ method: method.methodName, path: method.path, error: e.message });
        }
      }

      console.log('');
      console.log('Done! Created ' + created + '/' + methods.length + ' interfaces.');
      if (errors.length > 0) {
        console.log('Errors: ' + errors.length);
        for (const err of errors) {
          console.log('  - ' + err.path + ': ' + err.error);
        }
      }
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

// update-interface - 更新接口
program.command('update-interface').description('update API interface in YApi')
  .requiredOption('--id <id>', 'interface ID')
  .option('-t, --title <title>', 'interface title')
  .option('-p, --path <path>', 'request path')
  .option('-m, --method <method>', 'HTTP method (GET/POST/PUT/DELETE/PATCH)')
  .option('--pid <pid>', 'project ID')
  .option('--catid <catid>', 'category ID')
  .option('-d, --desc <desc>', 'description')
  .option('-s, --status <status>', 'status (undone/done/deprecated)')
  .option('--username <username>', 'creator username')
  .option('--req-body-other <json>', 'raw request body (JSON string)')
  .option('--res-body <json>', 'response body (JSON string)')
  .action(async (opts) => {
    try {
      const params = { id: opts.id };
      if (opts.title) params.title = opts.title;
      if (opts.path) params.path = opts.path;
      if (opts.method) params.method = opts.method.toUpperCase();
      if (opts.pid) params.pid = opts.pid;
      if (opts.catid) params.catid = opts.catid;
      if (opts.desc) params.desc = opts.desc;
      if (opts.status) params.status = opts.status;
      if (opts.username) params.username = opts.username;
      else if (client.getDefaultUsername()) params.username = client.getDefaultUsername();
      if (opts.reqBodyOther) params.req_body_other = opts.reqBodyOther;
      if (opts.resBody) params.res_body = opts.resBody;

      const result = await client.updateInterface(params);
      console.log('Interface updated successfully!');
      console.log(JSON.stringify(result, null, 2));
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

// delete-interface - 删除接口（需二次确认）
program.command('delete-interface').description('delete API interface (requires confirmation)')
  .argument('<id>', 'interface ID')
  .option('-y, --yes', 'skip confirmation prompt')
  .action(async (id, opts) => {
    try {
      // 二次确认
      if (!opts.yes) {
        const answer = await promptConfirm('Are you sure you want to delete interface ' + id + '? [y/N] ');
        if (answer !== 'y' && answer !== 'yes') {
          console.log('Cancelled.');
          process.exit(0);
        }
      }
      await client.deleteInterface(id);
      console.log('Interface ' + id + ' deleted.');
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.on('--help', () => {
  console.log('\nSetup:');
  console.log('  Create a .env file in your project root:');
  console.log('    YAPI_HOST=http://your-yapi.com');
  console.log('    YAPI_PROJECT_TOKEN=xxx');
  console.log('    YAPI_USERNAME=yourname');
  console.log('');
  console.log('Query:');
  console.log('  yapi-cli config list');
  console.log('  yapi-cli categories <projectId>');
  console.log('  yapi-cli interfaces <projectId> --status done');
  console.log('  yapi-cli interface <interfaceId>');
  console.log('  yapi-cli search "user"');
  console.log('');
  console.log('Parse Java Controller:');
  console.log('  yapi-cli parse-java UserController.java');
  console.log('');
  console.log('Create Interface:');
  console.log('  yapi-cli create-interface --title "用户列表" --path /api/user/list --method GET');
  console.log('  yapi-cli create-from-java UserController.java --catid <catId>');
  console.log('');
  console.log('Manage Interfaces:');
  console.log('  yapi-cli update-interface --id <interfaceId> --title "新标题" --status done');
  console.log('  yapi-cli delete-interface <interfaceId>');
  console.log('  (delete-interface requires confirmation, use --yes to skip)');
});

program.parse();
