import React from 'react';
import { ViewType } from '../types';
import type { ThemeMode } from '../App';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  currentView: ViewType;
  onViewChange: (v: ViewType) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentView,
  onViewChange,
  theme,
  onToggleTheme
}) => {
  const { language, setLanguage, languages, t } = useI18n();

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
    const active = currentView === id;

    return (
      <button
        type="button"
        onClick={() => onViewChange(id)}
        className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 mb-1 text-left transition-all ${
          active
            ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-bold shadow-sm'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-soft)] hover:text-[var(--text-main)] font-medium'
        } ${indent ? 'pl-8' : ''}`}
      >
        <span className={`material-symbols-outlined text-[18px] ${active ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
          {icon}
        </span>
        <span className="text-[12.5px] tracking-wide flex-1 truncate">{label}</span>
      </button>
    );
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="px-3.5 pt-4 pb-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--text-muted)]">
      {children}
    </div>
  );

  return (
    <aside className="w-60 min-w-60 h-screen flex flex-col shrink-0 z-40 border-r border-[var(--border)] bg-[var(--bg-app)]">
      {/* BRAND */}
      <div className="h-[68px] px-4 flex items-center gap-3 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--primary-gradient)] text-white shadow-sm">
          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-[13.5px] tracking-tight text-[var(--text-main)] truncate">
            Tools-MMO Studio
          </div>
          <div className="text-[10.5px] font-medium text-[var(--text-muted)]">
            AI Content Forge v2.5
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        <NavItem id="DASHBOARD" icon="dashboard" label={t('sidebar.dashboard', 'Tổng Quan')} />

        <SectionTitle>{t('sidebar.production', 'Sản Xuất Đa Phương Thức')}</SectionTitle>
        <NavItem
          id="PRODUCTION_PHOTO"
          icon="photo_library"
          label={t('sidebar.imageCaption', 'Ảnh, Caption & TTS')}
          indent
        />
        <NavItem
          id="PRODUCTION_VIDEO"
          icon="movie"
          label={t('sidebar.videoPipeline', 'Video Pipeline')}
          indent
        />

        <SectionTitle>{t('sidebar.system', 'Hệ Thống')}</SectionTitle>
        <NavItem id="QUEUE" icon="queue" label={t('sidebar.queue', 'Hàng Đợi Xử Lý')} />
        <NavItem id="ACTIVITY_LOG" icon="history" label={t('sidebar.activityLog', 'Lịch Sử Hoạt Động')} />
        <NavItem id="CONFIG" icon="settings" label={t('sidebar.config', 'Cấu Hình AI')} />
      </nav>

      {/* BOTTOM CONTROLS */}
      <div className="p-3 border-t border-[var(--border)] space-y-2">
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-full h-9 px-3 rounded-xl border border-[var(--border)] flex items-center gap-2.5 text-left bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-soft)] transition-colors text-[12px] font-medium"
        >
          <span className="material-symbols-outlined text-[17px]">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
          <span>{theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}</span>
        </button>
      </div>
    </aside>
  );
};