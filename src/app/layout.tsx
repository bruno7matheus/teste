import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/contexts/AppContext';
import MainLayout from '@/components/layout/MainLayout';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'BellaNote Wedding Planner',
  description: 'Plan your dream wedding with BellaNote.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <AppProvider>
          <MainLayout>{children}</MainLayout>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
