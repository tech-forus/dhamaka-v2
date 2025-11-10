/**
 * ChargesSection component
 * Mixed layout: Simple numeric inputs + Compact charge cards
 */

import React from 'react';
import { UseChargesReturn } from '../hooks/useCharges';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { FUEL_SURCHARGE_OPTIONS, CHARGE_MAX, ChargeCardData } from '../utils/validators';
import { CompactChargeCard } from './CompactChargeCard';

// =============================================================================
// PROPS
// =============================================================================

interface ChargesSectionProps {
  charges: UseChargesReturn;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface SimpleChargeFieldProps {
  label: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  onBlur: () => void;
  error?: string;
  min?: number;
  max?: number;
  suffix?: string;
  isDropdown?: boolean;
  dropdownOptions?: readonly number[];
  maxLength?: number;
}

const SimpleChargeField: React.FC<SimpleChargeFieldProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  min = 1,
  max = CHARGE_MAX,
  suffix = '₹',
  isDropdown = false,
  dropdownOptions,
  maxLength,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(0);
      return;
    }
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-xs font-semibold text-slate-600 uppercase tracking-wider"
      >
        {label}
      </label>

      <div className="relative mt-1">
        {isDropdown && dropdownOptions ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            className={`block w-full border rounded-lg shadow-sm px-3 py-2 text-sm text-slate-800
                       focus:outline-none focus:ring-1 focus:border-blue-500 transition bg-slate-50/70
                       ${
                         error
                           ? 'border-red-500 focus:ring-red-500'
                           : 'border-slate-300 focus:ring-blue-500'
                       }`}
          >
            {dropdownOptions.map((option) => (
              <option key={option} value={option}>
                {option}{suffix}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              type="number"
              id={name}
              name={name}
              value={value}
              onChange={handleChange}
              onBlur={onBlur}
              min={min}
              max={max}
              maxLength={maxLength}
              step="0.01"
              className={`block w-full border rounded-lg shadow-sm pl-3 pr-8 py-2 text-sm text-slate-800 placeholder-slate-400
                         focus:outline-none focus:ring-1 focus:border-blue-500 transition bg-slate-50/70
                         ${
                           error
                             ? 'border-red-500 focus:ring-red-500'
                             : 'border-slate-300 focus:ring-blue-500'
                         }`}
              placeholder="0.00"
              aria-invalid={!!error}
            />
            {suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">
                {suffix}
              </span>
            )}
          </>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ChargesSection: React.FC<ChargesSectionProps> = ({ charges }) => {
  const { charges: chargeValues, errors, setCharge, setCardField, validateField, validateCardField } = charges;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <CurrencyDollarIcon className="w-5 h-5 text-blue-500" />
        Basic Charges
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Docket Charges */}
        <SimpleChargeField
          label="Docket Charges"
          name="docketCharges"
          value={chargeValues.docketCharges}
          onChange={(val) => setCharge('docketCharges', val)}
          onBlur={() => validateField('docketCharges')}
          error={errors.docketCharges}
          suffix="₹"
          max={CHARGE_MAX}
          maxLength={5}
        />

        {/* Min Weight */}
        <SimpleChargeField
          label="Min Chargeable Weight"
          name="minWeightKg"
          value={chargeValues.minWeightKg}
          onChange={(val) => setCharge('minWeightKg', val)}
          onBlur={() => validateField('minWeightKg')}
          error={errors.minWeightKg}
          suffix="KG"
          max={CHARGE_MAX}
          maxLength={5}
        />

        {/* Min Charges */}
        <SimpleChargeField
          label="Minimum Charges"
          name="minCharges"
          value={chargeValues.minCharges}
          onChange={(val) => setCharge('minCharges', val)}
          onBlur={() => validateField('minCharges')}
          error={errors.minCharges}
          suffix="₹"
          max={CHARGE_MAX}
          maxLength={5}
        />

        {/* Hamali Charges */}
        <SimpleChargeField
          label="Hamali Charges"
          name="hamaliCharges"
          value={chargeValues.hamaliCharges}
          onChange={(val) => setCharge('hamaliCharges', val)}
          onBlur={() => validateField('hamaliCharges')}
          error={errors.hamaliCharges}
          suffix="₹"
          max={CHARGE_MAX}
          maxLength={5}
        />

        {/* Green Tax */}
        <SimpleChargeField
          label="Green Tax / NGT"
          name="greenTax"
          value={chargeValues.greenTax}
          onChange={(val) => setCharge('greenTax', val)}
          onBlur={() => validateField('greenTax')}
          error={errors.greenTax}
          suffix="₹"
          max={CHARGE_MAX}
          maxLength={5}
        />

        {/* Misc Charges */}
        <SimpleChargeField
          label="Misc / AOC Charges"
          name="miscCharges"
          value={chargeValues.miscCharges}
          onChange={(val) => setCharge('miscCharges', val)}
          onBlur={() => validateField('miscCharges')}
          error={errors.miscCharges}
          suffix="₹"
          max={CHARGE_MAX}
          maxLength={5}
        />

        {/* Fuel Surcharge */}
        <SimpleChargeField
          label="Fuel Surcharge"
          name="fuelSurchargePct"
          value={chargeValues.fuelSurchargePct}
          onChange={(val) => setCharge('fuelSurchargePct', val)}
          onBlur={() => validateField('fuelSurchargePct')}
          error={errors.fuelSurchargePct}
          suffix="%"
          max={40}
          isDropdown
          dropdownOptions={FUEL_SURCHARGE_OPTIONS}
        />

        {/* Handling Charges */}
        <CompactChargeCard
          title="Handling"
          tooltip="Material handling and processing charges"
          cardName="handlingCharges"
          data={chargeValues.handlingCharges as ChargeCardData}
          errors={errors.handlingCharges || {}}
          onFieldChange={(field, value) => setCardField('handlingCharges', field, value)}
          onFieldBlur={(field) => validateCardField('handlingCharges', field)}
        />

        {/* ROV / FOV Charges */}
        <CompactChargeCard
          title="ROV / FOV"
          tooltip="Risk of Value / Freight on Value charges for high-value shipments"
          cardName="rovCharges"
          data={chargeValues.rovCharges as ChargeCardData}
          errors={errors.rovCharges || {}}
          onFieldChange={(field, value) => setCardField('rovCharges', field, value)}
          onFieldBlur={(field) => validateCardField('rovCharges', field)}
        />

        {/* COD / DOD Charges */}
        <CompactChargeCard
          title="COD / DOD"
          tooltip="Cash on Delivery / Delivery on Demand service charges"
          cardName="codCharges"
          data={chargeValues.codCharges as ChargeCardData}
          errors={errors.codCharges || {}}
          onFieldChange={(field, value) => setCardField('codCharges', field, value)}
          onFieldBlur={(field) => validateCardField('codCharges', field)}
        />

        {/* To-Pay Charges */}
        <CompactChargeCard
          title="To-Pay"
          tooltip="Charges for to-pay shipments"
          cardName="toPayCharges"
          data={chargeValues.toPayCharges as ChargeCardData}
          errors={errors.toPayCharges || {}}
          onFieldChange={(field, value) => setCardField('toPayCharges', field, value)}
          onFieldBlur={(field) => validateCardField('toPayCharges', field)}
        />

        {/* Appointment Charges */}
        <CompactChargeCard
          title="Appointment"
          tooltip="Scheduled delivery appointment charges"
          cardName="appointmentCharges"
          data={chargeValues.appointmentCharges as ChargeCardData}
          errors={errors.appointmentCharges || {}}
          onFieldChange={(field, value) => setCardField('appointmentCharges', field, value)}
          onFieldBlur={(field) => validateCardField('appointmentCharges', field)}
        />
      </div>
    </div>
  );
};
