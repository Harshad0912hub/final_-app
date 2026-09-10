import React, { useRef, useState } from 'react';
import { useLanguage } from '../utils/LanguageContext';

interface HeaderProps {
  onClearAllData?: () => void;
  onInstallPWA?: () => void;
  isInstallable?: boolean;
  isInstalled?: boolean;
  customerCount?: number;
  isCloudSynced?: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  largeText?: boolean;
  onToggleLargeText?: () => void;
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => void;
  billingReminderDay?: number;
  onSetBillingReminderDay?: (day: number) => void;
  unbilledCount?: number;
  pendingDuesEnabled?: boolean;
  onTogglePendingDues?: () => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onClearAllData,
  onInstallPWA,
  isInstallable = false,
  isInstalled = false,
  customerCount = 0,
  isCloudSynced = true,
  theme = 'light',
  onToggleTheme,
  largeText = false,
  onToggleLargeText,
  onExportBackup,
  onImportBackup,
  billingReminderDay = 1,
  onSetBillingReminderDay,
  unbilledCount = 0,
  pendingDuesEnabled = true,
  onTogglePendingDues,
  notificationCount = 0,
  onOpenNotifications,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [draftReminderDay, setDraftReminderDay] = useState(billingReminderDay);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const { language, toggleLanguage, t, formatNum } = useLanguage();

  const handleConfirmClear = () => {
    setShowConfirmModal(false);
    setShowMenu(false);
    if (onClearAllData) onClearAllData();
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPendingRestoreFile(file);
    setShowRestoreConfirm(true);
  };

  const handleConfirmRestore = () => {
    setShowRestoreConfirm(false);
    setShowMenu(false);
    if (pendingRestoreFile && onImportBackup) {
      onImportBackup(pendingRestoreFile);
    }
    setPendingRestoreFile(null);
  };

  return (
    <>
      <header className="app-header fixed top-0 inset-x-0 z-40 bg-gradient-to-r from-[#ffe9d6] via-[#fffaf5] to-[#ffe0cc] backdrop-blur-xl shadow-[0_1px_8px_rgba(11,28,48,0.04)] border-b border-[#ffdbce]/50">
        <div className="max-w-md mx-auto h-16 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#a33900]/10 flex items-center justify-center flex-shrink-0 shadow-sm border border-[#ffdbce]/40">
              <img
                alt={t('appName')}
                className="w-9 h-9 rounded-lg object-cover"
                src="https://lh3.googleusercontent.com/aida/AEtjO1UZCcz2bFo51Sl8nmiu6Dq8jrqZJ-lNWs7WkTa-9edCsar3gTzIfiJ3c9UNsCXWNim2yZjhpCEi7I3gV0jQ1CEZU1tAgYqSX8In9D24hD3TtGxNeseHN1i1VVsC8oiF4z4eLmGd5ML-HXtjJ7TUzH_WHqsNbzjuPx6EpCJhs4SX1NESxgFu46YbE6l54IQXTGYhoUC13TRN1jBVLBZ09VRPUXd596vRjm2j7Mh1PRcfpMP2QqhbzqaR-bo"
              />
            </div>
            <div className="flex flex-col text-left truncate">
              <div className="flex items-center gap-1.5">
                <h1 className="font-headline-sm text-[17px] text-[#0b1c30] leading-tight font-bold tracking-tight truncate">
                  {t('appName')}
                </h1>
                {isCloudSynced && (
                  <span
                    title={language === 'mr' ? 'क्लाउड डेटाबेस सक्रिय' : 'Cloud Database Active'}
                    className="w-2 h-2 rounded-full bg-[#006e2d] animate-pulse flex-shrink-0"
                  />
                )}
              </div>
              <p className="font-body-sm text-[11.5px] text-[#5a4138] font-normal leading-none mt-0.5">
                {language === 'mr' ? 'मो. ९८२३७८४१४२' : 'Mob. 9823784142'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Notifications Bell */}
            {onOpenNotifications && (
              <button
                type="button"
                aria-label={language === 'mr' ? 'सूचना' : 'Notifications'}
                onClick={onOpenNotifications}
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#5a4138] hover:bg-[#eff4ff] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[21px]">notifications</span>
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#ba1a1a] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Quick Language Toggle Button */}
            <button
              type="button"
              onClick={toggleLanguage}
              title={language === 'mr' ? 'Switch to English' : 'मराठी निवडा'}
              className="h-8 px-2.5 rounded-full flex items-center gap-1 text-[12px] font-bold bg-[#eff4ff] text-[#a33900] hover:bg-[#ffece4] border border-[#ffdbce]/60 active:scale-95 transition-all shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">translate</span>
              <span>{language === 'mr' ? 'English' : 'मराठी'}</span>
            </button>

            {/* More Options Menu */}
            <div className="relative">
              <button
                type="button"
                aria-label="डेटा पर्याय"
                onClick={() => setShowMenu(!showMenu)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#5a4138] hover:bg-[#eff4ff] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[21px]">more_vert</span>
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-11 z-50 w-60 bg-white rounded-2xl shadow-xl border border-[#eff4ff] p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-[#eff4ff]">
                      <p className="text-[11px] text-[#5a4138] font-medium">{t('dataManagement')}</p>
                      <p className="text-[12px] font-bold text-[#0b1c30]">
                        {t('totalCustomers')}: {formatNum(customerCount)}
                      </p>
                    </div>

                    {/* Language Switch inside menu as well */}
                    <button
                      type="button"
                      onClick={() => {
                        toggleLanguage();
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl text-[13px] font-semibold text-[#0b1c30] hover:bg-[#eff4ff] active:scale-98 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#a33900]">translate</span>
                      <span>{language === 'mr' ? 'भाषा: English' : 'Language: मराठी'}</span>
                    </button>

                    {/* Dark Mode Toggle */}
                    {onToggleTheme && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleTheme();
                        }}
                        className="flex items-center justify-between gap-2.5 px-3 py-2 text-left rounded-xl text-[13px] font-semibold text-[#0b1c30] hover:bg-[#eff4ff] active:scale-98 transition-all"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[18px] text-[#a33900]">
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                          </span>
                          <span>{language === 'mr' ? 'गडद मोड' : 'Dark Mode'}</span>
                        </span>
                        <span
                          className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                            theme === 'dark' ? 'bg-[#a33900] justify-end' : 'bg-[#dce9ff] justify-start'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: '#ffffff' }} />
                        </span>
                      </button>
                    )}

                    {/* Large Text Toggle */}
                    {onToggleLargeText && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleLargeText();
                        }}
                        className="flex items-center justify-between gap-2.5 px-3 py-2 text-left rounded-xl text-[13px] font-semibold text-[#0b1c30] hover:bg-[#eff4ff] active:scale-98 transition-all"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[18px] text-[#a33900]">
                            text_fields
                          </span>
                          <span>{language === 'mr' ? 'मोठा मजकूर' : 'Large Text'}</span>
                        </span>
                        <span
                          className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                            largeText ? 'bg-[#a33900] justify-end' : 'bg-[#dce9ff] justify-start'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: '#ffffff' }} />
                        </span>
                      </button>
                    )}

                    {/* Billing Reminder Date Setting */}
                    {onSetBillingReminderDay && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftReminderDay(billingReminderDay);
                          setShowBillingModal(true);
                          setShowMenu(false);
                        }}
                        className="flex items-center justify-between gap-2.5 px-3 py-2 text-left rounded-xl text-[13px] font-semibold text-[#0b1c30] hover:bg-[#eff4ff] active:scale-98 transition-all"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[18px] text-[#a33900]">
                            receipt_long
                          </span>
                          <span>{language === 'mr' ? 'बिलिंग रिमाइंडर तारीख' : 'Billing Reminder Date'}</span>
                        </span>
                        <span className="font-label-sm text-[11px] bg-[#ffdbce] text-[#a33900] px-2 py-0.5 rounded-full font-bold">
                          {formatNum(billingReminderDay)}
                        </span>
                      </button>
                    )}

                    {/* Pending Dues Notification Toggle */}
                    {onTogglePendingDues && (
                      <button
                        type="button"
                        onClick={() => {
                          onTogglePendingDues();
                        }}
                        className="flex items-center justify-between gap-2.5 px-3 py-2 text-left rounded-xl text-[13px] font-semibold text-[#0b1c30] hover:bg-[#eff4ff] active:scale-98 transition-all"
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[18px] text-[#a33900]">
                            notifications_active
                          </span>
                          <span>{language === 'mr' ? 'थकीत रक्कम सूचना' : 'Pending Dues Notification'}</span>
                        </span>
                        <span
                          className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                            pendingDuesEnabled ? 'bg-[#a33900] justify-end' : 'bg-[#dce9ff] justify-start'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: '#ffffff' }} />
                        </span>
                      </button>
                    )}

                    {/* Install App button if not already running standalone */}
                    {!isInstalled && onInstallPWA && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onInstallPWA();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl text-[13px] font-semibold text-[#a33900] hover:bg-[#fff0e6] active:scale-98 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#a33900]">install_mobile</span>
                        <span>{language === 'mr' ? 'मोबाईल ॲप इन्स्टॉल करा' : 'Install Mobile App'}</span>
                      </button>
                    )}

                    {/* Full Backup Download */}
                    {onExportBackup && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onExportBackup();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl text-[13px] font-semibold text-[#0b1c30] hover:bg-[#eff4ff] active:scale-98 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#006e2d]">cloud_download</span>
                        <span>{language === 'mr' ? 'बॅकअप डाऊनलोड करा' : 'Download Backup'}</span>
                      </button>
                    )}

                    {/* Full Backup Restore */}
                    {onImportBackup && (
                      <button
                        type="button"
                        onClick={() => {
                          restoreInputRef.current?.click();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl text-[13px] font-semibold text-[#0b1c30] hover:bg-[#eff4ff] active:scale-98 transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px] text-[#006e2d]">cloud_upload</span>
                        <span>{language === 'mr' ? 'बॅकअप पुनर्संचयित करा' : 'Restore Backup'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        setShowConfirmModal(true);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 text-left rounded-xl text-[13px] font-semibold text-[#ba1a1a] hover:bg-[#ba1a1a]/10 active:scale-98 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                      <span>{t('clearAllData')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hidden file input for restoring a backup */}
      <input
        ref={restoreInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleRestoreFileSelected}
      />

      {/* Restore Backup Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-[#eff4ff] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-[#a33900]/10 flex items-center justify-center text-[#a33900] mb-3">
              <span className="material-symbols-outlined text-[30px]">cloud_upload</span>
            </div>
            <h3 className="font-headline-sm text-[18px] text-[#0b1c30] font-bold mb-1">
              {language === 'mr' ? 'बॅकअप पुनर्संचयित करायचा?' : 'Restore this backup?'}
            </h3>
            <p className="font-body-md text-[13px] text-[#5a4138] mb-5">
              {language === 'mr'
                ? 'यामुळे सध्याचे सर्व ग्राहक, डबे नोंदी आणि पेमेंट्स निवडलेल्या बॅकअपने बदलले जातील.'
                : 'This will replace all current customers, delivery records, and payments with the selected backup.'}
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setPendingRestoreFile(null);
                }}
                className="h-11 rounded-full bg-[#eff4ff] text-[#0b1c30] font-label-md text-[13px] font-semibold hover:bg-[#dce9ff] active:scale-95 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="h-11 rounded-full bg-[#a33900] text-white font-label-md text-[13px] font-bold hover:bg-[#8d4b00] active:scale-95 transition-all shadow-sm"
              >
                {language === 'mr' ? 'पुनर्संचयित करा' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-[#eff4ff] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-[#ba1a1a]/10 flex items-center justify-center text-[#ba1a1a] mb-3">
              <span className="material-symbols-outlined text-[30px]">delete_forever</span>
            </div>
            <h3 className="font-headline-sm text-[18px] text-[#0b1c30] font-bold mb-1">
              {t('clearDataConfirmTitle')}
            </h3>
            <p className="font-body-md text-[13px] text-[#5a4138] mb-5">
              {t('clearDataConfirmMsg')}
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="h-11 rounded-full bg-[#eff4ff] text-[#0b1c30] font-label-md text-[13px] font-semibold hover:bg-[#dce9ff] active:scale-95 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="h-11 rounded-full bg-[#ba1a1a] text-white font-label-md text-[13px] font-bold hover:bg-[#93000a] active:scale-95 transition-all shadow-sm"
              >
                {t('confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Billing Reminder Date Setting Modal */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-[#eff4ff] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-11 h-11 rounded-2xl bg-[#a33900]/10 flex items-center justify-center text-[#a33900] shrink-0">
                <span className="material-symbols-outlined text-[24px]">receipt_long</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-[16px] text-[#0b1c30] font-bold leading-tight">
                  {language === 'mr' ? 'बिलिंग रिमाइंडर तारीख' : 'Billing Reminder Date'}
                </h3>
                <p className="font-body-sm text-[11.5px] text-[#5a4138] leading-tight">
                  {language === 'mr' ? 'दर महिन्याला कोणत्या तारखेला आठवण द्यायची?' : 'Which date each month should we remind you?'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 mb-1">
              <button
                type="button"
                onClick={() => setDraftReminderDay((d) => Math.max(1, d - 1))}
                className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#5a4138] font-bold flex items-center justify-center active:scale-90 hover:bg-[#dce9ff]"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <div className="flex-1 h-12 rounded-xl bg-[#fff3eb] border border-[#ffd5bc] flex items-center justify-center gap-1">
                <span className="font-headline-md text-[22px] text-[#a33900] font-bold">
                  {formatNum(draftReminderDay)}
                </span>
                <span className="font-body-sm text-[12px] text-[#8d4b00]">
                  {language === 'mr' ? 'तारखेला' : 'of the month'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDraftReminderDay((d) => Math.min(28, d + 1))}
                className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#5a4138] font-bold flex items-center justify-center active:scale-90 hover:bg-[#dce9ff]"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>

            {/* Live preview of exactly what the banner will look like */}
            <p className="font-label-sm text-[11px] text-[#5a4138] font-semibold mt-3 mb-1.5">
              {language === 'mr' ? 'असे दिसेल:' : 'This is what you\'ll see:'}
            </p>
            <div className="p-3 bg-linear-to-r from-[#fff3eb] to-[#ffebd8] border border-[#ffd5bc] rounded-2xl flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#a33900] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-[#0b1c30] leading-snug">
                  {language === 'mr' ? 'आज बिलिंग दिवस आहे' : "It's billing day"}
                </p>
                <p className="text-[11px] text-[#5a4138] leading-tight">
                  {language === 'mr'
                    ? `${formatNum(unbilledCount || 5)} ग्राहकांना अजून या महिन्याचे बिल पाठवले नाही`
                    : `${formatNum(unbilledCount || 5)} customers haven't been sent this month's bill yet`}
                </p>
              </div>
            </div>
            <p className="font-body-sm text-[11px] text-[#5a4138] mt-2 leading-snug">
              {language === 'mr'
                ? `दर महिन्याच्या ${formatNum(draftReminderDay)} तारखेपासून, ज्यांना अजून बिल पाठवले नाही तितके ग्राहक असतील तोपर्यंत हे "आज" स्क्रीनवर वर दिसेल.`
                : `From the ${formatNum(draftReminderDay)}${draftReminderDay === 1 ? 'st' : draftReminderDay === 2 ? 'nd' : draftReminderDay === 3 ? 'rd' : 'th'} of each month onward, this shows on the Today screen as long as some customers haven't been billed yet.`}
            </p>

            <div className="grid grid-cols-2 gap-2 w-full mt-4">
              <button
                type="button"
                onClick={() => setShowBillingModal(false)}
                className="h-11 rounded-full bg-[#eff4ff] text-[#0b1c30] font-label-md text-[13px] font-semibold hover:bg-[#dce9ff] active:scale-95 transition-all"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetBillingReminderDay?.(draftReminderDay);
                  setShowBillingModal(false);
                }}
                className="h-11 rounded-full bg-[#a33900] text-white font-label-md text-[13px] font-bold hover:bg-[#8d4b00] active:scale-95 transition-all shadow-sm"
              >
                {t('saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
