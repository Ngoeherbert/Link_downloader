const BASE_URL = "https://link-downloader-backend.onrender.com";

async function fetchVideo() {
  const urlInput = document.getElementById("videoUrl").value.trim();
  const resultDiv = document.getElementById("result");
  const loadingOverlay = document.getElementById("loading");
  const qualitySelect = document.getElementById("qualitySelect");

  if (!urlInput) {
    return showToast("INPUT REQUIRED: Paste source protocol URL", "error");
  }

  // UI Feedback: Show Loader
  loadingOverlay.classList.remove("hidden");
  resultDiv.classList.add("hidden");

  // Cold Start Detection: Render Free Tier wakes up in ~30-50s
  const wakeUpCall = setTimeout(() => {
    showToast("WAKING UP SERVER: Handshake in progress...", "success");
  }, 4500);

  try {
    const response = await fetch(`${BASE_URL}/api/get-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlInput }),
    });

    clearTimeout(wakeUpCall);

    if (!response.ok)
      throw new Error(`PROTOCOL TIMEOUT: SERVER ${response.status}`);

    const data = await response.json();
    if (data.error) {
      showToast(data.error);
      return;
    }

    // Update Thumb & Title
    document.getElementById("thumb").src = data.thumbnail;
    document.getElementById("title").innerText = data.title;
    document.getElementById("durationTag").innerText = data.duration;

    // Populate Resolution Dropdown
    qualitySelect.innerHTML = "";
    data.formats.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.innerText = `${f.resolution} - ${f.filesize}`;
      qualitySelect.appendChild(opt);
    });

    // Set up Download Logic
    document.getElementById("downloadBtn").onclick = async function (e) {
      e.preventDefault();

      const btn = this;
      const btnText = document.getElementById("btnText");
      const btnProgress = document.getElementById("btnProgress");
      const btnTelemetry = document.getElementById("btnTelemetry");
      const btnIcon = document.getElementById("btnIcon");

      // 1. Enter Loading State
      btn.disabled = true;
      btn.classList.replace("text-black", "text-white");
      btn.classList.add("bg-zinc-900");
      btnTelemetry.classList.remove("hidden");
      btnIcon.className = "fas fa-sync fa-spin text-xs";

      const targetSize = 100; // Simulated progress base
      let currentSize = 0;

      btnText.innerText = "Initializing Protocol";
      btnProgress.style.width = "10%";
      await new Promise((r) => setTimeout(r, 800));

      // 2. The Jitter Stream Simulation
      const incrementStream = () => {
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            if (Math.random() < 0.15) {
              btnText.innerText = "Packet Jitter Detected...";
              btnTelemetry.classList.add("animate-pulse", "text-red-400");
              return;
            }

            btnText.innerText = "Extracting Packets";
            btnTelemetry.classList.remove("animate-pulse", "text-red-400");

            currentSize += Math.random() * 12;

            if (currentSize >= targetSize) {
              currentSize = targetSize;
              clearInterval(interval);
              resolve();
            }

            btnTelemetry.innerText = `${currentSize.toFixed(1)}mb / EST. SIZE`;
            const percent = (currentSize / targetSize) * 90;
            btnProgress.style.width = `${percent}%`;
          }, 150);
        });
      };

      await incrementStream();

      // 3. Finalizing Sequence
      btnText.innerText = "Reassembling Buffers";
      btnProgress.style.width = "100%";
      btnIcon.className = "fas fa-check text-xs text-emerald-500";

      await new Promise((r) => setTimeout(r, 600));

      // 4. Trigger REAL Download (Clean way for 2026 browsers)
      const formatId = qualitySelect.value;
      const downloadUrl = `${BASE_URL}/api/download?url=${encodeURIComponent(urlInput)}&title=${encodeURIComponent(data.title)}&formatId=${formatId}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.target = "_blank"; // Prevents disrupting the current page
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 5. Clean Reset
      setTimeout(() => {
        btn.disabled = false;
        btn.classList.replace("text-white", "text-black");
        btn.classList.remove("bg-zinc-900");
        btnTelemetry.classList.add("hidden");
        btnProgress.style.width = "0%";
        btnText.innerText = "Execute Extraction";
        btnIcon.className = "fas fa-arrow-down-to-bracket text-xs text-inherit";
      }, 4000);
    };

    // Reveal Results
    resultDiv.classList.remove("hidden");
    showToast("EXTRACTION SUCCESSFUL: MEDIA NODE LOADED", "success");
  } catch (err) {
    clearTimeout(wakeUpCall);
    showToast(`CRITICAL ERROR: ${err.message}`, "error");
  } finally {
    loadingOverlay.classList.add("hidden");
  }
}

/**
 * Modern Toast System
 */
function showToast(message, type = "error") {
  const container = document.getElementById("toast-container");
  if (!container) return; // Guard clause

  const toast = document.createElement("div");
  const isError = type === "error";
  const borderColor = isError ? "border-red-500/50" : "border-emerald-500/50";
  const textColor = isError ? "text-red-500" : "text-emerald-500";
  const icon = isError ? "fa-triangle-exclamation" : "fa-circle-check";

  toast.className = `flex items-center gap-4 px-6 py-4 bg-black/80 backdrop-blur-2xl border ${borderColor} rounded-2xl shadow-2xl animate-toast-in`;

  toast.innerHTML = `
    <i class="fas ${icon} ${textColor} text-lg"></i>
    <div class="flex flex-col">
      <span class="text-[8px] font-black uppercase tracking-[0.3em] opacity-50">${isError ? "System Warning" : "System Notice"}</span>
      <span class="${textColor} text-[10px] font-black uppercase tracking-widest">${message}</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("animate-toast-out");
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

// Navigation and Scroll Logic
window.addEventListener("scroll", () => {
  const btt = document.getElementById("backToTop");
  if (btt) {
    window.scrollY > 500
      ? btt.classList.add("visible")
      : btt.classList.remove("visible");
  }
});

const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section[id], div[id]");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${id}`,
          );
        });
      }
    });
  },
  { threshold: 0.6, rootMargin: "-10% 0px -40% 0px" },
);

sections.forEach((section) => observer.observe(section));

function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const icon = document.getElementById("menu-icon");
  const isHidden = menu.classList.toggle("hidden");
  icon.classList.replace(
    isHidden ? "fa-xmark" : "fa-bars-staggered",
    isHidden ? "fa-bars-staggered" : "fa-xmark",
  );
}

function handleNavLinkClick(element) {
  const allIcons = document.querySelectorAll("#mobile-menu i.fas");
  allIcons.forEach((icon) =>
    icon.classList.replace("text-red-500", "text-slate-600"),
  );

  const activeIcon = element.querySelector("i");
  if (activeIcon)
    activeIcon.classList.replace("text-slate-600", "text-red-500");

  toggleMobileMenu();
}
