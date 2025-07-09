// 国家区号数据
export const COUNTRY_CODES = [
  {
    code: '+86',
    country: '中国',
    flag: '🇨🇳',
    phoneLength: 11,
    phoneRegex: /^1[3-9]\d{9}$/,
    placeholder: '请输入手机号码',
    example: '13800138000'
  },
  {
    code: '+1',
    country: '美国',
    flag: '🇺🇸',
    phoneLength: 10,
    phoneRegex: /^[2-9]\d{9}$/,
    placeholder: 'Enter phone number',
    example: '2025551234'
  },
  {
    code: '+1',
    country: '加拿大',
    flag: '🇨🇦',
    phoneLength: 10,
    phoneRegex: /^[2-9]\d{9}$/,
    placeholder: 'Enter phone number',
    example: '4165551234'
  },
  {
    code: '+44',
    country: '英国',
    flag: '🇬🇧',
    phoneLength: 10,
    phoneRegex: /^[1-9]\d{9}$/,
    placeholder: 'Enter phone number',
    example: '7700123456'
  },
  {
    code: '+33',
    country: '法国',
    flag: '🇫🇷',
    phoneLength: 9,
    phoneRegex: /^[1-9]\d{8}$/,
    placeholder: 'Entrez le numéro',
    example: '123456789'
  },
  {
    code: '+49',
    country: '德国',
    flag: '🇩🇪',
    phoneLength: 11,
    phoneRegex: /^[1-9]\d{10}$/,
    placeholder: 'Telefonnummer eingeben',
    example: '17012345678'
  },
  {
    code: '+81',
    country: '日本',
    flag: '🇯🇵',
    phoneLength: 11,
    phoneRegex: /^[7-9]\d{10}$/,
    placeholder: '電話番号を入力',
    example: '09012345678'
  },
  {
    code: '+82',
    country: '韩国',
    flag: '🇰🇷',
    phoneLength: 11,
    phoneRegex: /^[1-9]\d{10}$/,
    placeholder: '전화번호를 입력하세요',
    example: '01012345678'
  },
  {
    code: '+65',
    country: '新加坡',
    flag: '🇸🇬',
    phoneLength: 8,
    phoneRegex: /^[6-9]\d{7}$/,
    placeholder: 'Enter phone number',
    example: '81234567'
  },
  {
    code: '+60',
    country: '马来西亚',
    flag: '🇲🇾',
    phoneLength: 10,
    phoneRegex: /^[1-9]\d{9}$/,
    placeholder: 'Masukkan nombor telefon',
    example: '1234567890'
  },
  {
    code: '+66',
    country: '泰国',
    flag: '🇹🇭',
    phoneLength: 9,
    phoneRegex: /^[6-9]\d{8}$/,
    placeholder: 'ใส่หมายเลขโทรศัพท์',
    example: '812345678'
  },
  {
    code: '+91',
    country: '印度',
    flag: '🇮🇳',
    phoneLength: 10,
    phoneRegex: /^[6-9]\d{9}$/,
    placeholder: 'Enter phone number',
    example: '9876543210'
  },
  {
    code: '+61',
    country: '澳大利亚',
    flag: '🇦🇺',
    phoneLength: 9,
    phoneRegex: /^[4-5]\d{8}$/,
    placeholder: 'Enter phone number',
    example: '412345678'
  },
  {
    code: '+64',
    country: '新西兰',
    flag: '🇳🇿',
    phoneLength: 9,
    phoneRegex: /^[2-9]\d{8}$/,
    placeholder: 'Enter phone number',
    example: '212345678'
  },
  {
    code: '+55',
    country: '巴西',
    flag: '🇧🇷',
    phoneLength: 11,
    phoneRegex: /^[1-9]\d{10}$/,
    placeholder: 'Digite o número',
    example: '11987654321'
  },
  {
    code: '+7',
    country: '俄罗斯',
    flag: '🇷🇺',
    phoneLength: 10,
    phoneRegex: /^[9]\d{9}$/,
    placeholder: 'Введите номер',
    example: '9123456789'
  },
];

// 默认国家（中国）
export const DEFAULT_COUNTRY = COUNTRY_CODES[0];

// 根据区号查找国家信息
export const getCountryByCode = (code) => {
  return COUNTRY_CODES.find(country => country.code === code) || DEFAULT_COUNTRY;
};

// 验证手机号码
export const validatePhoneNumber = (phone, countryCode) => {
  const country = getCountryByCode(countryCode);
  if (!country) return false;
  
  // 检查长度
  if (phone.length !== country.phoneLength) {
    return false;
  }
  
  // 检查格式
  return country.phoneRegex.test(phone);
};

// 格式化手机号显示
export const formatPhoneDisplay = (phone, countryCode) => {
  const country = getCountryByCode(countryCode);
  if (!country || !phone) return '';
  
  return `${country.code} ${phone}`;
};

// 获取手机号验证错误消息
export const getPhoneValidationError = (phone, countryCode) => {
  const country = getCountryByCode(countryCode);
  if (!country) return '请选择有效的国家';
  
  if (!phone || phone.trim() === '') {
    return '请输入手机号码';
  }
  
  if (phone.length !== country.phoneLength) {
    return `手机号码应为${country.phoneLength}位数字`;
  }
  
  if (!country.phoneRegex.test(phone)) {
    return `请输入有效的${country.country}手机号码`;
  }
  
  return null;
}; 