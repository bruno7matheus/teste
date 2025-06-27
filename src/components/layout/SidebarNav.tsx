
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { LayoutDashboard, Settings, DollarSign, Briefcase, Users, ListChecks, Gift, CheckSquare, ShoppingBag, HeartHandshake, CalendarCheck, MailQuestion } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, requiresSetup: false },
  { href: '/initial-setup', label: 'Config. Inicial', icon: Settings, requiresSetup: false },
  { href: '/budget', label: 'Financeiro', icon: DollarSign, requiresSetup: true },
  { href: '/vendors', label: 'Fornecedores', icon: Briefcase, requiresSetup: true },
  { href: '/guests', label: 'Convidados', icon: Users, requiresSetup: true },
  { href: '/tasks', label: 'Tarefas', icon: ListChecks, requiresSetup: true },
  { href: '/gifts', label: 'Presentes', icon: Gift, requiresSetup: true },
];

const SidebarNav: React.FC = () => {
  const pathname = usePathname();
  const { appData, loading } = useAppContext();

  const isSetupComplete = !loading && appData && appData.weddingDate && appData.budget.total > 0;

  return (
    <SidebarMenu className="p-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const disabled = item.requiresSetup && !isSetupComplete && item.href !== '/initial-setup';

        return (
          <SidebarMenuItem key={item.label}>
            <Link href={disabled ? '#' : item.href} passHref legacyBehavior>
              <SidebarMenuButton
                isActive={isActive}
                disabled={disabled}
                aria-disabled={disabled}
                className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
                tooltip={{ children: item.label, hidden: disabled && item.href !== '/initial-setup' }}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
};

export default SidebarNav;
