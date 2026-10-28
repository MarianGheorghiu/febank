import { initialWallet, applyWalletEvent, type WalletEvent } from '../wallet/engine';
import { initializeMarketDemoWallet, transactionDemoWalletExists } from '../wallet/store';
import { projectTrading } from '../wallet/trading';
import { quoteTrade } from './engine';
import { MOCK_MARKETS_STATE, MOCK_TRADING_WALLET } from './seed';
import type { MarketOrder } from '../types/admin/markets';

/** Replayable venue fixtures: real demo settlements and reservations, isolated from the signed-in user. */
export function seedMarketDemo(now: string) {
  for (const [index, name] of ['atlas','nova','orion','vega'].entries()) {
    const customer=`markets-demo-${name}@example.test`;
    if(transactionDemoWalletExists(customer))continue;
    const actor={email:customer,role:'client' as const};
    let state=initialWallet();const events:WalletEvent[]=[];
    const record=(event:WalletEvent)=>{state=applyWalletEvent(state,event);events.push(event);};
    const at=(hours:number)=>new Date(Date.parse(now)-hours*3600000).toISOString();
    for(let i=0;i<6;i++) {
      const view=projectTrading(state,MOCK_MARKETS_STATE,customer),symbol=i%2?'ETH':'BTC',item=view.instruments.find(asset=>asset.symbol===symbol)!;
      const key=`markets-demo-${name}-fill-${i}`;
      record({kind:'trading',key,at:at(96-i*4-index),catalog:MOCK_MARKETS_STATE,actor,command:{type:'trade',request:{symbol,side:i%3===2?'SELL':'BUY',quantity:symbol==='BTC'?0.001*(index+1):0.01*(index+1),type:'MARKET',expectedVersion:item.version,expectedRoutingVersion:1}}});
    }
    // Simulated venue acceptance imports pending market orders. The existing migration
    // adapter reserves the same canonical USD balance that PROCESS/CANCEL later settle.
    for(let i=0;i<5;i++) {
      const view=projectTrading(state,MOCK_MARKETS_STATE,customer),symbol=i%2?'ETH':'BTC',item=view.instruments.find(asset=>asset.symbol===symbol)!;
      const quantity=symbol==='BTC'?0.001:0.01,quote=quoteTrade(item,'BUY',quantity);
      const key=`markets-demo-${name}-venue-${i}`,created=at(32-i*3-index);
      const order:MarketOrder={id:key,userEmail:customer,domain:'CRYPTO',symbol,side:'BUY',type:'MARKET',quantity,targetPrice:null,status:i===4?'REJECTED':'PENDING',price:quote.price,feeUsd:quote.feeUsd,totalUsd:quote.totalUsd,currency:'USD',reservedCash:i===4?0:quote.cashAmount,createdAt:created,updatedAt:created,note:i===4?'Demo venue rejected order before execution; no funds reserved.':'Demo venue accepted order; awaiting operator processing.'};
      record({kind:'trading_migration',key:`${key}-import`,at:created,catalog:MOCK_MARKETS_STATE,customer,wallet:{...MOCK_TRADING_WALLET,costBasis:{...state.trading.cost_basis}},orders:[...view.orders,order]});
      if(i<3)record({kind:'trading_admin',key:`${key}-cancel`,at:at(31-i*3-index),catalog:MOCK_MARKETS_STATE,customer,actor:{role:'admin',email:'demo.ops@admin.com'},command:{action:'CANCEL',orderId:key,reason:`Demo venue review ${name.toUpperCase()}-${i+1}: cancel unexecuted request and release its USD reservation.`}});
    }
    initializeMarketDemoWallet(customer,events);
  }
}

/** Equity examples use the real LIMIT/STOP submission path and their own wallet journals. */
export function seedStockMarketDemo(now: string) {
  for (const [index,name] of ['equities','growth','income','index'].entries()) {
    const customer=`markets-demo-${name}@example.test`;
    if(transactionDemoWalletExists(customer))continue;
    const actor={email:customer,role:'client' as const};
    const operator={email:'demo.ops@admin.com',role:'admin' as const};
    let state=initialWallet();const events:WalletEvent[]=[];
    const record=(event:WalletEvent)=>{state=applyWalletEvent(state,event);events.push(event);};
    const at=(hours:number)=>new Date(Date.parse(now)-hours*3600000).toISOString();
    const submit=(id:string,hours:number,symbol:string,side:'BUY'|'SELL',quantity:number,type:MarketOrder['type']='MARKET',factor=1)=>{
      const view=projectTrading(state,MOCK_MARKETS_STATE,customer),item=view.instruments.find(asset=>asset.symbol===symbol)!;
      record({kind:'trading',key:`markets-demo-${name}-${id}`,at:at(hours-index),catalog:MOCK_MARKETS_STATE,actor,command:{type:'trade',request:{symbol,side,quantity,type,...(type==='MARKET'?{}:{targetPrice:Math.round(item.priceUsd*factor*100)/100}),expectedVersion:item.version,expectedRoutingVersion:view.routing.STOCK.version}}});
    };
    submit('fill-0',90,'AAPL','BUY',2);
    submit('fill-1',84,'MSFT','BUY',1);
    submit('fill-2',78,'NVDA','BUY',2);
    submit('fill-3',72,'AAPL','SELL',1);
    submit('fill-4',66,'MSFT','BUY',0.5);
    submit('fill-5',60,'NVDA','BUY',1);
    for(let i=0;i<3;i++) {
      const id=`cancel-${i}`;submit(id,40-i*3,'AAPL','BUY',1,'LIMIT',0.8);
      record({kind:'trading_admin',key:`markets-demo-${name}-${id}-decision`,at:at(39-i*3-index),catalog:MOCK_MARKETS_STATE,customer,actor:operator,command:{action:'CANCEL',orderId:`markets-demo-${name}-${id}`,reason:`Demo equity review ${name.toUpperCase()}-${i+1}: release this unexecuted limit order reservation.`}});
    }
    submit('limit-eligible',24,'AAPL','BUY',1,'LIMIT',1.02);
    submit('stop-waiting',22,'MSFT','BUY',1,'STOP',1.2);
    submit('limit-waiting',20,'NVDA','SELL',1,'LIMIT',1.1);
    submit('stop-sell',18,'AAPL','SELL',1,'STOP',1.02);
    submit('stop-buy',16,'NVDA','BUY',1,'STOP',0.95);
    const view=projectTrading(state,MOCK_MARKETS_STATE,customer),item=view.instruments.find(asset=>asset.symbol==='AAPL')!,quote=quoteTrade(item,'BUY',1);
    const created=at(8-index),key=`markets-demo-${name}-venue-rejected`;
    const rejected:MarketOrder={id:key,userEmail:customer,domain:'STOCK',symbol:'AAPL',side:'BUY',type:'MARKET',quantity:1,targetPrice:null,status:'REJECTED',price:quote.price,feeUsd:quote.feeUsd,totalUsd:quote.totalUsd,currency:'USD',reservedCash:0,createdAt:created,updatedAt:created,note:'Demo broker rejected the request before acceptance; no customer funds reserved.'};
    record({kind:'trading_migration',key:`${key}-import`,at:created,catalog:MOCK_MARKETS_STATE,customer,wallet:{...MOCK_TRADING_WALLET,costBasis:{...state.trading.cost_basis}},orders:[...view.orders,rejected]});
    initializeMarketDemoWallet(customer,events);
  }
}
