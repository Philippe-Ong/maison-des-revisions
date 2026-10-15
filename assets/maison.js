/* Maison des révisions — comportements communes (thème, maths, progression, flashcards). */
(() => {
  "use strict";

  /* Stockage local : facultatif, le site fonctionne sans (navigation privée, file://). */
  const stockage = {
    lire(cle) { try { return window.localStorage.getItem(cle); } catch (e) { return null; } },
    ecrire(cle, valeur) { try { window.localStorage.setItem(cle, valeur); } catch (e) { /* ignoré */ } },
    retirer(cle) { try { window.localStorage.removeItem(cle); } catch (e) { /* ignoré */ } },
  };

  /* ---------- Thème ---------- */
  const racine = document.documentElement;
  document.querySelectorAll("[data-theme-bascule]").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const actuel = racine.dataset.theme
        || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      racine.dataset.theme = actuel === "dark" ? "light" : "dark";
      stockage.ecrire("maison:theme", racine.dataset.theme);
    });
  });

  /* ---------- Maths (KaTeX) ---------- */
  window.__erreursKatex = [];
  /* Commandes de unicode-math (XeLaTeX) absentes de KaTeX, ramenées à leurs équivalents. */
  const MACROS_KATEX = {
    "\\symbf": "\\boldsymbol{#1}", "\\symbfit": "\\boldsymbol{#1}", "\\symit": "\\mathit{#1}",
    "\\symup": "\\mathrm{#1}", "\\symrm": "\\mathrm{#1}", "\\symsf": "\\mathsf{#1}", "\\symcal": "\\mathcal{#1}",
    "\\symbb": "\\mathbb{#1}", "\\symtt": "\\mathtt{#1}",
  };
  function rendreMaths(zone) {
    if (!window.katex) return;
    zone.querySelectorAll(".km:not([data-rendu])").forEach((el) => {
      const options = {
        displayMode: el.classList.contains("km-d"), strict: "ignore", trust: false, macros: { ...MACROS_KATEX },
      };
      try {
        window.katex.render(el.dataset.tex, el, { ...options, throwOnError: true });
      } catch (erreur) {
        window.__erreursKatex.push({ tex: el.dataset.tex, message: String(erreur && erreur.message) });
        console.error("KaTeX :", erreur && erreur.message, "—", el.dataset.tex);
        try { window.katex.render(el.dataset.tex, el, { ...options, throwOnError: false }); } catch (e) { /* repli TeX */ }
      }
      el.dataset.rendu = "1";
    });
  }
  rendreMaths(document);

  /* Formules display trop larges : réduites (jusqu'à 72 %) plutôt que tronquées. */
  function ajusterFormules() {
    document.querySelectorAll(".km-d").forEach((el) => {
      el.style.fontSize = "";
      const debord = el.scrollWidth / Math.max(1, el.clientWidth);
      if (debord > 1.01) el.style.fontSize = `${Math.max(0.72, 1 / debord).toFixed(3)}em`;
    });
  }
  ajusterFormules();
  let minuterie = 0;
  window.addEventListener("resize", () => { clearTimeout(minuterie); minuterie = setTimeout(ajusterFormules, 150); });

  /* ---------- Code (highlight.js) ---------- */
  if (window.hljs) {
    document.querySelectorAll("pre.code code").forEach((bloc) => window.hljs.highlightElement(bloc));
  }

  /* ---------- Progression d'un résumé ---------- */
  const cle = document.body.dataset.cle;
  let sections = [];
  try { sections = JSON.parse(document.body.dataset.sections || "[]"); } catch (e) { sections = []; }
  const cleSection = (id) => `maison:${cle}:${id}`;

  function majProgression() {
    if (!cle) return;
    const faites = sections.filter((id) => stockage.lire(cleSection(id)) === "1").length;
    const pourcent = sections.length ? Math.round((100 * faites) / sections.length) : 0;
    document.querySelectorAll("[data-anneau]").forEach((anneau) => {
      anneau.style.setProperty("--p", pourcent);
      anneau.setAttribute("aria-label", `Progression : ${faites} sections révisées sur ${sections.length}`);
    });
    document.querySelectorAll("[data-progression-pourcent]").forEach((el) => { el.textContent = `${pourcent} %`; });
    document.querySelectorAll("[data-progression-texte]").forEach((el) => { el.textContent = `${faites} / ${sections.length}`; });
    sections.forEach((id) => {
      const fait = stockage.lire(cleSection(id)) === "1";
      document.getElementById(id)?.classList.toggle("est-fait", fait);
      document.querySelector(`.sommaire-liste li[data-cible="${id}"]`)?.classList.toggle("fait", fait);
    });
  }

  const cases = Array.from(document.querySelectorAll("input[data-section]"));
  cases.forEach((caseRevise) => {
    caseRevise.checked = stockage.lire(cleSection(caseRevise.dataset.section)) === "1";
    caseRevise.addEventListener("change", () => {
      const id = caseRevise.dataset.section;
      if (caseRevise.checked) stockage.ecrire(cleSection(id), "1"); else stockage.retirer(cleSection(id));
      cases.filter((c) => c.dataset.section === id).forEach((c) => { c.checked = caseRevise.checked; });
      majProgression();
    });
  });
  majProgression();

  /* ---------- Sommaire : section active et repli mobile ---------- */
  const details = document.querySelector(".sommaire-details");
  if (details && window.innerWidth > 0 && window.innerWidth <= 1020) details.open = false;
  const lignes = new Map(Array.from(document.querySelectorAll(".sommaire-liste > li[data-cible]"))
    .map((li) => [li.dataset.cible, li]));
  if ("IntersectionObserver" in window && lignes.size) {
    const visibles = new Set();
    const observateur = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => { if (e.isIntersecting) visibles.add(e.target.id); else visibles.delete(e.target.id); });
      const premiere = sections.find((id) => visibles.has(id));
      if (!premiere) return;
      lignes.forEach((li, id) => li.classList.toggle("actif", id === premiere));
      memoriserPosition(premiere);
    }, { rootMargin: "-80px 0px -55% 0px" });
    sections.forEach((id) => { const el = document.getElementById(id); if (el) observateur.observe(el); });
  }
  if (details) {
    details.querySelectorAll("a").forEach((lien) => lien.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 1020px)").matches) details.open = false;
    }));
  }

  /* ---------- Dialogues (Formulaire, loupe) ---------- */
  function ouvrir(dialogue) {
    if (!dialogue) return;
    if (typeof dialogue.showModal === "function") dialogue.showModal(); else dialogue.setAttribute("open", "");
  }
  function fermer(dialogue) {
    if (!dialogue) return;
    if (typeof dialogue.close === "function") dialogue.close(); else dialogue.removeAttribute("open");
  }
  document.querySelectorAll("[data-ouvrir]").forEach((bouton) => {
    bouton.addEventListener("click", () => ouvrir(document.getElementById(bouton.dataset.ouvrir)));
  });
  document.querySelectorAll("dialog").forEach((dialogue) => {
    dialogue.addEventListener("click", (evt) => {
      if (evt.target === dialogue || evt.target.closest("[data-fermer]")) fermer(dialogue);
    });
  });

  const loupe = document.getElementById("loupe");
  document.querySelectorAll(".loupe-ouvrir").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const image = bouton.querySelector("img");
      if (!loupe || !image) return;
      const cible = loupe.querySelector("img");
      cible.src = image.currentSrc || image.src;
      cible.alt = image.alt;
      cible.classList.toggle("schema-loupe", image.src.endsWith(".svg"));
      ouvrir(loupe);
    });
  });

  /* ---------- Progression des pièces et du hall ---------- */
  document.querySelectorAll("[data-progres]").forEach((zone) => {
    let livres = [];
    try { livres = JSON.parse(zone.dataset.progres || "[]"); } catch (e) { livres = []; }
    let total = 0;
    let faites = 0;
    livres.forEach((livre) => {
      total += livre.sections.length;
      faites += livre.sections.filter((id) => stockage.lire(`maison:${livre.cle}:${id}`) === "1").length;
    });
    const ratio = total ? faites / total : 0;
    const pourcent = `${Math.round(100 * ratio)} %`;
    zone.querySelectorAll("[data-anneau]").forEach((a) => a.style.setProperty("--p", Math.round(100 * ratio)));
    zone.querySelectorAll(".barre-prog i, .mini-prog i").forEach((i) => { i.style.width = `${100 * ratio}%`; });
    zone.querySelectorAll(".piece-prog").forEach((r) => r.setAttribute("width", String(ratio * Number(r.dataset.largeurMax || 0))));
    zone.querySelectorAll("[data-progres-texte]").forEach((el) => { el.textContent = pourcent; });
    if (total) zone.setAttribute("data-faites", `${faites}/${total}`);
  });

  /* ---------- Comptes à rebours des TE (recalculés chaque jour) ---------- */
  document.querySelectorAll("[data-compte-a-rebours]").forEach((el) => {
    const [a, m, j] = el.dataset.compteARebours.split("-").map(Number);
    const jour = new Date(a, m - 1, j);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    const delta = Math.round((jour - aujourdhui) / 86400000);
    el.textContent = delta === 0 ? "aujourd'hui" : delta > 0 ? `J-${delta}` : "passé";
  });

  /* ---------- « Reprendre où tu t'es arrêté » ---------- */
  const urlRacine = document.body.dataset.urlRacine;
  function memoriserPosition(idSection) {
    if (!urlRacine) return;
    const titreSection = idSection ? document.getElementById(`${idSection}-t`)?.textContent || "" : "";
    stockage.ecrire("maison:dernier", JSON.stringify({
      u: urlRacine + (idSection ? `#${idSection}` : ""), t: document.body.dataset.titre || document.title, s: titreSection,
    }));
  }
  memoriserPosition("");
  const reprendre = document.querySelector("[data-reprendre]");
  if (reprendre) {
    try {
      const dernier = JSON.parse(stockage.lire("maison:dernier") || "null");
      if (dernier && dernier.u) {
        reprendre.href = dernier.u;
        reprendre.querySelector("[data-reprendre-titre]").textContent = dernier.s ? `${dernier.t} — ${dernier.s}` : dernier.t;
        reprendre.classList.add("visible");
      }
    } catch (e) { /* rien à reprendre */ }
  }

  /* ---------- Flashcards ---------- */
  document.querySelectorAll("ol.flashcards").forEach((liste) => {
    const cartes = Array.from(liste.querySelectorAll(".flashcard"));
    const score = liste.parentElement.querySelector(".fc-score strong");
    const cleCarte = (carte) => `maison:${cle}:fc:${carte.dataset.n}`;
    const majScore = () => {
      if (score) score.textContent = String(cartes.filter((c) => c.dataset.eval === "ok").length);
    };
    cartes.forEach((carte) => {
      const voir = carte.querySelector(".fc-voir");
      const reponse = carte.querySelector(".fc-r");
      const etat = stockage.lire(cleCarte(carte));
      if (etat) carte.dataset.eval = etat;
      voir.addEventListener("click", () => {
        const ouvert = voir.getAttribute("aria-expanded") === "true";
        voir.setAttribute("aria-expanded", String(!ouvert));
        voir.textContent = ouvert ? "Voir la réponse" : "Masquer la réponse";
        reponse.hidden = ouvert;
      });
      carte.querySelectorAll(".fc-eval button").forEach((bouton) => {
        bouton.addEventListener("click", () => {
          carte.dataset.eval = bouton.dataset.eval;
          stockage.ecrire(cleCarte(carte), bouton.dataset.eval);
          majScore();
        });
      });
    });
    liste.parentElement.querySelector(".fc-reinit")?.addEventListener("click", () => {
      cartes.forEach((carte) => {
        delete carte.dataset.eval;
        stockage.retirer(cleCarte(carte));
        const voir = carte.querySelector(".fc-voir");
        voir.setAttribute("aria-expanded", "false");
        voir.textContent = "Voir la réponse";
        carte.querySelector(".fc-r").hidden = true;
      });
      majScore();
    });
    majScore();
  });

  /* ---------- Recherche globale (hall) ---------- */
  const champ = document.getElementById("q");
  if (champ && Array.isArray(window.RECHERCHE)) {
    const normaliser = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const index = window.RECHERCHE.map((e) => ({ ...e, nt: normaliser(e.t), nx: normaliser(e.x) }));
    const etat = document.getElementById("recherche-etat");
    const liste = document.getElementById("resultats");
    const echapper = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const VARIANTES = { a: "aàâä", e: "eéèêë", i: "iîï", o: "oôö", u: "uùûü", c: "cç", y: "yÿ" };
    const motifSansAccent = (terme) => Array.from(terme)
      .map((ch) => (VARIANTES[ch] ? `[${VARIANTES[ch]}]` : ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).join("");

    function surligner(texte, termes) {
      const motif = new RegExp(termes.map(motifSansAccent).join("|"), "gi");
      let sortie = "";
      let dernier = 0;
      texte.replace(motif, (trouve, position) => {
        sortie += `${echapper(texte.slice(dernier, position))}<mark>${echapper(trouve)}</mark>`;
        dernier = position + trouve.length;
        return trouve;
      });
      return sortie + echapper(texte.slice(dernier));
    }

    function extrait(entree, termes) {
      // Le texte est en NFC : retirer les diacritiques après NFD conserve les positions.
      const premiere = termes.map((t) => entree.nx.indexOf(t)).find((p) => p >= 0);
      const position = premiere === undefined ? 0 : premiere;
      const debut = Math.max(0, position - 70);
      return (debut ? "…" : "") + entree.x.slice(debut, debut + 210) + (debut + 210 < entree.x.length ? "…" : "");
    }

    function chercher() {
      const termes = normaliser(champ.value.trim()).split(/\s+/).filter((t) => t.length >= 2);
      if (!termes.length) {
        liste.innerHTML = "";
        etat.textContent = "Tape au moins deux lettres.";
        return;
      }
      const trouves = [];
      index.forEach((e) => {
        if (!termes.every((t) => e.nt.includes(t) || e.nx.includes(t))) return;
        let score = 0;
        termes.forEach((t) => {
          if (e.nt.includes(t)) score += 12;
          let k = e.nx.indexOf(t);
          let n = 0;
          while (k >= 0 && n < 20) { n += 1; k = e.nx.indexOf(t, k + 1); }
          score += n;
        });
        trouves.push([score, e]);
      });
      trouves.sort((a, b) => b[0] - a[0]);
      const n = trouves.length;
      etat.textContent = n ? `${n} section${n > 1 ? "s" : ""} trouvée${n > 1 ? "s" : ""}${n > 30 ? " (30 premières affichées)" : ""}.`
        : "Aucune section ne contient tous ces mots.";
      liste.innerHTML = trouves.slice(0, 30).map(([, e]) => (
        `<li><a href="${echapper(e.u)}" style="--piece:${echapper(e.k)}">`
        + `<span class="res-lieu">${echapper(e.p)} · ${echapper(e.r)}</span>`
        + `<span class="res-titre">${surligner(e.t, termes)}</span>`
        + `<span class="res-extrait">${surligner(extrait(e, termes), termes)}</span></a></li>`
      )).join("");
    }
    let minuterieRecherche = 0;
    champ.addEventListener("input", () => {
      clearTimeout(minuterieRecherche);
      minuterieRecherche = setTimeout(chercher, 120);
    });
  }
})();
