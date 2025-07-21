
import { lazy } from 'react';

// Lazy load all major route components for better performance
export const Dashboard = lazy(() => import('@/pages/Dashboard'));
export const Properties = lazy(() => import('@/pages/Properties'));
export const AddProperty = lazy(() => import('@/pages/AddProperty'));
export const AITools = lazy(() => import('@/pages/AITools'));
export const Analytics = lazy(() => import('@/pages/Analytics'));
export const Media = lazy(() => import('@/pages/Media'));
export const MediaExtractor = lazy(() => import('@/pages/MediaExtractor'));
export const ImportCSV = lazy(() => import('@/pages/ImportCSV'));
export const Duplicates = lazy(() => import('@/pages/Duplicates'));
export const ErrorMonitoring = lazy(() => import('@/pages/ErrorMonitoring'));
export const AccountSettings = lazy(() => import('@/pages/AccountSettings'));
export const Sync = lazy(() => import('@/pages/Sync'));
export const TranslationDashboard = lazy(() => import('@/pages/TranslationDashboard'));
export const AIOptimizationDashboard = lazy(() => import('@/pages/AIOptimizationDashboard'));
export const AdminDuplicates = lazy(() => import('@/pages/AdminDuplicates'));
export const AdminAISettings = lazy(() => import('@/pages/AdminAISettings'));
export const UpdatePassword = lazy(() => import('@/pages/UpdatePassword'));
export const DeepSourceDashboard = lazy(() => import('@/pages/DeepSourceDashboard'));
export const DeepSourceReports = lazy(() => import('@/pages/DeepSourceReports'));
export const RobustnessDemo = lazy(() => import('@/pages/RobustnessDemo'));
export const MappingTest = lazy(() => import('@/pages/MappingTest'));