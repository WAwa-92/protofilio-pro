const CONTACT_EMAIL = "waelbakkay.pro@gmail.com";

const form = document.getElementById("contact-form");
const statusText = document.getElementById("contact-status");

function buildGmailComposeUrl({ sender_name, sender_email, subject, message }) {
  const body = `De : ${sender_name} <${sender_email}>\n\n${message}`;
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: CONTACT_EMAIL,
    su: `[Portfolio] ${subject}`,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusText.textContent = "Envoi en cours...";
  statusText.className = "status";

  const payload = {
    sender_name: form.sender_name.value.trim(),
    sender_email: form.sender_email.value.trim(),
    subject: form.subject.value.trim(),
    message: form.message.value.trim(),
  };

  window.open(buildGmailComposeUrl(payload), "_blank", "noopener");

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Erreur d'envoi");
    }

    form.reset();
    statusText.textContent = "Message enregistré. Envoyez-le depuis la fenêtre Gmail qui vient de s'ouvrir.";
    statusText.className = "status success";
  } catch (error) {
    statusText.textContent = error.message;
    statusText.className = "status error";
  }
});
