import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, HardHat, LogOut } from '@/src/components/icons';
import { NAVIGATION_SECTIONS } from '../config/navigation';
import type { NavigationItem } from '../config/navigation';
import type { ViewType, AuthPermission } from '../types';

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { viewFromPath, pathForView } from '../routes';
import { hasViewAccess } from '../utils/permissions';

const isItemActive = (item: NavigationItem, currentView: ViewType) => {
  return item.view === currentView || Boolean(item.activeViews?.includes(currentView));
};

export default function Sidebar() {
  const { userRoleName, userRoleCode, authUser, handleLogout } = useAuth();
  const userPermissions = authUser?.role?.permissions;
  const location = useLocation();
  const currentView = viewFromPath(location.pathname) || 'dashboard';
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

  const hasAccessToModule = (requiredModule?: string, itemView?: string, minAccessLevel?: 'read' | 'edit' | 'full') => {
    return hasViewAccess(userRoleCode, userPermissions, requiredModule, itemView, minAccessLevel);
  };

  const renderNavItem = (item: NavigationItem) => {
    if (!hasAccessToModule(item.requiredModule, item.view, item.minAccessLevel)) {
      return null;
    }

    const Icon = item.icon;
    const active = isItemActive(item, currentView);

    const activeClass = isPinned
      ? 'bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-transparent border-l-3 border-sky-600 pl-2.5 text-sky-800 font-bold shadow-xs'
      : 'bg-sky-500/15 text-sky-700 font-bold justify-center rounded-lg';

    const inactiveClass = isPinned
      ? 'text-slate-600 hover:bg-sky-100/50 hover:text-sky-800 transition-colors pl-3 font-medium'
      : 'text-slate-500 hover:bg-sky-100/50 hover:text-sky-800 transition-colors justify-center rounded-lg';

    return (
      <Link
        key={item.view}
        to={pathForView(item.view)}
        title={!isPinned ? item.label : undefined}
        className={`w-full flex items-center py-2 text-xs transition-all ${active ? activeClass : inactiveClass
          } ${isPinned ? 'gap-2 text-left rounded' : ''}`}
      >
        <Icon size={isPinned ? 13 : 16} />
        {isPinned && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className={`${isPinned ? 'w-64' : 'w-18'} bg-gradient-to-b from-sky-50/90 via-slate-50/95 to-blue-50/80 text-slate-700 h-screen flex flex-col border-r border-sky-100 shrink-0 select-none overflow-y-auto scrollbar-thin transition-all duration-300 backdrop-blur-md shadow-[2px_0_15px_-4px_rgba(186,215,245,0.25)]`}>
      <div className={`p-4 border-b border-sky-100 bg-white/70 sticky top-0 backdrop-blur-md z-10 flex items-center ${isPinned ? 'justify-between' : 'justify-center'}`}>
        {isPinned ? (
          <div className="flex items-center gap-3">
            <div className="bg-white border border-sky-200/80 shadow-xs p-1.5 rounded-lg flex items-center justify-center">
              <img src="/logo.png" alt={`${import.meta.env.VITE_APP_NAME || "Lintara Digital"} Logo`} className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="font-sans font-bold tracking-tight text-slate-900 text-sm whitespace-nowrap">{import.meta.env.VITE_APP_NAME || "Lintara Digital"}</h1>
              <span className="text-[9px] uppercase tracking-widest font-mono text-sky-700/80 font-bold whitespace-nowrap">by Lintara Digital</span>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsPinned(true)} className="bg-white border border-sky-200/80 shadow-xs p-1.5 rounded-lg flex items-center justify-center hover:bg-sky-50 transition-colors cursor-pointer" title="Expand Sidebar">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          </button>
        )}

        {isPinned && (
          <button onClick={() => setIsPinned(false)} className="text-slate-400 hover:text-sky-700 p-1 rounded-md hover:bg-sky-100/60 transition-colors cursor-pointer" title="Collapse Sidebar">
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {isPinned ? (
        <div className="p-3.5 mx-3 my-3 bg-white/80 rounded-xl border border-sky-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center font-bold text-sky-700 text-xs shrink-0">
              {userRoleName.substring(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-[11px] font-bold text-slate-800">Akun Aktif</p>
              <p className="text-[9px] font-mono text-sky-800 font-semibold bg-sky-50 border border-sky-200/60 rounded px-1.5 py-0.5 inline-block truncate max-w-full" title={`Role Code: ${userRoleCode}`}>
                {userRoleName}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar dari Sistem"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut size={14} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-3 border-b border-sky-100 mb-2">
          <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center font-bold text-sky-700 text-xs" title={`Role: ${userRoleName}`}>
            {userRoleName.substring(0, 2).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            title="Keluar dari Sistem"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}

      <div className={`flex-1 space-y-1.5 pb-6 ${isPinned ? 'px-3' : 'px-2'}`}>
        {NAVIGATION_SECTIONS.map((section) => {
          const isExpanded = expandedSections[section.id];

          const visibleItems = section.items.filter(item => hasAccessToModule(item.requiredModule, item.view, item.minAccessLevel));

          if (visibleItems.length === 0) {
            return null;
          }

          if (!isPinned) {
            return (
              <div key={section.id} className={section.separator ? 'pt-2 border-t border-sky-100 mt-2 space-y-1' : 'space-y-1'}>
                {visibleItems.map(renderNavItem)}
              </div>
            );
          }

          return (
            <div key={section.id} className={section.separator ? 'pt-4 border-t border-sky-100 mt-4 space-y-1.5' : 'space-y-1'}>
              {section.title && (
                section.collapsible ? (
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider text-sky-900/60 hover:text-sky-900 mt-4 text-left cursor-pointer"
                  >
                    <span>{section.title}</span>
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                ) : (
                  <p className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-sky-900/60 mt-4">
                    {section.title}
                  </p>
                )
              )}

              {(!section.collapsible || isExpanded) && (
                <div className={section.title ? 'pl-1 border-l border-sky-200/60 ml-2 mt-1' : 'space-y-1.5'}>
                  {visibleItems.map(renderNavItem)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isPinned && (
        <div className="p-2.5 bg-white/70 border-t border-sky-100 text-center text-[9px] text-sky-700/60 font-mono whitespace-nowrap">
          Sistem ERP CV. Beton Agung
        </div>
      )}
    </div>
  );
}
