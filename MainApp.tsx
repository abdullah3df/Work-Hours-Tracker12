import React, { useState } from 'react';
import { Language, Theme, LogEntry, Task, LogType } from './types';
import Header from './components/Header';
import TimeTracker from './components/TimeTracker';
import LogManager from './components/LogManager';
import ProfileModal from './components/ProfileModal';
import LogFormModal from './components/LogFormModal';
import ReportModal from './components/ReportModal';
import { useUserData } from './hooks/useUserData';
import LoadingSpinner from './components/LoadingSpinner';
import Reminders from './components/Reminders';
import Sidebar from './components/Sidebar';
import TourGuide, { TourStep } from './components/TourGuide';
import useLocalStorage from './hooks/useLocalStorage';
import WorkHoursChart from './components/WorkHoursChart';

interface MainAppProps {
  user: any | null;
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: any) => string;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const MainApp: React.FC<MainAppProps> = ({
  user,
  onLogout,
  language,
  setLanguage,
  theme,
  setTheme,
  t,
  showToast,
}) => {
