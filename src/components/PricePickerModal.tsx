import React, { useState, useEffect } from 'react';
import { Customer, DeliveryStatus, DietType } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface PricePickerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  session: 'morning' | 'evening';
  currentPrice: number;
  currentStatus: DeliveryStatus;
  currentDietType?: DietType;
  dateStr?: string;
  onClose: () => void;
  onConfirmDelivery: (price: number, dietType?: DietType) => void;
  onMarkLeave: () => void;
  onClearMark: () => void;
}

export const PricePickerModal: React.FC<PricePickerModalProps> = ({
  isOpen,
  customer,
  session,
  currentPrice: initialPrice,
  currentDietType,
  dateStr,
  onClose,
  onConfirmDelivery,
  onMarkLeave,
  onClearMark,
}) => {
  const { language, t, formatNum, formatCurrency } = useLanguage();
  const [selectedPrice, setSelectedPrice] = useState<number>(initialPrice || 70);
  const [selectedDiet, setSelectedDiet] = useState<DietType>(currentDietType || customer?.dietType || 'veg');
  const [showCustomBox, setShowCustomBox] = useState(false);

  useEffect(() => {
    const defaultP = initialPrice || customer?.ratePerTiffin || 70;
    setSelectedPrice(defaultP);
    setSelectedDiet(currentDietType || customer?.dietType || 'veg');
    // If current price is not standard preset, open custom box
    if (![55, 60, 65, 70, 75, 80].includes(defaultP)) {
      setShowCustomBox(true);
    }
  }, [initialPrice, currentDietType, customer]);

  if (!isOpen || !customer) return null;

  const sessionLabel =
    session === 'morning'
      ? (language === 'mr' ? 'सकाळ' : 'Morning')
      : (language === 'mr' ? 'संध्याकाळ' : 'Evening');

  const handlePriceClick = (price: number) => {
    setSelectedPrice(price);
  };

  const adjustPrice = (delta: number) => {
    setSelectedPrice((prev) => Math.max(10, Math.min(999, prev + delta)));
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) {
      setSelectedPrice(Math.max(0, Math.min(999, val)));
    }
  };

  const commonPrices = [55, 60, 65, 70, 75, 80];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0b1c30]/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full max-w-md bg-[#ffffff] rounded-t-[28px] shadow-[0_-12px_36px_rgba(11,28,48,0.22)] z-10 flex flex-col pt-2 px-4 pb-6 animate-in slide-in-from-bottom duration-300">
        {/* Tactile Drag Handle */}
        <div className="w-full flex justify-center py-2 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-[#d3e4fe]"></div>
        </div>

        {/* Sheet Header */}
        <div className="flex items-start justify-between pt-1 pb-3">
          <div className="flex flex-col pr-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#ffdbce] text-[#a33900] font-label-sm text-[11px] font-bold">
                {customer.initial}
              </span>
              <h2 className="font-headline-md text-[20px] text-[#0b1c30] font-bold tracking-tight">
                {customer.name} · {sessionLabel}
              </h2>
            </div>
            <p className="font-body-sm text-[12px] text-[#5a4138] mt-0.5 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#8d4b00]">calendar_today</span>
              {dateStr || (language === 'mr' ? 'तारीख नोंद | टिफीन दर निवडा' : 'Date Record | Select Tiffin Rate')}
            </p>
          </div>

          <button
            type="button"
            aria-label={t('cancel')}
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#5a4138] hover:text-[#0b1c30] active:scale-95 transition-all flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Context Strip */}
        <div className="flex items-center justify-between bg-[#eff4ff] px-3 py-2 rounded-xl mb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#a33900] text-[18px]">lunch_dining</span>
            <span className="font-label-md text-[13px] text-[#0b1c30] font-medium">
              {customer.mealTimingLabel || (language === 'mr' ? 'नियमित डबा' : 'Regular Tiffin')}
            </span>
          </div>
          <span className="font-label-sm text-[12px] text-[#a33900] font-bold bg-[#ffdbce] px-2.5 py-0.5 rounded-full">
            {language === 'mr' ? 'नियमित दर:' : 'Regular:'} {formatCurrency(customer.ratePerTiffin)}
          </span>
        </div>

        {/* Meal Diet Selection: Veg vs Non-Veg */}
        <div className="flex flex-col gap-1.5 mb-3 bg-[#f8faff] p-2.5 rounded-2xl border border-[#dce9ff]">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-[12.5px] text-[#5a4138] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#a33900]">restaurant</span>
              <span>{language === 'mr' ? 'डब्याचा प्रकार (व्हेज / नॉन-व्हेज):' : 'Meal Diet (Veg / Non-Veg):'}</span>
            </span>
            <span
              className={`font-label-sm text-[10px] px-2 py-0.5 rounded-full font-bold ${
                selectedDiet === 'non-veg'
                  ? 'bg-[#ffcdd2] text-[#b71c1c]'
                  : 'bg-[#c8e6c9] text-[#1b5e20]'
              }`}
            >
              {selectedDiet === 'non-veg'
                ? (language === 'mr' ? 'मांसाहारी डबा' : 'Non-Veg')
                : (language === 'mr' ? 'शाकाहारी डबा' : 'Pure Veg')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-0.5">
            <button
              type="button"
              onClick={() => setSelectedDiet('veg')}
              className={`h-10 rounded-xl font-label-md text-[12.5px] font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                selectedDiet === 'veg'
                  ? 'bg-[#ffffff] text-[#1b5e20] border-[#2e7d32] shadow-sm ring-2 ring-[#2e7d32]/25'
                  : 'bg-[#ffffff]/60 text-[#5a4138] border-[#dce9ff] hover:bg-white'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-sm border-2 border-[#2e7d32] flex items-center justify-center p-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2e7d32]"></span>
              </span>
              <span>{language === 'mr' ? 'व्हेज (शाकाहारी)' : 'Veg'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedDiet('non-veg')}
              className={`h-10 rounded-xl font-label-md text-[12.5px] font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                selectedDiet === 'non-veg'
                  ? 'bg-[#ffffff] text-[#b71c1c] border-[#c62828] shadow-sm ring-2 ring-[#c62828]/25'
                  : 'bg-[#ffffff]/60 text-[#5a4138] border-[#dce9ff] hover:bg-white'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-sm border-2 border-[#c62828] flex items-center justify-center p-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c62828]"></span>
              </span>
              <span>{language === 'mr' ? 'नॉन-व्हेज (मांसाहारी)' : 'Non-Veg'}</span>
            </button>
          </div>
        </div>

        {/* Price Selection Section */}
        <div className="flex flex-col gap-2.5 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-[13px] text-[#5a4138] font-bold">
              {language === 'mr' ? 'डब्याचा दर निवडा किंवा टाका (₹):' : 'Select or Enter Tiffin Rate (₹):'}
            </span>
            <button
              type="button"
              onClick={() => setShowCustomBox(!showCustomBox)}
              className="text-[12px] font-bold text-[#a33900] underline underline-offset-2 flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              <span>{showCustomBox ? (language === 'mr' ? 'प्रीसेट दर' : 'Preset Rates') : (language === 'mr' ? 'सानुकूल दर टाका' : 'Custom Input')}</span>
            </button>
          </div>

          {/* Quick Preset Chips */}
          <div className="grid grid-cols-4 gap-2">
            {[50, 60, 70, 80].map((price) => {
              const isSelected = selectedPrice === price && !showCustomBox;
              return (
                <button
                  key={price}
                  type="button"
                  onClick={() => {
                    handlePriceClick(price);
                    setShowCustomBox(false);
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all relative active:scale-95 border ${
                    isSelected
                      ? 'bg-[#a33900] text-white border-[#a33900] shadow-sm font-bold'
                      : 'bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] border-[#dce9ff]'
                  }`}
                >
                  <span className="text-[11px] opacity-80 leading-none">₹</span>
                  <span className="font-headline-sm text-[17px] font-bold leading-tight">{price}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-white' : 'text-[#5a4138]'}`}>
                    {price === customer.ratePerTiffin
                      ? (language === 'mr' ? 'नेहमीचा' : 'Regular')
                      : `${price} रु.`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Custom Price Box with Numeric Stepper and Direct Input */}
          <div className="bg-[#eff4ff] p-3 rounded-2xl border border-[#dce9ff] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[12px] text-[#5a4138] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-[#a33900]">tune</span>
                {language === 'mr' ? 'सानुकूल रक्कम बदला (Custom Price)' : 'Custom Price Controller'}
              </span>
              <span className="font-label-sm text-[11px] bg-[#dce9ff] text-[#0b1c30] px-2 py-0.5 rounded-full font-bold">
                ₹{selectedPrice}
              </span>
            </div>

            {/* Stepper + Input Row */}
            <div className="flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={() => adjustPrice(-10)}
                className="h-10 px-2.5 rounded-xl bg-white text-[#5a4138] font-bold text-[12px] shadow-xs hover:bg-[#ffdad6] active:scale-90 transition-all border border-[#dce9ff]"
                title="-10"
              >
                -१०
              </button>
              <button
                type="button"
                onClick={() => adjustPrice(-5)}
                className="h-10 px-2.5 rounded-xl bg-white text-[#5a4138] font-bold text-[12px] shadow-xs hover:bg-[#ffdad6] active:scale-90 transition-all border border-[#dce9ff]"
                title="-5"
              >
                -५
              </button>

              {/* Direct Input Field */}
              <div className="flex-1 relative flex items-center">
                <span className="absolute left-3 text-[#a33900] font-bold text-[18px]">₹</span>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  step="5"
                  value={selectedPrice || ''}
                  onChange={handleCustomInputChange}
                  className="w-full h-11 pl-8 pr-3 text-center rounded-xl bg-white text-[#0b1c30] font-headline-sm text-[20px] font-bold border-2 border-[#a33900]/40 focus:border-[#a33900] focus:outline-none shadow-xs"
                  placeholder="0"
                />
              </div>

              <button
                type="button"
                onClick={() => adjustPrice(5)}
                className="h-10 px-2.5 rounded-xl bg-white text-[#007230] font-bold text-[12px] shadow-xs hover:bg-[#7cf994] active:scale-90 transition-all border border-[#dce9ff]"
                title="+5"
              >
                +५
              </button>
              <button
                type="button"
                onClick={() => adjustPrice(10)}
                className="h-10 px-2.5 rounded-xl bg-white text-[#007230] font-bold text-[12px] shadow-xs hover:bg-[#7cf994] active:scale-90 transition-all border border-[#dce9ff]"
                title="+10"
              >
                +१०
              </button>
            </div>

            {/* Quick Price Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              {[40, 50, 55, 60, 65, 70, 75, 80, 90, 100, 120].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPrice(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                    selectedPrice === p
                      ? 'bg-[#a33900] text-white'
                      : 'bg-white text-[#5a4138] border border-[#dce9ff] hover:bg-[#e5eeff]'
                  }`}
                >
                  ₹{p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Primary: डबा दिला */}
          <button
            type="button"
            onClick={() => onConfirmDelivery(selectedPrice, selectedDiet)}
            className="w-full min-h-[48px] bg-[#a33900] text-white font-label-lg text-[15px] font-bold rounded-full flex items-center justify-center gap-2 shadow-md hover:bg-[#8d4b00] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>
              {language === 'mr'
                ? `डबा दिला (${formatCurrency(selectedPrice)} · ${selectedDiet === 'non-veg' ? 'नॉन-व्हेज' : 'व्हेज'})`
                : `Mark Delivered (${formatCurrency(selectedPrice)} · ${selectedDiet === 'non-veg' ? 'Non-Veg' : 'Veg'})`}
            </span>
          </button>

          {/* Secondary: सुट्टी */}
          <button
            type="button"
            onClick={onMarkLeave}
            className="w-full min-h-[48px] bg-[#eff4ff] text-[#0b1c30] font-label-lg text-[15px] font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-[#e5eeff] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[20px] text-[#5a4138]">event_busy</span>
            <span>{language === 'mr' ? 'सुट्टी (आज डबा नाही)' : 'Leave (No Tiffin Today)'}</span>
          </button>

          {/* Destructive: चिन्ह काढा */}
          <button
            type="button"
            onClick={onClearMark}
            className="w-full min-h-[44px] bg-[#ffdad6]/60 text-[#ba1a1a] font-label-md text-[14px] font-semibold rounded-full flex items-center justify-center gap-1.5 hover:bg-[#ffdad6] active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            <span>{language === 'mr' ? 'चिन्ह काढा (नोंद रद्द करा)' : 'Clear Delivery Status'}</span>
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 font-label-md text-[13px] text-[#5a4138] hover:text-[#0b1c30] text-center transition-colors"
          >
            {language === 'mr' ? 'मागे जा / रद्द करा' : 'Go Back / Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
