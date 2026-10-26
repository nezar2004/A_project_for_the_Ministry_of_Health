import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
  import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
  import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

  const doctorFirebaseConfig = {
    apiKey: "AIzaSyClPA_4ZjzUrnERb_k-6yBtgb9AB7QIryA",
    authDomain: "dataofhosp.firebaseapp.com",
    projectId: "dataofhosp",
    storageBucket: "dataofhosp.firebasestorage.app",
    messagingSenderId: "908860921572",
    appId: "1:908860921572:web:1fce145520ef5ecd7b7ef1"
  };

  const doctorApp = initializeApp(doctorFirebaseConfig);
  const auth = getAuth(doctorApp);
  const db = getFirestore(doctorApp);

  const form = document.getElementById("doctorLoginForm");
  const emailInput = document.getElementById("doctorEmail");
  const passwordInput = document.getElementById("doctorPassword");
  const loginError = document.getElementById("loginError");
  const loginSuccess = document.getElementById("loginSuccess");
  const goHomeBtn = document.getElementById("goHomeBtn");

  window.togglePassword = function (inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === "password") {
      input.type = "text";
      if (btn) btn.textContent = "إخفاء";
    } else {
      input.type = "password";
      if (btn) btn.textContent = "إظهار";
    }
  };

  function showError(message) {
    if (!loginError || !loginSuccess) return;
    loginError.textContent = message;
    loginError.style.display = "block";
    loginSuccess.style.display = "none";
  }

  function showSuccess(message) {
    if (!loginError || !loginSuccess) return;
    loginSuccess.textContent = message;
    loginSuccess.style.display = "block";
    loginError.style.display = "none";
  }

  function hideMessages() {
    if (loginError) loginError.style.display = "none";
    if (loginSuccess) loginSuccess.style.display = "none";
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  async function findDoctorByEmail(email) {
    const hospitalsSnap = await getDocs(collection(db, "hospitals"));

    for (const hospitalDoc of hospitalsSnap.docs) {
      const hospitalData = hospitalDoc.data();

      const departmentsSnap = await getDocs(
        collection(db, "hospitals", hospitalDoc.id, "departments")
      );

      for (const deptDoc of departmentsSnap.docs) {
        const deptData = deptDoc.data();

        const doctorsSnap = await getDocs(
          collection(db, "hospitals", hospitalDoc.id, "departments", deptDoc.id, "doctors")
        );

        for (const doctorDoc of doctorsSnap.docs) {
          const doctorData = doctorDoc.data();
          const doctorEmail = normalizeEmail(doctorData.email);

          if (doctorEmail === email) {
            return {
              uid: "",
              email: doctorEmail,
              doctorDocId: doctorDoc.id,
              doctorId: doctorData.id ?? doctorDoc.id,
              doctorKey: doctorData.doctorKey || "",
              name: doctorData.name || "",
              hospitalDocId: hospitalDoc.id,
              hospitalId: hospitalData.id ?? hospitalDoc.id,
              hospitalName: doctorData.hospitalName || hospitalData.name || "",
              departmentDocId: deptDoc.id,
              departmentId: deptData.id ?? deptDoc.id,
              departmentTitle: doctorData.departmentName || deptData.title || "",
              hospitalType: doctorData.hospitalType || hospitalData.type || "",
              slotDuration: doctorData.slotDuration || 0
            };
          }
        }
      }
    }

    return null;
  }

  async function saveDoctorSession(user, doctorData) {
    const sessionData = {
      uid: user.uid,
      email: normalizeEmail(user.email),
      doctorDocId: doctorData.doctorDocId,
      doctorId: doctorData.doctorId,
      doctorKey: doctorData.doctorKey,
      name: doctorData.name,
      hospitalDocId: doctorData.hospitalDocId,
      hospitalId: doctorData.hospitalId,
      hospitalName: doctorData.hospitalName,
      departmentDocId: doctorData.departmentDocId,
      departmentId: doctorData.departmentId,
      departmentTitle: doctorData.departmentTitle,
      hospitalType: doctorData.hospitalType,
      slotDuration: doctorData.slotDuration
    };

    sessionStorage.setItem("doctorAuth", JSON.stringify(sessionData));
  }

  async function handleDoctorLogin(user) {
    const email = normalizeEmail(user.email);
    const doctorData = await findDoctorByEmail(email);

    if (!doctorData) {
      throw new Error("doctor-not-found-in-firestore");
    }

    await saveDoctorSession(user, doctorData);
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
      await handleDoctorLogin(user);
      window.location.href = "doctor_dashboard.html";
    } catch (error) {
      console.error("Auto login error:", error);
    }
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = normalizeEmail(emailInput?.value);
      const password = passwordInput?.value || "";

      hideMessages();

      if (!email || !password) {
        showError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
        return;
      }

      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await handleDoctorLogin(cred.user);

        showSuccess("تم تسجيل الدخول بنجاح");
        setTimeout(() => {
          window.location.href = "doctor_dashboard.html";
        }, 600);
      } catch (error) {
        console.error("Doctor login error:", error);

        if (error.code === "auth/invalid-credential") {
          showError("الإيميل أو كلمة المرور غير صحيحة");
        } else if (error.code === "auth/user-not-found") {
          showError("هذا الحساب غير موجود");
        } else if (error.code === "auth/wrong-password") {
          showError("كلمة المرور غير صحيحة");
        } else if (error.code === "auth/invalid-email") {
          showError("صيغة البريد الإلكتروني غير صحيحة");
        } else if (error.message === "doctor-not-found-in-firestore") {
          showError("تم تسجيل الدخول لكن هذا الدكتور غير موجود داخل قاعدة بيانات الدكاترة");
        } else {
          showError("حدث خطأ أثناء تسجيل الدخول");
        }
      }
    });
  }

  if (goHomeBtn) {
    goHomeBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }
