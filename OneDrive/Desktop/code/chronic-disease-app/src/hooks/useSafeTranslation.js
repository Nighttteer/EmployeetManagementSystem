import { useTranslation } from 'react-i18next';

/**
 * 安全的国际化Hook，防止t函数未定义的错误
 * 提供回退机制和错误处理
 */
export const useSafeTranslation = () => {
  const { t, i18n, ready } = useTranslation();

  // 安全的翻译函数
  const safeT = (key, options = {}) => {
    // 检查t函数是否可用
    if (!ready || typeof t !== 'function') {
      console.warn('⚠️ 国际化系统未准备就绪，使用默认值:', key);
      return getDefaultValue(key, options);
    }

    try {
      const result = t(key, options);
      // 如果返回的是键名本身，说明翻译失败
      if (result === key) {
        console.warn('⚠️ 翻译键未找到，使用默认值:', key);
        return getDefaultValue(key, options);
      }
      return result;
    } catch (error) {
      console.error('❌ 翻译函数调用失败:', error, 'key:', key);
      return getDefaultValue(key, options);
    }
  };

  // 获取默认值
  const getDefaultValue = (key, options = {}) => {
    // 根据键名提供智能默认值Smart Defaults
    const keyLower = key.toLowerCase();
    
    // 通用键值
    if (keyLower.includes('common.')) {
      if (keyLower.includes('phone')) return '手机';
      if (keyLower.includes('email')) return '邮箱';
      if (keyLower.includes('name')) return '姓名';
      if (keyLower.includes('age')) return '年龄';
      if (keyLower.includes('gender')) return '性别';
      if (keyLower.includes('male')) return '男';
      if (keyLower.includes('female')) return '女';
      if (keyLower.includes('yearsold')) return '岁';
      if (keyLower.includes('address')) return '地址';
      if (keyLower.includes('note')) return '备注';
      if (keyLower.includes('confirm')) return '确认';
      if (keyLower.includes('cancel')) return '取消';
      if (keyLower.includes('save')) return '保存';
      if (keyLower.includes('edit')) return '编辑';
      if (keyLower.includes('delete')) return '删除';
      if (keyLower.includes('back')) return '返回';
      if (keyLower.includes('next')) return '下一步';
      if (keyLower.includes('previous')) return '上一步';
      if (keyLower.includes('loading')) return '加载中...';
      if (keyLower.includes('error')) return '错误';
      if (keyLower.includes('success')) return '成功';
      if (keyLower.includes('warning')) return '警告';
      if (keyLower.includes('notice')) return '提示';
      if (keyLower.includes('unknown')) return '未知';
      if (keyLower.includes('nodata')) return '暂无数据';
      if (keyLower.includes('nodatacharts')) return '暂无图表数据';
      if (keyLower.includes('novaliddata')) return '暂无有效数据';
    }

    // 患者相关键值
    if (keyLower.includes('patients.')) {
      if (keyLower.includes('addpatient')) return '添加患者';
      if (keyLower.includes('searchpatientplaceholder')) return '搜索患者姓名或诊断';
      if (keyLower.includes('selectedpatients')) return '已选择患者';
      if (keyLower.includes('searchingpatients')) return '正在搜索患者...';
      if (keyLower.includes('nomatchingpatients')) return '没有匹配的患者';
      if (keyLower.includes('nounassignedpatients')) return '没有未分配的患者';
      if (keyLower.includes('tryothersearchcriteria')) return '请尝试其他搜索条件';
      if (keyLower.includes('allpatientsassigned')) return '所有患者都已分配医生';
      if (keyLower.includes('pleaseselectatleastonepatient')) return '请选择至少一个患者';
      if (keyLower.includes('successfullyaddedpatients')) return '成功添加患者';
      if (keyLower.includes('partialaddfailed')) return '部分添加失败';
      if (keyLower.includes('partialaddfailedmessage')) return '部分患者添加失败';
      if (keyLower.includes('addfailed')) return '添加失败';
      if (keyLower.includes('addpatienterror')) return '添加患者时发生错误';
      if (keyLower.includes('diseasestatus.healthy')) return '健康';
      if (keyLower.includes('diseasestatus.healthydescription')) return '患者无慢性疾病，身体健康';
      if (keyLower.includes('diseasestatus.unevaluated')) return '未评估';
      if (keyLower.includes('diseasestatus.unevaluateddescription')) return '患者疾病状态尚未评估';
      if (keyLower.includes('diseasecount')) return `${options?.count || 0}种慢性疾病`;
      if (keyLower.includes('diseasestatus.dataerror')) return '数据错误';
      if (keyLower.includes('contactinfo')) return '联系信息';
      if (keyLower.includes('phonenumber')) return '电话号码';
      if (keyLower.includes('emergencycontact')) return '紧急联系人';
      if (keyLower.includes('diseaserecord')) return '疾病记录';
      if (keyLower.includes('followup')) return '随访';
      if (keyLower.includes('examination')) return '检查';
      if (keyLower.includes('doctor')) return '医生';
      if (keyLower.includes('noadvice')) return '暂无建议';
      if (keyLower.includes('addadvice')) return '新增建议';
      if (keyLower.includes('advicetype')) return '建议类型';
      if (keyLower.includes('saveadvicefailed')) return '保存建议失败';
      if (keyLower.includes('deleteadviceconfirm')) return '确认删除该建议吗？';
      if (keyLower.includes('deleteadvicefailed')) return '删除建议失败';
    }

    // 健康相关键值
    if (keyLower.includes('health.')) {
      if (keyLower.includes('high')) return '高';
      if (keyLower.includes('normal')) return '正常';
      if (keyLower.includes('normalhigh')) return '正常偏高';
      if (keyLower.includes('abnormal')) return '异常';
      if (keyLower.includes('height')) return '身高';
      if (keyLower.includes('weight')) return '体重';
      if (keyLower.includes('bloodpressure')) return '血压';
      if (keyLower.includes('bloodglucose')) return '血糖';
      if (keyLower.includes('heartrate')) return '心率';
      if (keyLower.includes('bloodpressuretrend')) return '血压趋势';
      if (keyLower.includes('bloodglucosetrend')) return '血糖趋势';
      if (keyLower.includes('heartratetrend')) return '心率趋势';
      if (keyLower.includes('systolicbp')) return '收缩压';
      if (keyLower.includes('diastolicbp')) return '舒张压';
      if (keyLower.includes('lifestyle')) return '生活方式';
      if (keyLower.includes('healthsummary')) return '健康摘要';
      if (keyLower.includes('totalrecords')) return '总记录数';
      if (keyLower.includes('charts')) return '图表';
      if (keyLower.includes('nodataforcharts')) return '暂无图表数据';
      if (keyLower.includes('trend.improving')) return '改善';
      if (keyLower.includes('trend.stable')) return '稳定';
      if (keyLower.includes('trend.worsening')) return '恶化';
    }

    // 用药相关键值
    if (keyLower.includes('medication.')) {
      if (keyLower.includes('frequency.oncedaily')) return '每日一次';
      if (keyLower.includes('frequency.twicedaily')) return '每日两次';
      if (keyLower.includes('frequency.threetimesdaily')) return '每日三次';
      if (keyLower.includes('frequency.fourtimesdaily')) return '每日四次';
      if (keyLower.includes('frequency.every12hours')) return '每12小时一次';
      if (keyLower.includes('frequency.every8hours')) return '每8小时一次';
      if (keyLower.includes('frequency.every6hours')) return '每6小时一次';
      if (keyLower.includes('frequency.asneeded')) return '按需服用';
      if (keyLower.includes('notset')) return '未设置';
      if (keyLower.includes('active')) return '进行中';
      if (keyLower.includes('paused')) return '暂停';
      if (keyLower.includes('stopped')) return '已停止';
      if (keyLower.includes('completed')) return '已完成';
      if (keyLower.includes('unknownmedicine')) return '未知药物';
      if (keyLower.includes('startdate')) return '开始日期';
      if (keyLower.includes('compliance')) return '依从性';
      if (keyLower.includes('addmedicationplan')) return '添加用药计划';
      if (keyLower.includes('nomedicationplans')) return '暂无用药计划';
      if (keyLower.includes('contactdoctorforplan')) return '请联系医生制定用药计划';
      if (keyLower.includes('medication')) return '用药';
    }

    // 医生相关键值
    if (keyLower.includes('doctor.')) {
      if (keyLower.includes('diseasedistribution')) return '疾病分布';
      if (keyLower.includes('generatereport')) return '生成报告';
    }

    // 屏幕相关键值
    if (keyLower.includes('screen.')) {
      if (keyLower.includes('overview')) return '概览';
      if (keyLower.includes('healthdata')) return '健康数据';
      if (keyLower.includes('medicationinfo')) return '用药信息';
      if (keyLower.includes('medicalhistory')) return '病史记录';
      if (keyLower.includes('loadingpatientdata')) return '正在加载患者数据...';
      if (keyLower.includes('patientdetails')) return '患者详情';
    }

    // 告警相关键值
    if (keyLower.includes('alerts.')) {
      if (keyLower.includes('cardcontent.')) return '告警内容';
    }

    // 欢迎页面键值
    if (keyLower.includes('welcome.')) {
      if (keyLower.includes('apptitle')) return '慢性疾病管理系统';
    }

    // 如果都没有匹配，返回键名的最后一部分
    const keyParts = key.split('.');
    return keyParts[keyParts.length - 1] || key;
  };

  // 确保ready状态正确反映国际化系统的状态
  const isReady = ready && typeof t === 'function' && i18n.isInitialized;

  return {
    t: safeT,
    i18n,
    ready: isReady,
    safeT
  };
};
