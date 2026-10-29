"use client";
import type { CardCustomer } from "@/app/lib/types/admin/card-issuing";
import { customerIsEligible } from "@/app/lib/admin/card-issuing";
import CustomerPicker from "../../CustomerPicker";
export default function CardCustomerPicker({customers,value,onChange}:{customers:CardCustomer[];value:string;onChange:(id:string)=>void}) {
  return <CustomerPicker customers={customers.filter(customerIsEligible).map(c=>({id:c.id,name:c.name,email:c.email,detail:c.deliveryAddress?'Physical & virtual':'Virtual · delivery address missing'}))} value={value} onChange={onChange} label="1. Choose the cardholder" listLabel="Eligible cardholders" selectedLabel="Selected cardholder" emptyMessage="No eligible cardholders match. Try a name, email or ID. Account status and KYC are managed in User Management."/>;
}
