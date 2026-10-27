function normalizeFacilityType(type) {
		const t = String(type || "").trim().toLowerCase();

		if (["governmental", "government", "gov", "حكومي"].includes(t)) return "governmental";
		if (["private", "خاص"].includes(t)) return "private";
		if (["healthcenter", "health center", "مركز صحي"].includes(t)) return "healthCenter";
		if (["medicalcenter", "medical center", "مركز طبي"].includes(t)) return "medicalCenter";

		return String(type || "").trim();
	  }
 // -------------------------------
	// Basic Data
	// -------------------------------
  let bookingSaveInProgress = false;
  async function confirmBooking() {
    if (bookingSaveInProgress || !validateCustomerData()) return;
    if (!bookingState.doctor || !bookingState.date || !bookingState.time ||
        !Amal.slots(bookingState.doctor, bookingState.date).includes(bookingState.time)) {
      alert(Amal.text("الموعد غير صالح أو انتهى. اختر موعدًا آخر.", "This time is no longer valid. Choose another appointment."));
      return;
    }
    bookingSaveInProgress = true;
    const button = document.getElementById("nextBtn");
    button.disabled = true;
    try {
      const doctor = bookingState.doctor;
      const payload = {
        booking_id: bookingState.requestId || (bookingState.requestId = "B" + crypto.randomUUID()),
        status: "PENDING",
        gov: bookingState.gov || "",
        country: Amal.settings.country,
        time_zone: Amal.settings.timeZone,
        currency: Amal.settings.currency,
        facility_type: bookingState.facilityType || "",
        hospital_id: String(bookingState.hospital?.docId || ""),
        hospital_name: bookingState.hospital?.name || "",
        department_id: String(bookingState.department?.docId || ""),
        department_title: bookingState.department?.title || "",
        doctor_name: doctor.name || doctor.doctor_name || "",
        doctor_id: Amal.doctorKey(doctor),
        doctor_email: String(doctor.email || "").trim().toLowerCase(),
        doctor_doc_id: String(doctor.docId || ""),
        slot_duration: Number(doctor.slotDuration) || 30,
        date: bookingState.date,
        time: bookingState.time,
        price: Number(bookingState.price) || 0,
        has_insurance: !!bookingState.hasInsurance,
        insurance_details: bookingState.hasInsurance ? bookingState.insuranceDetails : null,
        booked_for: bookingMode,
        customer_name: document.getElementById("custName").value.trim(),
        customer_email: document.getElementById("custEmail").value.trim().toLowerCase(),
        customer_phone: Amal.phone(document.getElementById("custPhone").value),
        customer_note: document.getElementById("custNote").value.trim(),
        createdAt: Date.now()
      };
      await window.saveBookingToFirebase(payload);
      await renderBookings();
      document.getElementById("modalContent").textContent = Amal.text(
        "تم إرسال طلب الحجز بنجاح. رقم الطلب: " + payload.booking_id + " — بانتظار موافقة الطبيب.",
        "Booking request sent. Reference: " + payload.booking_id + " — awaiting the doctor's approval."
      );
      goToLandingPage();
      new bootstrap.Modal(document.getElementById("successModal")).show();
    } catch (error) {
      alert(error.message || Amal.text("تعذر حفظ الحجز. حاول مرة أخرى.", "Could not save the booking. Please try again."));
    } finally {
      bookingSaveInProgress = false;
      button.disabled = false;
    }
  }
	const governorates = [
	  'Amman', 'Irbid', 'Zarqa', 'Balqa', 'Karak', 'Maan',
	  'Tafila', 'Jerash', 'Ajloun', 'Madaba', 'Aqaba', 'Mafraq'
	];

	// بيانات ستأتي من Firebase
	let hospitals = [];
	let Departments = [];
	let doctors = [];

	// إذا تم تحميل بيانات Firebase من سكربت آخر
	window.addEventListener("firebaseDataReady", () => {
	  hospitals = (window.firebaseHospitals || []).map(h => ({
		...h,
		gov: String(h.gov || "").trim(),
		type: normalizeFacilityType(h.type)
	  }));

	  Departments = (window.firebaseDepartments || []).map(d => ({
		...d,
		type: normalizeFacilityType(d.type)
	  }));

	  doctors = window.firebaseDoctors || [];




	  if (bookingState.currentStep === 3) renderHospitals();
	  if (bookingState.currentStep === 4) renderDepartments();
	});

	// -------------------------------
	// Booking status
	// -------------------------------
	let doctorDayBookings = [];
	let readyToConfirm = false;
	let bookingMode = "self"; // self أو other
	let bookingState = {
	  currentStep: 1,
	  gov: null,
	  facilityType: null,
	  hospital: null,
	  department: null,
	  hasInsurance: null,
	  insuranceDetails: null,
	  doctor: null,
	  date: null,
	  time: null,
	  price: null,
	  customer: { name: null, email: null, phone: null, note: null }
	};

	const maxStep = 9;

	document.getElementById("bookSelfBtn").onclick = () => {
	  bookingMode = "self";
	  goToBookingApp();
	};

	document.getElementById("bookOtherBtn").onclick = () => {
	  bookingMode = "other";
	  goToBookingApp();
	};
	// -------------------------------
	// Helper Functions
	// -------------------------------
	function escapeHtml(str) {
	  if (!str && str !== 0) return '';
	  return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
	}

	// -------------------------------
	// Main Navigation Functions
	// -------------------------------
	function showStep(n) {
      if (bookingState.currentStep === 9) {
        bookingState.customer = {name: document.getElementById("custName").value, email: document.getElementById("custEmail").value, phone: document.getElementById("custPhone").value, note: document.getElementById("custNote").value};
      }
	  document.querySelectorAll('#stepsArea .step-block').forEach(el => el.classList.add('d-none'));
	  const el = document.getElementById('step-' + n);
	  if (el) el.classList.remove('d-none');

	  bookingState.currentStep = n;
	  readyToConfirm = false;
	  updateStepPills();
	  updateNavButtons();

	  if (n === 4 && bookingState.hospital) renderDepartments();
	  if (n === 7 && bookingState.department) loadDoctorsForSelectedDepartment();

	  if (n === 8) {
		enforceDateMin();

		if (!bookingState.date) {
		  autoFillToday();
		}

		loadTimeSlotsForSelectedDate();
	  }

	  if (n === 9) {
		  updateSummaryCard();
		  const nameInput = document.getElementById("custName");
		  const emailInput = document.getElementById("custEmail");
		  const phoneInput = document.getElementById("custPhone");

		  if (bookingMode === "self") {
			nameInput.value = window.currentUserName || "";
			emailInput.value = window.currentUserEmail || "";
			let phone = window.currentUserPhone || "";

			// تنظيف الرقم
			phone = phone.replace(/\s/g, "");     // حذف الفراغات
			phone = phone.replace(/\+$/, "");     // حذف + إذا كان بالنهاية

			// تحويل لصيغة محلية
			if (phone.startsWith("+962")) {
			  phone = "0" + phone.slice(4);
			} else if (phone.startsWith("962")) {
			  phone = "0" + phone.slice(3);
			}

			phoneInput.value = phone;

		  } else {
			nameInput.value = bookingState.customer.name || "";
			emailInput.value = bookingState.customer.email || "";
			phoneInput.value = bookingState.customer.phone || "";
		  }
		}
	}


	function updateStepPills() {
	  document.querySelectorAll('.step-pill').forEach(p => {
		const stepNum = Number(p.dataset.step);
		p.classList.remove('active', 'text-success');
		if (stepNum === bookingState.currentStep) p.classList.add('active');
		if (stepNum < bookingState.currentStep) p.classList.add('text-success');
	  });
	}

	function updateNavButtons() {
	  const prevBtn = document.getElementById('prevBtn');
	  const nextBtn = document.getElementById('nextBtn');
	  if (!prevBtn || !nextBtn) return;

	  prevBtn.disabled = bookingState.currentStep === 1;
	  nextBtn.innerHTML =
		bookingState.currentStep === maxStep
		  ? Amal.text("تأكيد الحجز", "Confirm booking")
		  : Amal.text("التالي", "Next");
	  prevBtn.innerHTML =
		Amal.text("السابق", "Back");
	}

	// -------------------------------
	// Display and Logic Functions
	// -------------------------------
	function renderGovernorates() {
	  const container = document.getElementById('govList');
	  if (!container) return;
	  container.innerHTML = '';

	  governorates.forEach(g => {
		const col = document.createElement('div');
		col.className = 'col-6 col-md-3';

		const card = document.createElement('button');
        card.type = 'button';
		card.className = 'card select-card p-3 text-center';
		card.dataset.gov = g;
		card.innerHTML = `
		  <div class="card-body p-0">
			<i class="fas fa-map-marker-alt fa-lg mb-2 text-primary"></i>
			<strong>${escapeHtml(Amal.language() === "ar" ? ({Amman:"عمّان",Irbid:"إربد",Zarqa:"الزرقاء",Balqa:"البلقاء",Karak:"الكرك",Maan:"معان",Tafila:"الطفيلة",Jerash:"جرش",Ajloun:"عجلون",Madaba:"مادبا",Aqaba:"العقبة",Mafraq:"المفرق"}[g] || g) : g)}</strong>
		  </div>
		`;

		col.appendChild(card);
		container.appendChild(col);
	  });
	}

	function selectGovernorate(gov) {
	  bookingState.gov = gov;
	  bookingState.facilityType = null;
	  bookingState.hospital = null;
	  bookingState.department = null;
	  bookingState.doctor = null;

	  document.querySelectorAll('[data-gov]').forEach(el => el.classList.remove('selected'));
	  document.querySelectorAll('[data-gov]').forEach(el => {
		if (el.dataset.gov === gov) el.classList.add('selected');
	  });

	  showStep(2);
	}

	function selectFacilityType(type) {
	  bookingState.facilityType = normalizeFacilityType(type);
	  bookingState.hospital = null;
	  bookingState.department = null;
	  bookingState.doctor = null;

	  document.querySelectorAll('[data-type]').forEach(el => el.classList.remove('selected'));
	  document.querySelectorAll('[data-type]').forEach(el => {
	    if (normalizeFacilityType(el.dataset.type) === bookingState.facilityType) {
	      el.classList.add('selected');
	    }
	  });

	  renderHospitals();
	  showStep(3);
	}

	function renderHospitals() {
	  const container = document.getElementById('hospList');
	  if (!container) return;
	  container.innerHTML = '';






	  const matched = hospitals.filter(h =>
		String(h.gov || "").trim().toLowerCase() === String(bookingState.gov || "").trim().toLowerCase() &&
		String(h.type || "").trim().toLowerCase() === String(bookingState.facilityType || "").trim().toLowerCase()
	  );




	  if (!matched.length) {
		container.innerHTML = `
		  <div class="col-12 p-3 text-muted">
			<i class="fas fa-info-circle me-2"></i>
			No facilities are currently available.
		  </div>
		`;
		return;
	  }

	  matched.forEach(h => {
		const col = document.createElement('div');
		col.className = 'col-12 col-md-6';

		const card = document.createElement('button');
        card.type = 'button';
		card.className = 'card p-3 border';
		card.dataset.hosp = String(h.docId);

		card.innerHTML = `
		  <div>
			<strong>${escapeHtml(h.name)}</strong>
			<div class="small text-muted">${escapeHtml(h.type)} — ${escapeHtml(h.gov)}</div>
		  </div>
		`;

		card.addEventListener('click', () => selectHospital(String(h.docId)));

		col.appendChild(card);
		container.appendChild(col);
	  });


	}
	async function selectHospital(hospId) {
	  const h = hospitals.find(x => String(x.docId) === String(hospId));
	  if (!h) return;

	  bookingState.hospital = h;
	  bookingState.department = null;
	  bookingState.doctor = null;

	  document.querySelectorAll('[data-hosp]').forEach(el => el.classList.remove('selected'));
	  document.querySelectorAll('[data-hosp]').forEach(el => {
		if (String(el.dataset.hosp) === String(hospId)) {
		  el.classList.add('selected');
		}
	  });

	  showStep(4);

	  const c = document.getElementById('deptList');
	  if (c) {
		c.innerHTML = `
		  <div class="col-12 text-muted p-3">
			<i class="fas fa-spinner fa-spin me-2"></i>
			Loading departments...
		  </div>
		`;
	  }

	  try {
		const deptSnap = await window.getDocs(
		  window.collection(window.db, "hospitals", String(hospId), "departments")
		);

		Departments = deptSnap.docs.map(deptDoc => {
		  const deptRaw = deptDoc.data();
		  return {
			...deptRaw,
			docId: deptDoc.id,
			id: deptRaw.id ?? deptDoc.id,
			hospital_id: h.id
		  };
		});



		renderDepartments();
	  } catch (error) {
		console.error("Error loading departments:", error);
		if (c) {
		  c.innerHTML = `
			<div class="col-12 text-danger p-3">
			  <i class="fas fa-exclamation-circle me-2"></i>
			  Failed to load departments.
			</div>
		  `;
		}
	  }
	}
	function renderDepartments() {
	  const c = document.getElementById('deptList');
	  if (!c) return;
	  c.innerHTML = '';





	  if (!bookingState.hospital) {
		c.innerHTML = `
		  <div class="col-12 text-muted p-3">
			<i class="fas fa-info-circle me-2"></i>
			Select the hospital first to view the departments.
		  </div>
		`;
		return;
	  }

	  const matchedDepartments = Departments.filter(d =>
		String(d.hospital_id) === String(bookingState.hospital.id)
	  );




	  if (!matchedDepartments.length) {
		c.innerHTML = `
		  <div class="col-12 text-muted p-3">
			<i class="fas fa-exclamation-triangle me-2"></i>
			There are no departments available for this hospital.
		  </div>
		`;
		return;
	  }

	  matchedDepartments.forEach(d => {
		const col = document.createElement('div');
		col.className = 'col-12 col-md-6';

		const card = document.createElement('button');
        card.type = 'button';
		card.className = 'card p-3 border';
		card.dataset.dept = String(d.id);

		card.innerHTML = `
		  <div>
			<strong>${escapeHtml(d.title)}</strong>
			<div class="small text-muted">${Amal.text("التكلفة التقديرية:", "Estimated cost:")} ${escapeHtml(Amal.money(d.basePrice))}</div>
		  </div>
		`;

		card.addEventListener('click', () => {
		  bookingState.department = d;
		  bookingState.doctor = null;

		  document.querySelectorAll('[data-dept]').forEach(el => el.classList.remove('selected'));
		  card.classList.add('selected');

		  showStep(5);
		});

		col.appendChild(card);
		c.appendChild(col);
	  });


	}

	function selectDepartment(deptId) {
	  bookingState.department = Departments.find(d => d.id === deptId);
	  bookingState.doctor = null;

	  document.querySelectorAll('[data-dept]').forEach(el => el.classList.remove('selected'));
	  document.querySelectorAll('[data-dept]').forEach(el => {
		if (Number(el.dataset.dept) === deptId) el.classList.add('selected');
	  });

	  showStep(5);
	}
	async function loadDoctorsForSelectedDepartment() {
	  if (!bookingState.hospital || !bookingState.department) return;

	  const c = document.getElementById('docList');
	  if (c) {
		c.innerHTML = `
		  <div class="col-12 text-muted p-3">
			<i class="fas fa-spinner fa-spin me-2"></i>
			Loading doctors...
		  </div>
		`;
	  }

	  try {
		const doctorsSnap = await window.getDocs(
		  window.collection(
			window.db,
			"hospitals",
			String(bookingState.hospital.docId),
			"departments",
			String(bookingState.department.docId),
			"doctors"
		  )
		);

		doctors = doctorsSnap.docs.map(docDoc => {
		  const docRaw = docDoc.data();

		  return {
			...docRaw,
			docId: docDoc.id,

			// نخلي id هو المفتاح الثابت للدكتور إن وجد
			id: docRaw.doctorKey ?? docRaw.id ?? docDoc.id,

			// نخزنهم صراحة عشان نستخدمهم وقت الحجز
			doctorKey: docRaw.doctorKey ?? docRaw.id ?? docDoc.id,
			name: docRaw.name || docRaw.doctor_name || "",
			email: (docRaw.email || "").trim().toLowerCase(),
			slotDuration: docRaw.slotDuration || 30,

			hospital_id: bookingState.hospital.id,
			dept_id: bookingState.department.id
		  };
		});


		renderDoctors();
	  } catch (error) {
		console.error("Error loading doctors:", error);
		if (c) {
		  c.innerHTML = `
			<div class="col-12 text-danger p-3">
			  <i class="fas fa-exclamation-circle me-2"></i>
			  Failed to load doctors.
			</div>
		  `;
		}
	  }
	}
	function renderDoctors() {
	  const c = document.getElementById('docList');
	  if (!c) return;
	  c.innerHTML = '';

	  if (!bookingState.hospital || !bookingState.department) {
		c.innerHTML = `
		  <div class="col-12 text-muted p-3">
			<i class="fas fa-info-circle me-2"></i>
			Select the hospital and department first.
		  </div>
		`;
		return;
	  }

	  if (!doctors.length) {
		c.innerHTML = `
		  <div class="col-12 text-muted p-3">
			<i class="fas fa-exclamation-triangle me-2"></i>
			No doctors available.
		  </div>
		`;
		return;
	  }

	  doctors.forEach(doc => {
		const col = document.createElement('div');
		col.className = 'col-12 col-md-6';

		const card = document.createElement('button');
        card.type = 'button';
		card.className = 'card p-3 border';
		card.dataset.doc = String(doc.id);

		card.innerHTML = `
		  <div>
			<strong>${escapeHtml(doc.name || doc.doctor_name || "")}</strong>
			<div class="small text-muted">
			  ${Amal.text("مدة الموعد:", "Duration:")} ${escapeHtml(doc.slotDuration || 30)} ${Amal.text("دقيقة", "min")}
			</div>
		  </div>
		`;

		card.addEventListener('click', () => selectDoctor(doc));

		col.appendChild(card);
		c.appendChild(col);
	  });


	}

	function selectDoctor(doc) {
	  if (!doc || typeof doc !== "object") return;



	  bookingState.doctor = doc;
	  bookingState.date = null;
	  bookingState.time = null;

	  const base = Number(bookingState.department?.basePrice || 0);
	  bookingState.price = bookingState.hasInsurance && Number.isFinite(Number(bookingState.department.insuranceCopayRate)) && bookingState.department.insuranceCopayRate != null ? Math.round(base * Math.min(1, Math.max(0, Number(bookingState.department.insuranceCopayRate))) * 100) / 100 : base;

	  document.querySelectorAll('[data-doc]').forEach(el => el.classList.remove('selected'));
	  document.querySelectorAll('[data-doc]').forEach(el => {
		if (String(el.dataset.doc) === String(doc.id)) {
		  el.classList.add('selected');
		}
	  });

	  showStep(8);
	}

  function autoFillToday() { if (!bookingState.date) { bookingState.date = Amal.dateInZone(); document.getElementById("apptDate").value = bookingState.date; } }

  function enforceDateMin() { document.getElementById("apptDate").min = Amal.dateInZone(); }

  let slotLoadVersion = 0;
  async function loadTimeSlotsForSelectedDate() {
    const version = ++slotLoadVersion;
    const container = document.getElementById("slotsArea");
    const doctor = bookingState.doctor;
    const date = bookingState.date;
    container.replaceChildren();
    if (!doctor || !date) return;
    container.textContent = Amal.text("جاري التحقق من المواعيد...", "Checking appointments...");
    try {
      const bookings = await window.AmalBooking.forDoctor(doctor.email, date);
      if (version !== slotLoadVersion || doctor !== bookingState.doctor || date !== bookingState.date) return;
      doctorDayBookings = bookings;
      container.replaceChildren();
      const values = Amal.slots(doctor, date);
      if (!values.length) container.textContent = Amal.text("لا توجد أوقات متاحة في هذا اليوم.", "No appointment times are available on this day.");
      values.forEach(time => {
        const conflict = bookings.some(b => Amal.occupied({ ...b, doctor_id: Amal.doctorKey(doctor) }, Amal.doctorKey(doctor), date, time, doctor.slotDuration));
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-outline-primary time-slot";
        button.dataset.time = time;
        button.textContent = time + (conflict ? Amal.text(" (محجوز)", " (Reserved)") : "");
        button.disabled = conflict;
        if (!conflict) button.addEventListener("click", () => selectTimeSlot(time));
        container.appendChild(button);
      });
    } catch {
      if (version !== slotLoadVersion) return;
      container.textContent = Amal.text("تعذر التحقق من المواعيد. اختر التاريخ مجددًا للمحاولة.", "Could not check appointments. Select the date again to retry.");
    }
  }

	function selectTimeSlot(time) {
      if (bookingState.currentStep !== 8) return;
	  bookingState.time = time;
	  document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
	  document.querySelectorAll(`.time-slot[data-time="${time}"]`).forEach(el => el.classList.add('selected'));
	  nextStep();
	}

	function updateSummaryCard() {
	  const c = document.getElementById('summaryCard');
	  if (!c) return;

	  const html = `
		<div class="row">
		  <div class="col-6 mb-2"><div class="small text-muted"><i class="fas fa-map-marker-alt me-1"></i> ${Amal.text("المحافظة", "Governorate")}</div><strong>${escapeHtml(bookingState.gov || '-')}</strong></div>
		  <div class="col-6 mb-2"><div class="small text-muted"><i class="fas fa-building me-1"></i> ${Amal.text("نوع المنشأة", "Facility type")}</div><strong>${escapeHtml(bookingState.facilityType || '-')}</strong></div>
		</div>
		<hr class="my-2">
		<div class="row">
		  <div class="col-12 mb-2"><div class="small text-muted"><i class="fas fa-hospital me-1"></i> ${Amal.text("المستشفى", "Hospital")}</div><strong>${escapeHtml(bookingState.hospital ? bookingState.hospital.name : '-')}</strong></div>
		</div>
		<div class="row">
		  <div class="col-6 mb-2"><div class="small text-muted"><i class="fas fa-clipboard-list me-1"></i> ${Amal.text("القسم", "Department")}</div><strong>${escapeHtml(bookingState.department ? bookingState.department.title : '-')}</strong></div>
		  <div class="col-6 mb-2"><div class="small text-muted"><i class="fas fa-user-md me-1"></i> ${Amal.text("الطبيب", "Doctor")}</div><strong>${escapeHtml(bookingState.doctor ? bookingState.doctor.name : '-')}</strong></div>
		</div>
		<div class="row">
		  <div class="col-6 mb-2"><div class="small text-muted"><i class="fas fa-calendar-alt me-1"></i> ${Amal.text("التاريخ", "Date")}</div><strong>${escapeHtml(bookingState.date || '-')}</strong></div>
		  <div class="col-6 mb-2"><div class="small text-muted"><i class="fas fa-clock me-1"></i> ${Amal.text("الوقت", "Time")}</div><strong>${escapeHtml(bookingState.time || '-')}</strong></div>
		</div>
		<hr class="my-2">
		<div class="row align-items-center">
		  <div class="col-6"><div class="small text-muted"><i class="fas fa-money-bill-wave me-1"></i> ${Amal.text("التكلفة التقديرية", "Estimated cost")}</div><h4 class="mb-0 text-success">${escapeHtml(Amal.money(bookingState.price))}</h4></div>
		  <div class="col-6 text-end small text-muted"><i class="fas fa-shield-alt me-1"></i> ${Amal.text("التأمين:", "Insurance:")} ${bookingState.hasInsurance ? Amal.text("نعم", "Yes") : Amal.text("لا", "No")}</div>
		</div>
	  `;
	  c.innerHTML = html;
	}

	function validateCurrentStep() {
	  const s = bookingState.currentStep;

	  if (s === 1 && !bookingState.gov) { alert('الرجاء اختيار المحافظة.'); return false; }
	  if (s === 2 && !bookingState.facilityType) { alert('الرجاء اختيار نوع المنشأة.'); return false; }
	  if (s === 3 && !bookingState.hospital) { alert('الرجاء اختيار المستشفى.'); return false; }
	  if (s === 4 && !bookingState.department) { alert('الرجاء اختيار القسم.'); return false; }
	  if (s === 5 && bookingState.hasInsurance === null) { alert('الرجاء الإجابة على سؤال التأمين.'); return false; }
	  if (s === 6 && bookingState.hasInsurance && (!document.getElementById('insCompany').value || !document.getElementById('insPolicy').value)) { alert('الرجاء إدخال تفاصيل التأمين.'); return false; }
	  if (s === 7 && !bookingState.doctor) { alert('الرجاء اختيار الطبيب.'); return false; }
	  if (s === 8 && (!bookingState.date || !bookingState.time)) { alert('الرجاء اختيار التاريخ والوقت.'); return false; }

	  if (s === 9) {
		return validateCustomerData();
	  }

	  return true;
	}

	function validateCustomerData() {
	  const name = document.getElementById('custName').value.trim();
	  const email = document.getElementById('custEmail').value.trim();
	  const phone = document.getElementById('custPhone').value.trim();

	  const nameErr = document.getElementById('custNameError');
	  const emailErr = document.getElementById('custEmailError');
	  const phoneErr = document.getElementById('custPhoneError');

	  nameErr.textContent = "";
	  emailErr.textContent = "";
	  phoneErr.textContent = "";

	  let valid = true;

	  if (!name) {
		nameErr.textContent = "يرجى إدخال الاسم";
		valid = false;
	  }

	  if (!email) {
		emailErr.textContent = "يرجى إدخال الإيميل";
		valid = false;
	  } else if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
		emailErr.textContent = "الإيميل غير صحيح، يجب أن يحتوي على @";
		valid = false;
	  }

	  if (!phone) {
		phoneErr.textContent = "يرجى إدخال رقم الهاتف";
		valid = false;
	  } else if (!Amal.phone(phone)) {
		phoneErr.textContent = "أدخل رقمًا محليًا صحيحًا أو رقمًا دوليًا يبدأ بـ +";
		valid = false;
	  }

	  return valid;
	}

	function nextStep() {
	  if (!validateCurrentStep()) return;

	  if (bookingState.currentStep === maxStep) {
		confirmBooking();
		return;
	  }

	  let targetStep = bookingState.currentStep + 1;

	  if (bookingState.currentStep === 5 && bookingState.hasInsurance === false) {
		targetStep = 7;
	  }

	  showStep(targetStep);
	}

	// -------------------------------
	// Page Display Management
	// -------------------------------
	function goToBookingApp() {
	  document.getElementById('landingPage').classList.add('d-none');
	  document.getElementById('bookingApp').classList.remove('d-none');

	  document.getElementById('menuToggleBtn').classList.add('d-none');

	  const myBookingsBtn = document.getElementById("myBookingsBtn");
	  myBookingsBtn.classList.add("d-none");
	  myBookingsBtn.closest("li").classList.add("d-none");

	  renderGovernorates();
	  showStep(1);
	}

	function goToLandingPage() {
	  document.getElementById('landingPage').classList.remove('d-none');
	  document.getElementById('bookingApp').classList.add('d-none');

	  document.getElementById('menuToggleBtn').classList.remove('d-none');

	  const myBookingsBtn = document.getElementById("myBookingsBtn");
	  myBookingsBtn.classList.remove("d-none");
	  myBookingsBtn.closest("li").classList.remove("d-none");

	  bookingState = {
		currentStep:1, gov:null, facilityType:null, hospital:null, department:null, hasInsurance:null,
		insuranceDetails:null, doctor:null, date:null, time:null, price:null,
		customer:{name:null, email:null, phone:null, note:null}
	  };

	  renderGovernorates();
	}

	// -------------------------------
	// Event Handlers
	// -------------------------------
	document.getElementById("bookSelfBtn").onclick = () => {
	  bookingMode = "self";

	  document.getElementById("landingPage").classList.add("d-none");
	  document.getElementById("bookingApp").classList.remove("d-none");

	  renderGovernorates();
	  showStep(1);
	};

	document.getElementById("bookOtherBtn").onclick = () => {
	  bookingMode = "other";

	  document.getElementById("landingPage").classList.add("d-none");
	  document.getElementById("bookingApp").classList.remove("d-none");

	  renderGovernorates();
	  showStep(1);
	};

	document.addEventListener('click', function(e){
	  const govEl = e.target.closest('[data-gov]');
	  if(govEl){ selectGovernorate(govEl.dataset.gov); return; }

	  const typeEl = e.target.closest('[data-type]');
	  if(typeEl){ selectFacilityType(typeEl.dataset.type); return; }


	});

	document.getElementById('apptDate').addEventListener('change', function(){
	  bookingState.date = this.value;
	  bookingState.time = null;
	  loadTimeSlotsForSelectedDate();
	});

	document.getElementById('insNo').addEventListener('click', function(){
	  bookingState.hasInsurance = false;
	  bookingState.insuranceDetails = null;
	  nextStep();
	});

	document.getElementById('insYes').addEventListener('click', function(){
	  bookingState.hasInsurance = true;
	  nextStep();
	});

	document.getElementById('insForm').addEventListener('submit', function(e){
	  e.preventDefault();
	  if(validateCurrentStep()){
		bookingState.insuranceDetails = {
		  company: document.getElementById('insCompany').value,
		  policy: document.getElementById('insPolicy').value,
		  note: document.getElementById('insNote')?.value.trim() || ''
		};
		nextStep();
	  }
	});

	document.getElementById('prevBtn').addEventListener('click', function(){
	  if(bookingState.currentStep > 1){
		let targetStep = bookingState.currentStep - 1;
		if(bookingState.currentStep === 7 && bookingState.hasInsurance === false){
		  targetStep = 5;
		}
		showStep(targetStep);
	  }
	});

	document.getElementById('nextBtn').addEventListener('click', nextStep);

	document.addEventListener('DOMContentLoaded', function(){
	  goToLandingPage();
	});

	// Code GPS
	// -------------------------------
	let userLat = null;
	let userLng = null;
	const loadingBox = document.getElementById("loadingBox");

	async function requestPatientLocation() {
	  if ("geolocation" in navigator) {
		return new Promise(resolve => navigator.geolocation.getCurrentPosition(
		  (position) => {
			userLat = position.coords.latitude;
			userLng = position.coords.longitude;
            resolve(true);


			if (loadingBox) {
			  loadingBox.textContent = "✅ Your location has been successfully determined!";
			  setTimeout(() => loadingBox.classList.add("hidden"), 1500);
			}
		  },
		  (error) => {
			resolve(false);
            console.error("Error getting location:", error.message);
			if (loadingBox) {
			  loadingBox.textContent = "⚠️ We were unable to locate you. Please ensure your GPS is enabled and location permissions are granted.";
			  loadingBox.style.background = "#dc3545";
			}
		  },
		  { enableHighAccuracy: true, timeout: 10000 }
		));
	  } else {
		if (loadingBox) {
		  loadingBox.textContent = "Your device does not support geolocation (GPS).";
		  loadingBox.style.background = "#6c757d";
		}
	  }
	};

	function openDirections(hospitalName) {
	  if (userLat == null || userLng == null) {
		alert("⚠️ Your location has not yet been determined. Please wait a moment or activate GPS.");
		return;
	  }

	  const destination = encodeURIComponent(hospitalName + " Jordan");
	  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destination}&travelmode=driving`;
	  window.open(mapsUrl, "_blank");
	}

	// أزرار الطوارئ
	document.getElementById("btn-call").addEventListener("click", () => {
	  window.location.href = "tel:911";
	});


	document.getElementById("btn-hospitals").addEventListener("click", async () => {
      if (userLat == null || userLng == null) await requestPatientLocation();
	  if (userLat == null || userLng == null) {
		alert("📍 استنى شوي لحد ما يتم تحديد موقعك");
		return;
	  }

	  const url = `https://www.google.com/maps/search/hospitals/@${userLat},${userLng},14z`;
	  window.open(url, "_blank");
	});
	// -------------------------------
	// Chat
	// -------------------------------
	document.addEventListener("DOMContentLoaded", () => {
	  const chatToggle = document.getElementById("chat-toggle");
	  const chatWidget = document.getElementById("chat-widget");
	  const closeChat = document.getElementById("closeChat");

	  const openReminderPanel = document.getElementById("openReminderPanel");
	  const reminderPanel = document.getElementById("reminderPanel");
	  const closeReminderPanel = document.getElementById("closeReminderPanel");

	  const overlay = document.getElementById("overlay");

	  const sendBtn = document.getElementById("send-btn");
	  const userInput = document.getElementById("user-input");
	  const chatBody = document.getElementById("chat-body");

	  function closeAllPanels() {
		chatWidget.classList.remove("active");
		reminderPanel.classList.remove("active");
		overlay.classList.remove("active");
	  }

	  if (chatToggle) {
		chatToggle.addEventListener("click", () => {
		  reminderPanel.classList.remove("active");
		  chatWidget.classList.add("active");
		  overlay.classList.add("active");
		});
	  }

	  if (closeChat) {
		closeChat.addEventListener("click", () => {
		  chatWidget.classList.remove("active");
		  if (!reminderPanel.classList.contains("active")) {
			overlay.classList.remove("active");
		  }
		});
	  }

	  if (openReminderPanel) {
		openReminderPanel.addEventListener("click", () => {
		  chatWidget.classList.remove("active");
		  reminderPanel.classList.add("active");
		  overlay.classList.add("active");
		});
	  }

	  if (closeReminderPanel) {
		closeReminderPanel.addEventListener("click", () => {
		  reminderPanel.classList.remove("active");
		  if (!chatWidget.classList.contains("active")) {
			overlay.classList.remove("active");
		  }
		});
	  }

	  if (overlay) {
		overlay.addEventListener("click", () => {
		  closeAllPanels();
		});
	  }

	  async function askGemini(question) {
		const response = await fetch("https://amal-medical-assistant.onrender.com/api/chat", {
          signal: AbortSignal.timeout(120000),
		  method: "POST",
		  headers: {
			"Content-Type": "application/json"
		  },
		  body: JSON.stringify({ question, language: Amal.language() })
		});

		const data = await response.json().catch(() => ({answer: Amal.text("الخدمة تتأخر بالاستجابة. حاول بعد قليل.", "The service is taking longer to respond. Please retry shortly.")}));

		if (!response.ok) {
		  throw new Error(data.answer || "حدث خطأ أثناء الاتصال بالسيرفر.");
		}

		return data.answer || "لم يصلني رد من السيرفر.";
	  }

	  function appendMessage(className, content) {
		const div = document.createElement("div");
		div.className = className;
		div.textContent = content;
		chatBody.appendChild(div);
		chatBody.scrollTop = chatBody.scrollHeight;
		return div;
	  }

	  async function handleSend() {
		const question = userInput.value.trim();
		if (!question || sendBtn.disabled) return;

		sendBtn.disabled = true;
		userInput.disabled = true;

		appendMessage("user-message", question);
		userInput.value = "";

		const typingEl = appendMessage("typing", Amal.text("جاري الاتصال بالمساعد... قد يتأخر أول رد بعد الخمول.", "Connecting to the assistant... the first reply after inactivity may take longer."));

		try {
		  const answer = await askGemini(question);
		  typingEl.remove();
		  appendMessage("bot-message", answer);
		} catch (err) {
		  typingEl.remove();
		  userInput.value = question;
          appendMessage("bot-message", ["AbortError","TimeoutError"].includes(err.name) ? Amal.text("تأخر الاتصال بالمساعد. سؤالك محفوظ؛ حاول الإرسال بعد قليل.", "The assistant timed out. Your question is preserved; retry shortly.") : (err.message || Amal.text("تعذر الاتصال بالمساعد.", "Unable to reach the assistant.")));
		  console.error("Chat error:", err);
		} finally {
		  sendBtn.disabled = false;
		  userInput.disabled = false;
		  userInput.focus();
		}
	  }

	  if (sendBtn) {
		sendBtn.addEventListener("click", handleSend);
	  }

	  if (userInput) {
		userInput.addEventListener("keydown", (e) => {
		  if (e.key === "Enter") {
			e.preventDefault();
			handleSend();
		  }
		});
	  }
	});

	// -------------------------------
	// Reminder Panel
	// -------------------------------
	var editingId = null;
	const panel = document.getElementById("reminderPanel");
	const overlay = document.getElementById("overlay");
	const openReminderBtn = document.getElementById("openReminderPanel");
	const closeReminderBtn = document.getElementById("closeReminderPanel");

	if (openReminderBtn) {
	  openReminderBtn.addEventListener("click", () => {
		panel.classList.add("active");
		overlay.classList.add("active");
	  });
	}

	if (closeReminderBtn) {
	  closeReminderBtn.addEventListener("click", closePanel);
	}

	if (overlay) {
	  overlay.addEventListener("click", closePanel);
	}

	function closePanel() {
	  panel.classList.remove("active");
	  overlay.classList.remove("active");
	}

	function showList() {
	  document.getElementById("addForm").style.display = "none";
	  document.getElementById("listView").style.display = "block";
	  renderList();
	}

	function showForm() {
	  document.getElementById("addForm").style.display = "block";
	  document.getElementById("listView").style.display = "none";
	  editingId = null;

	  document.getElementById("taskName").value = "";
	  document.getElementById("taskDate").value = "";
	  document.getElementById("taskTime").value = "";
	  document.getElementById("remindBefore").value = "60";
	  document.getElementById("repeatType").value = "none";
	}

	function reminderStorageKey() { return Amal.userKey("reminders", window.auth?.currentUser?.uid || "signed-out"); }
    function saveReminder() {
      if (!window.auth?.currentUser) { alert(Amal.text("سجل الدخول لحفظ التنبيه.", "Sign in to save a reminder.")); return; }
      requestNotificationPermission();
	  const taskName = document.getElementById("taskName").value.trim();
	  const taskDate = document.getElementById("taskDate").value;
	  const taskTime = document.getElementById("taskTime").value;
	  const remindBefore = document.getElementById("remindBefore").value;
	  const repeatType = document.getElementById("repeatType").value;

	  if (!taskName || !taskDate || !taskTime || new Date(taskDate + "T" + taskTime) <= new Date()) {
		alert("يرجى تعبئة الاسم واختيار تاريخ ووقت في المستقبل.");
		return;
	  }

	  let reminders = Amal.readList(localStorage, reminderStorageKey());

	  const reminder = {
		id: editingId || Date.now(),
		name: taskName,
		date: taskDate,
		time: taskTime,
		before: remindBefore,
		repeat: repeatType
	  };

	  if (editingId) {
		reminders = reminders.map(r => r.id === editingId ? reminder : r);
	  } else {
		reminders.push(reminder);
	  }

	  localStorage.setItem(reminderStorageKey(), JSON.stringify(reminders));
	  localStorage.removeItem(`notified_${reminder.id}_${reminder.date}_${reminder.time}`);
	  editingId = null;

	  alert("✅ تم الحفظ");
	  showList();
	}

	function renderList() {
	  const list = document.getElementById("remindersList");
	  const reminders = Amal.readList(localStorage, reminderStorageKey());

	  list.innerHTML = "";

	  if (reminders.length === 0) {
		list.innerHTML = `<div style="text-align:center;color:#777;padding:12px;">لا يوجد منبهات محفوظة</div>`;
		return;
	  }

	  reminders.forEach(r => {
		list.innerHTML += `
		  <div style="border:1px solid #ddd; padding:10px; margin:8px 0; border-radius:10px; background:#fff;">
			<b>${escapeHtml(r.name)}</b><br>
			⏰ ${escapeHtml(r.time)} | 📅 ${escapeHtml(r.date)}<br>
			🔔 قبل ${escapeHtml(r.before)} دقيقة | 🔁 ${escapeHtml(r.repeat)}<br><br>
			<button type="button" onclick="edit(${r.id})">✏️ تعديل</button>
			<button type="button" onclick="del(${r.id})">🗑 حذف</button>
		  </div>
		`;
	  });
	}

	function edit(id) {
	  const reminders = Amal.readList(localStorage, reminderStorageKey());
	  const reminder = reminders.find(r => r.id === id);
	  if (!reminder) return;

	  editingId = id;
	  document.getElementById("taskName").value = reminder.name;
	  document.getElementById("taskDate").value = reminder.date;
	  document.getElementById("taskTime").value = reminder.time;
	  document.getElementById("remindBefore").value = reminder.before;
	  document.getElementById("repeatType").value = reminder.repeat;

	  document.getElementById("addForm").style.display = "block";
	  document.getElementById("listView").style.display = "none";
	}

	function del(id) {
	  const reminders = Amal.readList(localStorage, reminderStorageKey());
	  const reminderToDelete = reminders.find(r => r.id === id);

	  const updated = reminders.filter(r => r.id !== id);
	  localStorage.setItem(reminderStorageKey(), JSON.stringify(updated));

	  if (reminderToDelete) {
		localStorage.removeItem(`notified_${reminderToDelete.id}_${reminderToDelete.date}_${reminderToDelete.time}`);
	  }

	  renderList();
	}

	function requestNotificationPermission() {
	  if ("Notification" in window && Notification.permission === "default") {
		Notification.requestPermission();
	  }
	}

	function getReminderNotifyTime(reminder) {
	  const reminderDateTime = new Date(`${reminder.date}T${reminder.time}`);
	  const beforeMinutes = Number(reminder.before || 0);
	  return reminderDateTime.getTime() - (beforeMinutes * 60 * 1000);
	}

	function sendReminderNotification(reminder) {
	  const title = "🔔 تذكير طبي";
	  const body = `${reminder.name} - موعدك الساعة ${reminder.time}`;

	  if ("Notification" in window && Notification.permission === "granted") {
		new Notification(title, {
		  body: body,
		  icon: "https://i.pinimg.com/736x/5d/92/f0/5d92f02d4f3ac40b5a1e6cbe59d3740b.jpg"
		});
	  } else {
		alert(`${title}\n${body}`);
	  }
	}

  async function checkReminders() {
    const uid = window.auth?.currentUser?.uid;
    if (!uid) return;
    const reminders = Amal.readList(localStorage, Amal.userKey("reminders", uid));
    const now = new Date();
    for (const reminder of reminders) {
      const occurrence = Amal.nextOccurrence(reminder, now);
      if (!occurrence || occurrence < now) continue;
      const alertAt = occurrence.getTime() - Number(reminder.before || 0) * 60000;
      if (now.getTime() < alertAt) continue;
      const notifiedKey = Amal.userKey("notified", uid) + ":" + reminder.id + ":" + occurrence.getTime();
      if (localStorage.getItem(notifiedKey)) continue;
      localStorage.setItem(notifiedKey, "1");
      await sendReminderNotification({ ...reminder, date: occurrence.toLocaleDateString(Amal.language() === "en" ? "en-GB" : "ar-JO") });
    }
  }

  setInterval(checkReminders, 30000);
	// -------------------------------
	// booking
	// -------------------------------
  function getStatusBadge(status) { return "<span class=\"status-pill\">" + escapeHtml(Amal.status(status)) + "</span>"; }

  async function renderBookings() {
    const body = document.getElementById("bookingsListBody");
    if (!body) return;
    body.textContent = Amal.text("جاري التحميل...", "Loading...");
    try {
      const uid = window.auth?.currentUser?.uid;
      if (!uid) { body.textContent = Amal.text("سجل الدخول لعرض حجوزاتك.", "Sign in to view your bookings."); return; }
      const savedBookings = await window.AmalBooking.listMine();
      const bookings = savedBookings
        .filter(b => !b.user_uid || b.user_uid === uid)
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      if (uid !== window.auth?.currentUser?.uid) return;
      if (!bookings.length) { body.textContent = Amal.text("لا توجد حجوزات حالية.", "No bookings yet."); return; }
      body.innerHTML = bookings.map(b => `
        <div class="booking-summary">
          <div><strong>${Amal.text("رقم الحجز:", "Reference:")}</strong> ${escapeHtml(b.booking_id || "-")}</div>
          <div><strong>${Amal.text("الطبيب:", "Doctor:")}</strong> ${escapeHtml(b.doctor_name || "-")}</div>
          <div><strong>${Amal.text("المستشفى:", "Hospital:")}</strong> ${escapeHtml(b.hospital_name || "-")}</div>
          <div><strong>${Amal.text("القسم:", "Department:")}</strong> ${escapeHtml(b.department_title || "-")}</div>
          <div><strong>${Amal.text("الموعد:", "Appointment:")}</strong> ${escapeHtml(b.date || "-")} — ${escapeHtml(b.time || "-")}</div>
          <div><strong>${Amal.text("الحالة:", "Status:")}</strong> ${getStatusBadge(b.status)}</div>
          ${b.reschedule_reason ? "<div>" + escapeHtml(b.reschedule_reason) + "</div>" : ""}
        </div>`).join("");
    } catch {
      body.textContent = Amal.text("تعذر تحميل الحجوزات. اضغط تحديث للمحاولة.", "Could not load bookings. Press Refresh to retry.");
    }
  }
	const myBookingsBtn = document.getElementById("myBookingsBtn");

	if (myBookingsBtn) {
	  myBookingsBtn.addEventListener("click", async () => {

		await renderBookings();
	  });
	}
	document.getElementById('homeBtn').addEventListener('click', (e) => {
	  e.preventDefault();
	  goToLandingPage();
	});
	// -------------------------------
	// Project Info Slideshow
	// -------------------------------
	let current = 0;
	const steps = document.querySelectorAll(".project-info");

	if (steps.length > 0) {
	  steps.forEach((step, index) => {
		step.classList.toggle("active", index === 0);
	  });

	  function showNext() {
		steps[current].classList.remove("active");
		current = (current + 1) % steps.length;
		steps[current].classList.add("active");
	  }

	  setInterval(showNext, 10000);
	}

	async function refreshBookings() {
	  const container = document.getElementById("bookingsListBody");

	  if (container) {
		container.innerHTML = "🔄 Updating...";
	  }

	  try {
		await renderBookings(); // هاي الدالة أصلاً عندك
	  } catch (error) {
		console.error("Refresh error:", error);
		if (container) {
		  container.innerHTML = "❌ Failed to refresh";
		}
	  }
	}
	function normalizeDateOnly(dateValue) {
	  if (!dateValue) return null;

	  const d = new Date(dateValue);
	  if (isNaN(d.getTime())) return null;

	  d.setHours(0, 0, 0, 0);
	  return d;
	}

	function isBookingStillValid(booking) {
	  const bookingDate = normalizeDateOnly(booking.date);
	  if (!bookingDate) return true; // إذا التاريخ ناقص خليه يبين

	  const today = new Date();
	  today.setHours(0, 0, 0, 0);

	  return bookingDate >= today;
	}
