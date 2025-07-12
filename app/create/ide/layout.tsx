import { ToastProvider } from '@/components/providers/toast-provider';
import { FileSystemProvider } from '@/components/providers/file-system-provider';

export default function IDELayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-screen overflow-hidden">
      <ToastProvider>
        <FileSystemProvider>
          {children}
        </FileSystemProvider>
      </ToastProvider>
    </div>
  );
} 