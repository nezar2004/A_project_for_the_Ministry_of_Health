import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
    import {
      getAuth,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      sendPasswordResetEmail
    } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

    import {
      getFirestore,
      doc,
      setDoc,
      serverTimestamp,
      collection,
      query,
      where,
      getDocs,
      limit
    } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyC4l0BaiwsxguCFPWBEF_5xoUv45PWjHqk",
      authDomain: "nabdapp-3a077.firebaseapp.com",
      projectId: "nabdapp-3a077",
      storageBucket: "nabdapp-3a077.appspot.com",
      messagingSenderId: "675031985272",
      appId: "1:675031985272:web:5f86cc21c28062cd65d18d"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    document.getElementById("loginNationalID").addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("loginPassword").focus(); });
    document.getElementById("loginPassword").addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("loginBtn").click(); });
    const db = getFirestore(app);

    window.showForm = (id) => {
      document.querySelectorAll(".container > div").forEach(div => div.classList.add("hidden"));
      document.getElementById(id).classList.remove("hidden");
    };

    window.togglePassword = (inputId, btn) => {
      const input = document.getElementById(inputId);
      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "إخفاء";
      } else {
        input.type = "password";
        btn.textContent = "إظهار";
      }
    };

    function isValidNationalID(nid) {
      const cleaned = nid.trim();
      return cleaned.length === 10 && /^[0-9]+$/.test(cleaned);
    }

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    function normalizePhone(countryCode, phone) {
      const cleaned = phone.trim();
      return countryCode + (cleaned.startsWith("0") ? cleaned.substring(1) : cleaned);
    }

    document.getElementById("registerBtn").onclick = async () => {
      const firstName = document.getElementById("regFirstName").value.trim();
      const lastName = document.getElementById("regLastName").value.trim();
      const nationalID = document.getElementById("regNationalID").value.trim();
      const email = document.getElementById("regEmail").value.trim().toLowerCase();
      const countryCode = document.getElementById("regCountryCode").value;
      const phone = document.getElementById("regPhone").value.trim();
      const birthday = document.getElementById("regBirthday").value;
      const gender = document.getElementById("regGender").value;
      const password = document.getElementById("regPassword").value;

      if (!firstName || !lastName || !nationalID || !email || !phone || !birthday || !gender || !password) {
        alert("يرجى تعبئة جميع الحقول");
        return;
      }

      if (!isValidNationalID(nationalID)) {
        alert("الرقم الوطني يجب أن يكون 10 أرقام");
        return;
      }

      if (!isValidEmail(email)) {
        alert("يرجى إدخال بريد إلكتروني صحيح");
        return;
      }

      if (!Amal.phone(normalizePhone(countryCode, phone)) || birthday > Amal.dateInZone()) { alert(Amal.text("تحقق من الهاتف وتاريخ الميلاد.", "Check your phone number and birth date.")); return; }
      if (password.length < 6) {
        alert("كلمة المرور يجب أن تكون 6 أحرف أو أكثر");
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        await setDoc(doc(db, "users", uid), {
          firstName,
          lastName,
          name: firstName + " " + lastName,
          nationalID,
          email,
          phone: normalizePhone(countryCode, phone),
          birthday,
          gender,
          createdAt: serverTimestamp()
        });

        alert("✅ تم إنشاء الحساب بنجاح");
        window.location.href = "login_Patient.html";
      } catch (err) {
        if (err.code === "auth/email-already-in-use") {
          alert("هذا البريد الإلكتروني مستخدم مسبقاً");
        } else {
          alert("⚠️ حدث خطأ أثناء إنشاء الحساب: " + err.message);
        }
      }
    };

    document.getElementById("loginBtn").onclick = async () => {
      const nationalID=document.getElementById("loginNationalID").value.trim();
      const password=document.getElementById("loginPassword").value;
      if(!isValidNationalID(nationalID)||!password){alert(Amal.text("أدخل الرقم الوطني من 10 أرقام وكلمة المرور", "Enter your 10-digit national ID and password"));return;}
      const button=document.getElementById("loginBtn");if(button.disabled)return;button.disabled=true;
      try {
        const response=await fetch("https://amal-medical-assistant.onrender.com/api/patient-login",{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",signal:AbortSignal.timeout(90000),body:JSON.stringify({nationalID,password})});
        const result=await response.json();if(!response.ok)throw new Error(result.answer||"Login failed");
        await signInWithEmailAndPassword(auth,result.email,password);
        window.location.href="Patient_booking_page.html";
      }catch(error){alert(Amal.text("تعذر الدخول. تحقق من الرقم الوطني وكلمة المرور، أو حاول بعد دقيقة.","Unable to sign in. Check your national ID and password, or retry in a minute."));}
      finally{button.disabled=false;}
    };

    document.getElementById("forgotBtn").onclick = async () => {
      const email = document.getElementById("forgotEmail").value.trim().toLowerCase();

      if (!email) {
        alert("يرجى إدخال البريد الإلكتروني");
        return;
      }

      if (!isValidEmail(email)) {
        alert("البريد الإلكتروني غير صحيح");
        return;
      }

      try {
        await sendPasswordResetEmail(auth, email);
        alert("✅ إذا كان البريد مسجلاً فسيصلك رابط إعادة التعيين.");
      } catch (err) {
        alert("⚠️ تعذر إرسال رابط إعادة التعيين الآن.");
      }
    };
	window.goHome = function () {
	  window.location.href = "index.html"; // غيرها حسب اسم الصفحة الرئيسية عندك
	};
