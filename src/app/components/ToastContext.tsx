'use client';

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { notification } from 'antd';
import type { NotificationPlacement } from 'antd/es/notification/interface';

type NotificationType = 'success' | 'info' | 'warning' | 'error';

interface ToastContextType {
  showToast: (
    type: NotificationType, 
    message: string, 
    description?: string, 
    duration?: number
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [api, contextHolder] = notification.useNotification();

  const showToast = useCallback((
    type: NotificationType, 
    message: string, 
    description = '', 
    duration = 4.5,
    placement: NotificationPlacement = 'topRight'
  ) => {
    api[type]({
      message,
      description,
      placement,
      duration,
      style: {
        borderRadius: '8px',
      },
    });
  }, [api]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {contextHolder}
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 