import React from 'react';

interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  actions,
  children
}) => {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      {/* Header Fixed */}
      <header className="flex-none h-[60px] px-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-10">
        <div>
          <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-[12px] text-slate-500 mt-0.5">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {actions}
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
