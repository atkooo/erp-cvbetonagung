import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from './icons';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export class ErrorBoundaryClass extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || 'Terjadi kesalahan tidak terduga pada modul ini.';
      const isChunkError =
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('Importing a module script failed') ||
        errorMessage.includes('dynamically imported module');

      return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto my-8 bg-white rounded-xl border border-rose-200/80 shadow-md">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg flex-shrink-0">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <span className="inline-block px-2.5 py-0.5 mb-1.5 text-[11px] font-semibold tracking-wide uppercase bg-rose-100 text-rose-700 rounded-full">
                  {isChunkError ? 'Modul Gagal Dimuat' : 'Kesalahan Aplikasi'}
                </span>
                <h3 className="text-lg font-bold text-slate-800">
                  {isChunkError
                    ? 'Versi aplikasi telah diperbarui atau koneksi terputus'
                    : 'Gagal Menampilkan Halaman'}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {isChunkError
                    ? 'Halaman memerlukan pembaruan berkas dari server. Silakan muat ulang halaman untuk menggunakan versi terbaru.'
                    : 'Terjadi kesalahan saat memproses komponen ini.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={this.handleReload}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Muat Ulang Halaman
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  Kembali ke Dashboard
                </button>
              </div>

              {/* Error Detail Accordion */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-mono transition-colors cursor-pointer"
                >
                  <span>Detail Teknis Error</span>
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
                    <p className="font-semibold text-rose-400 mb-1">{this.state.error?.name}: {this.state.error?.message}</p>
                    {this.state.error?.stack && (
                      <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">{this.state.error.stack}</pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Route Error Element wrapper for React Router
 */
export function RouteErrorFallback() {
  const error = useRouteError();
  console.error('Route error caught:', error);

  let errorMessage = 'Terjadi kesalahan tidak terduga pada rute ini.';
  let stack = '';

  if (isRouteErrorResponse(error)) {
    errorMessage = `${error.status} ${error.statusText}: ${error.data || 'Halaman tidak ditemukan atau gagal dimuat'}`;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    stack = error.stack || '';
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  const isChunkError =
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('Importing a module script failed') ||
    errorMessage.includes('dynamically imported module');

  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto my-8 bg-white rounded-xl border border-rose-200/80 shadow-md font-sans">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-lg flex-shrink-0">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <span className="inline-block px-2.5 py-0.5 mb-1.5 text-[11px] font-semibold tracking-wide uppercase bg-rose-100 text-rose-700 rounded-full">
              {isChunkError ? 'Modul Gagal Dimuat' : 'Kesalahan Rute Navigasi'}
            </span>
            <h3 className="text-lg font-bold text-slate-800">
              {isChunkError ? 'Versi aplikasi telah diperbarui' : 'Terjadi Kesalahan Aplikasi'}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {isChunkError
                ? 'Sistem mendeteksi berkas modul aplikasi belum terperbarui di browser Anda. Silakan muat ulang halaman.'
                : 'Maaf, terjadi masalah saat memuat rute ini.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Muat Ulang Halaman
            </button>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Kembali ke Dashboard
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-mono transition-colors cursor-pointer"
            >
              <span>Detail Teknis Error</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showDetails && (
              <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
                <p className="font-semibold text-rose-400 mb-1">{errorMessage}</p>
                {stack && <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">{stack}</pre>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundaryClass;
