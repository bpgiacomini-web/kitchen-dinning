const KEY="metro-eats-v2-data";
const defaults={restaurants:[],visits:[],recipes:[],news:[],settings:{version:2}};
let state=load();
function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){return JSON.parse(JSON.stringify(defaults))}}
export function getState(){return state}
export function updateState(fn){const next=JSON.parse(JSON.stringify(state));fn(next);state=next;localStorage.setItem(KEY,JSON.stringify(state));return state}
export function id(prefix){return prefix+"_"+crypto.randomUUID()}
export function average(a){const v=a.filter(Number.isFinite);return v.length?v.reduce((x,y)=>x+y,0)/v.length:null}
export function restaurantScore(id){return average(state.visits.filter(v=>v.restaurantId===id&&Number.isFinite(v.overall)).map(v=>v.overall))}