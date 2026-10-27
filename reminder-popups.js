function playReminderSound() {
	  const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
	  audio.volume = 1;
	  audio.play().catch(() => {

	  });
	}

	function showReminderPopup(reminder) {
	  const box = document.createElement("div");
	  box.style.cssText = `
		position: fixed;
		top: 90px;
		left: 20px;
		z-index: 999999;
		background: white;
		color: #18362f;
		padding: 18px 22px;
		border-radius: 18px;
		box-shadow: 0 12px 30px rgba(0,0,0,0.18);
		border: 1px solid #cdeee3;
		max-width: 320px;
		font-family: Cairo, sans-serif;
	  `;

	  box.innerHTML = `
		<strong style="color:#1b6f57;font-size:18px;">🔔 تنبيه طبي</strong>
		<p style="margin:10px 0 0;color:#18362f;">
		  ${escapeHtml(reminder.name)}<br>
		  📅 ${reminder.date} — ⏰ ${reminder.time}
		</p>
		<button onclick="this.parentElement.remove()" style="
		  margin-top:12px;
		  width:100%;
		  border:none;
		  border-radius:12px;
		  padding:10px;
		  background:#49cfa7;
		  color:white;
		  font-weight:700;
		  cursor:pointer;
		">تم</button>
	  `;

	  document.body.appendChild(box);
	}

  function checkRemindersOnAppOpen() { checkReminders(); }

	document.addEventListener("DOMContentLoaded", () => {
	  checkRemindersOnAppOpen();

	});
