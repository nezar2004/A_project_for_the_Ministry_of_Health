const translations = {
  ar: {
    page_title: "أمل - وزارة الصحة",
    brand_badge: "💚 أمل",
    brand_title: "بوابة المرضى",
    brand_subtitle: "سجّل دخولك للوصول إلى خدمات الحجز الطبية، متابعة المواعيد، وإدارة حسابك بسهولة ضمن واجهة حديثة ومريحة وواضحة.",
    card1_title: "سهولة الاستخدام",
    card1_desc: "تنقل واضح بين تسجيل الدخول، إنشاء الحساب، واستعادة كلمة المرور.",
    card2_title: "إدارة حجوزاتك بسهولة",
    card2_desc: "عرض مواعيدك ومتابعة موافقة الطبيب أو تغيير الموعد.",
    card3_title: "ذكاء اصطناعي مدمج",
    card3_desc: "مساعد توعوي للإجابة عن الأسئلة الصحية العامة.",
    side_footer: "وزارة الصحة الأردنية — منصة أمل الرقمية للرعاية الصحية",

    login_title: "تسجيل الدخول",
    login_subtitle: "أدخل بياناتك للوصول إلى حساب المريض",
    login_national_id_label: "الرقم الوطني",
    login_national_id_placeholder: "الرقم الوطني (10 أرقام)",
    login_password_label: "كلمة المرور",
    login_password_placeholder: "أدخل كلمة المرور",
    show_btn: "إظهار",
    hide_btn: "إخفاء",
    login_btn: "تسجيل الدخول",
    home_btn: "الصفحة الرئيسية",
    create_account_link: "إنشاء حساب جديد",
    forgot_password_link: "نسيت كلمة المرور؟",

    register_title: "إنشاء حساب جديد",
    register_subtitle: "املأ البيانات التالية لإنشاء حساب المريض",
    first_name_label: "الاسم الأول",
    first_name_placeholder: "أدخل الاسم الأول",
    last_name_label: "اسم العائلة",
    last_name_placeholder: "أدخل اسم العائلة",
    register_national_id_label: "الرقم الوطني",
    register_national_id_placeholder: "الرقم الوطني (10 أرقام)",
    email_label: "البريد الإلكتروني",
    email_placeholder: "أدخل البريد الإلكتروني",
    phone_label: "رقم الهاتف",
    phone_placeholder: "7XXXXXXXX",
    birthday_label: "تاريخ الميلاد",
    gender_label: "الجنس",
    gender_placeholder: "اختر الجنس",
    male_option: "ذكر",
    female_option: "أنثى",
    register_password_label: "كلمة المرور",
    register_password_placeholder: "أدخل كلمة المرور",
    register_btn: "إنشاء الحساب",
    have_account_link: "لديك حساب؟ سجل دخولك",

    forgot_title: "استعادة كلمة المرور",
    forgot_subtitle: "استرجاع الوصول إلى الحساب بخطوات بسيطة",
    forgot_note: "أدخل بريدك الإلكتروني، وسيتم إرسال رابط آمن لإعادة تعيين كلمة المرور.",
    forgot_national_id_label: "البريد الإلكتروني",
    forgot_national_id_placeholder: "أدخل البريد الإلكتروني",
    forgot_btn: "إرسال رابط إعادة التعيين",
    back_to_login_link: "العودة لتسجيل الدخول"
  },
  en: {
    page_title: "Amal System - Ministry of Health",
    brand_badge: "💚 Amal Medical System",
    brand_title: "Patient Portal",
    brand_subtitle: "Sign in to access medical booking services, follow appointments, and manage your account easily through a modern, comfortable, and clear interface.",
    card1_title: "Easy to Use",
    card1_desc: "Clear navigation between sign in, account creation, and password recovery.",
    card2_title: "Manage Your Bookings Easily",
    card2_desc: "View your appointments and follow doctor approvals or appointment changes.",
    card3_title: "Built-in AI",
    card3_desc: "An educational assistant for general health questions.",
    side_footer: "Jordan Ministry of Health — Amal Digital Healthcare Platform",

    login_title: "Sign In",
    login_subtitle: "Enter your details to access the patient account",
    login_national_id_label: "National ID",
    login_national_id_placeholder: "National ID (10 digits)",
    login_password_label: "Password",
    login_password_placeholder: "Enter password",
    show_btn: "Show",
    hide_btn: "Hide",
    login_btn: "Sign In",
    home_btn: "Home",
    create_account_link: "Create New Account",
    forgot_password_link: "Forgot Password?",

    register_title: "Create New Account",
    register_subtitle: "Fill in the following details to create a patient account",
    first_name_label: "First Name",
    first_name_placeholder: "Enter first name",
    last_name_label: "Last Name",
    last_name_placeholder: "Enter last name",
    register_national_id_label: "National ID",
    register_national_id_placeholder: "National ID (10 digits)",
    email_label: "Email",
    email_placeholder: "Enter email",
    phone_label: "Phone Number",
    phone_placeholder: "7XXXXXXXX",
    birthday_label: "Date of Birth",
    gender_label: "Gender",
    gender_placeholder: "Select gender",
    male_option: "Male",
    female_option: "Female",
    register_password_label: "Password",
    register_password_placeholder: "Enter password",
    register_btn: "Create Account",
    have_account_link: "Already have an account? Sign in",

    forgot_title: "Recover Password",
    forgot_subtitle: "Restore access to your account in simple steps",
    forgot_note: "Enter your email address and we will send a secure password reset link.",
    forgot_national_id_label: "Email address",
    forgot_national_id_placeholder: "Enter your email address",
    forgot_btn: "Send Reset Link",
    back_to_login_link: "Back to Sign In"
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

  document.querySelectorAll("[data-placeholder]").forEach(el => {
    const key = el.getAttribute("data-placeholder");
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("siteLanguage") || "ar";
  applyLanguage(savedLang);
});
