const SUITS = ['♠','♥','♦','♣'];
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RANK_V = {A:1,2:2,3:3,4:4,5:5,6:6,7:7,8:8,9:9,'10':10,J:11,Q:12,K:13};
const RED_S = ['♥','♦'];
const FACE_R = ['J','Q','K'];

let state = {
  mode: 'single',
  players: [{name:'',score:0,hand:[]},{name:'Computer',score:0,hand:[]}],
  deck: [],
  currentPlayer: 0,
  discardMode: false,
  hasDrawnThisTurn: false,
  hasShuffledThisTurn: false,
  lastClaimPlayer: -1,
  pendingWin: null,
};

function selectMode(m) {
  state.mode = m;
  document.getElementById('btn-single').classList.toggle('active', m==='single');
  document.getElementById('btn-double').classList.toggle('active', m==='double');
  document.getElementById('p2-name-group').style.display = m==='double' ? 'block' : 'none';
}

function startGame() {
  const p1 = document.getElementById('p1name').value.trim() || 'Player 1';
  const p2 = state.mode === 'double'
    ? (document.getElementById('p2name').value.trim() || 'Player 2')
    : 'Computer';

  state.players[0] = {name:p1, score:0, hand:[]};
  state.players[1] = {name:p2, score:0, hand:[]};
  state.currentPlayer = 0;
  state.discardMode = false;
  state.hasDrawnThisTurn = false;
  state.hasShuffledThisTurn = false;
  state.lastClaimPlayer = -1;
  state.pendingWin = null;

  document.getElementById('overlay').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('game').style.display = 'block';

  updateHUD();
  initDeck();
  animateDeal();
}

function initDeck() {
  state.deck = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      state.deck.push({suit:s, rank:r});
    }
  }
  shuffleArray(state.deck);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function animateDeal() {
  const p1zone = document.getElementById('p1-zone');
  const p2zone = document.getElementById('p2-zone');
  p1zone.innerHTML = `<div class="player-label" id="p1-label">${state.players[0].name}</div>`;
  p2zone.innerHTML = `<div class="player-label" id="p2-label">${state.players[1].name}</div>`;

  state.players[0].hand = [];
  state.players[1].hand = [];

  for (let i = 0; i < 3; i++) state.players[0].hand.push(state.deck.pop());
  for (let i = 0; i < 3; i++) state.players[1].hand.push(state.deck.pop());

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const allDeal = [
    ...state.players[0].hand.map((card, i) => ({card, player: 0, idx: i})),
    ...state.players[1].hand.map((card, i) => ({card, player: 1, idx: i})),
  ];

  allDeal.forEach(({card, player, idx}, di) => {
    setTimeout(() => {
      flyCard(card, cx, cy, player, idx, allDeal.length, () => {
        if (di === allDeal.length - 1) {
          renderAll();
          updateDeckCount();
          toast('Game started! ' + state.players[0].name + ' goes first.');
        }
      });
    }, di * 120);
  });
}

function flyCard(card, fromX, fromY, player, idx, total, cb) {
  const el = document.createElement('div');
  el.className = 'flying-card';
  el.style.cssText = `left:${fromX}px;top:${fromY}px;width:var(--card-w);height:var(--card-h);`;
  el.innerHTML = makeCardBack();
  document.body.appendChild(el);

  const zone = player === 0 ? document.getElementById('p1-zone') : document.getElementById('p2-zone');
  const rect = zone.getBoundingClientRect();
  const cardW = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-w'));
  const totalW = Math.min(total / 2, 4) * (cardW + 12);
  const targetX = rect.left + rect.width / 2 - totalW / 2 + idx * (cardW + 12);
  const targetY = rect.top + 10;

  requestAnimationFrame(() => {
    el.style.transition = 'left 0.5s cubic-bezier(0.25,0.46,0.45,0.94), top 0.5s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.5s';
    el.style.left = targetX + 'px';
    el.style.top = targetY + 'px';
    el.style.transform = 'rotate(' + (Math.random() * 6 - 3) + 'deg)';
  });

  setTimeout(() => {
    el.remove();
    cb && cb();
  }, 540);
}

function renderAll() {
  renderHand(0, 'p1-zone', false);
  renderHand(1, 'p2-zone', state.mode === 'single');
  updateDeckCount();
  updateHUD();
  updateActionBtns();
}

function renderHand(playerIdx, zoneId, faceDown) {
  const zone = document.getElementById(zoneId);
  zone.innerHTML = `<div class="player-label">${state.players[playerIdx].name}</div>`;
  const hand = state.players[playerIdx].hand;

  hand.forEach((card, i) => {
    const el = makeCardEl(card, faceDown, playerIdx, i);
    if (state.discardMode && playerIdx === state.currentPlayer && !faceDown) {
      el.classList.add('discard-pick');
    }
    zone.appendChild(el);
  });
}

function makeCardEl(card, faceDown, playerIdx, cardIdx) {
  const div = document.createElement('div');
  div.className = 'card' + (faceDown ? ' face-down' : '');
  div.dataset.player = playerIdx;
  div.dataset.idx = cardIdx;

  if (faceDown) {
    div.innerHTML = `<div class="card-inner">${makeCardBack()}</div>`;
  } else {
    div.innerHTML = `<div class="card-inner">${makeCardFace(card)}</div>`;
    if (playerIdx === state.currentPlayer && !(state.mode === 'single' && playerIdx === 1)) {
      div.draggable = true;
      div.addEventListener('click', () => onCardClick(playerIdx, cardIdx));
      div.addEventListener('dragstart', e => onDragStart(e, playerIdx, cardIdx));
      div.addEventListener('dragend', e => onDragEnd(e));
    }
  }

  return div;
}

function makeCardBack() {
  return `<div class="card-back"><div class="card-back-pattern"></div><div class="card-back-emblem">♚</div></div>`;
}

function makeCardFace(card) {
  const isRed = RED_S.includes(card.suit);
  const cls = isRed ? 'red-card' : 'black-card';
  const isFace = FACE_R.includes(card.rank);
  const centerContent = isFace
    ? `<div class="face-label">${{J:'JACK',Q:'QUEEN',K:'KING',A:'ACE'}[card.rank] || card.rank}</div><div>${card.suit}</div>`
    : card.suit;

  return `
    <div class="card-face ${cls} ${isFace ? 'face-card' : ''}">
      <div class="card-corner">
        <div class="rank">${card.rank}</div>
        <div class="suit-small">${card.suit}</div>
      </div>
      <div class="card-center">${centerContent}</div>
      <div class="card-corner bottom">
        <div class="rank">${card.rank}</div>
        <div class="suit-small">${card.suit}</div>
      </div>
    </div>`;
}

function updateDeckCount() {
  document.getElementById('deck-count').textContent = state.deck.length + ' cards';
}

function updateHUD() {
  const [p1, p2] = state.players;
  document.getElementById('hud-p1-name').textContent = p1.name;
  document.getElementById('hud-p2-name').textContent = p2.name;
  document.getElementById('hud-p1-score').textContent = p1.score + ' pts';
  document.getElementById('hud-p2-score').textContent = p2.score + ' pts';
  document.getElementById('turn-text').textContent = state.players[state.currentPlayer].name.toUpperCase();
  document.getElementById('shuffle-count').textContent = state.hasShuffledThisTurn ? 'Shuffled ✓' : 'Shuffle available';
}

function updateActionBtns() {
  const isMyTurn = state.currentPlayer === 0 || state.mode === 'double';
  const inDiscard = state.discardMode;

  const deckLocked = inDiscard || state.hasDrawnThisTurn;
  document.getElementById('deck-pile').style.opacity = deckLocked ? '0.38' : '1';
  document.getElementById('deck-pile').style.pointerEvents = (deckLocked || !isMyTurn) ? 'none' : 'auto';
  document.getElementById('deck-pile').title = state.hasDrawnThisTurn ? 'Already drew this turn' : '';

  document.getElementById('action-btns').style.opacity = (!isMyTurn || inDiscard) ? '0.35' : '1';
  document.getElementById('action-btns').style.pointerEvents = (!isMyTurn || inDiscard) ? 'none' : 'auto';

  const shuffleBtn = document.querySelector('.action-btn[onclick="shuffleDeck()"]');
  if (shuffleBtn) {
    const shufDone = state.hasShuffledThisTurn;
    shuffleBtn.style.opacity = shufDone ? '0.4' : '1';
    shuffleBtn.title = shufDone ? 'Already shuffled this turn' : 'Shuffle deck (once per turn)';
  }
}

let selectedCard = null;

function onCardClick(playerIdx, cardIdx) {
  if (playerIdx !== state.currentPlayer) return;
  if (state.discardMode && playerIdx === state.currentPlayer) {
    discardCard(playerIdx, cardIdx);
    return;
  }

  const cards = document.getElementById(playerIdx === 0 ? 'p1-zone' : 'p2-zone').querySelectorAll('.card');
  cards.forEach(c => c.classList.remove('selected'));

  if (selectedCard && selectedCard.player === playerIdx && selectedCard.idx === cardIdx) {
    selectedCard = null;
    return;
  }

  selectedCard = {player: playerIdx, idx: cardIdx};
  cards[cardIdx].classList.add('selected');
}

function discardCard(playerIdx, cardIdx) {
  const hand = state.players[playerIdx].hand;
  const card = hand.splice(cardIdx, 1)[0];

  const zoneId = playerIdx === 0 ? 'p1-zone' : 'p2-zone';
  const zone = document.getElementById(zoneId);
  const cardEls = zone.querySelectorAll('.card');
  const cardRect = cardEls[cardIdx] ? cardEls[cardIdx].getBoundingClientRect() : zone.getBoundingClientRect();
  const deckRect = document.getElementById('deck-pile').getBoundingClientRect();

  const flyEl = document.createElement('div');
  flyEl.className = 'flying-card';
  flyEl.style.cssText = `left:${cardRect.left}px;top:${cardRect.top}px;width:var(--card-w);height:var(--card-h);`;
  flyEl.innerHTML = `<div class="card-inner">${makeCardFace(card)}</div>`;
  document.body.appendChild(flyEl);

  requestAnimationFrame(() => {
    flyEl.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
    flyEl.style.left = deckRect.left + 'px';
    flyEl.style.top = deckRect.top + 'px';
    flyEl.style.transform = 'scale(0.85) rotate(10deg)';
    flyEl.style.opacity = '0.6';
  });

  setTimeout(() => {
    flyEl.remove();
    const insertAt = Math.floor(Math.random() * (state.deck.length + 1));
    state.deck.splice(insertAt, 0, card);

    state.discardMode = false;
    document.getElementById('discard-banner').classList.remove('show');
    selectedCard = null;
    renderAll();
    updateDeckCount();

    const handAfter = state.players[playerIdx].hand;
    const win = checkWin(handAfter);
    if (win) {
      state.pendingWin = { pid: playerIdx, result: win };
      showClaimPrompt(playerIdx, win);
    } else {
      toast('Card discarded — turn passes automatically.');
      setTimeout(() => autoPassTurn(), 700);
    }
  }, 420);
}

let dragData = null;

function onDragStart(e, playerIdx, cardIdx) {
  dragData = {player: playerIdx, idx: cardIdx};
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  dragData = null;
}

function drawCard() {
  if (state.discardMode) { toast('⚠ Discard a card first!'); return; }
  if (state.hasDrawnThisTurn) { toast('⚠ Already drew a card this turn!'); return; }
  if (state.deck.length === 0) { toast('No cards left — try shuffling.'); return; }
  if (state.currentPlayer !== 0 && state.mode !== 'double') return;

  const pid = state.currentPlayer;
  const card = state.deck.pop();
  state.players[pid].hand.push(card);
  state.hasDrawnThisTurn = true;

  const deckRect = document.getElementById('deck-pile').getBoundingClientRect();
  const zone = pid === 0 ? 'p1-zone' : 'p2-zone';

  animateCardFromDeck(card, deckRect, zone, () => {
    state.discardMode = true;
    document.getElementById('discard-banner').classList.add('show');
    toast('Card drawn — tap one to discard, then turn passes!');
    renderAll();
    updateDeckCount();
  });
}

function animateCardFromDeck(card, fromRect, targetZoneId, cb) {
  const el = document.createElement('div');
  el.className = 'flying-card';
  el.style.cssText = `left:${fromRect.left}px;top:${fromRect.top}px;width:var(--card-w);height:var(--card-h);`;
  el.innerHTML = `<div class="card-inner">${makeCardBack()}</div>`;
  document.body.appendChild(el);

  const zone = document.getElementById(targetZoneId);
  const rect = zone.getBoundingClientRect();

  requestAnimationFrame(() => {
    el.style.transition = 'all 0.45s cubic-bezier(0.25,0.46,0.45,0.94)';
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = (rect.top + 10) + 'px';
    el.style.transform = 'scale(1.1)';
  });

  setTimeout(() => { el.remove(); cb(); }, 460);
}

function checkWin(hand) {
  if (hand.length < 3) return null;

  for (let i = 0; i < hand.length - 2; i++) {
    for (let j = i + 1; j < hand.length - 1; j++) {
      for (let k = j + 1; k < hand.length; k++) {
        const combo = [hand[i], hand[j], hand[k]];
        const result = checkCombo(combo);
        if (result) return result;
      }
    }
  }
  return null;
}

function checkCombo(cards) {
  const ranks = cards.map(c => c.rank);
  const rvs = ranks.map(r => RANK_V[r]);

  if (ranks[0] === ranks[1] && ranks[1] === ranks[2]) {
    const isAce = ranks[0] === 'A';
    return { type: isAce ? 'Three Aces!' : 'Three of a Kind', points: isAce ? 150 : 100, bonus: isAce };
  }

  if (ranks.every(r => FACE_R.includes(r))) {
    return { type: 'Royal Hand', points: 100 };
  }

  const sorted = [...rvs].sort((a, b) => a - b);
  if (sorted[1] - sorted[0] === 1 && sorted[2] - sorted[1] === 1) {
    return { type: 'Straight', points: 100 };
  }

  return null;
}

function showClaimPrompt(pid, result) {
  document.getElementById('cp-title').textContent = state.players[pid].name + ' — Winning Hand!';
  document.getElementById('cp-sub').textContent = result.type + (result.bonus ? ' · BONUS!' : '');
  document.getElementById('cp-pts').textContent = '+' + result.points + ' pts';
  document.getElementById('claim-prompt').classList.add('show');
  if (result.bonus) spawnConfetti();
}

function claimFromPrompt() {
  document.getElementById('claim-prompt').classList.remove('show');
  if (!state.pendingWin) return;
  const { pid, result } = state.pendingWin;
  state.pendingWin = null;
  showClaimModal(pid, result);
}

function passFromPrompt() {
  document.getElementById('claim-prompt').classList.remove('show');
  state.pendingWin = null;
  toast('Winning hand skipped — turn passes.');
  setTimeout(() => autoPassTurn(), 400);
}

function attemptClaim() {
  if (state.discardMode) {
    toast('⚠ Discard a card first before claiming!');
    return;
  }

  const pid = state.currentPlayer;
  const hand = state.players[pid].hand;

  if (hand.length < 3) {
    toast('❌ You need at least 3 cards to claim!');
    return;
  }

  const result = checkWin(hand);
  if (result) {
    showClaimModal(pid, result);
  } else {
    toast('❌ No winning hand — draw, swap, or pass!');
  }
}

function showClaimModal(pid, result) {
  const pname = state.players[pid].name;
  document.getElementById('win-title').textContent = '⚑ ' + pname + ' Claims Victory!';
  document.getElementById('win-sub').textContent = result.type + (result.bonus ? ' · BONUS ROUND!' : '');
  document.getElementById('win-pts').textContent = '+' + result.points + ' pts';

  state.players[pid].score += result.points;
  state.lastClaimPlayer = pid;
  updateHUD();

  document.getElementById('win-modal').classList.add('show');
  if (result.bonus) spawnConfetti();
}

function continueGame() {
  document.getElementById('win-modal').classList.remove('show');
  state.players[0].hand = [];
  state.players[1].hand = [];
  initDeck();
  state.discardMode = false;
  state.hasDrawnThisTurn = false;
  state.hasShuffledThisTurn = false;
  state.pendingWin = null;
  document.getElementById('discard-banner').classList.remove('show');
  document.getElementById('claim-prompt').classList.remove('show');

  state.currentPlayer = state.lastClaimPlayer === 0 ? 1 : 0;
  animateDeal();
}

function confirmEndGame() {
  document.getElementById('confirm-end').classList.add('show');
}

function closeConfirmEnd() {
  document.getElementById('confirm-end').classList.remove('show');
}

function endGame() {
  document.getElementById('win-modal').classList.remove('show');
  document.getElementById('claim-prompt').classList.remove('show');
  document.getElementById('confirm-end').classList.remove('show');
  showScoreboard();
}

function passTurn() {
  if (state.discardMode) { toast('⚠ Discard a card first!'); return; }
  if (state.currentPlayer !== 0 && state.mode !== 'double') return;
  autoPassTurn();
}

function autoPassTurn() {
  const nextPlayer = state.currentPlayer === 0 ? 1 : 0;
  state.currentPlayer = nextPlayer;
  state.discardMode = false;
  state.hasDrawnThisTurn = false;
  state.hasShuffledThisTurn = false;
  selectedCard = null;
  document.getElementById('discard-banner').classList.remove('show');
  renderAll();

  if (state.mode === 'single' && nextPlayer === 1) {
    setTimeout(computerTurn, 800);
  } else {
    toast(state.players[nextPlayer].name + "'s turn!");
  }
}

function shuffleDeck() {
  if (state.discardMode) { toast('⚠ Discard a card first!'); return; }
  if (state.hasShuffledThisTurn) { toast('⚠ Already shuffled this turn!'); return; }
  if (state.deck.length === 0) { toast('Deck is empty!'); return; }

  state.hasShuffledThisTurn = true;
  shuffleArray(state.deck);

  const deck = document.getElementById('deck-pile');
  deck.style.animation = 'none';
  deck.offsetHeight;
  deck.style.animation = 'shake 0.4s ease';

  if (!document.getElementById('shake-kf')) {
    const style = document.createElement('style');
    style.id = 'shake-kf';
    style.textContent = `@keyframes shake{0%{transform:translate(0)}20%{transform:translate(-5px,2px)rotate(-3deg)}40%{transform:translate(5px,-2px)rotate(3deg)}60%{transform:translate(-4px,1px)rotate(-2deg)}80%{transform:translate(4px,-1px)rotate(2deg)}100%{transform:translate(0)}}`;
    document.head.appendChild(style);
  }

  setTimeout(() => { deck.style.animation = ''; }, 450);
  toast('Deck shuffled! ✓  (one shuffle per turn)');
  updateHUD();

  if (state.deck.length === 0 && !checkWin(state.players[0].hand) && !checkWin(state.players[1].hand)) {
    setTimeout(() => { toast('🤝 It\'s a Draw!'); }, 600);
  }
}

function computerTurn() {
  if (state.currentPlayer !== 1) return;
  document.getElementById('thinking').style.display = 'block';

  setTimeout(() => {
    document.getElementById('thinking').style.display = 'none';
    const hand = state.players[1].hand;
    const preWin = checkWin(hand);
    if (preWin) {
      showClaimModal(1, preWin);
      return;
    }

    if (state.deck.length > 0) {
      const card = state.deck.pop();
      hand.push(card);
      state.hasDrawnThisTurn = true;
      renderAll();
      updateDeckCount();

      setTimeout(() => {
        computerDiscardWorst();
        renderAll();
        updateDeckCount();
        toast('🤖 Computer drew and discarded.');

        const postWin = checkWin(state.players[1].hand);
        if (postWin) {
          setTimeout(() => showClaimModal(1, postWin), 400);
          return;
        }

        setTimeout(() => {
          state.hasDrawnThisTurn = false;
          state.hasShuffledThisTurn = false;
          state.currentPlayer = 0;
          renderAll();
          toast(state.players[0].name + "'s turn!");
        }, 700);
      }, 600);
    } else {
      toast('🤖 Computer passes (deck empty).');
      setTimeout(() => {
        state.hasDrawnThisTurn = false;
        state.hasShuffledThisTurn = false;
        state.currentPlayer = 0;
        renderAll();
        toast(state.players[0].name + "'s turn!");
      }, 400);
    }
  }, 1000 + Math.random() * 600);
}

function computerDiscardWorst() {
  const hand = state.players[1].hand;
  if (hand.length <= 3) return;

  let worstIdx = 0;
  let worstScore = Infinity;

  for (let i = 0; i < hand.length; i++) {
    let score = 0;
    for (let j = 0; j < hand.length; j++) {
      if (j === i) continue;
      for (let k = j + 1; k < hand.length; k++) {
        if (k === i) continue;
        if (checkCombo([hand[i], hand[j], hand[k]])) score++;
      }
    }
    if (score < worstScore) {
      worstScore = score;
      worstIdx = i;
    }
  }

  const discarded = hand.splice(worstIdx, 1)[0];
  const insertAt = Math.floor(Math.random() * (state.deck.length + 1));
  state.deck.splice(insertAt, 0, discarded);
  renderAll();
  updateDeckCount();
}

function showScoreboard() {
  const [p1, p2] = state.players;
  document.getElementById('sb-p1-name').textContent = p1.name;
  document.getElementById('sb-p2-name').textContent = p2.name;
  document.getElementById('sb-p1-pts').textContent = p1.score;
  document.getElementById('sb-p2-pts').textContent = p2.score;

  let winnerText = '';
  if (p1.score > p2.score) winnerText = '🏆 ' + p1.name + ' Wins the Game!';
  else if (p2.score > p1.score) winnerText = '🏆 ' + p2.name + ' Wins the Game!';
  else winnerText = '🤝 It\'s a Tie!';
  document.getElementById('sb-winner').textContent = winnerText;

  document.getElementById('scoreboard').classList.add('show');
  spawnConfetti();
}

function newGame() {
  document.getElementById('scoreboard').classList.remove('show');
  document.getElementById('win-modal').classList.remove('show');
  document.getElementById('hud').style.display = 'none';
  document.getElementById('game').style.display = 'none';
  document.getElementById('overlay').style.display = 'flex';
}

function spawnConfetti() {
  const symbols = ['♠','♥','♦','♣','★','✦'];
  const colors = ['#c9a84c','#c0392b','#2ecc71','#3498db','#f39c12','#fff'];

  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-char';
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      el.style.cssText = `
        left:${Math.random() * 100}vw;
        top:-40px;
        color:${colors[Math.floor(Math.random() * colors.length)]};
        animation-duration:${2 + Math.random() * 2}s;
        animation-delay:${Math.random() * 0.5}s;
        font-size:${0.8 + Math.random() * 1.2}rem;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }, i * 60);
  }
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

document.addEventListener('DOMContentLoaded', () => {
  const p1zone = document.getElementById('p1-zone');
  const p2zone = document.getElementById('p2-zone');

  [p1zone, p2zone].forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    zone.addEventListener('drop', e => {
      e.preventDefault();
      if (!dragData) return;
      toast('Card moved!');
      dragData = null;
    });
  });
});

document.addEventListener('keydown', e => {
  if (document.getElementById('overlay').style.display !== 'none') return;
  if (e.key === 'd' || e.key === 'D') drawCard();
  if (e.key === 'p' || e.key === 'P') passTurn();
  if (e.key === 'c' || e.key === 'C') attemptClaim();
  if (e.key === 's' || e.key === 'S') shuffleDeck();
});

selectMode('single');
