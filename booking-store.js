let auth;
const API = "https://amal-medical-assistant.onrender.com/api";
function init(_database, authentication) { auth = authentication; }
async function request(path, options = {}) {
  const user = auth?.currentUser;
  if (!user) throw new Error(Amal.text("سجل الدخول أولًا.", "Sign in first."));
  const token = await user.getIdToken();
  const response = await fetch(API + path, {
    ...options, cache:"no-store", signal:AbortSignal.timeout(90000),
    headers:{"Content-Type":"application/json",Authorization:"Bearer "+token,...options.headers}
  });
  const data = await response.json().catch(()=>{throw new Error(Amal.text("الخدمة تستيقظ. أعد المحاولة بعد دقيقة.", "The service is starting. Retry in a minute."))});
  if (auth?.currentUser?.uid !== user.uid) throw new Error(Amal.text("تغيّر الحساب. أعد فتح الصفحة.", "Account changed. Reload the page."));
  if (!response.ok) throw new Error(data.answer || Amal.text("تعذر إتمام العملية.", "The request could not be completed."));
  return data;
}
async function listMine() {
  const bookings=[];let cursor="";
  do {
    const page=await request("/bookings"+(cursor?"?cursor="+encodeURIComponent(cursor):""));
    bookings.push(...page.bookings);cursor=page.nextCursor;
  }while(cursor);
  return bookings;
}
async function forDoctor(email,date) {
  const params=new URLSearchParams({doctor_email:email,date});
  return (await request("/bookings/availability?"+params)).bookings;
}
async function create(payload) { return (await request("/bookings",{method:"POST",body:JSON.stringify(payload)})).id; }
async function update(booking,patch) {
  const allowed={};
  for(const key of ["status","date","time","reschedule_reason","doctor_notes"])if(key in patch)allowed[key]=patch[key];
  allowed.expected={date:booking.date,time:booking.time,status:booking.status};
  return request("/bookings/"+encodeURIComponent(booking.id),{method:"PATCH",body:JSON.stringify(allowed)});
}
function subscribe(onData,onError) {
  let stopped=false,running=false,prior=new Map();
  async function refresh() {
    if(stopped||running||document.hidden)return;
    running=true;
    try{
      const records=await listMine();if(stopped)return;
      const changes=records.filter(b=>prior.get(b.id)!==JSON.stringify(b)).map(b=>({type:prior.has(b.id)?"modified":"added"}));
      prior=new Map(records.map(b=>[b.id,JSON.stringify(b)]));
      onData({docs:records.map(b=>({id:b.id,data:()=>b})),docChanges:()=>changes});
    }catch(error){if(!stopped)onError?.(error)}finally{running=false}
  }
  refresh();const interval=setInterval(refresh,20000);
  const visibility=()=>{if(!document.hidden)refresh()};
  document.addEventListener("visibilitychange",visibility);
  return()=>{stopped=true;clearInterval(interval);document.removeEventListener("visibilitychange",visibility)};
}
window.AmalBooking = {init,create,update,forDoctor,listMine,subscribe,profile:()=>request("/doctor/profile"),setAvailability:available=>request("/doctor/profile",{method:"PATCH",body:JSON.stringify({available})})};
