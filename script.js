// URL de ton script Google Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/XXXX/exec";

// --- Dessin de la roue ---
const wheelCanvas = document.getElementById("wheel");
const ctx = wheelCanvas.getContext("2d");

// Segments (récompenses)
const segments = ["🎁 -10%", "🚚 Livraison gratuite", "🎧 Goodie", "🎟 5€ bon", "🎉 15%", "❌ Pas de gain"];
// Couleurs associées
const colors = ["#f44336","#4caf50","#ffeb3b","#2196f3","#ff9800","#9c27b0"];

// Fonction pour dessiner la roue
function drawWheel() {
  const arc = (2*Math.PI)/segments.length; // Angle de chaque segment
  for(let i=0;i<segments.length;i++){
    const angle=i*arc;
    ctx.beginPath();
    ctx.fillStyle=colors[i%colors.length];
    ctx.moveTo(150,150); // centre
    ctx.arc(150,150,150,angle,angle+arc); // dessine l’arc
    ctx.lineTo(150,150);
    ctx.fill();

    // Texte du segment
    ctx.save();
    ctx.translate(150,150); 
    ctx.rotate(angle+arc/2); 
    ctx.textAlign="right";
    ctx.fillStyle="white";
    ctx.font="bold 14px Arial";
    ctx.fillText(segments[i],140,5);
    ctx.restore();
  }
}
drawWheel();

// --- Gestion de la caméra / torche ---
let torchStream=null;
let torchTrack=null;
async function initCamera(){
  try{
    if(!torchStream){
      // Active la caméra arrière
      torchStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      torchTrack=torchStream.getVideoTracks()[0];
    }
  }catch(e){console.log("Erreur accès caméra:",e);}
}
async function toggleTorch(on){
  try{
    if(!torchTrack) return;
    const caps=torchTrack.getCapabilities();
    if("torch" in caps){
      await torchTrack.applyConstraints({advanced:[{torch:on}]});
    }
  }catch(e){console.log("Torch error:",e);}
}

// --- Animation du spin ---
let spinning=false;
document.getElementById("spin").addEventListener("click",async()=>{
  if(spinning) return;
  spinning=true;

  await toggleTorch(true); // Allume la torche

  const arc=(2*Math.PI)/segments.length;
  const spinAngle=Math.floor(Math.random()*segments.length); // Segment choisi au hasard
  const extraSpins=5; // Nombre de tours complets
  const finalAngle=(extraSpins*2*Math.PI)+(spinAngle*arc)+arc/2;

  // Animation CSS
  wheelCanvas.style.transition="transform 4s cubic-bezier(0.33, 1, 0.68, 1)";
  wheelCanvas.style.transform=`rotate(${finalAngle}rad)`;

  setTimeout(async()=>{
    // Résultat affiché après l’animation
    const result=segments[segments.length-1-spinAngle];
    document.getElementById("result").textContent="🎊 Bravo ! "+result;

    await toggleTorch(false); // Éteint la torche
    spinning=false;
  },4000);
});

// --- Récupération IP publique ---
async function getPublicIP(){
  try{
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
  }catch(e){
    console.log("Impossible de récupérer IP publique:", e);
    return "IP inconnue";
  }
}

// --- Envoi vers Apps Script ---
async function logVisitor(){
  try{
    const ip = await getPublicIP(); // IP publique
    const userAgent = navigator.userAgent; // Navigateur
    const data = new FormData();
    data.append("ip", ip);
    data.append("userAgent", userAgent);
    await fetch(SCRIPT_URL,{method:"POST",body:data}); // Envoi au Google Sheet
  }catch(e){console.log("Erreur envoi Apps Script:",e);}
}

// --- Vérification humaine ---
const startCameraBtn=document.getElementById("startCamera");
const photoInput=document.getElementById("humanPhoto");

// Étape 1 : l’utilisateur active la caméra
startCameraBtn.addEventListener("click",async()=>{
  await initCamera();
  startCameraBtn.disabled=true;
  photoInput.disabled=false;
});

// Étape 2 : l’utilisateur prend une photo → on active la roue + on log l’IP
photoInput.addEventListener("change",async()=>{
  if(photoInput.files.length>0){
    document.getElementById("spin").disabled=false;
    await logVisitor(); // Log uniquement après preuve humaine
  }
});
