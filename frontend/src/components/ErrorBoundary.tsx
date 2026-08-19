import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-10 bg-[#0e0e0e] text-white">
          <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[32px] max-w-md w-full space-y-6 text-center">
            <span className="material-symbols-outlined text-red-500 text-6xl">bug_report</span>
            <div className="space-y-2">
              <h2 className="text-xl font-bold uppercase tracking-tight">Đã xảy ra lỗi hệ thống</h2>
              <p className="text-sm text-white/40 leading-relaxed">
                {this.props.fallbackTitle || "Module này gặp sự cố không mong muốn."}
              </p>
            </div>
            {this.state.error && (
              <div className="p-4 bg-black/40 rounded-xl text-left border border-white/5 overflow-hidden">
                <p className="text-[10px] font-mono text-red-400 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full py-3 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:scale-105"
            >
              THỬ TẢI LẠI MODULE
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}