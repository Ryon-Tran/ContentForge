import React, { useCallback, useEffect, useState } from 'react';
import { ViewType, WorkflowRow, VideoRow, AppConfig, ActivityLog } from './types';
import { Sidebar } from './layouts/Sidebar';
import { PipelineModule as PipelinePage } from './pages/PipelinePage';
import { VideoModule as VideoPage } from './pages/VideoPage';
import { ConfigModule as ConfigPage } from './pages/ConfigPage';
import { Dashboard } from './pages/Dashboard';
import { ActivityLogModule as ActivityLogPage } from './pages/ActivityLogPage';
import { QueueModule } from './components/QueueModule';
import { ServiceProvider } from './context/ServiceContext';
import { FlowService } from './services/FlowService';
import { I18nProvider } from './i18n/I18nContext';
import { API_BASE } from './config';

export type ThemeMode = 'light' | 'dark';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [productionItems, setProductionItems] = useState<WorkflowRow[]>([]);
  const [videoItems, setVideoItems] = useState<VideoRow[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityLog[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    defaultTextAI: '',
    defaultImageAI: '',
    defaultVideoAI: ''
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('tools-mmo-theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tools-mmo-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const loadDefaultAI = useCallback(async () => {
    try {
      const providers = await FlowService.config.listProviders();
      const defaultText = providers.find(p => p.type === 'TEXT' && p.isActive && p.isDefault);
      const defaultImage = providers.find(p => p.type === 'IMAGE' && p.isActive && p.isDefault);
      const defaultVideo = providers.find(p => p.type === 'VIDEO' && p.isActive && p.isDefault);

      setConfig({
        defaultTextAI: defaultText?.id || '',
        defaultImageAI: defaultImage?.id || '',
        defaultVideoAI: defaultVideo?.id || ''
      });
    } catch (e) {
      console.error('Không thể tải AI mặc định:', e);
    }
  }, []);

  const loadInitialData = async () => {
    try {
      const [prod, vid] = await Promise.all([
        FlowService.storage.loadRows('production'),
        FlowService.storage.loadRows('video')
      ]);
      setProductionItems(prod as WorkflowRow[]);
      setVideoItems(vid as VideoRow[]);
    } catch (e) {
      console.error('Lỗi tải dữ liệu lưu trữ:', e);
    }
  };

  useEffect(() => {
    loadDefaultAI();
    loadInitialData();
  }, [loadDefaultAI]);

  // Đồng bộ production -> video
  useEffect(() => {
    setVideoItems(prev => {
      return productionItems.map(p => {
        const existing = prev.find(v => v.id === p.id);
        if (existing) {
          return {
            ...existing,
            stt: p.stt,
            savePath: p.savePath || existing.savePath
          };
        }
        return {
          id: p.id,
          stt: p.stt,
          videoPrompt: '',
          videoVersions: [],
          currentVideoIndex: -1,
          status: 'IDLE',
          saveConfirmed: false,
          isDone: false,
          savePath: p.savePath || '',
          error: ''
        };
      });
    });
  }, [productionItems]);

  return (
    <I18nProvider>
      <ServiceProvider>
        <div className="app-shell">
          <Sidebar
            currentView={currentView}
            onViewChange={setCurrentView}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          <main className="app-main">
            {currentView === 'DASHBOARD' && (
              <Dashboard
                productionCount={productionItems.length}
                onNavigate={setCurrentView}
              />
            )}

            {currentView === 'QUEUE' && <QueueModule />}

            {currentView === 'PRODUCTION_PHOTO' && (
              <PipelinePage
                title="SẢN XUẤT ẢNH, CAPTION & GIỌNG ĐỌC"
                items={productionItems}
                setItems={setProductionItems}
                config={config}
              />
            )}

            {currentView === 'PRODUCTION_VIDEO' && (
              <VideoPage
                items={videoItems}
                setItems={setVideoItems}
                productionItems={productionItems}
                config={config}
              />
            )}

            {currentView === 'ACTIVITY_LOG' && (
              <ActivityLogPage items={activityItems} setItems={setActivityItems} />
            )}

            {currentView === 'CONFIG' && <ConfigPage />}
          </main>
        </div>
      </ServiceProvider>
    </I18nProvider>
  );
}
