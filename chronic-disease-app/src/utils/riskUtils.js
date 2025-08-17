// 统一的风险评估与展示工具

// 基于疾病列表推断风险等级
export function inferRiskLevel(chronicDiseases) {
  if (chronicDiseases === null || chronicDiseases === undefined) return 'unassessed';
  if (Array.isArray(chronicDiseases) && chronicDiseases.length === 0) return 'healthy';
  if (!Array.isArray(chronicDiseases)) return 'unassessed';

  const highRiskDiseases = ['cancer', 'heart_disease', 'stroke', 'kidney_disease', 'liver_disease', 'sickle_cell', 'mood_disorder', 'narcolepsy'];
  const mediumRiskDiseases = ['diabetes', 'hypertension', 'copd', 'asthma', 'epilepsy', 'multiple_sclerosis', 'parkinson', 'alzheimer', 'dementia', 'hiv_aids'];

  const hasHighRisk = chronicDiseases.some(d => highRiskDiseases.includes(d));
  const hasMediumRisk = chronicDiseases.some(d => mediumRiskDiseases.includes(d));

  if (hasHighRisk) return 'high';
  if (hasMediumRisk) return 'medium';
  return 'low';
}

// 风险等级颜色
export function getRiskColor(level) {
  switch (level) {
    case 'high': return '#F44336';
    case 'medium': return '#FF9800';
    case 'low': return '#4CAF50';
    case 'healthy': return '#00E676';
    default: return '#9E9E9E'; // unassessed/unknown
  }
}

// 风险等级文本（可选 i18n）
export function getRiskText(level, t) {
  if (t) {
    switch (level) {
      case 'high': return t('common.highRisk') || '高风险';
      case 'medium': return t('common.mediumRisk') || '中风险';
      case 'low': return t('common.lowRisk') || '低风险';
      case 'healthy': return t('common.healthy') || '健康';
      default: return t('common.unassessed') || '未评估';
    }
  }
  switch (level) {
    case 'high': return '高风险';
    case 'medium': return '中风险';
    case 'low': return '低风险';
    case 'healthy': return '健康';
    default: return '未评估';
  }
}

// 根据患者对象提取风险等级（优先使用后端提供的 risk_level）
export function resolvePatientRiskLevel(patient) {
  if (!patient) return 'unassessed';
  // 为避免“同一人不同标签”，当有疾病列表时优先以疾病列表推断（来源单一）
  if (Array.isArray(patient.chronic_diseases) || patient.chronic_diseases === null) {
    return inferRiskLevel(patient.chronic_diseases);
  }
  // 否则回退后端给出的已有字段
  if (patient.risk_level) return patient.risk_level;
  return 'unassessed';
}


