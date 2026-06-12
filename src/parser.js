/**
 * Java Controller 解析器
 * 
 * 解析 Java Controller 类文件，提取方法上的
 * RequestMapping / GetMapping / PostMapping / PutMapping / DeleteMapping / PatchMapping
 * 等信息，用于自动创建 YApi 接口。
 */

import fs from 'fs';

// HTTP 方法映射
const METHOD_MAP = {
  'requestmapping': null,
  'getmapping': 'GET',
  'postmapping': 'POST',
  'putmapping': 'PUT',
  'deletemapping': 'DELETE',
  'patchmapping': 'PATCH'
};

function extractPath(annotationBody) {
  if (!annotationBody) return '';
  const body = annotationBody.trim();
  if (!body) return '';

  const inner = body.replace(/^\(/, '').replace(/\)$/, '').trim();
  if (!inner) return '';

  const valueMatch = inner.match(/value\s*=\s*["']([^"']+)["']/);
  if (valueMatch) return valueMatch[1];

  const pathMatch = inner.match(/path\s*=\s*["']([^"']+)["']/);
  if (pathMatch) return pathMatch[1];

  const directMatch = inner.match(/^\s*["']([^"']+)["']/);
  if (directMatch) return directMatch[1];

  return '';
}

function extractMethodFromAnnot(annotationBody) {
  if (!annotationBody) return null;
  const inner = annotationBody.trim().replace(/^\(/, '').replace(/\)$/, '').trim();
  const methodMatch = inner.match(/method\s*=\s*(?:RequestMethod\.)?(\w+)/);
  if (methodMatch) return methodMatch[1].toUpperCase();
  return null;
}

function splitParamsSmart(str) {
  const parts = [];
  let angleDepth = 0;
  let parenDepth = 0;
  let current = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '<') angleDepth++;
    else if (ch === '>') angleDepth--;
    else if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth--;
    else if (ch === ',' && angleDepth === 0 && parenDepth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current);

  return parts;
}

function parseParameters(paramString) {
  const params = [];
  if (!paramString || !paramString.trim()) return params;

  const trimmed = paramString.trim();
  const parts = splitParamsSmart(trimmed);

  for (const part of parts) {
    const p = part.trim();
    if (!p) continue;

    const param = {
      name: '',
      type: '',
      required: false,
      annotation: null,
      defaultValue: null,
      description: ''
    };

    // 提取注解
    const annotMatch = p.match(/@(RequestParam|PathVariable|RequestBody|RequestHeader|RequestPart)\s*(\([^)]*\))?/);
    if (annotMatch) {
      param.annotation = annotMatch[1].toLowerCase();

      const annotBody = annotMatch[2] || '';
      let hasExplicitRequired = false;

      if (annotBody) {
        const inner = annotBody.replace(/^\(/, '').replace(/\)$/, '').trim();

        const nameMatch = inner.match(/(?:value|name)\s*=\s*["']([^"']+)["']/);
        const directMatch = inner.match(/^\s*["']([^"']+)["']/);
        if (nameMatch) param.name = nameMatch[1];
        else if (directMatch) param.name = directMatch[1];

        const requiredMatch = inner.match(/required\s*=\s*(false|true)/);
        if (requiredMatch) {
          param.required = requiredMatch[1] === 'true';
          hasExplicitRequired = true;
        }

        const defMatch = inner.match(/defaultValue\s*=\s*["']([^"']*)["']/);
        if (defMatch) {
          param.defaultValue = defMatch[1];
          // defaultValue implies optional
          if (!hasExplicitRequired) param.required = false;
        }
      }

      // Set default required based on annotation type
      if (!hasExplicitRequired && !param.defaultValue) {
        if (param.annotation === 'requestparam') {
          param.required = true; // Spring default
        } else if (param.annotation === 'pathvariable') {
          param.required = true;
        }
      }

      // @RequestBody always required
      if (param.annotation === 'requestbody') {
        param.required = true;
      }
    }

    // 去掉注解，提取类型和变量名
    const cleanPart = p.replace(/@\w+(?:\([^)]*\))?\s*/g, '').trim();
    const finalClean = cleanPart.replace(/\bfinal\b\s*/g, '').trim();

    const typeVarMatch = finalClean.match(/^([\w.]+(?:<[^>]*>)?)\s+(\w+)$/);
    if (typeVarMatch) {
      param.type = typeVarMatch[1];
      if (!param.name) param.name = typeVarMatch[2];
    } else if (finalClean && !param.name) {
      param.name = finalClean;
    }

    params.push(param);
  }

  return params;
}

// 提取 Javadoc 注释
function extractJavadoc(content, methodIndex) {
  const before = content.substring(0, methodIndex);
  const javadocStart = before.lastIndexOf('/**');
  if (javadocStart === -1) return null;

  const afterJavadocStart = before.substring(javadocStart);
  const endMatch = afterJavadocStart.match(/\*\//);
  if (!endMatch) return null;

  const javadocEnd = javadocStart + endMatch.index + 2;

  // 检查 javadoc 和方法之间是否有非注解代码
  const between = before.substring(javadocEnd, methodIndex).trim();
  if (between) {
    const lines = between.split('\n');
    const hasCode = lines.some(line => {
      const l = line.trim();
      return l && !l.startsWith('@') && !l.startsWith('*') && !l.startsWith('//') && !l.startsWith('/*');
    });
    if (hasCode) return null;
  }

  const javadocContent = before.substring(javadocStart, javadocEnd);
  const lines = javadocContent.replace('/**', '').replace('*/', '').split('\n');
  const descLines = [];
  const paramDescs = {};
  let returnDesc = '';

  for (const line of lines) {
    const clean = line.replace(/^\s*\*\s?/, '').trim();
    const paramMatch = clean.match(/@param\s+(\w+)\s+(.*)/);
    const returnMatch = clean.match(/@return\s+(.*)/);

    if (paramMatch) {
      paramDescs[paramMatch[1]] = paramMatch[2];
    } else if (returnMatch) {
      returnDesc = returnMatch[1];
    } else if (clean && !clean.startsWith('@')) {
      descLines.push(clean);
    }
  }

  return {
    description: descLines.join(' ').trim(),
    paramDescs,
    returnDesc
  };
}

/**
 * 解析完整的 Java Controller 文件
 */
export function parseControllerFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return parseControllerContent(content, filePath);
}

/**
 * 解析 Java Controller 源码内容
 */
export function parseControllerContent(content, sourcePath) {
  const result = {
    sourcePath: sourcePath || '',
    className: '',
    packageName: '',
    classRequestMapping: '',
    methods: []
  };

  // 提取包名
  const pkgMatch = content.match(/package\s+([\w.]+);/);
  if (pkgMatch) result.packageName = pkgMatch[1];

  // 提取类名
  const classMatch = content.match(/(?:public\s+)?(?:abstract\s+)?class\s+(\w+)/);
  if (classMatch) result.className = classMatch[1];

  // 提取类级别的 @RequestMapping
  if (classMatch) {
    const beforeClass = content.substring(0, classMatch.index);
    const classReqMatch = beforeClass.match(/@RequestMapping\s*\(([^)]*)\)\s*$/m);
    if (classReqMatch) {
      const inner = classReqMatch[1].trim();
      const pathVal = extractPath('(' + inner + ')');
      if (pathVal) {
        result.classRequestMapping = pathVal;
      }
    }
  }

  // 找所有方法级注解
  const methodAnnotRe = /@(RequestMapping|GetMapping|PostMapping|PutMapping|DeleteMapping|PatchMapping)\s*(\([^)]*\))?/g;

  let annotMatch;
  const methodAnnotations = [];

  while ((annotMatch = methodAnnotRe.exec(content)) !== null) {
    const annotIndex = annotMatch.index;

    // 跳过类级别的注解
    if (classMatch && annotIndex < classMatch.index) continue;

    methodAnnotations.push({
      annotName: annotMatch[1],
      annotBody: annotMatch[2] || '',
      index: annotIndex
    });
  }

  // 对每个注解，向后查找方法签名
  for (const ma of methodAnnotations) {
    const chunk = content.substring(ma.index);

    // 匹配方法签名: public/protected/private [static] 返回类型 方法名(
    const methodSigRe = /(?:public|protected|private)\s+(?:static\s+)?(?:synchronized\s+)?(?:final\s+)?([\w<>[\].,\s?]+)\s+(\w+)\s*\(/;
    const sigMatch = chunk.match(methodSigRe);

    if (!sigMatch) continue;

    const returnType = sigMatch[1].trim();
    const methodName = sigMatch[2];

    // 手动提取括号内的参数
    const afterOpenParen = ma.index + sigMatch.index + sigMatch[0].length;
    let parenDepth = 1;
    let paramEnd = afterOpenParen;
    while (paramEnd < content.length && parenDepth > 0) {
      if (content[paramEnd] === '(') parenDepth++;
      else if (content[paramEnd] === ')') parenDepth--;
      if (parenDepth > 0) paramEnd++;
    }
    const paramString = content.substring(afterOpenParen, paramEnd);

    // 获取 Javadoc
    const javadoc = extractJavadoc(content, ma.index);

    // 提取路径
    let path = extractPath(ma.annotBody);
    const methodAnnotName = ma.annotName.toLowerCase();
    let httpMethod = METHOD_MAP[methodAnnotName];

    if (!httpMethod) {
      httpMethod = extractMethodFromAnnot(ma.annotBody) || 'GET';
    }

    // 组合类级别路径
    if (result.classRequestMapping) {
      let base = result.classRequestMapping;
      if (!base.startsWith('/')) base = '/' + base;
      if (base.endsWith('/')) base = base.slice(0, -1);
      if (path) {
        if (!path.startsWith('/')) path = '/' + path;
        path = base + path;
      } else {
        path = base;
      }
    } else {
      if (path && !path.startsWith('/')) path = '/' + path;
    }
    if (!path) path = '/' + methodName;

    // 生成标题
    let title = javadoc?.description || '';
    if (!title) {
      title = methodName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, s => s.toUpperCase())
        .trim();
    }

    // 解析参数
    const parameters = parseParameters(paramString);

    // 合并 Javadoc 参数描述
    if (javadoc) {
      for (const param of parameters) {
        if (javadoc.paramDescs[param.name]) {
          param.description = javadoc.paramDescs[param.name];
        }
      }
    }

    // 构建 query 参数和 body 参数
    const reqQuery = [];
    const reqBodyParams = [];

    for (const param of parameters) {
      if (param.annotation === 'requestbody') {
        reqBodyParams.push({
          name: param.name,
          type: param.type,
          required: true,
          description: param.description
        });
      } else if (param.annotation === 'pathvariable') {
        // 路径参数 - 不在 query/body 列出
      } else {
        reqQuery.push({
          name: param.name,
          type: mapJavaType(param.type),
          required: param.required,
          desc: param.description,
          example: ''
        });
      }
    }

    // 请求体示例
    let reqBodyOther = '';
    if (reqBodyParams.length > 0) {
      const bodyObj = {};
      for (const p of reqBodyParams) {
        bodyObj[p.name] = getTypeExample(p.type);
      }
      reqBodyOther = JSON.stringify(bodyObj, null, 2);
    }

    // 响应体示例
    let resBody = '';
    if (returnType && returnType !== 'void' && returnType !== 'Void') {
      resBody = JSON.stringify({
        code: 200,
        message: 'success',
        data: getTypeExample(returnType)
      }, null, 2);
    } else {
      resBody = JSON.stringify({
        code: 200,
        message: 'success'
      }, null, 2);
    }

    result.methods.push({
      methodName,
      title,
      path,
      method: httpMethod,
      returnType,
      description: javadoc?.description || '',
      parameters,
      reqQuery,
      reqBodyParams,
      reqBodyOther,
      resBody,
      resBodyType: 'json'
    });
  }

  return result;
}

function mapJavaType(javaType) {
  const baseType = (javaType || '').replace(/<.*>/, '').trim();
  const typeMap = {
    'String': 'string',
    'Integer': 'integer',
    'int': 'integer',
    'Long': 'integer',
    'long': 'integer',
    'Double': 'number',
    'double': 'number',
    'Float': 'number',
    'float': 'number',
    'Boolean': 'boolean',
    'boolean': 'boolean',
    'Date': 'string',
    'LocalDate': 'string',
    'LocalDateTime': 'string',
    'BigDecimal': 'number',
    'List': 'array',
    'Map': 'object',
    'Object': 'object'
  };
  return typeMap[baseType] || 'string';
}

function getTypeExample(javaType) {
  const baseType = (javaType || '').replace(/<.*>/, '').trim();
  switch (baseType) {
    case 'String':
    case 'string':
      return 'string';
    case 'Integer':
    case 'int':
      return 0;
    case 'Long':
    case 'long':
      return 0;
    case 'Double':
    case 'double':
    case 'Float':
    case 'float':
    case 'BigDecimal':
    case 'number':
      return 0.0;
    case 'Boolean':
    case 'boolean':
      return true;
    case 'List':
    case 'ArrayList':
      return [];
    case 'Map':
    case 'HashMap':
      return {};
    case 'R':
    case 'Result':
    case 'Response':
    case 'AjaxResult':
    case 'ApiResult':
      return { success: true, message: '操作成功', data: null };
    case 'Page':
    case 'PageResult':
    case 'PageInfo':
      return { total: 0, page: 1, size: 20, records: [] };
    default:
      return {};
  }
}

/**
 * 将解析结果格式化为可读的 YApi 接口列表
 */
export function formatParsedMethods(parsed) {
  const lines = [];
  lines.push(`类名: ${parsed.className}`);
  lines.push(`包名: ${parsed.packageName}`);
  if (parsed.classRequestMapping) {
    lines.push(`类路径前缀: ${parsed.classRequestMapping}`);
  }
  lines.push(`发现 ${parsed.methods.length} 个接口方法:\n`);

  for (const method of parsed.methods) {
    lines.push(`  [${method.method}] ${method.path}`);
    lines.push(`  标题: ${method.title}`);
    if (method.description) lines.push(`  描述: ${method.description}`);
    if (method.reqQuery.length > 0) {
      lines.push(`  查询参数:`);
      for (const q of method.reqQuery) {
        lines.push(`    - ${q.name} (${q.type})${q.required ? ' [必填]' : ''}${q.desc ? ': ' + q.desc : ''}`);
      }
    }
    if (method.reqBodyParams.length > 0) {
      lines.push(`  请求体参数:`);
      for (const b of method.reqBodyParams) {
        lines.push(`    - ${b.name} (${b.type})${b.description ? ': ' + b.description : ''}`);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 将解析结果转换为 YApi 创建接口所需的数据格式
 */
export function toYApiCreatePayload(method, options = {}) {
  const payload = {
    title: options.title || method.title,
    path: options.path || method.path,
    method: options.method || method.method,
    pid: options.projectId,
    catid: options.catid || '',
    status: options.status || 'undone',
    desc: options.description || method.description || '',
    tag: options.tags || [],
    req_query: method.reqQuery,
    req_headers: options.reqHeaders || [],
    req_body_type: options.reqBodyType || (method.reqBodyParams.length > 0 ? 'json' : 'none'),
    req_body_other: options.reqBodyOther || method.reqBodyOther || '',
    req_body_form: options.reqBodyForm || [],
    // JSON Schema 模式（表格展示字段）
    req_body_is_json_schema: true,
    res_body_type: method.resBodyType || 'json',
    res_body: options.resBody || method.resBody || '',
    // JSON Schema 模式（表格展示字段）
    res_body_is_json_schema: true,
  };

  if (options.username) {
    payload.username = options.username;
  }
  if (options.uid) {
    payload.uid = options.uid;
  }

  return payload;
}

export default {
  parseControllerFile,
  parseControllerContent,
  formatParsedMethods,
  toYApiCreatePayload
};
