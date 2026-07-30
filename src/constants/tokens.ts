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
  live:         { bg: '#E6F6EC', text: '#007A20', dot: '#007A20' }, // Forest green
  pending:      { bg: '#FFF3E0', text: '#E58E00', dot: '#FFA000' }, // Golden yellow
  sold:         { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  expired:      { bg: '#FEF2F2', text: '#EF4444', dot: '#EF4444' },
  negotiating:  { bg: '#F0F9FF', text: '#1E88E5', dot: '#1E88E5' },
  approved:     { bg: '#E6F6EC', text: '#007A20', dot: '#007A20' },
  rejected:     { bg: '#FEF2F2', text: '#EF4444', dot: '#EF4444' },
  'under review': { bg: '#FFF3E0', text: '#E58E00', dot: '#FFA000' },
  settled:      { bg: '#E6F6EC', text: '#007A20', dot: '#007A20' },
  'payment pending': { bg: '#FFF3E0', text: '#E58E00', dot: '#FFA000' },
} as const;

