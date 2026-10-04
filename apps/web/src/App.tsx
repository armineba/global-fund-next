import { lazy, Suspense, useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Crown,
  Dice5,
  Globe2,
  Landmark,
  Leaf,
  Gem,
  TrendingUp,
  Volume2,
  VolumeX,
  Settings2,
  X,
  Radio,
  Plane,
  Shield,
  Wifi,
  ChevronRight,
  ArrowUpRight,
  Users,
} from "lucide-react";
import {
  PAWNS,
  NATIONALITIES,
  type GameCommand,
  type GameView,
  type PawnId,
  type RoomView,
  type SeatConfig,
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

const pawnIcons = {
  lion: Crown,
  bull: TrendingUp,
  globe: Globe2,
  crystal: Gem,
  tower: Landmark,
  leaf: Leaf,
};
const defaults: SeatConfig[] = [
  {
    name: "Apex Capital",
    kind: "local",
    nationality: "france",
    pawn: "lion",
    difficulty: "normal",
  },
  {
    name: "Meridian Fund",
    kind: "ai",
    nationality: "united-states",
    pawn: "bull",
    difficulty: "normal",
  },
];
const nationDefaults = [
  "france",
  "united-states",
  "china",
  "nigeria",
  "australia",
  "brazil",
];
const zoneNames: Record<string, string> = {
  americas: "Amériques",
  europe: "Europe",
  asia: "Asie",
  africa: "Afrique & Moyen-Orient",
  oceania: "Océanie",
};
const nation = (id: string) =>
  NATIONALITIES.find((n) => n.id === id) ?? NATIONALITIES[0];
const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function Pawn({ id, color }: { id: PawnId; color?: string }) {
  const Icon = pawnIcons[id] ?? Globe2;
  const [failed, setFailed] = useState(false);
  return (
    <span className={`pawn-object pawn-${id}`} style={{ color }}>
      {!failed && (
        <img
          src={`/assets/pawns/${id}.png`}
          alt=""
          onError={() => setFailed(true)}
        />
      )}
      <Icon aria-hidden="true" className={failed ? "" : "pawn-fallback"} />
    </span>
  );
}
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

function Home() {
  const [seats, setSeats] = useState<SeatConfig[]>(defaults);
  const [join, setJoin] = useState(
    new URLSearchParams(location.search).get("room") || "",
  );
  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("france");
  const [joinPawn, setJoinPawn] = useState<PawnId>("globe");
  const pending = useGameStore((s) => s.pending);
  const connected = useGameStore((s) => s.connected);
  const update = (index: number, patch: Partial<SeatConfig>) =>
    setSeats((current) =>
      current.map((seat, i) => (i === index ? { ...seat, ...patch } : seat)),
    );
  const resize = (count: number) =>
    setSeats((current) =>
      Array.from(
        { length: count },
        (_, i) =>
          current[i] || {
            name: `Fonds ${i + 1}`,
            kind: "ai",
            nationality: nationDefaults[i],
            pawn: PAWNS[i].id,
            difficulty: "normal",
          },
      ),
    );
  return (
    <main className="home-scene">
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
        <div className="console-heading">
          <div>
            <span className="eyebrow">OUVERTURE DE SÉANCE</span>
            <h2>Réunissez les investisseurs.</h2>
          </div>
          <Users />
        </div>
        <p className="muted">
          Sur cet écran, à distance ou contre des IA. Votre salon accepte les
          trois.
        </p>
        <label className="seat-count">
          Places à la table{" "}
          <select
            aria-label="Nombre de joueurs"
            value={seats.length}
            onChange={(e) => resize(Number(e.target.value))}
          >
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} investisseurs
              </option>
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
                <div className="seat-second-line">
                  <select
                    aria-label={`Nationalité du joueur ${index + 1}`}
                    value={seat.nationality}
                    onChange={(e) =>
                      update(index, { nationality: e.target.value })
                    }
                  >
                    {NATIONALITIES.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.flag} {n.name} · {zoneNames[n.zoneId]}
                      </option>
                    ))}
                  </select>
                  {seat.kind === "ai" && (
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
                  )}
                </div>
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
          onClick={() => void createRoom(seats)}
        >
          Créer ma partie <ArrowRight size={18} />
        </button>
        <div className="join-divider">
          <span>INVITATION PRIVÉE</span>
        </div>
        <form
          className="join-form"
          onSubmit={(e) => {
            e.preventDefault();
            void joinRoom(join, name, nationality, joinPawn);
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
          <select
            aria-label="Nationalité pour rejoindre"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
          >
            {NATIONALITIES.map((n) => (
              <option key={n.id} value={n.id}>
                {n.flag} {n.name}
              </option>
            ))}
          </select>
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
        </form>
      </section>
    </main>
  );
}

function Chat({ room }: { room: RoomView }) {
  const [text, setText] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    void request("room:chat", { roomId: room.roomId, text });
    setText("");
  };
  return (
    <section className="chat-panel">
      <div className="panel-title">
        <span>CHAT DU SALON</span>
        <Radio size={13} />
      </div>
      <div className="chat-messages" aria-live="polite">
        {room.messages.length ? (
          room.messages.slice(-12).map((m) => (
            <p key={m.id}>
              <b>{m.name}</b>
              <span>{m.text}</span>
            </p>
          ))
        ) : (
          <p className="muted">Votre table est prête à discuter.</p>
        )}
      </div>
      <form onSubmit={submit}>
        <input
          aria-label="Message du salon"
          placeholder="Écrire au salon…"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
        />
        <button aria-label="Envoyer le message">
          <ArrowUpRight size={17} />
        </button>
      </form>
    </section>
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
            Chaque fonds débute sur son marché national. L’implantation initiale
            est gratuite.
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
                <p>
                  {nation(p.nationality).flag} {nation(p.nationality).name}
                </p>
                <small>
                  Marché de départ · {zoneNames[nation(p.nationality).zoneId]}
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

function Geography({
  game,
  onCommand,
}: {
  game: GameView;
  onCommand: (c: GameCommand) => void;
}) {
  const dialog = useDialogFocus();
  const player = game.players.find((p) => p.id === game.activePlayerId)!;
  const [destination, setDestination] = useState(
    game.zones.find((z) => z.id !== player.zone)?.id ?? "",
  );
  return (
    <div
      className="decision-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="destination-title"
    >
      <section
        ref={dialog}
        tabIndex={-1}
        className={`geography-scene ${player.jailed ? "justice-scene" : ""}`}
      >
        <div className="geography-art">
          <div className="boarding-sign">
            <span>GLOBAL FUND · {player.name}</span>
            <b>
              {player.jailed ? "AUDIENCE FINANCIÈRE" : "DÉPARTS INTERNATIONAUX"}
            </b>
            <small>CYCLE {game.cycle} · ACTION REQUISE</small>
          </div>
          {player.jailed ? <Shield size={76} /> : <Plane size={76} />}
        </div>
        <div className="geography-controls">
          <span className="eyebrow">
            {player.jailed
              ? "JUSTICE & CONFORMITÉ"
              : "IMPLANTATION · AVANT LE DÉ"}
          </span>
          <h2 id="destination-title">
            {player.jailed
              ? "Votre procès vous attend."
              : "Où investirez-vous ?"}
          </h2>
          <p>
            {player.jailed
              ? "Vos participations restent valorisées, mais vos échanges et vos revenus sont suspendus. Le dé du procès décide de votre libération."
              : `Votre fonds se trouve en ${zoneNames[player.zone ?? ""]}. Choisissez votre place de marché avant le lancer de dé.`}
          </p>
          {player.jailed ? (
            <button
              className="gold-button"
              onClick={() => onCommand({ type: "PRISON_ROLL" })}
            >
              Lancer le dé du procès <Dice5 />
            </button>
          ) : (
            <>
              <button
                className="stay-button"
                onClick={() => onCommand({ type: "STAY" })}
                autoFocus
              >
                <span>
                  Rester en {zoneNames[player.zone ?? ""]}
                  <small>Conserver votre marché actuel</small>
                </span>
                <b>0 M€</b>
              </button>
              <div className="destination-grid">
                {game.zones
                  .filter((z) => z.id !== player.zone)
                  .map((z) => (
                    <button
                      key={z.id}
                      role="radio"
                      aria-checked={destination === z.id}
                      className={destination === z.id ? "selected" : ""}
                      onClick={() => setDestination(z.id)}
                    >
                      <span>{z.name}</span>
                      <b className={`grade grade-${game.zoneGrades[z.id]}`}>
                        {game.zoneGrades[z.id]}
                      </b>
                    </button>
                  ))}
              </div>
              <button
                className="gold-button"
                onClick={() => onCommand({ type: "MOVE", zoneId: destination })}
              >
                Prendre un vol vers {zoneNames[destination]}{" "}
                <span>
                  1 M€ <ArrowUpRight size={15} />
                </span>
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function usePresentationNotice(room: RoomView) {
  const acknowledged = useGameStore((s) => s.acknowledged);
  const notice =
    room.game?.notices.find((n) => !acknowledged.includes(n.id)) ?? null;
  const [ready, setReady] = useState<number | null>(null);
  useEffect(() => {
    if (!notice) {
      setReady(null);
      return;
    }
    const animatedRoll =
      notice.roll ??
      room.game?.notices.find(
        (n) => n.id >= notice.id && n.playerId === notice.playerId && n.roll,
      )?.roll;
    const delay = reduced()
      ? 0
      : notice.action === "move"
        ? 2900
        : animatedRoll
          ? animatedRoll * 220 + 1000
          : 900;
    const timer = setTimeout(() => setReady(notice.id), delay);
    return () => clearTimeout(timer);
  }, [notice?.id, room.roomId]);
  return { notice, current: notice && ready === notice.id ? notice : null };
}

function Game({ room }: { room: RoomView }) {
  const game = room.game!;
  const { session, connected, pending, queue, acknowledge } = useGameStore();
  const active = game.players.find((p) => p.id === game.activePlayerId)!;
  const activeSlot = room.players.find((p) => p.id === active.id)!;
  const { notice, current } = usePresentationNotice(room);
  const controls =
    !active.bot &&
    (active.id === session?.playerId ||
      (session?.playerId === room.hostId && activeSlot.kind === "local"));
  const canAct = controls && connected && !pending && !notice && !queue.length;
  const [viewerId, setViewerId] = useState(session?.playerId ?? active.id);
  useEffect(() => {
    setViewerId(controls ? active.id : (session?.playerId ?? active.id));
  }, [game.activePlayerId, controls, session?.playerId]);
  const send = (c: GameCommand) => {
    void unlockAudio();
    playCue(
      c.type === "ROLL"
        ? "roll"
        : c.type.includes("SHARE")
          ? "trade"
          : "confirm",
    );
    void command(c, active.id);
  };
  const holdingCount = game.companies.filter(
    (c) => (c.holdings[active.id] ?? 0) > 0,
  ).length;
  const phaseTitle =
    game.phase === "geography"
      ? "Choisir son marché"
      : game.phase === "sector"
        ? "Le circuit des marchés"
        : game.phase === "market"
          ? "Composer son portefeuille"
          : game.phase === "finished"
            ? "Clôture de la séance"
            : "Passage de relais";
  return (
    <main className="game-scene">
      <header className="game-heading">
        <div>
          <span className="eyebrow">
            <i /> CYCLE {game.cycle} ·{" "}
            {game.cycle === 1
              ? "OUVERTURE À C/C"
              : `${100 - game.contextsRemaining}/100 CONTEXTES`}
          </span>
          <h1>{phaseTitle}</h1>
        </div>
        <div className="global-session">
          <span>{room.roomId}</span>
          <b>
            100 M€ <small>capital initial</small>
          </b>
          <button
            className="outline-button small"
            onClick={() =>
              document
                .getElementById("trading-desk")
                ?.scrollIntoView({ behavior: reduced() ? "instant" : "smooth" })
            }
          >
            Salle des marchés <ArrowRight size={14} />
          </button>
        </div>
      </header>
      <section className="economic-hud" aria-label="Notations économiques">
        <div className="zones-hud">
          {game.zones.map((z) => (
            <div key={z.id}>
              <Globe2 size={15} />
              <span>{z.name}</span>
              <b className={`grade grade-${game.zoneGrades[z.id]}`}>
                {game.zoneGrades[z.id]}
              </b>
            </div>
          ))}
        </div>
        <div className="sectors-hud">
          {game.sectors.map((s) => (
            <div key={s.id}>
              <span>{s.name.split("&")[0]}</span>
              <b className={`grade grade-${game.sectorGrades[s.id]}`}>
                {game.sectorGrades[s.id]}
              </b>
            </div>
          ))}
        </div>
      </section>
      {game.cycle === 1 && (
        <div className="opening-order" aria-label="Dés de départ">
          <span>DÉS DE DÉPART</span>
          {game.players.map((p, i) => (
            <small key={p.id}>
              <b>{p.name}</b> · {game.initiative[i]}
              {i === game.starterIndex ? " · premier investisseur" : ""}
            </small>
          ))}
        </div>
      )}
      {game.phase === "finished" ? (
        <section className="results-scene">
          <span className="eyebrow">CLÔTURE DU PARQUET MONDIAL</span>
          <h2>
            {game.players
              .filter((p) => game.winnerIds.includes(p.id))
              .map((p) => p.name)
              .join(" & ")}{" "}
            remporte la séance.
          </h2>
          {[...game.players]
            .sort((a, b) => b.fundValue - a.fundValue)
            .map((p, i) => (
              <div key={p.id}>
                <span>0{i + 1}</span>
                <Pawn id={p.pawn} />
                <b>{p.name}</b>
                <strong>{formatMoney(p.fundValue)}</strong>
              </div>
            ))}
          <button
            className="gold-button"
            onClick={() => useGameStore.getState().reset()}
          >
            Nouvelle partie
          </button>
        </section>
      ) : (
        <div className="parquet-layout">
          <aside className="investor-rail">
            <div className="panel-title">
              <span>INVESTISSEURS</span>
              <small>{game.players.length} FONDS</small>
            </div>
            {game.players.map((p) => (
              <button
                key={p.id}
                onClick={() => setViewerId(p.id)}
                className={`investor-card ${p.id === active.id ? "is-active" : ""} ${p.id === viewerId ? "inspecting" : ""} ${!p.solvent ? "insolvent" : ""}`}
                style={{ "--player-color": p.color } as React.CSSProperties}
              >
                <div className="investor-name">
                  <Pawn id={p.pawn} />
                  <span>
                    <b>{p.name}</b>
                    <small>
                      {p.nationalityFlag}{" "}
                      {p.jailed ? "Détention" : zoneNames[p.zone ?? ""]}
                    </small>
                  </span>
                  {p.id === active.id && <i />}
                </div>
                <div className="investor-finances">
                  <span>
                    Liquidités<b>{formatMoney(p.cash)}</b>
                  </span>
                  <span>
                    Valeur du fonds<strong>{formatMoney(p.fundValue)}</strong>
                  </span>
                </div>
              </button>
            ))}
          </aside>
          <section className="board-center">
            <BoardScene
              game={game}
              onRoll={() => send({ type: "ROLL" })}
              disabled={!canAct || game.phase !== "sector"}
              reducedMotion={reduced()}
            />
            <div className="board-caption">
              <span>
                <i /> PLACE DE MARCHÉ MONDIALE
              </span>
              <span>
                52 semaines · {game.boardEventsRemaining} événements ·{" "}
                {game.contextsRemaining} contextes
              </span>
            </div>
          </section>
          <aside className="operations-rail">
            <div className="active-fund">
              <span className="eyebrow">AU TOUR DE</span>
              <Pawn id={active.pawn} />
              <h2>{active.name}</h2>
              <p>
                {active.bot
                  ? "IA en réflexion"
                  : controls
                    ? "Vous contrôlez ce fonds"
                    : "Un autre investisseur joue"}
              </p>
              <div>
                <span>Valeur actuelle</span>
                <b>{formatMoney(active.fundValue)}</b>
              </div>
              <div>
                <span>Participations</span>
                <b>{holdingCount} sociétés</b>
              </div>
              <div>
                <span>Position</span>
                <b>Semaine {active.sectorPosition + 1}</b>
              </div>
            </div>
            <div className="turn-actions">
              {notice ? (
                <div className="animation-status">
                  <Radio />
                  <strong>
                    {current
                      ? "Compte-rendu de séance"
                      : notice.action === "move"
                        ? "Vol en cours…"
                        : "Le parquet s’anime…"}
                  </strong>
                  <small>Les commandes reprendront après le résultat.</small>
                </div>
              ) : game.phase === "sector" ? (
                <button
                  className="gold-button"
                  disabled={!canAct}
                  onClick={() => send({ type: "ROLL" })}
                >
                  Lancer le dé <Dice5 size={22} />
                </button>
              ) : game.phase === "market" ? (
                <>
                  <span className="eyebrow">MARCHÉ OUVERT</span>
                  <p>Vous pouvez négocier en {zoneNames[active.zone ?? ""]}.</p>
                  <button
                    className="gold-button"
                    disabled={!canAct}
                    onClick={() => send({ type: "END_TURN" })}
                  >
                    Terminer le marché <Check size={18} />
                  </button>
                </>
              ) : game.phase === "awaitNext" ? (
                <button
                  className="gold-button"
                  disabled={!canAct}
                  onClick={() => send({ type: "NEXT_TURN" })}
                >
                  Prochain investisseur <ArrowRight size={19} />
                </button>
              ) : (
                <p>Choix de l’implantation en cours.</p>
              )}
            </div>
            <div className="market-wire">
              <div className="panel-title">
                <span>DÉPÊCHES</span>
                <Radio size={12} />
              </div>
              {game.log
                .slice(-3)
                .reverse()
                .map((line, i) => (
                  <p key={`${game.cycle}-${i}`}>{line}</p>
                ))}
            </div>
          </aside>
        </div>
      )}
      <section id="trading-desk" className="desk-shell">
        <div className="desk-heading">
          <span className="eyebrow">
            TERMINAL FINANCIER ·{" "}
            {game.players.find((p) => p.id === viewerId)?.name}
          </span>
          <span>
            Transactions enregistrées <Shield size={12} />
          </span>
        </div>
        <TradingDesk
          game={game}
          viewerId={viewerId}
          canAct={canAct && viewerId === active.id}
          onCommand={send}
        />
      </section>
      <div className="game-lower">
        <Chat room={room} />
        <div className="session-footnote">
          <Shield size={18} />
          <p>
            Votre partie est sauvegardée.
            <br />
            <small>
              Conservez ce navigateur pour reprendre votre session après une
              interruption.
            </small>
          </p>
        </div>
      </div>
      {canAct && game.phase === "geography" && (
        <Geography game={game} onCommand={send} />
      )}{" "}
      {current && (
        <CardScene
          notice={current}
          game={game}
          onClose={() => {
            playCue("confirm");
            acknowledge(current.id);
          }}
        />
      )}
    </main>
  );
}

function AudioPreferences({ onClose }: { onClose: () => void }) {
  const dialog = useDialogFocus(onClose);
  const [values, setValues] = useState(getAudioSettings());
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
        {(["master", "effects"] as const).map((channel) => (
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
          Le son est facultatif. Les pistes musicales et l’ambiance seront
          disponibles dans une prochaine version.
        </p>
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

export default function App() {
  const { room, connected, error, pending, session } = useGameStore();
  const [settings, setSettings] = useState(false);
  const [audio, setAudio] = useState(getAudioSettings());
  const [resumeDismissed, setResumeDismissed] = useState(false);
  useEffect(() => {
    const gesture = () => void unlockAudio();
    window.addEventListener("pointerdown", gesture, { once: true });
    return () => window.removeEventListener("pointerdown", gesture);
  }, []);
  return (
    <div className="app">
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
        <Home />
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
    </div>
  );
}
