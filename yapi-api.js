#!/usr/bin/env node

/**
 * yapi-api.js - YApi CLI 独立脚本
 * 
 * 纯 Node.js 内置模块，无需安装任何 npm 包。
 * 使用方法: node yapi-api.js <command> [options]
 * 
 * 配置: 项目根目录 .env 文件
 *   YAPI_HOST=http://your-yapi.com
 *   YAPI_PROJECT_TOKEN=xxx
 *   YAPI_USERNAME=yourname
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

// ── 加载 .env ──────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const HOST = (process.env.YAPI_HOST || '').replace(/\/$/, '');
const TOKEN = process.env.YAPI_PROJECT_TOKEN || '';
const USERNAME = process.env.YAPI_USERNAME || '';

// ── HTTP 工具 ──────────────────────────────────────────────
async function api(method, params, httpMethod = 'GET') {
  if (!HOST) throw new Error('YAPI_HOST not set in .env');
  if (!TOKEN) throw new Error('YAPI_PROJECT_TOKEN not set in .env');

  params = params || {};
  params.token = TOKEN;

  const url = new URL(HOST + '/api/' + method);

  if (httpMethod === 'GET') {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    }
    const resp = await fetch(url.toString(), { method: 'GET' });
    const data = await resp.json();
    if (data.errcode !== 0) throw new Error(data.errmsg || 'API Error: ' + data.errcode);
    return data.data;
  } else {
    const resp = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await resp.json();
    if (data.errcode !== 0) throw new Error(data.errmsg || 'API Error: ' + data.errcode);
    return data.data;
  }
}

// ── 分类 ──────────────────────────────────────────────────
async function categories(projectId) {
  const data = await api('project/get', { id: projectId });
  return (data.cat || []).map(c => ({ id: c._id || c.id, name: c.name || '' }));
}

// ── 接口列表 ──────────────────────────────────────────────
async function interfaces(projectId, opts = {}) {
  const params = { page: 1, limit: 1000, pid: projectId };
  if (opts.cat) params.catid = opts.cat;
  const data = await api('interface/list', params);
  return (data.list || []).map(i => ({
    id: i._id || i.id,
    title: i.title || '',
    path: i.path || '',
    method: i.method || 'GET',
    status: i.status || 'undone',
    catid: i.catid || ''
  }));
}

// ── 接口详情 ──────────────────────────────────────────────
async function interfaceDetail(id) {
  const d = await api('interface/get', { id });
  return {
    id: d._id || d.id,
    title: d.title || '',
    path: d.path || '',
    method: d.method || 'GET',
    status: d.status || 'undone',
    description: d.desc || '',
    catid: d.catid || '',
    reqParams: d.req_params || [],
    reqHeaders: d.req_headers || [],
    reqBody: d.req_body_other || d.req_body_form || '',
    resBody: d.res_body || ''
  };
}

// ── 搜索 ──────────────────────────────────────────────────
async function search(keyword, projectId) {
  const params = { q: keyword, page: 1, limit: 50 };
  if (projectId) params.pid = projectId;
  const data = await api('interface/search', params);
  return (data.list || []).map(i => ({
    id: i._id || i.id,
    title: i.title || '',
    path: i.path || '',
    method: i.method || 'GET',
    projectName: i.project_name || '',
    cat: i.catname || '',
    status: i.status || 'undone'
  }));
}

// ── 创建接口 ──────────────────────────────────────────────
async function createInterface(opts) {
  const payload = {
    title: opts.title,
    path: opts.path,
    method: opts.method.toUpperCase(),
    pid: opts.pid,
    status: opts.status || 'undone',
    desc: opts.desc || '',
    tag: opts.tag || []
  };
  if (opts.catid) payload.catid = opts.catid;
  if (opts.username || USERNAME) payload.username = opts.username || USERNAME;
  if (opts.req_body_other) {
    payload.req_body_other = opts.req_body_other;
    payload.req_body_type = 'json';
    payload.req_body_is_json_schema = true;
  }
  if (opts.res_body) {
    payload.res_body = opts.res_body;
    payload.res_body_type = 'json';
    payload.res_body_is_json_schema = true;
  }
  return await api('interface/save', payload, 'POST');
}

// ── 更新接口 ──────────────────────────────────────────────
async function updateInterface(opts) {
  const payload = { id: opts.id };
  if (opts.title) payload.title = opts.title;
  if (opts.path) payload.path = opts.path;
  if (opts.method) payload.method = opts.method.toUpperCase();
  if (opts.status) payload.status = opts.status;
  if (opts.desc) payload.desc = opts.desc;
  if (opts.catid) payload.catid = opts.catid;
  if (opts.username || USERNAME) payload.username = opts.username || USERNAME;
  if (opts.req_body_other) {
    payload.req_body_other = opts.req_body_other;
    payload.req_body_type = 'json';
    payload.req_body_is_json_schema = true;
  }
  if (opts.res_body) {
    payload.res_body = opts.res_body;
    payload.res_body_type = 'json';
    payload.res_body_is_json_schema = true;
  }
  return await api('interface/save', payload, 'POST');
}

// ── 删除接口 ──────────────────────────────────────────────
async function deleteInterface(id) {
  return await api('interface/del', { id }, 'GET');
}

// ── 添加分类 ──────────────────────────────────────────────
async function addCategory(projectId, name, desc) {
  return await api('project/add_cat', { pid: projectId, name, desc: desc || '' }, 'POST');
}

// ── Java Controller 解析 ──────────────────────────────────
const METHOD_MAP = {
  getmapping: 'GET', postmapping: 'POST', putmapping: 'PUT',
  deletemapping: 'DELETE', patchmapping: 'PATCH'
};

function parseJavaFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = [];

  // 类级别路径
  let basePath = '';
  const classReq = content.match(/@RequestMapping\s*\(\s*["']([^"']+)["']/);
  if (classReq) basePath = classReq[1];

  // 找到所有方法注解 + 方法签名
  const pattern = /@(RequestMapping|GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)\s*(\([^)]*\))?[\s\S]*?(?:public|protected|private)\s+(?:static\s+)?([\w<>[\],\s?]+)\s+(\w+)\s*\(/g;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const annotName = match[1].toLowerCase();
    const annotBody = match[2] || '';
    const returnType = match[3].trim();
    const methodName = match[4];

    // 提取路径
    let path = '';
    const inner = annotBody.replace(/^\(/, '').replace(/\)$/, '').trim();
    const pv = inner.match(/(?:value|path)\s*=\s*["']([^"']+)["']/) || inner.match(/^\s*["']([^"']+)["']/);
    if (pv) path = pv[1];

    // HTTP 方法
    let httpMethod = METHOD_MAP[annotName];
    if (!httpMethod) {
      const mm = inner.match(/method\s*=\s*(?:RequestMethod\.)?(\w+)/);
      httpMethod = mm ? mm[1].toUpperCase() : 'GET';
    }

    // 组合路径
    if (basePath) {
      const b = basePath.replace(/\/$/, '');
      path = b + (path ? '/' + path.replace(/^\//, '') : '');
    }
    path = path || '/' + methodName;

    // 获取 Javadoc
    const before = content.substring(0, match.index);
    const jdIdx = before.lastIndexOf('/**');
    let title = '';
    if (jdIdx !== -1) {
      const jdEnd = before.indexOf('*/', jdIdx);
      if (jdEnd !== -1) {
        title = before.substring(jdIdx, jdEnd + 2)
          .replace('/**', '').replace('*/', '')
          .split('\n').map(l => l.replace(/^\s*\*\s?/, '').trim())
          .filter(l => l && !l.startsWith('@'))
          .join(' ').trim();
      }
    }
    if (!title) {
      title = methodName.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
    }

    result.push({ methodName, title, path, method: httpMethod, returnType });
  }

  return result;
}

// ── CLI 入口 ──────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === '--help' || cmd === '-h') {
    console.log(`
Usage: node yapi-api.js <command> [options]

Commands:
  config                                    Show current config
  categories <projectId>                    List categories
  interfaces <projectId> [--cat <id>]       List interfaces
  interface <id>                            Get interface detail
  search <keyword> [--project <id>]         Search interfaces
  parse-java <file>                         Parse Java Controller
  create-interface ...                      Create interface
  create-from-java <file> [options]         Parse Java + create in YApi
  update-interface --id <id> [options]      Update interface
  delete-interface <id> [--yes]             Delete interface
  add-category <pid> <name>                 Add category

Examples:
  node yapi-api.js categories 123
  node yapi-api.js parse-java UserController.java
  node yapi-api.js create-from-java UserController.java --catid 456
`);
    return;
  }

  try {
    switch (cmd) {
      case 'config': {
        console.log('Host:', HOST || '(not set)');
        console.log('Token:', TOKEN ? '***' : '(not set)');
        console.log('Username:', USERNAME || '(not set)');
        break;
      }

      case 'categories': {
        if (!args[1]) throw new Error('Usage: node yapi-api.js categories <projectId>');
        const list = await categories(args[1]);
        console.log(JSON.stringify(list, null, 2));
        break;
      }

      case 'interfaces': {
        if (!args[1]) throw new Error('Usage: node yapi-api.js interfaces <projectId> [--cat <id>]');
        const catIdx = args.indexOf('--cat');
        const opts = catIdx !== -1 ? { cat: args[catIdx + 1] } : {};
        const list = await interfaces(args[1], opts);
        console.log(JSON.stringify(list, null, 2));
        break;
      }

      case 'interface': {
        if (!args[1]) throw new Error('Usage: node yapi-api.js interface <id>');
        const detail = await interfaceDetail(args[1]);
        console.log(JSON.stringify(detail, null, 2));
        break;
      }

      case 'search': {
        if (!args[1]) throw new Error('Usage: node yapi-api.js search <keyword> [--project <id>]');
        const pIdx = args.indexOf('--project');
        const pid = pIdx !== -1 ? args[pIdx + 1] : null;
        const results = await search(args[1], pid);
        console.log(JSON.stringify(results, null, 2));
        break;
      }

      case 'parse-java': {
        if (!args[1]) throw new Error('Usage: node yapi-api.js parse-java <file>');
        const methods = parseJavaFile(args[1]);
        console.log(JSON.stringify({ className: path.basename(args[1], '.java'), methods }, null, 2));
        break;
      }

      case 'create-interface': {
        const parseOpt = (flag, required) => {
          const idx = args.indexOf(flag);
          const val = idx !== -1 ? args[idx + 1] : '';
          if (required && !val) throw new Error(`--${flag.replace(/^--/, '')} is required`);
          return val;
        };
        const opts = {
          title: parseOpt('--title', true),
          path: parseOpt('--path', true),
          method: parseOpt('--method', true),
          pid: parseOpt('--pid'),
          catid: parseOpt('--catid'),
          desc: parseOpt('--desc'),
          status: parseOpt('--status') || 'undone',
          req_body_other: parseOpt('--req-body-other'),
          res_body: parseOpt('--res-body')
        };
        const result = await createInterface(opts);
        console.log('Created:', result._id || result.id);
        break;
      }

      case 'create-from-java': {
        if (!args[1]) throw new Error('Usage: node yapi-api.js create-from-java <file> [--catid <id>] [--username <name>] [--method <name>] [--dry-run]');
        const catIdx2 = args.indexOf('--catid');
        const catid = catIdx2 !== -1 ? args[catIdx2 + 1] : '';
        const uIdx = args.indexOf('--username');
        const username = uIdx !== -1 ? args[uIdx + 1] : USERNAME;
        const mIdx = args.indexOf('--method');
        const methodFilter = mIdx !== -1 ? args[mIdx + 1] : '';
        const dryRun = args.includes('--dry-run');

        let methods = parseJavaFile(args[1]);
        if (methodFilter) methods = methods.filter(m => m.methodName === methodFilter);

        if (dryRun) {
          console.log('=== DRY RUN ===');
          console.log(JSON.stringify(methods, null, 2));
          return;
        }

        let created = 0;
        for (const m of methods) {
          const payload = {
            title: m.title, path: m.path, method: m.method,
            catid, username, status: 'undone'
          };
          if (payload.req_body_other) payload.req_body_is_json_schema = true;
          if (payload.res_body) payload.res_body_is_json_schema = true;
          const result = await createInterface(payload);
          console.log('Created: [' + m.method + '] ' + m.path + ' -> ' + (result._id || result.id));
          created++;
        }
        console.log('Done! Created ' + created + '/' + methods.length);
        break;
      }

      case 'update-interface': {
        const idIdx = args.indexOf('--id');
        if (idIdx === -1) throw new Error('--id is required');
        const uOpts = { id: args[idIdx + 1] };
        for (const flag of ['--title', '--path', '--method', '--status', '--desc', '--catid']) {
          const fi = args.indexOf(flag);
          if (fi !== -1) uOpts[flag.replace(/^--/, '')] = args[fi + 1];
        }
        for (const flag of ['--req-body-other', '--res-body']) {
          const fi = args.indexOf(flag);
          if (fi !== -1) uOpts[flag.replace(/^--/g, '').replace(/-/g, '_')] = args[fi + 1];
        }
        const result = await updateInterface(uOpts);
        console.log('Updated:', result._id || result.id);
        break;
      }

      case 'delete-interface': {
        if (!args[1]) throw new Error('Usage: node yapi-api.js delete-interface <id> [--yes]');
        if (!args.includes('--yes')) {
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          const answer = await new Promise(r => rl.question('Delete interface ' + args[1] + '? [y/N] ', r));
          rl.close();
          if (answer.trim().toLowerCase() !== 'y' && answer.trim().toLowerCase() !== 'yes') {
            console.log('Cancelled.');
            return;
          }
        }
        await deleteInterface(args[1]);
        console.log('Deleted:', args[1]);
        break;
      }

      case 'add-category': {
        if (!args[1] || !args[2]) throw new Error('Usage: node yapi-api.js add-category <projectId> <name>');
        const r = await addCategory(args[1], args[2], args.slice(3).join(' '));
        console.log('Category created:', r._id || r.id);
        break;
      }

      default:
        console.error('Unknown command:', cmd);
        console.log('Run "node yapi-api.js --help" for usage.');
        process.exit(1);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
