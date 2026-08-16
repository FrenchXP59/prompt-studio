"use client";

import { useEffect, useState } from "react";

type Step = "mission" | "sources" | "production" | "image" | "iteration" | "control" | "challenge" | "capitalisation";
type Decision = "Exploitable" | "À corriger ou vérifier" | "À ne pas diffuser" | "";
type DiagnosticChoice = "confirmé" | "à clarifier" | "ne pas inventer" | "";
type ImageClass = "utile" | "vague" | "décorative" | "";

const workshopIntroVideoUrl = "https://www.youtube.com/embed/Z-heGBuUrh0";

const steps: { id: Step; label: string; number: string }[] = [
  { id: "mission", label: "Mission", number: "01" },
  { id: "sources", label: "Texte & sources", number: "02" },
  { id: "production", label: "Production", number: "03" },
  { id: "image", label: "Image", number: "04" },
  { id: "iteration", label: "Itération", number: "05" },
  { id: "control", label: "Contrôle", number: "06" },
  { id: "challenge", label: "Challenge métier", number: "07" },
  { id: "capitalisation", label: "Capitaliser", number: "08" },
];

const sourceFacts = [
  "12 managers volontaires, nommés depuis moins de 18 mois.",
  "Du 6 octobre au 14 novembre 2026 ; charge estimée : 2 h 15.",
  "Un atelier collectif à distance de 90 minutes et un échange de pratiques de 45 minutes en quatrième semaine.",
  "Objectif : préparer un rituel d’équipe de 30 minutes et formuler un retour constructif.",
  "Participation volontaire ; accord du responsable hiérarchique nécessaire.",
  "Le pilote n’est ni certifiant, ni obligatoire, ni lié à l’évaluation de la performance.",
];

const sourceBlock = sourceFacts.map((fact) => "- " + fact).join("\n");

const diagnosticItems = [
  "Un pilote Cap Managers est prévu du 6 octobre au 14 novembre 2026.",
  "Un atelier collectif de 90 minutes et un échange de pratiques de 45 minutes sont prévus.",
  "Le lien d’inscription et la date limite doivent être indiqués dans l’email.",
  "L’email devra mentionner un contact et les modalités techniques de connexion.",
  "Le programme est obligatoire pour tous les managers.",
  "Le programme est certifiant et compte dans l’évaluation annuelle.",
];

const diagnosticDebrief = [
  { status: "confirmé", reason: "Les dates du pilote figurent dans la note validée." },
  { status: "confirmé", reason: "La note précise les deux séquences et leurs durées." },
  { status: "à clarifier", reason: "Ces informations seraient utiles dans l’email, mais ni le lien ni la date limite ne figurent dans les sources." },
  { status: "à clarifier", reason: "Le contact et les modalités techniques peuvent être nécessaires, mais ils ne sont pas fournis." },
  { status: "ne pas inventer", reason: "La note indique explicitement que la participation est volontaire." },
  { status: "ne pas inventer", reason: "La note exclut le caractère certifiant et le lien avec l’évaluation de la performance." },
];

const sampleV1 = [
  "Objet : Inscrivez-vous au programme certifiant Cap Managers",
  "",
  "Bonjour,",
  "",
  "HelioTech lance Cap Managers, un programme obligatoire destiné à tous les managers. À partir du 6 octobre, vous participerez à plusieurs sessions animées par nos experts, avec un atelier collectif, un coaching individuel et des échanges réguliers.",
  "",
  "Ce parcours certifiant sera pris en compte dans votre évaluation annuelle. Merci de vous inscrire avant le 30 septembre sur le portail interne.",
].join("\n");

const iterationPromptTemplate = [
  "Reprends la V1 ci-dessous.",
  "Conserve uniquement les informations confirmées dans les sources.",
  "Raccourcis l’introduction à deux phrases.",
  "Rends explicites l’objectif du programme, le caractère volontaire de la participation et la nécessité de l’accord du responsable hiérarchique.",
  "Ajoute à la fin une check-list « Avant de vous inscrire », limitée à trois points et uniquement à partir des informations disponibles.",
  "Ne crée ni lien, ni date limite, ni modalités techniques absents des sources.",
  "Fournis une V2 complète de l’email.",
  "",
  "Sources :",
  sourceBlock,
  "",
  "V1 à améliorer :",
  "[coller ici la V1]",
].join("\n");

const v2Example = [
  "Objet : Cap Managers — pilote pour managers récemment nommés",
  "",
  "Bonjour,",
  "",
  "HelioTech Services prépare le lancement de Cap Managers, un pilote destiné à 12 managers volontaires nommés depuis moins de 18 mois. L’objectif est de vous aider à préparer un rituel d’équipe de 30 minutes et à formuler un retour constructif.",
  "",
  "Le pilote se déroulera du 6 octobre au 14 novembre 2026. Il comprend un atelier collectif à distance de 90 minutes et un échange de pratiques de 45 minutes en quatrième semaine, pour une charge estimée à 2 h 15.",
  "",
  "Avant de vous inscrire :",
  "- vérifier que vous êtes volontaire pour participer au pilote ;",
  "- obtenir l’accord de votre responsable hiérarchique ;",
  "- noter que les modalités pratiques d’inscription restent à confirmer.",
].join("\n");

const imageStartPrompt = "Crée le portrait professionnel fictif d’une femme dans un bureau.";
const imageLevers = [
  { id: "framing", label: "Plan poitrine, regard caméra, à hauteur des yeux", group: "Cadrage" },
  { id: "light", label: "Lumière naturelle douce depuis la gauche de l’image", group: "Lumière" },
  { id: "lens", label: "Focale portrait et profondeur de champ modérée", group: "Optique" },
  { id: "skin", label: "Texture de peau naturelle, imperfections discrètes, sans effet plastique", group: "Réalisme" },
  { id: "setting", label: "Bureau crédible, sobre, sans éléments parasites", group: "Environnement" },
  { id: "mood", label: "Ambiance éditoriale, rassurante et accessible", group: "Intention" },
];

const imageStatements = [
  { text: "Make it amazing, masterpiece, stunning, best quality", expected: "décorative" as ImageClass },
  { text: "Soft natural window light from camera left", expected: "utile" as ImageClass },
  { text: "85mm portrait lens, eye-level framing, shallow depth of field", expected: "utile" as ImageClass },
  { text: "Make it professional", expected: "vague" as ImageClass },
  { text: "Natural skin texture, subtle imperfections, realistic pores, no plastic skin", expected: "utile" as ImageClass },
];

type AppState = {
  activeStep: Step;
  role: "pilote" | "challenger";
  diagnostic: DiagnosticChoice[];
  diagnosticReviewed: boolean;
  diagnosticQuestion: string;
  productionStage: number;
  productionObjective: string;
  productionSources: string;
  productionConstraints: string;
  productionFormat: string;
  productionRole: string;
  productionPrompt: string;
  productionV1: string;
  imageStage: number;
  imageObservation: string;
  imageClassifications: ImageClass[];
  imageLevers: string[];
  imagePrompt: string;
  imageCompare: string;
  imageParameter: string;
  imagePrediction: string;
  iterationKeep: string;
  iterationModify: string;
  iterationVerify: string;
  iterationPrompt: string;
  iterationRevealed: boolean;
  iteratedOutput: string;
  controlPrompt: string;
  qualityDecision: Decision;
  challengeStage: number;
  challengeAnonymized: boolean;
  finalNeed: string;
  finalSources: string;
  finalUnknowns: string;
  finalPrompt: string;
  finalOutput: string;
  finalControl: string;
  finalDecision: Decision;
  nextAction: string;
  methodStable: string;
  methodVariable: string;
  methodControl: string;
  methodHuman: string;
  methodName: string;
  methodSkillRevealed: boolean;
};

type UpdateApp = <K extends keyof AppState>(key: K, value: AppState[K]) => void;
type GoTo = (step: Step) => void;

const emptyApp: AppState = {
  activeStep: "mission",
  role: "pilote",
  diagnostic: diagnosticItems.map(() => ""),
  diagnosticReviewed: false,
  diagnosticQuestion: "",
  productionStage: 0,
  productionObjective: "",
  productionSources: "",
  productionConstraints: "",
  productionFormat: "",
  productionRole: "",
  productionPrompt: "",
  productionV1: "",
  imageStage: 0,
  imageObservation: "",
  imageClassifications: imageStatements.map(() => ""),
  imageLevers: [],
  imagePrompt: "",
  imageCompare: "",
  imageParameter: "",
  imagePrediction: "",
  iterationKeep: "",
  iterationModify: "",
  iterationVerify: "",
  iterationPrompt: "",
  iterationRevealed: false,
  iteratedOutput: "",
  controlPrompt: "",
  qualityDecision: "",
  challengeStage: 0,
  challengeAnonymized: false,
  finalNeed: "",
  finalSources: "",
  finalUnknowns: "",
  finalPrompt: "",
  finalOutput: "",
  finalControl: "",
  finalDecision: "",
  nextAction: "",
  methodStable: "",
  methodVariable: "",
  methodControl: "",
  methodHuman: "",
  methodName: "",
  methodSkillRevealed: false,
};

function buildProductionPrompt(app: AppState) {
  const lines = [
    app.productionRole.trim() ? "Adopte ce point de vue seulement s’il apporte un vocabulaire ou un regard utile : " + app.productionRole.trim() + "." : "",
    "À partir uniquement des sources autorisées, produis le contenu demandé.",
    "",
    "Objectif : " + (app.productionObjective.trim() || "Présenter le pilote Cap Managers sans inventer les informations absentes."),
    "",
    "Contexte et sources autorisées :",
    app.productionSources.trim() || sourceBlock,
    "",
    "Contraintes et limites :",
    app.productionConstraints.trim() || "Utilise uniquement les faits confirmés. Signale les informations manquantes. Ne présente pas le pilote comme obligatoire, certifiant ou lié à l’évaluation.",
    "",
    "Format attendu : " + (app.productionFormat.trim() || "Un email court avec objet, corps de message et mentions à confirmer si nécessaire."),
    "",
    "Ne complète aucune information absente des sources. Si un point manque, signale-le clairement au lieu de l’inventer.",
  ];
  return lines.filter((line, index) => line || index > 0).join("\n");
}

function buildImagePrompt(app: AppState) {
  const selected = imageLevers.filter((lever) => app.imageLevers.includes(lever.id)).map((lever) => lever.label);
  return [
    "Create a fictional professional editorial portrait of a woman in a credible office.",
    "Purpose: a reassuring, contemporary professional profile image.",
    selected.length ? "Visual choices: " + selected.join("; ") + "." : "Choose only the visual details that serve the intended use.",
    "Do not imitate a real person, do not add text, logos or distorted features.",
  ].join("\n");
}

function buildControlPrompt(app: AppState) {
  return [
    "Contrôle le contenu ci-dessous uniquement au regard des sources fournies.",
    "",
    "Pour chaque affirmation importante, indique si elle est :",
    "- confirmée par les sources ;",
    "- à vérifier car absente ou insuffisamment précise ;",
    "- contradictoire avec les sources.",
    "",
    "Signale les informations absentes qui peuvent empêcher la diffusion.",
    "Ne réécris pas le contenu.",
    "Ne prends pas la décision finale de diffusion : cette décision reste humaine.",
    "",
    "Sources :",
    sourceBlock,
    "",
    "Contenu à contrôler :",
    app.iteratedOutput.trim() || "[coller ici la V2]",
  ].join("\n");
}

function migrateSaved(saved: Record<string, unknown>): AppState {
  const oldSteps: Record<string, Step> = {
    mission: "mission",
    diagnostic: "sources",
    lab: "production",
    iteration: "iteration",
    quality: "control",
    challenge: "challenge",
  };
  const active = typeof saved.activeStep === "string" ? saved.activeStep as Step : oldSteps[String(saved.activeSpace)] || "mission";
  return {
    ...emptyApp,
    ...saved,
    activeStep: steps.some((step) => step.id === active) ? active : "mission",
    diagnostic: Array.isArray(saved.diagnostic) ? diagnosticItems.map((_, index) => saved.diagnostic?.[index] as DiagnosticChoice || "") : emptyApp.diagnostic,
    diagnosticQuestion: String(saved.diagnosticQuestion || saved.questions || ""),
    productionObjective: String(saved.productionObjective || saved.objective || ""),
    productionSources: String(saved.productionSources || saved.sources || ""),
    productionConstraints: String(saved.productionConstraints || saved.constraints || ""),
    productionFormat: String(saved.productionFormat || saved.format || ""),
    productionRole: String(saved.productionRole || saved.rolePrompt || ""),
    productionPrompt: String(saved.productionPrompt || saved.prompt || ""),
    productionV1: String(saved.productionV1 || saved.pastedOutput || ""),
    finalNeed: String(saved.finalNeed || saved.finalCase || ""),
    finalSources: String(saved.finalSources || ""),
    finalUnknowns: String(saved.finalUnknowns || ""),
    finalPrompt: String(saved.finalPrompt || ""),
    finalOutput: String(saved.finalOutput || ""),
    finalControl: String(saved.finalControl || ""),
  };
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text);
}

export default function Home() {
  const [app, setApp] = useState<AppState>(emptyApp);
  const [hydrated, setHydrated] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [quiz, setQuiz] = useState<number | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("prompt-studio-v2") || window.localStorage.getItem("prompt-studio-v1");
    if (raw) {
      try {
        // The browser is the source of truth for this explicitly local workshop state.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setApp(migrateSaved(JSON.parse(raw)));
      } catch {
        window.localStorage.removeItem("prompt-studio-v2");
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("prompt-studio-v2", JSON.stringify(app));
  }, [app, hydrated]);

  const update = <K extends keyof AppState>(key: K, value: AppState[K]) => setApp((current) => ({ ...current, [key]: value }));
  const go = (step: Step) => {
    update("activeStep", step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => go("mission")} aria-label="Retour à la mission">
          <span className="brand-mark">P</span>
          <span>Prompt Studio <small>atelier guidé</small></span>
        </button>
        <div className="header-actions">
          <button className="quiet-button" onClick={() => setPlaygroundOpen(true)}>Expériences facultatives</button>
          <button className="quiet-button" onClick={() => setResourcesOpen(true)}>Pour aller plus loin</button>
        </div>
      </header>

      <nav className="compact-nav" aria-label="Parcours principal">
        {steps.map((step) => (
          <button key={step.id} className={app.activeStep === step.id ? "active" : ""} onClick={() => go(step.id)}>
            <span>{step.number}</span>{step.label}
          </button>
        ))}
      </nav>

      {app.activeStep === "mission" && <Mission app={app} update={update} go={go} openQuiz={() => setQuiz(0)} />}
      {app.activeStep === "sources" && <Sources app={app} update={update} go={go} />}
      {app.activeStep === "production" && <Production app={app} update={update} go={go} />}
      {app.activeStep === "image" && <ImageLab app={app} update={update} go={go} />}
      {app.activeStep === "iteration" && <Iteration app={app} update={update} go={go} />}
      {app.activeStep === "control" && <Control app={app} update={update} go={go} openQuiz={() => setQuiz(2)} />}
      {app.activeStep === "challenge" && <Challenge app={app} update={update} go={go} />}
      {app.activeStep === "capitalisation" && <Capitalisation app={app} update={update} exportSheet={() => window.print()} />}

      {resourcesOpen && <Resources step={app.activeStep} onClose={() => setResourcesOpen(false)} />}
      {playgroundOpen && <Playground onClose={() => setPlaygroundOpen(false)} />}
      {quiz !== null && <Quiz id={quiz} onClose={() => setQuiz(null)} />}

      <footer>
        <span>Frédéric Legrand</span><span>·</span>
        <a href="https://horizonduo.net" target="_blank" rel="noopener noreferrer">horizonduo.net</a><span>·</span>
        <a href="https://www.linkedin.com/in/frederic-legrand-horizonduo/" target="_blank" rel="noopener noreferrer" aria-label="Profil LinkedIn de Frédéric Legrand"><b>in</b> LinkedIn</a><span>·</span>
        <a href="https://www.youtube.com/@3minutes_chrono" target="_blank" rel="noopener noreferrer" aria-label="Chaîne YouTube 3 minutes chrono"><b>▶</b> YouTube — 3 minutes chrono</a>
      </footer>
    </main>
  );
}

function Mission({ app, update, go, openQuiz }: { app: AppState; update: UpdateApp; go: GoTo; openQuiz: () => void }) {
  return <section className="hero-page">
    <p className="eyebrow">ATELIER GUIDÉ</p>
    <h1>Du besoin flou<br /><em>à l’output maîtrisé.</em></h1>
    <p className="lead">Un studio d’expérimentation pour comprendre, prompter, tester, itérer, contrôler et réutiliser.</p>
    <div className="mission-card">
      <div>
        <span className="kicker">MISSION COMMUNE</span>
        <h2>HelioTech Services · Cap Managers</h2>
        <p>Préparer un email fiable à partir de données incomplètes, sans inventer ce que les sources ne disent pas.</p>
      </div>
      <div className="role-choice">
        <span>Premier rôle dans le binôme</span>
        <div>
          <button className={app.role === "pilote" ? "chosen" : ""} onClick={() => update("role", "pilote")}>Pilote</button>
          <button className={app.role === "challenger" ? "chosen" : ""} onClick={() => update("role", "challenger")}>Challenger</button>
        </div>
        <small>Les rôles peuvent s’inverser à tout moment.</small>
      </div>
    </div>
    <div className="mission-grid">
      <article className="notion-card">
        <span className="kicker">LE REPÈRE DU JOUR</span>
        <h2>Une IA ne connaît ni votre contexte, ni vos limites.</h2>
        <p>Elle peut produire une réponse convaincante, mais ne peut pas décider seule ce qui est exact, autorisé ou diffusable.</p>
        <button className="text-button" onClick={openQuiz}>Mini-défi : demande ou source ?</button>
      </article>
      <article className="video-card">
        <span className="kicker">CAPSULE DE LANCEMENT</span>
        <iframe src={workshopIntroVideoUrl} title="Présentation de l’exercice HelioTech" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
      </article>
    </div>
    <div className="action-row">
      <span>Le parcours principal avance par expériences courtes. Les aides apparaissent seulement au moment utile.</span>
      <button className="primary" onClick={() => go("sources")}>Entrer dans le Lab texte <span>→</span></button>
    </div>
  </section>;
}

function Sources({ app, update, go }: { app: AppState; update: UpdateApp; go: GoTo }) {
  const cycle = (index: number) => {
    const order: DiagnosticChoice[] = ["", "confirmé", "à clarifier", "ne pas inventer"];
    const next = order[(order.indexOf(app.diagnostic[index]) + 1) % order.length];
    const diagnostic = [...app.diagnostic];
    diagnostic[index] = next;
    update("diagnostic", diagnostic);
    update("diagnosticReviewed", false);
  };
  return <section className="page-grid">
    <PageHeading eyebrow="LAB TEXTE · SOURCES" title="Avant le prompt, décider ce qui est fiable." text="La demande exprime une intention. La note validée contient les faits utilisables. Votre première tâche : ne pas confondre les deux." />
    <div className="two-col">
      <article className="document dark">
        <span>DOCUMENT A · DEMANDE REÇUE</span>
        <p>« Nous devons communiquer rapidement sur Cap Managers. Il faudrait un message qui donne envie aux managers de participer, et une fiche courte pour suivre le lancement. Nous avons une note, mais il faut que ce soit clair, professionnel et dynamique. »</p>
      </article>
      <article className="document">
        <span>DOCUMENT B · NOTE VALIDÉE</span>
        <ul>{sourceFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
      </article>
    </div>
    <details className="inline-help">
      <summary>Besoin d’un repère ?</summary>
      <p><b>La demande</b> aide à comprendre le besoin. <b>La note validée</b> permet de décider ce qui peut être affirmé. Une absence devient une question ou une limite, jamais un fait inventé.</p>
    </details>
    <section className="activity-card">
      <span className="kicker">VOTRE ACTION</span>
      <h2>Classez les six affirmations.</h2>
      <p>Cliquez sur une carte jusqu’au statut qui vous paraît juste. Le binôme doit pouvoir répondre : « Quelle source le prouve ? »</p>
      <div className="legend"><span><b>Confirmé</b> · la note validée l’affirme</span><span><b>À clarifier</b> · l’information serait utile mais manque</span><span><b>À ne pas inventer</b> · l’affirmation est absente ou contredit les sources</span></div>
      <div className="diagnostic-board">
        {diagnosticItems.map((item, index) => <button key={item} className={"diagnostic-item " + app.diagnostic[index].replaceAll(" ", "-")} onClick={() => cycle(index)}>
          <span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p><em>{app.diagnostic[index] || "à classer"}</em>
        </button>)}
      </div>
      <button className="soft" onClick={() => update("diagnosticReviewed", !app.diagnosticReviewed)}>{app.diagnosticReviewed ? "Masquer le débrief" : "Comparer mon diagnostic"}</button>
      {app.diagnosticReviewed && <div className="debrief-grid">
        {diagnosticDebrief.map((item, index) => <article key={item.reason}><b>{String(index + 1).padStart(2, "0")} · {item.status}</b><p>{item.reason}</p></article>)}
      </div>}
    </section>
    <section className="oral-question">
      <div><span className="kicker">LE CHALLENGER QUESTIONNE</span><h2>Quelles sont les trois informations manquantes qui changeraient le plus le livrable ?</h2><p>Discutez-les d’abord. Ne notez ici que ce que vous voulez conserver pour la suite.</p></div>
      <textarea value={app.diagnosticQuestion} onChange={(event) => update("diagnosticQuestion", event.target.value)} placeholder="Ex. lien d’inscription, date limite, contact…" />
    </section>
    <div className="action-row">
      <span>Le diagnostic s’arrête ici : vous connaissez maintenant les faits, les absences et les limites.</span>
      <button className="primary" onClick={() => go("production")}>Préparer la production <span>→</span></button>
    </div>
  </section>;
}

function Production({ app, update, go }: { app: AppState; update: UpdateApp; go: GoTo }) {
  const stage = app.productionStage;
  const setStage = (next: number) => update("productionStage", next);
  const compose = () => {
    update("productionPrompt", app.productionPrompt.trim() || buildProductionPrompt(app));
    setStage(3);
  };
  return <section className="page-grid">
    <PageHeading eyebrow="LAB TEXTE · PRODUCTION" title="Construire une consigne, puis la tester." text="Le canevas est une aide, pas un formulaire à remplir. Ne précisez que ce qui aide l’IA à produire un résultat utilisable." />
    <section className="guided-card">
      <div className="scene-marker"><span>CONSTRUIRE LA CONSIGNE</span><small>Étape {Math.min(stage + 1, 4)} sur 4</small></div>
      {stage === 0 && <div className="scene">
        <span className="kicker">1 · OBJECTIF</span><h2>Quel résultat voulez-vous obtenir ?</h2>
        <Area label="Objectif de la production" value={app.productionObjective} onChange={(value) => update("productionObjective", value)} placeholder="Ex. rédiger un email qui présente clairement le pilote Cap Managers aux managers concernés." />
        <button className="primary" onClick={() => setStage(1)}>Ajouter le contexte et les sources <span>→</span></button>
      </div>}
      {stage === 1 && <div className="scene">
        <span className="kicker">2 · CONTEXTE ET SOURCES</span><h2>Sur quoi l’IA peut-elle s’appuyer ?</h2>
        <p className="scene-note">La note validée est déjà disponible. Ajoutez seulement un contexte utile ou une source complémentaire autorisée.</p>
        <Area label="Contexte ou sources autorisées" value={app.productionSources} onChange={(value) => update("productionSources", value)} placeholder={sourceBlock} />
        <button className="primary" onClick={() => setStage(2)}>Préciser les limites et le format <span>→</span></button>
      </div>}
      {stage === 2 && <div className="scene">
        <span className="kicker">3 · LIMITES ET FORMAT</span><h2>Que doit respecter la réponse ?</h2>
        <Area label="Contraintes / limites" value={app.productionConstraints} onChange={(value) => update("productionConstraints", value)} placeholder="Ex. ne rien inventer, signaler les informations absentes…" />
        <Field label="Format attendu" value={app.productionFormat} onChange={(value) => update("productionFormat", value)} placeholder="Ex. email court avec objet et informations à confirmer" />
        <details className="role-details"><summary>+ Ajouter un rôle (optionnel)</summary><Field label="Rôle utile" value={app.productionRole} onChange={(value) => update("productionRole", value)} placeholder="Ex. responsable de communication interne" /></details>
        <button className="primary" onClick={compose}>Composer le prompt <span>→</span></button>
      </div>}
      {stage >= 3 && <div className="scene">
        <span className="kicker">4 · PROMPT À TESTER</span><h2>Votre formulation reste libre.</h2>
        <textarea className="prompt-editor" value={app.productionPrompt} onChange={(event) => update("productionPrompt", event.target.value)} placeholder={buildProductionPrompt(app)} />
        <details className="inline-help"><summary>Besoin d’un indice ?</summary><ul><li>Votre objectif est-il clair ?</li><li>Les sources autorisées sont-elles identifiées ?</li><li>Avez-vous prévu le traitement des informations absentes ?</li><li>Le format attendu est-il suffisamment explicite ?</li></ul></details>
        <div className="button-pair"><button className="copy" onClick={() => copyText(app.productionPrompt || buildProductionPrompt(app))}>Copier le prompt</button><button className="soft" onClick={() => setStage(4)}>Passer au test dans l’IA</button></div>
      </div>}
      {stage >= 4 && <div className="scene scene-v1">
        <span className="kicker">RETOUR DE L’IA</span><h2>Collez ici votre V1 obtenue.</h2>
        <p>Une V1 déjà correcte reste intéressante : vous pourrez ensuite l’améliorer et la contrôler. Si vous n’avez pas de V1 exploitable, l’atelier prévoit un exemple de secours.</p>
        <textarea value={app.productionV1} onChange={(event) => update("productionV1", event.target.value)} placeholder="Collez ici la réponse obtenue dans l’IA autorisée…" />
        <button className="primary" onClick={() => go("image")}>Découvrir le Lab image <span>→</span></button>
      </div>}
      {stage > 0 && <div className="scene-back"><button className="text-button" onClick={() => setStage(stage - 1)}>← Revoir l’étape précédente</button></div>}
    </section>
  </section>;
}

function ImageLab({ app, update, go }: { app: AppState; update: UpdateApp; go: GoTo }) {
  const stage = app.imageStage;
  const setStage = (next: number) => update("imageStage", next);
  const toggleLever = (id: string) => update("imageLevers", app.imageLevers.includes(id) ? app.imageLevers.filter((value) => value !== id) : [...app.imageLevers, id]);
  const cycleClass = (index: number) => {
    const values: ImageClass[] = ["", "utile", "vague", "décorative"];
    const classifications = [...app.imageClassifications];
    classifications[index] = values[(values.indexOf(classifications[index]) + 1) % values.length];
    update("imageClassifications", classifications);
  };
  const useImagePrompt = () => {
    update("imagePrompt", app.imagePrompt.trim() || buildImagePrompt(app));
    setStage(4);
  };
  return <section className="page-grid">
    <PageHeading eyebrow="LAB IMAGE · INTENTION VISUELLE" title="Quand l’IA choisit l’image à votre place." text="Un prompt image n’a pas le même vocabulaire qu’un prompt texte. L’enjeu est de rendre les choix visuels importants explicites, sans empiler des mots décoratifs." />
    <section className="image-lab">
      <div className="scene-marker"><span>LABORATOIRE IMAGE</span><small>Expérience {Math.min(stage + 1, 5)} sur 5</small></div>
      {stage === 0 && <div className="scene image-scene">
        <span className="kicker">1 · TESTER UNE V1</span><h2>Commencez volontairement par un prompt pauvre.</h2>
        <blockquote>{imageStartPrompt}</blockquote>
        <p>Testez-le dans l’outil image autorisé. Ne cherchez pas encore à produire une belle image : observez les décisions prises par le modèle.</p>
        <div className="button-pair"><button className="copy" onClick={() => copyText(imageStartPrompt)}>Copier le prompt de départ</button><button className="primary" onClick={() => setStage(1)}>Observer la V1 <span>→</span></button></div>
        <details className="fallback"><summary>Utiliser le secours si aucun outil image n’est disponible</summary><p>Le formateur peut travailler à partir du prompt de départ et demander : « Quel cadrage, quelle lumière, quel décor, quelle ambiance le modèle risque-t-il de choisir sans nous consulter ? » La comparaison reste ensuite possible à partir de la V2 proposée.</p></details>
      </div>}
      {stage === 1 && <div className="scene image-scene">
        <span className="kicker">2 · OBSERVER</span><h2>Qu’est-ce que le modèle a décidé à notre place ?</h2>
        <p>Discutez d’abord. Gardez ici une ou deux observations qui serviront à orienter la V2.</p>
        <Area label="Nos observations" value={app.imageObservation} onChange={(value) => update("imageObservation", value)} placeholder="Ex. le cadrage est très large ; la lumière semble artificielle ; l’ambiance est générique…" />
        <button className="primary" onClick={() => setStage(2)}>Découvrir les leviers visuels <span>→</span></button>
      </div>}
      {stage === 2 && <div className="scene image-scene">
        <span className="kicker">3 · PRÉCISION UTILE ?</span><h2>Retournez les cartes, puis classez les formulations.</h2>
        <div className="flash-grid">{imageLevers.map((lever) => <FlashCard key={lever.id} title={lever.group} text={lever.label} />)}</div>
        <div className="statement-grid">{imageStatements.map((item, index) => <button key={item.text} className={"statement " + app.imageClassifications[index].replaceAll("é", "e")} onClick={() => cycleClass(index)}><span>{item.text}</span><em>{app.imageClassifications[index] || "cliquer pour classer"}</em></button>)}</div>
        <details className="inline-help"><summary>Voir le débrief</summary><p>Les formulations utiles donnent une information exploitable au modèle. Une formule vague exprime une intention sans choix concret. Une formule décorative allonge souvent le prompt sans orienter clairement le résultat.</p></details>
        <button className="primary" onClick={() => setStage(3)}>Choisir les précisions utiles <span>→</span></button>
      </div>}
      {stage === 3 && <div className="scene image-scene">
        <span className="kicker">4 · COMPOSER UNE V2</span><h2>Choisissez les leviers qui servent votre intention.</h2>
        <p>Ne les cochez pas tous : chaque choix doit répondre à une décision visuelle que vous assumez.</p>
        <div className="lever-grid">{imageLevers.map((lever) => <button key={lever.id} className={app.imageLevers.includes(lever.id) ? "chosen" : ""} onClick={() => toggleLever(lever.id)}><small>{lever.group}</small>{lever.label}</button>)}</div>
        <textarea className="prompt-editor" value={app.imagePrompt} onChange={(event) => update("imagePrompt", event.target.value)} placeholder={buildImagePrompt(app)} />
        <details className="inline-help"><summary>Et la langue du prompt ?</summary><p>Selon l’outil, testez une version française puis une version anglaise. L’anglais est une hypothèse à vérifier, pas une règle universelle.</p></details>
        <button className="primary" onClick={useImagePrompt}>Tester la V2 <span>→</span></button>
      </div>}
      {stage >= 4 && <div className="scene image-scene">
        <span className="kicker">5 · COMPARER ET ITÉRER</span><h2>Qu’est-ce qui est maintenant choisi volontairement ?</h2>
        <Area label="V1 / V2 : ce que nous observons" value={app.imageCompare} onChange={(value) => update("imageCompare", value)} placeholder="Ex. le plan est plus cohérent, la lumière sert mieux le portrait, l’ambiance est moins générique…" />
        <div className="parameter-choice"><span>Ne modifiez ensuite qu’un paramètre.</span>{["Lumière", "Cadrage", "Réalisme", "Ambiance"].map((item) => <button key={item} className={app.imageParameter === item ? "chosen" : ""} onClick={() => update("imageParameter", item)}>{item}</button>)}</div>
        <Field label="Effet attendu avant génération" value={app.imagePrediction} onChange={(value) => update("imagePrediction", value)} placeholder="Ex. une lumière latérale rendra le portrait moins plat." />
        <p className="image-note">Ce laboratoire se termine dans l’outil image : générez, comparez, puis revenez ici seulement pour formaliser l’apprentissage.</p>
        <button className="primary" onClick={() => go("iteration")}>Revenir au texte : itérer <span>→</span></button>
      </div>}
      {stage > 0 && <div className="scene-back"><button className="text-button" onClick={() => setStage(stage - 1)}>← Revoir l’expérience précédente</button></div>}
    </section>
  </section>;
}

function Iteration({ app, update, go }: { app: AppState; update: UpdateApp; go: GoTo }) {
  const v1 = app.productionV1.trim() || sampleV1;
  const makeIterationPrompt = () => {
    update("iterationPrompt", app.iterationPrompt.trim() || iterationPromptTemplate.replace("[coller ici la V1]", v1));
    update("iterationRevealed", true);
  };
  return <section className="page-grid">
    <PageHeading eyebrow="LAB TEXTE · ITÉRATION" title="Améliorer sans repartir de zéro." text="Une bonne itération conserve ce qui fonctionne, précise ce qui doit évoluer et rappelle les limites qui ne doivent pas bouger." />
    <section className="iteration-layout">
      <article className="v1-card">
        <span className="kicker">V1 À OBSERVER</span><h2>Le premier résultat</h2>
        <textarea value={v1} onChange={(event) => update("productionV1", event.target.value)} aria-label="V1 à observer" />
        {!app.productionV1.trim() && <small>Exemple de secours affiché : utilisez-le si votre test réel ne fournit pas de matière suffisante.</small>}
      </article>
      <article className="guided-card compact-card">
        <span className="kicker">VOTRE RETOUR</span><h2>Qu’est-ce qui vous gêne ?</h2>
        <p>Relevez ensemble trois éléments : à conserver, à modifier ou à vérifier.</p>
        <Field label="À conserver" value={app.iterationKeep} onChange={(value) => update("iterationKeep", value)} placeholder="Ex. ton clair, structure courte…" />
        <Field label="À modifier" value={app.iterationModify} onChange={(value) => update("iterationModify", value)} placeholder="Ex. rendre l’objectif et le volontariat plus visibles…" />
        <Field label="À vérifier" value={app.iterationVerify} onChange={(value) => update("iterationVerify", value)} placeholder="Ex. aucun délai, lien ou horaire inventé…" />
        <details className="inline-help"><summary>Besoin d’un indice ?</summary><p>L’intention est-elle claire ? Ce qui est attendu est-il explicite ? Une information sans source a-t-elle été ajoutée ?</p></details>
        <button className="primary" onClick={makeIterationPrompt}>Préparer l’instruction <span>→</span></button>
      </article>
      {app.iterationRevealed && <article className="v2-card">
        <span className="kicker">TESTER UNE V2</span><h2>Une instruction précise, puis un nouveau test.</h2>
        <textarea value={app.iterationPrompt} onChange={(event) => update("iterationPrompt", event.target.value)} />
        <button className="copy" onClick={() => copyText(app.iterationPrompt)}>Copier l’instruction</button>
        <Area label="Collez ici votre V2" value={app.iteratedOutput} onChange={(value) => update("iteratedOutput", value)} placeholder="Collez la V2 obtenue dans l’IA autorisée…" />
        {app.iteratedOutput.trim() && <details className="reference"><summary>Comparer à une proposition de référence</summary><pre>{v2Example}</pre></details>}
      </article>}
    </section>
    <div className="action-row">
      <span>La référence n’apparaît qu’après votre propre essai.</span>
      <button className="primary" onClick={() => go("control")}>Contrôler la V2 <span>→</span></button>
    </div>
  </section>;
}

function Control({ app, update, go, openQuiz }: { app: AppState; update: UpdateApp; go: GoTo; openQuiz: () => void }) {
  const prompt = app.controlPrompt || buildControlPrompt(app);
  return <section className="page-grid">
    <PageHeading eyebrow="LAB TEXTE · CONTRÔLE" title="Une réponse fluide n’est pas forcément exploitable." text="Le prompt de contrôle aide à repérer les affirmations non justifiées. Il ne décide jamais à la place d’une personne." />
    <section className="control-layout">
      <article className="notion-card">
        <span className="kicker">À QUOI SERT LE CONTRÔLE ?</span>
        <h2>Relire avec un cadre.</h2>
        <ul><li>Vérifier le respect de la consigne.</li><li>Repérer les affirmations non justifiées.</li><li>Identifier ce qui reste à confirmer.</li></ul>
        <p><b>Rappel :</b> l’IA peut aider à relire sa réponse ; la décision finale reste humaine.</p>
        <button className="text-button" onClick={openQuiz}>Mini-défi : décision humaine</button>
      </article>
      <article className="control-card">
        <span className="kicker">PROMPT DE CONTRÔLE</span><h2>Un seul prompt, à adapter si nécessaire.</h2>
        <textarea value={prompt} onChange={(event) => update("controlPrompt", event.target.value)} />
        <button className="copy" onClick={() => copyText(prompt)}>Copier le prompt de contrôle</button>
      </article>
      <article className="example-card">
        <span className="kicker">UN EXEMPLE</span><h2>Affirmation → constat → correction</h2>
        <dl><dt>« Inscription avant le 25 septembre »</dt><dd>La date n’apparaît dans aucune source.</dd><dd>La retirer ou demander confirmation avant diffusion.</dd></dl>
        <div className="decision-area"><span>Décision humaine sur la V2</span>{(["Exploitable", "À corriger ou vérifier", "À ne pas diffuser"] as Decision[]).map((item) => <button key={item} className={app.qualityDecision === item ? "chosen" : ""} onClick={() => update("qualityDecision", item)}>{item}</button>)}</div>
      </article>
    </section>
    <div className="action-row">
      <span>Un contrôle utile rend visibles les écarts ; il ne les efface pas.</span>
      <button className="primary" onClick={() => go("challenge")}>Appliquer la méthode à mon métier <span>→</span></button>
    </div>
  </section>;
}

function Challenge({ app, update, go }: { app: AppState; update: UpdateApp; go: GoTo }) {
  const stage = app.challengeStage;
  const setStage = (next: number) => update("challengeStage", next);
  return <section className="page-grid challenge-page">
    <PageHeading eyebrow="CHALLENGE MÉTIER" title="Transférer la méthode à une vraie tâche." text="Partez d’abord d’une situation professionnelle réelle. Le cas fictif n’est là que si vous ne pouvez pas utiliser un cas anonymisé aujourd’hui." />
    <section className="challenge-card">
      <div className="scene-marker"><span>MON CAS PROFESSIONNEL</span><small>Étape {Math.min(stage + 1, 4)} sur 4</small></div>
      {stage === 0 && <div className="scene">
        <span className="kicker">1 · MON BESOIN PROFESSIONNEL</span><h2>Quelle tâche pourriez-vous mieux encadrer avec l’IA ?</h2>
        <p>Exemples : email, synthèse, préparation pédagogique, compte rendu, procédure, communication, tableau, FAQ, analyse de document.</p>
        <label className="privacy-check"><input type="checkbox" checked={app.challengeAnonymized} onChange={(event) => update("challengeAnonymized", event.target.checked)} /><span>Mon cas est anonymisé et l’outil choisi est autorisé.</span></label>
        <Area label="Mon besoin / livrable" value={app.finalNeed} onChange={(value) => update("finalNeed", value)} placeholder="Décrivez une tâche réelle que vous réalisez ou allez réaliser." />
        <details className="fallback"><summary>Je préfère utiliser le cas fictif de secours</summary><p>Préparer une synthèse claire à partir de notes de réunion incomplètes, sans attribuer de décisions ou d’actions qui ne figurent pas dans les notes.</p></details>
        <button className="primary" onClick={() => setStage(1)}>Identifier mes sources et limites <span>→</span></button>
      </div>}
      {stage === 1 && <div className="scene">
        <span className="kicker">2 · MES SOURCES ET LIMITES</span><h2>De quoi l’IA dispose-t-elle vraiment ?</h2>
        <Area label="Sources autorisées" value={app.finalSources} onChange={(value) => update("finalSources", value)} placeholder="Documents validés, notes anonymisées, référentiels, données publiques…" />
        <Area label="Ce qu’il ne faut pas inventer" value={app.finalUnknowns} onChange={(value) => update("finalUnknowns", value)} placeholder="Faits, dates, décisions, données personnelles ou interprétations à confirmer…" />
        <button className="primary" onClick={() => setStage(2)}>Préparer mon prompt et mon test <span>→</span></button>
      </div>}
      {stage === 2 && <div className="scene">
        <span className="kicker">3 · MON PROMPT / MON TEST</span><h2>Écrivez seulement ce dont vous avez besoin pour essayer.</h2>
        <textarea className="prompt-editor" value={app.finalPrompt} onChange={(event) => update("finalPrompt", event.target.value)} placeholder="Votre prompt de production, librement formulé…" />
        <Area label="Résultat obtenu ou protocole de test" value={app.finalOutput} onChange={(value) => update("finalOutput", value)} placeholder="Ce que vous allez observer ou la V1 déjà obtenue…" />
        <button className="primary" onClick={() => setStage(3)}>Prévoir mon contrôle <span>→</span></button>
      </div>}
      {stage >= 3 && <div className="scene">
        <span className="kicker">4 · MON CONTRÔLE</span><h2>Comment saurez-vous que le résultat est utilisable ?</h2>
        <Area label="Contrôle prévu" value={app.finalControl} onChange={(value) => update("finalControl", value)} placeholder="Ex. comparer aux sources, faire relire, vérifier les chiffres, valider le ton…" />
        <div className="decision-area"><span>Décision humaine attendue</span>{(["Exploitable", "À corriger ou vérifier", "À ne pas diffuser"] as Decision[]).map((item) => <button key={item} className={app.finalDecision === item ? "chosen" : ""} onClick={() => update("finalDecision", item)}>{item}</button>)}</div>
        <Field label="Prochaine action concrète" value={app.nextAction} onChange={(value) => update("nextAction", value)} placeholder="Ex. tester le prompt sur un dossier validé, puis le faire relire par…" />
        <button className="primary" onClick={() => go("capitalisation")}>Et si je devais refaire cette tâche ? <span>→</span></button>
      </div>}
      {stage > 0 && <div className="scene-back"><button className="text-button" onClick={() => setStage(stage - 1)}>← Revoir l’étape précédente</button></div>}
    </section>
  </section>;
}

function Capitalisation({ app, update, exportSheet }: { app: AppState; update: UpdateApp; exportSheet: () => void }) {
  return <section className="page-grid capitalisation-page">
    <PageHeading eyebrow="CAPITALISER" title="Du prompt à la méthode réutilisable." text="Une tâche récurrente devient plus simple quand on sépare ce qui reste stable de ce qui varie, de ce qui doit être contrôlé et de ce qui reste humain." />
    <section className="method-section">
      <div className="method-question">« Si vous deviez refaire cette tâche chaque semaine, qu’auriez-vous intérêt à ne plus réexpliquer à l’IA ? »</div>
      <div className="method-grid">
        <Area label="Stable" value={app.methodStable} onChange={(value) => update("methodStable", value)} placeholder="Structure, ton, règles, étapes…" />
        <Area label="Variable" value={app.methodVariable} onChange={(value) => update("methodVariable", value)} placeholder="Données, public, période, objectif…" />
        <Area label="Contrôle" value={app.methodControl} onChange={(value) => update("methodControl", value)} placeholder="Sources à comparer, critères, alertes…" />
        <Area label="Humain" value={app.methodHuman} onChange={(value) => update("methodHuman", value)} placeholder="Arbitrage, validation, diffusion…" />
      </div>
      <div className="method-summary">
        <Field label="Nom simple de ma méthode" value={app.methodName} onChange={(value) => update("methodName", value)} placeholder="Ex. Préparer une synthèse fiable" />
        <p>Relisez en binôme : une décision humaine n’est pas une instruction qu’il suffirait de déléguer à l’IA.</p>
        <button className="soft" onClick={() => update("methodSkillRevealed", !app.methodSkillRevealed)}>{app.methodSkillRevealed ? "Masquer l’ouverture" : "Voir ce que cette méthode peut devenir"}</button>
      </div>
      {app.methodSkillRevealed && <div className="skill-reveal"><span className="kicker">OUVERTURE</span><h2>Cette méthode est la matière première d’un Skill.</h2><p>Un Skill structure une méthode réutilisable : ses instructions stables, ses variables, ses ressources, ses contrôles et les validations humaines à conserver. Une démonstration peut suivre, sans dépendre d’une plateforme particulière.</p></div>}
    </section>
    <section className="export-panel">
      <div><span className="kicker">VOTRE FICHE PARTICIPANT</span><h2>Une prochaine action, un prompt, un contrôle et une méthode.</h2><p>Les données restent sur cet appareil jusqu’à leur export ou leur effacement local.</p></div>
      <button className="primary" onClick={exportSheet}>Exporter / imprimer <span>↗</span></button>
    </section>
  </section>;
}

function PageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <div className="page-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div>;
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function Area({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="area"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

function FlashCard({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false);
  return <button className={"flash-card " + (open ? "open" : "")} onClick={() => setOpen(!open)}><small>{title}</small><b>{open ? text : "Retourner la carte"}</b><span>{open ? "Masquer" : "Découvrir"}</span></button>;
}

function Resources({ step, onClose }: { step: Step; onClose: () => void }) {
  const contextual: Record<Step, { title: string; text: string }> = {
    mission: { title: "Le parcours", text: "Le studio fait alterner diagnostic, test réel, itération, contrôle et transfert." },
    sources: { title: "Demande ou source ?", text: "Une demande aide à comprendre l’intention ; une source validée établit les faits utilisables." },
    production: { title: "Les quatre repères", text: "Objectif, sources, limites et format : quatre points suffisent souvent à orienter une production." },
    image: { title: "Prompt image", text: "Une précision est utile lorsqu’elle traduit une décision visuelle exploitable par le modèle." },
    iteration: { title: "Itérer", text: "Un bon retour précise ce qui est à conserver, modifier ou vérifier." },
    control: { title: "Contrôler", text: "L’IA peut mettre en évidence un écart ; la décision de diffusion reste humaine." },
    challenge: { title: "Transférer", text: "Utilisez un cas réel anonymisé en priorité. Le cas fictif reste une solution de secours." },
    capitalisation: { title: "Réutiliser", text: "Séparer stable, variable, contrôle et humain prépare une méthode réutilisable." },
  };
  return <Drawer title="Pour aller plus loin" onClose={onClose}>
    <article className="context-resource"><span className="kicker">REPÈRE CONTEXTUEL</span><h3>{contextual[step].title}</h3><p>{contextual[step].text}</p></article>
    <p className="drawer-intro">Les fiches complètent l’atelier. Elles ne remplacent pas les expériences en cours.</p>
    <div className="resource-list">
      <a href="/resources/pack-fiches-prompt-engineering.pdf" target="_blank" rel="noopener noreferrer">Pack de 4 fiches : ROCOF, itération, contrôle, boîte à outils <small>PDF</small></a>
      <a href="/resources/prompt-engineering-2026.pdf" target="_blank" rel="noopener noreferrer">Le prompt engineering est-il encore nécessaire en 2026 ? <small>PDF</small></a>
    </div>
  </Drawer>;
}

function Playground({ onClose }: { onClose: () => void }) {
  const [activity, setActivity] = useState("battle");
  const [battle, setBattle] = useState("");
  const [repair, setRepair] = useState<string[]>([]);
  const [useless, setUseless] = useState("");
  const [imageChange, setImageChange] = useState("");
  const repairOptions = ["Nommer le livrable attendu", "Indiquer les sources autorisées", "Ajouter une limite d’invention", "Ajouter dix adjectifs valorisants", "Demander un rôle sans utilité"];
  const toggleRepair = (item: string) => setRepair((current) => current.includes(item) ? current.filter((value) => value !== item) : current.length < 3 ? [...current, item] : current);
  return <Drawer title="Expériences facultatives" onClose={onClose} wide>
    <p className="drawer-intro">Réserve activable par le formateur : ouvrez une expérience, animez-la, puis refermez-la. Le parcours principal et ses données ne changent pas.</p>
    <div className="playground-tabs">
      <button className={activity === "battle" ? "active" : ""} onClick={() => setActivity("battle")}>Prompt Battle</button>
      <button className={activity === "repair" ? "active" : ""} onClick={() => setActivity("repair")}>Prompt Repair</button>
      <button className={activity === "useless" ? "active" : ""} onClick={() => setActivity("useless")}>La consigne inutile</button>
      <button className={activity === "image" ? "active" : ""} onClick={() => setActivity("image")}>Image Challenge</button>
    </div>
    {activity === "battle" && <section className="play-activity"><span className="kicker">PROMPT BATTLE</span><h3>Lequel donne les instructions les plus utiles ?</h3><div className="battle-grid"><button className={battle === "a" ? "chosen" : ""} onClick={() => setBattle("a")}><b>A</b> « Rédige un email professionnel et impactant sur Cap Managers. »</button><button className={battle === "b" ? "chosen" : ""} onClick={() => setBattle("b")}><b>B</b> « À partir de la note validée, rédige un email court. N’invente aucun lien, délai ou horaire absent des sources et signale les éléments à confirmer. »</button></div>{battle && <p className="play-debrief"><b>Débrief :</b> B apporte une source, une limite et un comportement attendu face aux informations absentes. Le ton n’est utile que s’il sert un usage clair.</p>}</section>}
    {activity === "repair" && <section className="play-activity"><span className="kicker">PROMPT REPAIR</span><h3>Vous avez droit à trois modifications.</h3><p>« Fais-moi une bonne synthèse de ce document, très professionnelle, complète et parfaite. »</p><div className="choice-list">{repairOptions.map((item) => <button key={item} className={repair.includes(item) ? "chosen" : ""} onClick={() => toggleRepair(item)}>{repair.includes(item) ? "✓" : "○"} {item}</button>)}</div>{repair.length === 3 && <p className="play-debrief"><b>Débrief :</b> priorisez le livrable, les sources et les limites. Les adjectifs ne réparent pas un manque de contexte.</p>}</section>}
    {activity === "useless" && <section className="play-activity"><span className="kicker">LA CONSIGNE INUTILE</span><h3>Quelle instruction allonge le prompt sans guider réellement le modèle ?</h3><div className="choice-list">{["« Utilise uniquement les notes jointes. »", "« Produis une synthèse en trois parties. »", "« Fais quelque chose d’incroyable, parfait et exceptionnel. »", "« Signale les décisions qui ne sont pas explicitement documentées. »"].map((item, index) => <button key={item} className={useless === String(index) ? "chosen" : ""} onClick={() => setUseless(String(index))}>{item}</button>)}</div>{useless && <p className="play-debrief"><b>Débrief :</b> la troisième formule est décorative : elle exprime un désir, mais ne donne pas de critère opérationnel.</p>}</section>}
    {activity === "image" && <section className="play-activity"><span className="kicker">IMAGE CHALLENGE</span><h3>Modifiez un seul paramètre et anticipez l’effet.</h3><div className="choice-list">{["Lumière latérale douce", "Plan plus serré", "Texture de peau naturelle", "Ambiance plus institutionnelle"].map((item) => <button key={item} className={imageChange === item ? "chosen" : ""} onClick={() => setImageChange(item)}>{item}</button>)}</div>{imageChange && <p className="play-debrief"><b>Question avant génération :</b> que devrait changer « {imageChange} » dans le résultat ? Testez ensuite cette seule variable dans l’outil image.</p>}</section>}
  </Drawer>;
}

function Drawer({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return <div className="modal-backdrop" role="presentation"><aside className={"drawer " + (wide ? "drawer-wide" : "")} role="dialog" aria-modal="true" aria-label={title}><div className="drawer-top"><div><span className="eyebrow">ATELIER</span><h2>{title}</h2></div><button className="modal-close" onClick={onClose} aria-label="Fermer">×</button></div>{children}</aside></div>;
}

const quizData = {
  0: { title: "Demande ou source ?", question: "Avant de demander un contenu à une IA, quel document permet de décider ce qui peut être affirmé ?", options: ["La demande reçue, car elle donne le ton.", "Le document le plus long.", "La note validée, car elle établit les faits utilisables.", "L’output le plus convaincant."], answer: 2, debrief: "La demande aide à comprendre l’intention. La note validée établit les faits utilisables : ce qui n’y figure pas doit rester à confirmer." },
  1: { title: "Précision image", question: "Quelle formulation apporte le plus d’information directement exploitable à un générateur d’image ?", options: ["Make it amazing.", "Make it professional.", "Soft natural window light from camera left.", "Masterpiece, best quality."], answer: 2, debrief: "Une précision utile décrit un choix concret. Elle ne garantit pas un résultat parfait, mais elle réduit la part laissée au modèle." },
  2: { title: "Décision humaine", question: "Un output contient une date absente de la source. Quelle action est la plus rigoureuse ?", options: ["La diffuser : elle paraît plausible.", "Demander à l’IA de la justifier.", "La marquer à vérifier, demander confirmation et corriger l’output.", "Réécrire tout le prompt."], answer: 2, debrief: "L’IA peut signaler un écart ; elle ne transforme pas une information absente en fait confirmé. La décision de diffusion reste humaine." },
};

function Quiz({ id, onClose }: { id: number; onClose: () => void }) {
  const [answer, setAnswer] = useState<number | null>(null);
  const data = quizData[id as keyof typeof quizData];
  return <div className="modal-backdrop" role="presentation"><section className="quiz-modal" role="dialog" aria-modal="true"><button className="modal-close" onClick={onClose}>×</button><span className="eyebrow">MINI-DÉFI · {data.title}</span><h2>{data.question}</h2><div className="quiz-options">{data.options.map((option, index) => <button key={option} className={answer === null ? "" : index === data.answer ? "correct" : answer === index ? "incorrect" : ""} onClick={() => setAnswer(index)}><b>{String.fromCharCode(65 + index)}</b>{option}</button>)}</div>{answer !== null && <div className="quiz-debrief"><strong>{answer === data.answer ? "Le raisonnement est juste." : "Regardons le critère décisif."}</strong><p>{data.debrief}</p></div>}</section></div>;
}
