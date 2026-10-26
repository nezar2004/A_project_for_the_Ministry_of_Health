async function setupEmergencyContacts() {
  let contacts = JSON.parse(localStorage.getItem("emergencyContacts") || "[]");

  if (contacts.length) {
    showEmergencyContacts(contacts);
    return;
  }

  try {
    const picked = await navigator.contacts.select(["name", "tel"], {
      multiple: true
    });

    contacts = picked
      .filter(c => c.tel && c.tel.length)
      .slice(0, 3)
      .map(c => ({
        name: c.name?.[0] || "جهة طوارئ",
        phone: c.tel[0]
      }));

    if (!contacts.length) return;

    localStorage.setItem("emergencyContacts", JSON.stringify(contacts));
    showEmergencyContacts(contacts);

  } catch (err) {

  }
}

function showEmergencyContacts(contacts) {
  let text = "اختر رقم للاتصال:\n\n";

  contacts.forEach((c, i) => {
    text += `${i + 1}- ${c.name} : ${c.phone}\n`;
  });

  const choice = prompt(text);
  const index = Number(choice) - 1;

  if (contacts[index]) {
	  let phone = contacts[index].phone;

	  phone = phone
		.trim()
		.replace(/\s+/g, "")
		.replace(/\+/g, "");

	  if (phone.startsWith("962")) {
		phone = "0" + phone.slice(3);
	  }

	  window.location.href = "tel:" + phone;
  }
}

document.getElementById("btn-custom")?.addEventListener("click", setupEmergencyContacts);
