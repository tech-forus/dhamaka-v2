/**
 * AdvancedChargesGrid - Card grid with toggle pills
 * Contains 5 complex charge cards: Handling, ROV/FOV, COD/DOD, To-Pay, Appointment
 */

import React from 'react';
import { UseChargesReturn } from '../../hooks/useCharges';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import {
  ChargeCardData,
  Unit,
  Currency,
  Mode,
  VariableRange,
  UNIT_OPTIONS,
  VARIABLE_RANGES,
} from '../../utils/chargeValidators';

interface AdvancedChargesGridProps {
  charges: UseChargesReturn;
}

interface ChargeCardProps {
  title: string;
  tooltip: string;
  cardName: 'handlingCharges' | 'rovCharges' | 'codCharges' | 'toPayCharges' | 'appointmentCharges';
  data: ChargeCardData;
  errors: Record<string, string>;
  onFieldChange: (field: keyof ChargeCardData, value: any) => void;
  onFieldBlur: (field: keyof ChargeCardData) => void;
}

const ChargeCard: React.FC<ChargeCardProps> = ({
  title,
  tooltip,
  cardName,
  data,
  errors,
  onFieldChange,
  onFieldBlur,
}) => {
  // COD/DOD and To-Pay only support Fixed ₹ (no Variable %)
  const supportsVariablePercent = cardName !== 'codCharges' && cardName !== 'toPayCharges';

  const isFixedRupee = data.currency === 'INR' && data.mode === 'FIXED';
  const isVariablePercent = data.currency === 'PERCENT' && data.mode === 'VARIABLE';

  const showFixed = supportsVariablePercent ? isFixedRupee : true;
  const showVariable = isVariablePercent && supportsVariablePercent;

  return (
    <div className="charge-card">
      {/* Card Header with Toggle */}
      <div className="card-header">
        <div className="card-title-group">
          <h3 className="card-title">{title}</h3>
          {tooltip && (
            <div className="tooltip-wrapper">
              <InformationCircleIcon className="tooltip-icon" />
              <div className="tooltip-content">{tooltip}</div>
            </div>
          )}
        </div>

        {/* Toggle Pills - Fixed / Variable (only for supported cards) */}
        {supportsVariablePercent && (
          <div className="toggle-wrapper" role="tablist">
            <button
              type="button"
              role="tab"
              aria-pressed={isFixedRupee}
              aria-label="Fixed Rupees"
              onClick={() => {
                onFieldChange('currency', 'INR' as Currency);
                onFieldChange('mode', 'FIXED' as Mode);
              }}
              className={`toggle-button ${isFixedRupee ? 'active' : ''}`}
            >
              Fixed
            </button>
            <button
              type="button"
              role="tab"
              aria-pressed={isVariablePercent}
              aria-label="Variable Percentage"
              onClick={() => {
                onFieldChange('currency', 'PERCENT' as Currency);
                onFieldChange('mode', 'VARIABLE' as Mode);
              }}
              className={`toggle-button ${isVariablePercent ? 'active' : ''}`}
            >
              Variable
            </button>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="card-body">
        {/* Unit Selector (only for Handling Charges) */}
        {cardName === 'handlingCharges' && (
          <div className="card-field">
            <label htmlFor={`${cardName}-unit`} className="card-field-label">
              UNIT
            </label>
            <select
              id={`${cardName}-unit`}
              value={data.unit}
              onChange={(e) => onFieldChange('unit', e.target.value as Unit)}
              className="card-select"
              aria-label={`${title} unit`}
            >
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Fixed Rate Input */}
        {showFixed && (
          <div className="card-field">
            <label htmlFor={`${cardName}-fixed`} className="card-field-label">
              FIXED RATE (₹)
            </label>
            <div className="card-input-wrapper">
              <input
                type="number"
                id={`${cardName}-fixed`}
                value={data.fixedAmount || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onFieldChange('fixedAmount', val === '' ? 0 : parseFloat(val));
                }}
                onBlur={() => onFieldBlur('fixedAmount')}
                min={1}
                max={10000}
                className={`card-input ${errors.fixedAmount ? 'input-error' : ''}`}
                placeholder="0"
                aria-invalid={!!errors.fixedAmount}
              />
              <span className="input-suffix">₹</span>
            </div>
            {errors.fixedAmount && <p className="field-error">{errors.fixedAmount}</p>}
          </div>
        )}

        {/* Variable Range Dropdown */}
        {showVariable && (
          <div className="card-field">
            <label htmlFor={`${cardName}-variable`} className="card-field-label">
              PERCENTAGE RANGE
            </label>
            <select
              id={`${cardName}-variable`}
              value={data.variableRange}
              onChange={(e) => onFieldChange('variableRange', e.target.value as VariableRange)}
              onBlur={() => onFieldBlur('variableRange')}
              className={`card-select ${errors.variableRange ? 'input-error' : ''}`}
              aria-invalid={!!errors.variableRange}
            >
              {VARIABLE_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
            {errors.variableRange && <p className="field-error">{errors.variableRange}</p>}
          </div>
        )}

        {/* Weight Threshold (only for Handling Charges) */}
        {cardName === 'handlingCharges' && (
          <div className="card-field">
            <label htmlFor={`${cardName}-weight`} className="card-field-label">
              WEIGHT THRESHOLD
            </label>
            <div className="card-input-wrapper">
              <input
                type="number"
                id={`${cardName}-weight`}
                value={data.weightThreshold || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onFieldChange('weightThreshold', val === '' ? 0 : parseFloat(val));
                }}
                onBlur={() => onFieldBlur('weightThreshold')}
                min={1}
                max={20000}
                className={`card-input ${errors.weightThreshold ? 'input-error' : ''}`}
                placeholder="0"
                aria-invalid={!!errors.weightThreshold}
              />
              <span className="input-suffix">KG</span>
            </div>
            {errors.weightThreshold && <p className="field-error">{errors.weightThreshold}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export const AdvancedChargesGrid: React.FC<AdvancedChargesGridProps> = ({ charges }) => {
  const { charges: chargeValues, errors, setCardField, validateCardField } = charges;

  return (
    <div className="advanced-charges-grid">
      {/* Handling Charges */}
      <ChargeCard
        title="Handling"
        tooltip="Material handling and processing charges"
        cardName="handlingCharges"
        data={chargeValues.handlingCharges as ChargeCardData}
        errors={errors.handlingCharges || {}}
        onFieldChange={(field, value) => setCardField('handlingCharges', field, value)}
        onFieldBlur={(field) => validateCardField('handlingCharges', field)}
      />

      {/* ROV / FOV Charges */}
      <ChargeCard
        title="ROV / FOV"
        tooltip="Risk of Value / Freight on Value charges for high-value shipments"
        cardName="rovCharges"
        data={chargeValues.rovCharges as ChargeCardData}
        errors={errors.rovCharges || {}}
        onFieldChange={(field, value) => setCardField('rovCharges', field, value)}
        onFieldBlur={(field) => validateCardField('rovCharges', field)}
      />

      {/* COD / DOD Charges */}
      <ChargeCard
        title="COD / DOD"
        tooltip="Cash on Delivery / Delivery on Demand service charges"
        cardName="codCharges"
        data={chargeValues.codCharges as ChargeCardData}
        errors={errors.codCharges || {}}
        onFieldChange={(field, value) => setCardField('codCharges', field, value)}
        onFieldBlur={(field) => validateCardField('codCharges', field)}
      />

      {/* To-Pay Charges */}
      <ChargeCard
        title="To-Pay"
        tooltip="Charges for to-pay shipments"
        cardName="toPayCharges"
        data={chargeValues.toPayCharges as ChargeCardData}
        errors={errors.toPayCharges || {}}
        onFieldChange={(field, value) => setCardField('toPayCharges', field, value)}
        onFieldBlur={(field) => validateCardField('toPayCharges', field)}
      />

      {/* Appointment Charges */}
      <ChargeCard
        title="Appointment"
        tooltip="Scheduled delivery appointment charges"
        cardName="appointmentCharges"
        data={chargeValues.appointmentCharges as ChargeCardData}
        errors={errors.appointmentCharges || {}}
        onFieldChange={(field, value) => setCardField('appointmentCharges', field, value)}
        onFieldBlur={(field) => validateCardField('appointmentCharges', field)}
      />
    </div>
  );
};
