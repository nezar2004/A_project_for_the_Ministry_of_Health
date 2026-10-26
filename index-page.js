const openLoginOptions = document.getElementById("openLoginOptions");
  const scrollToOptions = document.getElementById("scrollToOptions");

  const loginOptionsSection = document.getElementById("loginOptionsSection");
  const goDoctorLogin = document.getElementById("goDoctorLogin");
  const goUserLogin = document.getElementById("goUserLogin");

  function showOptions() {
    loginOptionsSection.classList.add("active");
    loginOptionsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideOptions() {
    loginOptionsSection.classList.remove("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  openLoginOptions.addEventListener("click", showOptions);

  goDoctorLogin.addEventListener("click", () => {
    window.location.href = "doctor_login.html";
  });

  goUserLogin.addEventListener("click", () => {
    window.location.href = "login_Patient.html?v=3";
  });
