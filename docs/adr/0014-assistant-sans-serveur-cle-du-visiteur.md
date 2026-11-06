# 0014 — Un assistant sans serveur, avec la clé du visiteur

**Précise** [0013](./0013-sans-compte-ni-backend-distant.md) : toujours ni
compte ni backend distant, mais un tiers de plus que le navigateur peut
appeler, à la demande de l'utilisateur.

## Contexte

La spécification 007 publie une démonstration d'AG-UI et de CopilotKit : un
copilote qui règle le convertisseur à partir d'une phrase ou d'une photo. Un
modèle de langage, Claude, doit répondre. Le site est servi par GitHub Pages :
il n'a pas de serveur pour garder une clé d'API ni relayer les appels, et
l'ADR 0013 a écarté tout backend distant.

## Décision

L'agent AG-UI tourne dans la page. Le visiteur qui veut Claude apporte SA clé
(BYOK) ; son navigateur appelle l'API d'Anthropic directement
(`dangerouslyAllowBrowser`, en-tête `anthropic-dangerous-direct-browser-access`).
La clé vit dans `sessionStorage`, le temps de l'onglet. Le copilote est éteint
par défaut, et son modèle par défaut est simulé : rien ne part sans que le
visiteur ait activé le copilote, choisi Claude, lu l'avis et collé sa clé.
La constitution passe en 3.0.0 pour l'admettre (principe II).

Le code du copilote (CopilotKit, le SDK, leur rendu Markdown) est chargé à la
demande et reste hors du précache, sous `assets/copilote/`, nommé sans
empreinte.

## Conséquences

- L'application n'a toujours ni serveur ni secret ; chaque visiteur paie ses
  propres appels, sur son compte Anthropic.
- La clé est lisible par tout script de l'origine dans le même onglet ; les
  applications du parc partagent `mister-guiiug.github.io`, toutes sous la
  même CSP `'self'`. `sessionStorage` borne l'exposition à l'onglet.
- Le copilote est lourd (659 kB gzip pour son morceau principal, plus de
  3 Mo avec les langages de Shiki et les diagrammes de Mermaid que son rendu
  Markdown charge à la demande) ; il ne se télécharge que pour qui l'active,
  et ne marche pas hors ligne.
- Une coquille précachée périmée qui charge le copilote après un déploiement
  reçoit sa version courante (nom stable) : le cas est rare, et le bandeau de
  mise à jour le résout.

## Ce qu'on écarte

**Un relais (Worker Cloudflare, fonction Supabase) avec la clé de
l'exploitant** : il ferait payer chaque visiteur par l'exploitant, et
rouvrirait le backend que 0013 a retiré.

**Le serveur de CopilotKit (`CopilotRuntime`)** : il ajoute une couche entre
l'agent et l'interface, quand la démonstration veut montrer AG-UI nu, et il
demande lui aussi un serveur.

**Précacher le copilote** : plusieurs mégaoctets imposés à chaque visiteur,
pour une démonstration éteinte par défaut.
