// 数据模型定义和常量
export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor', 
  ADMIN: 'admin'
};

export const METRIC_TYPES = {
  BLOOD_PRESSURE: 'blood_pressure',
  BLOOD_GLUCOSE: 'blood_glucose',
  HEART_RATE: 'heart_rate',
  WEIGHT: 'weight',
  URIC_ACID: 'uric_acid',
  LIPIDS: 'lipids'
};

export const MEDICATION_STATUS = {
  PENDING: 'pending',
  TAKEN: 'taken',
  MISSED: 'missed'
};

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image'
};

// 健康指标表单字段配置 - 使用翻译键而不是硬编码文本
export const HEALTH_METRIC_FIELDS = {
  [METRIC_TYPES.BLOOD_PRESSURE]: {
    fields: ['systolic', 'diastolic'],
    labelKeys: { systolic: 'health.systolicBP', diastolic: 'health.diastolicBP' },
    units: { systolic: 'mmHg', diastolic: 'mmHg' },
    validations: {
      systolic: { min: 60, max: 250 },
      diastolic: { min: 40, max: 150 }
    }
  },
  [METRIC_TYPES.BLOOD_GLUCOSE]: {
    fields: ['blood_glucose'],
    labelKeys: { blood_glucose: 'health.bloodGlucose' },
    units: { blood_glucose: 'mmol/L' },
    validations: {
      blood_glucose: { min: 2, max: 30 }
    }
  },
  [METRIC_TYPES.HEART_RATE]: {
    fields: ['heart_rate'],
    labelKeys: { heart_rate: 'health.heartRate' },
    units: { heart_rate: 'bpm' },
    validations: {
      heart_rate: { min: 40, max: 200 }
    }
  },
  [METRIC_TYPES.WEIGHT]: {
    fields: ['weight'],
    labelKeys: { weight: 'health.weight' },
    units: { weight: 'kg' },
    validations: {
      weight: { min: 20, max: 300 }
    }
  },
  [METRIC_TYPES.URIC_ACID]: {
    fields: ['uric_acid'],
    labelKeys: { uric_acid: 'health.uricAcid' },
    units: { uric_acid: 'μmol/L' },
    validations: {
      uric_acid: { min: 100, max: 800 }
    }
  },
  [METRIC_TYPES.LIPIDS]: {
    fields: ['lipids_total', 'hdl', 'ldl', 'triglyceride'],
    labelKeys: {
      lipids_total: 'health.totalCholesterol',
      hdl: 'health.hdlCholesterol',
      ldl: 'health.ldlCholesterol',
      triglyceride: 'health.triglycerides'
    },
    units: {
      lipids_total: 'mmol/L',
      hdl: 'mmol/L', 
      ldl: 'mmol/L',
      triglyceride: 'mmol/L'
    },
    validations: {
      lipids_total: { min: 2, max: 15 },
      hdl: { min: 0.5, max: 3 },
      ldl: { min: 1, max: 8 },
      triglyceride: { min: 0.5, max: 10 }
    }
  }
};

// 默认健康指标阈值（可由ThresholdSetting表覆盖）
export const DEFAULT_THRESHOLDS = {
  [METRIC_TYPES.BLOOD_PRESSURE]: {
    normal: { systolic: [90, 130], diastolic: [60, 85] },
    warning: { systolic: [130, 140], diastolic: [85, 90] },
    danger: { systolic: [140, 999], diastolic: [90, 999] }
  },
  [METRIC_TYPES.BLOOD_GLUCOSE]: {
    normal: { blood_glucose: [3.9, 6.1] },
    warning: { blood_glucose: [6.1, 7.0] },
    danger: { blood_glucose: [7.0, 999] }
  },
  [METRIC_TYPES.HEART_RATE]: {
    normal: { heart_rate: [60, 100] },
    warning: { heart_rate: [50, 120] },
    danger: { heart_rate: [0, 200] }
  },
  [METRIC_TYPES.WEIGHT]: {
    // BMI基础计算，需要身高配合
    normal: { weight: [0, 999] } // 实际计算需要BMI
  },
  [METRIC_TYPES.URIC_ACID]: {
    normal: { 
      male: { uric_acid: [210, 420] },
      female: { uric_acid: [150, 360] }
    },
    warning: {
      male: { uric_acid: [420, 480] },
      female: { uric_acid: [360, 420] }
    },
    danger: {
      male: { uric_acid: [480, 999] },
      female: { uric_acid: [420, 999] }
    }
  },
  [METRIC_TYPES.LIPIDS]: {
    normal: {
      lipids_total: [0, 5.2],
      hdl: [1.0, 999],
      ldl: [0, 3.4],
      triglyceride: [0, 1.7]
    },
    warning: {
      lipids_total: [5.2, 6.2],
      hdl: [0.8, 1.0],
      ldl: [3.4, 4.1],
      triglyceride: [1.7, 2.3]
    },
    danger: {
      lipids_total: [6.2, 999],
      hdl: [0, 0.8],
      ldl: [4.1, 999],
      triglyceride: [2.3, 999]
    }
  }
};

// 用药频次选项
export const MEDICATION_FREQUENCIES = [
  { value: 'QD', label: '每日一次', times: 1 },
  { value: 'BID', label: '每日两次', times: 2 },
  { value: 'TID', label: '每日三次', times: 3 },
  { value: 'QID', label: '每日四次', times: 4 },
  { value: 'Q12H', label: '每12小时一次', times: 2 },
  { value: 'Q8H', label: '每8小时一次', times: 3 },
  { value: 'Q6H', label: '每6小时一次', times: 4 },
  { value: 'PRN', label: '按需服用', times: 0 }
];

// 服药时间选项
export const MEDICATION_TIMES = [
  { value: 'before_breakfast', label: '早餐前' },
  { value: 'after_breakfast', label: '早餐后' },
  { value: 'before_lunch', label: '午餐前' },
  { value: 'after_lunch', label: '午餐后' },
  { value: 'before_dinner', label: '晚餐前' },
  { value: 'after_dinner', label: '晚餐后' },
  { value: 'before_sleep', label: '睡前' },
  { value: 'morning', label: '早晨' },
  { value: 'noon', label: '中午' },
  { value: 'evening', label: '晚上' }
];

// 数据模型类
export class HealthMetric {
  constructor(data = {}) {
    this.id = data.id || null;
    this.patient_id = data.patient_id || null;
    this.measured_by = data.measured_by || null;
    this.last_modified_by = data.last_modified_by || null;
    this.metric_type = data.metric_type || '';
    this.systolic = data.systolic || null;
    this.diastolic = data.diastolic || null;
    this.heart_rate = data.heart_rate || null;
    this.blood_glucose = data.blood_glucose || null;
    this.uric_acid = data.uric_acid || null;
    this.weight = data.weight || null;
    this.lipids_total = data.lipids_total || null;
    this.hdl = data.hdl || null;
    this.ldl = data.ldl || null;
    this.triglyceride = data.triglyceride || null;
    this.measured_at = data.measured_at || new Date().toISOString();
    this.updated_at = data.updated_at || new Date().toISOString();
    this.note = data.note || '';
  }

  // 获取该指标的主要值
  getPrimaryValue() {
    switch (this.metric_type) {
      case METRIC_TYPES.BLOOD_PRESSURE:
        return this.systolic && this.diastolic ? `${this.systolic}/${this.diastolic}` : null;
      case METRIC_TYPES.BLOOD_GLUCOSE:
        return this.blood_glucose;
      case METRIC_TYPES.HEART_RATE:
        return this.heart_rate;
      case METRIC_TYPES.WEIGHT:
        return this.weight;
      case METRIC_TYPES.URIC_ACID:
        return this.uric_acid;
      case METRIC_TYPES.LIPIDS:
        return this.lipids_total;
      default:
        return null;
    }
  }

  // 验证数据有效性
  validate() {
    const config = HEALTH_METRIC_FIELDS[this.metric_type];
    if (!config) return { valid: false, errors: ['未知的指标类型'] };

    const errors = [];
    config.fields.forEach(field => {
      const value = this[field];
      if (value !== null && value !== undefined) {
        const validation = config.validations[field];
        if (validation) {
          if (value < validation.min || value > validation.max) {
            // 使用字段名作为错误信息，避免访问不存在的labels属性
            errors.push(`${field}值超出正常范围 (${validation.min}-${validation.max})`);
          }
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }

  // 转换为可序列化的普通对象（用于Redux store）
  toSerializable() {
    return {
      id: this.id,
      patient_id: this.patient_id,
      measured_by: this.measured_by,
      last_modified_by: this.last_modified_by,
      metric_type: this.metric_type,
      systolic: this.systolic,
      diastolic: this.diastolic,
      heart_rate: this.heart_rate,
      blood_glucose: this.blood_glucose,
      uric_acid: this.uric_acid,
      weight: this.weight,
      lipids_total: this.lipids_total,
      hdl: this.hdl,
      ldl: this.ldl,
      triglyceride: this.triglyceride,
      measured_at: this.measured_at,
      updated_at: this.updated_at,
      note: this.note
    };
  }
}

export class MedicationPlan {
  constructor(data = {}) {
    this.id = data.id || null;
    this.patient_id = data.patient_id || null;
    this.doctor_id = data.doctor_id || null;
    this.medication_id = data.medication_id || null;
    this.medication_name = data.medication_name || '';
    this.dosage = data.dosage || 0;
    this.frequency = data.frequency || 'QD';
    this.time_of_day = data.time_of_day || 'after_breakfast';
    this.start_date = data.start_date || new Date().toISOString().split('T')[0];
    this.end_date = data.end_date || null;
    this.created_at = data.created_at || new Date().toISOString();
  }

  // 获取每日服药次数
  getDailyCount() {
    const freq = MEDICATION_FREQUENCIES.find(f => f.value === this.frequency);
    return freq ? freq.times : 1;
  }

  // 获取可读的频次描述
  getFrequencyLabel() {
    const freq = MEDICATION_FREQUENCIES.find(f => f.value === this.frequency);
    return freq ? freq.label : this.frequency;
  }

  // 获取可读的时间描述
  getTimeLabel() {
    const time = MEDICATION_TIMES.find(t => t.value === this.time_of_day);
    return time ? time.label : this.time_of_day;
  }

  // 转换为可序列化的普通对象（用于Redux store）
  toSerializable() {
    return {
      id: this.id,
      patient_id: this.patient_id,
      doctor_id: this.doctor_id,
      medication_id: this.medication_id,
      medication_name: this.medication_name,
      dosage: this.dosage,
      frequency: this.frequency,
      time_of_day: this.time_of_day,
      start_date: this.start_date,
      end_date: this.end_date,
      created_at: this.created_at
    };
  }
}

// 工具函数：获取指标的主要值（支持普通对象和HealthMetric实例）
export const getMetricPrimaryValue = (metric) => {
  if (!metric || !metric.metric_type) return null;

  // 如果是HealthMetric实例，直接调用方法
  if (typeof metric.getPrimaryValue === 'function') {
    return metric.getPrimaryValue();
  }

  // 处理普通对象
  switch (metric.metric_type) {
    case METRIC_TYPES.BLOOD_PRESSURE:
      return metric.systolic && metric.diastolic ? `${metric.systolic}/${metric.diastolic}` : null;
    case METRIC_TYPES.BLOOD_GLUCOSE:
      return metric.blood_glucose || metric.glucose;
    case METRIC_TYPES.HEART_RATE:
      return metric.heart_rate;
    case METRIC_TYPES.WEIGHT:
      return metric.weight;
    case METRIC_TYPES.URIC_ACID:
      return metric.uric_acid;
    case METRIC_TYPES.LIPIDS:
      return metric.lipids_total;
    default:
      return null;
  }
};

// 工具函数：评估健康指标状态
export const evaluateHealthStatus = (metric, userGender = 'male') => {
  if (!metric || !metric.metric_type) return 'unknown';
  
  const thresholds = DEFAULT_THRESHOLDS[metric.metric_type];
  if (!thresholds) return 'unknown';

  const value = getMetricPrimaryValue(metric);
  if (!value) return 'unknown';

  // 特殊处理需要性别区分的指标
  let currentThresholds = thresholds;
  if (metric.metric_type === METRIC_TYPES.URIC_ACID) {
    // 安全检查thresholds结构
    if (!thresholds.normal || !thresholds.warning || !thresholds.danger ||
        !thresholds.normal[userGender] || !thresholds.warning[userGender] || !thresholds.danger[userGender]) {
      return 'unknown';
    }
    currentThresholds = {
      normal: thresholds.normal[userGender],
      warning: thresholds.warning[userGender],
      danger: thresholds.danger[userGender]
    };
  }

  // 安全检查currentThresholds结构
  if (!currentThresholds || !currentThresholds.normal || !currentThresholds.warning || !currentThresholds.danger) {
    return 'unknown';
  }

  // 判断状态
  if (metric.metric_type === METRIC_TYPES.BLOOD_PRESSURE) {
    const systolic = metric.systolic;
    const diastolic = metric.diastolic;
    
    // 安全检查血压阈值结构
    if (!currentThresholds.danger.systolic || !currentThresholds.danger.diastolic ||
        !currentThresholds.warning.systolic || !currentThresholds.warning.diastolic) {
      return 'unknown';
    }
    
    if (systolic >= currentThresholds.danger.systolic[0] || diastolic >= currentThresholds.danger.diastolic[0]) {
      return 'danger';
    }
    if (systolic >= currentThresholds.warning.systolic[0] || diastolic >= currentThresholds.warning.diastolic[0]) {
      return 'warning';
    }
    return 'normal';
  } else {
    // 单一数值指标
    const normalKeys = Object.keys(currentThresholds.normal);
    if (normalKeys.length === 0) return 'unknown';
    
    const field = normalKeys[0];
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) return 'unknown';
    
    // 安全检查字段存在
    if (!currentThresholds.danger[field] || !currentThresholds.warning[field] || !currentThresholds.normal[field]) {
      return 'unknown';
    }
    
    const [dangerMin, dangerMax] = currentThresholds.danger[field];
    const [warningMin, warningMax] = currentThresholds.warning[field];
    const [normalMin, normalMax] = currentThresholds.normal[field];
    
    if (numValue >= dangerMin && (dangerMax === 999 || numValue <= dangerMax)) {
      return 'danger';
    }
    if (numValue >= warningMin && numValue <= warningMax) {
      return 'warning';
    }
    return 'normal';
  }
};

// 获取状态颜色
export const getStatusColor = (status) => {
  switch (status) {
    case 'normal': return '#4CAF50';
    case 'warning': return '#FF9800';
    case 'danger': return '#F44336';
    default: return '#9E9E9E';
  }
};

// 获取状态文本
export const getStatusText = (status) => {
  switch (status) {
    case 'normal': return '正常';
    case 'warning': return '偏高';
    case 'danger': return '异常';
    default: return '未知';
  }
}; 