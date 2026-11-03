// HGM Google Sheets bridge: server-to-server catalog and quote intake only.
// Set HGM_API_TOKEN in Apps Script Script Properties. Never expose it in a browser.
const DB_ID='1BqfMqyvbDc_GboCrP6EIxXyfoUuHfQLS5xHTmdihRqs';
function reply_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}
function table_(name){const sh=SpreadsheetApp.openById(DB_ID).getSheetByName(name);if(!sh)throw Error('MISSING_SHEET');return sh;}
function rows_(name){const data=table_(name).getDataRange().getValues(),keys=data[0].map(String);return data.slice(1).filter(row=>row.some(v=>v!=='' )).map(row=>Object.fromEntries(keys.map((k,i)=>[k,row[i] instanceof Date?row[i].toISOString():row[i]])));}
function required_(v,max){if(typeof v!=='string'||!v.trim()||v.length>max)throw Error('BAD_INPUT');return v.trim();}
function cell_(v){const s=String(v===null||v===undefined?'':v);return /^[=+@\-\t\r]/.test(s)?"'"+s:s;}
function doGet(){return reply_({ok:true,service:'HGM Móntate backend',version:1});}
function doPost(event){
 try{
  const p=JSON.parse(event.postData&&event.postData.contents||'{}');
  const key=PropertiesService.getScriptProperties().getProperty('HGM_API_TOKEN');
  if(!key||typeof p.token!=='string'||p.token!==key)return reply_({ok:false,error:'UNAUTHORIZED'});
  if(p.action==='health')return reply_({ok:true,db:DB_ID});
  if(p.action==='listTrips')return reply_({ok:true,rows:rows_('VIAJES').filter(x=>!p.publishedOnly||x.estado_publicacion==='published')});
  if(p.action==='listPackages')return reply_({ok:true,rows:rows_('PAQUETES')});
  if(p.action==='listPosts')return reply_({ok:true,rows:rows_('BLOG').filter(x=>x.estado_publicacion==='published')});
  if(p.action==='createQuote'){
   const q=p.quote||{},name=required_(q.customerName,160),email=required_(q.customerEmail,320).toLowerCase();
   if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw Error('BAD_INPUT');
   const destination=required_(q.destination,200),start=required_(q.startDate,30),end=required_(q.endDate,30);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||end<start)throw Error('BAD_INPUT');
   const people=Number(q.travelers),budget=Number(q.budget);
   if(!Number.isInteger(people)||people<1||people>20||!Number.isFinite(budget)||budget<=0)throw Error('BAD_INPUT');
   const motive=required_(q.motive,300),expectations=required_(q.expectations,4000);
   const lock=LockService.getScriptLock();if(!lock.tryLock(10000))return reply_({ok:false,error:'BUSY'});
   try{
    const id=Utilities.getUuid(),now=new Date().toISOString();
    table_('COTIZACIONES').appendRow([id,now,name,email,destination,start,end,people,budget,motive,expectations,'submitted','',now].map(cell_));
    return reply_({ok:true,requestId:id,status:'submitted'});
   }finally{lock.releaseLock();}
  }
  return reply_({ok:false,error:'UNKNOWN_ACTION'});
 }catch(e){console.error(e);return reply_({ok:false,error:'INVALID_OR_INTERNAL_ERROR'});}
}
