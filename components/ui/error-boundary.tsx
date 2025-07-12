'use client';

import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ErrorService } from '@/app/utils/error-service';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const router = useRouter();
  
  // Parse the error to determine if it's a user rejection
  const parsedError = ErrorService.parseError(error);
  
  // Check if it's a user rejection error
  const isUserRejection = parsedError.code === 'USER_REJECTED_TRANSACTION' || 
                         parsedError.code === 'USER_REJECTED_CONNECTION' ||
                         parsedError.code === 'WALLET_REJECTED';

  if (isUserRejection) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🚫</span>
            Transaction Cancelled
          </CardTitle>
          <CardDescription>
            You cancelled the transaction in your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {parsedError.suggestion || 'To complete this action, please approve the transaction in your wallet.'}
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button onClick={resetErrorBoundary} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For other errors, show a generic error boundary
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Something went wrong
        </CardTitle>
        <CardDescription>
          An unexpected error occurred
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {parsedError.message || 'An unexpected error occurred. Please try again.'}
          </AlertDescription>
        </Alert>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">
              Error Details (Development)
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-all text-xs bg-muted p-2 rounded">
              {error.stack}
            </pre>
          </details>
        )}
        
        <div className="flex gap-2">
          <Button onClick={resetErrorBoundary} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface SmartErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function SmartErrorBoundary({ 
  children, 
  fallback, 
  onError 
}: SmartErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error details
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    // Call custom error handler if provided
    onError?.(error, errorInfo);
    
    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with services like Sentry, LogRocket, etc.
      // Example: Sentry.captureException(error);
    }
  };

  return (
    <ErrorBoundary
      FallbackComponent={fallback || ErrorFallback}
      onError={handleError}
      onReset={() => {
        // Clear any state if needed
        window.location.reload();
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Transaction-specific error boundary
export function TransactionErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <SmartErrorBoundary
      onError={(error) => {
        // Log transaction-specific errors
        console.error('Transaction error:', error);
      }}
    >
      {children}
    </SmartErrorBoundary>
  );
} 