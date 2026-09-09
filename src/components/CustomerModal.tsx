import React, { useState, useEffect } from 'react';
import { Customer, MealTiming, DietType } from '../types';
import { useLanguage } from '../utils/LanguageContext';

interface CustomerModalProps {
  isOpen: boolean;
  customerToEdit: Customer | null;
  onClose: () => void;
  onSaveCustomer: (customerData: Partial<Customer>) => void;
  onDeleteCustomer?: (customerId: string) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  customerToEdit,
  onClose,
  onSaveCustomer,
  onDeleteCustomer,
}) => {
  const [mode, setMode] = useState<'new' | 'edit'>(customerToEdit ? 'edit' : 'new');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [mealTiming, setMealTiming] = useState<MealTiming>('both');
  const [rate, setRate] = useState<number>(70);
  const [dietType, setDietType] = useState<DietType>('veg');
  const [specialNote, setSpecialNote] = useState('');
  const { language, t } = useLanguage();

  useEffect(() => {
    if (customerToEdit) {
      setMode('edit');
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone);
      setAddress(customerToEdit.address);
      setMealTiming(customerToEdit.mealTiming);
      setRate(customerToEdit.ratePerTiffin || 70);
      setDietType(customerToEdit.dietType || 'veg');
      setSpecialNote(customerToEdit.specialNote || '');
    } else {
      setMode('new');
      setName('');
      setPhone('');
      setAddress('');
      setMealTiming('both');
      setRate(70);
      setDietType('veg');
      setSpecialNote('');
    }
  }, [customerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert(language === 'mr' ? 'कृपया ग्राहकाचे नाव प्रविष्ट करा' : 'Please enter customer name');
      return;
    }

    const timingLabelMap: Record<MealTiming, string> = {
      both: language === 'mr' ? 'दोन वेळ (सकाळ + संध्याकाळ)' : 'Both Times (Morning + Night)',
      morning: language === 'mr' ? 'फक्त दुपार डबा' : 'Morning Only',
      night: language === 'mr' ? 'फक्त संध्याकाळ डबा' : 'Evening Only',
    };

    onSaveCustomer({
      name: name.trim(),
      initial: name.trim().slice(0, 1),
      phone: phone.trim() || '9876543210',
      address: address.trim() || 'पुणे',
      shortAddress: address.split(',')[0] || 'पुणे',
      mealTiming,
      mealTimingLabel: timingLabelMap[mealTiming],
      ratePerTiffin: Number(rate) || 70,
      dietType,
      specialNote: specialNote.trim() || (language === 'mr' ? 'साधा डबा' : 'Standard'),
      monthlyCharge: `₹${(Number(rate) || 70) * (mealTiming === 'both' ? 48 : 24)} / ${language === 'mr' ? 'महिना' : 'month'}`,
      status: 'active',
      avatarBg: 'bg-primary/10 text-[#a33900]',
    });

    onClose();
  };

  const handleDelete = () => {
    if (customerToEdit && onDeleteCustomer) {
      if (confirm(t('deleteConfirm'))) {
        onDeleteCustomer(customerToEdit.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Dimmed Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-up Bottom Sheet Container */}
      <div className="relative w-full max-w-md bg-[#ffffff] rounded-t-3xl shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Top Drag Handle */}
        <div className="w-full flex items-center justify-center pt-3 pb-1 cursor-grab">
          <div className="w-12 h-1.5 rounded-full bg-[#e2bfb2]/60"></div>
        </div>

        {/* Scrollable Sheet Content */}
        <div className="overflow-y-auto px-4 pb-8 flex flex-col gap-4 no-scrollbar">
          {/* Header Row & Mode Segment Switcher */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 bg-[#e5eeff] p-1 rounded-full">
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`px-3.5 py-1 rounded-full font-label-md text-[13px] transition-all flex items-center gap-1 ${
                  mode === 'new'
                    ? 'bg-[#a33900] text-white shadow-sm font-semibold'
                    : 'text-[#5a4138] hover:text-[#0b1c30]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>{t('customerModalTitleNew')}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`px-3.5 py-1 rounded-full font-label-md text-[13px] transition-all flex items-center gap-1 ${
                  mode === 'edit'
                    ? 'bg-[#a33900] text-white shadow-sm font-semibold'
                    : 'text-[#5a4138] hover:text-[#0b1c30]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>{t('customerModalTitleEdit')}</span>
              </button>
            </div>

            <button
              type="button"
              aria-label={t('cancel')}
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#5a4138] hover:bg-[#dce9ff] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Context Banner */}
          <div className="bg-[#ffdbce]/50 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#a33900] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[18px]">lunch_dining</span>
            </div>
            <p className="font-body-sm text-[12px] text-[#370e00] leading-tight">
              {language === 'mr'
                ? 'नवीन ग्राहक जोडल्यावर आजच्या सकाळ/संध्याकाळ वितरण यादीत लगेच डबा दिसेल.'
                : 'After adding a new customer, their tiffin will immediately appear in today’s delivery schedule.'}
            </p>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Field 1: Customer Name */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-lg text-[13px] text-[#0b1c30] font-semibold flex items-center justify-between">
                <span>
                  {t('fullName')} <span className="text-[#ba1a1a]">*</span>
                </span>
                <span className="font-body-sm text-[11px] text-[#5a4138] font-normal">
                  {language === 'mr' ? 'आवश्यक' : 'Required'}
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[#5a4138] text-[20px] pointer-events-none">
                  person
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full h-12 pl-11 pr-4 bg-[#eff4ff] rounded-xl font-body-lg text-[15px] text-[#0b1c30] placeholder:text-[#5a4138]/50 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#a33900]/30 focus:outline-none shadow-xs transition-colors"
                />
              </div>
            </div>

            {/* Field 2: Mobile Number */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-lg text-[13px] text-[#0b1c30] font-semibold flex items-center justify-between">
                <span>
                  {t('phone')} <span className="text-[#ba1a1a]">*</span>
                </span>
                <span className="font-label-sm text-[11px] text-[#006e2d] flex items-center gap-0.5 font-bold">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  {language === 'mr' ? 'वैध क्रमांक' : 'Valid mobile'}
                </span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[#5a4138] text-[20px] pointer-events-none">
                  phone
                </span>
                <span className="absolute left-10 font-label-lg text-[13px] text-[#5a4138]/80 pointer-events-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="w-full h-12 pl-20 pr-4 bg-[#eff4ff] rounded-xl font-body-lg text-[15px] text-[#0b1c30] placeholder:text-[#5a4138]/50 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#a33900]/30 focus:outline-none shadow-xs transition-colors"
                />
              </div>
              <p className="font-body-sm text-[11px] text-[#5a4138] flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[15px] text-[#006e2d]">chat</span>
                <span>
                  {language === 'mr'
                    ? 'WhatsApp वर दरमहा बिल आणि सुट्टीची नोंद पाठवली जाईल'
                    : 'Monthly bills and invoices will be shared on WhatsApp'}
                </span>
              </p>
            </div>

            {/* Field 3: Address / Delivery Area */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-lg text-[13px] text-[#0b1c30] font-semibold">
                {t('address')} <span className="text-[#ba1a1a]">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-[#5a4138] text-[20px] pointer-events-none">
                  location_on
                </span>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('addressPlaceholder')}
                  className="w-full py-2.5 pl-11 pr-4 bg-[#eff4ff] rounded-xl font-body-md text-[14px] text-[#0b1c30] placeholder:text-[#5a4138]/50 focus:bg-[#ffffff] focus:ring-2 focus:ring-[#a33900]/30 focus:outline-none shadow-xs transition-colors resize-none"
                />
              </div>
            </div>

            {/* Field 4: Meal Timing Preference Chips */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-lg text-[13px] text-[#0b1c30] font-semibold">
                {t('mealTimingHeading')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMealTiming('both')}
                  className={`py-2 px-1 rounded-xl font-label-md text-[13px] flex flex-col items-center justify-center gap-1 transition-all ${
                    mealTiming === 'both'
                      ? 'bg-[#a33900] text-white font-bold shadow-sm'
                      : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">routine</span>
                  <span>{t('mealTimingBoth')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMealTiming('morning')}
                  className={`py-2 px-1 rounded-xl font-label-md text-[13px] flex flex-col items-center justify-center gap-1 transition-all ${
                    mealTiming === 'morning'
                      ? 'bg-[#a33900] text-white font-bold shadow-sm'
                      : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#8d4b00]">light_mode</span>
                  <span>{t('mealTimingMorning')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMealTiming('night')}
                  className={`py-2 px-1 rounded-xl font-label-md text-[13px] flex flex-col items-center justify-center gap-1 transition-all ${
                    mealTiming === 'night'
                      ? 'bg-[#a33900] text-white font-bold shadow-sm'
                      : 'bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#5a4138]">dark_mode</span>
                  <span>{t('mealTimingNight')}</span>
                </button>
              </div>
            </div>

            {/* Field 5: Rate Per Tiffin & Diet Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-[13px] text-[#0b1c30] font-medium">
                  {t('ratePerTiffinField')}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-[#5a4138] text-[18px] pointer-events-none">
                    currency_rupee
                  </span>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full h-11 pl-9 pr-3 bg-[#eff4ff] rounded-xl font-headline-sm text-[16px] text-[#0b1c30] focus:bg-[#ffffff] focus:outline-none shadow-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-[13px] text-[#0b1c30] font-medium">
                  {t('dietTypeField')}
                </label>
                <div className="h-11 bg-[#eff4ff] rounded-xl flex items-center px-1 justify-around gap-1">
                  <button
                    type="button"
                    onClick={() => setDietType('veg')}
                    className={`font-label-md text-[12px] px-4 py-1 rounded-full flex items-center gap-1 transition-all ${
                      dietType === 'veg'
                        ? 'bg-[#7cf994] text-[#007230] font-bold shadow-xs'
                        : 'text-[#5a4138]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#006e2d]"></span> {t('dietVeg')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDietType('non-veg')}
                    className={`font-label-md text-[12px] px-4 py-1 rounded-full flex items-center gap-1 transition-all ${
                      dietType === 'non-veg'
                        ? 'bg-[#ffcdd2] text-[#b71c1c] font-bold shadow-xs'
                        : 'text-[#5a4138]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#b71c1c]"></span> {t('dietNonVeg')}
                  </button>
                </div>
              </div>
            </div>

            {/* Special Preferences Note */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-[13px] text-[#0b1c30] font-medium">
                {t('specialNoteField')}
              </label>
              <input
                type="text"
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder={t('specialNotePlaceholder')}
                className="w-full h-11 px-3 bg-[#eff4ff] rounded-xl font-body-md text-[14px] text-[#0b1c30] focus:bg-[#ffffff] focus:outline-none shadow-xs"
              />
            </div>

            {/* Primary & Contextual Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {/* Primary Save Action Button */}
              <button
                type="submit"
                className="w-full h-12 rounded-full bg-[#a33900] text-white font-headline-sm text-[16px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#a33900]/25 hover:opacity-95 active:scale-[0.99] transition-all"
              >
                <span className="material-symbols-outlined text-[22px]">task_alt</span>
                <span>{t('saveCustomerBtn')}</span>
              </button>

              {/* Edit Mode Permanent Delete Action */}
              {customerToEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full h-11 rounded-full bg-[#ffdad6] text-[#93000a] font-label-lg text-[14px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#ffdad6]/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  <span>{t('deleteCustomerBtn')}</span>
                </button>
              )}

              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-1.5 text-center font-label-md text-[13px] text-[#5a4138] hover:text-[#0b1c30] transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
