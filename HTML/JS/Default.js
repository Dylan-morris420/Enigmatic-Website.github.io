document.addEventListener("DOMContentLoaded", () => {
  // --- Title and Page Name ---
  const fullFileName = decodeURIComponent(window.location.pathname.split("/").pop());
  const pageName = fullFileName.split(".")[0] || "home";
  document.title = `Enigmatic Website – ${pageName}`;
  document.querySelectorAll(".page-name").forEach(el => el.textContent = pageName);

  // --- Dropdown Click ---
  document.querySelectorAll(".dropdown-btn").forEach(btn => {
    const arrow = btn.querySelector(".arrow");
    const content = btn.nextElementSibling;
    btn.addEventListener("click", () => {
      const isOpen = content.classList.contains("show");
      content.classList.toggle("show");
      if (arrow) arrow.textContent = isOpen ? "▼" : "▲";
    });
  });

  // --- Dropdown Hover ---
  const sidebar = document.querySelector(".sidebar");
  document.querySelectorAll(".dropdown-h").forEach(dropdownH => {
    const contentH = dropdownH.querySelector(".dropdown-content");
    const btnH = dropdownH.querySelector(".dropdown-btn-h");
    const originalTextH = btnH ? btnH.textContent.replace(/[▲▼]$/, '').trim() : '';
    if (btnH) btnH.textContent = originalTextH + " ▼";

    dropdownH.addEventListener("mouseenter", () => {
      if (contentH) {
        contentH.classList.add("show");
        if (btnH) btnH.textContent = originalTextH + " ▲";
      }
    });

    if (sidebar) {
      sidebar.addEventListener("mouseleave", () => {
        if (contentH) contentH.classList.remove("show");
        if (btnH) btnH.textContent = originalTextH + " ▼";
      });
    }
  });

  // --- Last Modified Display ---
  const display = document.getElementById("last-modified");
  if (display) display.textContent = `Last updated: ${document.lastModified}`;

  // --- Back to Top Button ---
  const mybutton = document.getElementById("myBtn");
  window.onscroll = () => {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
      mybutton?.classList.add("show");
    } else {
      mybutton?.classList.remove("show");
    }
  };

  // --- Sidebar Toggle ---
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
  const headerText = document.querySelector('.header h2');
  const footerText = document.querySelector('.footer *');
  if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
      const sidebarIsHidden = sidebar.classList.toggle('hidden');
      document.body.classList.toggle('sidebar-hidden');
      [headerText, footerText].forEach(el => {
        if (!el) return;
        el.classList.remove('animate-indent', 'animate-indent-back');
        void el.offsetWidth;
        el.classList.add(sidebarIsHidden ? 'animate-indent-back' : 'animate-indent');
      });
    });
  }

  // --- Music Setup ---
  const musicFile = window.pageMusicFile || null;
  if (!musicFile) {
    console.warn("No music file specified for this page.");
    return;
  }

  const audio = new Audio(`/Enigmatic-Website/MEDIA/${musicFile}`);
  const toggleMusicBtn = document.getElementById("toggleMusicBtn");
  const storageKey = `audioPos:${pageName}`;
  let isMuted = localStorage.getItem("musicMuted") === "true";

  audio.loop = true;
  audio.volume = isMuted ? 0 : 0.5;
  audio.muted = false;

  const savedPosition = parseFloat(localStorage.getItem(storageKey));
  if (!isNaN(savedPosition)) {
    audio.currentTime = savedPosition;
  }

  if (!isMuted) {
    audio.play().catch(() => {});
  }

  audio.addEventListener("timeupdate", () => {
    const now = Date.now();
    if (!audio._lastSaved || now - audio._lastSaved > 1000) {
      localStorage.setItem(storageKey, audio.currentTime);
      audio._lastSaved = now;
    }
  });

  window.addEventListener("beforeunload", () => {
    localStorage.setItem(storageKey, audio.currentTime);
  });

  // --- Music Toggle Button ---
  function fadeVolume(targetVolume, duration = 400, onComplete) {
    const stepTime = 50;
    const steps = duration / stepTime;
    const volumeDiff = targetVolume - audio.volume;
    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(0, Math.min(1, audio.volume + volumeDiff / steps));
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        audio.volume = targetVolume;
        if (onComplete) onComplete();
      }
    }, stepTime);
  }

  if (toggleMusicBtn) {
    toggleMusicBtn.textContent = isMuted ? "🔇" : "🔊";
    toggleMusicBtn.addEventListener("click", () => {
      isMuted = !isMuted;
      localStorage.setItem("musicMuted", isMuted);
      toggleMusicBtn.textContent = isMuted ? "🔇" : "🔊";

      if (isMuted) {
        fadeVolume(0, 400, () => audio.pause());
      } else {
        audio.play().then(() => fadeVolume(0.3));
      }
    });
  }

  // --- Audio Guide Modal ---
  const modal = document.getElementById("audioGuideModal");
  if (!localStorage.getItem("audioGuideDismissed") && modal) {
    modal.style.display = "flex";
  }

  let audioStarted = false;
  let audioCtx;

  function startAudio() {
    if (audioStarted || isMuted) return;
    audioStarted = true;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = document.getElementById("music-visualizer");
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;
    const baseRadius = 45;
    const angleStep = (3 * Math.PI) / bufferLength;

    function renderFrame() {
      requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const angle = i * angleStep;
        const barLength = value * 0.35;
        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + barLength);
        const y2 = centerY + Math.sin(angle) * (baseRadius + barLength);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `hsl(${(i / bufferLength) * 360}, 100%, 50%)`;
        ctx.lineWidth = 6;
        ctx.stroke();
      }
    }

    audioCtx.resume().then(() => {
      audio.play().catch(e => console.warn("Playback failed after interaction:", e));
      renderFrame();
    });
  }

  startAudio(); // Direct call


  // --- Dark Mode ---
  const darkModeBtn = document.getElementById("toggleDarkModeBtn");
  const content = document.querySelector(".content");
  const bg = document.querySelector(".background");

  function applyDarkMode(isDark) {
    content?.classList.toggle("dark-mode", isDark);
    bg?.classList.toggle("dark-mode", isDark);
    localStorage.setItem("contentDarkMode", isDark);
    if (darkModeBtn) darkModeBtn.textContent = isDark ? "🌙" : "☀️";
  }

  const isDarkInitial = localStorage.getItem("contentDarkMode") === "true";
  applyDarkMode(isDarkInitial);

  if (darkModeBtn) {
    darkModeBtn.addEventListener("click", () => {
      applyDarkMode(!content?.classList.contains("dark-mode"));
    });
  }
});

// --- Audio Guide Dismiss ---
function dismissAudioGuide(dontAskAgain) {
  const modal = document.getElementById("audioGuideModal");
  if (modal) modal.style.display = "none";
  if (dontAskAgain) {
    localStorage.setItem("audioGuideDismissed", "true");
  }
}

// --- Scroll to Top ---
function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}
