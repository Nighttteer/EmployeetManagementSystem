/**
 * helpers工具函数测试
 * 遵循AAA模式：Arrange（准备）、Act（执行）、Assert（断言）
 * 一个测试只验证一个功能点
 */

// 模拟工具函数
const formatDate = (date, format = 'YYYY-MM-DD') => {
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
    default:
      return d.toLocaleDateString('zh-CN');
  }
};

const validators = {
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
  
  // 验证密码强度
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

const validateHealthData = {
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

const formatters = {
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

const getStatusColor = (status) => {
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

describe('helpers工具函数测试', () => {
  
  describe('formatDate 日期格式化函数', () => {
    it('应该格式化为YYYY-MM-DD格式', () => {
      // Arrange（准备）
      const testDate = new Date('2024-01-15T10:30:00');
      
      // Act（执行）
      const result = formatDate(testDate, 'YYYY-MM-DD');
      
      // Assert（断言）
      expect(result).toBe('2024-01-15');
    });

    it('应该格式化为MM-DD格式', () => {
      // Arrange（准备）
      const testDate = new Date('2024-01-15T10:30:00');
      
      // Act（执行）
      const result = formatDate(testDate, 'MM-DD');
      
      // Assert（断言）
      expect(result).toBe('01-15');
    });

    it('应该格式化为YYYY-MM-DD HH:mm格式', () => {
      // Arrange（准备）
      const testDate = new Date('2024-01-15T10:30:00');
      
      // Act（执行）
      const result = formatDate(testDate, 'YYYY-MM-DD HH:mm');
      
      // Assert（断言）
      expect(result).toBe('2024-01-15 10:30');
    });

    it('应该格式化为HH:mm格式', () => {
      // Arrange（准备）
      const testDate = new Date('2024-01-15T10:30:00');
      
      // Act（执行）
      const result = formatDate(testDate, 'HH:mm');
      
      // Assert（断言）
      expect(result).toBe('10:30');
    });

    it('应该处理空值输入', () => {
      // Arrange（准备）
      const testDate = null;
      
      // Act（执行）
      const result = formatDate(testDate);
      
      // Assert（断言）
      expect(result).toBe('');
    });

    it('应该使用默认格式', () => {
      // Arrange（准备）
      const testDate = new Date('2024-01-15T10:30:00');
      
      // Act（执行）
      const result = formatDate(testDate);
      
      // Assert（断言）
      expect(result).toBe('2024-01-15');
    });
  });

  describe('validators 验证器函数', () => {
    describe('phone 手机号验证', () => {
      it('应该验证有效的手机号', () => {
        // Arrange（准备）
        const validPhone = '13800138000';
        
        // Act（执行）
        const result = validators.phone(validPhone);
        
        // Assert（断言）
        expect(result).toBe(true);
      });

      it('应该拒绝无效的手机号', () => {
        // Arrange（准备）
        const invalidPhone = '12345678901';
        
        // Act（执行）
        const result = validators.phone(invalidPhone);
        
        // Assert（断言）
        expect(result).toBe(false);
      });

      it('应该拒绝空字符串', () => {
        // Arrange（准备）
        const emptyPhone = '';
        
        // Act（执行）
        const result = validators.phone(emptyPhone);
        
        // Assert（断言）
        expect(result).toBe(false);
      });
    });

    describe('email 邮箱验证', () => {
      it('应该验证有效的邮箱', () => {
        // Arrange（准备）
        const validEmail = 'test@example.com';
        
        // Act（执行）
        const result = validators.email(validEmail);
        
        // Assert（断言）
        expect(result).toBe(true);
      });

      it('应该拒绝无效的邮箱', () => {
        // Arrange（准备）
        const invalidEmail = 'invalid-email';
        
        // Act（执行）
        const result = validators.email(invalidEmail);
        
        // Assert（断言）
        expect(result).toBe(false);
      });
    });

    describe('password 密码验证', () => {
      it('应该验证有效的密码', () => {
        // Arrange（准备）
        const validPassword = 'Password123';
        
        // Act（执行）
        const result = validators.password(validPassword);
        
        // Assert（断言）
        expect(result).toBe(true);
      });

      it('应该拒绝过短的密码', () => {
        // Arrange（准备）
        const shortPassword = 'Pass1';
        
        // Act（执行）
        const result = validators.password(shortPassword);
        
        // Assert（断言）
        expect(result).toBe(false);
      });

      it('应该拒绝没有字母的密码', () => {
        // Arrange（准备）
        const noLetterPassword = '12345678';
        
        // Act（执行）
        const result = validators.password(noLetterPassword);
        
        // Assert（断言）
        expect(result).toBe(false);
      });
    });
  });

  describe('validateHealthData 健康数据验证', () => {
    describe('bloodPressure 血压验证', () => {
      it('应该验证有效的血压值', () => {
        // Arrange（准备）
        const systolic = 120;
        const diastolic = 80;
        
        // Act（执行）
        const result = validateHealthData.bloodPressure(systolic, diastolic);
        
        // Assert（断言）
        expect(result.valid).toBe(true);
      });

      it('应该拒绝收缩压过高', () => {
        // Arrange（准备）
        const systolic = 300;
        const diastolic = 80;
        
        // Act（执行）
        const result = validateHealthData.bloodPressure(systolic, diastolic);
        
        // Assert（断言）
        expect(result.valid).toBe(false);
        expect(result.message).toContain('收缩压应在60-250之间');
      });

      it('应该拒绝舒张压过低', () => {
        // Arrange（准备）
        const systolic = 120;
        const diastolic = 30;
        
        // Act（执行）
        const result = validateHealthData.bloodPressure(systolic, diastolic);
        
        // Assert（断言）
        expect(result.valid).toBe(false);
        expect(result.message).toContain('舒张压应在40-150之间');
      });

      it('应该拒绝收缩压小于舒张压', () => {
        // Arrange（准备）
        const systolic = 80;
        const diastolic = 120;
        
        // Act（执行）
        const result = validateHealthData.bloodPressure(systolic, diastolic);
        
        // Assert（断言）
        expect(result.valid).toBe(false);
        expect(result.message).toContain('收缩压应大于舒张压');
      });
    });

    describe('bloodSugar 血糖验证', () => {
      it('应该验证有效的血糖值', () => {
        // Arrange（准备）
        const value = 5.5;
        
        // Act（执行）
        const result = validateHealthData.bloodSugar(value);
        
        // Assert（断言）
        expect(result.valid).toBe(true);
      });

      it('应该拒绝过高的血糖值', () => {
        // Arrange（准备）
        const value = 35.0;
        
        // Act（执行）
        const result = validateHealthData.bloodSugar(value);
        
        // Assert（断言）
        expect(result.valid).toBe(false);
        expect(result.message).toContain('血糖值应在1.0-30.0之间');
      });
    });

    describe('weight 体重验证', () => {
      it('应该验证有效的体重值', () => {
        // Arrange（准备）
        const value = 70.5;
        
        // Act（执行）
        const result = validateHealthData.weight(value);
        
        // Assert（断言）
        expect(result.valid).toBe(true);
      });

      it('应该拒绝过轻的体重', () => {
        // Arrange（准备）
        const value = 15.0;
        
        // Act（执行）
        const result = validateHealthData.weight(value);
        
        // Assert（断言）
        expect(result.valid).toBe(false);
        expect(result.message).toContain('体重应在20-300kg之间');
      });
    });
  });

  describe('formatters 格式化函数', () => {
    describe('bloodPressure 血压格式化', () => {
      it('应该格式化有效的血压值', () => {
        // Arrange（准备）
        const systolic = 120;
        const diastolic = 80;
        
        // Act（执行）
        const result = formatters.bloodPressure(systolic, diastolic);
        
        // Assert（断言）
        expect(result).toBe('120/80');
      });

      it('应该处理缺失的血压值', () => {
        // Arrange（准备）
        const systolic = null;
        const diastolic = 80;
        
        // Act（执行）
        const result = formatters.bloodPressure(systolic, diastolic);
        
        // Assert（断言）
        expect(result).toBe('--/--');
      });
    });

    describe('bloodSugar 血糖格式化', () => {
      it('应该格式化有效的血糖值', () => {
        // Arrange（准备）
        const value = 5.5;
        
        // Act（执行）
        const result = formatters.bloodSugar(value);
        
        // Assert（断言）
        expect(result).toBe('5.5 mmol/L');
      });

      it('应该处理缺失的血糖值', () => {
        // Arrange（准备）
        const value = null;
        
        // Act（执行）
        const result = formatters.bloodSugar(value);
        
        // Assert（断言）
        expect(result).toBe('-- mmol/L');
      });

      it('应该支持自定义单位', () => {
        // Arrange（准备）
        const value = 5.5;
        const customUnit = 'mg/dL';
        
        // Act（执行）
        const result = formatters.bloodSugar(value, customUnit);
        
        // Assert（断言）
        expect(result).toBe('5.5 mg/dL');
      });
    });
  });

  describe('getStatusColor 状态颜色函数', () => {
    it('应该返回良好状态的绿色', () => {
      // Arrange（准备）
      const status = 'good';
      
      // Act（执行）
      const result = getStatusColor(status);
      
      // Assert（断言）
      expect(result).toBe('#2ecc71');
    });

    it('应该返回注意状态的橙色', () => {
      // Arrange（准备）
      const status = 'attention';
      
      // Act（执行）
      const result = getStatusColor(status);
      
      // Assert（断言）
      expect(result).toBe('#f39c12');
    });

    it('应该返回风险状态的红色', () => {
      // Arrange（准备）
      const status = 'risk';
      
      // Act（执行）
      const result = getStatusColor(status);
      
      // Assert（断言）
      expect(result).toBe('#e74c3c');
    });

    it('应该返回未知状态的灰色', () => {
      // Arrange（准备）
      const status = 'unknown';
      
      // Act（执行）
      const result = getStatusColor(status);
      
      // Assert（断言）
      expect(result).toBe('#95a5a6');
    });
  });
});
