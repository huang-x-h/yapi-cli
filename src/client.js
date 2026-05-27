import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';

const CONFIG_DIR = path.join(os.homedir(), '.yapi-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

var _host = '';
var _currentProjectId = null;
var _projectTokens = {};

try {
  if (fs.existsSync(CONFIG_FILE)) {
    var config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    _host = config.host || '';
    _currentProjectId = config.currentProjectId || null;
    _projectTokens = config.projectTokens || {};
  }
} catch (e) {}

function saveConfig() {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({
    host: _host,
    currentProjectId: _currentProjectId,
    projectTokens: _projectTokens
  }, null, 2));
}

function getToken() {
  if (_currentProjectId && _projectTokens[_currentProjectId]) {
    return _projectTokens[_currentProjectId];
  }
  // 向后兼容：如果有默认 token
  return null;
}

async function api(method, params) {
  if (!_host) throw new Error('YAPI_HOST not set. Run: yapi-cli config set host <url>');
  var token = getToken();
  if (!token) throw new Error('YAPI_TOKEN not set. Run: yapi-cli login <token> or yapi-cli switch <projectId>');
  params = params || {};
  params.token = token;
  
  var url = new URL(_host + '/api/' + method);
  for (var k in params) {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
      url.searchParams.set(k, params[k]);
    }
  }
  
  var resp = await axios.get(url.toString(), { timeout: 30000 });
  var data = resp.data;
  
  if (data.errcode !== 0) {
    throw new Error(data.errmsg || 'API Error: ' + data.errcode);
  }
  
  return data.data;
}

export default {
  setHost: function(host) { _host = host.replace(/\/$/, ''); saveConfig(); },
  getHost: function() { return _host; },
  
  // 获取当前项目 ID
  getCurrentProjectId: function() { return _currentProjectId; },
  
  // 设置项目 token
  setProjectToken: function(projectId, token) {
    _projectTokens[projectId] = token;
    saveConfig();
  },
  
  // 获取项目 token
  getProjectToken: function(projectId) {
    return _projectTokens[projectId];
  },
  
  // 获取所有项目 token 列表
  listProjectTokens: function() {
    return Object.keys(_projectTokens).map(function(id) {
      return { projectId: id, hasToken: true };
    });
  },
  
  // 切换项目（同时设置当前 token）
  switchProject: function(projectId, token) {
    if (!projectId) throw new Error('projectId is required');
    if (!token) throw new Error('token is required');
    _currentProjectId = projectId;
    _projectTokens[projectId] = token;
    saveConfig();
  },
  
  // 登录/切换项目
  login: async function(projectId, token) {
    if (!token) throw new Error('Usage: yapi-cli login <projectId> <token>');
    this.switchProject(projectId, token);
    // 验证 token 有效性（使用 project/get 而不是 project/list）
    try {
      var project = await this.getProject(projectId);
      return { success: true, projectId: projectId, projectName: project.name };
    } catch (e) {
      delete _projectTokens[projectId];
      _currentProjectId = null;
      saveConfig();
      throw new Error('Invalid token or cannot connect to YApi');
    }
  },

  // 获取项目详情
  getProject: async function(projectId) {
    var data = await api('project/get', { id: projectId });
    return {
      id: data._id || data.id,
      name: data.name || '',
      description: data.desc || data.description || '',
      type: data.type || 'private',
      basePath: data.basepath || '',
      members: data.members || []
    };
  },

  // 获取项目分类列表（使用 project/get 获取）
  listCategories: async function(projectId) {
    var data = await api('project/get', { id: projectId });
    var cats = data.cat || [];
    return cats.map(function(c) {
      return {
        id: c._id || c.id,
        name: c.name || '',
        projectId: projectId,
        count: 0,
        desc: c.desc || ''
      };
    });
  },

  // 获取项目接口列表
  listInterfaces: async function(projectId, options) {
    options = options || {};
    var params = { page: 1, limit: 1000, pid: projectId };
    
    if (options.cat) {
      params.catid = options.cat;
    }
    
    var data = await api('interface/list', params);
    var list = data.list || [];
    
    var result = list.map(function(i) {
      return {
        id: i._id || i.id,
        title: i.title || '',
        path: i.path || '',
        method: i.method || 'GET',
        status: i.status || 'undone',
        catid: i.catid || '',
        cat: i.catname || '',
        owner: i.username || i.uid || '',
        updatedAt: i.up_time ? new Date(i.up_time * 1000).toISOString().split('T')[0] : ''
      };
    });
    
    // 按状态过滤
    if (options.status) {
      result = result.filter(function(i) { return i.status === options.status; });
    }
    
    // 按标签过滤
    if (options.tag) {
      result = result.filter(function(i) { 
        return i.tag && i.tag.includes(options.tag); 
      });
    }
    
    return result;
  },

  // 获取接口详情
  getInterface: async function(interfaceId, options) {
    options = options || {};
    var data = await api('interface/get', { id: interfaceId });
    
    var result = {
      id: data._id || data.id,
      title: data.title || '',
      path: data.path || '',
      method: data.method || 'GET',
      status: data.status || 'undone',
      description: data.desc || '',
      catid: data.catid || '',
      projectId: data.projectId || data.pid || '',
      reqParams: data.req_params || [],
      reqHeaders: data.req_headers || [],
      reqBody: data.req_body_other || data.req_body_form || '',
      resBody: data.res_body || '',
      resBodyType: data.res_body_type || 'json',
      resHeaders: data.res_headers || [],
      updatedAt: data.up_time ? new Date(data.up_time * 1000).toISOString() : '',
      createdAt: data.add_time ? new Date(data.add_time * 1000).toISOString() : ''
    };
    
    // 包含测试用例
    if (options.withCase) {
      try {
        var cases = await api('interface/getCaseList', { id: interfaceId });
        result.cases = (cases || []).map(function(c) {
          return {
            id: c._id || c.id,
            name: c.name || c.title || '',
            status: c.status || '',
            creator: c.username || c.uid || '',
            createAt: c.create_time ? new Date(c.create_time * 1000).toISOString() : ''
          };
        });
      } catch (e) {
        result.cases = [];
      }
    }
    
    return result;
  },

  // 搜索接口
  search: async function(keyword, options) {
    options = options || {};
    var params = { q: keyword, page: 1, limit: 50 };
    
    if (options.projectId) {
      params.pid = options.projectId;
    }
    
    var data = await api('interface/search', params);
    var list = data.list || [];
    
    return list.map(function(i) {
      return {
        id: i._id || i.id,
        title: i.title || '',
        path: i.path || '',
        method: i.method || 'GET',
        projectId: i.projectId || i.pid || '',
        projectName: i.project_name || '',
        cat: i.catname || '',
        status: i.status || 'undone'
      };
    });
  },

  // 获取项目全部数据（分类+接口）
  getProjectData: async function(projectId) {
    var categories = await this.listCategories(projectId);
    var interfaces = await this.listInterfaces(projectId);
    
    // 按分类分组
    var result = categories.map(function(cat) {
      return {
        category: cat,
        interfaces: interfaces.filter(function(i) { return i.catid === (cat._id || cat.id); })
      };
    });
    
    // 未分类接口
    var uncategorized = interfaces.filter(function(i) {
      return !categories.some(function(c) { return (c._id || c.id) === i.catid; });
    });
    
    if (uncategorized.length > 0) {
      result.push({
        category: { id: 'uncategorized', name: '未分类' },
        interfaces: uncategorized
      });
    }
    
    return result;
  }
};
