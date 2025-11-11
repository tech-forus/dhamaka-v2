import React from 'react';
import ZoneButton from './ZoneButton';

interface RegionSectionProps {
  regionName: string;
  zones: string[];
  selectedZones: string[];
  onZoneToggle: (zoneCode: string) => void;
}

/**
 * RegionSection - Displays a region's zones as a grid of toggleable buttons
 *
 * Layout:
 * - Region name as header
 * - Responsive grid of zone buttons
 * - Maintains consistent spacing and alignment
 */
const RegionSection: React.FC<RegionSectionProps> = ({
  regionName,
  zones,
  selectedZones,
  onZoneToggle,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Region Header */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
        {regionName}
      </h3>

      {/* Zone Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {zones.map((zoneCode) => (
          <ZoneButton
            key={zoneCode}
            zoneCode={zoneCode}
            isSelected={selectedZones.includes(zoneCode)}
            onToggle={onZoneToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default RegionSection;
