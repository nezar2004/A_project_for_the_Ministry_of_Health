const translations = {
  ar: {
    page_title: "أمل  | الصفحة الرئيسية",
    app_name: "تطبيق أمل ",
    app_desc: "منصة صحية ذكية لتنظيم المواعيد والخدمات الطبية",
    hero_badge: "وصول سريع وواضح إلى الخدمة المناسبة",
    welcome_title: "مرحبًا بك في تطبيق أمل ",
    welcome_text: "من هذه الصفحة يمكنك اختيار طريقة الدخول المناسبة لك. سواء كنت طبيبًا أو مريضًا، ستنتقل مباشرة إلى المسار الصحيح داخل النظام لتسهيل إدارة المواعيد، متابعة الحجوزات، والوصول إلى الخدمات الطبية بشكل منظم وسريع.",
    start_login: "ابدأ تسجيل الدخول",
    choose_login: "اختر نوع الدخول",
    choose_login_desc: "حدد نوع الحساب للانتقال إلى صفحة الدخول المناسبة ومتابعة استخدام خدمات النظام بسهولة.",
    doctor_title: "دخول الأطباء",
    doctor_desc: "هذا القسم مخصص للأطباء للوصول إلى لوحة التحكم الخاصة بهم، ومتابعة طلبات الحجز، وإدارة المواعيد، والاطلاع على البيانات المرتبطة بالحالات والمراجعين.",
    doctor_feature_1: "الوصول إلى لوحة تحكم الطبيب",
    doctor_feature_2: "مراجعة الحجوزات والموافقة عليها أو تعديلها",
    doctor_feature_3: "تنظيم المواعيد ومتابعة العمل اليومي",
    doctor_btn: "الدخول كطبيب",
    user_title: "دخول المرضى والمستخدمين",
    user_desc: "هذا القسم مخصص للمرضى والمستخدمين للدخول إلى حساباتهم، وحجز المواعيد، ومتابعة الطلبات، والاستفادة من الخدمات الصحية المتوفرة داخل التطبيق.",
    user_feature_1: "تسجيل دخول خاص بالمريض أو المستخدم",
    user_feature_2: "إمكانية الحجز ومتابعة الخدمات الطبية",
    user_feature_3: "واجهة واضحة وسهلة الاستخدام",
    user_btn: "الدخول كمريض أو مستخدم"
  },
  en: {
    page_title: "Amal | Home",
    app_name: "Amal App",
    app_desc: "A smart healthcare platform for managing appointments and medical services",
    hero_badge: "Fast and clear access to the right service",
    welcome_title: "Welcome to Amal App",
    welcome_text: "From this page, you can choose the login method that suits you. Whether you are a doctor or a patient, you will be directed to the correct path inside the system to make appointment management, booking follow-up, and access to medical services more organized and faster.",
    start_login: "Start Login",
    choose_login: "Choose Login Type",
    choose_login_desc: "Select the account type to go to the correct login page and continue using the system services easily.",
    doctor_title: "Doctor Portal",
    doctor_desc: "This section is for doctors to access their dashboard, review booking requests, manage appointments, and view data related to cases and patients.",
    doctor_feature_1: "Access the doctor dashboard",
    doctor_feature_2: "Review, approve, or edit bookings",
    doctor_feature_3: "Organize appointments and daily workflow",
    doctor_btn: "Login as Doctor",
    user_title: "Patient and User Portal",
    user_desc: "This section is for patients and users to access their accounts, book appointments, track requests, and benefit from the healthcare services available in the app.",
    user_feature_1: "Dedicated login for patient or user",
    user_feature_2: "Book appointments and follow medical services",
    user_feature_3: "Clear and easy-to-use interface",
    user_btn: "Login as Patient or User"
  }
};

function applyLanguage(lang) {
  lang = ["ar", "en"].includes(lang) ? lang : "ar";
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = translations[lang].page_title;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  localStorage.setItem("siteLanguage", lang);
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLanguage") || "ar";
  const langButtons = document.querySelectorAll(".lang-btn");

  applyLanguage(savedLang);

  langButtons.forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.lang === savedLang) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;

      applyLanguage(lang);

      langButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
});
