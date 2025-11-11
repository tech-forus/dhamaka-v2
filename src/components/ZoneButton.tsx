import React from 'react';

interface ZoneButtonProps {
  zoneCode: string;
  isSelected: boolean;
  onToggle: (zoneCode: string) => void;
}

/**
 * ZoneButton - A toggleable button representing a single zone
 *
 * Visual States:
 * - Selected: Blue background (bg-blue-600) with white text
 * - Unselected: Light gray background (bg-gray-100) with dark text
 *
 * Includes hover effects and smooth transitions for better UX
 */
const ZoneButton: React.FC<ZoneButtonProps> = ({ zoneCode, isSelected, onToggle }) => {
  return (
    <button
      type="button"
      onClick={() => onToggle(zoneCode)}
      className={`
        px-4 py-2.5 rounded-lg font-medium text-sm
        transition-all duration-200 ease-in-out
        transform hover:scale-105 active:scale-95
        shadow-sm hover:shadow-md
        ${
          isSelected
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
      aria-pressed={isSelected}
      aria-label={`Zone ${zoneCode}, ${isSelected ? 'selected' : 'not selected'}`}
    >
      {zoneCode}
    </button>
  );
};

export default ZoneButton;
