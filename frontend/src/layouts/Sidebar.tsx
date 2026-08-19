import React from 'react';

import {
  ViewType
} from '../types';

import type {
  ThemeMode
} from '../App';

import {
  useI18n
} from '../i18n/I18nContext';


interface Props {
  currentView: ViewType;

  onViewChange: (
    v: ViewType
  ) => void;

  theme: ThemeMode;

  onToggleTheme: () => void;
}


export const Sidebar:
  React.FC<Props> = ({
    currentView,
    onViewChange,
    theme,
    onToggleTheme
  }) => {

  const {
    language,
    setLanguage,
    languages,
    t
  } = useI18n();


  // =========================================================
  // NAV ITEM
  // =========================================================

  const NavItem = ({
    id,
    icon,
    label,
    indent = false
  }: {
    id: ViewType;
    icon: string;
    label: string;
    indent?: boolean;
  }) => {

    const active =
      currentView === id;


    return (

      <button
        type="button"

        onClick={() =>
          onViewChange(id)
        }

        className={`
          w-full
          flex
          items-center
          gap-3
          rounded-xl
          px-4
          py-3
          mb-1
          text-left
          border
          transition-all

          ${
            active
              ? 'bg-blue-50 border-blue-200 shadow-sm'
              : 'border-transparent'
          }

          ${
            indent
              ? 'pl-9'
              : ''
          }
        `}

        style={{
          background:
            active
              ? undefined
              : 'transparent',

          color:
            active
              ? '#2563eb'
              : 'var(--text-secondary)'
        }}
      >

        <span
          className="
            material-symbols-outlined
            text-[19px]
          "

          style={{
            color:
              active
                ? '#2563eb'
                : 'var(--text-muted)'
          }}
        >
          {icon}
        </span>


        <span
          className={`
            text-[12px]
            tracking-wide

            ${
              active
                ? 'font-bold'
                : 'font-semibold'
            }
          `}
        >
          {label}
        </span>

      </button>

    );

  };


  // =========================================================
  // SECTION TITLE
  // =========================================================

  const SectionTitle = ({
    children
  }: {
    children:
      React.ReactNode;
  }) => (

    <div
      className="
        px-4
        pt-5
        pb-2
        text-[10px]
        font-bold
        uppercase
        tracking-[0.16em]
      "

      style={{
        color:
          'var(--text-muted)'
      }}
    >
      {children}
    </div>

  );


  // =========================================================
  // UI
  // =========================================================

  return (

    <aside
      className="
        w-64
        min-w-64
        h-screen
        flex
        flex-col
        shrink-0
        z-50
        border-r
      "

      style={{
        background:
          'var(--bg-card)',

        borderColor:
          'var(--border)'
      }}
    >


      {/* =====================================================
          BRAND
      ====================================================== */}

      <div
        className="
          h-[74px]
          px-5
          flex
          items-center
          gap-3
          border-b
        "

        style={{
          borderColor:
            'var(--border)'
        }}
      >

        <div
          className="
            w-10
            h-10
            bg-blue-600
            rounded-xl
            flex
            items-center
            justify-center
            shadow-sm
          "
        >

          <span
            className="
              material-symbols-outlined
              text-white
              text-[22px]
            "
          >
            factory
          </span>

        </div>


        <div className="min-w-0">

          <div
            className="
              font-bold
              text-[14px]
              tracking-tight
            "

            style={{
              color:
                'var(--text-main)'
            }}
          >
            Factory AI Ent.
          </div>


          <div
            className="
              text-[10px]
              font-medium
              mt-0.5
            "

            style={{
              color:
                'var(--text-muted)'
            }}
          >
            Tools-MMO Local
          </div>

        </div>

      </div>


      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <nav
        className="
          flex-1
          overflow-y-auto
          px-3
          py-3
        "
      >

        {/* DASHBOARD */}

        <NavItem
          id="DASHBOARD"
          icon="dashboard"

          label={t(
            'sidebar.dashboard',
            'Tổng Quan'
          )}
        />


        {/* =================================================
            PRODUCTION
        ================================================== */}

        <SectionTitle>
          {t(
            'sidebar.production',
            'Sản Xuất'
          )}
        </SectionTitle>


        <NavItem
          id="PRODUCTION_PHOTO"
          icon="photo_library"

          label={t(
            'sidebar.imageCaption',
            'Ảnh & Caption'
          )}

          indent
        />


        <NavItem
          id="PRODUCTION_VIDEO"
          icon="movie"

          label={t(
            'sidebar.videoPipeline',
            'Video'
          )}

          indent
        />


        {/* =================================================
            NEWS / LÀM BÁO
        ================================================== */}

        <SectionTitle>
          {t(
            'sidebar.news',
            'Làm Báo'
          )}
        </SectionTitle>


        <NavItem
          id="NEWS_PHOTO"
          icon="article"

          label={t(
            'sidebar.imageCaption',
            'Ảnh & Caption'
          )}

          indent
        />


        {/* =================================================
            SYSTEM
        ================================================== */}

        <SectionTitle>
          {t(
            'sidebar.system',
            'Hệ Thống'
          )}
        </SectionTitle>


        <NavItem
          id="ACTIVITY_LOG"
          icon="history"

          label={t(
            'sidebar.activityLog',
            'Lịch Sử Hoạt Động'
          )}
        />


        <NavItem
          id="CONFIG"
          icon="settings"

          label={t(
            'sidebar.config',
            'Cấu Hình'
          )}
        />

      </nav>


      {/* =====================================================
          BOTTOM SETTINGS
      ====================================================== */}

      <div
        className="
          p-3
          border-t
          space-y-2
        "

        style={{
          background:
            'var(--bg-soft)',

          borderColor:
            'var(--border)'
        }}
      >


        {/* =================================================
            LANGUAGE
        ================================================== */}

        <div
          className="
            w-full
            h-11
            px-3
            rounded-xl
            border
            flex
            items-center
            gap-2
          "

          style={{
            background:
              'var(--bg-card)',

            borderColor:
              'var(--border)',

            color:
              'var(--text-main)'
          }}
        >

          <span
            className="
              material-symbols-outlined
              text-[18px]
            "
          >
            language
          </span>


          <select
            value={
              language
            }

            onChange={
              e => {

                setLanguage(
                  e.currentTarget.value as typeof language
                );

              }
            }

            className="
              flex-1
              min-w-0
              bg-transparent
              border-0
              outline-none
              text-[11px]
              font-semibold
              cursor-pointer
            "

            style={{
              color:
                'var(--text-main)'
            }}
          >

            {
              languages.map(
                item => (

                  <option
                    key={
                      item.code
                    }

                    value={
                      item.code
                    }
                  >
                    {item.label}
                  </option>

                )
              )
            }

          </select>

        </div>


        {/* =================================================
            THEME
        ================================================== */}

        <button
          type="button"

          onClick={
            onToggleTheme
          }

          className="
            w-full
            h-11
            px-3
            rounded-xl
            border
            flex
            items-center
            gap-3
            text-left
          "

          style={{
            background:
              'var(--bg-card)',

            borderColor:
              'var(--border)',

            color:
              'var(--text-main)'
          }}
        >

          <span
            className="
              material-symbols-outlined
              text-[19px]
            "
          >
            {
              theme === 'light'
                ? 'dark_mode'
                : 'light_mode'
            }
          </span>


          <span
            className="
              text-[12px]
              font-semibold
            "
          >
            {
              theme === 'light'
                ? t(
                    'common.darkMode',
                    'Chế độ tối'
                  )

                : t(
                    'common.lightMode',
                    'Chế độ sáng'
                  )
            }
          </span>

        </button>

      </div>

    </aside>

  );

};