// 日期格式化函数
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
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
      return getRelativeTime(d);
    default:
      return d.toLocaleDateString('zh-CN');
  }
};

// 获取相对时间（如：2小时前，昨天等）
export const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  
  return formatDate(date, 'MM-DD');
};

// 验证函数
export const validators = {
  // 验证手机号
  phone: (phone) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  },
  
  // 验证邮箱
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // 验证密码强度（至少8位，包含字母和数字）
  password: (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  },
  
  // 验证身份证号
  idCard: (idCard) => {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    return idCardRegex.test(idCard);
  },
};

// 健康数据验证
export const validateHealthData = {
  // 血压验证
  bloodPressure: (systolic, diastolic) => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    
    if (isNaN(sys) || isNaN(dia)) return { valid: false, message: '请输入有效的数值' };
    if (sys < 60 || sys > 250) return { valid: false, message: '收缩压应在60-250之间' };
    if (dia < 40 || dia > 150) return { valid: false, message: '舒张压应在40-150之间' };
    if (sys <= dia) return { valid: false, message: '收缩压应大于舒张压' };
    
    return { valid: true };
  },
  
  // 血糖验证
  bloodSugar: (value, type = 'random') => {
    const val = parseFloat(value);
    
    if (isNaN(val)) return { valid: false, message: '请输入有效的数值' };
    if (val < 1.0 || val > 30.0) return { valid: false, message: '血糖值应在1.0-30.0之间' };
    
    return { valid: true };
  },
  
  // 体重验证
  weight: (value) => {
    const val = parseFloat(value);
    
    if (isNaN(val)) return { valid: false, message: '请输入有效的数值' };
    if (val < 20 || val > 300) return { valid: false, message: '体重应在20-300kg之间' };
    
    return { valid: true };
  },
  
  // 心率验证
  heartRate: (value) => {
    const val = parseInt(value);
    
    if (isNaN(val)) return { valid: false, message: '请输入有效的数值' };
    if (val < 30 || val > 220) return { valid: false, message: '心率应在30-220之间' };
    
    return { valid: true };
  },
};

// 数据格式化函数
export const formatters = {
  // 格式化血压显示
  bloodPressure: (systolic, diastolic) => {
    if (!systolic || !diastolic) return '--/--';
    return `${systolic}/${diastolic}`;
  },
  
  // 格式化血糖显示
  bloodSugar: (value, unit = 'mmol/L') => {
    if (!value) return `-- ${unit}`;
    return `${parseFloat(value).toFixed(1)} ${unit}`;
  },
  
  // 格式化体重显示
  weight: (value, unit = 'kg') => {
    if (!value) return `-- ${unit}`;
    return `${parseFloat(value).toFixed(1)} ${unit}`;
  },
  
  // 格式化心率显示
  heartRate: (value, unit = 'bpm') => {
    if (!value) return `-- ${unit}`;
    return `${parseInt(value)} ${unit}`;
  },
};

// 健康状态评估
export const assessHealthStatus = (metrics) => {
  const risks = [];
  
  // 血压评估
  if (metrics.bloodPressure) {
    const { systolic, diastolic } = metrics.bloodPressure;
    if (systolic >= 140 || diastolic >= 90) {
      risks.push('血压偏高');
    } else if (systolic >= 130 || diastolic >= 80) {
      risks.push('血压轻微偏高');
    }
  }
  
  // 血糖评估
  if (metrics.bloodSugar) {
    const { value, type } = metrics.bloodSugar;
    if (type === 'fasting' && value >= 7.0) {
      risks.push('空腹血糖偏高');
    } else if (type === 'postprandial' && value >= 11.1) {
      risks.push('餐后血糖偏高');
    } else if (type === 'random' && value >= 11.1) {
      risks.push('随机血糖偏高');
    }
  }
  
  // BMI评估（如果有身高体重数据）
  if (metrics.weight && metrics.height) {
    const heightInM = metrics.height / 100;
    const bmi = metrics.weight / (heightInM * heightInM);
    
    if (bmi >= 28) {
      risks.push('体重偏重');
    } else if (bmi >= 24) {
      risks.push('体重超标');
    } else if (bmi < 18.5) {
      risks.push('体重偏轻');
    }
  }
  
  if (risks.length === 0) {
    return { status: 'good', message: '状态良好', risks: [] };
  } else if (risks.length <= 2) {
    return { status: 'attention', message: '需要关注', risks };
  } else {
    return { status: 'risk', message: '需要重点关注', risks };
  }
};

// 颜色工具函数
export const getStatusColor = (status) => {
  switch (status) {
    case 'good':
      return '#2ecc71';
    case 'attention':
      return '#f39c12';
    case 'risk':
      return '#e74c3c';
    default:
      return '#95a5a6';
  }
};

// 本地存储工具（用于非敏感数据）
export const storage = {
  set: async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  
  get: async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  
  remove: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
};

// 防抖函数
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}; 