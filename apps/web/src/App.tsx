import Game from "./game/GameWorld";
import MainMenu from "./game/MainMenu";
import Pawn from "./game/Pawn";
import Chat from "./game/Chat";
import StartingMarketPicker from "./game/StartingMarketPicker";
import { MARKET_PLACES } from "./game/marketPlaceVisuals";
import { usePresentationSettings, setPresentationSettings } from "./presentation/settings";
import "./game/game-world.css";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Globe2,
  Volume2,
  VolumeX,
  Settings2,
  X,
  Wifi,
  ChevronRight,
  Users,
} from "lucide-react";
import {
  PAWNS,
  diversifyStartingMarkets,
  type GameCommand,
  type GameView,
  type PawnId,
  type RoomView,
  type SeatConfig,
  type ZoneId,
} from "@global-fund/shared";
import { formatMoney } from "@global-fund/ui";
const BoardScene = lazy(() => import("./board/BoardScene"));
const TradingDesk = lazy(() => import("./trading/TradingDesk"));
import CardScene from "./presentation/CardScene";
import {
  getAudioSettings,
  setAudioSettings,
  unlockAudio,
  playCue,
  type AudioSettings,
} from "./presentation/audio";
import { useGameStore, createRoom, joinRoom, request, command } from "./store";
import { useDialogFocus } from "./presentation/useDialogFocus";
import { loadSetupDraft, saveSetupDraft } from "./setupDraft";

const diversifiedMarkets: ZoneId[] = [
  "europe", "americas", "asia", "africa", "oceania", "europe",
];
const marketName = (id: ZoneId) =>
  MARKET_PLACES.find((place) => place.id === id)?.name ?? "Europe";
function Brand() {
  return (
    <div className="brand">
      <span className="brand-emblem">
        <Globe2 size={26} />
      </span>
      <span>
        <b>
          GLOBAL <em>FUND</em>
        </b>
        <small>STRATÉGIE · CAPITAL · INFLUENCE</small>
      </span>
    </div>
  );
}

function Home({ mode, onBack, onMode }: { mode: "create" | "join"; onBack: () => void; onMode: (mode: "create" | "join") => void }) {
  const [initialDraft] = useState(() => {
    const draft = loadSetupDraft();
    const invitation = new URLSearchParams(location.search).get("room");
    return invitation ? { ...draft, join: invitation.slice(0, 8) } : draft;
  });
  const [allSeats, setAllSeats] = useState<SeatConfig[]>(initialDraft.seats);
  const [seatCount, setSeatCount] = useState(initialDraft.seatCount);
  const seats = allSeats.slice(0, seatCount);
  const [join, setJoin] = useState(initialDraft.join);
  const [name, setName] = useState(initialDraft.name);
  const [startingMarket, setStartingMarket] = useState<ZoneId>(initialDraft.startingMarket);
  const [joinPawn, setJoinPawn] = useState<PawnId>(initialDraft.joinPawn);
  const [createStep, setCreateStep] = useState<"funds" | "markets">(initialDraft.createStep);
  const [activeHuman, setActiveHuman] = useState(initialDraft.activeHuman);
  const pending = useGameStore((s) => s.pending);
  const connected = useGameStore((s) => s.connected);
  useEffect(() => {
    saveSetupDraft({ seats: allSeats, seatCount, createStep, activeHuman, join, name, startingMarket, joinPawn });
  }, [allSeats, seatCount, createStep, activeHuman, join, name, startingMarket, joinPawn]);
  const update = (index: number, patch: Partial<SeatConfig>) =>
    setAllSeats((current) =>
      current.map((seat, i) => (i === index ? { ...seat, ...patch } : seat)),
    );
  const resize = (count: number) => {
    setAllSeats((current) => Array.from(
      { length: Math.max(count, current.length) },
      (_, i) => current[i] || {
            name: `Fonds ${i + 1}`,
            kind: "ai",
            startingMarket: diversifiedMarkets[i],
            pawn: PAWNS[i].id,
            difficulty: "normal",
          },
    ));
    setSeatCount(count);
  };
  const plannedSeats = diversifyStartingMarkets(seats);
  const humanSeats = seats.flatMap((seat, index) =>
    seat.kind === "ai" ? [] : [{ seat, index }],
  );
  const activeHumanIndex = humanSeats.some(({ index }) => index === activeHuman)
    ? activeHuman
    : (humanSeats[0]?.index ?? 0);
  const activeHumanSeat = seats[activeHumanIndex];
  return (
    <main className={`home-scene home-${mode}`}>
      <button className="setup-back outline-button" onClick={onBack}>← Retour au menu</button>
      <div className="home-art" />
      <section className="home-story">
        <span className="eyebrow">
          <i /> GLOBAL FUND NEXT · ÉDITION 2026
        </span>
        <h1>
          Le monde est
          <br />
          votre <em>marché.</em>
        </h1>
        <p>
          Anticipez les cycles. Prenez le contrôle.
          <br />
          Faites de votre fonds une puissance mondiale.
        </p>
        <div className="hero-stats">
          <span>
            <b>100 M€</b>capital de départ
          </span>
          <span>
            <b>91</b>entreprises
          </span>
          <span>
            <b>52</b>semaines par tour
          </span>
        </div>
        <div className="hero-caption">
          <Globe2 />
          <span>
            5 zones économiques · 9 secteurs
            <br />
            <small>Chaque décision laisse une empreinte.</small>
          </span>
        </div>
      </section>
      <section className="setup-console">
        <div className="creation-controls">
          <div className="console-heading">
            <div>
              <span className="eyebrow">
                {createStep === "funds" ? "ÉTAPE 1/2 · CONFIGURATION" : "ÉTAPE 2/2 · IMPLANTATION"}
              </span>
              <h2>{createStep === "funds" ? "Configurez les fonds." : "Choisissez les places financières."}</h2>
            </div>
            <Users />
          </div>
          {createStep === "funds" ? (
            <div className="fund-setup-step" data-testid="setup-step-funds">
              <p className="muted">
                De 2 à 6 fonds humains ou IA. Réglez leurs noms, pions et difficultés.
              </p>
              <label className="seat-count">
                Places à la table{" "}
                <select
                  aria-label="Nombre de joueurs"
                  value={seats.length}
                  onChange={(e) => resize(Number(e.target.value))}
                >
                  {[2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} investisseurs</option>
                  ))}
                </select>
              </label>
              <div className="setup-seats">
                {seats.map((seat, index) => (
            <article className="setup-seat" key={index}>
              <div className="seat-number">0{index + 1}</div>
              <div className="seat-config">
                <div className="seat-first-line">
                  <input
                    aria-label={`Nom du fonds ${index + 1}`}
                    value={seat.name}
                    maxLength={40}
                    onChange={(e) => update(index, { name: e.target.value })}
                  />
                  <select
                    aria-label={`Type du joueur ${index + 1}`}
                    value={seat.kind}
                    disabled={index === 0}
                    onChange={(e) =>
                      update(index, {
                        kind: e.target.value as SeatConfig["kind"],
                      })
                    }
                  >
                    <option value="local">Humain · même écran</option>
                    <option value="remote">Humain · à distance</option>
                    <option value="ai">IA</option>
                  </select>
                </div>
                {seat.kind === "ai" && (
                  <div className="seat-second-line">
                    <select
                      aria-label={`Difficulté de l’IA ${index + 1}`}
                      value={seat.difficulty}
                      onChange={(e) =>
                        update(index, {
                          difficulty: e.target
                            .value as SeatConfig["difficulty"],
                        })
                      }
                    >
                      <option value="easy">Prudente</option>
                      <option value="normal">Stratège</option>
                      <option value="hard">Experte</option>
                    </select>
                  </div>
                )}
                <div
                  className="pawn-picker"
                  role="radiogroup"
                  aria-label={`Pion du joueur ${index + 1}`}
                >
                  {PAWNS.map((p) => (
                    <button
                      key={p.id}
                      title={p.name}
                      type="button"
                      role="radio"
                      aria-label={p.name}
                      aria-checked={seat.pawn === p.id}
                      className={seat.pawn === p.id ? "selected" : ""}
                      onClick={() => update(index, { pawn: p.id })}
                    >
                      <Pawn id={p.id} />
                    </button>
                  ))}
                </div>
              </div>
            </article>
                ))}
              </div>
              <button
                className="gold-button start-button"
                disabled={pending || !connected || seats.some((s) => !s.name.trim())}
                onClick={() => setCreateStep("markets")}
              >
                Choisir les places financières <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="market-setup-step" data-testid="setup-step-markets">
              <div className="market-player-tabs" role="group" aria-label="Fonds humains">
                {humanSeats.map(({ seat, index }) => (
                  <button
                    key={index}
                    type="button"
                    data-testid={`market-player-tab-${index}`}
                    aria-pressed={activeHumanIndex === index}
                    className={activeHumanIndex === index ? "is-active" : ""}
                    onClick={() => setActiveHuman(index)}
                  >
                    <span>FONDS 0{index + 1}</span>{seat.name || `Fonds ${index + 1}`}
                  </button>
                ))}
              </div>
              {activeHumanSeat && (
                <StartingMarketPicker
                  value={activeHumanSeat.startingMarket}
                  label={`Place de marché de ${activeHumanSeat.name || `Fonds ${activeHumanIndex + 1}`}`}
                  onChange={(startingMarket) => update(activeHumanIndex, { startingMarket })}
                />
              )}
              {seats.some((seat) => seat.kind === "ai") && (
                <div className="automatic-markets" aria-label="Implantations automatiques des IA">
                  <span>IMPLANTATIONS IA AUTOMATIQUES</span>
                  {plannedSeats.flatMap((seat, index) => seat.kind === "ai" ? (
                    <small key={index}>{seat.name} · {marketName(seat.startingMarket)}</small>
                  ) : [])}
                </div>
              )}
              <div className="market-step-actions">
                <button type="button" className="outline-button" onClick={() => setCreateStep("funds")}>← Configuration des fonds</button>
                <button
                  className="gold-button start-button"
                  disabled={pending || !connected || seats.some((s) => !s.name.trim())}
                  onClick={() => void createRoom(plannedSeats)}
                >
                  Créer ma partie <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
        {mode === "join" && <><div className="join-divider">
          <span>REJOINDRE UN SALON PRIVÉ</span>
        </div>
        <form
          className="join-form"
          onSubmit={(e) => {
            e.preventDefault();
            void joinRoom(join, name, startingMarket, joinPawn);
          }}
        >
          <input
            aria-label="Code du salon"
            placeholder="CODE DU SALON"
            value={join}
            onChange={(e) => setJoin(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <input
            aria-label="Nom pour rejoindre"
            placeholder="Nom de votre fonds"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <StartingMarketPicker
            value={startingMarket}
            label="Choisissez votre place de marché"
            onChange={setStartingMarket}
          />
          <select
            aria-label="Pion pour rejoindre"
            value={joinPawn}
            onChange={(e) => setJoinPawn(e.target.value as PawnId)}
          >
            {PAWNS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.label}
              </option>
            ))}
          </select>
          <button
            className="outline-button"
            disabled={!join || !name || pending || !connected}
          >
            Rejoindre <ChevronRight size={15} />
          </button>
        </form></>}
        <button className="setup-switch" onClick={() => onMode(mode === "create" ? "join" : "create")}>{mode === "create" ? "J’ai déjà un code d’invitation →" : "Créer une nouvelle partie →"}</button>
      </section>
    </main>
  );
}

function Lobby({ room }: { room: RoomView }) {
  const { session, pending } = useGameStore();
  const host = session?.playerId === room.hostId;
  const own = room.players.find((p) => p.id === session?.playerId);
  const allReady = room.players.every(
    (p) => p.kind !== "remote" || (p.connected && p.ready),
  );
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(
      `${location.origin}?room=${room.roomId}`,
    );
    setCopied(true);
  };
  return (
    <main className="lobby-scene">
      <div className="lobby-heading">
        <div>
          <span className="eyebrow">SALON PRIVÉ · PRÉPARATION DU PARQUET</span>
          <h1>Le capital vous attend.</h1>
          <p className="muted">
            Chaque fonds choisit sa place de marché initiale. L’implantation de
            départ est gratuite.
          </p>
        </div>
        <div className="room-code">
          <small>CODE D’INVITATION</small>
          <b>{room.roomId}</b>
          <button onClick={copy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}{" "}
            {copied ? "Copié" : "Inviter"}
          </button>
        </div>
      </div>
      <div className="lobby-grid">
        <section className="lobby-table">
          <div className="lobby-players">
            {room.players.map((p, i) => (
              <article
                className={`lobby-player ${p.id === session?.playerId ? "you" : ""}`}
                key={p.id}
              >
                <div className="lobby-player-top">
                  <span>FONDS 0{i + 1}</span>
                  <i className={p.ready ? "ready" : ""}>
                    {p.kind === "ai"
                      ? "IA"
                      : p.kind === "remote"
                        ? "DISTANT"
                        : "LOCAL"}
                  </i>
                </div>
                <Pawn id={p.pawn} color={p.color} />
                <h3>{p.name}</h3>
                <p>{marketName(p.startingMarket)}</p>
                <small>
                  Départ · {MARKET_PLACES.find((place) => place.id === p.startingMarket)?.city}
                </small>
                <div className="lobby-player-status">
                  <i className={p.ready ? "ready-dot" : ""} />
                  {p.ready
                    ? "Prêt à investir"
                    : p.connected
                      ? "Connexion établie · en attente"
                      : "En attente de votre invité"}
                </div>
                {p.kind === "ai" && (
                  <span className="ai-level">
                    {p.difficulty === "easy"
                      ? "IA prudente"
                      : p.difficulty === "hard"
                        ? "IA experte"
                        : "IA stratège"}
                  </span>
                )}
              </article>
            ))}
          </div>
          <div className="lobby-rules">
            <span>
              <b>100 M€</b>par fonds
            </span>
            <span>
              <b>100 Contextes</b>communs
            </span>
            <span>
              <b>50 Événements</b>de plateau
            </span>
            <span>
              <b>52 semaines</b>par révolution
            </span>
          </div>
        </section>
        <Chat room={room} />
      </div>
      <div className="lobby-actions">
        <button
          className="outline-button"
          onClick={() => useGameStore.getState().reset()}
        >
          Retour à l’accueil
        </button>
        {host ? (
          <button
            className="gold-button"
            disabled={pending || !allReady}
            onClick={() => void request("room:start", { roomId: room.roomId })}
          >
            Ouvrir le parquet <ArrowRight size={17} />
          </button>
        ) : (
          <button
            className="gold-button"
            disabled={pending}
            onClick={() =>
              void request("room:ready", {
                roomId: room.roomId,
                ready: !own?.ready,
              })
            }
          >
            {own?.ready ? "Annuler mon état prêt" : "Je suis prêt"}{" "}
            <Check size={17} />
          </button>
        )}
      </div>
      {!allReady && host && (
        <p className="lobby-ready-note">
          Le lancement s’ouvre dès que les invités sont connectés et prêts.
        </p>
      )}
    </main>
  );
}

function AudioPreferences({ onClose }: { onClose: () => void }) {
  const dialog = useDialogFocus(onClose);
  const [values, setValues] = useState(getAudioSettings());
  const presentation = usePresentationSettings();
  const update = (v: Partial<AudioSettings>) => {
    void unlockAudio();
    setValues(setAudioSettings(v));
  };
  return (
    <div
      className="decision-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Paramètres audio"
    >
      <section ref={dialog} tabIndex={-1} className="settings-panel">
        <button
          className="close-button"
          aria-label="Fermer les paramètres"
          onClick={onClose}
        >
          <X />
        </button>
        <span className="eyebrow">CONFORT DE LA SÉANCE</span>
        <h2>Votre ambiance sonore.</h2>
        <label className="mute-toggle">
          <span>Son activé</span>
          <input
            type="checkbox"
            checked={!values.muted}
            onChange={(e) => update({ muted: !e.target.checked })}
          />
        </label>
        {(["master", "music", "ambience", "effects"] as const).map((channel) => (
          <label key={channel}>
            <span>
              {
                {
                  master: "Volume général",
                  music: "Musique",
                  effects: "Effets",
                  ambience: "Ambiance",
                }[channel]
              }
            </span>
            <input
              aria-label={channel}
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={values[channel]}
              onChange={(e) => update({ [channel]: Number(e.target.value) })}
            />
          </label>
        ))}
        <p className="muted">
          Effets de jeu locaux, son facultatif. Les canaux musique et ambiance
          sont réservés aux futures pistes ; aucune boucle n’est jouée.
        </p>
        <label className="mute-toggle"><span>Réduire les animations</span><input type="checkbox" checked={presentation.reducedMotion} onChange={(e) => setPresentationSettings({ reducedMotion: e.target.checked })} /></label>
        <label><span>Qualité graphique</span><select aria-label="Qualité graphique" value={presentation.quality} onChange={(e) => setPresentationSettings({ quality: e.target.value as "high" | "medium" | "low" })}><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Basse</option></select></label>
        <a
          className="muted"
          href="/THIRD_PARTY_NOTICES.txt"
          target="_blank"
          rel="noreferrer"
        >
          Crédits et licences
        </a>
        <button className="gold-button" onClick={onClose}>
          Reprendre la séance
        </button>
      </section>
    </div>
  );
}

function Rules({ onClose }: { onClose: () => void }) {
  const dialog = useDialogFocus(onClose);
  return <div className="decision-backdrop" role="dialog" aria-modal="true" aria-labelledby="rules-title"><section className="settings-panel rules-panel" ref={dialog} tabIndex={-1}><button className="close-button" aria-label="Fermer les règles" onClick={onClose}><X /></button><span className="eyebrow">LE CIRCUIT DES MARCHÉS</span><h2 id="rules-title">Faire grandir votre fonds.</h2><p>2 à 6 fonds démarrent avec 100 M€. Le patrimoine est égal aux liquidités plus la valeur actuelle des participations.</p><ol><li>Ouverture : toutes les notes à C ; choisissez gratuitement la première place de marché de votre fonds. Le plus haut dé de départ commence, puis l’ordre des joueurs reste le même à chaque cycle ; les fonds insolvables sont sautés.</li><li>Dès le cycle 2, une carte Contexte commune ajuste les notes des zones et secteurs. Puis choisissez de rester gratuitement ou de voyager pour 1 M€, avant le dé.</li><li>Lancez le dé et avancez sur les 52 semaines. Sur une case sectorielle, vous payez les autres détenteurs au prorata de leurs parts. Vos propres participations ne vous rapportent rien pendant ce déplacement ; elles génèrent des revenus lorsque les autres fonds tombent sur le secteur.</li><li>Sur une case Événement, une carte distincte peut offrir une prime, imposer une vente ou déclencher une enquête. Bull, Bear et Crash modifient le marché.</li><li>Passez vos ordres dans votre zone active. Chaque société comporte cinq parts de 20 %. Le contrôle total garantit un revenu minimum C/C ; contrôler toutes les sociétés du même groupe zone/secteur garantit A/A.</li><li>Le passage au Départ apporte 20 M€ de nouveaux capitaux si la performance du tour est positive, ou retire 20 M€ si elle est négative. Une société E/E est liquidée puis revient lorsque l’une des notes s’améliore.</li></ol><p>La détention suspend le trading et les revenus. La partie se termine après le cycle de la 100e carte Contexte ou lorsqu’un seul fonds reste solvable. La valeur de fonds la plus élevée gagne.</p><button className="gold-button" onClick={onClose}>Prendre place à la table <ArrowRight size={17} /></button></section></div>;
}

export default function App() {
  const { room, connected, error, pending, session } = useGameStore();
  const [settings, setSettings] = useState(false);
  const [audio, setAudio] = useState(getAudioSettings());
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const [menuScreen, setMenuScreen] = useState<"menu" | "create" | "join">(new URLSearchParams(location.search).get("room") ? "join" : "menu");
  const [rules, setRules] = useState(false);
  useEffect(() => {
    const gesture = () => void unlockAudio();
    window.addEventListener("pointerdown", gesture, { once: true });
    return () => window.removeEventListener("pointerdown", gesture);
  }, []);
  return (
    <div className={`app ${room && room.status !== "lobby" ? "is-playing" : !room && menuScreen === "menu" ? "is-menu" : ""}`}>
      <header className="topbar">
        <Brand />
        <div className="topbar-tools">
          <span className={`connection ${connected ? "online" : ""}`}>
            <i />
            {connected ? "Serveur connecté" : "Reconnexion…"}
            <Wifi size={12} />
          </span>
          <button
            aria-label={audio.muted ? "Activer le son" : "Couper le son"}
            onClick={() => {
              void unlockAudio();
              setAudio(setAudioSettings({ muted: !audio.muted }));
            }}
          >
            {audio.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <button aria-label="Paramètres" onClick={() => setSettings(true)}>
            <Settings2 size={17} />
          </button>
        </div>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button
            aria-label="Fermer le message d’erreur"
            onClick={() => useGameStore.setState({ error: "" })}
          >
            <X size={16} />
          </button>
          {!room && session && !resumeDismissed && (
            <button
              onClick={() => {
                useGameStore.getState().reset();
                setResumeDismissed(true);
              }}
            >
              Nouvelle session
            </button>
          )}
        </div>
      )}
      {!room ? (
        menuScreen === "menu" ? <MainMenu onNew={() => setMenuScreen("create")} onJoin={() => setMenuScreen("join")} onSettings={() => setSettings(true)} onRules={() => setRules(true)} onResume={session ? () => { void request("room:resume", session); } : undefined} /> : <Home mode={menuScreen} onBack={() => setMenuScreen("menu")} onMode={setMenuScreen} />
      ) : room.status === "lobby" ? (
        <Lobby room={room} />
      ) : (
        <Suspense
          fallback={
            <div className="parquet-loading" role="status">
              Préparation du parquet mondial…
            </div>
          }
        >
          <Game room={room} />
        </Suspense>
      )}
      <footer className="app-footer">
        <span>GLOBAL FUND NEXT</span>
        <span>Investir. Anticiper. Dominer.</span>
        <span>
          {pending ? "Transmission au parquet…" : "Édition Next · 2026"}
        </span>
      </footer>
      {settings && (
        <AudioPreferences
          onClose={() => {
            setSettings(false);
            setAudio(getAudioSettings());
          }}
        />
      )}
      {rules && <Rules onClose={() => setRules(false)} />}
    </div>
  );
}
