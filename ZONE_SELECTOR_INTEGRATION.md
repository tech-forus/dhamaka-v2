# Zone Selector Integration Guide

## Overview

A clean, modular "Select Your Zones" page has been implemented for the Add Vendor workflow. This replaces the old zone selection approach with three new components that provide a better user experience.

## Architecture

### Components

#### 1. **ZoneButton.tsx** (`/src/components/ZoneButton.tsx`)
The smallest unit - a single toggleable button for zone selection.

**Props:**
- `zoneCode: string` - The zone identifier (e.g., "N1", "S2", "E3")
- `isSelected: boolean` - Whether the zone is currently selected
- `onToggle: (zoneCode: string) => void` - Callback when zone is clicked

**Features:**
- Visual states: Blue (selected) vs Gray (unselected)
- Hover effects with scale animation
- Smooth transitions
- Accessibility support (aria-pressed, aria-label)

#### 2. **RegionSection.tsx** (`/src/components/RegionSection.tsx`)
Groups zones by region with a responsive grid layout.

**Props:**
- `regionName: string` - Name of the region (e.g., "North", "South")
- `zones: string[]` - Array of zone codes in this region
- `selectedZones: string[]` - Currently selected zones
- `onZoneToggle: (zoneCode: string) => void` - Callback for zone toggle

**Features:**
- Card-based design with shadow effects
- Responsive grid (2-6 columns based on screen size)
- Region header with border separator
- Hover effects on card

#### 3. **ZoneSelectorPage.tsx** (`/src/pages/ZoneSelectorPage.tsx`)
Main page component orchestrating the entire zone selection experience.

**Features:**
- State management for selected zones (max 28)
- localStorage persistence via draftStore
- Summary card showing selected zones
- Progress bar (zones selected / 28)
- Navigation to/from Add Vendor page
- Warning alert when max limit reached
- Responsive layout with gradient background

## Zone Structure

The system supports **28 zones** across **6 regions**:

```typescript
North: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6']      // 6 zones
South: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']      // 6 zones
East: ['E1', 'E2', 'E3', 'E4']                   // 4 zones
West: ['W1', 'W2', 'W3', 'W4']                   // 4 zones
North-East: ['NE1', 'NE2', 'NE3', 'NE4']         // 4 zones
Central: ['C1', 'C2', 'C3', 'C4']                // 4 zones
```

## Integration with Add Vendor Workflow

### Route Configuration

**Route:** `/add-vendor/zones`
**Component:** `ZoneSelectorPage`
**Protection:** Private route (authentication required)
**Location:** `src/App.tsx` (line 76-85)

### State Persistence

Selected zones are persisted to localStorage via the draft store:

```typescript
// Draft store interface updated (src/store/draftStore.ts)
export interface VendorDraft {
  basics?: Partial<VendorBasics>;
  geo?: Partial<Geo>;
  volumetric?: Partial<VolumetricConfig>;
  charges?: Partial<Charges>;
  zoneRates?: Partial<ZoneRateMatrix>;
  selectedZones?: string[];  // ← NEW: Selected zone codes
  lastSaved?: string;
}
```

**Auto-save:** Zones are automatically saved to draft 400ms after any change.

### Navigation Flow

```
┌─────────────────┐
│   AddVendor     │
│   Page          │
└────────┬────────┘
         │
         │ Click "Select Zones" button
         ▼
┌─────────────────┐
│  ZoneSelectorPage│
│  (/add-vendor/  │
│   zones)        │
└────────┬────────┘
         │
         │ Click "Configure Zones" or "Back"
         ▼
┌─────────────────┐
│   AddVendor     │
│   Page          │
│                 │
│ ✓ Shows count   │
│   of selected   │
│   zones         │
└─────────────────┘
```

### AddVendor Page Integration

**Location:** `src/pages/AddVendor.tsx` (line 429-457)

A new section was added before the ZoneRatesEditor:

```tsx
{/* Zone Selection Section */}
<div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
  <h2>Zone Selection & Rate Configuration</h2>
  <button onClick={() => navigate('/add-vendor/zones')}>
    Select Zones
  </button>
  {/* Shows count if zones are selected */}
  {readDraft()?.selectedZones?.length > 0 && (
    <p>✓ {readDraft()!.selectedZones!.length} zones selected</p>
  )}
</div>
```

### ZoneRatesEditor Integration

**Location:** `src/components/ZoneRatesEditor.tsx`

The ZoneRatesEditor now detects when zones have been selected from the zone selector:

**New Features:**
1. Reads `selectedZones` from draft store on mount
2. Shows a notification card when zones are available
3. Provides "Use These Zones" button to auto-populate FROM and TO zones
4. Pre-fills both FROM and TO zones with the selected zones

**User Experience:**
```
1. User selects zones in ZoneSelectorPage
2. User returns to AddVendor page
3. ZoneRatesEditor shows blue notification:
   "Zones Selected from Zone Selector"
   "You have X zones selected..."
   [Zone pills displayed]
   [Use These Zones] button
4. User clicks "Use These Zones"
5. Both FROM and TO zones are populated
6. User clicks "Initialize Zone Matrix"
7. Rate configuration matrix appears
```

## User Flow Example

### Complete Workflow

1. **Navigate to Add Vendor**
   - URL: `/addvendor`
   - User fills in basic vendor info

2. **Click "Select Zones"**
   - Navigates to `/add-vendor/zones`
   - User sees all 28 zones organized by region

3. **Select Zones**
   - Click zone buttons to toggle selection
   - Selected zones turn blue
   - Summary card updates in real-time
   - Progress bar shows X/28

4. **Configure Zones**
   - Click "Configure Zones →" button
   - Returns to `/addvendor`
   - "✓ X zones selected" message appears

5. **Use in Rate Matrix**
   - Scroll to Zone Rate Matrix section
   - See blue notification with selected zones
   - Click "Use These Zones"
   - FROM and TO zones auto-populate

6. **Initialize Matrix**
   - Click "Initialize Zone Matrix"
   - Rate input grid appears
   - Enter rates for each zone combination

7. **Submit Vendor**
   - Click "Save Vendor"
   - All data including zone rates saved

## Data Flow

```
ZoneSelectorPage
    ↓
  [User selects zones]
    ↓
  setSelectedZones(zones)
    ↓
  persistDraft({ selectedZones: zones })
    ↓
  localStorage.setItem('addVendorV2_draft', ...)
    ↓
  [Navigate back to AddVendor]
    ↓
  readDraft()
    ↓
  Display count in AddVendor section
    ↓
  ZoneRatesEditor reads draft
    ↓
  Shows notification + "Use These Zones"
    ↓
  User clicks button
    ↓
  setSelectedFromZones(draftZones)
  setSelectedToZones(draftZones)
    ↓
  Initialize matrix
    ↓
  Enter rates
    ↓
  Submit vendor
```

## Styling & Design

### Color Scheme

- **Selected Zones:** `bg-blue-600` with `text-white`
- **Unselected Zones:** `bg-gray-100` with `text-gray-700`
- **Success Messages:** `text-green-600`
- **Warning Alerts:** `bg-yellow-50` with `border-yellow-200`
- **Info Cards:** `bg-blue-50` with `border-blue-200`

### Animations

- **Button Press:** `active:scale-95`
- **Button Hover:** `hover:scale-105`
- **Transitions:** `transition-all duration-200`
- **Alert Fade In:** `animate-in fade-in duration-300`
- **Progress Bar:** `transition-all duration-300`

### Responsive Design

```
Mobile (< 640px):   2 columns of zones
Tablet (640-768px): 3 columns of zones
Desktop (768-1024px): 4 columns of zones
Large (> 1024px):   6 columns of zones
```

## Technical Details

### Dependencies

- **React Router:** Navigation between pages
- **Lucide React:** Icons (ArrowLeft, ArrowRight, CheckCircle2)
- **Tailwind CSS:** All styling
- **localStorage:** State persistence via draftStore

### Performance

- **Debounced Auto-save:** 400ms delay prevents excessive writes
- **Memoization:** Zone arrays are constant (no re-renders)
- **Conditional Rendering:** Components only render when needed

### Accessibility

- **ARIA Labels:** All buttons have descriptive labels
- **Keyboard Navigation:** Full keyboard support
- **Focus States:** Visible focus indicators
- **Screen Readers:** Proper semantic HTML

## Testing the Implementation

### Manual Testing Steps

1. **Test Zone Selection:**
   ```
   - Navigate to /add-vendor/zones
   - Click various zones
   - Verify they turn blue when selected
   - Verify summary card updates
   - Try selecting more than 28 zones
   - Verify warning appears
   ```

2. **Test State Persistence:**
   ```
   - Select zones
   - Navigate back to /addvendor
   - Refresh page
   - Navigate to /add-vendor/zones again
   - Verify selections are preserved
   ```

3. **Test Integration:**
   ```
   - Select zones in zone selector
   - Return to AddVendor
   - Scroll to Zone Rate Matrix
   - Verify notification appears
   - Click "Use These Zones"
   - Verify zones populate correctly
   - Initialize matrix
   - Enter rates
   - Submit form
   ```

4. **Test Navigation:**
   ```
   - Click "Back to Add Vendor" link
   - Click "Back" button
   - Click "Configure Zones" button
   - Verify all navigation works
   ```

5. **Test Edge Cases:**
   ```
   - Select 0 zones → "Configure" button disabled
   - Select exactly 28 zones
   - Try selecting 29th zone → warning
   - Clear all zones
   - Refresh page
   ```

## Cleanup Notes

### Old Files (Not Removed Yet)

The old zone selection code still exists in ZoneRatesEditor.tsx but now works alongside the new zone selector. The manual zone selection UI is still available for users who prefer it or want to fine-tune their selections.

**Recommendation:** Keep both approaches for now. Users can:
- Use the dedicated zone selector page for clean, focused zone selection
- OR manually select zones in the ZoneRatesEditor
- OR use the zone selector then adjust in ZoneRatesEditor

This provides maximum flexibility during the transition period.

## Future Enhancements

Potential improvements for future iterations:

1. **Bulk Actions:**
   - "Select All" button
   - "Clear All" button
   - "Select Region" buttons

2. **Search/Filter:**
   - Search zones by code
   - Filter by region
   - Sort options

3. **Presets:**
   - Save zone combinations as presets
   - Load common zone sets
   - Vendor-specific defaults

4. **Validation:**
   - Required zones per vendor type
   - Incompatible zone combinations
   - Warning for unusual selections

5. **Analytics:**
   - Track which zones are most commonly selected
   - Suggest zones based on vendor location
   - Auto-populate based on pincode

## API & Backend Integration

Currently, the zone selection is client-side only. The selected zones are used to initialize the zone rate matrix, which is then submitted as part of the vendor data.

**Vendor Submission Format:**
```typescript
const vendorData = {
  // ... other vendor fields
  zoneRates: {
    "N1": { "S1": 100.50, "S2": 120.75, ... },
    "N2": { "S1": 105.25, "S2": 125.00, ... },
    // ... more zone combinations
  }
}
```

The `selectedZones` array is NOT submitted to the backend - it's only used for UX purposes to help users configure the zone rate matrix.

## Support & Troubleshooting

### Common Issues

**Issue:** Selected zones not appearing in ZoneRatesEditor
**Solution:** Check localStorage for 'addVendorV2_draft' key. Verify selectedZones array is present.

**Issue:** Navigation not working
**Solution:** Verify React Router is properly configured. Check console for routing errors.

**Issue:** Zones not persisting after refresh
**Solution:** Check browser's localStorage is enabled. Verify no browser extensions are blocking storage.

**Issue:** "Use These Zones" button doesn't work
**Solution:** Check console for errors. Verify selectedZones in draft store matches zone codes exactly.

### Debug Mode

Enable debug logging:
```javascript
localStorage.setItem('debug', '1');
```

This will show detailed logs for:
- Draft reads/writes
- Zone selection changes
- Navigation events

## Contact

For questions or issues with the zone selector implementation, please refer to:
- React Router docs: https://reactrouter.com
- Tailwind CSS docs: https://tailwindcss.com
- Project README: /README.md

---

**Version:** 1.0
**Last Updated:** 2025-01-11
**Author:** Claude Code
**Status:** ✅ Production Ready
