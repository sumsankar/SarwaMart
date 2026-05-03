export const MOCK_USER_SELLER = {
  id: 'u_001', name: 'Ravi Kumar', phone: '+91 98765 43210',
  role: 'seller' as const, type: 'individual', status: 'approved',
  rating: 4.8, deals: 43, memberSince: 'Nov 2023', region: 'West Godavari, AP',
};

export const MOCK_USER_BUYER = {
  id: 'u_002', name: 'Priya Nair', phone: '+91 87654 32109',
  role: 'buyer' as const, type: 'individual', status: 'approved',
  rating: 4.6, deals: 28, memberSince: 'Jan 2024', region: 'Hyderabad, AP',
};

export const SELLER_ITEMS = [
  { id: 1, name: 'Fresh Rohu',     sub: 'Fish',  qty: '500 kg', priceNum: 145, price: '₹145/kg', status: 'live',    bids: 6, img: '🐟', grade: 'A', freshness: 'Fresh on ice', region: 'West Godavari, AP', uom: 'kg' },
  { id: 2, name: 'Tiger Prawn',    sub: 'Prawn', qty: '200 kg', priceNum: 480, price: '₹480/kg', status: 'live',    bids: 3, img: '🦐', grade: 'A', freshness: 'Live',          region: 'Krishna, AP',       uom: 'kg' },
  { id: 3, name: 'Blue Crab',      sub: 'Crab',  qty: '80 kg',  priceNum: 620, price: '₹620/kg', status: 'pending', bids: 0, img: '🦀', grade: 'B', freshness: 'Fresh on ice', region: 'Guntur, AP',        uom: 'kg' },
  { id: 4, name: 'Indian Pomfret', sub: 'Fish',  qty: '120 kg', priceNum: 380, price: '₹380/kg', status: 'live',    bids: 8, img: '🐡', grade: 'A', freshness: 'Fresh on ice', region: 'Balasore, OD',     uom: 'kg' },
  { id: 5, name: 'Mud Crab',       sub: 'Crab',  qty: '60 kg',  priceNum: 920, price: '₹920/kg', status: 'live',    bids: 2, img: '🦀', grade: 'A', freshness: 'Live',          region: 'Godavari, AP',      uom: 'kg' },
  { id: 6, name: 'Seer Fish',      sub: 'Fish',  qty: '300 kg', priceNum: 560, price: '₹560/kg', status: 'live',    bids: 5, img: '🐠', grade: 'A', freshness: 'Fresh on ice', region: 'Alappuzha, KL',    uom: 'kg' },
];

export const BUYER_REQUESTS = [
  { id: 1, buyer: 'Verified Buyer #4821',  loc: 'Hyderabad, AP',  time: '2h ago', product: 'Pomfret',     sub: 'Fish',   qty: '300 kg',  price: '₹380/kg',   note: 'Grade A only, cold storage delivery needed.' },
  { id: 2, buyer: 'Sri Venkatesh Traders', loc: 'Vijayawada, AP', time: '4h ago', product: 'Rohu',        sub: 'Fish',   qty: '1 tonne', price: '₹130/kg',   note: 'Fresh catch, morning delivery preferred.' },
  { id: 3, buyer: 'Coastal Foods Pvt Ltd', loc: 'Chennai, TN',    time: '1d ago', product: 'Tiger Prawn', sub: 'Prawn',  qty: '500 kg',  price: '₹460/kg',   note: 'HACCP certified processing unit.' },
  { id: 4, buyer: 'Blue Ocean Exports',    loc: 'Kochi, KL',      time: '1d ago', product: 'Lobster',     sub: 'Lobster',qty: '50 kg',   price: '₹1,200/kg', note: 'Export quality, live preferred.' },
  { id: 5, buyer: 'Freshwater Traders',   loc: 'Kolkata, WB',    time: '2d ago', product: 'Catla',       sub: 'Fish',   qty: '800 kg',  price: '₹120/kg',   note: 'Regular weekly requirement.' },
];

export const MY_BIDS = [
  { id: 1, item: 'Fresh Rohu',    seller: 'Ravi Aqua Farms',    price: '₹245/kg', qty: '200 kg', status: 'negotiating', time: '2h ago',  img: '🐟' },
  { id: 2, item: 'Tiger Prawn',   seller: 'Coastal Harvest Co', price: '₹480/kg', qty: '100 kg', status: 'pending',     time: '5h ago',  img: '🦐' },
  { id: 3, item: 'Indian Pomfret',seller: 'Orissa Fish House',  price: '₹370/kg', qty: '50 kg',  status: 'live',        time: '1d ago',  img: '🐡' },
];

export const MY_REQUESTS = [
  { id: 1, product: 'Pomfret',     sub: 'Fish',  qty: '300 kg',  price: '₹380/kg', loc: 'Hyderabad, AP',  time: '2h ago', status: 'live',    proposals: 4, expiry: '14 Nov', img: '🐡' },
  { id: 2, product: 'Tiger Prawn', sub: 'Prawn', qty: '500 kg',  price: '₹460/kg', loc: 'Chennai, TN',    time: '1d ago', status: 'live',    proposals: 2, expiry: '15 Nov', img: '🦐' },
  { id: 3, product: 'Rohu',        sub: 'Fish',  qty: '1 tonne', price: '₹130/kg', loc: 'Vijayawada, AP', time: '3d ago', status: 'sold',    proposals: 7, expiry: '—',      img: '🐟' },
  { id: 4, product: 'Blue Crab',   sub: 'Crab',  qty: '80 kg',   price: '₹600/kg', loc: 'Kochi, KL',      time: '5d ago', status: 'expired', proposals: 1, expiry: 'Expired',img: '🦀' },
];

export const MOCK_INVOICES = [
  { id: 'INV-2025-00412', party: 'Sri Venkateswara Traders', product: 'Fresh Rohu · 200 kg',   amount: '₹49,000', status: 'settled',          date: '12 Nov 2025' },
  { id: 'INV-2025-00398', party: 'Coastal Foods Pvt Ltd',   product: 'Tiger Prawn · 100 kg',  amount: '₹48,000', status: 'payment pending',  date: '10 Nov 2025' },
  { id: 'INV-2025-00381', party: 'Verified Buyer #4821',    product: 'Blue Crab · 80 kg',     amount: '₹49,600', status: 'pending',          date: '8 Nov 2025'  },
];

export const MOCK_NOTIFICATIONS = [
  { id: 1, group: 'Today',      icon: 'gavel',       title: 'New bid on your Pomfret listing', body: '₹245/kg for 200 kg',                  time: '10:04 AM', unread: true },
  { id: 2, group: 'Today',      icon: 'check-circle',title: 'Your listing was approved',        body: 'Fresh Rohu · 500 kg is now live',     time: '8:30 AM',  unread: true },
  { id: 3, group: 'Yesterday',  icon: 'message',     title: 'Sri Venkatesh Traders countered',  body: '₹248/kg — tap to view thread',         time: '3:22 PM',  unread: false },
  { id: 4, group: 'Yesterday',  icon: 'file-text',   title: 'Invoice INV-2025-00412 settled',   body: '₹49,000 credited to your account',    time: '4:32 PM',  unread: false },
  { id: 5, group: 'This Week',  icon: 'alert-triangle',title: 'Your registration is under review',body: "We'll update you within 24 hours",  time: 'Mon 9AM',  unread: false },
];

export const SELLER_BANNERS = [
  { bg: ['#1B3770','#2D5FA8'] as [string,string], tag: 'Season Special', title: 'List Your Fresh Catch Today',   cta: 'Add Item →',    emoji: '🐟' },
  { bg: ['#2D7A35','#52A85E'] as [string,string], tag: 'Buyer Demand',   title: 'Prawn Prices Up 12% This Week', cta: 'View Market →', emoji: '🦐' },
  { bg: ['#E8921A','#C4780F'] as [string,string], tag: 'New Feature',    title: 'Accept Partial Bids Now Live',  cta: 'Learn More →',  emoji: '🎣' },
];

export const BUYER_BANNERS = [
  { bg: ['#1B3770','#0E5A9E'] as [string,string], tag: 'Direct Sourcing', title: 'Source From Verified Farms Across India', cta: 'Browse Now →', emoji: '🎣' },
  { bg: ['#2D7A35','#1A5C23'] as [string,string], tag: 'Fresh Arrivals',  title: 'Pomfret & Rohu In Season Now',   cta: 'View Items →',  emoji: '🐟' },
  { bg: ['#8B1A1A','#C03030'] as [string,string], tag: 'Limited Stock',   title: 'Tiger Prawn — 3 Sellers Near You',cta: 'Bid Now →',    emoji: '🦐' },
];

export const PUBLIC_BANNERS = [
  { bg: ['#1B3770','#2D5FA8'] as [string,string], tag: 'Direct From Farm', title: 'Source Fresh Seafood\nDirectly From Farmers', cta: 'Explore Now →',   emoji: '🐟' },
  { bg: ['#2D7A35','#52A85E'] as [string,string], tag: 'Verified Sellers', title: 'Trusted Aqua Farmers\nAcross India',           cta: 'View Listings →', emoji: '🦐' },
  { bg: ['#E8921A','#C4780F'] as [string,string], tag: 'Best Prices',      title: 'Bid & Get the\nBest Market Price',             cta: 'Join Free →',    emoji: '🦀' },
];

export const NEGOTIATION_THREAD = [
  { type: 'system' as const, text: 'Buyer placed a bid at ₹230/kg for 300 kg · 10:04 AM' },
  { type: 'offer' as const, from: 'buyer', price: '₹230/kg', qty: '300 kg', total: '₹69,000', time: '10:04 AM', actions: false },
  { type: 'system' as const, text: 'You countered at ₹250/kg for 300 kg · 10:12 AM' },
  { type: 'offer' as const, from: 'seller', price: '₹250/kg', qty: '300 kg', total: '₹75,000', time: '10:12 AM', actions: false },
  { type: 'bubble' as const, from: 'buyer', text: 'Can you do ₹245 for 200 kg? That works better for our cold storage.', time: '10:35 AM' },
  { type: 'offer' as const, from: 'buyer', price: '₹245/kg', qty: '200 kg', total: '₹49,000', time: '10:38 AM', actions: true },
];
