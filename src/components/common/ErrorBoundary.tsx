import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorState } from './StateViews';

interface Props {
  children: ReactNode;
  /** Hiện chi tiết kỹ thuật (chỉ nên bật khi chạy local) */
  showDetail?: boolean;
}

interface State {
  error: Error | null;
}

/**
 * Bắt lỗi render để một lỗi nhỏ không làm trắng cả trang giữa tiết học.
 * Thông báo hiển thị bằng tiếng Việt, không phải stack trace.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[CodeQuest] Lỗi render:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-[60vh] grid place-items-center">
        <ErrorState
          title="Trang này gặp trục trặc"
          description={
            <>
              Đừng lo, tiến trình của em vẫn được giữ. Em thử tải lại trang nhé.
              {this.props.showDetail && (
                <span className="block mt-2 font-mono text-xs text-slate-500">
                  {error.message}
                </span>
              )}
            </>
          }
          onRetry={this.handleReset}
        />
      </div>
    );
  }
}
