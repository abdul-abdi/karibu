'use client';

import * as React from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

type ToastPropsWithHTMLAttrs = ToastProps & Omit<HTMLMotionProps<"div">, keyof ToastProps>;

export const Toast = React.forwardRef<
  HTMLDivElement,
  ToastPropsWithHTMLAttrs
>(({ className, id, title, description, action, type = 'info', duration = 5000, onClose, ...props }, ref) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50',
    error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'group pointer-events-auto relative flex w-full max-w-md items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-lg',
        bgColors[type],
        className
      )}
      ref={ref}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          {description && (
            <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{description}</div>
          )}
        </div>
      </div>

      {action && <div>{action}</div>}

      <button
        onClick={() => onClose(id)}
        className="absolute top-2 right-2 rounded-md p-1 text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <span className="sr-only">Close</span>
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
});
Toast.displayName = 'Toast';

// ToastContainer to render all toasts
export function ToastContainer({ 
  toasts, 
  onClose 
}: { 
  toasts: ToastProps[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 md:max-w-sm md:bottom-4 md:right-4">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
} 

// Enhanced error handler for user rejection scenarios
export const handleUserRejectionError = (error: any, toast: any, context?: string) => {
  const errorMessage = error?.message || error?.toString() || '';
  const errorCode = error?.code;
  
  // Check if this is a user rejection error
  const isUserRejection = checkIfUserRejection(error);
  
  if (!isUserRejection) {
    // Fall back to generic error handling
    handleGenericError(error, toast);
    return;
  }
  
  // Determine the specific type of rejection
  let title = 'Transaction Cancelled';
  let description = 'You cancelled the transaction in your wallet.';
  let icon = '🚫';
  
  if (errorMessage.includes('signature') || errorMessage.includes('sign')) {
    title = 'Signature Rejected';
    description = 'Transaction signature was rejected. You need to approve the transaction to proceed.';
    icon = '✍️';
  } else if (errorMessage.includes('connection') || errorMessage.includes('connect')) {
    title = 'Connection Rejected';
    description = 'Wallet connection was rejected. Please connect your wallet to continue.';
    icon = '🔗';
  } else if (errorMessage.includes('switch') || errorMessage.includes('network')) {
    title = 'Network Switch Rejected';
    description = 'Network switch was rejected. Please switch to the correct network manually.';
    icon = '🌐';
  }
  
  // Add context if provided
  if (context) {
    description = `${description} Context: ${context}`;
  }
  
  toast({
    title: `${icon} ${title}`,
    description,
    type: 'warning',
    duration: 5000,
    action: {
      label: 'Try Again',
      onClick: () => {
        // The parent component can handle retry logic
        console.log('User clicked retry after rejection');
      }
    }
  });
};

// Helper function to check if an error is a user rejection
const checkIfUserRejection = (error: any): boolean => {
  const errorMessage = error?.message || error?.toString() || '';
  const errorCode = error?.code;
  
  // Check for common user rejection patterns
  const rejectionPatterns = [
    'user rejected',
    'user denied',
    'user cancelled',
    'user canceled',
    'request rejected',
    'transaction was rejected',
    'signature was denied',
    'user declined',
    'cancelled by user',
    'canceled by user',
    'MetaMask Tx Signature: User denied',
    'User denied transaction signature',
    'request arguments: from:',
    'Details: MetaMask Tx Signature: User denied'
  ];
  
  const lowerMessage = errorMessage.toLowerCase();
  const hasRejectionPattern = rejectionPatterns.some(pattern => 
    lowerMessage.includes(pattern.toLowerCase())
  );
  
  // Check for specific error codes that indicate user rejection
  const rejectionCodes = [4001, -32603, 'ACTION_REJECTED', 'USER_REJECTED'];
  const hasRejectionCode = rejectionCodes.some(code => 
    errorCode === code || errorCode?.toString() === code?.toString()
  );
  
  return hasRejectionPattern || hasRejectionCode;
};

// Generic error handler for non-user-rejection errors
const handleGenericError = (error: any, toast: any) => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  toast({
    title: 'Error',
    description: errorMessage.length > 100 ? 
      `${errorMessage.substring(0, 100)}...` : 
      errorMessage,
    type: 'error',
    duration: 6000,
  });
};

// Enhanced contract error handler
export const handleContractError = (error: any, toast: any, context?: string) => {
  // First check if it's a user rejection
  if (checkIfUserRejection(error)) {
    handleUserRejectionError(error, toast, context);
    return;
  }
  
  const errorMessage = error?.message || error?.toString() || '';
  
  // Handle contract-specific errors
  if (errorMessage.includes('execution reverted')) {
    toast({
      title: '⚠️ Contract Execution Failed',
      description: 'The contract rejected the transaction. Please check your inputs and try again.',
      type: 'error',
      duration: 6000,
    });
  } else if (errorMessage.includes('insufficient funds')) {
    toast({
      title: '💰 Insufficient Balance',
      description: 'You don\'t have enough tokens to complete this transaction.',
      type: 'error',
      duration: 6000,
    });
  } else if (errorMessage.includes('gas')) {
    toast({
      title: '⛽ Gas Error',
      description: 'Transaction failed due to gas issues. Try increasing the gas limit.',
      type: 'error',
      duration: 6000,
    });
  } else if (errorMessage.includes('network')) {
    toast({
      title: '🌐 Network Error',
      description: 'Network connection failed. Please check your internet connection.',
      type: 'error',
      duration: 6000,
    });
  } else {
    // Fall back to generic error handling
    handleGenericError(error, toast);
  }
};

// WalletConnect specific error handler
export const handleWalletConnectError = (error: Error, toast: any) => {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('connection interrupted while trying to subscribe')) {
    toast({
      title: 'WalletConnect Connection Issue',
      description: 'Connection was interrupted. This may be due to network issues or invalid configuration. Please try again or check your wallet connection.',
      type: 'error',
      duration: 8000,
    });
    
    // Log additional info for debugging
    console.error('WalletConnect Connection Error Details:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      suggestions: [
        'Check if NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is set correctly',
        'Verify network connectivity',
        'Try refreshing the page',
        'Check if the wallet app is running properly'
      ]
    });
  } else if (errorMessage.includes('missing or invalid')) {
    toast({
      title: 'WalletConnect Configuration Error',
      description: 'Invalid Project ID detected. Please check your environment configuration.',
      type: 'error',
      duration: 8000,
    });
  } else if (errorMessage.includes('unsupported chain')) {
    toast({
      title: 'Unsupported Chain',
      description: 'The selected blockchain network is not supported by WalletConnect.',
      type: 'error',
      duration: 6000,
    });
  } else {
    // Generic WalletConnect error
    toast({
      title: 'Wallet Connection Failed',
      description: `Connection error: ${error.message}`,
      type: 'error',
      duration: 6000,
    });
  }
}; 