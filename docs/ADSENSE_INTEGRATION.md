# Google AdSense Integration

## Overview

Google AdSense has been strategically integrated across the Financial Analysis platform to monetize the application while maintaining excellent user experience.

**Publisher ID**: `ca-pub-1672390365903308`

## Implementation

### Global Script

The AdSense script is loaded globally in the `<head>` section of `apps/web/src/layouts/Layout.astro`:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1672390365903308"
     crossorigin="anonymous"></script>
```

### AdSense Component

A reusable `AdSense.astro` component was created in `apps/web/src/components/AdSense.astro` that:
- Accepts customizable ad slots and formats
- Supports responsive ad sizing
- Includes a subtle "Advertisement" label
- Prevents layout shift with min-height CSS

## Ad Placements

### Landing Pages
- **Homepage** (`/`): Horizontal banner at bottom after CTA section
  - Slot: `1234567890`
- **Models Page** (`/models`): Horizontal banner between category cards and features
  - Slot: `3456789012`

### Personal Finance Calculators
- **Amortization Calculator** (`/amortization`): Auto-responsive ad after results table
  - Slot: `2345678901`
- **Savings Goal Planner** (`/savings-goal`): Auto-responsive ad after results section
  - Slot: `4567890123`
- **Auto Loan Calculator** (`/auto-loan`): Horizontal banner at page bottom
  - Slot: `5678901234`
- **Retirement Calculator** (`/retirement`): Horizontal banner at page bottom
  - Slot: `6789012345`
- **Budget Optimizer** (`/budget`): Horizontal banner at page bottom
  - Slot: `7890123456`
- **Debt Payoff** (`/debt-payoff`): Horizontal banner at page bottom
  - Slot: `8901234567`
- **Student Loans** (`/student-loans`): Horizontal banner at page bottom
  - Slot: `9012345678`

### Business Finance Tools
- **EBITDA Forecasting** (`/ebitda-forecasting`): Horizontal banner after dashboard
  - Slot: `0123456789`
- **Enhanced Lease Analysis** (`/enhanced-lease`): Horizontal banner after dashboard
  - Slot: `1234509876`

## Best Practices Followed

### 1. **Non-Intrusive Placement**
- Ads are placed **after** primary content (forms and results)
- No ads interrupt the calculation flow
- Bottom placement ensures users see results first

### 2. **Responsive Design**
- All ads use `data-full-width-responsive="true"`
- Adapts to mobile, tablet, and desktop screens
- Formats: `auto`, `horizontal`, `rectangle` based on location

### 3. **Performance Optimization**
- AdSense script loaded with `async` attribute
- Minimal layout shift with pre-sized ad containers
- Lazy initialization prevents blocking render

### 4. **User Experience**
- Clear "Advertisement" labels
- Consistent spacing (margin classes)
- Dark mode compatible styling

## Next Steps

### Before Going Live

1. **Replace Placeholder Slots**: The current ad slots (e.g., `1234567890`) are placeholders. You need to:
   - Log into [Google AdSense](https://adsense.google.com/)
   - Create ad units for each placement
   - Copy the actual `data-ad-slot` values
   - Update the `slot` prop in each `<AdSense />` component

2. **Add Privacy Policy**: 
   - Create `/privacy` page with AdSense disclosure
   - Add link in footer (already in `@financial-analysis/ui` Footer component)

3. **Implement Cookie Consent**:
   - For GDPR/CCPA compliance
   - Consider tools like Cookiebot or OneTrust
   - Add consent banner before AdSense loads

### Testing

Test ads in production environment:
- AdSense shows blank spaces in localhost
- Use `?google_preview=true` URL parameter for testing
- Verify all ad units display correctly on mobile and desktop

### Monitoring

Track performance in AdSense dashboard:
- Page RPM (Revenue per Thousand Impressions)
- Click-through rate (CTR)
- Coverage (percentage of ad requests filled)
- Viewability (percentage of ads that are actually seen)

## Expected Revenue

Based on financial niche CPMs ($10-25):
- **10,000 page views/month**: $100-250
- **50,000 page views/month**: $500-1,250
- **100,000 page views/month**: $1,000-2,500

Higher CPMs expected for:
- Mortgage calculators
- Retirement planning tools
- Business finance pages

## Alternative Monetization

Consider complementing AdSense with:
- **Affiliate links**: Financial products (credit cards, investment platforms)
- **Premium tier**: Ad-free experience for $4.99/month
- **API access**: Monetize calculation engines for developers
- **Amazon Associates**: Link to financial planning books

## Files Modified

1. `apps/web/src/layouts/Layout.astro` - Added global AdSense script
2. `apps/web/src/components/AdSense.astro` - Created reusable component
3. Landing pages: `index.astro`, `models.astro`
4. Calculator pages: All 9 financial calculator pages
5. Business tools: `ebitda-forecasting.astro`, `enhanced-lease.astro`

## Maintenance

- Update ad placements based on performance data
- A/B test different formats (display vs native)
- Monitor bounce rate impact
- Adjust slots if CPM is too low
