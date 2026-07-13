import { Fragment, type ReactNode } from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

function Dialog({ open, onClose, children, className }: DialogProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel
                className={cn(
                  'w-full max-w-lg transform rounded-2xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 p-6 shadow-xl transition-all',
                  className
                )}
              >
                {children}
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

interface DialogHeaderProps {
  title: string;
  description?: string;
  onClose?: () => void;
}

function DialogHeader({ title, description, onClose }: DialogHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <HeadlessDialog.Title className="text-lg font-semibold text-surface-900 dark:text-surface-50">
          {title}
        </HeadlessDialog.Title>
        {description && (
          <HeadlessDialog.Description className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {description}
          </HeadlessDialog.Description>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          aria-label="Close dialog"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

interface DialogFooterProps {
  children: ReactNode;
  className?: string;
}

function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-3 mt-6 pt-4 border-t border-surface-200 dark:border-surface-700', className)}>
      {children}
    </div>
  );
}

export { Dialog, DialogHeader, DialogFooter };
