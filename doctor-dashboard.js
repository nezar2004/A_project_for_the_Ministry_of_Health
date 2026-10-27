import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
		import "./booking-store.js";
		import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
		import {
		  getFirestore,
		  collection,
		  getDocs,
          writeBatch,
		  getDoc,
		  updateDoc,
		  doc,
		  query,
		  where,
		  limit,
		  serverTimestamp,
		  setDoc,
		  onSnapshot
		} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

		const doctorFirebaseConfig = {
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

		const authApp = initializeApp(doctorFirebaseConfig);
		const bookingsApp = initializeApp(bookingsFirebaseConfig, "bookingsApp");
		const auth = getAuth(authApp);
		const bookingsDb = getFirestore(bookingsApp);
        window.AmalBooking.init(bookingsDb, auth);

		const state = {
		  authUser: null,
		  doctorProfile: null,
		  doctorId: null,
		  bookings: [],
		  activeFilter: "ALL",
		  searchTerm: "",
		  selectedBooking: null,
		  loading: true,
		  unsubscribeBookings: null,
		  hasLiveBooted: false,
		  lastSeenIds: new Set()
		};

		const manualDoctorFallback = {
		  doctor_id: null,
		  name: "Doctor",
		  hospital_name: "Not linked yet",
		  department_title: "Not linked yet",
		  specialty: "General",
		  available: false,
		  email: ""
		};

		const elements = {
		  loadingOverlay: document.getElementById("loadingOverlay"),
		  doctorAvatarImage: document.getElementById("doctorAvatarImage"),
		  doctorName: document.getElementById("doctorName"),
		  doctorSubline: document.getElementById("doctorSubline"),
		  availabilityButton: document.getElementById("availabilityButton"),
		  availabilityLabel: document.getElementById("availabilityLabel"),
		  refreshButton: document.getElementById("refreshButton"),
		  heroRefreshButton: document.getElementById("heroRefreshButton"),
		  focusPendingButton: document.getElementById("focusPendingButton"),
		  logoutButton: document.getElementById("logoutButton"),
		  searchInput: document.getElementById("searchInput"),
		  bookingsTableBody: document.getElementById("bookingsTableBody"),
		  drawer: document.getElementById("bookingDrawer"),
		  drawerBackdrop: document.getElementById("drawerBackdrop"),
		  closeDrawerButton: document.getElementById("closeDrawerButton"),
		  approveButton: document.getElementById("approveButton"),
		  rejectButton: document.getElementById("rejectButton"),
		  rescheduleButton: document.getElementById("rescheduleButton"),
		  rescheduleDate: document.getElementById("rescheduleDate"),
		  rescheduleTime: document.getElementById("rescheduleTime"),
		  rescheduleReason: document.getElementById("rescheduleReason"),
		  toastWrap: document.getElementById("toastWrap"),
		  liveBanner: document.getElementById("liveBanner"),
		  liveBannerText: document.getElementById("liveBannerText"),
		  statAll: document.getElementById("statAll"),
		  statPending: document.getElementById("statPending"),
		  statApproved: document.getElementById("statApproved"),
		  statToday: document.getElementById("statToday"),
		  countAll: document.getElementById("countAll"),
		  countPending: document.getElementById("countPending"),
		  countApproved: document.getElementById("countApproved"),
		  countRejected: document.getElementById("countRejected"),
		  countRescheduled: document.getElementById("countRescheduled"),
		  detailPatientName: document.getElementById("detailPatientName"),
		  detailPatientPhone: document.getElementById("detailPatientPhone"),
		  detailPatientEmail: document.getElementById("detailPatientEmail"),
		  detailStatus: document.getElementById("detailStatus"),
		  detailBookingId: document.getElementById("detailBookingId"),
		  detailHospital: document.getElementById("detailHospital"),
		  detailDepartment: document.getElementById("detailDepartment"),
		  detailDoctor: document.getElementById("detailDoctor"),
		  detailDate: document.getElementById("detailDate"),
		  detailTime: document.getElementById("detailTime"),
		  detailNote: document.getElementById("detailNote"),
		  doctorNotes: document.getElementById("doctorNotes"),
		  saveDoctorNotesBtn: document.getElementById("saveDoctorNotesBtn")
		};

		function escapeHtml(value) {
		  if (value === null || value === undefined) return "";
		  return String(value)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/\"/g, "&quot;")
			.replace(/'/g, "&#039;");
		}

		function getInitials(name = "Doctor") {
		  return String(name)
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map(part => part[0]?.toUpperCase() || "")
			.join("") || "DR";
		}

		function normalizeStatus(status) {
		  const s = String(status || "PENDING").trim().toUpperCase();
		  if (["APPROVED", "REJECTED", "RESCHEDULED", "PENDING", "CANCELLED"].includes(s)) return s;
		  return "PENDING";
		}

		function statusBadge(status) {
		  const normalized = normalizeStatus(status);
		  if (normalized === "APPROVED") return `<span class="status-badge status-approved"><i class="fa-solid fa-circle-check"></i>${Amal.status("APPROVED")}</span>`;
		  if (normalized === "CANCELLED") return `<span class="status-badge status-rejected">${Amal.status("CANCELLED")}</span>`;
          if (normalized === "REJECTED") return `<span class="status-badge status-rejected"><i class="fa-solid fa-circle-xmark"></i>${Amal.status("REJECTED")}</span>`;
		  if (normalized === "RESCHEDULED") return `<span class="status-badge status-rescheduled"><i class="fa-solid fa-calendar-days"></i>${Amal.status("RESCHEDULED")}</span>`;
		  return `<span class="status-badge status-pending"><i class="fa-solid fa-hourglass-half"></i>${Amal.status("PENDING")}</span>`;
		}

		function todayDateString() {
		  const now = new Date();
		  const y = now.getFullYear();
		  const m = String(now.getMonth() + 1).padStart(2, "0");
		  const d = String(now.getDate()).padStart(2, "0");
		  return `${y}-${m}-${d}`;
		}

		function setLoading(isLoading) {
		  state.loading = isLoading;
		  elements.loadingOverlay.classList.toggle("hidden", !isLoading);
		}

		function showToast(title, message) {
		  const toast = document.createElement("div");
		  toast.className = "toast";
		  toast.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message)}</span>`;
		  elements.toastWrap.appendChild(toast);
		  setTimeout(() => toast.remove(), 3200);
		}

		function showLiveBanner(message) {
		  elements.liveBannerText.textContent = message;
		  elements.liveBanner.style.display = "block";
		  clearTimeout(showLiveBanner._timer);
		  showLiveBanner._timer = setTimeout(() => {
			elements.liveBanner.style.display = "none";
		  }, 2600);
		}

		function setActiveFilter(filter) {
		  state.activeFilter = filter;

		  document.querySelectorAll(".filter-tab").forEach(btn => {
			btn.classList.toggle("active", btn.dataset.filter === filter);
		  });

		  document.querySelectorAll(".nav-button[data-sidebar-filter]").forEach(btn => {
			btn.classList.toggle("active", btn.dataset.sidebarFilter === filter);
		  });

		  renderBookingsTable();
		}

		function bookingMatchesDoctor(booking) {
		  if (!state.doctorProfile || !state.authUser) return false;

		  const bookingDoctorId = String(booking.doctor_id || "");
		  const bookingDoctorEmail = String(booking.doctor_email || "").trim().toLowerCase();
		  const bookingDoctorName = String(booking.doctor_name || booking.doctorName || "").trim().toLowerCase();

		  const doctorId = String(state.doctorProfile.doctor_id || state.doctorId || "");
		  const doctorEmail = String(state.authUser.email || state.doctorProfile.email || "").trim().toLowerCase();
		  const doctorName = String(state.doctorProfile.name || "").trim().toLowerCase();
		  const userUid = String(state.authUser.uid || "");
		  const profileUid = String(state.doctorProfile.user_uid || "");

		  return (
			(doctorId && bookingDoctorId === doctorId) ||
			(doctorEmail && bookingDoctorEmail === doctorEmail) ||
			(doctorName && bookingDoctorName === doctorName) ||
			(profileUid && bookingDoctorId === profileUid) ||
			(userUid && bookingDoctorId === userUid)
		  );
		}

		function getFilteredBookings() {
		  const term = state.searchTerm.trim().toLowerCase();

		  return state.bookings.filter(booking => {
			const matchesStatus = state.activeFilter === "ALL" || normalizeStatus(booking.status) === state.activeFilter;
			if (!matchesStatus) return false;

			if (!term) return true;

			const haystack = [
			  booking.booking_id,
			  booking.customer_name,
			  booking.customer_email,
			  booking.customer_phone,
			  booking.hospital_name,
			  booking.department_title,
			  booking.doctor_name,
			  booking.date,
			  booking.time,
			  booking.status
			].join(" ").toLowerCase();

			return haystack.includes(term);
		  });
		}
		function getDoctorWorkplaces() {
		  const hospitals = [...new Set(
			state.bookings
			  .map(b => String(b.hospital_name || b.hospitalName || "").trim())
			  .filter(Boolean)
		  )];

		  const departments = [...new Set(
			state.bookings
			  .map(b => String(b.department_title || b.departmentName || "").trim())
			  .filter(Boolean)
		  )];

		  return { hospitals, departments };
		}
		function updateDoctorCard() {
		  const profile = state.doctorProfile || manualDoctorFallback;

		  const name =
			profile.name ||
			profile.doctor_name ||
			profile.doctorName ||
			"Doctor";

		  const specialty =
			profile.specialty ||
			profile.department_title ||
			profile.departmentName ||
			"General";

		  const available = !!profile.available;

		  const { hospitals, departments } = getDoctorWorkplaces();

		  const hospitalsText = hospitals.length
			? hospitals.join(" | ")
			: (profile.hospital_name || profile.hospitalName || "Hospital not assigned");

		  const departmentsText = departments.length
			? departments.join(" | ")
			: (profile.department_title || profile.departmentName || "Department not assigned");

		  elements.doctorName.textContent = name;
		  elements.doctorSubline.textContent = `${hospitalsText} · ${departmentsText} · ${specialty}`;

		  elements.availabilityButton.classList.toggle("online", available);
		  elements.availabilityButton.classList.toggle("offline", !available);
		  elements.availabilityLabel.textContent = available ? Amal.text("متاح", "Available") : Amal.text("غير متاح", "Offline");
		}

		function renderBookingsTable() {
		  const rows = getFilteredBookings();

		  if (!rows.length) {
			elements.bookingsTableBody.innerHTML = `
			  <tr>
				<td colspan="6">
				  <div class="empty-state">
					<i class="fa-solid fa-calendar-xmark"></i>
					<div style="font-weight:900; font-size:18px; color:#0f172a; margin-bottom:6px;">No bookings match the current view</div>
					<div>Try changing the filter, searching with another keyword, or waiting for a live update.</div>
				  </div>
				</td>
			  </tr>
			`;
			return;
		  }

		  elements.bookingsTableBody.innerHTML = rows.map(booking => {
			const patientName = escapeHtml(booking.customer_name || "Unknown patient");
			const patientEmail = escapeHtml(booking.customer_email || "No email");
			const hospital = escapeHtml(booking.hospital_name || "-");
			const department = escapeHtml(booking.department_title || "-");
			const bookingDate = escapeHtml(booking.date || "-");
			const bookingTime = escapeHtml(booking.time || "-");
			const initials = getInitials(booking.customer_name || "PT");

			return `
			  <tr data-booking-id="${escapeHtml(booking.id)}" class="booking-row">
				<td>
				  <div class="patient-cell">
					<div class="patient-avatar">${escapeHtml(initials)}</div>
					<div class="patient-info">
					  <strong>${patientName}</strong>
					  <span>${patientEmail}</span>
					</div>
				  </div>
				</td>
				<td>
				  <div class="doctor-inline">
					<strong>${hospital}</strong>
					<span>${department}</span>
				  </div>
				</td>
				<td>${bookingDate}</td>
				<td>${bookingTime}</td>
				<td>${statusBadge(booking.status)}</td>
				<td>
				  <div class="action-row">
					<button class="mini-button primary open-details-button" data-id="${escapeHtml(booking.id)}" type="button">Booking Confirming</button>
				  </div>
				</td>
			  </tr>
			`;
		  }).join("");
		}

		function fillDrawer(booking) {
		  elements.detailPatientName.textContent = booking.customer_name || booking.customerName || "-";
		  elements.detailPatientPhone.textContent = booking.customer_phone || booking.customerPhone || "-";
		  elements.detailPatientEmail.textContent = booking.customer_email || booking.customerEmail || "-";
		  elements.detailStatus.innerHTML = statusBadge(booking.status);
		  elements.detailBookingId.textContent = booking.booking_id || booking.bookingId || booking.id || "-";
		  elements.detailHospital.textContent = booking.hospital_name || booking.hospitalName || "-";
		  elements.detailDepartment.textContent = booking.department_title || booking.departmentName || "-";
		  elements.detailDoctor.textContent = booking.doctor_name || booking.doctorName || state.doctorProfile?.name || "-";
		  elements.detailDate.textContent = booking.date || "-";
		  elements.detailTime.textContent = booking.time || "-";
		  elements.detailNote.textContent = booking.customer_note || booking.customerNote || "No note was added.";
		  elements.rescheduleDate.value = booking.date || "";
		  elements.rescheduleTime.value = booking.time || "";
		  elements.rescheduleReason.value = booking.reschedule_reason || "";
		  elements.doctorNotes.value = booking.doctor_notes || "";
		}

		function openDrawer(bookingId) {
		  const booking = state.bookings.find(item => item.id === bookingId);
		  if (!booking) return;
		  state.selectedBooking = booking;
		  fillDrawer(booking);
		  elements.drawer.classList.add("active");
		  elements.drawerBackdrop.classList.add("active");
		  elements.drawer.setAttribute("aria-hidden", "false");
		}

		function closeDrawer() {
		  state.selectedBooking = null;
		  elements.drawer.classList.remove("active");
		  elements.drawerBackdrop.classList.remove("active");
		  elements.drawer.setAttribute("aria-hidden", "true");
		}

		async function findDoctorProfile(_user) { return window.AmalBooking.profile(); }

		function subscribeToBookings() {
		  if (state.unsubscribeBookings) {
			state.unsubscribeBookings();
			state.unsubscribeBookings = null;
		  }

		  const doctorEmail = String(state.authUser?.email || "").trim().toLowerCase();
		  if (!doctorEmail) {
			setLoading(false);
			showToast("تعذر تحميل الحجوزات", "لا يوجد بريد إلكتروني مرتبط بحساب الطبيب.");
			return;
		  }

		  const doctorBookingsQuery = query(
			collection(bookingsDb, "allBookings"),
			where("doctor_email", "==", doctorEmail)
		  );

		  state.unsubscribeBookings = window.AmalBooking.subscribe((snapshot) => {
			const rawBookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
			const filtered = rawBookings
			  .filter(bookingMatchesDoctor)
			  .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));

			const currentIds = new Set(filtered.map(item => item.id));

			if (state.hasLiveBooted) {
			  const newItems = filtered.filter(item => !state.lastSeenIds.has(item.id));
			  if (newItems.length) {
				showToast("New booking", `${newItems.length} new booking request${newItems.length > 1 ? "s have" : " has"} arrived.`);
				showLiveBanner(`${newItems.length} new booking request${newItems.length > 1 ? "s" : ""} received in real time.`);
			  } else if (snapshot.docChanges().some(change => change.type === "modified")) {
				showLiveBanner("A booking was updated in real time.");
			  }
			}

			state.bookings = filtered;
			state.lastSeenIds = currentIds;
			state.hasLiveBooted = true;
			updateDoctorCard();
			updateStats();
			renderBookingsTable();

			if (state.selectedBooking) {
			  const refreshed = state.bookings.find(item => item.id === state.selectedBooking.id);
			  if (refreshed) {
				state.selectedBooking = refreshed;
				fillDrawer(refreshed);
			  }
			}

			setLoading(false);
		  }, (error) => {
			console.error("Realtime subscription error:", error);
			setLoading(false);
			showToast("Live updates failed", error.message || "Could not subscribe to booking updates.");
		  });
		}
		function updateStats() {
		  const bookings = state.bookings;

		  const counts = {
			all: bookings.length,
			pending: bookings.filter(b => normalizeStatus(b.status) === "PENDING").length,
			approved: bookings.filter(b => normalizeStatus(b.status) === "APPROVED").length,
			rejected: bookings.filter(b => normalizeStatus(b.status) === "REJECTED").length,
			rescheduled: bookings.filter(b => normalizeStatus(b.status) === "RESCHEDULED").length,
			today: bookings.filter(b => String(b.date || "") === todayDateString()).length
		  };

		  elements.statAll.textContent = counts.all;
		  elements.statPending.textContent = counts.pending;
		  elements.statApproved.textContent = counts.approved;
		  elements.statToday.textContent = counts.today;

		  elements.countAll.textContent = counts.all;
		  elements.countPending.textContent = counts.pending;
		  elements.countApproved.textContent = counts.approved;
		  elements.countRejected.textContent = counts.rejected;
		  elements.countRescheduled.textContent = counts.rescheduled;
		}
			async function refreshDashboard(showMessage = false) {
		  setLoading(true);
		  try {
			if (!state.authUser) throw new Error("No authenticated user");

			state.doctorProfile = await findDoctorProfile(state.authUser);
			state.doctorId = state.doctorProfile.doctor_id || state.authUser.uid;

			if (!state.doctorProfile.user_uid || state.doctorProfile.user_uid !== state.authUser.uid) {
			  state.doctorProfile.user_uid = state.authUser.uid;
			}


			updateDoctorCard();
			subscribeToBookings();

			if (showMessage) {
			  showToast("Dashboard synced", "Latest booking data has been loaded successfully.");
			}
		  } catch (error) {
			console.error("Dashboard refresh error:", error);
			setLoading(false);
			showToast("Loading error", error.message || "Unable to refresh the doctor dashboard.");
		  }
		}

		async function updateAvailability() {
          if (elements.availabilityButton.disabled) return;
          elements.availabilityButton.disabled = true;
		  if (!state.authUser || !state.doctorProfile) { elements.availabilityButton.disabled = false; return; }

		  try {
			const nextValue = !state.doctorProfile.available;
			const ref = doc(bookingsDb, "doctors", state.authUser.uid);


			await window.AmalBooking.setAvailability(nextValue);

			state.doctorProfile.available = nextValue;
			updateDoctorCard();

			showToast("Status updated", nextValue ? "Doctor is now available." : "Doctor is now offline.");
		  } catch (error) {
			console.error("Availability update error:", error);
			showToast("Update failed", error.message);
		  } finally { elements.availabilityButton.disabled = false; }
		}

		let bookingActionPending = false;
        async function updateBookingStatus(status, extra = {}) {
          if (bookingActionPending) return;
		  const booking = state.selectedBooking;
		  if (!booking) {
			showToast("No booking selected", "Open a booking first, then apply an action.");
			return;
		  }

		  try {
			bookingActionPending = true;
            [elements.approveButton, elements.rejectButton, elements.rescheduleButton].forEach(b => b.disabled = true);
            const payload = {
			  status,
			  updatedAt: serverTimestamp(),
			  reviewed_by_uid: state.authUser?.uid || null,
			  reviewed_by_name: state.doctorProfile?.name || "Doctor",
			  ...extra
			};


            await window.AmalBooking.update(booking, payload);

			state.bookings = state.bookings.map(item =>
			  item.id === booking.id ? { ...item, ...payload } : item
			);

			const updated = state.bookings.find(item => item.id === booking.id);
			state.selectedBooking = updated;
			fillDrawer(updated);
			updateStats();
			renderBookingsTable();
			showToast("Booking updated", `The booking status is now ${status.toLowerCase()}.`);
		  } catch (error) {
			console.error("Booking action error:", error);
			showToast("Action failed", error.message || "The booking could not be updated.");
		  } finally { bookingActionPending = false; [elements.approveButton, elements.rejectButton, elements.rescheduleButton].forEach(b => b.disabled = false); }
		}

		async function approveSelectedBooking() {
		  await updateBookingStatus("APPROVED", {
			approvedAt: serverTimestamp()
		  });
		}

		async function rejectSelectedBooking() {
		  await updateBookingStatus("REJECTED", {
			rejectedAt: serverTimestamp()
		  });
		}

		async function rescheduleSelectedBooking() {
		  const newDate = elements.rescheduleDate.value;
		  const newTime = elements.rescheduleTime.value;
		  const reason = elements.rescheduleReason.value.trim();

		  if (!newDate || !newTime || newDate < Amal.dateInZone() || (newDate === Amal.dateInZone() && newTime <= Amal.clockInZone())) {
			showToast("Missing values", "Choose a future date and time.");
			return;
		  }

		  await updateBookingStatus("RESCHEDULED", {
			date: newDate,
			time: newTime,
			reschedule_reason: reason,
			rescheduledAt: serverTimestamp()
		  });
		}
  async function saveDoctorNotes() {
    const booking = state.selectedBooking;
    if (!booking) return;
    const notes = elements.doctorNotes.value.trim();
    elements.saveDoctorNotesBtn.disabled = true;
    try {
      const payload = { doctor_notes: notes, doctor_notes_updatedAt: serverTimestamp(), doctor_notes_by_uid: state.authUser.uid, doctor_notes_by_name: state.doctorProfile?.name || "Doctor" };
      await window.AmalBooking.update(booking, { doctor_notes: notes });
      showToast(Amal.text("تم الحفظ", "Saved"), Amal.text("تم حفظ الملاحظات.", "Notes saved."));
    } catch {
      showToast(Amal.text("تعذر الحفظ", "Could not save"), Amal.text("حاول مرة أخرى.", "Please try again."));
    } finally { elements.saveDoctorNotesBtn.disabled = false; }
  }
		function wireEvents() {
		  elements.availabilityButton.addEventListener("click", updateAvailability);
		  elements.refreshButton.addEventListener("click", () => refreshDashboard(true));
		  elements.heroRefreshButton.addEventListener("click", () => refreshDashboard(true));
		  elements.focusPendingButton.addEventListener("click", () => setActiveFilter("PENDING"));

		  elements.logoutButton.addEventListener("click", async () => {
			try {
			  await signOut(auth);
			  sessionStorage.removeItem("doctorAuth");
              window.location.href = "doctor_login.html";
			} catch (error) {
			  console.error("Logout error:", error);
			  showToast("Logout failed", error.message || "Could not sign out the current user.");
			}
		  });

		  elements.searchInput.addEventListener("input", (event) => {
			state.searchTerm = event.target.value || "";
			renderBookingsTable();
		  });

		  document.querySelectorAll(".filter-tab").forEach(button => {
			button.addEventListener("click", () => setActiveFilter(button.dataset.filter));
		  });

		  document.querySelectorAll(".nav-button[data-sidebar-filter]").forEach(button => {
			button.addEventListener("click", () => setActiveFilter(button.dataset.sidebarFilter));
		  });

		  elements.bookingsTableBody.addEventListener("click", (event) => {
			const openButton = event.target.closest(".open-details-button");
			if (openButton) {
			  openDrawer(openButton.dataset.id);
			  return;
			}

			const row = event.target.closest(".booking-row");
			if (row?.dataset.bookingId) {
			  openDrawer(row.dataset.bookingId);
			}
		  });

		  elements.closeDrawerButton.addEventListener("click", closeDrawer);
		  elements.drawerBackdrop.addEventListener("click", closeDrawer);
		  elements.approveButton.addEventListener("click", approveSelectedBooking);
		  elements.rejectButton.addEventListener("click", rejectSelectedBooking);
		  elements.rescheduleButton.addEventListener("click", rescheduleSelectedBooking);
		  elements.saveDoctorNotesBtn.addEventListener("click", saveDoctorNotes);

		  document.addEventListener("keydown", (event) => {
			if (event.key === "Escape") closeDrawer();
		  });
		}

		async function boot() {
		  wireEvents();

		  onAuthStateChanged(auth, async (user) => {
			if (!user) {
			  window.location.href = "doctor_login.html";
			  return;
			}

			state.authUser = user;
			await refreshDashboard(false);
		  });
		}

		boot();
  document.getElementById("cancelAllBtn").onclick = async () => {
    const upcoming = state.bookings.filter(b => Amal.occupies(b) && b.date >= Amal.dateInZone());
    if (!upcoming.length) { showToast(Amal.text("لا توجد مواعيد قادمة", "No upcoming appointments"), ""); return; }
    if (!confirm(Amal.text("هل تريد إلغاء المواعيد القادمة وعددها " + upcoming.length + "؟", "Cancel " + upcoming.length + " upcoming appointments?"))) return;
    const button = document.getElementById("cancelAllBtn");
    button.disabled = true;
    let saved = 0;
    try {
      for (const booking of upcoming) { await window.AmalBooking.update(booking, { status: "CANCELLED", cancelledAt: serverTimestamp(), reviewed_by_uid: state.authUser.uid }); saved++; }
      showToast(Amal.text("تم الإلغاء", "Cancelled"), String(saved));
    } catch {
      showToast(Amal.text("تم إلغاء " + saved + " موعدًا؛ حدّث القائمة قبل المحاولة مجددًا.", saved + " appointments cancelled. Refresh before retrying."), "");
    } finally { button.disabled = false; }
  };
