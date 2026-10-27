import { SUBSCRIPTION_CUSTOMERS } from "../mock/admin/subscriptions";
import { readManagedUsers } from "../user-management/store";
import type { SubscriptionCustomer } from "../types/admin/subscriptions";
export function subscriptionCustomers(): SubscriptionCustomer[] {
  const users=readManagedUsers().users;
  const ids=new Set(SUBSCRIPTION_CUSTOMERS.map(c=>c.id));
  return [...SUBSCRIPTION_CUSTOMERS.map(c=>{const u=users.find(u=>u.login_email===c.email);return u?{...c,name:u.legal_name,eligible:u.role==="CLIENT"&&u.status==="ACTIVE"&&u.kyc_status==="VERIFIED"}:c;}),...users.filter(u=>u.role==="CLIENT"&&!ids.has(u.id)&&!SUBSCRIPTION_CUSTOMERS.some(c=>c.email===u.login_email)).map(u=>({id:u.id,name:u.legal_name,email:u.login_email,eligible:u.status==="ACTIVE"&&u.kyc_status==="VERIFIED"}))];
}
