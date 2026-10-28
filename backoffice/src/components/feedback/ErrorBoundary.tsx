import { Component, type ErrorInfo, type ReactNode } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 min-h-[300px]">
          <GlassCard className="p-8 max-w-md text-center flex flex-col items-center border-2 border-racing-500/40">
            <div className="w-14 h-14 rounded-2xl bg-racing-500/20 border-2 border-racing-500/40 flex items-center justify-center text-racing-scarlet mb-4 shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <p className="font-display font-black text-lg text-zinc-950 mb-1 uppercase tracking-tight">Drapeau Rouge — Erreur</p>
            <p className="text-xs text-zinc-600 mb-5 font-mono">
              {this.state.error?.message || 'Une exception est survenue'}
            </p>
            <GlassButton
              variant="primary"
              size="md"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => this.setState({ hasError: false })}
            >
              Relancer la session
            </GlassButton>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
