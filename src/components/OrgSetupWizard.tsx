import React, { useState } from 'react';
import { Organization } from '../types/finance';
import { OrgService } from '../services/orgService';
import {
  Wrench,
  Building2,
  MapPin,
  Phone,
  Mail,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';

interface OrgSetupWizardProps {
  onSetupComplete: (org: Organization) => void;
  initialOrg?: Organization | null;
  isEditing?: boolean;
  onCancel?: () => void;
}

export const OrgSetupWizard: React.FC<OrgSetupWizardProps> = ({
  onSetupComplete,
  initialOrg,
  isEditing = false,
  onCancel,
}) => {
  const [name, setName] = useState(initialOrg?.name || '');
  const [address, setAddress] = useState(initialOrg?.address || '');
  const [phone, setPhone] = useState(initialOrg?.phone || '');
  const [email, setEmail] = useState(initialOrg?.email || '');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(initialOrg?.logoUrl);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Logo file upload handler compatible with Web and Android
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, SVG).');
      return;
    }

    // Limit logo size to 1.5MB for snappy localStorage & PDF export
    if (file.size > 1.5 * 1024 * 1024) {
      setErrorMessage('Logo size should be less than 1.5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoUrl(result);
      setErrorMessage(null);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read logo image.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = name.trim();
    const cleanAddress = address.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setErrorMessage('Workshop / Organization name is required.');
      return;
    }
    if (!cleanAddress) {
      setErrorMessage('Business address is required.');
      return;
    }
    if (!cleanPhone) {
      setErrorMessage('Contact phone number is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const orgId = initialOrg?.id || `ORG-${Date.now().toString(36).toUpperCase()}`;
      const newOrg: Organization = {
        id: orgId,
        name: cleanName,
        address: cleanAddress,
        phone: cleanPhone,
        email: email.trim() || undefined,
        logoUrl: logoUrl,
        currency: 'PKR',
        timezone: 'Asia/Karachi',
        createdAt: initialOrg?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Persistently store
      OrgService.saveActiveOrg(newOrg);
      onSetupComplete(newOrg);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save organization setup.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick preset helper for Sattar Auto
  const fillSattarPreset = () => {
    setName('Sattar Auto Mobile & Electrical Services');
    setAddress('Main Automobile Market, Badami Bagh, Lahore, Pakistan');
    setPhone('+92 300 1234567');
    setEmail('sattarauto@gmail.com');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-md space-y-6 animate-fadeIn">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 items-center justify-center text-amber-400 shadow-xl shadow-amber-500/5 mb-1">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-100 uppercase">
              {isEditing ? 'Workshop Settings' : 'Organization Setup'}
            </h1>
            <p className="text-xs text-amber-400 font-semibold tracking-wide uppercase mt-0.5">
              {isEditing ? 'Update Workshop Profile' : 'Configure Your Workshop'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
              {isEditing
                ? 'Update your organization details, logo, and contact info used across reports & PDFs.'
                : 'Welcome! Set up your automobile workshop details before accessing finances.'}
            </p>
          </div>
        </div>

        {/* Setup Card Form */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                {isEditing ? 'Organization Profile' : 'Step 1: Workshop Profile'}
              </span>
            </div>
            {!isEditing && (
              <button
                type="button"
                onClick={fillSattarPreset}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-medium underline"
              >
                Use Sattar Auto Preset
              </button>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 animate-slideDown">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Workshop Logo Upload & Preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Workshop Logo <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {logoUrl ? (
                    <>
                      <img
                        src={logoUrl}
                        alt="Workshop Logo"
                        className="w-full h-full object-contain p-1"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        title="Remove Logo"
                        className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer border border-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml, image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500">
                    PNG, JPG, or SVG under 1.5MB. Displayed on Login & PDF Reports.
                  </p>
                </div>
              </div>
            </div>

            {/* Organization / Workshop Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Organization / Workshop Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sattar Auto Mobile & Electrical Services"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Business Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Business Address <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Main Automobile Market, Badami Bagh, Lahore"
                  className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Contact Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Contact Number <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Email Address <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. info@workshop.pk"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            {/* Fixed Standard Parameters */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Base Currency:</span>
                <span className="font-bold text-slate-200">PKR (Pakistani Rupee)</span>
              </div>
              <div className="flex justify-between">
                <span>Operational Timezone:</span>
                <span className="font-bold text-slate-200">Asia/Karachi</span>
              </div>
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="pt-2 flex items-center gap-2">
              {isEditing && onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <span>{isEditing ? 'Save Workshop Details' : 'Complete Setup & Proceed'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Security Assurance */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Persistent multi-workshop financial isolation & audit integrity</span>
        </div>
      </div>
    </div>
  );
};
