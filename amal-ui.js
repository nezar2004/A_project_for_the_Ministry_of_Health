document.addEventListener("DOMContentLoaded", () => {
  const pairs = [["insCompany","insurance_company"],["insPolicy","policy_number"],["custName","full_name"],["custEmail","email_label"],["custPhone","phone_label"],["custNote","note_label"],["apptDate","date_label"]];
  for (const [id, key] of pairs) {
    const input = document.getElementById(id), label = document.querySelector('label[data-i18n="' + key + '"]');
    if (input && label) label.htmlFor = id;
  }
  for (const card of document.querySelectorAll(".select-card")) {
    card.setAttribute("role", "button"); card.tabIndex = 0;
    card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); card.click(); } });
  }
  const live = document.getElementById("chat-body");
  if (live) { live.setAttribute("role", "log"); live.setAttribute("aria-live", "polite"); live.setAttribute("aria-label", Amal.text("محادثة المساعد", "Assistant conversation")); }
  const send = document.getElementById("send-btn");
  if (send) send.setAttribute("aria-label", Amal.text("إرسال الرسالة", "Send message"));
  const close = document.getElementById("closeChat");
  if (close) close.setAttribute("aria-label", Amal.text("إغلاق المحادثة", "Close chat"));
  for (const id of ["chat-widget", "reminderPanel", "bookingDrawer"]) {
    const panel = document.getElementById(id); if (!panel) continue;
    let previous, wasOpen = false;
    const observer = new MutationObserver(() => {
      const open = panel.classList.contains("active");
      if (open === wasOpen) return; wasOpen = open;
      panel.inert = !open;
      if (open) { previous = document.activeElement; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.querySelector("button, input, select, textarea")?.focus(); }
      else previous?.focus();
    });
    panel.inert = !panel.classList.contains("active");
    observer.observe(panel, {attributes:true, attributeFilter:["class"]});
    panel.addEventListener("keydown", event => {
      if (event.key === "Escape") { panel.querySelector("#closeChat, #closeReminderPanel, #closeDrawerButton")?.click(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...panel.querySelectorAll("button, input, select, textarea, a[href], [tabindex='0']")].filter(e => !e.disabled && e.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
  }
});
