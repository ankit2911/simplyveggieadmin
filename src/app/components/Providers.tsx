'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { AdminProvider } from '../context/AdminContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AdminProvider>
            <Toaster position="top-right" richColors />
            {children}
        </AdminProvider>
    );
}
