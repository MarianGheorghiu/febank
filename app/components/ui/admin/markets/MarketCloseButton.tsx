import { ActionButton } from '../../dashboard/ActionButton';
export default function MarketCloseButton({label,onClick,disabled=false}:{label:string;onClick:()=>void;disabled?:boolean}) {
  return <ActionButton autoWidth size="small" variant="red" className="shrink-0" style={{background:"linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)",color:"#ffffff",borderColor:"#f87171",minHeight:0,padding:"4px 8px",borderRadius:8,fontSize:10,lineHeight:"15px"}} aria-label={label} title={label} disabled={disabled} onClick={onClick}>Close</ActionButton>;
}
