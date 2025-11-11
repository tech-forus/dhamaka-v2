/**
 * PriceConfig - Parent wrapper component
 * 4-column top grid + card grid layout matching exact visual specifications
 */

import React from 'react';
import { UseChargesReturn } from '../../hooks/useCharges';
import { BasicChargesGrid } from './BasicChargesGrid';
import { AdvancedChargesGrid } from './AdvancedChargesGrid';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import './PriceConfig.css';

interface PriceConfigProps {
  charges: UseChargesReturn;
}

export const PriceConfig: React.FC<PriceConfigProps> = ({ charges }) => {
  return (
    <div className="price-config-wrapper">
      <div className="price-config-header">
        <h2 className="price-config-title">
          <CurrencyDollarIcon className="price-config-icon" />
          Basic Charges
        </h2>
      </div>

      {/* Top 4-column grid - Simple inputs */}
      <BasicChargesGrid charges={charges} />

      {/* Bottom card grid - Complex charge cards */}
      <AdvancedChargesGrid charges={charges} />
    </div>
  );
};
