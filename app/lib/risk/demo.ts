import type { RiskCase, RiskState } from '../types/admin/risk';
/** Isolated identities: sample restrictions never freeze a real demo user's wallet. */
export function enrichRiskDemo(state: RiskState): RiskState {
  if ((state.demoFixtureVersion ?? 0) >= 1) return state;
  const next = structuredClone(state);
  const names = ['Ana Mărișan','Ștefan Dumitru','Elena Pavel','Victor Dima','Maria Rusu','Alex Popescu','Daria Luca','Mihai Tudor','Ioana Sandu','Paul Nistor','Sofia Marin','Vlad Dumitrescu'];
  names.forEach((name,index) => {
    const id=`RSK-DEMO-${2001+index}`,email=`risk-demo-${index+1}@example.test`,resolved=index>=8, score=[94,82,69,57,88,73,42,91,66,31,86,52][index];
    if(next.cases.some(item=>item.id===id))return;
    const createdAt=`2026-10-${String(index===6||index===7?28:16+index).padStart(2,'0')}T08:00:00Z`;
    const item:RiskCase={id,email,subject:name,domain: index%3===0?'FIAT':index%3===1?'CRYPTO':'STOCK',category:['Beneficiary velocity','Wallet screening','Trading surveillance','Device anomaly'][index%4],reference:`DEMO-INC-${2001+index}`,amountUsd:[8700,15320,4800,1250,22400,9700,640,18200,3200,720,11800,2100][index],score,severity:score>=85?'CRITICAL':score>=65?'HIGH':score>=40?'MEDIUM':'LOW',status:resolved?'RESOLVED':index%3===0?'ESCALATED':index%3===1?'INVESTIGATING':'OPEN',owner:resolved||index%3!==2?'analyst@admin.com':null,createdAt,dueAt:`2026-10-${String(index===6||index===7?29:Math.min(29,17+index)).padStart(2,'0')}T18:00:00Z`,evidence:['Demonstration scenario; no external alert feed is connected.',['Repeated transfers to recently added beneficiaries.','Counterparty association requires an analyst review.','Order pattern deviates from the recorded activity profile.','New device and unusual location signals.'][index%4]],notes:resolved?[{actor:'analyst@admin.com',text:'Reviewed sample evidence and documented the investigation outcome.',timestamp:createdAt}]:[],resolution:resolved?(index%2===0?'CONFIRMED':'FALSE_POSITIVE'):null};
    next.cases.push(item);
    next.audit.push({id:`RISK-SEED-OPEN-${index}`,actor:'analyst@admin.com',action:'CREATE_CASE',target:id,reason:'Demonstration investigation opened from a simulated monitoring signal.',timestamp:createdAt,before:null,after:{...item,status:'OPEN',owner:null,notes:[],resolution:null}});
    if(item.status!=='OPEN') next.audit.push({id:`RISK-SEED-STATE-${index}`,actor:'analyst@admin.com',action:resolved?'RESOLVE':item.status==='ESCALATED'?'ESCALATE':'ASSIGN',target:id,reason:resolved?'Sample investigation completed; account controls remain independent.':'Sample case assigned to the compliance investigation queue.',timestamp:createdAt,before:{status:'OPEN'},after:item});
  });
  for (const index of [0,4,7]) {
    const email=`risk-demo-${index+1}@example.test`;
    if(next.restrictions.some(item=>item.email===email))continue;
    const restriction={email,reason:'Isolated demo restriction pending enhanced review of sample evidence.',actor:'analyst@admin.com',timestamp:'2026-10-27T09:00:00Z',releaseRequestedBy:index===4?'reviewer@admin.com':null};
    next.restrictions.push(restriction);
    next.audit.push({id:`RISK-SEED-FREEZE-${index}`,actor:restriction.actor,action:'FREEZE',target:email,reason:restriction.reason,timestamp:restriction.timestamp,before:null,after:{...restriction,releaseRequestedBy:null}});
    if(restriction.releaseRequestedBy)next.audit.push({id:`RISK-SEED-RELEASE-${index}`,actor:restriction.releaseRequestedBy,action:'REQUEST_RELEASE',target:email,reason:'Sample evidence reviewed; second administrator approval is pending.',timestamp:'2026-10-27T11:00:00Z',before:{...restriction,releaseRequestedBy:null},after:restriction});
  }
  next.demoFixtureVersion=1;next.revision++;
  next.audit=next.audit.map(entry=>structuredClone(entry));
  next.audit.sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
  return next;
}
