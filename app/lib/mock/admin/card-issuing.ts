import { initialUsers } from "./users";
import type { CardCustomer, CardIssuingState, IssuedCard } from "@/app/lib/types/admin/card-issuing";

const customerProfiles: Record<string, Pick<CardCustomer, "kycStatus" | "deliveryAddress">> = {
  "USR-1204": { kycStatus: "VERIFIED", deliveryAddress: "Str. Lalelelor 12, București, 030167, România" },
  "USR-2315": { kycStatus: "VERIFIED", deliveryAddress: "Str. Memorandumului 8, Cluj-Napoca, 400114, România" },
  "USR-3426": { kycStatus: "IN_REVIEW", deliveryAddress: null },
  "USR-0883": { kycStatus: "VERIFIED", deliveryAddress: null },
};
export const MOCK_CARD_CUSTOMERS: CardCustomer[] = initialUsers.filter(user => user.role === "CLIENT").map(user => ({
  id: user.id, name: user.name, email: user.email, accountStatus: user.status,
  ...(customerProfiles[user.id] ?? { kycStatus: "IN_REVIEW", deliveryAddress: null }),
}));
export const MOCK_ISSUING_POLICY = {
  maxOpenCardsPerCustomer: 5,
  maxMonthlyLimit: 100000,
  defaultLimits: { daily: 2500, monthly: 15000, atmDaily: 500 },
  currencies: ["EUR", "USD", "RON"],
  networks: ["VISA", "MASTERCARD"],
} as const;

const seedCard = (overrides: Partial<IssuedCard> & Pick<IssuedCard, "id" | "userId" | "last4">): IssuedCard => ({
  type: "PHYSICAL", network: "VISA", currency: "EUR", expiry: "09/29", status: "ACTIVE",
  limits: { ...MOCK_ISSUING_POLICY.defaultLimits },
  channels: { online: true, atm: true, contactless: true, international: true },
  spentToday: 125, spentThisMonth: 1840,
  delivery: "DELIVERED", deliveryAddress: customerProfiles[overrides.userId]?.deliveryAddress ?? null,
  trackingReference: "MB-RO-720041", createdAt: "2026-09-01T09:00:00Z", updatedAt: "2026-10-08T07:00:00Z",
  version: 1, replacesCardId: null, replacedByCardId: null, ...overrides,
});
export const MOCK_CARD_ISSUING_STATE: CardIssuingState = {
  revision: 0,
  cards: [
    seedCard({ id: "CRD-1001", userId: "USR-1204", last4: "4821" }),
    seedCard({ id: "CRD-1002", userId: "USR-1204", last4: "9073", type: "VIRTUAL", network: "MASTERCARD", currency: "USD", delivery: "NOT_REQUIRED", deliveryAddress: null, trackingReference: null, channels: { online: true, atm: false, contactless: false, international: true }, limits: { daily: 1000, monthly: 5000, atmDaily: 0 }, spentToday: 0, spentThisMonth: 380 }),
    seedCard({ id: "CRD-1003", userId: "USR-2315", last4: "6154", status: "FROZEN", spentToday: 0, spentThisMonth: 620 }),
    seedCard({ id: "CRD-1004", userId: "USR-2315", last4: "3382", status: "PENDING", currency: "RON", delivery: "ORDERED", createdAt: "2026-10-23T09:00:00Z", updatedAt: "2026-10-23T09:00:00Z", trackingReference: null, spentToday: 0, spentThisMonth: 0 }),
    seedCard({ id: "CRD-1005", userId: "USR-0883", last4: "1208", status: "BLOCKED", spentToday: 0, spentThisMonth: 0 }),
    seedCard({ id: "CRD-1006", userId: "USR-1204", last4: "7690", status: "TERMINATED", spentToday: 0, spentThisMonth: 0 }),
    seedCard({ id: "CRD-1007", userId: "USR-2315", last4: "2448", status: "PENDING", delivery: "DISPATCHED", trackingReference: "MB-RO-720088", spentToday: 0, spentThisMonth: 0 }),
  ],
  audit: [
    { id: "CAU-001", timestamp: "2026-10-08T07:00:00Z", actor: "operations@admin.com", action: "FREEZE", cardId: "CRD-1003", userId: "USR-2315", reason: "Customer reported an unrecognized authorization; investigation opened.", before: null, after: null },
    { id: "CAU-002", timestamp: "2026-10-07T13:30:00Z", actor: "operations@admin.com", action: "DISPATCH", cardId: "CRD-1007", userId: "USR-2315", reason: "Physical card handed over to the verified delivery partner.", before: null, after: null },
  ],
};

// Historical examples correspond to registry records; no customer funds were moved.
MOCK_CARD_ISSUING_STATE.audit.unshift({id:"CAU-003",timestamp:"2026-10-23T09:00:00Z",actor:"issuing@admin.com",action:"ISSUE",cardId:"CRD-1004",userId:"USR-2315",reason:"Verified cardholder requested a RON physical card. Delivery address confirmed; card queued for production and dispatch.",before:null,after:structuredClone(MOCK_CARD_ISSUING_STATE.cards.find(c=>c.id==="CRD-1004")!)});
MOCK_CARD_ISSUING_STATE.audit.push({id:"CAU-004",timestamp:"2026-09-01T09:00:00Z",actor:"issuing@admin.com",action:"ACTIVATE",cardId:"CRD-1001",userId:"USR-1204",reason:"Cardholder identity and confirmed delivery verified. EUR physical card activated with approved channel controls.",before:{...structuredClone(MOCK_CARD_ISSUING_STATE.cards[0]),status:"PENDING",spentToday:0,spentThisMonth:0},after:{...structuredClone(MOCK_CARD_ISSUING_STATE.cards[0]),spentToday:0,spentThisMonth:0}});

/** Additional isolated examples for issuing, physical delivery and security review. */
const issuingDemoCustomers: CardCustomer[] = [
  {id:'USR-ISS-DEMO-01',name:'Ana Mărișan',email:'ana.marisan@issuing.example.test',accountStatus:'ACTIVE',kycStatus:'VERIFIED',deliveryAddress:'Str. Exemplu 14, București · adresă demonstrativă'},
  {id:'USR-ISS-DEMO-02',name:'Ștefan Dumitru',email:'stefan.dumitru@issuing.example.test',accountStatus:'ACTIVE',kycStatus:'VERIFIED',deliveryAddress:'Bd. Exemplu 22, Brașov · adresă demonstrativă'},
  {id:'USR-ISS-DEMO-03',name:'Elena Pavel',email:'elena.pavel@issuing.example.test',accountStatus:'ACTIVE',kycStatus:'VERIFIED',deliveryAddress:'Str. Exemplu 8, Iași · adresă demonstrativă'},
];
const recentCard=(suffix:string,owner:number,fields:Partial<IssuedCard>):IssuedCard=>seedCard({id:`CRD-ISS-DEMO-${suffix}`,userId:issuingDemoCustomers[owner].id,last4:suffix,createdAt:'2026-10-18T09:00:00Z',updatedAt:'2026-10-27T08:00:00Z',deliveryAddress:issuingDemoCustomers[owner].deliveryAddress,...fields});
const issuingDemoCards:IssuedCard[]=[
  recentCard('2001',0,{currency:'USD',spentToday:38,spentThisMonth:480,createdAt:'2026-10-15T09:00:00Z'}),
  recentCard('2002',0,{type:'VIRTUAL',currency:'EUR',spentToday:5,spentThisMonth:75,delivery:'NOT_REQUIRED',deliveryAddress:null,trackingReference:null,limits:{daily:1200,monthly:6000,atmDaily:0},channels:{online:true,atm:false,contactless:false,international:true},createdAt:'2026-10-20T10:00:00Z'}),
  recentCard('2003',1,{currency:'RON',status:'PENDING',delivery:'ORDERED',trackingReference:null,spentToday:0,spentThisMonth:0,createdAt:'2026-10-24T11:00:00Z'}),
  recentCard('2004',1,{type:'VIRTUAL',currency:'USD',status:'PENDING',delivery:'NOT_REQUIRED',deliveryAddress:null,trackingReference:null,spentToday:0,spentThisMonth:0,limits:{daily:1000,monthly:5000,atmDaily:0},channels:{online:true,atm:false,contactless:false,international:true},createdAt:'2026-10-26T12:00:00Z'}),
  recentCard('2005',2,{status:'PENDING',delivery:'DELIVERED',trackingReference:'DEMO-DELIVERY-2005',spentToday:0,spentThisMonth:0,createdAt:'2026-10-21T10:00:00Z'}),
  recentCard('2006',2,{type:'VIRTUAL',currency:'USD',status:'FROZEN',delivery:'NOT_REQUIRED',deliveryAddress:null,trackingReference:null,spentToday:0,spentThisMonth:210,limits:{daily:500,monthly:2500,atmDaily:0},channels:{online:true,atm:false,contactless:false,international:false},version:2,updatedAt:'2026-10-25T15:00:00Z'}),
  recentCard('2007',0,{status:'TERMINATED',replacedByCardId:'CRD-ISS-DEMO-2008',spentToday:0,spentThisMonth:0,version:2,createdAt:'2026-10-17T09:00:00Z',updatedAt:'2026-10-26T13:00:00Z'}),
  recentCard('2008',0,{status:'PENDING',delivery:'ORDERED',trackingReference:null,replacesCardId:'CRD-ISS-DEMO-2007',spentToday:0,spentThisMonth:0,createdAt:'2026-10-26T13:00:00Z'}),
];
const issuingDemoAudit:CardIssuingState['audit']=issuingDemoCards.filter(c=>c.id!=='CRD-ISS-DEMO-2008').map(card=>({id:`CAU-ISS-DEMO-${card.last4}`,timestamp:card.createdAt,actor:'issuing.demo@admin.com',action:'ISSUE',cardId:card.id,userId:card.userId,reason:`Demo example: ${card.type.toLowerCase()} ${card.currency} card issued for a verified cardholder. No wallet funds moved.`,before:null,after:{...structuredClone(card),version:1,status:'PENDING',delivery:card.type==='VIRTUAL'?'NOT_REQUIRED':'ORDERED',spentToday:0,spentThisMonth:0,replacesCardId:null,replacedByCardId:null,trackingReference:null}}));
issuingDemoAudit.unshift({id:'CAU-ISS-DEMO-REPLACE',timestamp:'2026-10-26T13:00:00Z',actor:'security.demo@admin.com',action:'REPLACE',cardId:'CRD-ISS-DEMO-2007',userId:issuingDemoCustomers[0].id,reason:'Demo replacement: the reported lost card was closed and a linked physical replacement entered fulfilment. Existing controls were retained.',before:{...structuredClone(issuingDemoCards[6]),status:'ACTIVE',version:1,replacedByCardId:null},after:structuredClone(issuingDemoCards[6])});
issuingDemoAudit.unshift({id:'CAU-ISS-DEMO-FREEZE',timestamp:'2026-10-25T15:00:00Z',actor:'security.demo@admin.com',action:'FREEZE',cardId:'CRD-ISS-DEMO-2006',userId:issuingDemoCustomers[2].id,reason:'Demo security review: unrecognized online authorization reported by the cardholder. Operations freeze remains in place pending investigation.',before:{...structuredClone(issuingDemoCards[5]),status:'ACTIVE',version:1},after:structuredClone(issuingDemoCards[5])});
export function enrichIssuingDemo(state:CardIssuingState):CardIssuingState {
  if(state.demo_fixture_version===2)return state;
  // Keep an existing profile's identity when the demo email was enrolled earlier.
  const owners=new Map(issuingDemoCustomers.map(c=>[c.id,state.customers?.find(existing=>existing.id===c.id||existing.email.toLowerCase()===c.email.toLowerCase())?.id??c.id]));
  const owner=(id:string|null)=>id===null?null:owners.get(id)??id;
  const remap=(card:IssuedCard|null)=>card?{...structuredClone(card),userId:owner(card.userId)!}:null;
  const cards=issuingDemoCards.filter(c=>!state.cards.some(existing=>existing.id===c.id)).map(c=>remap(c)!);
  const audit=issuingDemoAudit.filter(e=>!state.audit.some(existing=>existing.id===e.id)).map(e=>({...e,userId:owner(e.userId),before:remap(e.before),after:remap(e.after)}));
  return {...state,demo_fixture_version:2,revision:state.revision+1,customers:[...(state.customers??[]),...issuingDemoCustomers.filter(c=>owners.get(c.id)===c.id&&!state.customers?.some(existing=>existing.id===c.id||existing.email.toLowerCase()===c.email.toLowerCase()))],cards:[...state.cards,...cards],audit:[...state.audit,...audit].sort((a,b)=>b.timestamp.localeCompare(a.timestamp))};
}
MOCK_CARD_ISSUING_STATE.customers=issuingDemoCustomers;
MOCK_CARD_ISSUING_STATE.cards.push(...issuingDemoCards);
MOCK_CARD_ISSUING_STATE.audit.push(...issuingDemoAudit);
MOCK_CARD_ISSUING_STATE.audit.sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
MOCK_CARD_ISSUING_STATE.demo_fixture_version=2;
