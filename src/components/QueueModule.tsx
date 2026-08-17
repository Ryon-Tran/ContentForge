import React from 'react';

export const QueueModule: React.FC = () => {
  return (
    <div className="h-full bg-[#0a0a0a] flex flex-col">
      <div className="p-4 border-b border-white/5 bg-[#111]">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em]">HỆ THỐNG &gt; HÀNG ĐỢI</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center opacity-20 space-y-4">
        <span className="material-symbols-outlined text-8xl animate-spin-slow">sync</span>
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-widest">Hàng đợi đang rỗng</p>
          <p className="text-[10px] mt-2">Mọi tác vụ đã được xử lý xong.</p>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
      `}</style>
    </div>
  );
};