import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

class ReportService {
  // 生成患者健康报告
  async generatePatientReport(patientData, t) {
    try {
      // 获取当前日期
      const currentDate = new Date().toLocaleDateString();
      
      // 生成报告内容
      const reportContent = this.buildReportContent(patientData, currentDate, t);
      
      // 创建文件名
      const fileName = `${patientData.basicInfo.name}_健康报告_${currentDate.replace(/\//g, '-')}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // 写入文件
      await FileSystem.writeAsStringAsync(fileUri, reportContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      return { fileUri, fileName, content: reportContent };
    } catch (error) {
      console.error('生成报告失败:', error);
      throw new Error(t('report.generateReportFailed'));
    }
  }

  // 构建报告内容
  buildReportContent(patientData, date, t) {
    const { basicInfo, healthMetrics, medications, medicalHistory } = patientData;
    
    let content = '';
    
    // 报告标题
    content += `${t('report.patientHealthReport')}\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    // 生成日期
    content += `${t('report.generatedDate')}: ${date}\n`;
    content += `${t('report.generatedBy')}: ${t('report.systemName')}\n\n`;
    
    // 患者基本信息
    content += `${t('screen.basicInfo')}\n`;
    content += `${'-'.repeat(30)}\n`;
    content += `${t('common.name')}: ${basicInfo.name}\n`;
    content += `${t('common.age')}: ${basicInfo.age}${t('common.yearsOld')}\n`;
    content += `${t('auth.gender')}: ${basicInfo.gender === 'male' ? t('common.male') : t('common.female')}\n`;
    content += `${t('auth.phone')}: ${basicInfo.phone}\n`;
    content += `${t('screen.bloodType')}: ${basicInfo.bloodType || t('common.unknown')}\n`;
    content += `${t('health.height')}: ${basicInfo.height}cm\n`;
    content += `${t('health.weight')}: ${basicInfo.weight}kg\n\n`;
    
    // 紧急联系人
    content += `${t('screen.emergencyContact')}\n`;
    content += `${'-'.repeat(30)}\n`;
    content += `${t('screen.emergencyContactName')}: ${basicInfo.emergencyContact}\n`;
    content += `${t('screen.emergencyContactPhone')}: ${basicInfo.emergencyPhone}\n\n`;
    
    // 慢性疾病
    if (basicInfo.diseases && basicInfo.diseases.length > 0) {
      content += `${t('screen.chronicDiseases')}\n`;
      content += `${'-'.repeat(30)}\n`;
      basicInfo.diseases.forEach(diseaseId => {
        const diseaseName = this.getDiseaseName(diseaseId, t);
        content += `• ${diseaseName}\n`;
      });
      content += '\n';
    }
    
    // 最新健康数据
    content += `${t('screen.latestHealthData')}\n`;
    content += `${'-'.repeat(30)}\n`;
    if (healthMetrics?.latest?.bloodPressure) {
      const bp = healthMetrics.latest.bloodPressure;
      content += `${t('health.bloodPressure')}: ${bp.systolic}/${bp.diastolic} mmHg (${bp.time})\n`;
    }
    if (healthMetrics?.latest?.bloodGlucose) {
      const bg = healthMetrics.latest.bloodGlucose;
      content += `${t('health.bloodGlucose')}: ${bg.value} mmol/L (${bg.time})\n`;
    }
    if (healthMetrics?.latest?.heartRate) {
      const hr = healthMetrics.latest.heartRate;
      content += `${t('health.heartRate')}: ${hr.value} bpm (${hr.time})\n`;
    }
    if (healthMetrics?.latest?.weight) {
      const wt = healthMetrics.latest.weight;
      content += `${t('health.weight')}: ${wt.value} kg (${wt.time})\n`;
    }
    content += '\n';
    
    // 风险评估
    content += `${t('report.riskAssessment')}\n`;
    content += `${'-'.repeat(30)}\n`;
    const riskLevel = this.getRiskLevelText(basicInfo.riskLevel, t);
    content += `${t('report.currentRiskLevel')}: ${riskLevel}\n\n`;
    
    // 用药信息
    if (medications && medications.length > 0) {
      content += `${t('report.medicationHistory')}\n`;
      content += `${'-'.repeat(30)}\n`;
      medications.forEach(medication => {
        content += `• ${medication.name}\n`;
        content += `  ${t('medication.dosage')}: ${medication.dosage}\n`;
        content += `  ${t('auth.frequency')}: ${medication.frequency}\n`;
        content += `  ${t('medication.startDate')}: ${medication.startDate}\n`;
        content += `  ${t('common.status')}: ${medication.status === 'active' ? t('medication.active') : t('medication.stopped')}\n`;
        content += `  ${t('medication.compliance')}: ${medication.compliance}%\n\n`;
      });
    } else {
      content += `${t('report.medicationHistory')}\n`;
      content += `${'-'.repeat(30)}\n`;
      content += `${t('report.noMedicationHistory')}\n\n`;
    }
    
    // 健康建议
    content += `${t('report.recommendations')}\n`;
    content += `${'-'.repeat(30)}\n`;
    const recommendations = this.generateHealthRecommendations(patientData, t);
    recommendations.forEach(recommendation => {
      content += `• ${recommendation}\n`;
    });
    content += '\n';
    
    // 免责声明
    content += `${t('report.disclaimer')}\n\n`;
    
    // 报告结束
    content += `${t('report.reportFooter')}\n`;
    content += `${'='.repeat(50)}\n`;
    
    return content;
  }

  // 获取疾病名称
  getDiseaseName(diseaseId, t) {
    const diseaseMap = {
      'alzheimer': t('diseases.alzheimer'),
      'arthritis': t('diseases.arthritis'),
      'asthma': t('diseases.asthma'),
      'cancer': t('diseases.cancer'),
      'copd': t('diseases.copd'),
      'crohn': t('diseases.crohn'),
      'cystic_fibrosis': t('diseases.cysticFibrosis'),
      'dementia': t('diseases.dementia'),
      'diabetes': t('diseases.diabetes'),
      'endometriosis': t('diseases.endometriosis'),
      'epilepsy': t('diseases.epilepsy'),
      'fibromyalgia': t('diseases.fibromyalgia'),
      'heart_disease': t('diseases.heartDisease'),
      'hypertension': t('diseases.hypertension'),
      'hiv_aids': t('diseases.hivAids'),
      'migraine': t('diseases.migraine'),
      'mood_disorder': t('diseases.moodDisorder'),
      'multiple_sclerosis': t('diseases.multipleSclerosis'),
      'narcolepsy': t('diseases.narcolepsy'),
      'parkinson': t('diseases.parkinson'),
      'sickle_cell': t('diseases.sickleCell'),
      'ulcerative_colitis': t('diseases.ulcerativeColitis')
    };
    return diseaseMap[diseaseId] || diseaseId;
  }

  // 获取风险等级文本
  getRiskLevelText(riskLevel, t) {
    switch (riskLevel) {
      case 'low':
        return t('report.lowRisk');
      case 'medium':
        return t('report.mediumRisk');
      case 'high':
        return t('report.highRisk');
      default:
        return t('report.unknownRisk');
    }
  }

  // 生成健康建议
  generateHealthRecommendations(patientData, t) {
    const recommendations = [];
    const { basicInfo, healthMetrics, medications } = patientData;
    
    // 根据疾病类型给出建议
    if (basicInfo.diseases?.includes('diabetes')) {
      recommendations.push(t('report.diabetesAdvice'));
    }
    
    if (basicInfo.diseases?.includes('hypertension')) {
      recommendations.push(t('report.hypertensionAdvice'));
    }
    
    // 根据健康数据给出建议
    if (healthMetrics?.latest?.bloodPressure) {
      const systolic = healthMetrics.latest.bloodPressure.systolic;
      if (systolic > 140) {
        recommendations.push(t('report.highBloodPressureAdvice'));
      }
    }
    
    if (healthMetrics?.latest?.bloodGlucose) {
      const glucose = healthMetrics.latest.bloodGlucose.value;
      if (glucose > 7.0) {
        recommendations.push(t('report.highBloodGlucoseAdvice'));
      }
    }
    
    // 根据用药依从性给出建议
    if (medications && medications.length > 0) {
      const lowComplianceMeds = medications.filter(med => med.compliance < 80);
      if (lowComplianceMeds.length > 0) {
        recommendations.push(t('report.medicationComplianceAdvice'));
      }
    }
    
    // 如果没有特殊建议，给出通用建议
    if (recommendations.length === 0) {
      recommendations.push(t('report.noSpecificRecommendations'));
    }
    
    return recommendations;
  }

  // 分享报告
  async shareReport(fileUri, t) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: t('report.shareReport'),
        });
        return true;
      } else {
        throw new Error('Sharing not available');
      }
    } catch (error) {
      console.error('分享报告失败:', error);
      throw new Error(t('report.exportFailed'));
    }
  }

  // 生成并导出报告 - 这是主要的导出方法
  async generateAndExportReport(patientData, t, exportType = 'share') {
    try {
      console.log('开始生成报告...', patientData);
      
      // 生成报告
      const { fileUri, fileName } = await this.generatePatientReport(patientData, t);
      
      if (exportType === 'share') {
        // 分享报告
        await this.shareReport(fileUri, t);
        Alert.alert(t('common.success'), t('report.reportShared'));
      }
      
      return { success: true, fileUri, fileName };
    } catch (error) {
      console.error('导出报告失败:', error);
      Alert.alert(t('common.error'), error.message || t('report.generateReportFailed'));
      return { success: false, error: error.message };
    }
  }
}

// 创建实例并导出
const reportService = new ReportService();

// 确保导出是正确的
export { reportService };
export default reportService;