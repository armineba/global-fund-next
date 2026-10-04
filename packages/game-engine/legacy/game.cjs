'use strict';

/* Pure, in-memory game engine.  The UI/server may serialize the object returned
 * by publicState; no timers, sockets, or framework code belong here. */
const data = require('./data/gameData.json');
const nationalities = require('./data/nationalities.json');
const { eventPremise } = require('./eventStories.cjs');
const { BOARD_EVENT_CARDS } = require('./boardEventCards.cjs');

const FACTOR = Object.freeze({ A: 1.5, B: 1.25, C: 1, D: 0.75, E: 0.5 });
const GRADES = ['A', 'B', 'C', 'D', 'E'];

function idOf(value) { return String(value && typeof value === 'object' ? value.id : value); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function fail(message) { throw new Error(message); }
function gradeFactor(grade) { return FACTOR[grade] || FACTOR.C; }
function randInt(max) { return Math.floor(Math.random() * max); }
function suppliedDie() { return randInt(6) + 1; }
function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = randInt(i + 1); [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

const NATIONALITY_BY_ID = new Map(nationalities.map(item => [String(item.id), item]));
const DEFAULT_NATIONALITY = nationalities[0];

function nationalityFor(value) {
  const id = idOf(value);
  return NATIONALITY_BY_ID.get(id) || DEFAULT_NATIONALITY;
}

function applyNationality(playerRecord, requested, fallbackZone = null) {
  const selected = requested ? nationalityFor(requested) : null;
  const inferred = fallbackZone && nationalities.find(item => item.zoneId === String(fallbackZone));
  const nationality = selected || inferred || DEFAULT_NATIONALITY;
  playerRecord.nationality = nationality.id;
  playerRecord.nationalityName = nationality.name;
  playerRecord.nationalityFlag = nationality.flag;
  if (!playerRecord.zone) playerRecord.zone = nationality.zoneId;
  return nationality;
}

function notice(game, value) {
  game.noticeSeq = Number(game.noticeSeq || 0) + 1;
  const item = { id: game.noticeSeq, cycle: game.cycle || 0, ...value };
  game.notices ||= [];
  game.notices.push(item);
  if (game.notices.length > 30) game.notices.splice(0, game.notices.length - 30);
  return item;
}

function player(game, playerId) {
  const found = game.players.find(p => p.id === String(playerId));
  if (!found) fail(`Joueur introuvable : ${playerId}`);
  // Saved rooms created before nationalities were introduced have no such
  // fields. Infer a sensible nationality from their existing market and keep
  // their current location intact while the room is being upgraded.
  if (!found.nationality || !found.nationalityName || !found.nationalityFlag) applyNationality(found, found.nationality, found.zone);
  if (!game.legacyOpening && (game.cycle || 1) === 1 && !found.jailed) found.geoResolved = true;
  else if (found.geoResolved == null) found.geoResolved = (game.cycle || 1) === 1;
  return found;
}
function company(game, companyId) {
  const found = game.companies.find(c => c.id === String(companyId));
  if (!found) fail(`Entreprise introuvable : ${companyId}`);
  return found;
}
function zone(game, zoneId) {
  const found = game.zones.find(z => z.id === String(zoneId));
  if (!found) fail(`Zone introuvable : ${zoneId}`);
  return found;
}
function currentPlayer(game) { return game.players[game.activeIndex]; }
function currentGrade(game, scope, id) {
  return (scope === 'zone' ? game.zoneGrades : game.sectorGrades)[String(id)] || 'C';
}
function setGrade(game, scope, id, grade) {
  if (!GRADES.includes(grade)) fail(`Indice économique invalide : ${grade}`);
  const map = scope === 'zone' ? game.zoneGrades : game.sectorGrades;
  map[String(id)] = grade;
}
function sharesOf(c, pid) { return Number(c.holdings[String(pid)] || 0); }
function totalHeld(c) { return Object.values(c.holdings).reduce((a, n) => a + Number(n || 0), 0); }
function averageBuyPrice(c, pid) {
  const held = sharesOf(c, pid);
  const rawBasis = (c.costBasis || {})[String(pid)];
  const basis = Number(rawBasis);
  return held > 0 && rawBasis != null && Number.isFinite(basis) && basis >= 0 ? Math.round((basis / held) * 100) / 100 : null;
}
function recordBuy(c, pid, quantity, price) {
  c.costBasis ||= {};
  const previous = c.costBasis[String(pid)];
  // A saved game from before cost tracking has no known purchase price.
  if (sharesOf(c, pid) > 0 && previous == null) c.costBasis[String(pid)] = null;
  else if (previous !== null) c.costBasis[String(pid)] = Number(previous || 0) + quantity * price;
}
function removeHolding(c, pid, quantity) {
  const held = sharesOf(c, pid); const sold = Math.min(held, Math.max(0, Number(quantity) || 0));
  if (!sold) return 0;
  const basis = (c.costBasis || {})[String(pid)];
  c.holdings[pid] = held - sold;
  if (!c.holdings[pid]) delete c.holdings[pid];
  c.costBasis ||= {};
  if (held <= sold) delete c.costBasis[String(pid)];
  else c.costBasis[String(pid)] = basis == null ? null : Math.max(0, Number(basis) * (held - sold) / held);
  return sold;
}
function sharesInGroup(game, c) {
  return game.companies.filter(x => x.zone === c.zone && x.sector === c.sector);
}
function ownsMonopoly(game, p, c) {
  const group = sharesInGroup(game, c);
  return group.length > 0 && group.every(x => sharesOf(x, p.id) === 5);
}
function titlePrice(c, game) {
  return (Number(c.basePrice) / 5) * gradeFactor(currentGrade(game, 'zone', c.zone)) * gradeFactor(currentGrade(game, 'sector', c.sector));
}
function incomeBase(c, game) {
  return (Number(c.baseIncome) / 5) * gradeFactor(currentGrade(game, 'zone', c.zone)) * gradeFactor(currentGrade(game, 'sector', c.sector));
}

function priceFor(c, game) { return Math.round(titlePrice(c, game) * 100) / 100; }

function incomeFor(c, game) {
  let value = incomeBase(c, game);
  const cc = (Number(c.baseIncome) / 5) * FACTOR.C * FACTOR.C;
  // A wholly owned company guarantees at least its C/C per-title income.
  if (Object.values(c.holdings).some(n => Number(n) >= 5)) value = Math.max(value, cc);
  return Math.round(value * 100) / 100;
}

function incomeForHolder(c, game, pid) {
  let value = incomeFor(c, game);
  const p = player(game, pid);
  if (ownsMonopoly(game, p, c)) value = Math.max(value, (Number(c.baseIncome) / 5) * FACTOR.A * FACTOR.A);
  return Math.round(value * 100) / 100;
}

function contextDeck() {
  const source = Array.isArray(data.events) ? data.events : [];
  if (!source.length) return [];
  const groups = Object.fromEntries(['positive', 'negative', 'neutral', 'prison', 'regulation'].map(type =>
    [type, shuffle(source.filter(card => card.type === type).map(clone))]));
  if (groups.positive.length !== 35 || groups.negative.length !== 35 ||
      groups.neutral.length !== 10 || groups.prison.length !== 10 || groups.regulation.length !== 10) {
    return shuffle(source.map(clone));
  }
  // Each group of ten cards has three or four rises, three or four falls,
  // and one of each other type, so long runs cannot skew a whole cycle block.
  const extraRise = shuffle([true, true, true, true, true, false, false, false, false, false]);
  return extraRise.flatMap(rising => shuffle([
    ...groups.positive.splice(0, rising ? 4 : 3),
    ...groups.negative.splice(0, rising ? 3 : 4),
    groups.neutral.pop(), groups.prison.pop(), groups.regulation.pop(),
  ]));
}

function describeGrades(game, before, changes) {
  const subjects = changes.map(change => {
    const item = (change.scope === 'zone' ? game.zones : game.sectors).find(entry => entry.id === change.id);
    const name = item?.name || change.id;
    const previous = before.grades[change.scope]?.[change.id] || 'C';
    const current = currentGrade(game, change.scope, change.id);
    const direction = GRADES.indexOf(current) < GRADES.indexOf(previous) ? 'progresse' :
      GRADES.indexOf(current) > GRADES.indexOf(previous) ? 'recule' : 'reste stable';
    return `${change.scope === 'zone' ? 'la zone' : 'le secteur'} ${name} ${direction}`;
  });
  return subjects.length ? `Sur les marchés, ${subjects.join(' ; ')}.` : 'Les indices de zones et de secteurs restent inchangés.';
}

function gradeOutcomes(game, before, changes) {
  return changes.map(change => ({ scope: change.scope, id: change.id,
    before: before.grades[change.scope]?.[change.id] || 'C', after: currentGrade(game, change.scope, change.id) }));
}

function eventDescription(game, event, outcomes) {
  const zoneChange = (event.changes || []).find(change => change.scope === 'zone');
  const sectorChange = (event.changes || []).find(change => change.scope === 'sector');
  const zoneName = game.zones.find(item => item.id === zoneChange?.id)?.name || zoneChange?.id || 'la région concernée';
  const sectorName = game.sectors.find(item => item.id === sectorChange?.id)?.name || sectorChange?.id || 'ce secteur';
  const premise = eventPremise(event, zoneName, sectorName);
  const direction = scope => {
    const target = outcomes.find(item => item.scope === scope);
    if (!target) return null;
    return Math.sign(GRADES.indexOf(target.after) - GRADES.indexOf(target.before));
  };
  const zoneDirection = direction('zone');
  const sectorDirection = direction('sector');
  const favorable = [zoneDirection, sectorDirection].some(value => value < 0);
  const unfavorable = [zoneDirection, sectorDirection].some(value => value > 0);
  let response;
  if (favorable && unfavorable) {
    response = `Le choc partage les marchés : des achats de soutien redressent ${zoneDirection < 0 ? `la zone ${zoneName}` : `le secteur ${sectorName}`}, tandis que les ventes pèsent sur ${zoneDirection > 0 ? `la zone ${zoneName}` : `le secteur ${sectorName}`}.`;
  } else if (favorable) {
    response = event.type === 'negative' || event.type === 'prison'
      ? 'Malgré l’alerte, des achats de soutien l’emportent et les cours concernés se redressent.'
      : 'La nouvelle attire des capitaux et soutient les cours concernés.';
  } else if (unfavorable) {
    response = event.type === 'positive'
      ? 'Malgré cette annonce, les investisseurs prennent leurs bénéfices et les cours concernés cèdent du terrain.'
      : 'La défiance pousse les investisseurs à vendre les titres concernés.';
  } else {
    response = 'Les investisseurs attendent des preuves supplémentaires avant de modifier leurs positions.';
  }
  const movements = outcomes.map(change => {
    const name = (change.scope === 'zone' ? game.zones : game.sectors).find(item => item.id === change.id)?.name || change.id;
    const status = GRADES.indexOf(change.after) < GRADES.indexOf(change.before) ? 'progresse' :
      GRADES.indexOf(change.after) > GRADES.indexOf(change.before) ? 'recule' : 'reste stable';
    return `${change.scope === 'zone' ? 'la zone' : 'le secteur'} ${name} ${status}`;
  });
  const result = movements.length ? `Au terme de la séance, ${movements.join(' ; ')}.` : 'Les indices de zones et de secteurs restent inchangés.';
  return [premise, response, result].filter(Boolean).join(' ');
}

function bankruptCompanies(game) {
  game.companies.forEach(c => {
    const isWorst = currentGrade(game, 'zone', c.zone) === 'E' && currentGrade(game, 'sector', c.sector) === 'E';
    if (c.available && isWorst) {
      const liquidation = titlePrice(c, game);
      Object.keys(c.holdings).forEach(pid => {
        const holder = game.players.find(p => p.id === pid);
        if (holder) holder.cash += liquidation * sharesOf(c, pid);
      });
      c.holdings = {};
      c.costBasis = {};
      c.available = false;
      game.log.push(`Faillite de ${c.name || c.id}`);
    } else if (!c.available && !isWorst) {
      c.available = true;
      game.log.push(`Retour de ${c.name || c.id} sur le marché`);
    }
  });
}

function marketSnapshot(game) {
  return {
    grades: { zone: clone(game.zoneGrades), sector: clone(game.sectorGrades) },
    companies: Object.fromEntries(game.companies.map(c => [c.id, {
      price: c.available ? priceFor(c, game) : 0,
      available: c.available,
      holdings: { ...c.holdings },
    }])),
    players: Object.fromEntries(game.players.map(p => [p.id, {
      cash: p.cash, valuation: fundValue(game, p), jailed: p.jailed,
      shares: Object.fromEntries(game.companies.map(c => [c.id, sharesOf(c, p.id)])),
    }])),
  };
}

function marketImpacts(game, before) {
  const gradeChanges = [];
  for (const scope of ['zone', 'sector']) {
    const grades = scope === 'zone' ? game.zoneGrades : game.sectorGrades;
    Object.keys(grades).forEach(id => {
      if (before.grades[scope][id] !== grades[id]) gradeChanges.push({ scope, id, before: before.grades[scope][id], after: grades[id] });
    });
  }
  const companyImpacts = game.companies.flatMap(c => {
    const old = before.companies[c.id];
    const afterPrice = c.available ? priceFor(c, game) : 0;
    const sharesChanged = game.players.flatMap(p => {
      const prior = Number(old.holdings[p.id] || 0);
      const current = sharesOf(c, p.id);
      return prior === current ? [] : [{ playerId: p.id, playerName: p.name, before: prior, after: current }];
    });
    if (old.price === afterPrice && old.available === c.available && !sharesChanged.length) return [];
    return [{ companyId: c.id, companyName: c.name || c.id, beforePrice: old.price, afterPrice,
      bankruptcy: old.available && !c.available, returned: !old.available && c.available, sharesChanged }];
  });
  const round = value => Math.round(value * 100) / 100;
  const playerImpacts = game.players.map(p => {
    const old = before.players[p.id];
    const sharesSold = game.companies.flatMap(c => {
      const prior = old.shares[c.id] || 0;
      const current = sharesOf(c, p.id);
      return current < prior ? [{ companyId: c.id, companyName: c.name || c.id, quantity: prior - current }] : [];
    });
    return { playerId: p.id, playerName: p.name, cash: round(p.cash - old.cash),
      valuation: round(fundValue(game, p) - old.valuation), prison: p.jailed !== old.jailed ? p.jailed : null, sharesSold };
  });
  return { gradeChanges, playerImpacts, companyImpacts };
}

function applyRegulation(game, targetSector = null, quantity = 3) {
  const targets = [];
  game.players.forEach(p => game.companies.forEach(c => {
    if ((!targetSector || c.sector === targetSector) && sharesOf(c, p.id) >= 5 && ownsMonopoly(game, p, c)) targets.push([p, c]);
  }));
  const sales = [];
  targets.forEach(([p, c]) => {
    if (sharesOf(c, p.id) < 5) return;
    const sell = Math.min(quantity, sharesOf(c, p.id));
    removeHolding(c, p.id, sell);
    p.cash += sell * priceFor(c, game);
    game.log.push(`${p.name} revend ${sell} titres de ${c.name || c.id} (Régulation)`);
    sales.push(`${p.name} cède ${sell} titre${sell > 1 ? 's' : ''} de ${c.name || c.id} au cours du marché.`);
  });
  return sales;
}

function drawContext(game) {
  const event = game.deck.shift();
  if (!event) { finishGame(game); return null; }
  const before = marketSnapshot(game);
  game.cycle = (game.cycle || 0) + 1;
  game.log.push(`Contexte : ${event.title || event.id || 'sans titre'}`);
  (event.changes || []).forEach(change => setGrade(game, change.scope, change.id, change.grade));
  bankruptCompanies(game);
  const { gradeChanges, playerImpacts, companyImpacts } = marketImpacts(game, before);
  const description = eventDescription(game, event, gradeOutcomes(game, before, event.changes || []));
  game.currentContext = { ...event, description, effect: description };
  delete game.currentEvent;
  notice(game, { kind: 'event', source: 'card', cardType: 'context', title: event.title || event.id || 'Contexte', description,
    gradeChanges, gradeOutcomes: gradeOutcomes(game, before, event.changes || []), playerImpacts, companyImpacts });
  recordMarketHistory(game, 'contexte');
  return event;
}

function ensureBoardEventDeck(game) {
  if (!Array.isArray(game.boardEventDeck)) game.boardEventDeck = shuffle(BOARD_EVENT_CARDS.map(clone));
  if (!Array.isArray(game.boardEventDiscard)) game.boardEventDiscard = [];
  if (!game.boardEventDeck.length && game.boardEventDiscard.length) {
    game.boardEventDeck = shuffle(game.boardEventDiscard.splice(0));
  }
}

function eventTargetCompany(game, p, card) {
  const sector = card.targetSector || null;
  const candidates = game.companies.filter(c => c.available && (!sector || c.sector === sector));
  if (!candidates.length) return null;
  const own = candidates.filter(c => sharesOf(c, p.id) > 0);
  const held = candidates.filter(c => totalHeld(c) > 0);
  const pool = own.length ? own : held.length ? held : candidates;
  return pool[randInt(pool.length)];
}

function drawBoardEvent(game, p, die, cell) {
  ensureBoardEventDeck(game);
  const card = game.boardEventDeck.shift();
  if (!card) return;
  game.boardEventDiscard.push(card);
  const before = marketSnapshot(game);
  const target = eventTargetCompany(game, p, card);
  const triggerOwnedTarget = target ? sharesOf(target, p.id) > 0 : false;
  const companyName = target?.name || 'une société cotée';
  const description = String(card.story || '').replaceAll('{company}', companyName);
  const effectLines = [];
  const amount = Number(card.amount || 0);
  const quantity = Math.max(1, Number(card.quantity || 1));
  const cash = Number(card.activeCash || 0);
  if (cash > 0) {
    p.cash += cash;
    effectLines.push(`${p.name} reçoit ${cash} M€ de la banque.`);
  } else if (cash < 0) {
    const context = { forcedSales: [] };
    payOrSell(game, p, -cash, context);
    effectLines.push(`${p.name} paie ${-cash} M€ à la banque${context.forcedSales.length ? ' et revend des titres pour couvrir la somme' : ''}.`);
  }
  if (card.effect === 'dividend' && target) {
    const holders = game.players.filter(holder => sharesOf(target, holder.id) > 0);
    holders.forEach(holder => {
      const paid = sharesOf(target, holder.id) * amount;
      if (holder.jailed) {
        effectLines.push(`${holder.name} est en prison : son dividende de ${paid} M€ reste à la banque.`);
        return;
      }
      holder.cash += paid;
      effectLines.push(`${holder.name} reçoit ${paid} M€ de dividende pour ${target.name}.`);
    });
    if (!holders.length) effectLines.push(`Aucun actionnaire de ${target.name} ne perçoit de dividende.`);
  } else if (card.effect === 'fine' && target) {
    const holders = game.players.filter(holder => sharesOf(target, holder.id) > 0);
    holders.forEach(holder => {
      const due = sharesOf(target, holder.id) * amount;
      payOrSell(game, holder, due);
      effectLines.push(`${holder.name} paie ${due} M€ pour ses titres de ${target.name}.`);
    });
    if (!holders.length) effectLines.push(`Aucun actionnaire de ${target.name} ne reçoit de charge supplémentaire.`);
  } else if (card.effect === 'forcedSale' && target) {
    const holders = game.players.filter(holder => sharesOf(target, holder.id) > 0);
    holders.forEach(holder => {
      const sold = removeHolding(target, holder.id, quantity);
      const proceeds = Math.round(sold * priceFor(target, game) * 100) / 100;
      holder.cash += proceeds;
      effectLines.push(`${holder.name} revend ${sold} titre${sold > 1 ? 's' : ''} de ${target.name} pour ${proceeds} M€.`);
    });
    if (!holders.length) effectLines.push(`Aucune part de ${target.name} n’est détenue : aucune vente imposée.`);
  } else if (card.effect === 'buyback' && target) {
    const holders = game.players.filter(holder => sharesOf(target, holder.id) > 0);
    holders.forEach(holder => {
      const sold = removeHolding(target, holder.id, 1);
      const proceeds = Math.round(sold * (priceFor(target, game) + amount) * 100) / 100;
      holder.cash += proceeds;
      effectLines.push(`${holder.name} cède ${sold} titre de ${target.name} pour ${proceeds} M€, prime incluse.`);
    });
    if (!holders.length) effectLines.push(`L’offre de rachat de ${target.name} ne trouve aucun titre détenu.`);
  } else if (card.effect === 'marginCall' && target) {
    if (sharesOf(target, p.id) > 0) {
      payOrSell(game, p, amount);
      effectLines.push(`${p.name} dépose ${amount} M€ de garantie supplémentaire pour ${target.name}.`);
    } else effectLines.push(`${p.name} ne détient pas ${target.name} : aucune marge supplémentaire.`);
  } else if (card.effect === 'prison') {
    if (target && triggerOwnedTarget && !p.jailed) {
      p.previousZone = p.zone;
      p.jailed = true; p.prisonStage = 0; p.prisonWait = true; p.geoResolved = false; p.zone = 'prison';
      effectLines.push(`${p.name} détenait ${target.name} : placement en prison pour l’enquête.`);
    } else effectLines.push(`${p.name} ne détient pas l’entreprise visée : aucune détention.`);
  } else if (card.effect === 'regulation') {
    const sales = applyRegulation(game, card.targetSector, quantity);
    effectLines.push(...(sales.length ? sales : ['Aucun fonds ne détient une position dominante concernée.']));
  }
  const impacts = marketImpacts(game, before);
  game.log.push(`Événement de case : ${card.title} (${p.name})`);
  notice(game, { kind: 'event', source: 'board', cardType: 'event', cardId: card.id,
    playerId: p.id, playerName: p.name, effect: card.effect,
    targetCompanyId: target?.id, targetCompanyName: target?.name,
    targetedSector: target?.sector || card.targetSector, targetedZone: target?.zone,
    title: card.title, description, roll: die, position: p.sectorPosition,
    cell: { kind: cell.kind, label: cell.label }, effectLines,
    ...impacts });
  recordMarketHistory(game, 'événement');
}

function fundValue(game, p) {
  return Math.round((p.cash + game.companies.reduce((sum, c) => sum + sharesOf(c, p.id) * priceFor(c, game), 0)) * 100) / 100;
}
function historyPoint(game, reason) {
  return {
    seq: (game.marketHistory?.at(-1)?.seq || 0) + 1,
    cycle: game.cycle || 1,
    reason,
    zoneGrades: { ...game.zoneGrades },
    sectorGrades: { ...game.sectorGrades },
    prices: Object.fromEntries(game.companies.map(c => [c.id, c.available ? priceFor(c, game) : 0])),
    funds: Object.fromEntries(game.players.map(p => [p.id, fundValue(game, p)])),
  };
}
function recordMarketHistory(game, reason) {
  game.marketHistory ||= [];
  const point = historyPoint(game, reason);
  const previous = game.marketHistory.at(-1);
  if (previous && JSON.stringify([previous.zoneGrades, previous.sectorGrades, previous.prices, previous.funds]) ===
      JSON.stringify([point.zoneGrades, point.sectorGrades, point.prices, point.funds])) return;
  game.marketHistory.push(point);
  if (game.marketHistory.length > 180) game.marketHistory.splice(0, game.marketHistory.length - 180);
}
function payOrSell(game, p, amount, context = null) {
  if (amount <= 0) return true;
  p.cash -= amount;
  const assets = game.companies.flatMap(c => Array.from({ length: sharesOf(c, p.id) }, () => c));
  for (const c of assets) {
    if (p.cash >= 0) break;
    const price = priceFor(c, game);
    if (price <= 0) continue;
      removeHolding(c, p.id, 1); p.cash += price;
      if (context) context.forcedSales.push({ companyId: c.id, companyName: c.name || c.id, quantity: 1, perShare: price, amount: price });
  }
  if (p.cash < 0) { p.solvent = false; p.cash = 0; }
  return p.solvent;
}

function processPrisonRoll(game, p, roll) {
  if (!p.jailed) return true;
  const r = Number(roll);
  if (!Number.isInteger(r) || r < 1 || r > 6) fail('Le dé doit être compris entre 1 et 6.');
  if (p.prisonStage === 0) {
    p.prisonStage = r === 6 ? -1 : 1;
  } else if (p.prisonStage === 1) {
    p.prisonStage = r === 5 || r === 6 ? -1 : 2;
  } else if (p.prisonStage === 2) {
    payOrSell(game, p, 5); p.prisonStage = -1;
  }
  if (p.prisonStage === -1) {
    p.jailed = false;
    p.zone = p.previousZone && p.previousZone !== 'prison'
      ? p.previousZone
      : NATIONALITY_BY_ID.get(p.nationality)?.zoneId || 'europe';
    delete p.previousZone;
    game.log.push(`${p.name} sort de prison et retrouve son marché en ${zone(game, p.zone).name}`);
    return true;
  }
  game.log.push(`${p.name} reste en prison`); return false;
}

function chooseZone(game, p, target) {
  const fromZoneId = p.zone;
  const destination = zone(game, target);
  const cost = fromZoneId === target ? 0 : 1;
  const moveContext = { forcedSales: [] };
  if (cost) payOrSell(game, p, cost, moveContext);
  p.zone = target;
  p.geoResolved = true;
  game.log.push(cost ? `${p.name} voyage vers ${destination.name} pour 1 M€` : `${p.name} reste en ${destination.name} sans frais`);
  if (cost) notice(game, { kind: 'payments', playerId: p.id, playerName: p.name, action: 'move',
    title: `Voyage vers ${destination.name}`, fromZoneId, zoneId: target, zoneName: destination.name,
    payments: [{ fromId: p.id, toId: null, companyId: null, companyName: null, quantity: 1, perShare: 1, amount: 1, forcedSales: moveContext.forcedSales }] });
  recordMarketHistory(game, 'voyage');
}

function move(game, p, payload) {
  if (game.phase !== 'geography') fail('Le voyage se choisit avant le dé sectoriel.');
  if (p.jailed) fail('Le procès doit être joué avant de voyager.');
  if (p.geoResolved) fail('Le choix géographique a déjà été joué ce tour.');
  const target = idOf(payload && payload.zoneId);
  zone(game, target);
  chooseZone(game, p, target);
  game.phase = p.solvent ? 'sector' : 'awaitNext';
  game.stage = game.phase;
}

function stay(game, p) {
  if (game.phase !== 'geography') fail('Le choix de rester précède le dé sectoriel.');
  if (p.jailed) fail('Le procès doit être joué avant de rester.');
  if (p.geoResolved) fail('Le choix géographique a déjà été joué ce tour.');
  if (!p.zone) fail('Le fonds doit avoir un marché de départ.');
  chooseZone(game, p, p.zone);
  game.phase = 'sector';
  game.stage = 'sector';
}

function prisonRoll(game, p) {
  if (game.phase !== 'geography' || !p.jailed) fail('Aucun procès à jouer maintenant.');
  const die = suppliedDie();
  p.prisonWait = false;
  const released = processPrisonRoll(game, p, die);
  p.geoResolved = false;
  notice(game, { kind: 'event', source: 'board', action: 'prisonRoll', playerId: p.id,
    playerName: p.name, roll: die, title: released ? 'Libération' : 'Procès ajourné',
    description: released ? `${p.name} retrouve son marché et peut choisir de voyager.` : `${p.name} reste en prison et passe son tour sans échanges.` });
  if (!released || !p.solvent) { game.phase = 'awaitNext'; p.geoResolved = true; }
  else if (game.cycle === 1) { p.geoResolved = true; game.phase = 'sector'; }
  game.stage = game.phase;
  recordMarketHistory(game, 'procès');
}

function settleLap(game, p, payments) {
  const currentValue = fundValue(game, p);
  const flow = Number(p.capitalFlows || 0) - Number(p.lapStartCapitalFlows || 0);
  const baseline = Number(p.lapStartValue ?? currentValue);
  const performance = Math.round((currentValue - baseline - flow) * 100) / 100;
  const lapReturn = baseline > 0 ? Math.round((performance / baseline) * 10000) / 100 : 0;
  const adjustment = performance > 0 ? 20 : performance < 0 ? -20 : 0;
  const forced = { forcedSales: [] };
  if (adjustment > 0) p.cash += adjustment;
  else if (adjustment < 0) payOrSell(game, p, -adjustment, forced);
  p.capitalFlows = Number(p.capitalFlows || 0) + adjustment;
  p.lapPerformance = performance;
  // Start records the new baseline only after the injection/withdrawal.
  p.lapStartValue = fundValue(game, p);
  p.lapStartCapitalFlows = p.capitalFlows;
  if (adjustment) payments.push({ fromId: adjustment < 0 ? p.id : null, toId: adjustment > 0 ? p.id : null,
    quantity: 1, perShare: Math.abs(adjustment), amount: Math.abs(adjustment), reason: 'Performance au Départ', forcedSales: forced.forcedSales });
  notice(game, { kind: 'event', source: 'board', action: 'lap', playerId: p.id, playerName: p.name,
    title: 'Bilan au Départ', lapPerformance: performance, lapReturn,
    description: `Performance du tour : ${performance} M€ (${lapReturn} %). Flux de capital : ${adjustment} M€.` });
}

function trade(game, p, payload) {
  if (game.phase !== 'market') fail('Les échanges ne sont possibles que pendant le marché.');
  if (p.jailed) fail('Les avoirs sont gelés pendant la détention.');
  if (!p.geoResolved) fail('Choisissez de rester ou de voyager avant les échanges.');
  const c = company(game, payload && payload.companyId);
  const quantity = Number(payload && payload.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) fail('Quantité de titres invalide.');
  if (c.zone !== p.zone) fail('Cette entreprise est dans une autre zone.');
  if (payload.side !== 'buy' && payload.side !== 'sell') fail('Opération inconnue : utilisez buy ou sell.');
  const price = priceFor(c, game);
  if (payload.side === 'buy') {
    if (!c.available || (currentGrade(game, 'zone', c.zone) === 'E' && currentGrade(game, 'sector', c.sector) === 'E')) fail('Cette entreprise n’est pas cotée.');
    if (totalHeld(c) + quantity > 5) fail('Il ne reste pas assez de titres.');
    if (p.cash < quantity * price) fail('Liquidités insuffisantes.');
    p.cash -= quantity * price;
    recordBuy(c, p.id, quantity, price);
    c.holdings[p.id] = sharesOf(c, p.id) + quantity;
  } else {
    if (sharesOf(c, p.id) < quantity) fail('Vous ne possédez pas assez de titres.');
    removeHolding(c, p.id, quantity); p.cash += quantity * price;
  }
  game.log.push(`${p.name} ${payload.side === 'buy' ? 'achète' : 'vend'} ${quantity} titre(s) de ${c.name || c.id}`);
  p.fundValue = fundValue(game, p);
  recordMarketHistory(game, 'échange');
  return game;
}

function sectorIdAt(game, position) {
  const cell = game.board[position % game.board.length];
  return cell && (cell.sector || cell.sectorId || (cell.kind === 'sector' ? cell.id : null));
}
function roll(game, p, payload) {
  if (game.phase !== 'sector') fail('Le déplacement sectoriel n’est pas ouvert.');
  const die = suppliedDie(payload);
  if (die < 1 || die > 6) fail('Le dé doit être compris entre 1 et 6.');
  const old = p.sectorPosition;
  p.sectorPosition = (old + die) % game.board.length;
  game.log.push(`${p.name} lance ${die} et arrive sur ${game.board[p.sectorPosition]?.label || 'le marché'}`);
  const payments = [];
  if (old + die >= game.board.length) settleLap(game, p, payments);
  const cell = game.board[p.sectorPosition % game.board.length];
  const landed = sectorIdAt(game, p.sectorPosition);
  if (cell && String(cell.kind || '').toLowerCase() === 'event') drawBoardEvent(game, p, die, cell);
  if (cell && String(cell.kind || '').toLowerCase() === 'market') {
    const before = marketSnapshot(game);
    const label = String(cell.label || '');
    const scope = randInt(2) === 0 ? 'zone' : 'sector';
    const list = scope === 'zone' ? game.zones : game.sectors;
    const delta = label.includes('Bull') ? -1 : label.includes('Crash') ? 2 : 1;
    list.forEach(item => {
      const oldGrade = currentGrade(game, scope, item.id);
      setGrade(game, scope, item.id, GRADES[Math.max(0, Math.min(4, GRADES.indexOf(oldGrade) + delta))]);
    });
    game.log.push(`${label} : ${scope === 'zone' ? 'zones' : 'secteurs'} ${delta < 0 ? 'en hausse' : 'en baisse'}`);
    bankruptCompanies(game);
    const targets = list.map(item => ({ scope, id: item.id }));
    notice(game, { kind: 'event', source: 'board', title: label || 'Variation de marché', roll: die, position: p.sectorPosition, description: describeGrades(game, before, targets),
      gradeOutcomes: gradeOutcomes(game, before, targets), ...marketImpacts(game, before) });
  }
  game.companies.filter(c => c.sector === landed).forEach(c => {
    Object.keys(c.holdings).forEach(pid => {
      const qty = sharesOf(c, pid);
      if (!qty) return;
      const amount = qty * incomeForHolder(c, game, pid);
      const holder = game.players.find(x => x.id === pid);
      if (holder.jailed) {
        if (pid !== p.id) { const context = { forcedSales: [] }; payOrSell(game, p, amount, context); payments.push({ fromId: p.id, toId: null, companyId: c.id, companyName: c.name || c.id, quantity: qty, perShare: incomeForHolder(c, game, pid), amount, forcedSales: context.forcedSales }); }
        return;
      }
      if (pid === p.id) { p.cash += amount; payments.push({ fromId: null, toId: p.id, companyId: c.id, companyName: c.name || c.id, quantity: qty, perShare: incomeForHolder(c, game, pid), amount }); }
      else {
        const context = { forcedSales: [] };
        payOrSell(game, p, amount, context);
        holder.cash += amount;
        payments.push({ fromId: p.id, toId: holder.id, companyId: c.id, companyName: c.name || c.id, quantity: qty, perShare: incomeForHolder(c, game, pid), amount, forcedSales: context.forcedSales });
      }
    });
  });
  if (payments.length || cell?.kind !== 'event') notice(game, { kind: 'payments', playerId: p.id, playerName: p.name, roll: die, position: p.sectorPosition, cell: cell ? { kind: cell.kind, label: cell.label, sector: landed } : null, payments });
  p.fundValue = fundValue(game, p);
  recordMarketHistory(game, cell?.kind === 'market' ? 'marché' : 'dé');
  game.phase = p.jailed || !p.solvent ? 'awaitNext' : 'market';
  game.stage = game.phase;
  if (p.jailed) {
    p.geoResolved = true;
    notice(game, { kind: 'event', source: 'board', action: 'skipTrading', playerId: p.id, playerName: p.name,
      title: 'Avoirs gelés', description: `${p.name} est en prison : la séance d’échanges est passée. Le premier procès aura lieu à son prochain tour.` });
  }
  return game;
}

function endMarket(game, p) {
  if (game.phase !== 'market') fail('La phase de marché est déjà terminée.');
  if (!p.geoResolved) fail('Choisissez de rester ou de voyager avant de terminer le marché.');
  game.phase = 'awaitNext';
  return game;
}

function nextTurn(game, p) {
  if (game.phase !== 'awaitNext') fail('Terminez votre action avant de passer.');
  p.fundValue = fundValue(game, p);
  if (!game.completedPlayers.includes(p.id)) game.completedPlayers.push(p.id);
  const alive = game.players.filter(x => x.solvent);
  if (alive.length === 0 || (alive.length <= 1 && game.players.length > 1)) { finishGame(game); return game; }
  const ordered = [...game.players.slice(game.starterIndex), ...game.players.slice(0, game.starterIndex)].filter(x => x.solvent);
  const nextPlayer = ordered.find(x => !game.completedPlayers.includes(x.id));
  if (!nextPlayer) {
    game.completedPlayers = [];
    if (!game.deck.length) { finishGame(game); return game; }
    for (let offset = 1; offset <= game.players.length; offset += 1) {
      const candidate = (game.starterIndex + offset) % game.players.length;
      if (game.players[candidate].solvent) { game.starterIndex = candidate; break; }
    }
    game.activeIndex = game.starterIndex;
    game.stage = 'geography';
    game.phase = 'geography';
    // The opening cycle already has a geographic starting point. Once the
    // first Context is drawn, every following cycle asks for a new choice.
    const geographicChoiceRequired = (game.cycle || 1) >= 1 && game.deck.length > 0;
    game.players.forEach(x => { x.geoResolved = geographicChoiceRequired ? false : true; x.botMarketDone = false; x.botSectorRolled = false; });
    drawContext(game);
  } else {
    game.activeIndex = game.players.indexOf(nextPlayer);
    game.stage = 'geography';
    game.phase = 'geography';
    nextPlayer.geoResolved = game.cycle === 1 && !nextPlayer.jailed;
    game.phase = nextPlayer.geoResolved ? 'sector' : 'geography';
    game.stage = game.phase;
  }
  return game;
}

function finishGame(game) {
  game.phase = 'finished';
  game.finished = true;
  const solvent = game.players.filter(p => p.solvent);
  const values = solvent.map(p => fundValue(game, p));
  const best = values.length ? Math.max(...values) : 0;
  game.winnerIds = solvent.filter(p => fundValue(game, p) === best).map(p => p.id);
}

function createGame(names) {
  if (!Array.isArray(names) || names.length < 2 || names.length > 6) fail('La partie doit compter de 2 à 6 joueurs.');
  const descriptors = names.map(entry => typeof entry === 'object' ? entry : { name: entry, bot: false });
  const zones = clone(data.zones || []).map(z => ({ id: String(z.id), name: z.name }));
  const sectors = clone(data.sectors || []).map(s => ({ id: String(s.id), name: s.name }));
  const board = clone(data.board || sectors.map(s => ({ kind: 'sector', sector: s.id, label: s.name })));
  if (!board.length) fail('Le plateau sectoriel est vide.');
  const initiative = descriptors.map(() => randInt(6) + 1);
  let candidates = initiative.map((value, index) => ({ value, index })).filter(item => item.value === Math.max(...initiative)).map(item => item.index);
  while (candidates.length > 1) {
    const rerolls = candidates.map(index => ({ index, value: randInt(6) + 1 }));
    const highest = Math.max(...rerolls.map(item => item.value));
    candidates = rerolls.filter(item => item.value === highest).map(item => item.index);
  }
  const starterIndex = candidates[0];
  const players = descriptors.map((entry, i) => {
    const record = { id: `p${i + 1}`, name: String(entry.name || `Joueur ${i + 1}`), bot: entry.kind === 'ai', pawn: entry.pawn, color: ['#dfb96d', '#55a9e2', '#c2cbd6', '#b18bea', '#e96b6b', '#55b999'][i], difficulty: entry.difficulty, lapStartValue: 100, capitalFlows: 0, lapStartCapitalFlows: 0, cash: 100, zone: null, sectorPosition: 0, jailed: false, prisonStage: -1, prisonWait: false, geoResolved: true, botMarketDone: false, botSectorRolled: false, solvent: true, fundValue: 100 };
    applyNationality(record, entry.nationality);
    return record;
  });
  const game = {
    players,
    zones, sectors, board,
    zoneGrades: Object.fromEntries(zones.map(z => [z.id, 'C'])),
    sectorGrades: Object.fromEntries(sectors.map(s => [s.id, 'C'])),
    companies: clone(data.companies || []).map(c => ({ ...c, id: String(c.id), zone: String(c.zone), sector: String(c.sector), holdings: {}, costBasis: {}, available: true })),
    deck: contextDeck(), currentContext: null, boardEventDeck: shuffle(BOARD_EVENT_CARDS.map(clone)), boardEventDiscard: [], activeIndex: starterIndex, starterIndex, initiative, turnFormat: 'travel-first', rulesVersion: 3, eventTextVersion: 2, cardRulesVersion: 2, nationalityRulesVersion: 1, legacyOpening: false, stage: 'sector', phase: 'sector', cycle: 1, noticeSeq: 0, notices: [], finished: false, winnerIds: [], completedPlayers: [], log: [], started: true
  };
  game.log.push(`${game.players[starterIndex].name} ouvre la partie (dé ${initiative[starterIndex]})`);
  game.log.push('Cycle d’ouverture : tous les indices commencent à C, sans carte Contexte.');
  recordMarketHistory(game, 'ouverture');
  return game;
}

function applyAction(game, playerId, action, payload = {}) {
  if (!game || game.phase === 'finished') fail('La partie est terminée.');
  const p = player(game, playerId);
  if (game.players[game.activeIndex].id !== p.id) fail('Ce n’est pas votre tour.');
  if (!p.solvent && action !== 'nextTurn') fail('Ce joueur est insolvable.');
  switch (action) {
    case 'move': move(game, p, payload); break;
    case 'prisonRoll': prisonRoll(game, p); break;
    case 'stay': stay(game, p); break;
    case 'trade': trade(game, p, payload); break;
    case 'endMarket': endMarket(game, p); break;
    case 'roll': roll(game, p, payload); break;
    case 'nextTurn': nextTurn(game, p); break;
    default: fail(`Action inconnue : ${action}`);
  }
  if (!p.solvent && game.phase !== 'finished') game.phase = 'awaitNext';
  game.stage = game.phase;
  return game;
}

function publicState(game) {
  // Upgrade old serialized rooms lazily when they are first observed.
  game.players.forEach(item => {
    if (!item.nationality || !item.nationalityName || !item.nationalityFlag) applyNationality(item, item.nationality, item.zone);
    if (!game.legacyOpening && (game.cycle || 1) === 1 && !item.jailed) item.geoResolved = true;
    else if (item.geoResolved == null) item.geoResolved = (game.cycle || 1) === 1;
  });
  const state = clone(game);
  state.activePlayerId = game.players[game.activeIndex] && game.players[game.activeIndex].id;
  state.contextsRemaining = game.deck.length;
  state.boardEventsRemaining = Array.isArray(game.boardEventDeck) ? game.boardEventDeck.length : BOARD_EVENT_CARDS.length;
  state.marketHistory = game.marketHistory?.length ? state.marketHistory : [historyPoint(game, 'reprise')];
  state.currentContext = game.currentContext || game.currentEvent || null;
  delete state.currentEvent;
  state.finished = game.phase === 'finished' || game.finished === true;
  state.winnerIds = state.finished ? (game.winnerIds || []) : [];
  state.players = game.players.map(p => ({
    ...p,
    position: p.sectorPosition,
    valuation: fundValue(game, p),
    fundValue: fundValue(game, p)
  }));
  state.companies = game.companies.map(c => ({ ...c, price: priceFor(c, game), income: incomeFor(c, game), totalHeld: totalHeld(c), sharesAvailable: c.available ? Math.max(0, 5 - totalHeld(c)) : 0, averageBuyPrice: Object.fromEntries(Object.keys(c.holdings).map(pid => [pid, averageBuyPrice(c, pid)])) }));
  state.companies.forEach(c => { delete c.costBasis; });
  delete state.deck;
  delete state.boardEventDeck;
  delete state.boardEventDiscard;
  return state;
}

module.exports = { createGame, applyAction, publicState, priceFor, incomeFor, incomeForHolder, ownsMonopoly, fundValue, eventDescription, data, nationalities };
