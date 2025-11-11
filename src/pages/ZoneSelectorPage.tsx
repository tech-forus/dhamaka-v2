import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import RegionSection from '../components/RegionSection';
import { persistDraft, readDraft } from '../store/draftStore';

// Zone definitions organized by region
const ZONE_REGIONS = {
  North: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6'],
  South: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
  East: ['E1', 'E2', 'E3', 'E4'],
  West: ['W1', 'W2', 'W3', 'W4'],
  'North-East': ['NE1', 'NE2', 'NE3', 'NE4'],
  Central: ['C1', 'C2', 'C3', 'C4'],
} as const;

const MAX_ZONES = 28;

/**
 * ZoneSelectorPage - Main page for selecting zones in the Add Vendor workflow
 *
 * Features:
 * - Select up to 28 zones across 6 regions
 * - Visual feedback for selected/unselected zones
 * - Summary card showing selected zones
 * - State persistence via localStorage
 * - Navigation to next step (zone rate configuration)
 */
const ZoneSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [showMaxWarning, setShowMaxWarning] = useState(false);

  // Load selected zones from draft on mount
  useEffect(() => {
    const draft = readDraft();
    if (draft?.selectedZones && Array.isArray(draft.selectedZones)) {
      setSelectedZones(draft.selectedZones);
    }
  }, []);

  // Persist selected zones to draft whenever they change
  useEffect(() => {
    const timer = setTimeout(() => {
      persistDraft({ selectedZones });
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedZones]);

  /**
   * Toggle zone selection on/off
   * Enforces maximum of 28 zones
   */
  const handleZoneToggle = (zoneCode: string) => {
    setSelectedZones((prev) => {
      const isCurrentlySelected = prev.includes(zoneCode);

      if (isCurrentlySelected) {
        // Deselect the zone
        setShowMaxWarning(false);
        return prev.filter((zone) => zone !== zoneCode);
      } else {
        // Try to select the zone
        if (prev.length >= MAX_ZONES) {
          // Show warning if limit reached
          setShowMaxWarning(true);
          setTimeout(() => setShowMaxWarning(false), 3000);
          return prev;
        }
        return [...prev, zoneCode];
      }
    });
  };

  /**
   * Navigate to the next step (zone rate configuration)
   * Only enabled when at least one zone is selected
   */
  const handleContinue = () => {
    if (selectedZones.length === 0) {
      return;
    }
    // Navigate to zone rate configuration or next step
    navigate('/addvendor', { state: { fromZoneSelector: true } });
  };

  /**
   * Navigate back to the Add Vendor page
   */
  const handleBack = () => {
    navigate('/addvendor');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Add Vendor</span>
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Select Your Zones
            </h1>
            <p className="text-gray-600">
              Choose the zones you want to configure rates for. You can select up to {MAX_ZONES} zones.
            </p>

            {/* Max Warning Alert */}
            {showMaxWarning && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in duration-300">
                <div className="text-yellow-600 font-semibold">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 font-medium">
                    Maximum limit reached
                  </p>
                  <p className="text-sm text-yellow-700">
                    You can select a maximum of {MAX_ZONES} zones. Deselect a zone to choose a different one.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Region Sections */}
        <div className="space-y-6 mb-8">
          {Object.entries(ZONE_REGIONS).map(([regionName, zones]) => (
            <RegionSection
              key={regionName}
              regionName={regionName}
              zones={zones}
              selectedZones={selectedZones}
              onZoneToggle={handleZoneToggle}
            />
          ))}
        </div>

        {/* Selected Zones Summary Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Selected Zones ({selectedZones.length})
            </h2>
          </div>

          {selectedZones.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No zones selected yet. Click on zone buttons above to select.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedZones.map((zoneCode) => (
                <span
                  key={zoneCode}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                >
                  {zoneCode}
                </span>
              ))}
            </div>
          )}

          {selectedZones.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {selectedZones.length} of {MAX_ZONES} zones selected
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(selectedZones.length / MAX_ZONES) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white rounded-xl shadow-lg p-6">
          <button
            onClick={handleBack}
            className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleContinue}
            disabled={selectedZones.length === 0}
            className={`
              w-full sm:w-auto px-8 py-3 rounded-lg font-semibold
              transition-all duration-200 flex items-center justify-center gap-2
              ${
                selectedZones.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
              }
            `}
          >
            Configure Zones
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZoneSelectorPage;
