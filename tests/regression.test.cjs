const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM, VirtualConsole } = require(process.env.AMAL_JSDOM || "jsdom");
const root = path.join(__dirname, "..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const stripImports = source => source.replace(/^\s*import\s+(?:(?:\{[\s\S]*?\}|[A-Za-z_$][\w$]*)\s+from\s+)?["'][^"']+["'];/gm, "");
function helpers() { const ctx = vm.createContext({ Intl, Date, console }); vm.runInContext(read("amal-core.js"), ctx); return ctx.Amal; }
const A = helpers();
test("45-minute appointments do not overlap or overrun closing time", () => {
  const times = A.slots({slotDuration:45}, "2099-01-01");
  assert.deepEqual(Array.from(times.slice(0, 4)), ["09:00","09:45","10:30","11:15"]);
  for (let i=1;i<times.length;i++) assert.equal(A.minutes(times[i])-A.minutes(times[i-1]),45);
  assert.ok(A.minutes(times.at(-1))+45 <= 17*60);
});
test("closed days, invalid duration, and past days have no slots", () => {
  assert.equal(A.slots({slotDuration:0, workingDays:[]}, "2099-01-01").length,0);
  assert.equal(A.slots({slotDuration:-30}, "2099-01-01").length,0);
  assert.equal(A.slots({}, "2000-01-01").length,0);
  assert.equal(A.slots({schedule:{4:{closed:true}}}, "2099-01-01").length,0);
});
test("facility timezone controls whether an appointment is in the past", () => {
  assert.equal(A.dateInZone(new Date("2026-10-26T22:00:00Z")), "2026-10-27");
  assert.equal(A.slots({}, "2026-10-26", new Date("2026-10-26T22:00:00Z")).length,0);
});
test("phone validation accepts local and international numbers", () => {
  assert.equal(A.phone("0791234567"),"+962791234567");
  assert.equal(A.phone("+44 7700 900123"),"+447700900123");
  assert.equal(A.phone("not a phone"),null);
});
test("rescheduled appointments occupy time; cancelled appointments release it", () => {
  assert.ok(A.occupied({doctor_id:"d",date:"2099-01-01",time:"09:00",slot_duration:45,status:"RESCHEDULED"},"d","2099-01-01","09:30",30));
  assert.equal(A.occupied({doctor_id:"d",date:"2099-01-01",time:"09:00",status:"CANCELLED"},"d","2099-01-01","09:00"),false);
});
test("daily and weekly reminders advance from their original date", () => {
  assert.equal(A.nextOccurrence({date:"2026-10-01",time:"10:00",repeat:"daily"},new Date("2026-10-26T09:00:00")).getDate(),26);
  assert.equal(A.nextOccurrence({date:"2026-10-01",time:"10:00",repeat:"weekly"},new Date("2026-10-26T09:00:00")).getDate(),29);
});
test("malformed local storage is handled and account keys differ", () => {
  assert.equal(A.readList({getItem:()=>"{broken"},"x").length,0);
  assert.notEqual(A.userKey("reminders","a"),A.userKey("reminders","b"));
});
test("every inline script parses, including Firebase module bodies", () => {
  for (const file of ["index.html","Patient_booking_page.html","doctor_dashboard.html","doctor_login.html","login_Patient.html"]) {
    for (const script of [...read(file).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)]) {
      const src=script[1].match(/src="([^"]+)"/);
      if(src && /^https?:/.test(src[1]))continue;
      if(src)script[2]=read(src[1]);
      new vm.Script(script[1].includes('type="module"') ? "(async()=>{"+stripImports(script[2])+"})()" : script[2],{filename:file});
    }
  }
  for (const file of ["amal-core.js","amal-ui.js","booking-store.js","service-worker.js"]) new vm.Script(stripImports(read(file)),{filename:file});
});
async function bookingDOM() {
  const errors=[];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError",e=>errors.push(e.message));
  const dom = new JSDOM(read("Patient_booking_page.html"), {url:"https://example.test/",runScripts:"outside-only",virtualConsole});
  const w=dom.window, ctx=dom.getInternalVMContext();
  w.alert=()=>{}; w.confirm=()=>true; w.setInterval=()=>0; w.setTimeout=()=>0; w.scrollTo=()=>{};
  w.bootstrap={Modal:class{show(){}}};
  w.auth={currentUser:{uid:"test-patient",email:"patient@example.test"}};
  w.bookingsDb={};
  w.collection=(...args)=>args;
  w.getDocs=async()=>({docs:[]});
  w.AmalBooking={forDoctor:async()=>[],listMine:async()=>[],create:async()=> "saved"};
  vm.runInContext(read("amal-core.js"),ctx);
  for(const script of [...w.document.querySelectorAll("script")]) {
    if(script.type === "module")continue;
    const src=script.getAttribute("src");
    if(src && (/^https?:/.test(src) || src === "amal-core.js"))continue;
    vm.runInContext(src ? read(src) : script.textContent,ctx);
  }
  await new Promise(resolve=>setImmediate(resolve));
  return {dom,w,ctx,errors};
}
test("booking page loads without missing-element exceptions", async () => {
  const {dom,errors}=await bookingDOM(); assert.deepEqual(errors,[]); dom.window.close();
});
test("insurance submit reaches doctor selection even without optional note field", async () => {
  const {dom,w,ctx}=await bookingDOM();
  vm.runInContext('bookingState.currentStep=6;bookingState.hasInsurance=true;bookingState.hospital={docId:"h"};bookingState.department={docId:"dept"}',ctx);
  w.document.getElementById("insCompany").value="Insurer";
  w.document.getElementById("insPolicy").value="policy";
  w.getDocs=async()=>({docs:[]});
  w.document.getElementById("insForm").dispatchEvent(new w.Event("submit",{cancelable:true}));
  assert.equal(vm.runInContext("bookingState.currentStep",ctx),7);
  assert.equal(vm.runInContext("bookingState.insuranceDetails.company",ctx),"Insurer");
  dom.window.close();
});
test("one doctor card click retains the doctor object and reaches time selection",async()=>{
  const {dom,w,ctx}=await bookingDOM();
  vm.runInContext('bookingState.hospital={};bookingState.department={basePrice:10};doctors=[{id:"doctor-123",email:"doctor@example.test",name:"Doctor",slotDuration:45}];renderDoctors()',ctx);
  w.document.querySelector("[data-doc]").click();
  assert.equal(vm.runInContext("typeof bookingState.doctor",ctx),"object");
  assert.equal(vm.runInContext("bookingState.currentStep",ctx),8);
  dom.window.close();
});
test("failed saves leave no local phantom booking and repeated clicks save once",async()=>{
  const {dom,w,ctx}=await bookingDOM();
  let reject, calls=0;
  w.saveBookingToFirebase=()=>{calls++;return new Promise((_,no)=>reject=no)};
  vm.runInContext('bookingState.currentStep=9;bookingState.doctor={id:"d",email:"d@example.test",slotDuration:30};bookingState.date="2099-01-01";bookingState.time="09:00";bookingState.hospital={};bookingState.department={}',ctx);
  for(const [id,val]of [["custName","Patient"],["custEmail","p@example.test"],["custPhone","0791234567"]])w.document.getElementById(id).value=val;
  const first=vm.runInContext("confirmBooking()",ctx);
  await vm.runInContext("confirmBooking()",ctx);
  assert.equal(calls,1);
  reject(Error("offline")); await first;
  assert.equal(w.localStorage.getItem("localBookings"),null);
  assert.equal(w.document.getElementById("nextBtn").disabled,false);
  dom.window.close();
});
test("legacy local records never appear in another account's bookings",async()=>{
  const {dom,w}=await bookingDOM();
  w.localStorage.setItem("localBookings",JSON.stringify([{booking_id:"OTHER-PATIENT",doctor_name:"Private name"}]));
  await w.renderBookings();
  assert.ok(!w.document.getElementById("bookingsListBody").textContent.includes("OTHER-PATIENT"));
  dom.window.close();
});
test("reminder names are rendered as text rather than executable markup",async()=>{
  const {dom,w}=await bookingDOM();
  w.localStorage.setItem(w.Amal.userKey("reminders","test-patient"),JSON.stringify([{id:1,name:'<img src=x onerror="alert(1)">',time:"10:00",date:"2099-01-01",before:5,repeat:"daily"}]));
  w.renderList(); assert.equal(w.document.querySelector("#remindersList img"),null);
  assert.ok(w.document.getElementById("remindersList").textContent.includes("<img"));
  dom.window.close();
});
test("national ID login uses verified server lookup without public profile queries",async()=>{
  const dom=new JSDOM(read("login_Patient.html"),{url:"https://example.test/",runScripts:"outside-only"});
  const w=dom.window,ctx=dom.getInternalVMContext();w.alert=()=>{};let profileReads=0,signInEmail;
  Object.assign(w,{initializeApp:()=>({}),getAuth:()=>({}),getFirestore:()=>({}),getDocs:async()=>{profileReads++;return{empty:true}},collection:()=>({}),query:()=>({}),where:()=>({}),limit:()=>({}),doc:()=>({}),setDoc:async()=>{},createUserWithEmailAndPassword:async()=>{},sendPasswordResetEmail:async()=>{},signInWithEmailAndPassword:async(_auth,email)=>{signInEmail=email;throw Error("test rejects navigation")}});
  vm.runInContext(read("amal-core.js"),ctx);
  const module=[...w.document.querySelectorAll("script")].find(s=>s.type==="module");
  vm.runInContext("(function(){"+stripImports(module.getAttribute("src") ? read(module.getAttribute("src")) : module.textContent)+"})()",ctx);
  w.AbortSignal=AbortSignal;w.fetch=async(_url,options)=>{const body=JSON.parse(options.body);assert.equal(body.nationalID,"1234567890");assert.equal(body.password,"test-password");return{ok:true,json:async()=>({email:"patient@example.test"})}};
  w.document.getElementById("loginNationalID").value="1234567890";
  w.document.getElementById("loginPassword").value="test-password";
  await w.document.getElementById("loginBtn").onclick();
  assert.equal(signInEmail,"patient@example.test");assert.equal(profileReads,0);
  assert.equal(w.document.getElementById("loginBtn").disabled,false);w.close();
});
test("booking summary and rescheduled status use the selected language",async()=>{
  const {dom,w,ctx}=await bookingDOM();
  w.document.documentElement.lang="en";
  vm.runInContext("updateSummaryCard()",ctx);
  const summary=w.document.getElementById("summaryCard").textContent;
  assert.ok(summary.includes("Estimated cost"));assert.ok(summary.includes("Doctor"));
  assert.ok(w.getStatusBadge("RESCHEDULED").includes("Rescheduled"));dom.window.close();
});
test("actual DOM account changes cannot mix reminder lists",async()=>{
  const {dom,w}=await bookingDOM();
  w.localStorage.setItem(w.Amal.userKey("reminders","test-patient"),JSON.stringify([{id:1,name:"FIRST-ACCOUNT",date:"2099-01-01",time:"10:00",before:5,repeat:"none"}]));
  w.auth.currentUser={uid:"second-patient",email:"second@example.test"};
  w.renderList();assert.ok(!w.document.getElementById("remindersList").textContent.includes("FIRST-ACCOUNT"));dom.window.close();
});
async function doctorDOM() {
  const virtualConsole=new VirtualConsole();const errors=[];virtualConsole.on("jsdomError",e=>errors.push(e.message));
  const dom=new JSDOM(read("doctor_dashboard.html"),{url:"https://example.test/",runScripts:"outside-only",virtualConsole});
  const w=dom.window,ctx=dom.getInternalVMContext();
  w.alert=()=>{};w.confirm=()=>true;w.setInterval=()=>0;w.setTimeout=()=>0;
  const auth={currentUser:{uid:"doctor",email:"doctor@example.test"}};
  Object.assign(w,{initializeApp:()=>({}),getAuth:()=>auth,getFirestore:()=>({}),onAuthStateChanged:()=>{},signOut:async()=>{},collection:()=>({}),doc:(...p)=>({path:p.slice(1).join("/")}),getDoc:async()=>({exists:()=>false}),getDocs:async()=>({docs:[]}),query:()=>({}),where:()=>({}),limit:()=>({}),setDoc:async()=>{},updateDoc:async()=>{},serverTimestamp:()=>({seconds:1}),onSnapshot:()=>()=>{},writeBatch:()=>({update(){},set(){},commit:async()=>{}})});
  w.AmalBooking={init(){},update:async()=>{},profile:async()=>({name:"Catalog doctor",available:true}),subscribe:()=>()=>{}};
  vm.runInContext(read("amal-core.js"),ctx);
  const module=[...w.document.querySelectorAll("script")].find(s=>s.type==="module");
  vm.runInContext("(function(){"+stripImports(module.getAttribute("src") ? read(module.getAttribute("src")) : module.textContent)+";window.testDoctor={state,updateBookingStatus,rescheduleSelectedBooking,saveDoctorNotes,findDoctorProfile};})()",ctx);
  await new Promise(r=>setImmediate(r));
  return{dom,w,errors};
}
test("doctor action failure restores buttons and preserves appointment state",async()=>{
  const {dom,w,errors}=await doctorDOM();assert.deepEqual(errors,[]);
  const state=w.testDoctor.state;state.authUser={uid:"doctor",email:"doctor@example.test"};state.doctorProfile={name:"Doctor"};
  state.selectedBooking={id:"b",date:"2099-01-01",time:"09:00",status:"PENDING"};state.bookings=[state.selectedBooking];
  w.AmalBooking.update=async()=>{throw Error("offline")};
  await w.testDoctor.updateBookingStatus("APPROVED");
  assert.equal(state.selectedBooking.status,"PENDING");
  assert.equal(w.document.getElementById("approveButton").disabled,false);dom.window.close();
});
test("doctor cannot reschedule an appointment into the past",async()=>{
  const {dom,w}=await doctorDOM();let writes=0;w.AmalBooking.update=async()=>writes++;
  w.testDoctor.state.selectedBooking={id:"b",date:"2099-01-01",time:"09:00",status:"PENDING"};
  w.document.getElementById("rescheduleDate").value="2000-01-01";w.document.getElementById("rescheduleTime").value="10:00";
  await w.testDoctor.rescheduleSelectedBooking();assert.equal(writes,0);dom.window.close();
});

test("all cached shell files exist",()=>{for(const m of read("service-worker.js").matchAll(/"\.\/([^"?]+)"/g))assert.ok(fs.existsSync(path.join(root,m[1])),m[1]);});

test("doctor profile delegates to the authenticated backend",async()=>{const {dom,w}=await doctorDOM();let called=false;w.AmalBooking.profile=async()=>{called=true;return{name:"Catalog doctor",available:true}};const profile=await w.testDoctor.findDoctorProfile({uid:"doctor",email:"doctor@example.test"});assert.equal(called,true);assert.equal(profile.available,true);dom.window.close();});
