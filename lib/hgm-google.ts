import "server-only";
import type { Trip, TripCategory, TripPackage } from "@/lib/types";
type Reply={ok:boolean;error?:string;rows?:Record<string,unknown>[];requestId?:string};
export function hgmGoogleReady(){return Boolean(process.env.HGM_GOOGLE_APPS_SCRIPT_URL&&process.env.HGM_GOOGLE_API_TOKEN);}
async function call(action:string,extra:Record<string,unknown>={}):Promise<Reply>{
 const endpoint=process.env.HGM_GOOGLE_APPS_SCRIPT_URL, token=process.env.HGM_GOOGLE_API_TOKEN;
 if(!endpoint||!token)throw new Error("HGM Google backend not configured");
 const url=new URL(endpoint);
 if(url.protocol!=="https:"||!["script.google.com","script.googleusercontent.com"].includes(url.hostname))throw new Error("Invalid HGM Google URL");
 const response=await fetch(url.toString(),{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,token,...extra}),cache:"no-store",signal:AbortSignal.timeout(12000),redirect:"follow"});
 if(!response.ok)throw new Error("HGM Google HTTP "+response.status);
 const json=await response.json() as Reply;
 if(!json.ok)throw new Error("HGM Google response "+json.error);
 return json;
}
function str(v:unknown){return v===undefined||v===null?"":String(v);}
function num(v:unknown){const n=Number(v);return Number.isFinite(n)?n:0;}
function arr(v:unknown):string[]{if(Array.isArray(v))return v.map(str);try{const a=JSON.parse(str(v)||"[]");return Array.isArray(a)?a.map(str):[]}catch{return []}}
export async function listGoogleTrips(options?:{publishedOnly?:boolean;featuredOnly?:boolean}):Promise<Trip[]>{
 const [a,b]=await Promise.all([call("listTrips",{publishedOnly:options?.publishedOnly??false}),call("listPackages")]);
 const packages=b.rows||[];
 return (a.rows||[]).filter(r=>!options?.featuredOnly||r.destacado===true||r.destacado==="TRUE").map(r=>{
 const matching:TripPackage[]=packages.filter(p=>str(p.trip_id)===str(r.trip_id)).map(p=>({id:str(p.package_id),roomType:str(p.tipo_habitacion)==="single"?"single":str(p.tipo_habitacion)==="triple"?"triple":"doble",pricePerPerson:num(p.precio_persona_usd),deposit:num(p.deposito_usd),paymentPlan:str(p.plan_pagos)}));
 return {id:str(r.trip_id),slug:str(r.slug),title:str(r.titulo),destination:str(r.destino),category:str(r.categoria) as TripCategory,startDate:str(r.fecha_inicio),endDate:str(r.fecha_fin),availableSpots:num(r.cupos_disponibles),totalSpots:num(r.cupos_totales),heroImage:str(r.imagen_portada),summary:str(r.descripcion),priceFrom:num(r.precio_desde_usd)||undefined,includes:arr(r.incluye_json),excludes:arr(r.excluye_json),policies:arr(r.politicas_json),requirements:[],itinerary:[],packages:matching,addons:[],publishStatus:str(r.estado_publicacion) as Trip["publishStatus"],featured:r.destacado===true||r.destacado==="TRUE"};
 });
}
export async function createGoogleQuote(input:{customerName:string;customerEmail:string;destination:string;startDate:string;endDate:string;travelers:number;budget:number;motive:string;expectations:string}){
 const r=await call("createQuote",{quote:input});if(!r.requestId)throw Error("Missing quote ID");return r.requestId;
}
export async function googleHealth(){return call("health");}
