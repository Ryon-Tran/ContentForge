import React, {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  ViewType,
  WorkflowRow,
  VideoRow,
  AppConfig,
  ActivityLog
} from './types';

import {
  Sidebar
} from './layouts/Sidebar';

import {
  PipelineModule as PipelinePage
} from './pages/PipelinePage';

import {
  VideoModule as VideoPage
} from './pages/VideoPage';

import {
  ConfigModule as ConfigPage
} from './pages/ConfigPage';

import {
  Dashboard
} from './pages/Dashboard';

import {
  ActivityLogModule as ActivityLogPage
} from './pages/ActivityLogPage';

import {
  QueueModule
} from './components/QueueModule';

import {
  ServiceProvider
} from './context/ServiceContext';

import { FlowService } from './services/FlowService';

import {
  I18nProvider
} from './i18n/I18nContext';


const API_BASE =
  'http://127.0.0.1:8000';


export type ThemeMode =
  | 'light'
  | 'dark';


interface AIProviderFromAPI {
  id: string;

  name: string;

  provider: string;

  type:
    | 'TEXT'
    | 'IMAGE'
    | 'VIDEO';

  model: string;

  baseUrl: string;

  apiKeyMasked?: string;

  isActive: boolean;

  isDefault: boolean;

  createdAt: number;
}


export default function App() {

  // =========================================================
  // VIEW
  // =========================================================

  const [
    currentView,
    setCurrentView
  ] =
    useState<ViewType>(
      'PRODUCTION_PHOTO'
    );


  // =========================================================
  // PRODUCTION DATA
  // =========================================================

  const [
    productionItems,
    setProductionItems
  ] =
    useState<WorkflowRow[]>(
      []
    );


  // =========================================================
  // VIDEO DATA
  // =========================================================

  const [
    videoItems,
    setVideoItems
  ] =
    useState<VideoRow[]>(
      []
    );


  // =========================================================
  // NEWS / LÀM BÁO DATA
  // =========================================================

  const [
    newsItems,
    setNewsItems
  ] =
    useState<WorkflowRow[]>(
      []
    );


  // =========================================================
  // ACTIVITY LOG DATA
  // =========================================================

  const [
    activityItems,
    setActivityItems
  ] =
    useState<ActivityLog[]>(
      []
    );


  // =========================================================
  // AI CONFIG
  // =========================================================

  const [
    config,
    setConfig
  ] =
    useState<AppConfig>({
      defaultTextAI:
        '',

      defaultImageAI:
        '',

      defaultVideoAI:
        ''
    });


  // =========================================================
  // LOAD DEFAULT AI
  // =========================================================

  const loadDefaultAI =
    useCallback(
      async () => {

        try {

          const response =
            await fetch(
              `${API_BASE}/api/config/ai-providers`
            );


          if (
            !response.ok
          ) {

            throw new Error(
              `Không tải được AI Provider. HTTP ${response.status}`
            );

          }


          const data:
            {
              providers?:
                AIProviderFromAPI[];
            } =
            await response.json();


          const providers =
            Array.isArray(
              data.providers
            )
              ? data.providers
              : [];


          const defaultText =
            providers.find(
              provider =>
                provider.type ===
                  'TEXT' &&

                provider.isActive ===
                  true &&

                provider.isDefault ===
                  true
            );


          const defaultImage =
            providers.find(
              provider =>
                provider.type ===
                  'IMAGE' &&

                provider.isActive ===
                  true &&

                provider.isDefault ===
                  true
            );


          const defaultVideo =
            providers.find(
              provider =>
                provider.type ===
                  'VIDEO' &&

                provider.isActive ===
                  true &&

                provider.isDefault ===
                  true
            );


          setConfig({
            defaultTextAI:
              defaultText?.id ||
              '',

            defaultImageAI:
              defaultImage?.id ||
              '',

            defaultVideoAI:
              defaultVideo?.id ||
              ''
          });


          console.log(
            'AI mặc định:',
            {
              TEXT:
                defaultText
                  ? {
                      id:
                        defaultText.id,

                      name:
                        defaultText.name,

                      provider:
                        defaultText.provider,

                      model:
                        defaultText.model
                    }
                  : null,

              IMAGE:
                defaultImage
                  ? {
                      id:
                        defaultImage.id,

                      name:
                        defaultImage.name,

                      provider:
                        defaultImage.provider,

                      model:
                        defaultImage.model
                    }
                  : null,

              VIDEO:
                defaultVideo
                  ? {
                      id:
                        defaultVideo.id,

                      name:
                        defaultVideo.name,

                      provider:
                        defaultVideo.provider,

                      model:
                        defaultVideo.model
                    }
                  : null
            }
          );

        } catch (
          error
        ) {

          console.error(
            'Không thể tải AI mặc định:',
            error
          );


          setConfig({
            defaultTextAI:
              '',

            defaultImageAI:
              '',

            defaultVideoAI:
              ''
          });

        }

      },
      []
    );


  // =========================================================
  // LOAD ACTIVITY LOG
  // =========================================================

  const loadActivityLogs =
    useCallback(
      async () => {

        try {

          const response =
            await fetch(
              `${API_BASE}/api/activity`
            );


          if (
            !response.ok
          ) {

            throw new Error(
              `Không tải được Lịch Sử Hoạt Động. HTTP ${response.status}`
            );

          }


          const data:
            {
              activities?:
                ActivityLog[];
            } =
            await response.json();


          const activities =
            Array.isArray(
              data.activities
            )
              ? data.activities
              : [];


          /*
            Backend đã trả newest trước.
            Nhưng vẫn sort lại để đảm bảo.
          */
          activities.sort(
            (
              a,
              b
            ) =>
              (
                b.createdAt ||
                0
              ) -
              (
                a.createdAt ||
                0
              )
          );


          setActivityItems(
            activities
          );

        } catch (
          error
        ) {

          console.error(
            'Không thể tải Lịch Sử Hoạt Động:',
            error
          );

        }

      },
      []
    );


  // =========================================================
  // LOAD WHEN APP STARTS
  // =========================================================

  useEffect(
    () => {

      loadDefaultAI();

      loadActivityLogs();

    },
    [
      loadDefaultAI,
      loadActivityLogs
    ]
  );


  // =========================================================
  // RELOAD AI DEFAULT WHEN RETURNING TO WORK MODULES
  // =========================================================

  useEffect(
    () => {

      if (
        currentView ===
          'PRODUCTION_PHOTO' ||

        currentView ===
          'PRODUCTION_VIDEO' ||

        currentView ===
          'NEWS_PHOTO'
      ) {

        loadDefaultAI();

      }

    },
    [
      currentView,
      loadDefaultAI
    ]
  );


  // =========================================================
  // RELOAD ACTIVITY WHEN OPENING ACTIVITY LOG
  // =========================================================

  useEffect(
    () => {

      if (
        currentView ===
        'ACTIVITY_LOG'
      ) {

        /*
          Mỗi lần người dùng mở
          LỊCH SỬ HOẠT ĐỘNG,
          tải bản mới nhất từ SQLite.
        */
        loadActivityLogs();

      }

    },
    [
      currentView,
      loadActivityLogs
    ]
  );


  // =========================================================
  // THEME
  // =========================================================

  const [
    theme,
    setTheme
  ] =
    useState<ThemeMode>(
      () => {

        const saved =
          localStorage.getItem(
            'tools-mmo-theme'
          );


        if (
          saved ===
            'light' ||

          saved ===
            'dark'
        ) {

          return saved;

        }


        return 'light';

      }
    );


  useEffect(
    () => {

      document
        .documentElement
        .setAttribute(
          'data-theme',
          theme
        );


      localStorage.setItem(
        'tools-mmo-theme',
        theme
      );

    },
    [
      theme
    ]
  );


  const toggleTheme =
    () => {

      setTheme(
        prev =>
          prev ===
            'light'
            ? 'dark'
            : 'light'
      );

    };


  // =========================================================
  // LOAD DATA ON START
  // =========================================================

  useEffect(() => {
    // Tải dữ liệu từ DB
    const initData = async () => {
      try {
        const prod = await FlowService.storage.loadRows('production');
        setProductionItems(prod as WorkflowRow[]);

        const news = await FlowService.storage.loadRows('news');
        setNewsItems(news as WorkflowRow[]);

        const vid = await FlowService.storage.loadRows('video');
        setVideoItems(vid as VideoRow[]);
      } catch (e) {
        console.error('Lỗi tải dữ liệu', e);
      }
    };
    initData();
  }, []);


  // =========================================================
  // SYNC PRODUCTION -> VIDEO
  // =========================================================
  //
  // CHỈ productionItems được đưa sang VIDEO.
  //
  // newsItems / LÀM BÁO độc lập hoàn toàn.
  //
  // =========================================================

  useEffect(
    () => {

      setVideoItems(
        prev => {

          return productionItems.map(
            productionRow => {

              const existing =
                prev.find(
                  videoRow =>
                    videoRow.id ===
                    productionRow.id
                );


              if (
                existing
              ) {

                return {
                  ...existing,

                  /*
                    STT video luôn đi theo Production.
                  */
                  stt:
                    productionRow.stt,

                  /*
                    Production có thư mục lưu
                    thì Video kế thừa.
                  */
                  savePath:
                    productionRow.savePath ||
                    existing.savePath
                };

              }


              /*
                Tạo VideoRow mới tương ứng
                với ProductionRow.
              */
              return {
                id:
                  productionRow.id,

                stt:
                  productionRow.stt,

                videoPrompt:
                  '',

                videoVersions:
                  [],

                currentVideoIndex:
                  -1,

                status:
                  'IDLE',

                saveConfirmed:
                  false,

                isDone:
                  false,

                savePath:
                  productionRow.savePath ||
                  '',

                error:
                  ''
              };

            }
          );

        }
      );

    },
    [
      productionItems
    ]
  );


  // =========================================================
  // UI
  // =========================================================

  return (

    <I18nProvider>

      <ServiceProvider>

        <div className="app-shell">


          {/* =================================================
              SIDEBAR
          ================================================== */}

          <Sidebar
            currentView={
              currentView
            }

            onViewChange={
              setCurrentView
            }

            theme={
              theme
            }

            onToggleTheme={
              toggleTheme
            }
          />


          <main className="app-main">


            {/* =================================================
                DASHBOARD
            ================================================== */}

            {
              currentView ===
                'DASHBOARD' && (

                <Dashboard
                  productionCount={
                    productionItems.length
                  }

                  newsCount={
                    newsItems.length
                  }
                />

              )
            }


            {/* =================================================
                QUEUE
            ================================================== */}

            {
              currentView ===
                'QUEUE' && (

                <QueueModule />

              )
            }


            {/* =================================================
                PRODUCTION IMAGE + CAPTION
            ================================================== */}

            {
              currentView ===
                'PRODUCTION_PHOTO' && (

                <PipelinePage
                  title="SẢN XUẤT > ẢNH & CAPTION"

                  items={
                    productionItems
                  }

                  setItems={
                    setProductionItems
                  }

                  config={
                    config
                  }
                />

              )
            }


            {/* =================================================
                PRODUCTION VIDEO
            ================================================== */}

            {
              currentView ===
                'PRODUCTION_VIDEO' && (

                <VideoPage
                  sourceItems={
                    productionItems
                  }

                  videoItems={
                    videoItems
                  }

                  setVideoItems={
                    setVideoItems
                  }

                  config={
                    config
                  }
                />

              )
            }


            {/* =================================================
                NEWS / LÀM BÁO
            ================================================== */}

            {
              currentView ===
                'NEWS_PHOTO' && (

                <PipelinePage
                  title="LÀM BÁO > ẢNH & CAPTION"

                  items={
                    newsItems
                  }

                  setItems={
                    setNewsItems
                  }

                  config={
                    config
                  }

                  isNews
                />

              )
            }


            {/* =================================================
                ACTIVITY LOG
            ================================================== */}

            {
              currentView ===
                'ACTIVITY_LOG' && (

                <ActivityLogPage
                  items={
                    activityItems
                  }

                  setItems={
                    setActivityItems
                  }
                />

              )
            }


            {/* =================================================
                CONFIG
            ================================================== */}

            {
              currentView ===
                'CONFIG' && (

                <ConfigPage />

              )
            }


          </main>

        </div>

      </ServiceProvider>

    </I18nProvider>

  );

}