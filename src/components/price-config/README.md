# Price Configuration Grid Layout

Pixel-perfect 4-column top grid + card grid layout for price configuration with exact visual specifications.

## Components

### PriceConfig (Parent)
Main wrapper component that includes both BasicChargesGrid and AdvancedChargesGrid.

### BasicChargesGrid
Top 4-column grid for simple numeric input fields:
- Docket Charges
- Min Chargeable Weight
- Minimum Charges
- Hamali Charges
- Green Tax / NGT
- Misc / AOC Charges
- Fuel Surcharge (dropdown)
- DACC Charges

### AdvancedChargesGrid
Card grid with toggle pills for complex charge cards:
- Handling Charges (with unit selector and weight threshold)
- ROV / FOV
- COD / DOD (Fixed only)
- To-Pay (Fixed only)
- Appointment

## Usage

```tsx
import { PriceConfig } from './components/price-config';
import { useCharges } from './hooks/useCharges';

function MyComponent() {
  const charges = useCharges();

  return <PriceConfig charges={charges} />;
}
```

## Visual Specifications

### Typography
- Font Family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto
- Headings: 14px, font-weight 700, line-height 18px, color #0f172a
- Labels: 12px, font-weight 600, color #111827 (uppercase)
- Input text: 14px, font-weight 500, color #0f172a

### Colors
- Text: #0f172a
- Muted labels: #6b7280
- Borders: #e6e9ee
- Card background: #ffffff
- Input background: #fafbfc
- Toggle active: #0f62fe
- Toggle inactive background: #f1f5f9
- Error: #ef4444

### Spacing & Sizes
- Top grid gap: 18px
- Card padding: 16px
- Input height: 40px
- Card border-radius: 12px
- Input border-radius: 6px
- Toggle border-radius: 999px (pill)

### Grid Layout
- Desktop (>1100px): 4 columns (top), 3 columns (bottom)
- Tablet (600px-1100px): 2 columns (top), 1 column (bottom)
- Mobile (<600px): 1 column (both)

## Accessibility
- All labels have matching `htmlFor` attributes
- Toggle buttons have `role="tab"` and `aria-pressed`
- Keyboard focus visible with outline
- Error states with `aria-invalid`

## Files
- `PriceConfig.tsx` - Parent wrapper
- `BasicChargesGrid.tsx` - Top 4-column grid
- `AdvancedChargesGrid.tsx` - Card grid with toggles
- `PriceConfig.css` - Exact visual tokens and responsive styles
- `index.ts` - Public exports
