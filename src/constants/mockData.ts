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
  { id: 1,  name: 'Fresh Rohu',         sub: 'Fish',    qty: '500 kg',  priceNum: 145,  price: '₹145/kg',   status: 'live',    bids: 6,  img: '🐟', grade: 'A', freshness: 'Fresh on ice', region: 'West Godavari, AP',   uom: 'kg' },
  { id: 2,  name: 'Tiger Prawn',        sub: 'Prawn',   qty: '200 kg',  priceNum: 480,  price: '₹480/kg',   status: 'live',    bids: 3,  img: '🦐', grade: 'A', freshness: 'Live',          region: 'Krishna, AP',         uom: 'kg' },
  { id: 3,  name: 'Blue Crab',          sub: 'Crab',    qty: '80 kg',   priceNum: 620,  price: '₹620/kg',   status: 'pending', bids: 0,  img: '🦀', grade: 'B', freshness: 'Fresh on ice', region: 'Guntur, AP',          uom: 'kg' },
  { id: 4,  name: 'Indian Pomfret',     sub: 'Fish',    qty: '120 kg',  priceNum: 380,  price: '₹380/kg',   status: 'live',    bids: 8,  img: '🐡', grade: 'A', freshness: 'Fresh on ice', region: 'Balasore, OD',        uom: 'kg' },
  { id: 5,  name: 'Mud Crab',           sub: 'Crab',    qty: '60 kg',   priceNum: 920,  price: '₹920/kg',   status: 'live',    bids: 2,  img: '🦀', grade: 'A', freshness: 'Live',          region: 'Godavari, AP',        uom: 'kg' },
  { id: 6,  name: 'Seer Fish',          sub: 'Fish',    qty: '300 kg',  priceNum: 560,  price: '₹560/kg',   status: 'live',    bids: 5,  img: '🐠', grade: 'A', freshness: 'Fresh on ice', region: 'Alappuzha, KL',       uom: 'kg' },
  { id: 7,  name: 'Vannamei Prawn',     sub: 'Prawn',   qty: '600 kg',  priceNum: 420,  price: '₹420/kg',   status: 'live',    bids: 4,  img: '🦐', grade: 'A', freshness: 'Fresh on ice', region: 'Nellore, AP',         uom: 'kg' },
  { id: 8,  name: 'Catla',              sub: 'Fish',    qty: '700 kg',  priceNum: 125,  price: '₹125/kg',   status: 'live',    bids: 7,  img: '🐟', grade: 'B', freshness: 'Fresh on ice', region: 'Howrah, WB',          uom: 'kg' },
  { id: 9,  name: 'Lobster',            sub: 'Lobster', qty: '40 kg',   priceNum: 1250, price: '₹1,250/kg', status: 'live',    bids: 1,  img: '🦞', grade: 'A', freshness: 'Live',          region: 'Kochi, KL',           uom: 'kg' },
  { id: 10, name: 'Squid',              sub: 'Squid',   qty: '180 kg',  priceNum: 350,  price: '₹350/kg',   status: 'pending', bids: 0,  img: '🦑', grade: 'B', freshness: 'Fresh on ice', region: 'Tuticorin, TN',       uom: 'kg' },
  { id: 11, name: 'King Fish',          sub: 'Fish',    qty: '220 kg',  priceNum: 540,  price: '₹540/kg',   status: 'live',    bids: 9,  img: '🐠', grade: 'A', freshness: 'Fresh on ice', region: 'Mangalore, KA',       uom: 'kg' },
  { id: 12, name: 'Pearl Spot',         sub: 'Fish',    qty: '90 kg',   priceNum: 430,  price: '₹430/kg',   status: 'live',    bids: 2,  img: '🐟', grade: 'A', freshness: 'Fresh on ice', region: 'Alappuzha, KL',       uom: 'kg' },
  { id: 13, name: 'Indian Salmon',      sub: 'Fish',    qty: '150 kg',  priceNum: 660,  price: '₹660/kg',   status: 'live',    bids: 4,  img: '🐠', grade: 'A', freshness: 'Fresh on ice', region: 'Goa, GA',             uom: 'kg' },
  { id: 14, name: 'Sea Bass',           sub: 'Fish',    qty: '110 kg',  priceNum: 590,  price: '₹590/kg',   status: 'sold',    bids: 11, img: '🐟', grade: 'A', freshness: 'Fresh on ice', region: 'Pondicherry, PY',     uom: 'kg' },
  { id: 15, name: 'Hilsa',              sub: 'Fish',    qty: '70 kg',   priceNum: 1450, price: '₹1,450/kg', status: 'live',    bids: 3,  img: '🐟', grade: 'A', freshness: 'Fresh on ice', region: 'Diamond Harbour, WB', uom: 'kg' },
  { id: 16, name: 'Tiger Prawn',        sub: 'Prawn',   qty: '350 kg',  priceNum: 475,  price: '₹475/kg',   status: 'live',    bids: 6,  img: '🦐', grade: 'A', freshness: 'Live',          region: 'Bhimavaram, AP',      uom: 'kg' },
  { id: 17, name: 'Mud Crab',           sub: 'Crab',    qty: '40 kg',   priceNum: 940,  price: '₹940/kg',   status: 'pending', bids: 0,  img: '🦀', grade: 'A', freshness: 'Live',          region: 'Kakdwip, WB',         uom: 'kg' },
  { id: 18, name: 'Vannamei Prawn',     sub: 'Prawn',   qty: '900 kg',  priceNum: 415,  price: '₹415/kg',   status: 'live',    bids: 8,  img: '🦐', grade: 'A', freshness: 'Fresh on ice', region: 'Ongole, AP',          uom: 'kg' },
  { id: 19, name: 'Pomfret',            sub: 'Fish',    qty: '160 kg',  priceNum: 395,  price: '₹395/kg',   status: 'live',    bids: 5,  img: '🐡', grade: 'A', freshness: 'Fresh on ice', region: 'Mumbai, MH',          uom: 'kg' },
  { id: 20, name: 'Lobster',            sub: 'Lobster', qty: '25 kg',   priceNum: 1320, price: '₹1,320/kg', status: 'sold',    bids: 14, img: '🦞', grade: 'A', freshness: 'Live',          region: 'Ratnagiri, MH',       uom: 'kg' },
  { id: 21, name: 'Squid',              sub: 'Squid',   qty: '220 kg',  priceNum: 360,  price: '₹360/kg',   status: 'live',    bids: 2,  img: '🦑', grade: 'A', freshness: 'Fresh on ice', region: 'Karwar, KA',          uom: 'kg' },
  { id: 22, name: 'Rohu',               sub: 'Fish',    qty: '450 kg',  priceNum: 138,  price: '₹138/kg',   status: 'live',    bids: 4,  img: '🐟', grade: 'B', freshness: 'Fresh on ice', region: 'Bhubaneswar, OD',     uom: 'kg' },
  { id: 23, name: 'Blue Crab',          sub: 'Crab',    qty: '55 kg',   priceNum: 640,  price: '₹640/kg',   status: 'expired', bids: 1,  img: '🦀', grade: 'B', freshness: 'Fresh on ice', region: 'Kakinada, AP',        uom: 'kg' },
  { id: 24, name: 'Catla',              sub: 'Fish',    qty: '550 kg',  priceNum: 122,  price: '₹122/kg',   status: 'live',    bids: 3,  img: '🐟', grade: 'A', freshness: 'Fresh on ice', region: 'Cuttack, OD',         uom: 'kg' },
  { id: 25, name: 'King Fish',          sub: 'Fish',    qty: '180 kg',  priceNum: 555,  price: '₹555/kg',   status: 'live',    bids: 6,  img: '🐠', grade: 'A', freshness: 'Fresh on ice', region: 'Udupi, KA',           uom: 'kg' },
  { id: 26, name: 'Pearl Spot',         sub: 'Fish',    qty: '120 kg',  priceNum: 425,  price: '₹425/kg',   status: 'sold',    bids: 9,  img: '🐟', grade: 'A', freshness: 'Fresh on ice', region: 'Kollam, KL',          uom: 'kg' },
  { id: 27, name: 'Tiger Prawn',        sub: 'Prawn',   qty: '280 kg',  priceNum: 490,  price: '₹490/kg',   status: 'expired', bids: 2,  img: '🦐', grade: 'B', freshness: 'Fresh on ice', region: 'Chilika, OD',         uom: 'kg' },
];

const PRODUCT_ICON_BY_CATEGORY: Record<string, string> = {
  fish: '🐟', prawn: '🦐', crab: '🦀', lobster: '🦞', squid: '🦑',
};
export const productIcon = (sub: string) => PRODUCT_ICON_BY_CATEGORY[sub.toLowerCase()] ?? '🐠';

export const BUYER_REQUESTS = [
  { id: 1,  buyer: 'Buyer #4821', verified: true,  loc: 'Hyderabad, AP',     time: '2h ago',  product: 'Pomfret',      sub: 'Fish',    qty: '300 kg',  price: '₹380/kg',   note: 'Grade A only, cold storage delivery needed.' },
  { id: 2,  buyer: 'Buyer #4837', verified: true,  loc: 'Vijayawada, AP',    time: '4h ago',  product: 'Rohu',         sub: 'Fish',    qty: '1 tonne', price: '₹130/kg',   note: 'Fresh catch, morning delivery preferred.' },
  { id: 3,  buyer: 'Buyer #4859', verified: true,  loc: 'Chennai, TN',       time: '6h ago',  product: 'Tiger Prawn',  sub: 'Prawn',   qty: '500 kg',  price: '₹460/kg',   note: 'HACCP certified processing unit.' },
  { id: 4,  buyer: 'Buyer #4863', verified: true,  loc: 'Kochi, KL',         time: '8h ago',  product: 'Lobster',      sub: 'Lobster', qty: '50 kg',   price: '₹1,200/kg', note: 'Export quality, live preferred.' },
  { id: 5,  buyer: 'Buyer #4892', verified: false, loc: 'Kolkata, WB',       time: '10h ago', product: 'Catla',        sub: 'Fish',    qty: '800 kg',  price: '₹120/kg',   note: 'Regular weekly requirement.' },
  { id: 6,  buyer: 'Buyer #4915', verified: true,  loc: 'Mumbai, MH',        time: '12h ago', product: 'Indian Salmon',sub: 'Fish',    qty: '250 kg',  price: '₹650/kg',   note: 'Premium grade for retail packaging.' },
  { id: 7,  buyer: 'Buyer #5102', verified: true,  loc: 'Visakhapatnam, AP', time: '14h ago', product: 'Mud Crab',     sub: 'Crab',    qty: '120 kg',  price: '₹880/kg',   note: 'Live crabs only — same-day pickup.' },
  { id: 8,  buyer: 'Buyer #5128', verified: true,  loc: 'Pune, MH',          time: '16h ago', product: 'Squid',        sub: 'Squid',   qty: '200 kg',  price: '₹360/kg',   note: 'Cleaned & frozen, vacuum packed.' },
  { id: 9,  buyer: 'Buyer #5147', verified: false, loc: 'Mangalore, KA',     time: '18h ago', product: 'King Fish',    sub: 'Fish',    qty: '180 kg',  price: '₹520/kg',   note: 'Whole fish, weight 2-4 kg each.' },
  { id: 10, buyer: 'Buyer #5162', verified: true,  loc: 'Chennai, TN',       time: '20h ago', product: 'Pearl Spot',   sub: 'Fish',    qty: '100 kg',  price: '₹420/kg',   note: 'Fresh from backwaters, retail orders.' },
  { id: 11, buyer: 'Buyer #5189', verified: true,  loc: 'Kakinada, AP',      time: '1d ago',  product: 'Vannamei Prawn',sub: 'Prawn',  qty: '700 kg',  price: '₹420/kg',   note: 'Count 30/40, head-on shell-on.' },
  { id: 12, buyer: 'Buyer #6045', verified: true,  loc: 'Bhubaneswar, OD',   time: '1d ago',  product: 'Hilsa',        sub: 'Fish',    qty: '90 kg',   price: '₹1,400/kg', note: 'Premium grade, wedding catering order.' },
  { id: 13, buyer: 'Buyer #6071', verified: true,  loc: 'Bengaluru, KA',     time: '1d ago',  product: 'Sea Bass',     sub: 'Fish',    qty: '150 kg',  price: '₹580/kg',   note: 'Restaurant supply, weekly contract.' },
  { id: 14, buyer: 'Buyer #6094', verified: true,  loc: 'Krishna, AP',       time: '2d ago',  product: 'Rohu',         sub: 'Fish',    qty: '2 tonne', price: '₹128/kg',   note: 'Bulk procurement for processing plant.' },
  { id: 15, buyer: 'Buyer #6112', verified: true,  loc: 'Goa, GA',           time: '2d ago',  product: 'Pomfret',      sub: 'Fish',    qty: '180 kg',  price: '₹390/kg',   note: 'Hotel chain supply, A-grade only.' },
  { id: 16, buyer: 'Buyer #6298', verified: true,  loc: 'Surat, GJ',         time: '2d ago',  product: 'Tiger Prawn',  sub: 'Prawn',   qty: '300 kg',  price: '₹470/kg',   note: 'Export packaging compliant.' },
  { id: 17, buyer: 'Buyer #6321', verified: true,  loc: 'Alappuzha, KL',     time: '2d ago',  product: 'Blue Crab',    sub: 'Crab',    qty: '60 kg',   price: '₹640/kg',   note: 'Live preferred, processing onsite.' },
  { id: 18, buyer: 'Buyer #6354', verified: false, loc: 'Howrah, WB',        time: '2d ago',  product: 'Catla',        sub: 'Fish',    qty: '600 kg',  price: '₹118/kg',   note: 'Wholesale market resale.' },
  { id: 19, buyer: 'Buyer #6378', verified: true,  loc: 'Diu, DD',           time: '3d ago',  product: 'Indian Salmon',sub: 'Fish',    qty: '120 kg',  price: '₹620/kg',   note: 'Frozen acceptable if vacuum packed.' },
  { id: 20, buyer: 'Buyer #7011', verified: true,  loc: 'Ernakulam, KL',     time: '3d ago',  product: 'Lobster',      sub: 'Lobster', qty: '40 kg',   price: '₹1,250/kg', note: 'Restaurant export, live tank pickup.' },
  { id: 21, buyer: 'Buyer #7048', verified: true,  loc: 'Madurai, TN',       time: '3d ago',  product: 'Squid',        sub: 'Squid',   qty: '150 kg',  price: '₹350/kg',   note: 'Tubes & tentacles separated.' },
  { id: 22, buyer: 'Buyer #7082', verified: false, loc: 'Nagpur, MH',        time: '3d ago',  product: 'Catla',        sub: 'Fish',    qty: '500 kg',  price: '₹125/kg',   note: 'Cold chain delivery to depot.' },
  { id: 23, buyer: 'Buyer #7349', verified: true,  loc: 'Coimbatore, TN',    time: '4d ago',  product: 'Pearl Spot',   sub: 'Fish',    qty: '80 kg',   price: '₹430/kg',   note: 'Daily fresh requirement, retail.' },
  { id: 24, buyer: 'Buyer #7401', verified: true,  loc: 'Tuticorin, TN',     time: '4d ago',  product: 'Vannamei Prawn',sub: 'Prawn',  qty: '1 tonne', price: '₹430/kg',   note: 'Export to SE Asia, count 40/50.' },
  { id: 25, buyer: 'Buyer #7438', verified: true,  loc: 'Daman, DD',         time: '5d ago',  product: 'Mud Crab',     sub: 'Crab',    qty: '70 kg',   price: '₹900/kg',   note: 'Live, premium size 350g+.' },
  { id: 26, buyer: 'Buyer #7882', verified: true,  loc: 'Indore, MP',        time: '5d ago',  product: 'Rohu',         sub: 'Fish',    qty: '450 kg',  price: '₹132/kg',   note: 'Sunday wholesale market.' },
  { id: 27, buyer: 'Buyer #7919', verified: true,  loc: 'Pondicherry, PY',   time: '6d ago',  product: 'Sea Bass',     sub: 'Fish',    qty: '110 kg',  price: '₹570/kg',   note: 'Export quality whole fish.' },
];

export const MY_BIDS = [
  { id: 1, itemId: 1, item: 'Fresh Rohu',     seller: 'Seller #2031', price: '₹245/kg', priceNum: 245, qty: '200 kg', status: 'negotiating', time: '2h ago', placedAt: '12 Nov, 10:04 AM', img: '🐟', exchanges: 4 },
  { id: 2, itemId: 2, item: 'Tiger Prawn',    seller: 'Seller #2042', price: '₹480/kg', priceNum: 480, qty: '100 kg', status: 'pending',     time: '5h ago', placedAt: '12 Nov, 7:12 AM',  img: '🦐', exchanges: 1 },
  { id: 3, itemId: 4, item: 'Indian Pomfret', seller: 'Seller #2056', price: '₹370/kg', priceNum: 370, qty: '50 kg',  status: 'live',        time: '1d ago', placedAt: '11 Nov, 9:30 AM',  img: '🐡', exchanges: 0 },
  { id: 4, itemId: 6, item: 'Seer Fish',      seller: 'Seller #2118', price: '₹555/kg', priceNum: 555, qty: '120 kg', status: 'negotiating', time: '6h ago', placedAt: '12 Nov, 6:18 AM',  img: '🐠', exchanges: 3 },
];

export function getMyBidForItem(itemId: number) {
  return MY_BIDS.find(b => b.itemId === itemId) ?? null;
}

export const MY_REQUESTS = [
  { id: 1,  product: 'Pomfret',         sub: 'Fish',    qty: '300 kg',  price: '₹380/kg',   loc: 'Hyderabad, AP',  time: '2h ago',  status: 'live',    proposals: 4,  expiry: '14 Nov',  img: '🐡' },
  { id: 2,  product: 'Tiger Prawn',     sub: 'Prawn',   qty: '500 kg',  price: '₹460/kg',   loc: 'Chennai, TN',    time: '1d ago',  status: 'live',    proposals: 2,  expiry: '15 Nov',  img: '🦐' },
  { id: 3,  product: 'Rohu',            sub: 'Fish',    qty: '1 tonne', price: '₹130/kg',   loc: 'Vijayawada, AP', time: '3d ago',  status: 'sold',    proposals: 7,  expiry: '—',       img: '🐟' },
  { id: 4,  product: 'Blue Crab',       sub: 'Crab',    qty: '80 kg',   price: '₹600/kg',   loc: 'Kochi, KL',      time: '5d ago',  status: 'expired', proposals: 1,  expiry: 'Expired', img: '🦀' },
  { id: 5,  product: 'Mud Crab',        sub: 'Crab',    qty: '60 kg',   price: '₹880/kg',   loc: 'Visakhapatnam, AP', time: '6h ago', status: 'live',  proposals: 3,  expiry: '16 Nov',  img: '🦀' },
  { id: 6,  product: 'Vannamei Prawn',  sub: 'Prawn',   qty: '700 kg',  price: '₹420/kg',   loc: 'Mumbai, MH',     time: '12h ago', status: 'live',    proposals: 5,  expiry: '17 Nov',  img: '🦐' },
  { id: 7,  product: 'Indian Salmon',   sub: 'Fish',    qty: '180 kg',  price: '₹650/kg',   loc: 'Pune, MH',       time: '18h ago', status: 'live',    proposals: 0,  expiry: '18 Nov',  img: '🐠' },
  { id: 8,  product: 'Sea Bass',        sub: 'Fish',    qty: '120 kg',  price: '₹570/kg',   loc: 'Bengaluru, KA',  time: '1d ago',  status: 'live',    proposals: 6,  expiry: '19 Nov',  img: '🐟' },
  { id: 9,  product: 'Hilsa',           sub: 'Fish',    qty: '90 kg',   price: '₹1,420/kg', loc: 'Kolkata, WB',    time: '2d ago',  status: 'live',    proposals: 8,  expiry: '20 Nov',  img: '🐟' },
  { id: 10, product: 'Lobster',         sub: 'Lobster', qty: '40 kg',   price: '₹1,250/kg', loc: 'Goa, GA',        time: '2d ago',  status: 'live',    proposals: 2,  expiry: '21 Nov',  img: '🦞' },
  { id: 11, product: 'Catla',           sub: 'Fish',    qty: '600 kg',  price: '₹125/kg',   loc: 'Howrah, WB',     time: '3d ago',  status: 'sold',    proposals: 9,  expiry: '—',       img: '🐟' },
  { id: 12, product: 'Squid',           sub: 'Squid',   qty: '200 kg',  price: '₹350/kg',   loc: 'Mangalore, KA',  time: '4d ago',  status: 'live',    proposals: 4,  expiry: '23 Nov',  img: '🦑' },
  { id: 13, product: 'King Fish',       sub: 'Fish',    qty: '150 kg',  price: '₹540/kg',   loc: 'Tuticorin, TN',  time: '4d ago',  status: 'live',    proposals: 3,  expiry: '24 Nov',  img: '🐠' },
  { id: 14, product: 'Pearl Spot',      sub: 'Fish',    qty: '80 kg',   price: '₹420/kg',   loc: 'Alappuzha, KL',  time: '5d ago',  status: 'expired', proposals: 0,  expiry: 'Expired', img: '🐟' },
  { id: 15, product: 'Tiger Prawn',     sub: 'Prawn',   qty: '300 kg',  price: '₹475/kg',   loc: 'Surat, GJ',      time: '6d ago',  status: 'sold',    proposals: 11, expiry: '—',       img: '🦐' },
];

// Deterministic mock proposals for a buyer request, keyed off req.id and req.proposals.
const SELLER_POOL = [
  { name: 'Seller #2031', region: 'West Godavari, AP', rating: 4.8, deals: 43, verified: true,  delivery: '24h cold-chain' },
  { name: 'Seller #2042', region: 'Chennai, TN',       rating: 4.6, deals: 28, verified: true,  delivery: 'Same-day pickup' },
  { name: 'Seller #2056', region: 'Balasore, OD',      rating: 4.5, deals: 19, verified: false, delivery: '36h delivery' },
  { name: 'Seller #2073', region: 'Krishna, AP',       rating: 4.7, deals: 36, verified: true,  delivery: 'Insulated truck' },
  { name: 'Seller #2089', region: 'Mangalore, KA',     rating: 4.4, deals: 22, verified: true,  delivery: 'Live tank transport' },
  { name: 'Seller #2102', region: 'Bhimavaram, AP',    rating: 4.9, deals: 51, verified: true,  delivery: '12h cold-chain' },
  { name: 'Seller #2118', region: 'Alappuzha, KL',     rating: 4.3, deals: 17, verified: false, delivery: 'Refrigerated van' },
  { name: 'Seller #2134', region: 'Kakinada, AP',      rating: 4.6, deals: 30, verified: true,  delivery: '24h cold-chain' },
  { name: 'Seller #2156', region: 'Diu, DD',           rating: 4.2, deals: 11, verified: false, delivery: '48h delivery' },
  { name: 'Seller #2172', region: 'Pondicherry, PY',   rating: 4.7, deals: 25, verified: true,  delivery: 'Same-day pickup' },
  { name: 'Seller #2188', region: 'Karwar, KA',        rating: 4.5, deals: 18, verified: true,  delivery: 'Insulated truck' },
  { name: 'Seller #2204', region: 'Goa, GA',           rating: 4.8, deals: 41, verified: true,  delivery: '24h cold-chain' },
] as const;

const PROPOSAL_NOTES = [
  'Grade A stock available, ready to ship within 24 hours.',
  'Can split delivery across 2 trips if cold-chain is constrained.',
  'Live transport available, will match your quality spec.',
  'Slightly above expected price — premium quality, vacuum packed.',
  'Bulk discount possible if order volume increases.',
  'Pickup from our processing unit; saves on logistics.',
  'Open to revising quantity if grade preference is flexible.',
  'Same-day harvest, fresh on ice. Can deliver tomorrow morning.',
];

const PROPOSAL_TIMES = ['10m ago', '34m ago', '1h ago', '2h ago', '4h ago', '8h ago', '12h ago', '1d ago', '2d ago'];

export interface Proposal {
  id: number;
  sellerName: string;
  sellerRegion: string;
  sellerRating: number;
  sellerDeals: number;
  sellerVerified: boolean;
  delivery: string;
  price: string;
  priceNum: number;
  qty: string;
  note: string;
  time: string;
  status: 'pending' | 'accepted' | 'declined' | 'countered';
}

const parsePriceNum = (price: string): number => {
  const m = price.match(/[\d,]+/);
  return m ? Number(m[0].replace(/,/g, '')) : 0;
};

export function proposalsForRequest(req: typeof MY_REQUESTS[number]): Proposal[] {
  if (!req.proposals) return [];
  const expected = parsePriceNum(req.price);
  const out: Proposal[] = [];
  for (let i = 0; i < req.proposals; i++) {
    const seller = SELLER_POOL[(req.id * 7 + i * 3) % SELLER_POOL.length];
    // Vary price between -8% and +12% of expected, deterministic per (req.id, i).
    const drift = ((req.id * 13 + i * 17) % 21) - 8; // -8..+12
    const priceNum = Math.round(expected * (1 + drift / 100));
    const priceStr = `₹${priceNum.toLocaleString('en-IN')}/kg`;
    // Most proposals match the requested qty; some offer partial.
    const partial = (req.id * 5 + i) % 4 === 0;
    const qty = partial && req.qty.match(/\d+/) ? `${Math.round(Number(req.qty.match(/\d+/)![0]) * 0.6)} kg` : req.qty;
    let status: Proposal['status'] = 'pending';
    if (req.status === 'sold' && i === 0) status = 'accepted';
    else if (req.status === 'sold' && i % 3 === 1) status = 'declined';
    else if (req.status === 'live' && i === 0 && req.proposals > 3) status = 'countered';
    else if (req.status === 'expired') status = 'declined';
    out.push({
      id: req.id * 100 + i + 1,
      sellerName: seller.name,
      sellerRegion: seller.region,
      sellerRating: seller.rating,
      sellerDeals: seller.deals,
      sellerVerified: seller.verified,
      delivery: seller.delivery,
      price: priceStr,
      priceNum,
      qty,
      note: PROPOSAL_NOTES[(req.id + i * 2) % PROPOSAL_NOTES.length],
      time: PROPOSAL_TIMES[i % PROPOSAL_TIMES.length],
      status,
    });
  }
  return out;
}

export type InvoiceDirection = 'payable' | 'receivable';
export type InvoiceSource = 'bid' | 'request';
export interface Invoice {
  id: string;
  party: string;        // counterparty (the other side)
  product: string;
  amount: string;
  amountNum: number;
  status: string;       // settled | payment pending | pending | disputed
  date: string;
  dueIn: string;
  direction: InvoiceDirection;  // payable = current user owes SarwaMart; receivable = SarwaMart owes current user
  source: InvoiceSource;        // bid = won bid; request = buyer request fulfilled
  forRole: 'buyer' | 'seller';  // which side of the deal owns this invoice
}

// Receivable invoices — seller's view (SarwaMart owes the seller for delivered goods).
// Counterparty (party) is the buyer the seller transacted with — anonymized.
const SELLER_INVOICES: Invoice[] = [
  { id: 'INV-2025-S0412', party: 'Buyer #4837', product: 'Fresh Rohu · 200 kg',     amount: '₹49,000',   amountNum: 49000,  status: 'settled',         date: '12 Nov 2025', dueIn: 'Paid',          direction: 'receivable', source: 'bid',     forRole: 'seller' },
  { id: 'INV-2025-S0398', party: 'Buyer #4859', product: 'Tiger Prawn · 100 kg',    amount: '₹48,000',   amountNum: 48000,  status: 'payment pending', date: '10 Nov 2025', dueIn: 'Due in 3 days', direction: 'receivable', source: 'request', forRole: 'seller' },
  { id: 'INV-2025-S0381', party: 'Buyer #4821', product: 'Blue Crab · 80 kg',       amount: '₹49,600',   amountNum: 49600,  status: 'pending',         date: '8 Nov 2025',  dueIn: 'Due in 5 days', direction: 'receivable', source: 'bid',     forRole: 'seller' },
  { id: 'INV-2025-S0375', party: 'Buyer #4915', product: 'Pomfret · 150 kg',        amount: '₹57,000',   amountNum: 57000,  status: 'settled',         date: '7 Nov 2025',  dueIn: 'Paid',          direction: 'receivable', source: 'request', forRole: 'seller' },
  { id: 'INV-2025-S0368', party: 'Buyer #5128', product: 'Squid · 200 kg',          amount: '₹70,000',   amountNum: 70000,  status: 'payment pending', date: '6 Nov 2025',  dueIn: 'Due in 1 day',  direction: 'receivable', source: 'bid',     forRole: 'seller' },
  { id: 'INV-2025-S0355', party: 'Buyer #5189', product: 'Vannamei Prawn · 700 kg', amount: '₹2,94,000', amountNum: 294000, status: 'settled',         date: '4 Nov 2025',  dueIn: 'Paid',          direction: 'receivable', source: 'request', forRole: 'seller' },
  { id: 'INV-2025-S0342', party: 'Buyer #6071', product: 'Sea Bass · 150 kg',       amount: '₹85,500',   amountNum: 85500,  status: 'settled',         date: '2 Nov 2025',  dueIn: 'Paid',          direction: 'receivable', source: 'bid',     forRole: 'seller' },
  { id: 'INV-2025-S0331', party: 'Buyer #5162', product: 'Pearl Spot · 100 kg',     amount: '₹42,000',   amountNum: 42000,  status: 'pending',         date: '1 Nov 2025',  dueIn: 'Due in 7 days', direction: 'receivable', source: 'request', forRole: 'seller' },
  { id: 'INV-2025-S0318', party: 'Buyer #6094', product: 'Rohu · 2 tonne',          amount: '₹2,56,000', amountNum: 256000, status: 'settled',         date: '30 Oct 2025', dueIn: 'Paid',          direction: 'receivable', source: 'bid',     forRole: 'seller' },
  { id: 'INV-2025-S0305', party: 'Buyer #6112', product: 'Pomfret · 180 kg',        amount: '₹70,200',   amountNum: 70200,  status: 'disputed',        date: '28 Oct 2025', dueIn: 'In dispute',    direction: 'receivable', source: 'request', forRole: 'seller' },
  { id: 'INV-2025-S0294', party: 'Buyer #6321', product: 'Blue Crab · 60 kg',       amount: '₹38,400',   amountNum: 38400,  status: 'settled',         date: '26 Oct 2025', dueIn: 'Paid',          direction: 'receivable', source: 'bid',     forRole: 'seller' },
  { id: 'INV-2025-S0281', party: 'Buyer #6378', product: 'Indian Salmon · 120 kg',  amount: '₹74,400',   amountNum: 74400,  status: 'payment pending', date: '24 Oct 2025', dueIn: 'Due in 12 days',direction: 'receivable', source: 'request', forRole: 'seller' },
  { id: 'INV-2025-S0268', party: 'Buyer #6354', product: 'Catla · 600 kg',          amount: '₹70,800',   amountNum: 70800,  status: 'settled',         date: '22 Oct 2025', dueIn: 'Paid',          direction: 'receivable', source: 'bid',     forRole: 'seller' },
  { id: 'INV-2025-S0255', party: 'Buyer #7048', product: 'Squid · 150 kg',          amount: '₹52,500',   amountNum: 52500,  status: 'settled',         date: '20 Oct 2025', dueIn: 'Paid',          direction: 'receivable', source: 'request', forRole: 'seller' },
  { id: 'INV-2025-S0241', party: 'Buyer #7082', product: 'Catla · 500 kg',          amount: '₹62,500',   amountNum: 62500,  status: 'pending',         date: '18 Oct 2025', dueIn: 'Overdue 2 days',direction: 'receivable', source: 'bid',     forRole: 'seller' },
  { id: 'INV-2025-S0228', party: 'Buyer #7401', product: 'Vannamei Prawn · 1 tonne',amount: '₹4,30,000', amountNum: 430000, status: 'settled',         date: '15 Oct 2025', dueIn: 'Paid',          direction: 'receivable', source: 'request', forRole: 'seller' },
  { id: 'INV-2025-S0215', party: 'Buyer #7438', product: 'Mud Crab · 70 kg',        amount: '₹63,000',   amountNum: 63000,  status: 'disputed',        date: '12 Oct 2025', dueIn: 'In dispute',    direction: 'receivable', source: 'bid',     forRole: 'seller' },
];

// Payable invoices — buyer's view (buyer owes SarwaMart for goods received).
// Counterparty (party) is the seller the buyer transacted with — anonymized.
const BUYER_INVOICES: Invoice[] = [
  { id: 'INV-2025-B0518', party: 'Seller #2031', product: 'Fresh Rohu · 200 kg',     amount: '₹49,000',   amountNum: 49000,  status: 'payment pending', date: '12 Nov 2025', dueIn: 'Due in 2 days', direction: 'payable', source: 'bid',     forRole: 'buyer' },
  { id: 'INV-2025-B0512', party: 'Seller #2042', product: 'Tiger Prawn · 100 kg',    amount: '₹48,000',   amountNum: 48000,  status: 'settled',         date: '11 Nov 2025', dueIn: 'Paid',          direction: 'payable', source: 'bid',     forRole: 'buyer' },
  { id: 'INV-2025-B0506', party: 'Seller #2102', product: 'Vannamei Prawn · 600 kg', amount: '₹2,52,000', amountNum: 252000, status: 'pending',         date: '10 Nov 2025', dueIn: 'Due in 4 days', direction: 'payable', source: 'request', forRole: 'buyer' },
  { id: 'INV-2025-B0497', party: 'Seller #2056', product: 'Indian Pomfret · 50 kg',  amount: '₹18,500',   amountNum: 18500,  status: 'settled',         date: '8 Nov 2025',  dueIn: 'Paid',          direction: 'payable', source: 'bid',     forRole: 'buyer' },
  { id: 'INV-2025-B0488', party: 'Seller #2073', product: 'Rohu · 1 tonne',          amount: '₹1,28,000', amountNum: 128000, status: 'payment pending', date: '6 Nov 2025',  dueIn: 'Due in 1 day',  direction: 'payable', source: 'request', forRole: 'buyer' },
  { id: 'INV-2025-B0476', party: 'Seller #2089', product: 'King Fish · 180 kg',      amount: '₹99,900',   amountNum: 99900,  status: 'settled',         date: '4 Nov 2025',  dueIn: 'Paid',          direction: 'payable', source: 'request', forRole: 'buyer' },
  { id: 'INV-2025-B0465', party: 'Seller #2134', product: 'Mud Crab · 60 kg',        amount: '₹56,400',   amountNum: 56400,  status: 'pending',         date: '2 Nov 2025',  dueIn: 'Due in 6 days', direction: 'payable', source: 'bid',     forRole: 'buyer' },
  { id: 'INV-2025-B0451', party: 'Seller #2118', product: 'Pearl Spot · 80 kg',      amount: '₹34,000',   amountNum: 34000,  status: 'settled',         date: '30 Oct 2025', dueIn: 'Paid',          direction: 'payable', source: 'bid',     forRole: 'buyer' },
  { id: 'INV-2025-B0438', party: 'Seller #2204', product: 'Indian Salmon · 120 kg',  amount: '₹78,000',   amountNum: 78000,  status: 'payment pending', date: '28 Oct 2025', dueIn: 'Overdue 1 day', direction: 'payable', source: 'request', forRole: 'buyer' },
  { id: 'INV-2025-B0419', party: 'Seller #2172', product: 'Sea Bass · 100 kg',       amount: '₹57,000',   amountNum: 57000,  status: 'settled',         date: '25 Oct 2025', dueIn: 'Paid',          direction: 'payable', source: 'bid',     forRole: 'buyer' },
  { id: 'INV-2025-B0407', party: 'Seller #2188', product: 'Squid · 150 kg',          amount: '₹52,500',   amountNum: 52500,  status: 'disputed',        date: '22 Oct 2025', dueIn: 'In dispute',    direction: 'payable', source: 'request', forRole: 'buyer' },
  { id: 'INV-2025-B0392', party: 'Seller #2031', product: 'Catla · 500 kg',          amount: '₹62,500',   amountNum: 62500,  status: 'settled',         date: '18 Oct 2025', dueIn: 'Paid',          direction: 'payable', source: 'request', forRole: 'buyer' },
];

export const MOCK_INVOICES: Invoice[] = [...BUYER_INVOICES, ...SELLER_INVOICES];

// Proposals the logged-in seller has submitted on buyer requests.
export interface MyProposal {
  id: number;
  requestId: number;          // → BUYER_REQUESTS.id
  price: string;
  priceNum: number;
  qty: string;
  note: string;
  status: 'pending' | 'accepted' | 'declined' | 'countered' | 'expired' | 'negotiating';
  time: string;
  placedAt: string;
  exchanges: number;
}

export const MY_PROPOSALS: MyProposal[] = [
  { id: 101, requestId: 1,  price: '₹388/kg',   priceNum: 388,  qty: '300 kg',  note: 'Grade A available, 24h cold-chain delivery.',                 status: 'pending',    time: '1h ago',  placedAt: '13 Nov, 9:15 AM',  exchanges: 0 },
  { id: 102, requestId: 2,  price: '₹128/kg',   priceNum: 128,  qty: '1 tonne', note: 'Fresh catch, can deliver tomorrow morning.',                 status: 'countered',  time: '3h ago',  placedAt: '13 Nov, 7:42 AM',  exchanges: 4 },
  { id: 103, requestId: 5,  price: '₹860/kg',   priceNum: 860,  qty: '60 kg',   note: 'Live mud crab, premium size 350g+.',                          status: 'pending',    time: '5h ago',  placedAt: '13 Nov, 6:10 AM',  exchanges: 0 },
  { id: 104, requestId: 7,  price: '₹640/kg',   priceNum: 640,  qty: '180 kg',  note: 'Premium grade salmon, vacuum packed for retail.',             status: 'accepted',   time: '1d ago',  placedAt: '12 Nov, 11:20 AM', exchanges: 6 },
  { id: 105, requestId: 9,  price: '₹1,380/kg', priceNum: 1380, qty: '90 kg',   note: 'Premium hilsa from Diamond Harbour.',                         status: 'negotiating', time: '1d ago',  placedAt: '12 Nov, 10:05 AM', exchanges: 5 },
  { id: 106, requestId: 11, price: '₹418/kg',   priceNum: 418,  qty: '700 kg',  note: 'Count 30/40 head-on shell-on, harvest morning of delivery.',  status: 'pending',    time: '2d ago',  placedAt: '11 Nov, 2:30 PM',  exchanges: 0 },
  { id: 107, requestId: 13, price: '₹570/kg',   priceNum: 570,  qty: '150 kg',  note: 'Whole sea bass, weight 2-3 kg each. Restaurant quality.',     status: 'declined',   time: '2d ago',  placedAt: '11 Nov, 9:00 AM',  exchanges: 2 },
  { id: 108, requestId: 15, price: '₹398/kg',   priceNum: 398,  qty: '180 kg',  note: 'Hotel chain supply ready. Grade A only as required.',         status: 'countered',  time: '3d ago',  placedAt: '10 Nov, 4:18 PM',  exchanges: 3 },
  { id: 109, requestId: 18, price: '₹120/kg',   priceNum: 120,  qty: '600 kg',  note: 'Bulk lot ready. Wholesale market resale terms accepted.',     status: 'accepted',   time: '4d ago',  placedAt: '9 Nov, 11:45 AM',  exchanges: 7 },
  { id: 110, requestId: 21, price: '₹345/kg',   priceNum: 345,  qty: '150 kg',  note: 'Squid tubes & tentacles separated, vacuum packed.',           status: 'pending',    time: '5d ago',  placedAt: '8 Nov, 8:50 AM',   exchanges: 0 },
  { id: 111, requestId: 23, price: '₹425/kg',   priceNum: 425,  qty: '80 kg',   note: 'Daily fresh, can supply for 2 weeks straight if needed.',     status: 'expired',    time: '6d ago',  placedAt: '7 Nov, 10:00 AM',  exchanges: 1 },
  { id: 112, requestId: 25, price: '₹880/kg',   priceNum: 880,  qty: '70 kg',   note: 'Premium live mud crab. Same-day pickup available.',           status: 'pending',    time: '6d ago',  placedAt: '7 Nov, 6:30 AM',   exchanges: 0 },
];

export const getMyProposalForRequest = (requestId: number) => MY_PROPOSALS.find(p => p.requestId === requestId) ?? null;

// Bids placed by buyers on a seller's item — generated deterministically from item.id and item.bids.
const BUYER_POOL = [
  { name: 'Buyer #4837', region: 'Vijayawada, AP',  rating: 4.8, deals: 43, verified: true },
  { name: 'Buyer #4859', region: 'Chennai, TN',     rating: 4.5, deals: 28, verified: true },
  { name: 'Buyer #4821', region: 'Hyderabad, AP',   rating: 4.6, deals: 19, verified: true },
  { name: 'Buyer #4915', region: 'Mumbai, MH',      rating: 4.7, deals: 36, verified: true },
  { name: 'Buyer #5128', region: 'Pune, MH',        rating: 4.3, deals: 14, verified: false },
  { name: 'Buyer #6071', region: 'Bengaluru, KA',   rating: 4.9, deals: 51, verified: true },
  { name: 'Buyer #5162', region: 'Chennai, TN',     rating: 4.4, deals: 22, verified: true },
  { name: 'Buyer #5189', region: 'Kakinada, AP',    rating: 4.6, deals: 30, verified: true },
  { name: 'Buyer #6112', region: 'Goa, GA',         rating: 4.2, deals: 11, verified: false },
  { name: 'Buyer #6321', region: 'Alappuzha, KL',   rating: 4.8, deals: 41, verified: true },
  { name: 'Buyer #6354', region: 'Howrah, WB',      rating: 4.5, deals: 18, verified: true },
  { name: 'Buyer #6045', region: 'Bhubaneswar, OD', rating: 4.4, deals: 16, verified: true },
] as const;

const BID_NOTES = [
  'Prefer cold-storage delivery; can pick up if needed.',
  'Bulk order, can take full quantity at this price.',
  'Need by tomorrow morning, locked in transport.',
  'Grade A only — please confirm before shipping.',
  'Open to staggered delivery across 2 days.',
  'Will pay 50% advance on confirmation.',
  'Looking for regular weekly supply if this works.',
  'HACCP-certified facility, can handle export packaging.',
];

const BID_TIMES = ['8m ago', '24m ago', '1h ago', '2h ago', '4h ago', '7h ago', '12h ago', '1d ago', '2d ago'];

export interface ItemBid {
  id: number;
  itemId: number;
  buyerName: string;
  buyerRegion: string;
  buyerRating: number;
  buyerDeals: number;
  buyerVerified: boolean;
  price: string;
  priceNum: number;
  qty: string;
  totalAmount: string;
  totalAmountNum: number;
  note: string;
  time: string;
  status: 'pending' | 'negotiating' | 'accepted' | 'declined' | 'countered';
  exchanges: number;
}

const parseQtyKg = (qty: string): number => {
  const num = qty.match(/[\d,]+/);
  if (!num) return 0;
  const n = Number(num[0].replace(/,/g, ''));
  if (/tonne/i.test(qty)) return n * 1000;
  return n;
};

export function bidsForItem(item: typeof SELLER_ITEMS[number]): ItemBid[] {
  if (!item.bids) return [];
  const itemQtyKg = parseQtyKg(item.qty);
  const out: ItemBid[] = [];
  for (let i = 0; i < item.bids; i++) {
    const buyer = BUYER_POOL[(item.id * 5 + i * 3) % BUYER_POOL.length];
    // Buyers typically bid above starting price — drift -3% to +18% deterministically.
    const drift = ((item.id * 11 + i * 17) % 22) - 3; // -3..+18
    const priceNum = Math.round(item.priceNum * (1 + drift / 100));
    const priceStr = `₹${priceNum.toLocaleString('en-IN')}/kg`;
    // Buyers bid for partial quantities sometimes.
    const partial = (item.id * 7 + i) % 3 === 0;
    const qtyKg = partial && itemQtyKg > 60 ? Math.round(itemQtyKg * (0.4 + ((i * 13) % 5) / 10)) : itemQtyKg;
    const qty = `${qtyKg.toLocaleString('en-IN')} kg`;
    const totalAmountNum = priceNum * qtyKg;
    let status: ItemBid['status'] = 'pending';
    if (i === 0 && item.bids > 1) status = 'negotiating';
    else if (i === 1 && item.bids > 3) status = 'countered';
    else if (item.status === 'sold' && i === 0) status = 'accepted';
    else if (item.status === 'expired') status = 'declined';
    out.push({
      id: item.id * 1000 + i + 1,
      itemId: item.id,
      buyerName: buyer.name,
      buyerRegion: buyer.region,
      buyerRating: buyer.rating,
      buyerDeals: buyer.deals,
      buyerVerified: buyer.verified,
      price: priceStr,
      priceNum,
      qty,
      totalAmount: `₹${totalAmountNum.toLocaleString('en-IN')}`,
      totalAmountNum,
      note: BID_NOTES[(item.id + i * 2) % BID_NOTES.length],
      time: BID_TIMES[i % BID_TIMES.length],
      status,
      exchanges: status === 'pending' ? 0 : Math.min(8, 1 + ((item.id + i * 3) % 5)),
    });
  }
  // Sort highest price first so the seller sees their best offer at the top.
  return out.sort((a, b) => b.priceNum - a.priceNum);
}

export const invoicesForRole = (role: 'buyer' | 'seller') => MOCK_INVOICES.filter(i => i.forRole === role);

export const MOCK_NOTIFICATIONS = [
  { id: 1, group: 'Today',      icon: 'gavel',       title: 'New bid on your Pomfret listing', body: '₹245/kg for 200 kg',                  time: '10:04 AM', unread: true },
  { id: 2, group: 'Today',      icon: 'check-circle',title: 'Your listing was approved',        body: 'Fresh Rohu · 500 kg is now live',     time: '8:30 AM',  unread: true },
  { id: 3, group: 'Yesterday',  icon: 'message',     title: 'Buyer #4837 countered',            body: '₹248/kg — tap to view thread',         time: '3:22 PM',  unread: false },
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
