import axios from 'axios';

// 所有配置从环境变量 / .env 文件读取，不依赖 ~/.yapi-cli/config.json
var _host = (process.env.YAPI_HOST || '').replace(/\/$/, '');
var _defaultUsername = process.env.YAPI_USERNAME || '';

function getToken() {
  return process.env.YAPI_PROJECT_TOKEN || null;
}

async function api(method, params, httpMethod) {
  if (!_host) throw new Error('YAPI_HOST not set. Add to .env file');
  var token = getToken();
  if (!token) throw new Error('YAPI_PROJECT_TOKEN not set. Add to .env file');
  params = params || {};
  params.token = token;

  httpMethod = httpMethod || 'GET';
  var url = new URL(_host + '/api/' + method);

  if (httpMethod === 'GET') {
    for (var k in params) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
        url.searchParams.set(k, params[k]);
      }
    }
    var resp = await axios.get(url.toString(), { timeout: 30000 });
  } else if (httpMethod === 'POST') {
    var resp = await axios.post(url.toString(), params, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    throw new Error('Unsupported HTTP method: ' + httpMethod);
  }

  var data = resp.data;
  if (data.errcode !== 0) {
    throw new Error(data.errmsg || 'API Error: ' + data.errcode);
  }
  return data.data;
}

export default {
  getHost: function() { return _host; },
  getDefaultUsername: function() { return _defaultUsername; },

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

  // 获取项目分类列表
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

    if (options.status) {
      result = result.filter(function(i) { return i.status === options.status; });
    }
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
      reqBodyType: data.req_body_type || '',
      reqBodyIsJsonSchema: data.req_body_is_json_schema === true || data.req_body_is_json_schema === 'true' || false,
      resBody: data.res_body || '',
      resBodyType: data.res_body_type || 'json',
      resBodyIsJsonSchema: data.res_body_is_json_schema === true || data.res_body_is_json_schema === 'true' || false,
      resHeaders: data.res_headers || [],
      updatedAt: data.up_time ? new Date(data.up_time * 1000).toISOString() : '',
      createdAt: data.add_time ? new Date(data.add_time * 1000).toISOString() : ''
    };

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
    if (options.projectId) { params.pid = options.projectId; }
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
    var result = categories.map(function(cat) {
      return {
        category: cat,
        interfaces: interfaces.filter(function(i) { return i.catid === (cat._id || cat.id); })
      };
    });
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
  },

  // 创建接口
  createInterface: async function(params) {
    if (!params.title) throw new Error('title is required');
    if (!params.path) throw new Error('path is required');
    if (!params.method) throw new Error('method is required');

    var payload = {
      title: params.title,
      path: params.path,
      method: params.method.toUpperCase(),
      pid: params.pid,
      status: params.status || 'undone',
      desc: params.desc || params.description || '',
      tag: params.tag || params.tags || []
    };

    if (params.catid) payload.catid = params.catid;
    if (params.username) payload.username = params.username;
    if (params.uid) payload.uid = params.uid;
    if (params.req_query) payload.req_query = params.req_query;
    if (params.req_headers) payload.req_headers = params.req_headers;

    if (params.req_body_type) payload.req_body_type = params.req_body_type;
    if (params.req_body_other) payload.req_body_other = params.req_body_other;
    if (params.req_body_form) payload.req_body_form = params.req_body_form;
    if (params.req_body_is_json_schema !== undefined) {
      payload.req_body_is_json_schema = params.req_body_is_json_schema;
    } else if (payload.req_body_other && (payload.req_body_type || 'json') === 'json') {
      payload.req_body_is_json_schema = true;
    }

    if (params.res_body_type) payload.res_body_type = params.res_body_type;
    if (params.res_body) payload.res_body = params.res_body;
    if (params.res_body_is_json_schema !== undefined) {
      payload.res_body_is_json_schema = params.res_body_is_json_schema;
    } else if (payload.res_body && (payload.res_body_type || 'json') === 'json') {
      payload.res_body_is_json_schema = true;
    }

    return await api('interface/save', payload, 'POST');
  },

  // 更新接口
  updateInterface: async function(params) {
    if (!params.id) throw new Error('interface id is required');

    var payload = { id: params.id };
    if (params.pid) payload.pid = params.pid;

    if (params.title) payload.title = params.title;
    if (params.path) payload.path = params.path;
    if (params.method) payload.method = params.method.toUpperCase();
    if (params.status) payload.status = params.status;
    if (params.desc || params.description) payload.desc = params.desc || params.description;
    if (params.catid) payload.catid = params.catid;
    if (params.username) payload.username = params.username;
    if (params.uid) payload.uid = params.uid;
    if (params.req_query) payload.req_query = params.req_query;
    if (params.req_headers) payload.req_headers = params.req_headers;

    if (params.req_body_type) payload.req_body_type = params.req_body_type;
    if (params.req_body_other) payload.req_body_other = params.req_body_other;
    if (params.req_body_form) payload.req_body_form = params.req_body_form;
    if (params.req_body_is_json_schema !== undefined) {
      payload.req_body_is_json_schema = params.req_body_is_json_schema;
    } else if (payload.req_body_other && (payload.req_body_type || 'json') === 'json') {
      payload.req_body_is_json_schema = true;
    }

    if (params.res_body_type) payload.res_body_type = params.res_body_type;
    if (params.res_body) payload.res_body = params.res_body;
    if (params.res_body_is_json_schema !== undefined) {
      payload.res_body_is_json_schema = params.res_body_is_json_schema;
    } else if (payload.res_body && (payload.res_body_type || 'json') === 'json') {
      payload.res_body_is_json_schema = true;
    }

    return await api('interface/save', payload, 'POST');
  },

  // 删除接口
  deleteInterface: async function(interfaceId) {
    return await api('interface/del', { id: interfaceId }, 'GET');
  },

  // 添加分类
  addCategory: async function(projectId, name, desc) {
    if (!projectId) throw new Error('projectId is required');
    if (!name) throw new Error('category name is required');
    var params = { pid: projectId, name: name };
    if (desc) params.desc = desc;
    return await api('project/add_cat', params, 'POST');
  }
};
