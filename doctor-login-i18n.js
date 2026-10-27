const translations = {
  ar: {
    page_title: "تسجيل دخول الطبيب - أمل",
    brand_badge: "💚 نظام أمل الطبي",
    brand_title: "بوابة الأطباء",
    brand_subtitle: "سجّل دخولك للوصول إلى لوحة الطبيب، متابعة حجوزات المرضى، وإدارة مواعيدك بسهولة ضمن واجهة حديثة وسريعة وواضحة.",

    card1_title: "إدارة أسرع للمواعيد",
    card1_desc: "تأكيد، رفض، أو تعديل أي موعد مباشرة من لوحة واحدة بدون تعقيد.",

    card2_title: "أرشفة تلقائية",
    card2_desc: "يتم حفظ وتنظيم الحجوزات القديمة تلقائياً لسهولة الرجوع إليها لاحقاً.",

    card3_title: "عرض إحصائي مبسط",
    card3_desc: "استعراض مبسّط للبيانات يتيح لك فهم الحالات بنظرة واحدة.",

    footer: "وزارة الصحة الأردنية — منصة أمل الرقمية للرعاية الصحية",

    login_title: "تسجيل دخول الطبيب",
    login_sub: "أدخل البريد الإلكتروني وكلمة المرور للوصول إلى لوحة التحكم",

    email_label: "البريد الإلكتروني",
    email_placeholder: "doctor@example.com",

    password_label: "كلمة المرور",
    password_placeholder: "أدخل كلمة المرور",
    show: "إظهار",
    hide: "إخفاء",

    login_btn: "تسجيل الدخول",
    home_btn: "الصفحة الرئيسية"
  },

  en: {
    page_title: "Doctor Login - Amal",
    brand_badge: "💚 Amal Health System",
    brand_title: "Doctor Portal",
    brand_subtitle: "Log in to access your dashboard, manage appointments, and track patient bookings easily through a modern interface.",

    card1_title: "Faster Appointment Management",
    card1_desc: "Approve, reject, or edit appointments from one simple dashboard.",

    card2_title: "Automatic Archiving",
    card2_desc: "All past bookings are saved and organized automatically.",

    card3_title: "Simple Statistics View",
    card3_desc: "Quick data insights to understand cases at a glance.",

    footer: "Jordan Ministry of Health — Amal Digital Platform",

    login_title: "Doctor Login",
    login_sub: "Enter your email and password to access the dashboard",

    email_label: "Email",
    email_placeholder: "doctor@example.com",

    password_label: "Password",
    password_placeholder: "Enter password",
    show: "Show",
    hide: "Hide",

    login_btn: "Login",
    home_btn: "Home"
  }
};

function applyLanguage(lang) {
  lang = ["ar", "en"].includes(lang) ? lang : "ar";
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = translations[lang].page_title;

  // نصوص عادية
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // placeholders
  document.querySelectorAll("[data-placeholder]").forEach(el => {
    const key = el.getAttribute("data-placeholder");
    if (translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });
}

// تحميل اللغة من الصفحة الرئيسية
document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLanguage") || "ar";
  applyLanguage(savedLang);
});
