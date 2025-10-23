import React, { useState, useEffect } from 'react';
import { ProfileSettings } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProfileSettings;
  onSave: (newSettings: ProfileSettings) => Promise<void>;
  t: (key: any) => string;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, settings, onSave, t, showToast }) => {
  const [currentSettings, setCurrentSettings] = useState<ProfileSettings>(settings);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings, isOpen]);

  const handleSave = async () => {
    try {
      await onSave(currentSettings);
      showToast(t('saveSuccess'), 'success');
      onClose();
    } catch(error) {
      console.error("Failed to save profile:", error);
      showToast(t('saveError'), 'error');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[10001] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('profileSettings')}</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="workDaysPerWeek" className="block text-sm font-medium text-gray-800 dark:text-gray-200">{t('workDaysPerWeek')}</label>
              <input
                type="number"
                id="workDaysPerWeek"
                value={currentSettings.workDaysPerWeek}
                onChange={(e) => setCurrentSettings({ ...currentSettings, workDaysPerWeek: parseInt(e.target.value, 10) || 0 })}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="workHoursPerDay" className="block text-sm font-medium text-gray-800 dark:text-gray-200">{t('workHoursPerDay')}</label>
              <input
                type="number"
                id="workHoursPerDay"
                value={currentSettings.workHoursPerDay}
                onChange={(e) => setCurrentSettings({ ...currentSettings, workHoursPerDay: parseInt(e.target.value, 10) || 0 })}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="defaultBreakMinutes" className="block text-sm font-medium text-gray-800 dark:text-gray-200">{t('defaultBreakMinutes')}</label>
              <input
                type="number"
                id="defaultBreakMinutes"
                value={currentSettings.defaultBreakMinutes}
                onChange={(e) => setCurrentSettings({ ...currentSettings, defaultBreakMinutes: parseInt(e.target.value, 10) || 0 })}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:text-white"
              />
            </div>
             <div>
              <label htmlFor="annualVacationDays" className="block text-sm font-medium text-gray-800 dark:text-gray-200">{t('annualVacationDays')}</label>
              <input
                type="number"
                id="annualVacationDays"
                value={currentSettings.annualVacationDays || 0}
                onChange={(e) => setCurrentSettings({ ...currentSettings, annualVacationDays: parseInt(e.target.value, 10) || 0 })}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:text-white"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 rounded-b-xl flex justify-end space-x-3 rtl:space-x-reverse">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-slate-600 dark:text-gray-200 dark:border-slate-500 dark:hover:bg-slate-500"
          >
            {t('close')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-lg shadow-indigo-500/30 text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;