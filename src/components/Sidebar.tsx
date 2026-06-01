/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, HardHat, LogOut } from 'lucide-react';
import { NAVIGATION_SECTIONS } from '../config/navigation';
import type { NavigationItem } from '../config/navigation';
import type { ViewType } from '../types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  userRole: string;
}

const activeClass = 'bg-cyan-600 text-white font-medium shadow-md shadow-cyan-900/30';
const inactiveClass = 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 transition-all duration-150';

const isItemActive = (item: NavigationItem, currentView: ViewType) => {
  return item.view === currentView || Boolean(item.activeViews?.includes(currentView));
};

export default function Sidebar({ currentView, onViewChange, onLogout, userRole }: SidebarProps) {
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

  const renderNavItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const active = isItemActive(item, currentView);

    return (
      <button
        key={item.view}
        onClick={() => onViewChange(item.view)}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-left transition-all ${
          active ? activeClass : inactiveClass
        }`}
      >
        <Icon size={14} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="w-64 bg-slate-950 text-slate-100 h-screen flex flex-col border-r border-slate-800 shrink-0 select-none overflow-y-auto scrollbar-thin">
      <div className="p-5 border-b border-slate-800 bg-slate-950/60 sticky top-0 backdrop-blur-md z-10 flex items-center gap-3">
        <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2 rounded-lg text-slate-950 shadow-inner">
          <HardHat size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-sans font-bold tracking-tight text-white text-base">CV Beton Agung</h1>
          <span className="text-[10px] uppercase tracking-wider font-mono text-cyan-400 font-semibold">ERP Internal System</span>
        </div>
      </div>

      <div className="p-4 mx-3 my-3 bg-slate-900/60 rounded-xl border border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-sm">
            {userRole.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">Mitra Intern</p>
            <p className="text-[10px] font-mono text-slate-400 mt-0.5 bg-slate-800 rounded px-1.5 py-0.5 inline-block">
              {userRole}
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Keluar dari Sistem"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>

      <div className="flex-1 px-3 space-y-1.5 pb-6">
        {NAVIGATION_SECTIONS.map((section) => {
          const isExpanded = expandedSections[section.id];

          return (
            <div key={section.id} className={section.separator ? 'pt-4 border-t border-slate-800/60 mt-4 space-y-1.5' : 'space-y-1'}>
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
                <div className={section.title ? 'pl-1.5 space-y-1 border-l border-slate-800/60 ml-2 mt-1' : 'space-y-1.5'}>
                  {section.items.map(renderNavItem)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
        v1.2.0-PROTOTYPE
      </div>
    </div>
  );
}
