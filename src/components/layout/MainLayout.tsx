
"use client";

import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarContent, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar';
import SidebarNav from './SidebarNav';
import { Button } from '@/components/ui/button';
import { Menu, RotateCcw } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { cn } from "@/lib/utils";


const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);
  const { resetApp } = useAppContext();

  React.useEffect(() => setMounted(true), []);

  const handleResetApp = async () => {
    if (window.confirm("Tem certeza que deseja resetar todos os dados do aplicativo? Esta ação não pode ser desfeita.")) {
      await resetApp();
      window.location.href = '/initial-setup';
    }
  };

  if (!mounted) {
    return <div className="flex min-h-svh w-full items-center justify-center bg-transparent"><p>Carregando...</p></div>; // bg-transparent for gradient body
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar 
        collapsible="icon" 
        className={cn(
            // Sidebar itself should not have glass-surface here,
            // its inner div[data-sidebar="sidebar"] gets it in sidebar.tsx
        )}
      >
        <SidebarHeader className="p-4 flex items-center justify-between">
            <h1 className="font-headline text-2xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">BellaNote</h1>
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden hidden md:inline-flex" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-2 mt-auto">
           <Button
            variant="ghost"
            size="default" // Adjusted size for better fit with rounded-full
            className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
            onClick={handleResetApp}
            title="Resetar Aplicativo"
          >
            <RotateCcw className="text-destructive" />
            <span className="group-data-[collapsible=icon]:hidden text-destructive">
              Resetar App
            </span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className={cn(
            "md:hidden flex items-center justify-between p-3 sticky top-0 z-20 h-16", // Ensure height for content below
            "glass-surface" // App bar transparent (glassmorphic)
            )}>
          <h1 className="font-headline text-xl font-semibold text-primary text-center flex-grow">BellaNote</h1> {/* title_align: "center" */}
          <SidebarTrigger className="h-8 w-8 text-primary">
            <Menu className="h-5 w-5" /> {/* leading_icon: "chevron_left" (Menu is more standard for drawer) */}
          </SidebarTrigger>
        </div>
        <div className="p-4 md:p-6 min-h-[calc(100vh_-_theme(spacing.16))] md:min-h-screen"> {/* Adjust min-h if header height changes */}
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MainLayout;
