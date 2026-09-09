import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { useLanguage } from '../utils/LanguageContext';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { language } = useLanguage();

  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show if browser supports installation or is iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      await install();
    }
  };

  return (
    <>
      <div className="mx-3 mt-2 mb-1 p-3 bg-linear-to-r from-[#fff3eb] to-[#ffebd8] border border-[#ffd5bc] rounded-2xl flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#a33900] text-white flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">install_mobile</span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-[#0b1c30] leading-snug truncate">
              {language === 'mr' ? 'मोबाईल ॲप म्हणून वापरा' : 'Install as Mobile App'}
            </p>
            <p className="text-[11px] text-[#5a4138] leading-tight">
              {language === 'mr' ? 'ऑफलाइन चालेल, क्रोमशिवाय थेट उघडा' : 'Works offline on phone home screen'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="h-8 px-3.5 rounded-full bg-[#a33900] hover:bg-[#852f00] text-white text-[11px] font-bold active:scale-95 transition-all shadow-xs flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">download</span>
            <span>{language === 'mr' ? 'इन्स्टॉल करा' : 'Install'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss banner"
            className="w-7 h-7 rounded-full text-[#5a4138] hover:bg-black/5 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-[#cbd5e1] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#a33900] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[22px]">phone_iphone</span>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-[#0b1c30]">
                  {language === 'mr' ? 'आयफोन / आयपॅडवर इन्स्टॉल करा' : 'Install on iPhone / iPad'}
                </h3>
                <p className="text-[11px] text-[#5a4138]">श्रावणी टिफीन सेंटर</p>
              </div>
            </div>

            <div className="bg-[#f8f9ff] rounded-2xl p-3.5 border border-[#cbdbf5] text-[12px] text-[#0b1c30] space-y-2 mb-4">
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#a33900]">१.</span>
                <span>
                  सफारी (Safari) ब्राउझरमधील खालील{' '}
                  <strong className="text-[#a33900]">Share (शेअर)</strong> बटणावर दाबा.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#a33900]">२.</span>
                <span>
                  खाली स्क्रोल करून{' '}
                  <strong className="text-[#a33900]">"Add to Home Screen"</strong> (होम स्क्रीनवर
                  जोडा) निवडा.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-[#a33900]">३.</span>
                <span>वर उजवीकडे "Add" दाबा. ॲप मोबाईल स्क्रीनवर दिसेल!</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full h-10 rounded-full bg-[#a33900] text-white font-bold text-[13px] hover:bg-[#852f00] active:scale-95 transition-all shadow-xs"
            >
              {language === 'mr' ? 'समजले (बंद करा)' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
