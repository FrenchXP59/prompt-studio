"use client";

import { useEffect, useMemo, useState } from "react";

type Space = "mission" | "diagnostic" | "lab" | "iteration" | "quality" | "challenge";
type Decision = "Exploitable" | "À corriger ou vérifier" | "À ne pas diffuser" | "";
type DiagnosticChoice = "confirmé" | "à clarifier" | "ne pas inventer" | "";
type PromptTemplate = { id: string; name: string; text: string };

// Remplacer cette valeur par l’URL YouTube de la capsule de lancement lorsqu’elle sera publiée.
const workshopIntroVideoUrl = "";

const promptExamples: PromptTemplate[] = [
  {
    id: "example-source",
    name: "Production fiable à partir de sources",
    text: "À partir uniquement de {{source validée}}, rédige {{livrable}} pour {{public}}.\n\nObjectif : {{objectif}}.\nContraintes : {{contraintes}}.\n\nN’invente aucune information absente. Avant de rédiger, liste ce qui doit être confirmé : {{informations manquantes}}.",
  },
  {
    id: "example-control",
    name: "Contrôle d’un output",
    text: "Contrôle {{output}} uniquement au regard de {{sources}}. Pour chaque écart, indique : extrait, fait à vérifier, risque et correction possible. Distingue les informations confirmées des informations absentes. Ne prends pas la décision finale à ma place.",
  },
];

const spaces: { id: Space; label: string; number: string }[] = [
  { id: "mission", label: "Mission", number: "01" },
  { id: "diagnostic", label: "Diagnostic", number: "02" },
  { id: "lab", label: "Prompt Lab", number: "03" },
  { id: "iteration", label: "Studio d’itération", number: "04" },
  { id: "quality", label: "Quality Check", number: "05" },
  { id: "challenge", label: "Challenge final", number: "06" },
];

const diagnosticItems = [
  "Un pilote Cap Managers est prévu du 6 octobre au 14 novembre 2026.",
  "Le programme est obligatoire pour tous les managers.",
  "Le public est composé de 12 managers volontaires récemment nommés.",
  "Le lien et la date limite d’inscription doivent apparaître dans l’email.",
  "La participation nécessite l’accord du responsable hiérarchique.",
  "Le programme est certifiant et compte dans l’évaluation annuelle.",
];

const sourceFacts = [
  "12 managers volontaires, nommés depuis moins de 18 mois.",
  "Du 6 octobre au 14 novembre 2026 ; charge estimée : 2 h 15.",
  "Un atelier collectif à distance de 90 minutes et un échange de pratiques de 45 minutes en quatrième semaine.",
  "Objectif : préparer un rituel d’équipe de 30 minutes et formuler un retour constructif.",
  "Participation volontaire ; accord du responsable hiérarchique nécessaire.",
  "Le pilote n’est ni certifiant, ni obligatoire, ni lié à l’évaluation de la performance.",
];

const missingFacts = [
  "date et horaire de l’atelier initial",
  "modalité et date limite d’inscription",
  "personne de contact",
  "modalités techniques de connexion",
  "critères de sélection au-delà de 12 demandes",
];

const v1Lines = [
  "Inscrivez-vous vite à Cap Managers, le programme certifiant pour tous les managers.",
  "Dès le 6 octobre, vous participerez à plusieurs sessions animées par nos experts.",
  "Le parcours certifiant comprend un atelier collectif, un coaching individuel et des échanges réguliers.",
  "Inscrivez-vous avant le 30 septembre sur le portail RH.",
  "Votre participation sera prise en compte dans votre évaluation annuelle.",
];

const qualityRows = [
  ["Tous les managers s’inscrivent sur le portail RH", "public, portail, date limite"],
  ["Session en visioconférence le 6 octobre à 9 h 30", "horaire"],
  ["Obtenir la certification Cap Managers", "certification"],
  ["Enquête utilisée pour l’évaluation annuelle", "usage du retour d’expérience"],
  ["Participer à un échange entre pairs en quatrième semaine", "aucun"],
];

const emptyApp = {
  activeSpace: "mission" as Space,
  role: "pilote",
  diagnostic: diagnosticItems.map(() => "" as DiagnosticChoice),
  questions: "",
  contentType: "Email aux managers",
  objective: "",
  audience: "",
  sources: "",
  rolePrompt: "",
  constraints: "",
  format: "",
  unknowns: "",
  prompt: "",
  pastedOutput: "",
  annotations: v1Lines.map(() => false),
  keep: "",
  change: "",
  verify: "",
  iterationPrompt: "",
  quality: qualityRows.map(() => "" as Decision),
  qualityDecision: "" as Decision,
  controlPrompt: "",
  finalCase: "",
  finalSources: "",
  finalUnknowns: "",
  finalPrompt: "",
  finalOutput: "",
  finalControl: "",
  finalDecision: "" as Decision,
  nextAction: "",
  promptLibrary: [] as PromptTemplate[],
  libraryName: "",
  challengeAnonymized: false,
  methodStable: "",
  methodVariable: "",
  methodControl: "",
  methodHuman: "",
  methodName: "",
  methodWhen: "",
  methodInputs: "",
  methodInstructions: "",
  methodSources: "",
  methodSteps: "",
  methodQuality: "",
  methodValidation: "",
  methodSkillRevealed: false,
};

export default function Home() {
  const [app, setApp] = useState(emptyApp);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [quiz, setQuiz] = useState<number | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("prompt-studio-v1");
    if (saved) {
      try {
        setApp({ ...emptyApp, ...JSON.parse(saved) });
      } catch {
        window.localStorage.removeItem("prompt-studio-v1");
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem("prompt-studio-v1", JSON.stringify(app));
    }
  }, [app, hydrated]);

  const update = <K extends keyof typeof emptyApp>(key: K, value: (typeof emptyApp)[K]) =>
    setApp((current) => ({ ...current, [key]: value }));

  const go = (activeSpace: Space) => {
    update("activeSpace", activeSpace);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const proposedPrompt = useMemo(() => {
    const type = app.contentType.toLowerCase();
    return `${app.rolePrompt ? `Adopte le point de vue suivant, seulement s’il aide réellement : ${app.rolePrompt}.\n\n` : ""}À partir des sources autorisées ci-dessous, prépare un premier brouillon de ${type}.\n\nObjectif : ${app.objective || "[objectif à préciser]"}\nPublic : ${app.audience || "[public à préciser]"}\nSources autorisées : ${app.sources || "[indiquer les sources disponibles]"}\nContraintes utiles : ${app.constraints || "[indiquer uniquement les contraintes qui changent le résultat]"}\nFormat attendu : ${app.format || "[forme de sortie à préciser]"}\n\nNe complète aucune information absente des sources. Avant la réponse, liste les éléments à confirmer : ${app.unknowns || "[informations manquantes à signaler]"}.`;
  }, [app]);

  const controlPrompt = useMemo(
    () =>
      `Relis le contenu ci-dessous uniquement au regard des sources fournies. Pour chaque écart, indique : l’extrait concerné, le fait ou la consigne à vérifier, le risque, puis une correction possible. Distingue les informations confirmées des informations absentes. Ne prends pas la décision finale à la place de la personne responsable.\n\nContenu à contrôler : [coller ici l’output]`,
    [],
  );

  const exportSheet = () => window.print();

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => go("mission")} aria-label="Retour à la mission">
          <span className="brand-mark">P</span>
          <span>Prompt Studio <small>atelier guidé</small></span>
        </button>
        <button className="resource-button" onClick={() => setResourcesOpen(true)}>Ressources</button>
      </header>

      <nav className="stepper" aria-label="Progression de l’atelier">
        {spaces.map((space) => (
          <button
            key={space.id}
            className={app.activeSpace === space.id ? "active" : ""}
            onClick={() => go(space.id)}
          >
            <span>{space.number}</span>{space.label}
          </button>
        ))}
      </nav>

      {app.activeSpace === "mission" && <Mission app={app} update={update} go={go} openQuiz={() => { setQuiz(0); setQuizAnswer(""); }} />}
      {app.activeSpace === "diagnostic" && <Diagnostic app={app} update={update} go={go} openQuiz={() => { setQuiz(1); setQuizAnswer(""); }} />}
      {app.activeSpace === "lab" && <PromptLab app={app} update={update} proposedPrompt={proposedPrompt} go={go} openQuiz={() => { setQuiz(2); setQuizAnswer(""); }} />}
      {app.activeSpace === "iteration" && <Iteration app={app} update={update} go={go} />}
      {app.activeSpace === "quality" && <QualityCheck app={app} update={update} controlPrompt={controlPrompt} go={go} openQuiz={() => { setQuiz(3); setQuizAnswer(""); }} />}
      {app.activeSpace === "challenge" && <Challenge app={app} update={update} exportSheet={exportSheet} />}

      {resourcesOpen && <Resources onClose={() => setResourcesOpen(false)} />}
      {quiz && <Quiz id={quiz} answer={quizAnswer} setAnswer={setQuizAnswer} onClose={() => setQuiz(null)} />}

      <footer>
        <span>Frédéric Legrand</span><span>·</span>
        <a href="https://horizonduo.net" target="_blank" rel="noopener noreferrer">horizonduo.net</a><span>·</span>
        <a href="https://www.linkedin.com/in/frederic-legrand-horizonduo/" target="_blank" rel="noopener noreferrer" aria-label="Profil LinkedIn de Frédéric Legrand"><b>in</b> LinkedIn</a><span>·</span>
        <a href="https://www.youtube.com/@3minutes_chrono" target="_blank" rel="noopener noreferrer" aria-label="Chaîne YouTube 3 minutes chrono"><b>▶</b> YouTube — 3 minutes chrono</a>
      </footer>
    </main>
  );
}

function Mission({ app, update, go, openQuiz }: any) {
  return <section className="hero-page mission-page">
    <p className="eyebrow">ATELIER SYNCHRONE · 3 H 30</p>
    <h1>Du besoin flou<br /><em>à l’output maîtrisé.</em></h1>
    <p className="lead">Un atelier de pratique : diagnostiquer, prompter, dialoguer, itérer et contrôler — sans chercher un prompt parfait.</p>
    <div className="mission-card">
      <div><span className="kicker">MISSION COMMUNE</span><h2>HelioTech Services · Cap Managers</h2><p>Préparer deux contenus fiables à partir des mêmes données, sans inventer ce que les sources ne disent pas.</p></div>
      <div className="role-choice"><span>Votre premier rôle</span><div><button className={app.role === "pilote" ? "chosen" : ""} onClick={() => update("role", "pilote")}>Pilote</button><button className={app.role === "challenger" ? "chosen" : ""} onClick={() => update("role", "challenger")}>Challenger</button></div><small>Les rôles alterneront pendant l’atelier.</small></div>
    </div>
    <div className="principles"><span>Prompt</span><i>→</i><span>Dialogue</span><i>→</i><span>Itération</span><i>→</i><span>Contrôle</span></div>
    <div className="preflight-grid">
      <article className="notion-card"><span className="kicker">REPÈRE AVANT L’EXERCICE</span><h2>Deux documents, deux fonctions.</h2><div className="document-roles"><p><b>A · Demande reçue</b><br />Elle exprime le besoin et l’intention. Elle peut être imprécise.</p><p><b>B · Note validée</b><br />Elle contient les faits que l’on peut réellement utiliser.</p></div><p className="notion-note">Une absence n’est pas un détail à combler : elle devient une question, une mention provisoire ou une limite explicite.</p></article>
      <article className="video-card">
        <span className="kicker">CAPSULE DE LANCEMENT</span>
        {workshopIntroVideoUrl ? <iframe src={workshopIntroVideoUrl} title="Présentation de l’exercice HelioTech" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <div className="video-placeholder"><b>▶</b><div><strong>Votre vidéo d’introduction apparaîtra ici.</strong><span>Format conseillé : 2 à 3 minutes pour présenter le défi, l’intérêt de l’exercice et le rôle du binôme.</span></div></div>}
      </article>
    </div>
    <div className="mission-actions"><button className="soft" onClick={openQuiz}>Micro-quiz · demande ou source ?</button><button className="primary" onClick={() => go("diagnostic")}>Ouvrir les documents A et B <span>→</span></button></div>
  </section>;
}

function Diagnostic({ app, update, go, openQuiz }: any) {
  const cycle = (index: number) => {
    const order: DiagnosticChoice[] = ["", "confirmé", "à clarifier", "ne pas inventer"];
    const next = order[(order.indexOf(app.diagnostic[index]) + 1) % order.length];
    const diagnostic = [...app.diagnostic]; diagnostic[index] = next; update("diagnostic", diagnostic);
  };
  return <section className="page-grid diagnostic-page">
    <div className="page-heading"><p className="eyebrow">02 · DIAGNOSTIC</p><h1>Ce qui manque compte autant que ce qui est dit.</h1><p>Classez les informations du brief. Cliquer plusieurs fois fait évoluer le statut.</p></div>
    <div className="two-col source-layout">
      <article className="document dark"><span>DOCUMENT A · DEMANDE REÇUE</span><p>« Nous devons communiquer rapidement sur Cap Managers. Il faudrait un message qui donne envie aux managers de participer, et une fiche courte pour suivre le lancement. Nous avons une note, mais il faut que ce soit clair, professionnel et dynamique. »</p></article>
      <article className="document"><span>DOCUMENT B · NOTE VALIDÉE</span><ul>{sourceFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul><p className="missing"><b>Absents des sources :</b> {missingFacts.join(" · ")}</p></article>
    </div>
    <div className="diagnostic-board">{diagnosticItems.map((item, index) => <button key={item} className={`diagnostic-item ${app.diagnostic[index].replaceAll(" ", "-")}`} onClick={() => cycle(index)}><span>{index + 1}</span><p>{item}</p><em>{app.diagnostic[index] || "à classer"}</em></button>)}</div>
    <div className="questions-card"><div><span className="kicker">LE CHALLENGER QUESTIONNE</span><h2>Quelles trois précisions changeraient réellement votre production ?</h2></div><textarea value={app.questions} onChange={(e) => update("questions", e.target.value)} placeholder="Ex. Quelle modalité d’inscription doit apparaître dans l’email ?" /></div>
    <div className="action-row"><button className="soft" onClick={openQuiz}>Micro-quiz · informations absentes</button><button className="primary" onClick={() => go("lab")}>Passer au Prompt Lab <span>→</span></button></div>
  </section>;
}

function PromptLab({ app, update, proposedPrompt, go, openQuiz }: any) {
  return <section className="page-grid">
    <div className="page-heading"><p className="eyebrow">03 · PROMPT LAB</p><h1>Construire une demande qui aide vraiment.</h1><p>Le canevas est facultatif. Utilisez uniquement les repères utiles à votre situation et modifiez librement le texte proposé.</p></div>
    <div className="lab-layout">
      <aside className="lab-tools"><span className="kicker">CHOISIR LE LIVRABLE</span><button className={app.contentType === "Email aux managers" ? "selected" : ""} onClick={() => update("contentType", "Email aux managers")}>01 · Email aux managers</button><button className={app.contentType === "Tableau de suivi" ? "selected" : ""} onClick={() => update("contentType", "Tableau de suivi")}>02 · Tableau de suivi</button><p>Les deux participants travaillent des livrables différents, puis comparent ce qui change réellement.</p></aside>
      <div className="form-card"><div className="form-title"><span className="kicker">CANEVAS SANS OBLIGATION</span><p>Vous pouvez ignorer un champ, notamment le rôle, ou écrire votre prompt directement.</p></div><div className="field-grid"><Field label="Objectif" value={app.objective} onChange={(v: string) => update("objective", v)} placeholder="Ce que le contenu doit permettre" /><Field label="Public" value={app.audience} onChange={(v: string) => update("audience", v)} placeholder="Destinataire réel" /><Field label="Sources autorisées" value={app.sources} onChange={(v: string) => update("sources", v)} placeholder="Note Cap Managers validée" /><Field label="Rôle (facultatif)" value={app.rolePrompt} onChange={(v: string) => update("rolePrompt", v)} placeholder="Seulement s’il apporte un point de vue utile" /><Field label="Contraintes utiles" value={app.constraints} onChange={(v: string) => update("constraints", v)} placeholder="Ce qu’il faut respecter ou éviter" /><Field label="Format attendu" value={app.format} onChange={(v: string) => update("format", v)} placeholder="Objet + corps + action, tableau…" /></div><Field label="Informations à signaler comme absentes" value={app.unknowns} onChange={(v: string) => update("unknowns", v)} placeholder="Date précise, inscription, contact…" /></div>
      <div className="prompt-card"><span className="kicker">VOTRE PROMPT, MODIFIABLE</span><p>La trame n’est proposée qu’à votre demande.</p><button className="soft full" onClick={() => update("prompt", proposedPrompt)}>Proposer une trame adaptée</button><textarea value={app.prompt} onChange={(e) => update("prompt", e.target.value)} placeholder="Écrivez ou adaptez votre prompt ici…" /><button className="copy" onClick={() => navigator.clipboard?.writeText(app.prompt)}>Copier le prompt</button></div>
    </div>
    <PromptLibrary app={app} update={update} />
    <div className="output-strip"><div><span className="kicker">APRÈS TEST DANS L’OUTIL IA AUTORISÉ</span><h2>Collez l’output obtenu.</h2><p>Le binôme lira ensuite le résultat à partir de la demande et des sources.</p></div><textarea value={app.pastedOutput} onChange={(e) => update("pastedOutput", e.target.value)} placeholder="Coller ici l’output de test…" /></div>
    <div className="action-row"><button className="soft" onClick={openQuiz}>Micro-quiz · changer de contenu</button><button className="primary" onClick={() => go("iteration")}>Ouvrir le Studio d’itération <span>→</span></button></div>
  </section>;
}

function Iteration({ app, update, go }: any) {
  return <section className="page-grid">
    <div className="page-heading"><p className="eyebrow">04 · STUDIO D’ITÉRATION</p><h1>Ne recommencez pas : faites évoluer.</h1><p>Conservez ce qui fonctionne, ciblez l’écart, puis testez une instruction d’amélioration.</p></div>
    <div className="iteration-grid"><article className="v1-card"><span className="kicker">OUTPUT V1 · À ANNOTER</span><h2>Cap Managers</h2>{v1Lines.map((line, index) => <button key={line} className={app.annotations[index] ? "flagged" : ""} onClick={() => { const annotations = [...app.annotations]; annotations[index] = !annotations[index]; update("annotations", annotations); }}><i>{app.annotations[index] ? "!" : "○"}</i>{line}</button>)}</article><article className="iteration-notes"><span className="kicker">INSTRUCTION D’ITÉRATION</span><Field label="À conserver" value={app.keep} onChange={(v: string) => update("keep", v)} placeholder="Ex. intention informative et ton direct" /><Field label="À modifier" value={app.change} onChange={(v: string) => update("change", v)} placeholder="Ex. les faits non justifiés" /><Field label="À vérifier" value={app.verify} onChange={(v: string) => update("verify", v)} placeholder="Ex. les modalités d’inscription" /><textarea value={app.iterationPrompt} onChange={(e) => update("iterationPrompt", e.target.value)} placeholder="Écrivez ici l’instruction : conserve…, retire…, signale…" /></article><article className="v2-card"><span className="kicker">OUTPUT V2 · COMPARER</span><h2>Cap Managers : un pilote pour les managers récemment nommés</h2><p>L’équipe Développement des compétences prépare le lancement de Cap Managers, un pilote destiné à 12 managers volontaires nommés dans leur fonction depuis moins de 18 mois.</p><p>Du 6 octobre au 14 novembre 2026, le parcours comprend un atelier collectif à distance de 90 minutes, puis un échange de pratiques de 45 minutes durant la quatrième semaine.</p><p>Les modalités pratiques et d’inscription vous seront communiquées prochainement.</p><div className="better">Les informations absentes sont rendues visibles ; elles ne sont pas inventées.</div></article></div>
    <div className="action-row"><button className="soft" onClick={() => update("iterationPrompt", `Conserve ${app.keep || "les éléments utiles"}. Corrige ${app.change || "les écarts identifiés"}. Signale explicitement ce qui reste à vérifier : ${app.verify || "les informations absentes"}.`)}>Proposer une instruction ciblée</button><button className="primary" onClick={() => go("quality")}>Passer au Quality Check <span>→</span></button></div>
  </section>;
}

function QualityCheck({ app, update, controlPrompt, go, openQuiz }: any) {
  const cycle = (index: number) => { const order: Decision[] = ["", "Exploitable", "À corriger ou vérifier", "À ne pas diffuser"]; const quality = [...app.quality]; quality[index] = order[(order.indexOf(quality[index]) + 1) % order.length]; update("quality", quality); };
  return <section className="page-grid">
    <div className="page-heading"><p className="eyebrow">05 · QUALITY CHECK</p><h1>Une réponse fluide n’est pas forcément exploitable.</h1><p>La décision appartient toujours à une personne. L’application aide à rendre les écarts visibles.</p></div>
    <div className="quality-layout"><article className="quality-table"><span className="kicker">TABLEAU À AUDITER</span><h2>Suivi du pilote Cap Managers</h2>{qualityRows.map(([line, issue], index) => <button key={line} className={app.quality[index].replaceAll(" ", "-").replaceAll("à", "a")} onClick={() => cycle(index)}><span>{index + 1}</span><p>{line}<small>Écart potentiel : {issue}</small></p><em>{app.quality[index] || "à examiner"}</em></button>)}</article><article className="control-card"><span className="kicker">PROMPT DE CONTRÔLE</span><p>Demandez d’abord un diagnostic : extrait, écart, risque, correction. La décision finale reste humaine.</p><textarea value={app.controlPrompt} onChange={(e) => update("controlPrompt", e.target.value)} placeholder={controlPrompt} /><button className="soft full" onClick={() => update("controlPrompt", controlPrompt)}>Proposer un prompt de contrôle</button><div className="human-decision"><span>Décision humaine finale</span>{(["Exploitable", "À corriger ou vérifier", "À ne pas diffuser"] as Decision[]).map((item) => <button key={item} className={app.qualityDecision === item ? "chosen" : ""} onClick={() => update("qualityDecision", item)}>{item}</button>)}</div></article></div>
    <div className="action-row"><button className="soft" onClick={openQuiz}>Micro-quiz · décision humaine</button><button className="primary" onClick={() => go("challenge")}>Lancer le Challenge final <span>→</span></button></div>
  </section>;
}

function Challenge({ app, update, exportSheet }: any) {
  return <section className="page-grid challenge-page">
    <div className="page-heading"><p className="eyebrow">06 · CHALLENGE FINAL</p><h1>Transférer la méthode dans votre métier.</h1><p>Utilisez un cas anonymisé. Si nécessaire, appuyez-vous sur le cas de secours Atelier Mistral : ateliers cybersécurité, dates et modalités pratiques volontairement incomplètes.</p></div>
    <div className="safety-card"><div><span className="kicker">SAS CONFIDENTIALITÉ AVANT IA</span><h2>Un cas utile, pas un cas exposé.</h2><p>Avant de le coller dans l’outil autorisé, retirez les noms, coordonnées, identifiants, références de dossiers et combinaisons qui permettent de reconnaître une personne ou une organisation.</p></div><label className="privacy-check"><input type="checkbox" checked={app.challengeAnonymized} onChange={(e) => update("challengeAnonymized", e.target.checked)} /><span>Mon cas est anonymisé et l’outil choisi est autorisé.</span></label></div>
    <div className="challenge-grid"><div className="form-card"><span className="kicker">MON CAS À TESTER</span><Field label="Besoin et livrable visé" value={app.finalCase} onChange={(v: string) => update("finalCase", v)} placeholder="Décrivez le besoin métier, pas l’outil souhaité" /><Field label="Sources autorisées" value={app.finalSources} onChange={(v: string) => update("finalSources", v)} placeholder="Documents publics, fictifs ou validés" /><Field label="Informations absentes à ne pas inventer" value={app.finalUnknowns} onChange={(v: string) => update("finalUnknowns", v)} placeholder="Ce qu’il faudra demander, signaler ou laisser à confirmer" /></div><div className="final-card"><span className="kicker">PROMPT DE PRODUCTION</span><textarea value={app.finalPrompt} onChange={(e) => update("finalPrompt", e.target.value)} placeholder="Votre prompt librement formulé…" /><span className="kicker">OUTPUT TESTÉ</span><textarea value={app.finalOutput} onChange={(e) => update("finalOutput", e.target.value)} placeholder="L’output obtenu, ou le protocole de test prévu…" /></div><div className="final-card"><span className="kicker">PROMPT DE CONTRÔLE</span><textarea value={app.finalControl} onChange={(e) => update("finalControl", e.target.value)} placeholder="Votre contrôle ciblé…" /><span className="kicker">DÉCISION HUMAINE ET PROCHAIN TEST</span><div className="decision-buttons">{(["Exploitable", "À corriger ou vérifier", "À ne pas diffuser"] as Decision[]).map((item) => <button key={item} className={app.finalDecision === item ? "chosen" : ""} onClick={() => update("finalDecision", item)}>{item}</button>)}</div><textarea value={app.nextAction} onChange={(e) => update("nextAction", e.target.value)} placeholder="Ex. tester ce prompt sur un dossier validé, puis le faire relire par…" /></div></div>
    <section className="method-section" aria-label="Du prompt à la méthode réutilisable">
      <div className="method-heading"><div><span className="kicker">CONCLUSION GUIDÉE · 15 MIN</span><h2>Du prompt à la méthode réutilisable.</h2><p>Transformez l’essai du jour en une manière de travailler que vous pourrez reprendre et adapter.</p></div><div className="method-question">« Si vous deviez refaire cette tâche chaque semaine, qu’auriez-vous intérêt à ne plus réexpliquer à l’IA ? »</div></div>
      <div className="method-sort-grid">
        <MethodArea title="Stable" hint="Ce qui ne change pas d’un cas à l’autre." value={app.methodStable} onChange={(value: string) => update("methodStable", value)} placeholder="Ex. structure attendue, ton, règles, étapes…" />
        <MethodArea title="Variable" hint="Ce qui dépend du dossier, de la période ou du destinataire." value={app.methodVariable} onChange={(value: string) => update("methodVariable", value)} placeholder="Ex. données, public, objectif, date…" />
        <MethodArea title="Contrôle" hint="Ce qui permet de vérifier avant diffusion." value={app.methodControl} onChange={(value: string) => update("methodControl", value)} placeholder="Ex. sources à comparer, critères, alertes…" />
        <MethodArea title="Humain" hint="Ce qu’une personne doit décider ou assumer." value={app.methodHuman} onChange={(value: string) => update("methodHuman", value)} placeholder="Ex. arbitrage, validation, diffusion…" />
      </div>
      <div className="method-review"><b>Relecture en binôme :</b> un élément est-il rangé dans la mauvaise colonne ? En particulier, une décision humaine ne doit pas devenir une simple instruction à l’IA.</div>
      <div className="method-spec">
        <div className="method-spec-heading"><span className="kicker">MINI-SPÉCIFICATION</span><h3>Formalisez votre méthode de travail.</h3><p>Elle doit permettre à une autre personne de comprendre quoi préparer, quoi contrôler et à quel moment reprendre la main.</p></div>
        <div className="method-form-grid">
          <Field label="Nom de la méthode" value={app.methodName} onChange={(value: string) => update("methodName", value)} placeholder="Ex. Préparer une note de synthèse fiable" />
          <Field label="Quand l’utiliser" value={app.methodWhen} onChange={(value: string) => update("methodWhen", value)} placeholder="À quel moment ou pour quelle tâche récurrente ?" />
          <MethodArea title="Entrées variables" hint="Les paramètres à fournir à chaque utilisation." value={app.methodInputs} onChange={(value: string) => update("methodInputs", value)} placeholder="Données, public, périmètre, échéance…" />
          <MethodArea title="Instructions stables" hint="Les règles qui restent identiques." value={app.methodInstructions} onChange={(value: string) => update("methodInstructions", value)} placeholder="Structure, ton, limites, formulation des inconnues…" />
          <MethodArea title="Sources nécessaires" hint="Les sources autorisées et leur rôle." value={app.methodSources} onChange={(value: string) => update("methodSources", value)} placeholder="Référentiels, notes validées, documents sources…" />
          <MethodArea title="Étapes à suivre" hint="L’ordre de travail reproductible." value={app.methodSteps} onChange={(value: string) => update("methodSteps", value)} placeholder="Préparer, produire, itérer, contrôler…" />
          <MethodArea title="Critères de qualité" hint="Ce qui rend le résultat utilisable." value={app.methodQuality} onChange={(value: string) => update("methodQuality", value)} placeholder="Exactitude, format, traçabilité, clarté…" />
          <MethodArea title="Validation humaine indispensable" hint="Qui décide, sur quel point et avant quelle action." value={app.methodValidation} onChange={(value: string) => update("methodValidation", value)} placeholder="Validation métier, juridique, éditoriale…" />
        </div>
      </div>
      <div className="method-outcome"><button className="soft" onClick={() => update("methodSkillRevealed", !app.methodSkillRevealed)}>{app.methodSkillRevealed ? "Masquer la conclusion" : "Voir ce que cette méthode permet de créer"}</button>{app.methodSkillRevealed && <div className="skill-reveal"><span className="kicker">OUVERTURE</span><h3>Cette méthode est la matière première d’un Skill.</h3><p>Un Skill formalise une méthode réutilisable, ses entrées, ses contrôles et les validations à conserver. Une démonstration très courte d’un Skill existant peut suivre si le temps le permet.</p></div>}</div>
    </section>
    <div className="export-panel"><div><span className="kicker">VOTRE FICHE PARTICIPANT</span><h2>Prompt, contrôle, décision et méthode réutilisable.</h2><p>La synthèse reste sur cet appareil jusqu’à son export ou sa réinitialisation.</p></div><button className="primary" onClick={exportSheet}>Prévisualiser / imprimer ma fiche <span>↗</span></button></div>
  </section>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="field"><span>{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
}

function MethodArea({ title, hint, value, onChange, placeholder }: { title: string; hint: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="method-area"><span>{title}</span><small>{hint}</small><textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>;
}

function PromptLibrary({ app, update }: any) {
  const [selectedId, setSelectedId] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const selected = [...promptExamples, ...app.promptLibrary].find((template) => template.id === selectedId);
  const variableNames = selected ? Array.from(new Set([...selected.text.matchAll(/{{\s*([^}]+)\s*}}/g)].map((match) => match[1].trim()))) : [];
  const adaptedPrompt = selected ? variableNames.reduce((text, name) => text.replaceAll("{{" + name + "}}", variables[name]?.trim() || "{{" + name + "}}"), selected.text) : "";
  const selectTemplate = (template: PromptTemplate) => { setSelectedId(template.id); setVariables({}); };
  const saveCurrentPrompt = () => {
    if (!app.prompt.trim()) return;
    const template = { id: "prompt-" + Date.now(), name: app.libraryName.trim() || "Prompt sans titre", text: app.prompt.trim() };
    update("promptLibrary", [...app.promptLibrary, template]); update("libraryName", ""); selectTemplate(template);
  };
  const duplicateExample = (example: PromptTemplate) => {
    const template = { ...example, id: "prompt-" + Date.now() };
    update("promptLibrary", [...app.promptLibrary, template]); update("libraryName", template.name); update("prompt", template.text); selectTemplate(template);
  };
  const removeTemplate = (id: string) => { update("promptLibrary", app.promptLibrary.filter((template: PromptTemplate) => template.id !== id)); if (selectedId === id) setSelectedId(""); };

  return <section className="library-section" aria-label="Bibliothèque de prompts">
    <div className="library-heading"><div><span className="kicker">BIBLIOTHÈQUE PERSONNELLE</span><h2>Vos prompts réutilisables, sur cet appareil.</h2><p>Enregistrez un prompt vierge ou testé, puis remplacez simplement les variables entre doubles accolades.</p></div><div className="save-prompt"><input value={app.libraryName} onChange={(e) => update("libraryName", e.target.value)} placeholder="Nom du prompt (facultatif)" /><button className="soft" onClick={saveCurrentPrompt} disabled={!app.prompt.trim()}>Ajouter le prompt ouvert</button></div></div>
    <div className="library-grid">
      <article className="library-card"><span className="kicker">EXEMPLES À DUPLIQUER</span><p>Ils ne sont pas ajoutés à votre bibliothèque tant que vous ne les dupliquez pas.</p>{promptExamples.map((example) => <div className="template-row" key={example.id}><div><b>{example.name}</b><small>{example.text.match(/{{[^}]+}}/g)?.join(" · ")}</small></div><button className="soft" onClick={() => duplicateExample(example)}>Dupliquer</button></div>)}</article>
      <article className="library-card"><span className="kicker">MA BIBLIOTHÈQUE</span>{app.promptLibrary.length === 0 ? <p className="empty-library">Elle est vierge pour l’instant. Créez votre premier prompt ou dupliquez un exemple.</p> : app.promptLibrary.map((template: PromptTemplate) => <div className="template-row" key={template.id}><button className="template-open" onClick={() => selectTemplate(template)}><b>{template.name}</b><small>{template.text.match(/{{[^}]+}}/g)?.join(" · ") || "sans variable"}</small></button><button className="remove-template" onClick={() => removeTemplate(template.id)} aria-label={"Supprimer " + template.name}>×</button></div>)}</article>
      <article className="library-card variable-card"><span className="kicker">VARIABLES RAPIDES</span>{selected ? <><h3>{selected.name}</h3>{variableNames.length > 0 ? <div className="variable-grid">{variableNames.map((name) => <label key={name}><span>{name}</span><input value={variables[name] || ""} onChange={(e) => setVariables((current) => ({ ...current, [name]: e.target.value }))} placeholder={"Valeur de « " + name + " »"} /></label>)}</div> : <p>Ce prompt ne contient pas de variable : vous pouvez l’utiliser tel quel ou le modifier dans le Lab.</p>}<textarea readOnly value={adaptedPrompt} aria-label="Version adaptée du prompt" /><div className="library-actions"><button className="soft" onClick={() => update("prompt", adaptedPrompt)}>Utiliser dans le Lab</button><button className="copy" onClick={() => navigator.clipboard?.writeText(adaptedPrompt)}>Copier la version adaptée</button></div></> : <p className="empty-library">Sélectionnez un exemple ou un prompt enregistré pour renseigner ses variables.</p>}</article>
    </div>
  </section>;
}

function Resources({ onClose }: { onClose: () => void }) {
  return <aside className="resource-drawer" role="dialog" aria-label="Ressources de l’atelier"><div className="drawer-top"><div><span className="eyebrow">RESSOURCES</span><h2>À garder sous la main</h2></div><button onClick={onClose} aria-label="Fermer les ressources">×</button></div><p>Les ressources complètent les manipulations ; elles ne constituent pas une étape du parcours.</p><div className="resource-list"><a href="/resources/pack-fiches-prompt-engineering.pdf" target="_blank" rel="noopener noreferrer">Pack de 4 fiches : ROCOF, itération, contrôle, boîte à outils <small>PDF existant</small></a><a href="/resources/prompt-engineering-2026.pdf" target="_blank" rel="noopener noreferrer">Le prompt engineering est-il encore nécessaire en 2026 ? <small>PDF existant</small></a><a href="#documents">Documents HelioTech <small>Cas de manipulation intégré</small></a><a href="#outputs">Outputs imparfaits <small>Cas de manipulation intégré</small></a></div><div className="drawer-note">La capsule vidéo de lancement aura sa place sur la Mission, juste avant l’ouverture des documents A et B.</div></aside>;
}

const quizData = {
  0: { title: "Demande ou source ?", question: "Avant de demander un contenu à une IA, quel document permet de décider ce qui peut être affirmé ?", options: ["La demande reçue : elle donne le ton attendu.", "Le document qui contient le plus d’informations.", "La note validée : elle établit les faits utilisables.", "L’output le plus convaincant produit par l’IA."], answer: 2, debrief: "La demande A aide à comprendre l’intention et le livrable. La note B est la base factuelle : ce qui n’y figure pas doit rester à confirmer, pas être inventé." },
  1: { title: "Une information absente", question: "La source ne précise pas la modalité d’inscription. Quelle action est la plus rigoureuse ?", options: ["Ajouter un lien vers le portail RH.", "Indiquer une date limite raisonnable.", "Signaler l’information manquante et prévoir une formulation provisoire.", "Ne rien mentionner dans l’email."], answer: 2, debrief: "Une modalité peut être indispensable au livrable sans pour autant être inventée. Rendez son absence visible ou demandez-la." },
  2: { title: "Changer de contenu", question: "Pour passer de l’email au tableau opérationnel, quelle adaptation est la plus importante ?", options: ["Ajouter un rôle plus prestigieux à l’IA.", "Changer le format, les colonnes attendues et le statut des informations.", "Allonger toutes les consignes.", "Demander un ton plus créatif."], answer: 1, debrief: "Le type de contenu change les critères de réussite. Le prompt doit surtout rendre le livrable attendu vérifiable." },
  3: { title: "Décision humaine", question: "Un output contient une date non présente dans la source. Quelle décision est la plus appropriée ?", options: ["Le diffuser : la date paraît plausible.", "La conserver mais demander à l’IA de la justifier.", "La marquer comme non justifiée, demander confirmation et corriger l’output.", "Réécrire l’ensemble du prompt."], answer: 2, debrief: "L’IA peut aider à détecter un écart ; elle ne transforme pas une information absente en fait confirmé. La validation reste humaine." },
};

function Quiz({ id, answer, setAnswer, onClose }: { id: number; answer: string; setAnswer: (value: string) => void; onClose: () => void }) {
  const data = quizData[id as keyof typeof quizData];
  return <div className="modal-backdrop"><section className="quiz-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose}>×</button><span className="eyebrow">MICRO-QUIZ · {data.title}</span><h2>{data.question}</h2><div className="quiz-options">{data.options.map((option, index) => <button key={option} className={answer ? (index === data.answer ? "correct" : index === Number(answer) ? "incorrect" : "") : ""} onClick={() => setAnswer(String(index))}><b>{String.fromCharCode(65 + index)}</b>{option}</button>)}</div>{answer && <div className="quiz-debrief"><strong>{Number(answer) === data.answer ? "Bonne décision." : "Regardons le critère décisif."}</strong><p>{data.debrief}</p></div>}</section></div>;
}
