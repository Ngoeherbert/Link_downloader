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

  try {
    const response = await fetch("http://localhost:5000/api/get-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlInput }),
    });

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

     // Config: Using target size from your data or a dummy 124.8MB
     const targetSize = 124.8;
     let currentSize = 0;

     btnText.innerText = "Initializing Protocol";
     btnProgress.style.width = "10%";
     await new Promise((r) => setTimeout(r, 800));

     // 2. The Jitter Stream Simulation
     const incrementStream = () => {
       return new Promise((resolve) => {
         const interval = setInterval(() => {
           // Randomly simulate packet delay (15% chance of stutter)
           if (Math.random() < 0.15) {
             btnText.innerText = "Packet Jitter Detected...";
             btnTelemetry.classList.add("animate-pulse", "text-red-400");
             return; // Skip this increment cycle
           }

           btnText.innerText = "Extracting Packets";
           btnTelemetry.classList.remove("animate-pulse", "text-red-400");

           currentSize += Math.random() * 12; // Normal chunk size

           if (currentSize >= targetSize) {
             currentSize = targetSize;
             clearInterval(interval);
             resolve();
           }

           // Update UI
           btnTelemetry.innerText = `${currentSize.toFixed(1)}mb / ${targetSize}mb`;
           const percent = (currentSize / targetSize) * 90;
           btnProgress.style.width = `${percent}%`;
         }, 150); // Slightly slower refresh for better readability
       });
     };

     await incrementStream();

     // 3. Finalizing Sequence
     btnText.innerText = "Reassembling Buffers";
     btnProgress.style.width = "100%";
     btnIcon.className = "fas fa-check text-xs text-emerald-500";

     await new Promise((r) => setTimeout(r, 600));

     // Trigger Download (ensure variables are in scope)
     const formatId = document.getElementById("qualitySelect").value;
     const downloadUrl = `http://localhost:5000/api/download?url=${encodeURIComponent(urlInput)}&title=${encodeURIComponent(data.title)}&formatId=${formatId}`;
     window.location.href = downloadUrl;

     // 4. Clean Reset
     setTimeout(() => {
       btn.disabled = false;
       btn.classList.replace("text-white", "text-black");
       btn.classList.remove("bg-zinc-900");
       btnTelemetry.classList.add("hidden", "text-red-400");
       btnProgress.style.width = "0%";
       btnText.innerText = "Execute Extraction";
       btnIcon.className = "fas fa-arrow-down-to-bracket text-xs text-inherit";
     }, 4000);
   };

    // Reveal Results
    resultDiv.classList.remove("hidden");
    showToast("EXTRACTION SUCCESSFUL: MEDIA NODE LOADED", "success");
  } catch (err) {
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
  const toast = document.createElement("div");
  
  // Dynamic Styling based on type
  const isError = type === "error";
  const borderColor = isError ? "border-red-500/50" : "border-emerald-500/50";
  const textColor = isError ? "text-red-500" : "text-emerald-500";
  const icon = isError ? "fa-triangle-exclamation" : "fa-circle-check";

  toast.className = `flex items-center gap-4 px-6 py-4 bg-black/80 backdrop-blur-2xl border ${borderColor} rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-toast-in`;
  
  toast.innerHTML = `
    <i class="fas ${icon} ${textColor} text-lg"></i>
    <div class="flex flex-col">
      <span class="text-[8px] font-black uppercase tracking-[0.3em] opacity-50">${type === 'error' ? 'System Warning' : 'System Notice'}</span>
      <span class="${textColor} text-[10px] font-black uppercase tracking-widest">${message}</span>
    </div>
  `;

  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.add("animate-toast-out");
    setTimeout(() => toast.remove(), 500);
  }, 4000);
}

window.addEventListener("scroll", () => {
  const btt = document.getElementById("backToTop");
  if (window.scrollY > 500) {
    btt.classList.add("visible");
  } else {
    btt.classList.remove("visible");
  }
});



const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section[id], div[id]");

const options = {
  root: null,
  threshold: 0.6, // Trigger when 60% of the section is visible
  rootMargin: "-10% 0px -40% 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute("id");

      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${id}`) {
          link.classList.add("active");
        }
      });
    }
  });
}, options);

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", function () {
    document
      .querySelectorAll(".nav-link")
      .forEach((l) => l.classList.remove("active"));
    this.classList.add("active");
  });
});

sections.forEach((section) => observer.observe(section));



function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  const icon = document.getElementById("menu-icon");

  const isHidden = menu.classList.toggle("hidden");

  // Switch icon between bars and X
  if (isHidden) {
    icon.classList.replace("fa-xmark", "fa-bars-staggered");
  } else {
    icon.classList.replace("fa-bars-staggered", "fa-xmark");
  }
}

// active nav-link mobile view
function handleNavLinkClick(element) {
  // 1. Find all chevron icons in the mobile menu
  const allIcons = document.querySelectorAll("#mobile-menu i.fas");

  // 2. Reset all icons to the inactive color (slate)
  allIcons.forEach((icon) => {
    icon.classList.remove("text-red-500");
    icon.classList.add("text-slate-600");
  });

  // 3. Find the specific icon inside the clicked link and make it red
  const activeIcon = element.querySelector("i");
  activeIcon.classList.remove("text-slate-600");
  activeIcon.classList.add("text-red-500");

  // 4. Optional: Close menu after selection
  if (typeof toggleMobileMenu === "function") {
    toggleMobileMenu();
  }
}
