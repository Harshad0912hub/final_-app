import React, { useState, useEffect } from 'react';
import { Customer, DeliveryStatus, DietType, ExtraItem, SelectedExtra } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface PricePickerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  session: 'morning' | 'evening';
  currentPrice: number;
  currentStatus: DeliveryStatus;
  currentDietType?: DietType;
  currentLabel?: string;
  currentExtras?: SelectedExtra[];
  dateStr?: string;
  extraItems: ExtraItem[];
  onSaveExtraItem: (item: ExtraItem) => void;
  onDeleteExtraItem: (itemId: string) => void;
  onClose: () => void;
  onConfirmDelivery: (price: number, dietType?: DietType, label?: string, extras?: SelectedExtra[]) => void;
  onMarkLeave: () => void;
  onClearMark: () => void;
}

export const PricePickerModal: React.FC<PricePickerModalProps> = ({
  isOpen,
  customer,
  session,
  currentPrice: initialPrice,
  currentDietType,
  currentLabel,
  currentExtras,
  dateStr,
  extraItems,
  onSaveExtraItem,
  onDeleteExtraItem,
  onClose,
  onConfirmDelivery,
  onMarkLeave,
  onClearMark,
}) => {
  const { language, t, formatNum, formatCurrency } = useLanguage();
  const [basePrice, setBasePrice] = useState<number>(initialPrice || 70);
  const [selectedDiet, setSelectedDiet] = useState<DietType>(currentDietType || customer?.dietType || 'veg');
  const [note, setNote] = useState<string>(currentLabel || '');
  const [showCustomBox, setShowCustomBox] = useState(false);
  const [selectedExtraNames, setSelectedExtraNames] = useState<string[]>((currentExtras || []).map((e) => e.name));
  const [showAddExtraForm, setShowAddExtraForm] = useState(false);
  const [newExtraName, setNewExtraName] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');

  useEffect(() => {
    // The base price previously stored already includes any extras that
    // were selected at the time, so subtract them back out to isolate the
    // plain tiffin rate for editing.
    const priorExtrasTotal = (currentExtras || []).reduce((sum, e) => sum + e.price, 0);
    const defaultP = (initialPrice || customer?.ratePerTiffin || 70) - priorExtrasTotal;
    setBasePrice(Math.max(0, defaultP));
    setSelectedDiet(currentDietType || customer?.dietType || 'veg');
    setNote(currentLabel || '');
    setSelectedExtraNames((currentExtras || []).map((e) => e.name));
    // If current price is not standard preset, open custom box
    if (![55, 60, 65, 70, 75, 80].includes(defaultP)) {
      setShowCustomBox(true);
    }
  }, [initialPrice, currentDietType, currentLabel, currentExtras, customer]);

  // Resolve selected extra names against the live catalog so price edits to
  // a catalog item are reflected immediately, and compute the running total.
  const selectedExtras: SelectedExtra[] = selectedExtraNames
    .map((name) => extraItems.find((it) => it.name === name))
    .filter((it): it is ExtraItem => !!it)
    .map((it) => ({ name: it.name, price: it.price }));
  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const selectedPrice = basePrice + extrasTotal;

  const toggleExtra = (name: string) => {
    setSelectedExtraNames((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  };

  const handleAddExtraItem = () => {
    const name = newExtraName.trim();
    const price = Number(newExtraPrice);
    if (!name || isNaN(price) || price <= 0) return;
    const item: ExtraItem = { id: `extra-${Date.now()}`, name, price, createdAt: new Date().toISOString() };
    onSaveExtraItem(item);
    setSelectedExtraNames((prev) => [...prev, name]);
    setNewExtraName('');
    setNewExtraPrice('');
    setShowAddExtraForm(false);
  };

  if (!isOpen || !customer) return null;

  const sessionLabel =
    session === 'morning'
      ? (language === 'mr' ? 'सकाळ' : 'Morning')
      : (language === 'mr' ? 'संध्याकाळ' : 'Evening');

  const handlePriceClick = (price: number) => {
    setBasePrice(price);
  };

  const adjustPrice = (delta: number) => {
    setBasePrice((prev) => Math.max(10, Math.min(999, prev + delta)));
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (!isNaN(val)) {
      setBasePrice(Math.max(0, Math.min(999, val)));
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
              const isSelected = basePrice === price && !showCustomBox;
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
                ₹{basePrice}
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
                  value={basePrice || ''}
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
                  onClick={() => setBasePrice(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                    basePrice === p
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

        {/* Extras: reusable catalog of custom-priced add-ons (extra chapati, extra dabba, etc.) */}
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[13px] text-[#5a4138] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-[#a33900]">add_shopping_cart</span>
              {language === 'mr' ? 'Extras (जास्तीचे पदार्थ) निवडा' : 'Select Extras'}
            </span>
            <button
              type="button"
              onClick={() => setShowAddExtraForm((v) => !v)}
              className="text-[12px] font-bold text-[#a33900] underline underline-offset-2 flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[15px]">add_circle</span>
              <span>{language === 'mr' ? 'नवीन Extra जोडा' : 'Add New Extra'}</span>
            </button>
          </div>

          {extraItems.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {extraItems.map((item) => {
                const isChecked = selectedExtraNames.includes(item.name);
                return (
                  <div key={item.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => toggleExtra(item.name)}
                      className={`flex items-center gap-1.5 pl-2.5 pr-7 py-2 rounded-xl border font-label-sm text-[12.5px] font-bold transition-all active:scale-95 ${
                        isChecked
                          ? 'bg-[#a33900] text-white border-[#a33900] shadow-sm'
                          : 'bg-[#eff4ff] text-[#0b1c30] border-[#dce9ff] hover:bg-[#dce9ff]'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-[4px] border-2 flex items-center justify-center ${
                          isChecked ? 'border-white bg-white/20' : 'border-[#5a4138]'
                        }`}
                      >
                        {isChecked && <span className="material-symbols-outlined text-[11px] leading-none">check</span>}
                      </span>
                      <span>{item.name}</span>
                      <span className={isChecked ? 'text-white/85' : 'text-[#a33900]'}>+₹{item.price}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={language === 'mr' ? 'Extra काढा' : 'Remove extra'}
                      onClick={() => {
                        setSelectedExtraNames((prev) => prev.filter((n) => n !== item.name));
                        onDeleteExtraItem(item.id);
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[#ba1a1a] bg-white/90 hover:bg-[#ffdad6] active:scale-90"
                      title={language === 'mr' ? 'Catalog मधून कायमचे काढा' : 'Remove permanently from catalog'}
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {showAddExtraForm && (
            <div className="bg-[#f8faff] p-2.5 rounded-xl border border-[#dce9ff] flex items-center gap-2">
              <input
                type="text"
                value={newExtraName}
                onChange={(e) => setNewExtraName(e.target.value)}
                placeholder={language === 'mr' ? 'नाव (उदा. जास्तीची चपाती)' : 'Name (e.g. Extra chapati)'}
                className="flex-1 h-10 px-2.5 rounded-lg bg-white text-[#0b1c30] font-body-sm text-[12.5px] border border-[#dce9ff] focus:outline-none focus:border-[#a33900] placeholder:text-[#5a4138]/50"
              />
              <input
                type="number"
                min="1"
                value={newExtraPrice}
                onChange={(e) => setNewExtraPrice(e.target.value)}
                placeholder={language === 'mr' ? 'किंमत' : 'Price'}
                className="w-20 h-10 px-2 rounded-lg bg-white text-[#0b1c30] font-body-sm text-[12.5px] border border-[#dce9ff] focus:outline-none focus:border-[#a33900] placeholder:text-[#5a4138]/50"
              />
              <button
                type="button"
                onClick={handleAddExtraItem}
                className="h-10 px-3 rounded-lg bg-[#a33900] text-white font-label-sm text-[12.5px] font-bold active:scale-95"
              >
                {language === 'mr' ? 'जोडा' : 'Add'}
              </button>
            </div>
          )}

          {extrasTotal > 0 && (
            <div className="flex items-center justify-between bg-[#fff3e0] px-3 py-2 rounded-xl">
              <span className="font-label-sm text-[12px] text-[#8d4b00] font-semibold">
                {language === 'mr' ? `डबा ₹${basePrice} + Extras ₹${extrasTotal}` : `Tiffin ₹${basePrice} + Extras ₹${extrasTotal}`}
              </span>
              <span className="font-label-md text-[13px] text-[#a33900] font-bold">
                {language === 'mr' ? 'एकूण:' : 'Total:'} ₹{selectedPrice}
              </span>
            </div>
          )}
        </div>

        {/* Optional note - any additional remark not covered by an Extra item */}
        <div className="mb-4">
          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-[12px] text-[#5a4138] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#a33900]">edit_note</span>
              {language === 'mr' ? 'अतिरिक्त टीप - ऐच्छिक' : 'Additional Note - Optional'}
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={language === 'mr' ? 'उदा. उशिरा दिला, विशेष विनंती' : 'e.g. Delivered late, special request'}
              className="h-11 px-3 rounded-xl bg-[#eff4ff] text-[#0b1c30] font-body-md text-[13px] border border-[#dce9ff] focus:outline-none focus:border-[#a33900] placeholder:text-[#5a4138]/50"
            />
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Primary: डबा दिला */}
          <button
            type="button"
            onClick={() => onConfirmDelivery(selectedPrice, selectedDiet, note.trim() || undefined, selectedExtras)}
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
