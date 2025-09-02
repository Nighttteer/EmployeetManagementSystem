/**

export const formatDate = (date, format = 'YYYY-MM-DD') => {
  // 检查输入参数有效性
  if (!date) return '';
  
  // 创建Date对象，支持字符串和Date对象输入
  const d = new Date(date);
  
  // 提取日期组件，使用padStart确保两位数格式
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');  // getMonth()返回0-11
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  // 根据指定格式返回相应的日期字符串
  switch (format) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM-DD':
      return `${month}-${day}`;
    case 'YYYY-MM-DD HH:mm':
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    case 'relative':
      return getRelativeTime(d);  // 调用相对时间函数
    default:
      return d.toLocaleDateString('zh-CN');  // 默认使用中文格式
  }
};


export const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);  // 计算时间差（毫秒）
  
  // 转换为不同时间单位
  const minutes = Math.floor(diff / 60000);      // 转换为分钟
  const hours = Math.floor(minutes / 60);        // 转换为小时
  const days = Math.floor(hours / 24);           // 转换为天数
  
  // 根据时间差返回相应的描述
  if (minutes < 1) return 'just now';           // 小于1分钟
  if (minutes < 60) return `${minutes} minutes ago`;  // 小于1小时
  if (hours < 24) return `${hours} hours ago`;        // 小于1天
  if (days < 7) return `${days} days ago`;            // 小于1周
  
  // 超过1周则显示具体日期
  return formatDate(date, 'MM-DD');
};

/**
 * 通用数据验证函数集合
 * 
 * 提供常用的数据格式验证功能，包括手机号、邮箱、密码强度、身份证号等
 * 所有验证函数都返回布尔值，便于在表单验证中使用
 */
export const validators = {
  /**
   * 验证中国手机号码
   * 
   * 支持13-19开头的11位手机号，符合中国移动、联通、电信的号码规则
   * 
   * @param {string} phone - 要验证的手机号码
   * @returns {boolean} 是否为有效的手机号码
   * 
   * @example
   * validators.phone('13800138000') // true
   * validators.phone('12345678901') // false
   */
  phone: (phone) => {
    const phoneRegex = /^1[3-9]\d{9}$/;  // 1开头，第二位3-9，总共11位
    return phoneRegex.test(phone);
  },
  
  /**
   * 验证邮箱地址格式
   * 
   * 检查邮箱是否符合基本的格式要求：用户名@域名.顶级域名
   * 
   * @param {string} email - 要验证的邮箱地址
   * @returns {boolean} 是否为有效的邮箱格式
   * 
   * @example
   * validators.email('user@example.com') // true
   * validators.email('invalid-email') // false
   */
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  // 基本邮箱格式验证
    return emailRegex.test(email);
  },
  
  /**
   * 验证密码强度
   * 
   * 要求：至少8位，必须包含字母和数字，可选特殊字符
   * 
   * @param {string} password - 要验证的密码
   * @returns {boolean} 是否符合密码强度要求
   * 
   * @example
   * validators.password('Password123') // true
   * validators.password('12345678') // false (缺少字母)
   */
  password: (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    // (?=.*[A-Za-z]) 必须包含字母
    // (?=.*\d) 必须包含数字
    // [A-Za-z\d@$!%*#?&]{8,} 允许的字符，至少8位
    return passwordRegex.test(password);
  },
  
  /**
   * 验证中国身份证号码
   * 
   * 支持15位（老版本）和18位（新版本）身份证号
   * 18位身份证最后一位可以是数字或X
   * 
   * @param {string} idCard - 要验证的身份证号码
   * @returns {boolean} 是否为有效的身份证号码
   * 
   * @example
   * validators.idCard('110101199001011234') // true
   * validators.idCard('110101900101123') // true (15位)
   */
  idCard: (idCard) => {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    // (^\d{15}$) 15位纯数字
    // (^\d{18}$) 18位纯数字
    // (^\d{17}(\d|X|x)$) 17位数字+1位数字或X
    return idCardRegex.test(idCard);
  },
};

/**
 * 健康数据验证函数集合
 * 
 * 专门用于验证医疗健康数据的有效性，包括血压、血糖、体重、心率等
 * 所有验证函数都返回包含验证结果和错误信息的对象
 */
export const validateHealthData = {
  /**
   * 验证血压数据
   * 
   * 检查收缩压和舒张压的数值是否在合理范围内
   * 收缩压应大于舒张压，符合医学常识
   * 
   * @param {number|string} systolic - 收缩压值
   * @param {number|string} diastolic - 舒张压值
   * @returns {Object} 验证结果对象
   *   - valid: {boolean} 是否有效
   *   - message: {string} 错误信息（如果无效）
   * 
   * @example
   * validateHealthData.bloodPressure(120, 80) // { valid: true }
   * validateHealthData.bloodPressure(300, 80) // { valid: false, message: '收缩压应在60-250之间' }
   */
  bloodPressure: (systolic, diastolic) => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    
    // 检查是否为有效数字
    if (isNaN(sys) || isNaN(dia)) return { valid: false, message: '请输入有效的数值' };
    
    // 检查收缩压范围（60-250 mmHg）
    if (sys < 60 || sys > 250) return { valid: false, message: '收缩压应在60-250之间' };
    
    // 检查舒张压范围（40-150 mmHg）
    if (dia < 40 || dia > 150) return { valid: false, message: '舒张压应在40-150之间' };
    
    // 检查收缩压是否大于舒张压
    if (sys <= dia) return { valid: false, message: '收缩压应大于舒张压' };
    
    return { valid: true };
  },
  
  /**
   * 验证血糖数据
   * 
   * 检查血糖值是否在合理范围内，支持不同类型的血糖测量
   * 
   * @param {number|string} value - 血糖值
   * @param {string} type - 血糖类型，默认为'random'（随机血糖）
   * @returns {Object} 验证结果对象
   * 
   * @example
   * validateHealthData.bloodSugar(6.5) // { valid: true }
   * validateHealthData.bloodSugar(35.0) // { valid: false, message: '血糖值应在1.0-30.0之间' }
   */
  bloodSugar: (value, type = 'random') => {
    const val = parseFloat(value);
    
    // 检查是否为有效数字
    if (isNaN(val)) return { valid: false, message: '请输入有效的数值' };
    
    // 检查血糖值范围（1.0-30.0 mmol/L）
    if (val < 1.0 || val > 30.0) return { valid: false, message: '血糖值应在1.0-30.0之间' };
    
    return { valid: true };
  },
  
  /**
   * 验证体重数据
   * 
   * 检查体重值是否在合理范围内
   * 
   * @param {number|string} value - 体重值（kg）
   * @returns {Object} 验证结果对象
   * 
   * @example
   * validateHealthData.weight(70.5) // { valid: true }
   * validateHealthData.weight(350) // { valid: false, message: '体重应在20-300kg之间' }
   */
  weight: (value) => {
    const val = parseFloat(value);
    
    // 检查是否为有效数字
    if (isNaN(val)) return { valid: false, message: '请输入有效的数值' };
    
    // 检查体重范围（20-300 kg）
    if (val < 20 || val > 300) return { valid: false, message: '体重应在20-300kg之间' };
    
    return { valid: true };
  },
  
  /**
   * 验证心率数据
   * 
   * 检查心率值是否在合理范围内
   * 
   * @param {number|string} value - 心率值（次/分钟）
   * @returns {Object} 验证结果对象
   * 
   * @example
   * validateHealthData.heartRate(75) // { valid: true }
   * validateHealthData.heartRate(250) // { valid: false, message: '心率应在30-220之间' }
   */
  heartRate: (value) => {
    const val = parseInt(value);
    
    // 检查是否为有效数字
    if (isNaN(val)) return { valid: false, message: '请输入有效的数值' };
    
    // 检查心率范围（30-220 次/分钟）
    if (val < 30 || val > 220) return { valid: false, message: '心率应在30-220之间' };
    
    return { valid: true };
  },
};

/**
 * 数据格式化函数集合
 * 
 * 将原始健康数据转换为用户友好的显示格式
 * 处理空值情况，提供统一的显示标准
 */
export const formatters = {
  /**
   * 格式化血压显示
   * 
   * 将收缩压和舒张压组合为标准的血压显示格式
   * 
   * @param {number|string} systolic - 收缩压值
   * @param {number|string} diastolic - 舒张压值
   * @returns {string} 格式化后的血压字符串，如："120/80" 或 "--/--"
   * 
   * @example
   * formatters.bloodPressure(120, 80) // "120/80"
   * formatters.bloodPressure(null, 80) // "--/--"
   */
  bloodPressure: (systolic, diastolic) => {
    if (!systolic || !diastolic) return '--/--';  // 空值显示为占位符
    return `${systolic}/${diastolic}`;            // 标准格式：收缩压/舒张压
  },
  
  /**
   * 格式化血糖显示
   * 
   * 将血糖值格式化为带单位的显示格式，保留一位小数
   * 
   * @param {number|string} value - 血糖值
   * @param {string} unit - 单位，默认为'mmol/L'
   * @returns {string} 格式化后的血糖字符串，如："6.5 mmol/L" 或 "-- mmol/L"
   * 
   * @example
   * formatters.bloodSugar(6.5) // "6.5 mmol/L"
   * formatters.bloodSugar(null) // "-- mmol/L"
   */
  bloodSugar: (value, unit = 'mmol/L') => {
    if (!value) return `-- ${unit}`;                    // 空值显示为占位符
    return `${parseFloat(value).toFixed(1)} ${unit}`;   // 保留一位小数 + 单位
  },
  
  /**
   * 格式化体重显示
   * 
   * 将体重值格式化为带单位的显示格式，保留一位小数
   * 
   * @param {number|string} value - 体重值
   * @param {string} unit - 单位，默认为'kg'
   * @returns {string} 格式化后的体重字符串，如："70.5 kg" 或 "-- kg"
   * 
   * @example
   * formatters.weight(70.5) // "70.5 kg"
   * formatters.weight(null) // "-- kg"
   */
  weight: (value, unit = 'kg') => {
    if (!value) return `-- ${unit}`;                    // 空值显示为占位符
    return `${parseFloat(value).toFixed(1)} ${unit}`;   // 保留一位小数 + 单位
  },
  
  /**
   * 格式化心率显示
   * 
   * 将心率值格式化为带单位的显示格式
   * 
   * @param {number|string} value - 心率值
   * @param {string} unit - 单位，默认为'bpm'（次/分钟）
   * @returns {string} 格式化后的心率字符串，如："75 bpm" 或 "-- bpm"
   * 
   * @example
   * formatters.heartRate(75) // "75 bpm"
   * formatters.heartRate(null) // "-- bpm"
   */
  heartRate: (value, unit = 'bpm') => {
    if (!value) return `-- ${unit}`;                    // 空值显示为占位符
    return `${parseInt(value)} ${unit}`;                // 整数 + 单位
  },
};

/**
 * 健康状态评估函数
 * 
 * 综合分析患者的各项健康指标，评估整体健康状态
 * 根据医学标准判断各项指标是否异常，并给出风险等级
 * 
 * @param {Object} metrics - 健康指标对象，包含血压、血糖、体重、身高等
 * @returns {Object} 健康状态评估结果
 *   - status: {string} 状态等级 ('good'|'attention'|'risk')
 *   - message: {string} 状态描述
 *   - risks: {Array} 风险项目列表
 * 
 * @example
 * const healthStatus = assessHealthStatus({
 *   bloodPressure: { systolic: 140, diastolic: 90 },
 *   bloodSugar: { value: 7.5, type: 'fasting' },
 *   weight: 75, height: 170
 * });
 * // 返回: { status: 'attention', message: '需要关注', risks: ['血压偏高', '空腹血糖偏高'] }
 */
export const assessHealthStatus = (metrics) => {
  const risks = [];
  
  // 血压评估 - 根据中国高血压防治指南标准
  if (metrics.bloodPressure) {
    const { systolic, diastolic } = metrics.bloodPressure;
    if (systolic >= 140 || diastolic >= 90) {
      risks.push('血压偏高');  // 高血压标准
    } else if (systolic >= 130 || diastolic >= 80) {
      risks.push('血压轻微偏高');  // 正常高值
    }
  }
  
  // 血糖评估 - 根据糖尿病诊断标准
  if (metrics.bloodSugar) {
    const { value, type } = metrics.bloodSugar;
    if (type === 'fasting' && value >= 7.0) {
      risks.push('空腹血糖偏高');  // 空腹血糖≥7.0 mmol/L
    } else if (type === 'postprandial' && value >= 11.1) {
      risks.push('餐后血糖偏高');  // 餐后2小时血糖≥11.1 mmol/L
    } else if (type === 'random' && value >= 11.1) {
      risks.push('随机血糖偏高');  // 随机血糖≥11.1 mmol/L
    }
  }
  
  // BMI评估 - 根据中国肥胖标准
  if (metrics.weight && metrics.height) {
    const heightInM = metrics.height / 100;  // 身高转换为米
    const bmi = metrics.weight / (heightInM * heightInM);  // BMI = 体重(kg) / 身高(m)²
    
    if (bmi >= 28) {
      risks.push('体重偏重');  // BMI ≥ 28 为肥胖
    } else if (bmi >= 24) {
      risks.push('体重超标');  // BMI ≥ 24 为超重
    } else if (bmi < 18.5) {
      risks.push('体重偏轻');  // BMI < 18.5 为体重不足
    }
  }
  
  // 根据风险数量确定整体状态
  if (risks.length === 0) {
    return { status: 'good', message: '状态良好', risks: [] };           // 无风险
  } else if (risks.length <= 2) {
    return { status: 'attention', message: '需要关注', risks };          // 1-2个风险
  } else {
    return { status: 'risk', message: '需要重点关注', risks };          // 3个以上风险
  }
};

/**
 * 获取状态对应的颜色
 * 
 * 根据健康状态返回相应的颜色代码，用于UI显示
 * 颜色选择遵循医疗行业的通用标准：绿色=良好，橙色=注意，红色=风险
 * 
 * @param {string} status - 健康状态，可选值：'good'|'attention'|'risk'
 * @returns {string} 对应的十六进制颜色代码
 * 
 * @example
 * getStatusColor('good') // '#2ecc71' (绿色)
 * getStatusColor('attention') // '#f39c12' (橙色)
 * getStatusColor('risk') // '#e74c3c' (红色)
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'good':
      return '#2ecc71';      // 绿色 - 状态良好
    case 'attention':
      return '#f39c12';      // 橙色 - 需要关注
    case 'risk':
      return '#e74c3c';      // 红色 - 需要重点关注
    default:
      return '#95a5a6';      // 灰色 - 默认状态
  }
};

/**
 * 本地存储工具集合
 * 
 * 提供异步的本地数据存储功能，基于 React Native 的 AsyncStorage
 * 适用于存储非敏感数据，如用户偏好设置、缓存数据等
 * 所有操作都包含错误处理，确保应用的稳定性
 */
export const storage = {
  /**
   * 存储数据到本地
   * 
   * 将数据序列化为JSON字符串后存储到本地存储
   * 
   * @param {string} key - 存储键名
   * @param {any} value - 要存储的数据，会被自动序列化
   * @returns {Promise<void>} 存储操作的结果
   * 
   * @example
   * await storage.set('userPreferences', { theme: 'dark', language: 'zh' });
   */
  set: async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value);  // 序列化数据
      await AsyncStorage.setItem(key, jsonValue);  // 存储到本地
    } catch (error) {
      console.error('Storage set error:', error);  // 错误日志
    }
  },
  
  /**
   * 从本地获取数据
   * 
   * 从本地存储读取数据并自动反序列化
   * 
   * @param {string} key - 存储键名
   * @returns {Promise<any>} 存储的数据，如果不存在或出错则返回null
   * 
   * @example
   * const prefs = await storage.get('userPreferences');
   * // 返回: { theme: 'dark', language: 'zh' }
   */
  get: async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);  // 从本地读取
      return jsonValue != null ? JSON.parse(jsonValue) : null;  // 反序列化
    } catch (error) {
      console.error('Storage get error:', error);  // 错误日志
      return null;  // 出错时返回null
    }
  },
  
  /**
   * 从本地删除数据
   * 
   * 删除指定键名的本地存储数据
   * 
   * @param {string} key - 要删除的存储键名
   * @returns {Promise<void>} 删除操作的结果
   * 
   * @example
   * await storage.remove('userPreferences');
   */
  remove: async (key) => {
    try {
      await AsyncStorage.removeItem(key);  // 删除本地数据
    } catch (error) {
      console.error('Storage remove error:', error);  // 错误日志
    }
  },
};

/**
 * 防抖函数
 * 
 * 延迟执行函数，如果在延迟期间再次调用，则重新计时
 * 适用于搜索输入、窗口调整等需要等待用户停止操作的场景
 * 
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 * 
 * @example
 * const debouncedSearch = debounce(searchUsers, 300);
 * // 用户输入时，只有停止输入300ms后才会执行搜索
 */
export const debounce = (func, wait) => {
  let timeout;  // 存储定时器ID
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);  // 清除定时器
      func(...args);          // 执行原函数
    };
    
    clearTimeout(timeout);    // 清除之前的定时器
    timeout = setTimeout(later, wait);  // 设置新的定时器
  };
};

/**
 * 节流函数
 * 
 * 限制函数在指定时间间隔内只能执行一次
 * 适用于滚动事件、按钮点击等需要限制执行频率的场景
 * 
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 * 
 * @example
 * const throttledScroll = throttle(handleScroll, 100);
 * // 滚动事件最多每100ms执行一次
 */
export const throttle = (func, limit) => {
  let inThrottle;  // 节流状态标志
  
  return function() {
    const args = arguments;  // 获取函数参数
    const context = this;    // 获取函数上下文
    
    if (!inThrottle) {  // 如果不在节流状态
      func.apply(context, args);  // 执行原函数
      inThrottle = true;          // 设置节流状态
      
      // 延迟重置节流状态
      setTimeout(() => inThrottle = false, limit);
    }
  };
}; 