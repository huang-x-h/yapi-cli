#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import client from '../src/client.js';

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

program.command('config').description('config')
  .argument('<action>', 'set/get/list')
  .argument('[key]', 'key')
  .argument('[value]', 'value')
  .action(async (action, key, value) => {
    if (action === 'set') {
      if (!key || !value) { console.error('Usage: yapi-cli config set <key> <value>'); process.exit(1); }
      if (key === 'host') { client.setHost(value); console.log('Host: ' + value); }
      else { console.error('Unknown: ' + key); process.exit(1); }
    } else if (action === 'get') {
      if (key === 'host') console.log(client.getHost());
      else console.log({ host: client.getHost(), currentProjectId: client.getCurrentProjectId() });
    } else {
      console.log('Host: ' + client.getHost());
      console.log('Current Project: ' + (client.getCurrentProjectId() || 'not set'));
    }
  });

// login <projectId> <token> - 登录指定项目
program.command('login').description('login')
  .argument('<projectId>', 'project ID')
  .argument('<token>', 'project token')
  .action(async (projectId, token) => {
    try {
      const result = await client.login(projectId, token);
      console.log('OK (project: ' + result.projectId + ', name: ' + result.projectName + ')');
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

// switch <projectId> - 切换当前项目（需要先配置 token）
program.command('switch').description('switch project')
  .argument('<projectId>', 'project ID')
  .action(async (projectId, opts) => {
    try {
      // 检查项目是否有 token
      var token = client.getProjectToken(projectId);
      if (!token) {
        console.error('Token not set for project ' + projectId + '. Run: yapi-cli login ' + projectId + ' <token>');
        process.exit(1);
      }
      // 切换项目
      client.switchProject(projectId, token);
      console.log('Switched to project: ' + projectId);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

// tokens - 列出所有项目的 token
program.command('tokens').description('list project tokens')
  .action(async () => {
    var tokens = client.listProjectTokens();
    if (tokens.length === 0) {
      console.log('No tokens configured. Run: yapi-cli login <projectId> <token>');
    } else {
      console.log('Project tokens:');
      tokens.forEach(function(t) {
        console.log('  ' + t.projectId + ': ***');
      });
    }
  });

program.command('project').description('project detail')
  .argument('<id>', 'project ID')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (id, opts) => {
    try {
      const project = await client.getProject(id);
      output(project, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('categories').description('category list')
  .argument('<projectId>', 'project ID')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (projectId, opts) => {
    try {
      const categories = await client.listCategories(projectId);
      output(categories, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

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

program.command('interface').description('interface detail')
  .argument('<id>', 'interface ID')
  .option('-f, --format <type>', 'format', 'json')
  .option('--with-case', 'include test cases')
  .action(async (id, opts) => {
    try {
      const iface = await client.getInterface(id, {
        withCase: opts.withCase
      });
      output(iface, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('search').description('search interfaces')
  .argument('<keyword>', 'search keyword')
  .option('-p, --project <projectId>', 'project ID')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (keyword, opts) => {
    try {
      const results = await client.search(keyword, {
        projectId: opts.project
      });
      output(results, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.command('list').description('list project data (categories + interfaces)')
  .argument('<projectId>', 'project ID')
  .option('-f, --format <type>', 'format', 'json')
  .action(async (projectId, opts) => {
    try {
      const data = await client.getProjectData(projectId);
      output(data, opts.format);
    } catch (e) { console.error('Failed:', e.message); process.exit(1); }
  });

program.on('--help', () => {
  console.log('\nUsage:');
  console.log('  yapi-cli config set host http://your-yapi.com');
  console.log('  yapi-cli login <projectId> <token>');
  console.log('  yapi-cli switch <projectId>');
  console.log('  yapi-cli tokens');
  console.log('  yapi-cli project <projectId>');
  console.log('  yapi-cli categories <projectId>');
  console.log('  yapi-cli interfaces <projectId> --status done');
  console.log('  yapi-cli interface <interfaceId>');
  console.log('  yapi-cli search "user"');
  console.log('  yapi-cli list <projectId>');
});

program.parse();
