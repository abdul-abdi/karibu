import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Construction } from 'lucide-react';

interface ConstructionBannerProps {
  message?: string;
  showIcon?: boolean;
  variant?: 'warning' | 'info' | 'secondary';
  className?: string;
}

export const ConstructionBanner: React.FC<ConstructionBannerProps> = ({
  message = "This section is still under construction",
  showIcon = true,
  variant = 'warning',
  className = ''
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200';
      case 'secondary':
        return 'bg-muted/50 border-muted-foreground/20 text-muted-foreground';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`w-full border-2 rounded-lg p-4 mb-6 ${getVariantStyles()} ${className}`}
    >
      <div className="flex items-center justify-center gap-3">
        {showIcon && (
          <div className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            <AlertTriangle className="h-4 w-4" />
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-current text-current">
            Under Construction
          </Badge>
          <span className="text-sm font-medium">
            {message}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ConstructionBanner; 