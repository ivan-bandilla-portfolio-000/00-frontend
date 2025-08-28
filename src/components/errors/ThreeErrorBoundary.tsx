import React, { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ThreeErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Check if it's a Three.js/R3F specific error
        if (error.message.includes('R3F:') || error.message.includes('Canvas component')) {
            return { hasError: true, error };
        }
        return { hasError: false };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ThreeErrorBoundary caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <p className="text-gray-600 dark:text-gray-400">3D content temporarily unavailable</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ThreeErrorBoundary;