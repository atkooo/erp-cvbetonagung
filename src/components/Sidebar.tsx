/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, HardHat, LogOut } from '@/src/components/icons';
import { NAVIGATION_SECTIONS } from '../config/navigation';
import type { NavigationItem } from '../config/navigation';
import type { ViewType, AuthPermission } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  userRoleName: string;
  userRoleCode: string;
  userPermissions?: AuthPermission[];
}

const activeClass = 'bg-slate-800/80 border-l-2 border-slate-400 pl-2.5 text-white font-bold transition-all';
const inactiveClass = 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 transition-colors pl-3';

const isItemActive = (item: NavigationItem, currentView: ViewType) => {
  return item.view === currentView || Boolean(item.activeViews?.includes(currentView));
};

export default function Sidebar({ currentView, onViewChange, onLogout, userRoleName, userRoleCode, userPermissions }: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    NAVIGATION_SECTIONS.reduce<Record<string, boolean>>((acc, section) => {
      acc[section.id] = true;
      return acc;
    }, {})
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const hasAccessToModule = (requiredModule?: string) => {
    if (!requiredModule) return true; // public / global module
    if (userRoleCode === 'admin') return true; // Admin has full access fallback

    if (!userPermissions || userPermissions.length === 0) {
      return false; // No permissions loaded, deny access
    }

    // Check if the user has any permission for the required module
    return userPermissions.some(p => p.module === requiredModule || p.module === '*');
  };

  const renderNavItem = (item: NavigationItem) => {
    if (!hasAccessToModule(item.requiredModule)) {
      return null;
    }

    const Icon = item.icon;
    const active = isItemActive(item, currentView);

    return (
      <button
        key={item.view}
        onClick={() => onViewChange(item.view)}
        className={`w-full flex items-center gap-2 py-2 rounded text-xs text-left transition-all ${
          active ? activeClass : inactiveClass
        }`}
      >
        <Icon size={13} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="w-64 bg-slate-950 text-slate-100 h-screen flex flex-col border-r border-slate-900 shrink-0 select-none overflow-y-auto scrollbar-thin">
      <div className="p-5 border-b border-slate-900 bg-slate-950/60 sticky top-0 backdrop-blur-md z-10 flex items-center gap-3">
        <div className="bg-slate-800 border border-slate-700/50 p-2 rounded-lg text-white">
          <HardHat size={18} className="stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-sans font-bold tracking-tight text-white text-sm">CV Beton Agung</h1>
          <span className="text-[9px] uppercase tracking-widest font-mono text-slate-400 font-bold">Sistem Operasional</span>
        </div>
      </div>

      <div className="p-4 mx-3 my-3 bg-slate-900/40 rounded-xl border border-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
            {userRoleName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-200">Akun Aktif</p>
            <p className="text-[9px] font-mono text-slate-400 mt-0.5 bg-slate-800 border border-slate-700/40 rounded px-1.5 py-0.5 inline-block" title={`Role Code: ${userRoleCode}`}>
              {userRoleName}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Keluar dari Sistem"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>

      <div className="flex-1 px-3 space-y-1.5 pb-6">
        {NAVIGATION_SECTIONS.map((section) => {
          const isExpanded = expandedSections[section.id];
          
          // Pre-filter items to check if section has any visible items
          const visibleItems = section.items.filter(item => hasAccessToModule(item.requiredModule));
          
          if (visibleItems.length === 0) {
             return null;
          }

          return (
            <div key={section.id} className={section.separator ? 'pt-4 border-t border-slate-900/60 mt-4 space-y-1.5' : 'space-y-1'}>
              {section.title && (
                section.collapsible ? (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 mt-4 text-left"
                  >
                    <span>{section.title}</span>
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                ) : (
                  <p className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mt-4">
                    {section.title}
                  </p>
                )
              )}

              {(!section.collapsible || isExpanded) && (
                <div className={section.title ? 'pl-1 border-l border-slate-900 ml-2 mt-1' : 'space-y-1.5'}>
                  {visibleItems.map(renderNavItem)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-slate-950 border-t border-slate-900 text-center text-[9px] text-slate-600 font-mono">
        CV Beton Agung ERP
      </div>
    </div>
  );
}
