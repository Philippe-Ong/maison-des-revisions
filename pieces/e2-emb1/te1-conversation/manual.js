/* Reprise des visuels de la conversation : navigation et commandes locales. */
(() => {
  "use strict";
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const chapters = $$(".manual-chapter");
  const tabs = $$(".manual-tabs a");
  const normal = (s) => s.replace(/\s+/g, " ").trim();
  function showChapter(id, scroll = false) {
    if (!chapters.some(c => c.id === id)) id = chapters[0].id;
    chapters.forEach(c => c.hidden = c.id !== id);
    $$(".manual-toc ol").forEach(t => t.hidden = t.dataset.chapter !== id);
    tabs.forEach(t => t.setAttribute("aria-current", t.hash === "#" + id ? "page" : "false"));
    if (scroll) $(".manual-tabs").scrollIntoView({block: "start"});
  }
  function followHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return showChapter(chapters[0].id);
    const chapter = target.closest(".manual-chapter");
    if (chapter) {
      showChapter(chapter.id);
      requestAnimationFrame(() => target.scrollIntoView({block: "start"}));
    }
  }
  tabs.forEach(a => a.addEventListener("click", () => showChapter(a.hash.slice(1), true)));
  window.addEventListener("hashchange", followHash);
  if (location.hash) followHash(); else showChapter(chapters[0].id);
  const toc = $(".manual-toc");
  if (innerWidth < 1051) toc.open = false;
  const key = "E2-EMB1/fifo-lifo-uart";
  const checks = $$("input[data-section]");
  function progress() {
    let n = 0;
    checks.forEach(c => {
      try { c.checked = localStorage.getItem(`maison:${key}:${c.dataset.section}`) === "1"; } catch {}
      if (c.checked) n++;
    });
    $("[data-progression-texte]").textContent = `${n} / ${checks.length} sections révisées`;
  }
  checks.forEach(c => c.addEventListener("change", () => {
    try { if (c.checked) localStorage.setItem(`maison:${key}:${c.dataset.section}`, "1");
      else localStorage.removeItem(`maison:${key}:${c.dataset.section}`); } catch {}
    progress();
  }));
  progress();
  const status = $(".manual-status");
  $$('button[aria-label="Copier"]', $(".manual-layout")).forEach(button => {
    button.addEventListener("click", async () => {
      const block = button.closest('[data-d-component="code_block"]');
      const pre = block?.querySelector("pre");
      if (!pre) return;
      try { await navigator.clipboard.writeText(pre.innerText); status.textContent = "Code copié";
        setTimeout(() => { status.textContent = ""; }, 1700); } catch { status.textContent = "Sélectionne le code pour le copier."; }
    });
  });
  function card(root, phrase) {
    return $$('[data-d-component="box"]', root).filter(b => normal(b.textContent).includes(phrase))
      .sort((a,b) => a.textContent.length - b.textContent.length)[0];
  }
  function paragraphAfter(root, label) {
    const p = $$("p", root).find(p => normal(p.textContent) === label);
    return p?.nextElementSibling;
  }
  // Même tableau de huit cases et mêmes commandes que dans la réponse d'origine.
  const fifo = card($("#chapitre-cours"), "Simulation du buffer « desserts »");
  if (fifo) {
    fifo.dataset.copyWidget = "fifo";
    let mode = "FIFO", step = 0;
    const cells = $$('[data-d-component="grid-item"]', fifo);
    const modeButtons = $$('button[role="radio"]', fifo);
    const previous = $$("button", fifo).find(b => normal(b.textContent) === "Précédent");
    const next = $$("button", fifo).find(b => normal(b.textContent) === "Lire un caractère");
    const slider = $('[role="slider"]', fifo);
    const range = $('[data-d-component="slider"]', fifo);
    const output = $$("h1,h2,h3", fifo).find(h => normal(h.textContent) === "—");
    const count = $$("p", fifo).find(p => normal(p.textContent) === "0 / 8");
    function update() {
      const order = mode === "FIFO" ? "desserts" : "stressed";
      cells.forEach((c,i) => { c.style.opacity = (mode === "FIFO" ? i < step : i >= 8-step) ? ".32" : "1"; });
      if (output) output.textContent = order.slice(0, step) || "—";
      if (count) count.textContent = `${step} / 8`;
      previous.disabled = step === 0; next.disabled = step === 8;
      modeButtons.forEach(b => { const on = b.getAttribute("aria-label") === mode;
        b.setAttribute("aria-checked", String(on)); b.dataset.state = on ? "on" : "off"; });
      if (slider) {
        slider.setAttribute("aria-valuenow", String(step));
        const thumb = slider.parentElement;
        if (thumb) thumb.style.left = `calc(${step / 8 * 100}% + ${10-step*2.5}px)`;
        const filled = range?.querySelector('[style*="right:"]');
        if (filled) filled.style.right = `${100-step/8*100}%`;
      }
    }
    previous.addEventListener("click", () => { step = Math.max(0,step-1); update(); });
    next.addEventListener("click", () => { step = Math.min(8,step+1); update(); });
    modeButtons.forEach(b => b.addEventListener("click", () => { mode = b.getAttribute("aria-label"); step=0; update(); }));
    if (range) range.addEventListener("pointerdown", e => {
      const rect = range.getBoundingClientRect(); step = Math.max(0,Math.min(8,Math.round((e.clientX-rect.left)/rect.width*8))); update();
    });
    if (slider) slider.addEventListener("keydown", e => {
      if (["ArrowLeft","ArrowRight","Home","End"].includes(e.key)) {
        e.preventDefault(); step = e.key === "Home" ? 0 : e.key === "End" ? 8 : Math.max(0,Math.min(8,step+(e.key === "ArrowRight" ? 1 : -1))); update();
      }
    });
    update();
  }
  const interruption = card($("#chapitre-interruptions"), "Simulation de préemption");
  if (interruption) {
    interruption.dataset.copyWidget = "preemption";
    const states = [
      ["0 ms","UART","Aucune","UART commence son traitement de 1 ms. Elle possède la priorité 100."],
      ["0,4 ms","SysTick","UART suspendue","UART est suspendue, SysTick commence."],
      ["0,5 ms","SysTick","ADC et UART","ADC reste en attente, car SysTick est prioritaire."],
      ["2,4 ms","ADC","UART suspendue","SysTick termine. ADC commence."],
      ["3,4 ms","UART","Aucune","ADC termine. UART reprend."],
      ["4,0 ms","main()","Aucune","UART termine. Retour à main()."]
    ];
    let current = 0;
    const buttons = $$("button", interruption);
    const times = buttons.filter(b => /^(0|0,4|0,5|2,4|3,4|4,0) ms$/.test(normal(b.textContent)));
    const back = buttons.find(b => normal(b.textContent) === "Précédent");
    const next = buttons.find(b => normal(b.textContent) === "Suivant");
    const counter = $$("p",interruption).find(p => normal(p.textContent) === "Étape 1/6");
    const description = $$("p",interruption).find(p => p.textContent.includes("UART commence son traitement"));
    const cpu = paragraphAfter(interruption, "CPU exécute");
    const pending = paragraphAfter(interruption, "En attente ou suspendue");
    function update() {
      if(counter)counter.textContent=`Étape ${current+1}/6`;
      if(cpu)cpu.textContent=states[current][1]; if(pending)pending.textContent=states[current][2];
      if(description)description.textContent=states[current][3];
      times.forEach((b,i)=>b.setAttribute("aria-pressed",String(i===current)));
      back.disabled=current===0;next.disabled=current===5;
    }
    times.forEach((b,i)=>b.addEventListener("click",()=>{current=i;update();}));
    back.addEventListener("click",()=>{current=Math.max(0,current-1);update();});
    next.addEventListener("click",()=>{current=Math.min(5,current+1);update();});
    update();
  }
  const callback = card($("#chapitre-callbacks"), "Simulation d'un callback");
  if(callback) {
    callback.dataset.copyWidget="callback";
    let current=0;
    const states=[
      ["Déclaration","Callback_t callback = NULL;","NULL","On crée le pointeur de fonction. Il ne pointe encore vers aucune fonction.","Aucun affichage"],
      ["Enregistrement","HAL_RegisterCallback(LED_On);","LED_On","Cette fonction reçoit une adresse de fonction et l'enregistre.","Aucun affichage"],
      ["Événement","HAL_ButtonPressed();","LED_On","Lorsque l'événement arrive, la HAL regarde si une fonction a été enregistrée.","HAL : bouton detecte"],
      ["Appel","buttonCallback();","LED_On","C'est la fonction définie par l'application. La HAL ne la connaît qu'à travers son adresse.","HAL : bouton detecte\nApplication : LED allumee"]
    ];
    const labels=$$("p",callback);
    const counter=labels.find(p=>normal(p.textContent)==="Étape 1/4");
    const phase=labels.find(p=>normal(p.textContent)==="Déclaration");
    const code=$("code",callback);
    const pointer=labels.find(p=>normal(p.textContent)==="NULL");
    const description=labels.find(p=>p.textContent.includes("On crée le pointeur de fonction."));
    const terminal=labels.find(p=>normal(p.textContent)==="Aucun affichage");
    const back=$$("button",callback).find(b=>normal(b.textContent)==="Précédent");
    const next=$$("button",callback).find(b=>normal(b.textContent)==="Suivant");
    function update(){const s=states[current];if(counter)counter.textContent=`Étape ${current+1}/4`;
      if(phase)phase.textContent=s[0];if(code)code.textContent=s[1];if(pointer)pointer.textContent=s[2];
      if(description)description.textContent=s[3];if(terminal){terminal.textContent=s[4];terminal.style.whiteSpace="pre-line";}
      back.disabled=current===0;next.disabled=current===3;
    }
    back.addEventListener("click",()=>{current=Math.max(0,current-1);update();});next.addEventListener("click",()=>{current=Math.min(3,current+1);update();});update();
  }
  const quiz=card($("#chapitre-interruptions"),"Mini-test : interruptions");
  if(quiz){quiz.dataset.copyWidget="quiz";const groups=$$('[role="radiogroup"]',quiz);const answers=new Array(groups.length).fill(-1);
    const correct=[1,1,2,0];const score=$$("p",quiz).find(p=>normal(p.textContent)==="0 / 4 répondues");
    groups.forEach((group,i)=>$$('[role="radio"]',group).forEach((b,j)=>b.addEventListener("click",()=>{
      answers[i]=j;$$('[role="radio"]',group).forEach((r,k)=>{r.setAttribute("aria-checked",String(j===k));r.dataset.state=j===k?"checked":"unchecked";});
      if(score)score.textContent=`${answers.filter(a=>a>=0).length} / 4 répondues`;
    })));
    const check=$$("button",quiz).find(b=>normal(b.textContent)==="Corriger mes réponses");
    check.addEventListener("click",()=>{let feedback=$(".quiz-feedback",quiz);if(!feedback){feedback=document.createElement("div");feedback.className="quiz-feedback";feedback.setAttribute("role","status");quiz.append(feedback);}
      const n=answers.filter((a,i)=>a===correct[i]).length;feedback.replaceChildren();const summary=document.createElement("strong");summary.textContent=`${n} / 4 bonnes réponses`;feedback.append(summary);
      groups.forEach((g,i)=>{const p=document.createElement("p");const option=$$('[role="radio"]',g)[correct[i]].closest("label");p.textContent=`${i+1}. ${normal(option.textContent)}`;feedback.append(p);});
    });
  }
})();
