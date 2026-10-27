import "./booking-store.js";
  import { signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
  import { getFirestore, collection, getDocs, addDoc, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

  const authFirebaseConfig = {
    apiKey: "AIzaSyC4l0BaiwsxguCFPWBEF_5xoUv45PWjHqk",
    authDomain: "nabdapp-3a077.firebaseapp.com",
    projectId: "nabdapp-3a077",
    storageBucket: "nabdapp-3a077.appspot.com",
    messagingSenderId: "675031985272",
    appId: "1:675031985272:web:5f86cc21c28062cd65d18d"
  };

  const firebaseConfig = {
    apiKey: "AIzaSyClPA_4ZjzUrnERb_k-6yBtgb9AB7QIryA",
    authDomain: "dataofhosp.firebaseapp.com",
    projectId: "dataofhosp",
    storageBucket: "dataofhosp.firebasestorage.app",
    messagingSenderId: "908860921572",
    appId: "1:908860921572:web:1fce145520ef5ecd7b7ef1"
  };
  const bookingsFirebaseConfig = {
	  apiKey: "AIzaSyAWuDnORw-xm8ayXcL5s_Mq06NsSlMEinU",
	  authDomain: "dataofdoctor.firebaseapp.com",
	  projectId: "dataofdoctor",
	  storageBucket: "dataofdoctor.firebasestorage.app",
	  messagingSenderId: "305140405001",
	  appId: "1:305140405001:web:7e54658907133ef9ff39d8"
	};
   async function saveBookingToFirebase(payload) {
     return window.AmalBooking.create(payload);
   }

	window.saveBookingToFirebase = saveBookingToFirebase;

  const authApp = initializeApp(authFirebaseConfig);
  const dataApp = initializeApp(firebaseConfig, "dataApp");
  const bookingsApp = initializeApp(bookingsFirebaseConfig, "bookingsApp");

  const auth = getAuth(authApp);
  const db = getFirestore(dataApp);
  const bookingsDb = getFirestore(bookingsApp);
  window.AmalBooking.init(bookingsDb, auth);

  window.db = db;
  window.collection = collection;
  window.getDocs = getDocs;
  window.query = query;
  window.where = where;
  window.bookingsDb = bookingsDb;
  window.auth = auth;

  let authChecked = false;
  // Unscoped legacy records cannot be safely assigned to the current account.
  localStorage.removeItem("localBookings");

  onAuthStateChanged(auth, async (user) => {
	  if (user && authChecked === user.uid) return;
      authChecked = user?.uid || false;

	  if (!user) {
		localStorage.removeItem("currentUserUid");
		localStorage.removeItem("currentUserEmail");
		window.location.href = "login_Patient.html";
		return;
	  }



	  window.currentUserEmail = (user.email || "").trim().toLowerCase();
	  window.currentUserUid = user.uid;

	  window.currentUserUid = user.uid;
	  window.currentUserEmail = (user.email || "").trim().toLowerCase();

	  const userDocRef = doc(getFirestore(authApp), "users", user.uid);
	  const userDocSnap = await getDoc(userDocRef);

	  if (userDocSnap.exists()) {
		const userData = userDocSnap.data();

		window.currentUserName = userData.name || "";
		window.currentUserPhone = userData.phone || "";
	  }

	  renderList();
	  await loadFirebaseData();
	  await renderBookings();
	});

  async function loadFirebaseData() {
    try {
      const hospitalsSnap = await getDocs(collection(db, "hospitals"));
      window.firebaseHospitals = hospitalsSnap.docs.map(h => ({ ...h.data(), docId: h.id, id: h.data().id ?? h.id }));
      window.firebaseDepartments = [];
      window.firebaseDoctors = [];
      window.dispatchEvent(new Event("firebaseDataReady"));
    } catch {
      alert(Amal.text("تعذر تحميل الجهات الطبية. حدّث الصفحة للمحاولة.", "Could not load medical facilities. Refresh to retry."));
    }
  }
  window.logout = function () {
  signOut(auth).then(() => {
    localStorage.removeItem("localBookings");
    localStorage.removeItem("emergencyContacts");
    alert("تم تسجيل الخروج بنجاح 👋");
    window.location.href = "login_Patient.html";
  }).catch((error) => {
    console.error("Logout error:", error);
  });
};
