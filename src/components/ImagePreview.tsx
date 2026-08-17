import React from 'react';

interface Props {
  image: { url: string; title: string } | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<Props> = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative max-w-full max-h-full flex flex-col items-center animate-zoomIn">
        <div className="absolute -top-12 left-0 right-0 flex justify-between items-center text-white/60">
           <span className="text-xs font-black uppercase tracking-widest">{image.title}</span>
           <button onClick={onClose} className="p-2 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-3xl">close</span>
           </button>
        </div>
        
        <img 
          src={image.url} 
          className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl border border-white/10 object-contain" 
          alt="Preview"
        />
        
        <div className="mt-6 flex gap-4">
           <button onClick={() => {
             const link = document.createElement('a');
             link.href = image.url;
             link.download = `preview_${Date.now()}.png`;
             link.click();
           }} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
             TẢI XUỐNG ẢNH
           </button>
        </div>
      </div>

      <style>{`
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-zoomIn { animation: zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};