import React from 'react';
import { DashboardIcon, ListBulletIcon, QuestionMarkCircleIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, ChartBarIcon } from './Icons';
import { Language } from '../types';

interface SidebarProps {
  t: (key: any) => string;
  onHelpClick: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  language: Language;
  onLinkClick: (href: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  t, 
  onHelpClick, 
  isCollapsed, 
  toggleSidebar, 
  language, 
  onLinkClick,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'dashboard', icon: DashboardIcon, href: '#dashboard' },
    { id: 'logs-and-tasks', label: 'logsAndTasks', icon: ListBulletIcon, href: '#logs-and-tasks' },
    { id: 'analytics', label: 'analytics', icon: ChartBarIcon, href: '#analytics' },
  ];

  const CollapseIcon = language === 'ar' ? ChevronDoubleRightIcon : ChevronDoubleLeftIcon;
  const ExpandIcon = language === 'ar' ? ChevronDoubleLeftIcon : ChevronDoubleRightIcon;
  
  const handleLinkClick = (href: string) => {
    onLinkClick(href);
    setIsMobileMenuOpen(false);
  }

  const sidebarContent = (
    <div className="h-full px-3 py-4 flex flex-col justify-between">
      <div>
        <div className={`flex items-center mb-5 h-16 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'ps-2.5'}`}>
            <h1 className={`text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent font-cairo whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100 sm:opacity-100'}`}>
              {t('saati')}
            </h1>
        </div>
        <ul className="space-y-2 font-medium">
          {menuItems.map(item => (
            <li key={item.id} className="relative group">
              <a 
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(item.href);
                }}
                title={isCollapsed ? t(item.label) : ''} className="flex items-center p-2 text-gray-800 rounded-lg dark:text-white hover:bg-black/10 dark:hover:bg-white/10 group overflow-hidden cursor-pointer">
                <item.icon className="w-6 h-6 flex-shrink-0 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className={`ms-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 sm:opacity-100' : 'opacity-100'}`}>
                  {t(item.label)}
                </span>
              </a>
              {isCollapsed && (
                <div className="absolute start-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900/80 dark:bg-gray-700/80 backdrop-blur-sm text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {t(item.label)}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="flex flex-col">
          <div className="relative group">
              <button onClick={() => { onHelpClick(); setIsMobileMenuOpen(false); }} id="tour-trigger" title={isCollapsed ? t('help') : ''} className="w-full flex items-center p-2 text-gray-800 rounded-lg dark:text-white hover:bg-black/10 dark:hover:bg-white/10 group overflow-hidden">
                  <QuestionMarkCircleIcon className="w-6 h-6 flex-shrink-0 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <span className={`ms-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 sm:opacity-100' : 'opacity-100'}`}>{t('help')}</span>
              </button>
               {isCollapsed && (
                <div className="absolute start-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900/80 dark:bg-gray-700/80 backdrop-blur-sm text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {t('help')}
                </div>
              )}
          </div>
           <div className="relative group mt-2 border-t border-gray-900/10 dark:border-white/10 pt-2 hidden sm:block">
              <button onClick={toggleSidebar} title={isCollapsed ? t('expandSidebar') : t('collapseSidebar')} className="w-full flex items-center p-2 text-gray-800 rounded-lg dark:text-white hover:bg-black/10 dark:hover:bg-white/10 group overflow-hidden">
                  {isCollapsed 
                      ? <ExpandIcon className="w-6 h-6 flex-shrink-0 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" /> 
                      : <CollapseIcon className="w-6 h-6 flex-shrink-0 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                  }
                  <span className={`ms-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{isCollapsed ? t('expandSidebar') : t('collapseSidebar')}</span>
              </button>
               {isCollapsed && (
                <div className="absolute start-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900/80 dark:bg-gray-700/80 backdrop-blur-sm text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {t('expandSidebar')}
                </div>
              )}
          </div>
      </div>
    </div>
  );

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-30 sm:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      <aside 
        id="app-sidebar" 
        className={`fixed top-0 start-0 z-40 h-screen transition-transform duration-300 ease-in-out bg-white/20 dark:bg-gray-900/20 backdrop-blur-xl border-e border-white/30 dark:border-white/10 w-64
        ${isCollapsed ? 'sm:w-20' : 'sm:w-64'} 
        ${isMobileMenuOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')} 
        sm:translate-x-0`} 
        aria-label="Sidebar"
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;