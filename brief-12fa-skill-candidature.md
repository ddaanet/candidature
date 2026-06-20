## Brief: 12FA-fication du skill candidature (contrôle de flux et état)

2026-06-19

Cible : agent Claude Code dans le repo `candidature`. Objectif : durcir le
skill `skills/candidature/` pour qu'il ne puisse plus dériver entre phases
sous l'effet du momentum. Cadre : 12-factor agents (facteur 8 own your control
flow, facteur 12 stateless reducer / transitions d'état explicites).

### Le bug déclencheur (trace concrète)

Survenu pendant une candidature Goodays en cours (`candidatures/2026-06-19-goodays/`
dans le repo de données). Séquence : le candidat trie des offres, puis décide
« candidater maintenant ». L'agent **est resté dans `preparation.md`** (déjà en
contexte) et a rédigé une lettre de motivation — un artefact de phase
soumission — **avant d'ouvrir le formulaire de candidature**. La discipline
« formulaire d'abord, rédaction ensuite » vit uniquement dans la phase
soumission, jamais chargée. L'agent avait même explicitement formulé le doute
(« la lettre, c'est préparation ou soumission ? ») puis l'a rationalisé en
« le candidat veut de l'output ».

### Cause racine

La transition de phase est tenue par de la **prose, pas par un mécanisme**.
Sur changement de contexte (« candidater »), `SKILL.md` §5 demande de
réévaluer le routage, mais rien ne *force* le retour au dispatcher. L'agent
continue d'exécuter la phase déjà en mémoire.

### Décisions / direction de correction

- **Transition de phase = mécanisme, pas convention.** Fin de phase → émission
  d'un état explicite (`phase=preparation, done`) → le dispatcher reprend la
  main systématiquement. L'intention « le dispatcher seul décide / les phases
  ne se chargent pas entre elles » est déjà 12FA, mais non outillée.
- **Garde « form-first » réifiée et attachée à l'artefact, pas à la phase.**
  Invariant vérifiable du type « aucun texte de candidature généré tant que les
  champs du formulaire ne sont pas capturés en état ». Aujourd'hui la garde est
  invisible si la phase soumission n'est pas chargée.
- **État réifié dans le repo.** Porter l'état d'avancement (phase, étapes
  faites) dans le frontmatter du README de candidature, lu/écrit par chaque
  phase. La frontière préparation/soumission doit vivre dans le fichier, pas
  dans la tête de l'agent. Cohérent avec le design « index régénéré depuis les
  frontmatter, jamais stocké ».

### Pattern à chasser dans tout le skill

Chaque « réévaluer », « le candidat décide », « quand le contexte change »
**sans point de contrôle qui l'impose** est un endroit où le momentum
court-circuite. Ce sont les cibles.

### Approche rejetée

« L'agent doit juste être plus prudent » — c'est précisément la convention qui
a déjà échoué. Le correctif doit être structurel, pas une consigne de vigilance
supplémentaire.

### Contraintes

- Repo public d'outillage `candidature`. Skill en version 0.6.0 (voir en-tête
  de `SKILL.md`) — bumper en conséquence.
- Ne pas casser le design fichiers : pas d'index stocké, frontmatter source de
  vérité, écritures ciblées (`references/backend-write.md`).

### Références concrètes (fichiers du repo)

- `skills/candidature/SKILL.md` — dispatcher, §4 routage / §5 transitions.
- `skills/candidature/references/preparation.md` — §2.6 finit sur le CV sans
  rendre la main au dispatcher (enabler n°1).
- `skills/candidature/references/soumission.md` — porte la discipline
  « form-first » hors de portée quand non chargée (où la garde vit aujourd'hui).
- `skills/candidature/references/etayage.md` — présuppose qu'un brouillon
  existe déjà (« le brouillon a été écrit dans candidatures/<slug>/ ») ; a servi
  de fausse caution pour justifier une rédaction hors séquence.
