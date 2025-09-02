// 序列化工具函数
// 用于确保传递给Redux的数据是可序列化的

/**
 * 检查一个值是否可序列化
 * @param {any} value - 要检查的值
 * @returns {boolean} - 是否可序列化
 */
export const isSerializable = (value) => {
  if (value === null || value === undefined) return true;
  
  const type = typeof value;
  if (type === 'boolean' || type === 'number' || type === 'string') return true;
  
  if (type === 'object') {
    // 检查是否为普通对象或数组
    if (Array.isArray(value)) {
      return value.every(isSerializable);
    }
    
    // 检查是否为普通对象（不是类实例、Date、Function等）
    if (value.constructor === Object) {
      return Object.values(value).every(isSerializable);
    }
    
    // Date对象、类实例、函数等都不可序列化
    return false;
  }
  
  return false;
};

/**
 * 深度转换对象为可序列化格式
 * @param {any} obj - 要转换的对象
 * @returns {any} - 可序列化的对象
 */
export const makeSerializable = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  const type = typeof obj;
  if (type === 'boolean' || type === 'number' || type === 'string') return obj;
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(makeSerializable);
  }
  
  if (type === 'object') {
    // 如果对象有toSerializable方法，使用它
    if (typeof obj.toSerializable === 'function') {
      return obj.toSerializable();
    }
    
    // 否则递归处理对象属性
    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = makeSerializable(obj[key]);
      }
    }
    return result;
  }
  
  // 函数和其他不可序列化的类型返回null
  return null;
};

/**
 * 安全的dispatch包装器，确保payload是可序列化的
 * @param {Function} dispatch - Redux dispatch函数
 * @param {Object} action - action对象
 */
export const safeDispatch = (dispatch, action) => {
  const serializableAction = {
    ...action,
    payload: makeSerializable(action.payload)
  };
  
  // 开发环境下进行检查
  if (__DEV__) {
    if (!isSerializable(serializableAction)) {
      console.warn('Action payload contains non-serializable data:', action);
    }
  }
  
  return dispatch(serializableAction);
};

/**
 * 验证Redux state的可序列化性
 * @param {Object} state - Redux state
 * @param {string} path - state路径（用于错误信息）
 */
export const validateStateSerializability = (state, path = 'root') => {
  if (!__DEV__) return; // 只在开发环境中运行
  
  if (!isSerializable(state)) {
    console.error(`Non-serializable value found in state at path: ${path}`, state);
  }
}; 