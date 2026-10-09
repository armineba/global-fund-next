# Recherche d'assets audio et typographiques

Les fichiers ci-dessous ont été téléchargés pour une utilisation locale dans l'application. Les sons proviennent des packs officiels de Kenney, publiés sous CC0. Les polices et leurs textes OFL proviennent du dépôt officiel Google Fonts.

## Audio

| Fichiers locaux (`apps/web/public/assets/audio/`) | Source officielle / auteur | Licence et modifications |
| --- | --- | --- |
| `dieShuffle1.ogg`, `dieThrow1.ogg`, `dieThrow2.ogg` | [Board Game Pack — Kenney](https://kenney.nl/assets/boardgame-pack), Kenney Vleugels | CC0 1.0, extraits inchangés du ZIP officiel. Licence incluse dans `Kenney-Boardgame-License.txt`. |
| `cardPlace1.ogg`, `cardPlace2.ogg`, `cardSlide1.ogg` | [Board Game Pack — Kenney](https://kenney.nl/assets/boardgame-pack), Kenney Vleugels | CC0 1.0, extraits inchangés du ZIP officiel. Licence incluse dans `Kenney-Boardgame-License.txt`. |
| `chipsCollide1.ogg`, `chipsCollide2.ogg`, `chipsCollide3.ogg` | [Board Game Pack — Kenney](https://kenney.nl/assets/boardgame-pack), Kenney Vleugels | CC0 1.0, extraits inchangés du ZIP officiel. `chipsCollide1.ogg` correspond au son déjà présent sous le nom historique `chips-collide.ogg`. Licence incluse dans `Kenney-Boardgame-License.txt`. |
| `click_001.ogg`, `click_002.ogg`, `select_001.ogg`, `select_002.ogg` | [Interface Sounds — Kenney](https://kenney.nl/assets/interface-sounds), Kenney | CC0 1.0, extraits inchangés du ZIP officiel. Licence incluse dans `Kenney-Interface-License.txt`. |
| `confirmation_001.ogg`, `confirmation_002.ogg`, `error_001.ogg`, `glass_001.ogg`, `glitch_001.ogg`, `open_001.ogg`, `drop_001.ogg` | [Interface Sounds — Kenney](https://kenney.nl/assets/interface-sounds), Kenney | CC0 1.0, extraits inchangés du ZIP officiel. Licence incluse dans `Kenney-Interface-License.txt`. |

Attribution facultative : Kenney / kenney.nl. Les deux ZIP complets ont été récupérés aux liens de téléchargement référencés par les pages officielles; seuls les fichiers listés ont été intégrés.

La sélection téléchargée contient des effets courts, pas de boucle d'ambiance. Aucun démarrage automatique ou cue d'ambiance n'est donc associé au canal `ambience` pour cette sélection.

Proposition de réutilisation pour les cues de jeu : les lancers peuvent alterner `dieThrow1/2` et `dieShuffle1`; les déplacements et voyages peuvent partager `drop_001` ou `cardSlide1`; achat/vente/gains peuvent partager les variantes `cardPlace` et `chipsCollide`; perte/baissier peuvent partager `error_001`; contexte peut utiliser `open_001`; évènement et victoire peuvent partager les confirmations; bull peut réutiliser une confirmation, crash peut réutiliser `glass_001` ou `glitch_001`, prison peut réutiliser le son d'erreur. Le clic UI dispose de `click` et `select`. Ce sont des sons d'interface/génériques dont le réemploi sémantique évite de prétendre qu'ils représentent des enregistrements dédiés au marché ou à la prison.

## Polices

| Fichiers locaux (`apps/web/public/assets/fonts/`) | Source officielle / auteurs | Licence et modifications |
| --- | --- | --- |
| `Inter[opsz,wght].ttf` | [Google Fonts, famille Inter](https://github.com/google/fonts/tree/main/ofl/inter), Inter Project Authors, dirigé par Rasmus Andersson | SIL Open Font License 1.1. Fichier variable non modifié. Texte de licence local : `Inter-OFL.txt`. |
| `IBMPlexMono-Regular.ttf`, `IBMPlexMono-Medium.ttf`, `IBMPlexMono-Bold.ttf` | [Google Fonts, famille IBM Plex Mono](https://github.com/google/fonts/tree/main/ofl/ibmplexmono), IBM Corp.; Mike Abbink et Bold Monday | SIL Open Font License 1.1. Fichiers statiques non modifiés. Texte de licence local : `IBM-Plex-Mono-OFL.txt`. |
| `Cinzel[wght].ttf` | [Google Fonts, famille Cinzel](https://github.com/google/fonts/tree/main/ofl/cinzel), Natanael Gama | SIL Open Font License 1.1. Fichier variable non modifié. Texte de licence local : `Cinzel-OFL.txt`. |
| `CormorantGaramond[wght].ttf` | [Google Fonts, famille Cormorant Garamond](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond), Christian Thalmann | SIL Open Font License 1.1. Fichier variable non modifié. Texte de licence local : `Cormorant-Garamond-OFL.txt`. |

Les pages de métadonnées officielles indiquent la licence OFL : [Inter](https://github.com/google/fonts/blob/main/ofl/inter/METADATA.pb), [IBM Plex Mono](https://github.com/google/fonts/blob/main/ofl/ibmplexmono/METADATA.pb), [Cinzel](https://github.com/google/fonts/blob/main/ofl/cinzel/METADATA.pb), [Cormorant Garamond](https://github.com/google/fonts/blob/main/ofl/cormorantgaramond/METADATA.pb). Inter convient au texte d'interface, IBM Plex Mono aux chiffres/indicateurs financiers, et Cinzel ou Cormorant Garamond aux titres institutionnels.
