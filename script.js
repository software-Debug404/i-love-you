(() => {
  "use strict";

  // Edite somente estas duas constantes caso o horário do encontro mude.
  const START_AT = new Date("2026-10-08T00:00:00-03:00").getTime();
  const MEETING_AT = new Date("2026-10-16T00:00:00-03:00").getTime();

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  const root = document.documentElement;
  const body = document.body;
  const distanceMessage = document.querySelector("#distanceMessage");
  const screenReaderCount = document.querySelector("#screenReaderCount");
  const progressStory = document.querySelector(".progress-story");
  const travelScene = document.querySelector("#travelScene");
  const hyagoPortrait = document.querySelector(".portrait--hyago");
  const hyagoPhoto = document.querySelector(".portrait--hyago .portrait__photo");
  const letterDialog = document.querySelector("#letterDialog");
  const closeLetterButton = document.querySelector("#closeLetter");
  const openLetterButton = document.querySelector("#openLetter");
  const celebrationLayer = document.querySelector("#celebrationLayer");
  const soundButton = document.querySelector("#soundButton");
  const soundtrack = document.querySelector("#soundtrack");
  const countElements = {
    days: document.querySelector("#days"),
    hours: document.querySelector("#hours"),
    minutes: document.querySelector("#minutes"),
    seconds: document.querySelector("#seconds"),
  };

  const messages = {
    hyago: [
      "Ana, você faz qualquer espera valer a pena.",
      "Estou contando os segundos para ver você.",
      "Tem um abraço meu guardado para você.",
      "Meu lugar favorito vai ser pertinho de você.",
    ],
    ana: [
      "Esse sorriso é o meu destino favorito.",
      "Você deixa outubro muito mais bonito.",
      "A melhor parte da espera é saber que no fim tem você.",
      "Bonita assim, até o tempo para um pouquinho.",
    ],
  };

  const messageIndexes = { hyago: 0, ana: 0 };
  const noteTimers = new WeakMap();
  let hasCelebrated = false;
  let hasAutoOpenedLetter = false;
  let lastAnnouncedHour = null;
  let countdownTimer = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function mix(start, end, amount) {
    return Math.round(start + (end - start) * amount);
  }

  function colorBetween(cold, warm, amount) {
    return `rgb(${mix(cold[0], warm[0], amount)}, ${mix(cold[1], warm[1], amount)}, ${mix(cold[2], warm[2], amount)})`;
  }

  function setNumber(element, value) {
    const nextValue = String(value).padStart(2, "0");
    if (element.textContent === nextValue) return;

    element.textContent = nextValue;
    element.classList.remove("tick");
    void element.offsetWidth;
    element.classList.add("tick");
  }

  function getMilestone(remaining, days, hours) {
    if (remaining <= 0) return "Chegou o nosso dia, Ana. Agora é abraço de verdade. ♥";
    if (remaining <= HOUR) return "Falta tão pouco para o nosso abraço.";
    if (remaining <= DAY) return "É amanhã. Meu coração já chegou primeiro.";
    if (days <= 2) return "Quase lá… já consigo imaginar o seu sorriso.";
    if (days <= 4) return "Mais da metade do caminho. Vem, dia 16!";
    if (days <= 7) return "A distância já está ficando menor.";
    return "Cada dia leva o Hyago um pouco mais perto da Ana.";
  }

  function updateVisualProgress(progress) {
    const easedProgress = 1 - Math.pow(1 - progress, 1.25);
    const sceneWidth = Math.max(travelScene.clientWidth, 1);
    const portraitWidth = Math.max(hyagoPortrait.offsetWidth, 106);
    const edgePosition = clamp(((portraitWidth / 2 + 8) / sceneWidth) * 100, 13, 22);
    const finalGap = Math.max(hyagoPhoto.offsetWidth, 94);
    const finalGapPercent = (finalGap / sceneWidth) * 100;
    const finalLeft = 50 - finalGapPercent / 2;
    const finalRight = 50 + finalGapPercent / 2;
    const leftPosition = edgePosition + (finalLeft - edgePosition) * easedProgress;
    const rightPosition = 100 - edgePosition + (finalRight - (100 - edgePosition)) * easedProgress;
    const pathWidth = rightPosition - leftPosition;

    root.style.setProperty("--meet-progress", easedProgress.toFixed(5));
    root.style.setProperty("--meet-progress-percent", `${(easedProgress * 100).toFixed(3)}%`);
    root.style.setProperty("--left-x", `${leftPosition.toFixed(3)}%`);
    root.style.setProperty("--right-x", `${rightPosition.toFixed(3)}%`);
    root.style.setProperty("--path-left", `${leftPosition.toFixed(3)}%`);
    root.style.setProperty("--path-width", `${pathWidth.toFixed(3)}%`);

    const warmth = clamp(progress * 1.08, 0, 1);
    root.style.setProperty("--bg-a", colorBetween([18, 27, 68], [67, 25, 54], warmth));
    root.style.setProperty("--bg-b", colorBetween([48, 31, 94], [121, 41, 75], warmth));
    root.style.setProperty("--bg-c", colorBetween([65, 39, 103], [169, 73, 83], warmth));
  }

  function openLetter() {
    if (letterDialog.open) return;

    if (typeof letterDialog.showModal === "function") {
      letterDialog.showModal();
    } else {
      letterDialog.setAttribute("open", "");
    }
  }

  function closeLetter() {
    if (typeof letterDialog.close === "function" && letterDialog.open) {
      letterDialog.close();
    } else {
      letterDialog.removeAttribute("open");
    }
  }

  function createCelebration() {
    if (celebrationLayer.childElementCount) return;

    const colors = ["#ff668e", "#ffbd8c", "#ffd789", "#f7a7c0", "#ffffff", "#c7afff"];
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < 46; index += 1) {
      const heart = document.createElement("i");
      heart.className = index % 4 === 0 ? "celebration-heart fa-solid fa-star" : "celebration-heart fa-solid fa-heart";
      heart.style.setProperty("--x", `${Math.random() * 100}%`);
      heart.style.setProperty("--size", `${9 + Math.random() * 18}px`);
      heart.style.setProperty("--delay", `${Math.random() * 2.7}s`);
      heart.style.setProperty("--fall", `${4.2 + Math.random() * 3.6}s`);
      heart.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
      heart.style.setProperty("--spin", `${-220 + Math.random() * 440}deg`);
      heart.style.setProperty("--color", colors[index % colors.length]);
      fragment.appendChild(heart);
    }

    celebrationLayer.appendChild(fragment);
    window.setTimeout(() => celebrationLayer.replaceChildren(), 11500);
  }

  function celebrate({ open = true } = {}) {
    if (!hasCelebrated) {
      hasCelebrated = true;
      body.classList.add("is-together");
      createCelebration();
    }

    if (open) openLetter();
  }

  function updateCountdown() {
    const now = Date.now();
    const remaining = Math.max(0, MEETING_AT - now);
    const wholeDays = Math.floor(remaining / DAY);
    const hours = Math.floor((remaining % DAY) / HOUR);
    const minutes = Math.floor((remaining % HOUR) / MINUTE);
    const seconds = Math.floor((remaining % MINUTE) / SECOND);
    const totalJourney = MEETING_AT - START_AT;
    const progress = clamp((now - START_AT) / totalJourney, 0, 1);

    setNumber(countElements.days, wholeDays);
    setNumber(countElements.hours, hours);
    setNumber(countElements.minutes, minutes);
    setNumber(countElements.seconds, seconds);
    updateVisualProgress(progress);

    const nextMessage = getMilestone(remaining, wholeDays, hours);
    if (distanceMessage.textContent !== nextMessage) distanceMessage.textContent = nextMessage;
    body.classList.toggle("is-almost-there", remaining > 0 && remaining <= DAY);

    const percentComplete = Math.round(progress * 100);
    progressStory.setAttribute("aria-valuenow", String(percentComplete));
    progressStory.setAttribute("aria-valuetext", `${percentComplete}% do caminho até 16 de outubro`);

    const totalHours = Math.floor(remaining / HOUR);
    if (lastAnnouncedHour !== totalHours) {
      lastAnnouncedHour = totalHours;
      const label = (value, singular, plural) => `${value} ${value === 1 ? singular : plural}`;
      screenReaderCount.textContent = remaining > 0
        ? `Faltam ${label(wholeDays, "dia", "dias")}, ${label(hours, "hora", "horas")} e ${label(minutes, "minuto", "minutos")} para o dia 16.`
        : "O dia do encontro chegou.";
    }

    if (remaining <= 0) {
      let alreadyOpened = false;
      try {
        alreadyOpened = sessionStorage.getItem("our-day-letter-opened") === "yes";
      } catch (_error) {
        // A experiência continua normalmente quando o armazenamento está bloqueado.
      }

      const shouldOpenLetter = !alreadyOpened && !hasAutoOpenedLetter;
      celebrate({ open: shouldOpenLetter });
      hasAutoOpenedLetter = true;

      try {
        sessionStorage.setItem("our-day-letter-opened", "yes");
      } catch (_error) {
        // Sem persistência, a carta apenas abrirá de novo no próximo carregamento.
      }

      if (countdownTimer) {
        window.clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }
  }

  function setupPortraitMessages() {
    document.querySelectorAll(".portrait").forEach((portrait) => {
      portrait.addEventListener("click", () => {
        const person = portrait.dataset.person;
        const note = portrait.querySelector(".love-note");
        const options = messages[person];
        note.textContent = options[messageIndexes[person] % options.length];
        messageIndexes[person] += 1;

        document.querySelectorAll(".portrait.has-message").forEach((item) => {
          if (item !== portrait) item.classList.remove("has-message");
        });

        portrait.classList.remove("has-message");
        void portrait.offsetWidth;
        portrait.classList.add("has-message");

        if (noteTimers.has(portrait)) window.clearTimeout(noteTimers.get(portrait));
        noteTimers.set(
          portrait,
          window.setTimeout(() => {
            portrait.classList.remove("has-message");
            note.textContent = "";
          }, 6200),
        );
      });
    });
  }

  function createAmbientHearts() {
    const container = document.querySelector("#floatingHearts");
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < 16; index += 1) {
      const heart = document.createElement("i");
      heart.className = "floating-heart fa-solid fa-heart";
      heart.style.setProperty("--x", `${3 + Math.random() * 94}%`);
      heart.style.setProperty("--size", `${6 + Math.random() * 10}px`);
      heart.style.setProperty("--opacity", `${0.09 + Math.random() * 0.18}`);
      heart.style.setProperty("--duration", `${13 + Math.random() * 13}s`);
      heart.style.setProperty("--delay", `${-Math.random() * 20}s`);
      heart.style.setProperty("--drift", `${-55 + Math.random() * 110}px`);
      fragment.appendChild(heart);
    }

    container.appendChild(fragment);
  }

  function setupLetter() {
    closeLetterButton.addEventListener("click", closeLetter);
    openLetterButton.addEventListener("click", openLetter);
    letterDialog.addEventListener("click", (event) => {
      if (event.target === letterDialog) closeLetter();
    });
  }

  function setupSoundtrack() {
    const songName = "Te Assumi Pro Brasil (Ao Vivo)";
    const soundIcon = soundButton.querySelector("i");
    const soundText = soundButton.querySelector(".sound-button__text");

    soundtrack.volume = 0.35;

    function updateSoundButton(isPlaying) {
      soundButton.setAttribute("aria-pressed", String(isPlaying));
      soundButton.setAttribute("aria-label", isPlaying ? `Pausar ${songName}` : `Tocar ${songName}`);
      soundIcon.className = isPlaying
        ? "fa-solid fa-volume-high"
        : "fa-solid fa-music";
      soundText.textContent = isPlaying ? "Tocando" : "Nossa música";
      soundButton.removeAttribute("aria-busy");
      soundButton.disabled = false;
    }

    soundButton.addEventListener("click", async () => {
      if (!soundtrack.paused) {
        soundtrack.pause();
        return;
      }

      soundButton.disabled = true;
      soundButton.setAttribute("aria-busy", "true");
      soundButton.setAttribute("aria-label", `Carregando ${songName}`);
      soundText.textContent = "Carregando…";

      try {
        await soundtrack.play();
      } catch (_error) {
        soundButton.setAttribute("aria-pressed", "false");
        soundButton.setAttribute("aria-label", `Não foi possível tocar ${songName}`);
        soundButton.removeAttribute("aria-busy");
        soundButton.disabled = false;
        soundIcon.className = "fa-solid fa-triangle-exclamation";
        soundText.textContent = "Tente de novo";
      }
    });

    soundtrack.addEventListener("playing", () => updateSoundButton(true));
    soundtrack.addEventListener("pause", () => updateSoundButton(false));
    soundtrack.addEventListener("waiting", () => {
      if (soundtrack.paused) return;
      soundButton.setAttribute("aria-busy", "true");
      soundText.textContent = "Carregando…";
    });
    soundtrack.addEventListener("error", () => {
      soundButton.setAttribute("aria-pressed", "false");
      soundButton.setAttribute("aria-label", `Áudio indisponível: ${songName}`);
      soundButton.removeAttribute("aria-busy");
      soundButton.disabled = true;
      soundIcon.className = "fa-solid fa-triangle-exclamation";
      soundText.textContent = "Indisponível";
    });
  }

  createAmbientHearts();
  setupPortraitMessages();
  setupLetter();
  setupSoundtrack();
  updateCountdown();
  if (!hasCelebrated) countdownTimer = window.setInterval(updateCountdown, SECOND);

  let resizeFrame = null;
  window.addEventListener("resize", () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(updateCountdown);
  }, { passive: true });

  // Pequeno atalho para visualizar o estado final pelo console durante a manutenção.
  window.loveStory = Object.freeze({ celebrate });
})();
