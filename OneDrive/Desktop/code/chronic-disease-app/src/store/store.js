/**
 * Redux Store 主配置文件
 * 
 * 这是整个应用的状态管理核心，负责：
 * - 整合所有功能模块的状态切片（slices）
 * - 配置Redux中间件和序列化检查
 * - 提供统一的状态访问入口
 * - 管理应用的整体状态树
 * 
 * 使用 @reduxjs/toolkit 简化Redux配置，提供更好的开发体验
 */
import { configureStore } from '@reduxjs/toolkit';

// 导入各个功能模块的状态切片
import authSlice from './slices/authSlice';           // 认证状态管理
import userSlice from './slices/userSlice';           // 用户信息管理
import patientsSlice from './slices/patientsSlice';   // 患者数据管理
import alertsSlice from './slices/alertsSlice';       // 告警状态管理
import medicationSlice from './slices/medicationSlice'; // 用药计划管理
import languageSlice from './slices/languageSlice';   // 多语言状态管理

/**
 * 创建并配置Redux Store
 * 
 * 整合所有状态切片，构建完整的状态树
 * 配置中间件和序列化检查规则
 */
export const store = configureStore({
  // 状态切片配置 - 每个slice管理一个功能模块的状态
  reducer: {
    auth: authSlice,           // 认证相关状态（登录状态、用户角色、token等）
    user: userSlice,           // 用户信息状态（个人资料、健康数据、设置等）
    patients: patientsSlice,   // 患者管理状态（患者列表、详情、关系等）
    alerts: alertsSlice,       // 告警管理状态（告警列表、处理状态、统计等）
    medication: medicationSlice, // 用药管理状态（用药计划、提醒、历史等）
    language: languageSlice,   // 多语言状态（当前语言、支持语言等）
  },
  
  // 中间件配置 - 自定义Redux中间件行为
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // 序列化检查配置 - 防止非序列化数据进入store
      serializableCheck: {
        // 忽略特定的action类型（如持久化相关的action）
        ignoredActions: ['persist/PERSIST'],
        
        // 提供更详细的错误信息以便调试
        // 当序列化检查失败时，在32个警告后才显示错误
        warnAfter: 32,
        
        // 忽略特定路径的序列化检查
        // meta.arg: 异步thunk的参数（可能包含函数等非序列化数据）
        // payload.timestamp: 时间戳数据（Date对象等）
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
      },
    }),
});

// ============================================================================
// TypeScript类型导出（可选）
// ============================================================================

// 为TypeScript用户提供类型支持
// 可以取消注释以启用类型检查
// export type RootState = ReturnType<typeof store.getState>;    // 根状态类型
// export type AppDispatch = typeof store.dispatch;              // 分发函数类型 