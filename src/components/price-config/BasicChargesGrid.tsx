/**
 * BasicChargesGrid - Top 4-column grid
 * Compact input cards for simple charges
 */

import React from 'react';
import { UseChargesReturn } from '../../hooks/useCharges';
import { FUEL_SURCHARGE_OPTIONS, CHARGE_MAX } from '../../utils/validators';

interface BasicChargesGridProps {
  charges: UseChargesReturn;
}

interface SimpleFieldProps {
  label: string;
  id: string;
  value: number;
  onChange: (val: number) => void;
  onBlur: () => void;
  error?: string;
  suffix?: string;
  max?: number;
  maxLength?: number;
  isDropdown?: boolean;
  dropdownOptions?: readonly number[];
}

const SimpleField: React.FC<SimpleFieldProps> = ({
  label,
  id,
  value,
  onChange,
  onBlur,
  error,
  suffix = '₹',
  max = CHARGE_MAX,
  maxLength,
  isDropdown,
  dropdownOptions,
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
    <div className="basic-field">
      <label htmlFor={id} className="basic-field-label">
        {label}
      </label>

      <div className="basic-input-row">
        {isDropdown && dropdownOptions ? (
          <select
            id={id}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            className={`basic-input basic-select ${error ? 'input-error' : ''}`}
            aria-invalid={!!error}
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
              id={id}
              value={value}
              onChange={handleChange}
              onBlur={onBlur}
              min={1}
              max={max}
              maxLength={maxLength}
              step="0.01"
              className={`basic-input ${error ? 'input-error' : ''}`}
              placeholder="0.00"
              aria-invalid={!!error}
            />
            {suffix && <span className="input-suffix">{suffix}</span>}
          </>
        )}
      </div>

      {error && <p className="field-error">{error}</p>}
    </div>
  );
};

export const BasicChargesGrid: React.FC<BasicChargesGridProps> = ({ charges }) => {
  const { charges: chargeValues, errors, setCharge, validateField } = charges;

  return (
    <div className="basic-charges-grid">
      {/* Docket Charges */}
      <SimpleField
        label="DOCKET CHARGES (₹)"
        id="docketCharges"
        value={chargeValues.docketCharges}
        onChange={(val) => setCharge('docketCharges', val)}
        onBlur={() => validateField('docketCharges')}
        error={errors.docketCharges}
        suffix="₹"
        max={CHARGE_MAX}
        maxLength={5}
      />

      {/* Min Weight */}
      <SimpleField
        label="MIN CHARGEABLE WEIGHT"
        id="minWeightKg"
        value={chargeValues.minWeightKg}
        onChange={(val) => setCharge('minWeightKg', val)}
        onBlur={() => validateField('minWeightKg')}
        error={errors.minWeightKg}
        suffix="KG"
        max={CHARGE_MAX}
        maxLength={5}
      />

      {/* Min Charges */}
      <SimpleField
        label="MINIMUM CHARGES (₹)"
        id="minCharges"
        value={chargeValues.minCharges}
        onChange={(val) => setCharge('minCharges', val)}
        onBlur={() => validateField('minCharges')}
        error={errors.minCharges}
        suffix="₹"
        max={CHARGE_MAX}
        maxLength={5}
      />

      {/* Hamali Charges */}
      <SimpleField
        label="HAMALI CHARGES (₹)"
        id="hamaliCharges"
        value={chargeValues.hamaliCharges}
        onChange={(val) => setCharge('hamaliCharges', val)}
        onBlur={() => validateField('hamaliCharges')}
        error={errors.hamaliCharges}
        suffix="₹"
        max={CHARGE_MAX}
        maxLength={5}
      />

      {/* Green Tax */}
      <SimpleField
        label="GREEN TAX / NGT (₹)"
        id="greenTax"
        value={chargeValues.greenTax}
        onChange={(val) => setCharge('greenTax', val)}
        onBlur={() => validateField('greenTax')}
        error={errors.greenTax}
        suffix="₹"
        max={CHARGE_MAX}
        maxLength={5}
      />

      {/* Misc Charges */}
      <SimpleField
        label="MISC / AOC CHARGES (₹)"
        id="miscCharges"
        value={chargeValues.miscCharges}
        onChange={(val) => setCharge('miscCharges', val)}
        onBlur={() => validateField('miscCharges')}
        error={errors.miscCharges}
        suffix="₹"
        max={CHARGE_MAX}
        maxLength={5}
      />

      {/* Fuel Surcharge */}
      <SimpleField
        label="FUEL SURCHARGE"
        id="fuelSurchargePct"
        value={chargeValues.fuelSurchargePct}
        onChange={(val) => setCharge('fuelSurchargePct', val)}
        onBlur={() => validateField('fuelSurchargePct')}
        error={errors.fuelSurchargePct}
        suffix="%"
        max={40}
        isDropdown
        dropdownOptions={FUEL_SURCHARGE_OPTIONS}
      />

      {/* DACC Charges */}
      <SimpleField
        label="DACC CHARGES (₹)"
        id="daccCharges"
        value={chargeValues.daccCharges || 0}
        onChange={(val) => setCharge('daccCharges', val)}
        onBlur={() => validateField('daccCharges')}
        error={errors.daccCharges}
        suffix="₹"
        max={CHARGE_MAX}
        maxLength={5}
      />
    </div>
  );
};
