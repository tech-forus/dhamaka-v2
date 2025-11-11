// src/pages/AddVendor.tsx

/**
 * AddVendor v2 - Main Page Orchestrator
 * Clean, modular implementation for vendor onboarding
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

// Hooks
import { useVendorBasics } from '../hooks/useVendorBasics';
import { usePincodeLookup } from '../hooks/usePincodeLookup';
import { useVolumetric } from '../hooks/useVolumetric';
import { useCharges } from '../hooks/useCharges';
import { useZoneRates } from '../hooks/useZoneRates';

// Components
import { CompanySection } from '../components/CompanySection';
import { TransportSection } from '../components/TransportSection';
import { PriceConfig } from '../components/price-config';
import { ZoneRatesEditor } from '../components/ZoneRatesEditor';
import { PriceChartUpload } from '../components/PriceChartUpload';
import { SavedVendorsTable } from '../components/SavedVendorsTable';

// Services & Utils
// (Removed old postVendor call; we build FormData here)
import { TemporaryTransporter } from '../utils/validators';
import { readDraft, clearDraft } from '../store/draftStore';
import { emitDebug, emitDebugError } from '../utils/debug';

// Icons
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// =============================================================================
// CONFIG / HELPERS
// =============================================================================

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

function getAuthToken(): string {
  return (
    Cookies.get('authToken') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    ''
  );
}

function base64UrlToJson<T = any>(b64url: string): T | null {
  try {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
    const json = atob(b64);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function getCustomerIDFromToken(): string {
  const token = getAuthToken();
  if (!token || token.split('.').length < 2) return '';
  const payload = base64UrlToJson<Record<string, any>>(token.split('.')[1]) || {};
  // Try common locations
  const id =
    payload?.customer?._id ||
    payload?.user?._id ||
    payload?._id ||
    payload?.id ||
    payload?.customerId ||
    payload?.customerID ||
    '';
  // Debug once so you can see the payload shape
  console.debug('[AddVendor] JWT payload keys:', Object.keys(payload || {}));
  if (typeof payload?.customer === 'object') {
    console.debug('[AddVendor] payload.customer keys:', Object.keys(payload.customer));
  }
  return id || '';
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const AddVendor: React.FC = () => {
  // Hooks
  const vendorBasics = useVendorBasics();
  const pincodeLookup = usePincodeLookup();
  const volumetric = useVolumetric();
  const charges = useCharges();
  const zoneRates = useZoneRates();

  // Local state
  const [transportMode, setTransportMode] = useState<'road' | 'air' | 'rail' | 'ship'>('road');
  const [priceChartFile, setPriceChartFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Token viewer state
  const [tokenPanelOpen, setTokenPanelOpen] = useState(false);
  const [tokenValue, setTokenValue] = useState<string>('');
  const [tokenPayload, setTokenPayload] = useState<any>(null);

  const navigate = useNavigate();

  // Load draft on mount
  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      emitDebug('DRAFT_LOADED_ON_MOUNT', draft);

      if (draft.basics) {
        vendorBasics.loadFromDraft(draft.basics);
        if (draft.basics.transportMode) setTransportMode(draft.basics.transportMode);
      }
      if (draft.geo) pincodeLookup.loadFromDraft(draft.geo);
      if (draft.volumetric) volumetric.loadFromDraft(draft.volumetric);
      if (draft.charges) charges.loadFromDraft(draft.charges);
      if (draft.zoneRates) zoneRates.loadFromDraft(draft.zoneRates);

      toast.success('Draft restored', { duration: 2000 });
    }
  }, []);

  // Validate all sections
  const validateAll = (): boolean => {
    emitDebug('VALIDATION_START');

    let isValid = true;
    const errors: string[] = [];

    if (!vendorBasics.validateAll()) {
      errors.push('Company information is incomplete or invalid');
      isValid = false;
    }

    if (!pincodeLookup.validateGeo()) {
      errors.push('Location information is incomplete');
      isValid = false;
    }

    if (!volumetric.validateVolumetric()) {
      errors.push('Volumetric configuration is invalid');
      isValid = false;
    }

    if (!charges.validateAll()) {
      errors.push('Charges configuration is invalid');
      isValid = false;
    }

    if (!zoneRates.validateZoneRates()) {
      errors.push('Zone rate matrix is incomplete or invalid');
      isValid = false;
    }

    if (!isValid) {
      emitDebugError('VALIDATION_FAILED', { errors });
      errors.forEach((err) => toast.error(err, { duration: 4000 }));
    } else {
      emitDebug('VALIDATION_PASSED');
    }

    return isValid;
  };

  // Show Token panel
  const handleShowToken = () => {
    const tok = getAuthToken();
    if (!tok) {
      toast.error('No token found (login again?)');
      setTokenPanelOpen(true);
      setTokenValue('');
      setTokenPayload(null);
      return;
    }
    const payload = tok.split('.').length >= 2 ? base64UrlToJson(tok.split('.')[1]) : null;
    setTokenValue(tok);
    setTokenPayload(payload);
    setTokenPanelOpen(true);
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  // Handle form submission (multipart with required fields)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) return;
    setIsSubmitting(true);

    try {
      // Normalize zone rates before submission
      const normalizedZoneRates = zoneRates.normalizeAndValidate();
      if (!normalizedZoneRates) {
        toast.error('Failed to normalize zone rates');
        setIsSubmitting(false);
        return;
      }

      // Build vendor object
      const vendor: Omit<TemporaryTransporter, 'priceChartFileId'> = {
        companyName: vendorBasics.basics.companyName,
        contactPersonName: vendorBasics.basics.contactPersonName,
        vendorPhoneNumber: vendorBasics.basics.vendorPhoneNumber,
        vendorEmailAddress: vendorBasics.basics.vendorEmailAddress,
        gstin: vendorBasics.basics.gstin || undefined,
        legalCompanyName: vendorBasics.basics.legalCompanyName,
        displayName: vendorBasics.basics.displayName,
        subVendor: vendorBasics.basics.subVendor,
        vendorCode: vendorBasics.basics.vendorCode,
        primaryContactName: vendorBasics.basics.primaryContactName,
        primaryContactPhone: vendorBasics.basics.primaryContactPhone,
        primaryContactEmail: vendorBasics.basics.primaryContactEmail,
        address: vendorBasics.basics.address,
        transportMode,
        volumetric: volumetric.volumetric,
        charges: charges.charges,
        geo: {
          pincode: pincodeLookup.geo.pincode!,
          state: pincodeLookup.geo.state!,
          city: pincodeLookup.geo.city!,
        },
        zoneRates: zoneRates.zoneRates,
        sources: { createdFrom: 'AddVendor v2' },
        status: 'submitted',
      };

      emitDebug('SUBMIT_PAYLOAD', {
        companyName: vendor.companyName,
        transportMode: vendor.transportMode,
        hasPriceChart: !!priceChartFile,
        zoneRateCount: Object.keys(vendor.zoneRates).length,
      });

      // === Backend requires exactly these ===
      const customerID = getCustomerIDFromToken();
      if (!customerID) {
        emitDebugError('SUBMIT_ERROR_NO_CUSTOMER_ID', {});
        toast.error('No customerID found in token');
        setIsSubmitting(false);
        return;
      }

      // If you have a real priceRate field, use it. For now, send "0".
      const priceRate = String(0);

      // Ensure a file is sent (BE currently requires it). If none, attach small placeholder.
      let fileToSend = priceChartFile as File | null;
      if (!fileToSend) {
        const blob = new Blob(
          [JSON.stringify({ placeholder: true, companyName: vendor.companyName }, null, 2)],
          { type: 'application/json' }
        );
        fileToSend = new File([blob], `placeholder-${Date.now()}.json`, { type: 'application/json' });
      }

      // Build FormData exactly as the backend expects
      const fd = new FormData();
      fd.append('customerID', customerID);                    // exact casing
      fd.append('companyName', vendor.companyName.trim());
      fd.append('priceRate', priceRate);
      fd.append('priceChart', fileToSend);                    // must be a File
      // keep your full vendor json too (optional for BE parsing)
      fd.append('vendorJson', JSON.stringify(vendor));

      // Debug: verify what we send
      for (const [k, v] of fd.entries()) {
        emitDebug('FORMDATA_ENTRY', { key: k, value: v instanceof File ? v.name : String(v) });
      }

      const token = getAuthToken();
      const url = `${API_BASE}/api/transporter/addtiedupcompanies`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // do NOT set Content-Type
        body: fd,
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok || !json?.success) {
        emitDebugError('SUBMIT_ERROR', { status: res.status, json });
        toast.error(json?.message || `Failed to create vendor (${res.status})`, { duration: 5000 });
        setIsSubmitting(false);
        return;
      }

      // Success flow
      emitDebug('SUBMIT_SUCCESS', {
        vendorId: json.data?._id,
        companyName: json.data?.companyName,
      });

      toast.success('Vendor created successfully!', { duration: 4000 });

      // Clear draft + reset
      clearDraft();
      vendorBasics.reset();
      pincodeLookup.reset();
      volumetric.reset();
      charges.reset();
      zoneRates.reset();
      setPriceChartFile(null);

      // Refresh table
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      emitDebugError('SUBMIT_EXCEPTION', {
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('An unexpected error occurred. Please try again.', { duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (!confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) return;

    vendorBasics.reset();
    pincodeLookup.reset();
    volumetric.reset();
    charges.reset();
    zoneRates.reset();
    setPriceChartFile(null);
    clearDraft();

    toast.success('Form reset', { duration: 2000 });
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Add Vendor (v2)</h1>
            <p className="mt-2 text-sm text-slate-600">
              Create a new temporary transporter with comprehensive pricing configuration
            </p>
          </div>

          {/* Show Token */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShowToken}
              className="px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              title="Show current auth token & payload"
            >
              Show Token
            </button>
          </div>
        </div>

        {/* Token panel */}
        {tokenPanelOpen && (
          <div className="mb-6 rounded-lg border border-slate-300 bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-slate-800">Current Auth Token</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyText(tokenValue)}
                  className="px-2 py-1 text-xs rounded-md border border-slate-300 hover:bg-slate-50"
                >
                  Copy token
                </button>
                <button
                  type="button"
                  onClick={() => copyText(JSON.stringify(tokenPayload, null, 2))}
                  className="px-2 py-1 text-xs rounded-md border border-slate-300 hover:bg-slate-50"
                >
                  Copy payload
                </button>
                <button
                  type="button"
                  onClick={() => setTokenPanelOpen(false)}
                  className="px-2 py-1 text-xs rounded-md border border-slate-300 hover:bg-slate-50"
                >
                  Hide
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-700 break-all">
              <div className="mb-2">
                <span className="font-mono font-semibold mr-2">Token:</span>
                <span className="font-mono">{tokenValue || '(empty)'}</span>
              </div>
              <div className="mt-3">
                <div className="font-mono font-semibold mb-1">Decoded Payload:</div>
                <pre className="whitespace-pre-wrap font-mono bg-slate-900 text-slate-100 p-3 rounded-md overflow-x-auto">
{JSON.stringify(tokenPayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Section */}
          <CompanySection
            vendorBasics={vendorBasics}
            pincodeLookup={pincodeLookup}
          />

          {/* Transport Section */}
          <TransportSection
            volumetric={volumetric}
            transportMode={transportMode}
            onTransportModeChange={setTransportMode}
          />

          {/* Charges Section - New Grid Layout */}
          <PriceConfig charges={charges} />

          {/* Zone Rates Editor */}
          <ZoneRatesEditor zoneRates={zoneRates} />

          {/* Price Chart Upload */}
          <PriceChartUpload
            file={priceChartFile}
            onFileChange={setPriceChartFile}
          />

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-4 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg
                         hover:bg-slate-300 transition-colors flex items-center gap-2"
            >
              <XCircleIcon className="w-5 h-5" />
              Reset Form
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg
                         hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed
                         transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  Save Vendor
                </>
              )}
            </button>
          </div>
        </form>

        {/* Saved Vendors Table */}
        <div className="mt-8">
          <SavedVendorsTable refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
};

export default AddVendor;
