export const T = {
  // Brand & Palette (Aligned directly with logo.png)
  navy:         '#0A3A82', // True Royal Marine Navy (from logo text)
  navyLight:    '#144FA4', // Lighter marine navy for headers & dark UI components
  navyAccent:   '#0E5BC4', // Electric brand blue for active items
  
  green:        '#007A20', // Forest Leaf Green (from logo handshake & left crescent)
  amber:        '#FFA000', // Marigold Golden Yellow (from logo handshake & right crescent)
  ctaDark:      '#E58E00', // Deep gold for button tap states
  success:      '#007A20', // Forest green success
  warning:      '#E58E00', // Gold warning
  danger:       '#EF4444', // Premium alert red
  info:         '#1E88E5', // Sky-blue info
  
  // Surfaces & Layout
  bg:           '#F8FAFC', // Slate background canvas
  card:         '#FFFFFF', // Card white
  cardBorder:   '#E2E8F0', // Soft structural border
  hairline:     '#F1F5F9', // Subtle divider gray
  overlay:      'rgba(10, 58, 130, 0.45)', // Custom navy-tinted overlay
  
  // High-contrast text
  text1:        '#0A1D37', // Deep navy-tinted slate
  text2:        '#475569', // Cool slate body text
  text3:        '#94A3B8', // Muted secondary slate

  // Custom shadows for premium iOS/Android elevation
  shadowSoft: {
    shadowColor: '#0A3A82',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
} as const;

export const STATUS_PILL = {
  // Enum Values (1 to 8)
  1:                     { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' }, // Draft = 1 (Neutral Gray)
  2:                     { bg: '#FFF3E0', text: '#D97706', dot: '#F59E0B' }, // PendingApproval = 2 (Warm Amber Gold)
  3:                     { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' }, // Live = 3 (Forest Green)
  4:                     { bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' }, // Rejected = 4 (Red Alert)
  5:                     { bg: '#CCFBF1', text: '#0F766E', dot: '#14B8A6' }, // PartiallyAllocated = 5 (Teal / Cyan)
  6:                     { bg: '#F1F5F9', text: '#475569', dot: '#64748B' }, // SoldOut = 6 (Cool Slate)
  7:                     { bg: '#FFE4E6', text: '#BE123C', dot: '#E11D48' }, // Expired = 7 (Rose / Dark Red)
  8:                     { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' }, // Cancelled = 8 (Muted Red)

  // Lowercase & Clean String Keys
  draft:                 { bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' },
  pendingapproval:       { bg: '#FFF3E0', text: '#D97706', dot: '#F59E0B' },
  'pending approval':    { bg: '#FFF3E0', text: '#D97706', dot: '#F59E0B' },
  pending_approval:      { bg: '#FFF3E0', text: '#D97706', dot: '#F59E0B' },
  pending:               { bg: '#FFF3E0', text: '#D97706', dot: '#F59E0B' },
  submitted:             { bg: '#FFF3E0', text: '#D97706', dot: '#F59E0B' },
  submittedforapproval:  { bg: '#FFF3E0', text: '#D97706', dot: '#F59E0B' },
  live:                  { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  active:                { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  published:             { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  rejected:              { bg: '#FEE2E2', text: '#B91C1C', dot: '#EF4444' },
  partiallyallocated:    { bg: '#CCFBF1', text: '#0F766E', dot: '#14B8A6' },
  'partially allocated': { bg: '#CCFBF1', text: '#0F766E', dot: '#14B8A6' },
  soldout:               { bg: '#F1F5F9', text: '#475569', dot: '#64748B' },
  'sold out':            { bg: '#F1F5F9', text: '#475569', dot: '#64748B' },
  sold:                  { bg: '#F1F5F9', text: '#475569', dot: '#64748B' },
  completed:             { bg: '#F1F5F9', text: '#475569', dot: '#64748B' },
  expired:               { bg: '#FFE4E6', text: '#BE123C', dot: '#E11D48' },
  cancelled:             { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
  canceled:              { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
  inactive:              { bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' },
  negotiating:           { bg: '#F3E8FF', text: '#6B21A8', dot: '#9333EA' },
  'under review':        { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
  settled:               { bg: '#DCFCE7', text: '#15803D', dot: '#16A34A' },
  'payment pending':     { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B' },
} as const;

