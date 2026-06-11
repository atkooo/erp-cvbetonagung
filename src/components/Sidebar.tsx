import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, HardHat, LogOut } from '@/src/components/icons';
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

const isItemActive = (item: NavigationItem, currentView: ViewType) => {
  return item.view === currentView || Boolean(item.activeViews?.includes(currentView));
};

export default function Sidebar({ currentView, onViewChange, onLogout, userRoleName, userRoleCode, userPermissions }: SidebarProps) {
  const [isPinned, setIsPinned] = useState(true);
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

  const hasAccessToModule = (requiredModule?: string, itemView?: string) => {
    if (userRoleCode === 'admin') return true; 
    
    if (userRoleCode === 'employee') {
      if (itemView === 'dashboard') return false;
      if (!requiredModule) return true;
      return requiredModule === 'employees';
    }

    if (!requiredModule) return true; 
    
    if (!userPermissions || userPermissions.length === 0) {
      return false; 
    }

    return userPermissions.some(p => p.module === requiredModule || p.module === '*');
  };

  const renderNavItem = (item: NavigationItem) => {
    if (!hasAccessToModule(item.requiredModule, item.view)) {
      return null;
    }

    const Icon = item.icon;
    const active = isItemActive(item, currentView);

    const activeClass = isPinned 
      ? 'bg-slate-800/80 border-l-2 border-slate-400 pl-2.5 text-white font-bold transition-all'
      : 'bg-slate-800/80 text-white font-bold justify-center rounded-lg';
      
    const inactiveClass = isPinned 
      ? 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 transition-colors pl-3'
      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 transition-colors justify-center rounded-lg';

    return (
      <button
        key={item.view}
        onClick={() => onViewChange(item.view)}
        title={!isPinned ? item.label : undefined}
        className={`w-full flex items-center py-2 text-xs transition-all ${
          active ? activeClass : inactiveClass
        } ${isPinned ? 'gap-2 text-left rounded' : ''}`}
      >
        <Icon size={isPinned ? 13 : 16} />
        {isPinned && <span>{item.label}</span>}
      </button>
    );
  };

  return (
    <div className={`${isPinned ? 'w-64' : 'w-[72px]'} bg-slate-950 text-slate-100 h-screen flex flex-col border-r border-slate-900 shrink-0 select-none overflow-y-auto scrollbar-thin transition-all duration-300`}>
      <div className={`p-4 border-b border-slate-900 bg-slate-950/60 sticky top-0 backdrop-blur-md z-10 flex items-center ${isPinned ? 'justify-between' : 'justify-center'}`}>
        {isPinned ? (
          <div className="flex items-center gap-3">
            <div className="bg-slate-800 border border-slate-700/50 p-2 rounded-lg text-white">
              <HardHat size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-sans font-bold tracking-tight text-white text-sm whitespace-nowrap">CV Beton Agung</h1>
              <span className="text-[9px] uppercase tracking-widest font-mono text-slate-400 font-bold whitespace-nowrap">Sistem Operasional</span>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsPinned(true)} className="bg-slate-800 border border-slate-700/50 p-2 rounded-lg text-white hover:bg-slate-700 transition-colors" title="Expand Sidebar">
            <HardHat size={18} className="stroke-[2.5]" />
          </button>
        )}
        
        {isPinned && (
          <button onClick={() => setIsPinned(false)} className="text-slate-500 hover:text-slate-300 p-1 rounded-md hover:bg-slate-800 transition-colors" title="Collapse Sidebar">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {isPinned ? (
        <div className="p-4 mx-3 my-3 bg-slate-900/40 rounded-xl border border-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
              {userRoleName.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-[11px] font-bold text-slate-200">Akun Aktif</p>
              <p className="text-[9px] font-mono text-slate-400 mt-0.5 bg-slate-800 border border-slate-700/40 rounded px-1.5 py-0.5 inline-block truncate max-w-full" title={`Role Code: ${userRoleCode}`}>
                {userRoleName}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Keluar dari Sistem"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4 border-b border-slate-900/60 mb-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs" title={`Role: ${userRoleName}`}>
            {userRoleName.substring(0, 2).toUpperCase()}
          </div>
          <button
            onClick={onLogout}
            title="Keluar dari Sistem"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}

      <div className={`flex-1 space-y-1.5 pb-6 ${isPinned ? 'px-3' : 'px-2'}`}>
        {NAVIGATION_SECTIONS.map((section) => {
          const isExpanded = expandedSections[section.id];
          
          const visibleItems = section.items.filter(item => hasAccessToModule(item.requiredModule, item.view));
          
          if (visibleItems.length === 0) {
             return null;
          }

          if (!isPinned) {
            return (
              <div key={section.id} className={section.separator ? 'pt-2 border-t border-slate-900/60 mt-2 space-y-1' : 'space-y-1'}>
                {visibleItems.map(renderNavItem)}
              </div>
            );
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

      {isPinned && (
        <div className="p-3 bg-slate-950 border-t border-slate-900 text-center text-[9px] text-slate-600 font-mono whitespace-nowrap">
          CV Beton Agung ERP
        </div>
      )}
    </div>
  );
}
