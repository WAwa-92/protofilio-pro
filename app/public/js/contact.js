const form = document.getElementById("contact-form");
const statusText = document.getElementById("contact-status");

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
    statusText.textContent = "Message envoyé avec succès.";
    statusText.className = "status success";
  } catch (error) {
    statusText.textContent = error.message;
    statusText.className = "status error";
  }
});
