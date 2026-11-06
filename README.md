<div align="center">
  <img src="./icon.svg" width="100" alt="Amal logo">

  <h1>Amal | تطبيق أمل</h1>

  <p><strong>A graduation project for finding healthcare providers and booking appointments in Jordan.</strong></p>
  <p>مشروع تخرّج لتسهيل الوصول إلى مقدّمي الرعاية الصحية وحجز المواعيد في الأردن.</p>

  <a href="https://nezar2004.github.io/A_project_for_the_Ministry_of_Health/"><img alt="Open Amal" src="https://img.shields.io/badge/Open_Amal-Live_Demo-0F766E?style=for-the-badge"></a>
  <a href="https://github.com/nezar2004/A_project_for_the_Ministry_of_Healthjs"><img alt="Backend repository" src="https://img.shields.io/badge/Backend-Source_Code-24292F?style=for-the-badge&logo=github"></a>

  <p>
    <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black">
    <img alt="Firebase" src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black">
    <img alt="Progressive Web App" src="https://img.shields.io/badge/PWA-5A0FC8?logo=pwa&logoColor=white">
  </p>
</div>

## About the project

Amal brings the healthcare directory, appointment booking, and appointment follow-up into one bilingual web app. Patients can browse providers by governorate, facility, and specialty. Authorized doctors can manage appointments assigned to them from a separate dashboard.

This repository contains the web interface for an academic prototype. The companion backend handles protected booking operations and the health awareness assistant.

## What Amal offers

| Area | Features |
| --- | --- |
| Patient accounts | Registration, sign-in using a national ID and password, and password recovery by email |
| Provider directory | Browse facilities by governorate and type, then choose a department and doctor |
| Appointment booking | Choose an available time, enter optional insurance details, and book for yourself or another person |
| Booking history | See appointment status and follow changes after a doctor reviews the request |
| Doctor dashboard | Review assigned bookings, update availability, approve, reject, reschedule, cancel, and add notes |
| Patient tools | Health awareness assistant, browser reminders, and emergency contacts on supported devices |
| Language and access | Arabic and English, right-to-left layout in Arabic, accessibility controls, and an installable web app on supported browsers |

New bookings start as **Pending**. The backend checks the doctor's schedule and prevents overlapping appointments before saving a request. Doctors can then review it from their dashboard.

## How it works

| Layer | Technology and role |
| --- | --- |
| Frontend | HTML, CSS, and JavaScript. GitHub Pages hosts the web interface |
| Authentication | Firebase Authentication manages sign-in for patients and doctors |
| Data | Cloud Firestore stores patient profiles, the provider directory, and booking records |
| Backend | Node.js and Express on Render validate requests, enforce access, and handle booking updates |
| Assistant | Google Gemini provides general health awareness through the backend |
| Browser storage | Reminders and emergency contacts stay on the device |

The assistant provides general health information. Appointment decisions and clinical care remain with qualified healthcare professionals.

## Explore the source

| File | Purpose |
| --- | --- |
| [index.html](./index.html) | Landing page |
| [login_Patient.html](./login_Patient.html) | Patient registration and sign-in |
| [Patient_booking_page.html](./Patient_booking_page.html) | Booking, history, and patient tools |
| [doctor_login.html](./doctor_login.html) | Doctor sign-in |
| [doctor_dashboard.html](./doctor_dashboard.html) | Doctor appointment management |
| [firebase/](./firebase/) | Firebase rules and configuration resources |
| [tests/](./tests/) | Project tests |

See [ROLLOUT.md](./ROLLOUT.md) for deployment and [SECURITY.md](./SECURITY.md) for access and security details.

---

<div align="center">
  <strong>Amal · أمل</strong><br>
  Graduation Project · Computer Information Systems · Yarmouk University
</div>
