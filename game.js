/* THE WHITE ROOM — vanilla JavaScript starter
   Replace images in assets/images, audio in assets/audio, and video in assets/media.
   Important: filenames are CASE-SENSITIVE once published on GitHub Pages.
   Tune ASSETS, SCENE_LAYOUT, and PAINT_TARGETS to fit your final Illustrator exports.
*/
'use strict';

const ASSET_DIR = 'assets/images/';
const AUDIO_DIR = 'assets/audio/';
const VIDEO_DIR = 'assets/media/';
const ASSETS = {
  room: 'Room.png', tableClosed: 'Table-closed.png', tableOpen: 'Table-open.png',
  letterClosed: 'Letter-1.png', letterOpen: 'Letter-2.png',
  sun: 'Sun.png', moon: 'Moon.png', star: 'Star.png', tarotBack: 'Tarot-back.png',
  clockClosed: 'Clock-closed.png', clockOpen: 'Clock-open.png',
  shortHand: 'Short hand.png', longHand: 'Long-hand.png', password: 'Password.png',
  window: 'Window.png', atlas: 'Constellation.png', pyxis: 'PYXIS.png',
  boxClosed: 'Box-1.png', boxDial: 'Box-2.png', boxOpen: 'Box-3.png',
  frame: 'Frame.png', frameEmpty: 'Frame-2.png', frameComplete: 'Frame-3.png',
  painting: 'Woodcutter.jpg', axe: 'ax.png',
  key: 'Key.png', door: 'Door.png', doorOpen: 'Door-open.png',
  lockKey: 'Lock-1.png', lockCode: 'Lock-2.png',
  plankLeft: 'Woken pank-L.png', plankRight: 'Wooden plank-R.png',
  pieces: ['Paint-1.png','Paint-2.png','Paint-3.png','Paint-4.png','Paint-5.png']
};
const MEDIA = {
  gameplay: `${AUDIO_DIR}Gnossienne No. 1.mp3`,
  ending: `${AUDIO_DIR}Clair de lune.mp3`,
  moon: `${VIDEO_DIR}Moon.mp4`
};

const CLOCK_ANSWER = { hour: 4, minute: 27 };
const DOOR_CODE = '1888';
const STAR_WORD = 'PYXIS';
const TAROT = {
  sun: { name: 'SUN', image: 'sun', numeral: 'I', value: '4' },
  moon: { name: 'MOON', image: 'moon', numeral: 'II', value: '2' },
  star: { name: 'STAR', image: 'star', numeral: 'III', value: '7' }
};
const END_LINES = [
  'The moon was there before you arrived.',
  'The water remembers only what it reflects.',
  'Nothing has changed.',
  'Nothing ever needed to.',
  'The moon was there before you arrived.'
];
const SCENE_NAMES = ['THE CABINET', 'THE WINDOW', 'THE PAINTING', 'THE EXIT'];
const STORAGE_KEY = 'white-room-escape-v1';

const $ = (selector) => document.querySelector(selector);
const byId = (id) => document.getElementById(id);
const file = (key) => ASSET_DIR + (ASSETS[key] || key);
const escapeHtml = (value) => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);
const initialState = () => ({
  wall: 0, drawerOpen: false, letterRead: false,
  tarotOrder: shuffle(['sun','moon','star']), tarotFlipped: [],
  hour: 12, minute: 0, clockSolved: false,
  windowSeen: false, atlasSeen: false,
  boxLetters: ['A','A','A','A','A'], boxSolved: false, keyCollected: false,
  paintingPieces: [], paintingSolved: false, axeCollected: false,
  codeDigits: [0,0,0,0], codeUnlocked: false, keyUnlocked: false, plankBroken: false,
  selectedItem: null, complete: false
});
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return initialState();
    const state = {...initialState(), ...saved};
    if (!Array.isArray(state.tarotOrder) || state.tarotOrder.length !== 3) state.tarotOrder = shuffle(['sun','moon','star']);
    if (!Array.isArray(state.paintingPieces)) state.paintingPieces = [];
    if (!Array.isArray(state.tarotFlipped)) state.tarotFlipped = [];
    if (!Array.isArray(state.boxLetters) || state.boxLetters.length !== 5) state.boxLetters = ['A','A','A','A','A'];
    if (!Array.isArray(state.codeDigits) || state.codeDigits.length !== 4) state.codeDigits = [0,0,0,0];
    return state;
  } catch { return initialState(); }
}
let state = loadState();
let currentModal = null;
let selectedPaintPiece = null;
let endingInterval = null;
let endingIndex = 0;
let musicEnabled = false; // deliberately off until a user clicks the music button
const gameplayAudio = new Audio(MEDIA.gameplay);
const endingAudio = new Audio(MEDIA.ending);
gameplayAudio.loop = true; endingAudio.loop = true;
gameplayAudio.volume = .26; endingAudio.volume = .40;

function persist(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }
function notice(message){ byId('status').textContent = message; }
function setState(partial, message){ Object.assign(state,partial); persist(); render(); if(message) notice(message); }
function asset(key, label = '', extraClass = '') {
  const url = escapeHtml(file(key));
  return `<span class="asset-frame ${extraClass}"><img src="${url}" alt="${escapeHtml(label)}" draggable="false" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="asset-fallback" hidden>${escapeHtml(label)}</span></span>`;
}
function sprite(action, key, label, x, y, width, height, more='') {
  return `<button class="sprite" data-action="${action}" style="left:${x}%;top:${y}%;width:${width}%;height:${height}%;" aria-label="${escapeHtml(label)}" ${more}>${asset(key,label)}<span class="sprite-label">${escapeHtml(label)}</span></button>`;
}
function resetGame(){
  if (!confirm('Restart from the beginning? All puzzle progress will be erased.')) return;
  state = initialState(); selectedPaintPiece = null; currentModal=null; stopEnding(); closeModal();
  persist(); render(); notice('A new game begins. Read the letter on the table.');
}
function playAudio(audio){ audio.play().catch(() => { /* user gesture may be required */ }); }
function syncAudio(){
  const isEnd = state.complete;
  gameplayAudio.pause(); endingAudio.pause();
  if(musicEnabled) playAudio(isEnd ? endingAudio : gameplayAudio);
  byId('musicToggle').textContent = `♫ Music: ${musicEnabled ? 'On' : 'Off'}`;
}
function toggleMusic(){ musicEnabled = !musicEnabled; syncAudio(); notice(musicEnabled ? 'Music on. Use the same button to mute.' : 'Music muted.'); }

function render(){
  const shell = byId('gameShell');
  const isEnd = state.complete;
  byId('ending').hidden = !isEnd;
  byId('sceneObjects').hidden = isEnd;
  byId('roomBackground').hidden = isEnd;
  byId('sceneName').hidden = isEnd;
  byId('sceneInfo').hidden = isEnd;
  byId('turnLeft').disabled = isEnd;
  byId('turnRight').disabled = isEnd;
  byId('wallIndicator').textContent = isEnd ? 'THE END' : `WALL ${state.wall+1} OF 4`;
  byId('sceneName').textContent = `${String(state.wall+1).padStart(2,'0')} / ${SCENE_NAMES[state.wall]}`;
  byId('progress').textContent = `${[state.clockSolved,state.boxSolved,state.paintingSolved].filter(Boolean).length} / 3 puzzles`;
  if(!isEnd){
    byId('sceneObjects').innerHTML = [renderCabinet,renderWindow,renderPainting,renderExit][state.wall]();
    byId('sceneInfo').textContent = ['THE TAROT HOLDS THE TIME','LOOK BEYOND THE GLASS','A BROKEN IMAGE HIDES SOMETHING','THREE OBSTACLES, ONE EXIT'][state.wall];
  }
  renderInventory();
  if(currentModal) renderModal(currentModal);
}
function renderInventory(){
  const items = [];
  if(state.keyCollected && !state.keyUnlocked) items.push(['key','Key','⚿']);
  if(state.axeCollected && !state.plankBroken) items.push(['axe','Axe','⚒']);
  byId('inventory').innerHTML = items.length ? items.map(([id,label,symbol]) =>
    `<button class="inventory-item ${state.selectedItem===id?'active':''}" data-action="select-item" data-item="${id}"><span class="symbol">${symbol}</span>${label}${state.selectedItem===id?' ✓':''}</button>`).join('')
    : `<span class="inventory-empty">${state.complete?'You have escaped.':'Nothing available to carry.'}</span>`;
}
function renderCabinet(){
  let html = sprite('open-clock',state.clockSolved?'clockOpen':'clockClosed','Clock',59,8,22,51);
  html += sprite('open-table',state.drawerOpen?'tableOpen':'tableClosed',state.drawerOpen?'Inspect tarot cards':'Open cabinet drawer',17,53,32,37);
  html += sprite('open-letter','letterClosed','Read letter',28,57,11,10);
  if(state.drawerOpen) html += `<button class="sprite" data-action="open-tarot" style="left:26%;top:69%;width:20%;height:10%;background:#252f2bcc;color:#fff;font:clamp(9px,1.2vw,17px) Georgia,serif">EXAMINE CARDS</button>`;
  return html;
}
function renderWindow(){
  return sprite('open-window','window','Look outside',19,8,27,76)
    + sprite('open-atlas','atlas','Star chart',58,10,21,35)
    + sprite('open-box',state.boxSolved?'boxOpen':'boxClosed',state.boxSolved?'Open puzzle box':'Five-letter puzzle box',57,49,27,35);
}
function renderPainting(){
  let html = sprite('open-painting',state.paintingSolved?'frameComplete':'frameEmpty',state.paintingSolved?'Restored painting':'Repair the painting',35,10,30,69);
  if(!state.paintingSolved) html += `<button class="sprite" data-action="open-painting" style="left:39%;top:78%;width:22%;height:9%;background:#3f5148;color:#fff;font:clamp(10px,1.2vw,16px) Georgia,serif">5 MISSING FRAGMENTS</button>`;
  if(state.paintingSolved && !state.axeCollected) html += sprite('collect-axe','axe','Axe fallen from painting',52,75,13,20);
  return html;
}
function renderExit(){
  const finished = state.codeUnlocked && state.keyUnlocked && state.plankBroken;
  let html = finished ? `<div class="door-open-glow"></div>` : '';
  html += sprite('open-exit',finished?'doorOpen':'door',finished?'Open the door':'Exit door',33,5,34,87);
  if(!state.codeUnlocked) html += sprite('open-code','lockCode','Combination lock',38,41,13,16);
  if(!state.keyUnlocked) html += sprite('use-key','lockKey','Keyhole',53,40,11,19);
  if(!state.plankBroken) html += `<button class="plank" data-action="use-axe" aria-label="Wooden plank blocking the door">${asset('plankLeft','WOODEN')}<span style="position:absolute;left:46%;top:5%;font-size:clamp(9px,1vw,14px)">WOODEN PLANK</span></button>`;
  if(finished) html += `<button class="sprite" data-action="open-exit" style="left:42%;top:68%;width:16%;height:9%;background:#27332bcc;color:#fff;z-index:6">ENTER</button>`;
  return html;
}
function turn(delta){ if(state.complete) return; state.wall = (state.wall + delta + 4) % 4; persist(); closeModal(); render(); notice(`You turn toward ${SCENE_NAMES[state.wall].toLowerCase()}.`); }
function openModal(kind){ currentModal=kind; byId('modal').hidden=false; document.body.style.overflow='hidden'; renderModal(kind); }
function closeModal(){currentModal=null;byId('modal').hidden=true;document.body.style.overflow='';}
function renderModal(kind){
  const titleMap = {
    letter:'A Letter',tarot:'The Three Cards',clock:'The Clock',window:'The Night Sky',
    atlas:'Constellation Atlas',box:'The Five-Letter Box',painting:'The Broken Painting',
    code:'Combination Lock'
  };
  byId('modalTitle').textContent = titleMap[kind] || 'Inspect';
  byId('modalSubtitle').textContent = 'LOOK CLOSER';
  const renderers = {letter:modalLetter,tarot:modalTarot,clock:modalClock,window:modalWindow,atlas:modalAtlas,box:modalBox,painting:modalPainting,code:modalCode};
  if(renderers[kind]) byId('modalBody').innerHTML=renderers[kind]();
}
function modalLetter(){
  return `<div class="letter-paper"><p>To whoever finds themselves here,</p><p>There is only one way out. The door is secured by three different obstacles. Each wall holds part of what you need.</p><p>Click objects to examine them. Turn left or right to explore. Collect useful items in your inventory, then select an item and click where you wish to use it.</p><p>Look closely. Some answers are hidden in plain sight.</p><p class="letter-sign">— The Previous Occupant</p></div>`;
}
function modalTarot(){
  return `<p class="modal-text">Three cards lie inside the drawer, in a different order each game. Their small seals read I, II and III. Flip them over to reveal the hour, tens of minutes, and ones of minutes.</p>
    <div class="tarot-row">${state.tarotOrder.map(id => {
      const card=TAROT[id], flipped=state.tarotFlipped.includes(id);
      return `<button class="tarot-card" data-action="flip-tarot" data-card="${id}" aria-label="Flip ${card.name} card"><span class="order-seal">${card.numeral}</span>${flipped?`<span class="tarot-back">${card.value}</span>`:asset(card.image,card.name)}<span class="tarot-name">${flipped?'THE REVERSE':card.name}</span></button>`;
    }).join('')}</div><p class="mini-note">I = HOUR · II = TENS OF MINUTES · III = ONES OF MINUTES</p>`;
}
function modalClock(){
  const angleHour=(state.hour % 12)*30+state.minute*.5;
  const angleMinute=state.minute*6;
  const numbers = Array.from({length:12},(_,i)=>{
    const n=i===0?12:i; const theta=(i/12)*Math.PI*2 - Math.PI/2;
    const x=50+39*Math.cos(theta),y=50+39*Math.sin(theta);
    return `<span class="clock-num" style="left:${x}%;top:${y}%">${n}</span>`;
  }).join('');
  return `<div class="modal-layout"><div class="art-panel" style="min-height:330px"><div class="clock-art-viewport">
    <div class="clock-face clock-fallback">${numbers}<div class="clock-hand hour" style="transform:translateX(-50%) rotate(${angleHour}deg)"></div><div class="clock-hand minute" style="transform:translateX(-50%) rotate(${angleMinute}deg)"></div><div class="clock-center"></div></div>
    <img class="clock-body-image" src="${file(state.clockSolved?'clockOpen':'clockClosed')}" alt="Decorative antique clock" onload="this.parentElement.classList.add('has-art')" onerror="this.hidden=true">
    <div class="clock-art-hand short" style="transform:rotate(${angleHour}deg)"><img src="${file('shortHand')}" alt="" onerror="this.hidden=true"></div>
    <div class="clock-art-hand long" style="transform:rotate(${angleMinute}deg)"><img src="${file('longHand')}" alt="" onerror="this.hidden=true"></div>
  </div></div>
  <div><p class="modal-text">The clock hands move when the controls are pressed. Could the cards be telling you a time?</p><div class="clock-readout">${String(state.hour).padStart(2,'0')}:${String(state.minute).padStart(2,'0')}</div>
  <div class="clock-keys"><button class="game-button" data-action="hour-down">HOUR −</button><button class="game-button" data-action="hour-up">HOUR +</button></div>
  <div class="clock-keys"><button class="game-button secondary" data-action="minute-minus-five">−5 MIN</button><button class="game-button secondary" data-action="minute-down">−1 MIN</button><button class="game-button" data-action="minute-up">+1 MIN</button><button class="game-button" data-action="minute-plus-five">+5 MIN</button></div>
  ${state.clockSolved?`<div class="puzzle-success">The clock clicks open. The first door combination is <strong>${DOOR_CODE}</strong>.${asset('password',DOOR_CODE)}</div>`:'<p class="mini-note">A sealed compartment sits beneath the clock.</p>'}</div></div>`;
}
function modalWindow(){
  return `<p class="modal-text">Through the open window you can make out three connected stars. A reference chart sits nearby.</p><div class="art-panel" style="max-width:570px;margin:auto;background:#060c12;min-height:260px;">${asset('pyxis','Three connected stars: an unknown constellation')}</div>
  <div class="action-row"><button class="game-button" data-action="open-atlas">Examine the star atlas</button><button class="game-button secondary" data-action="open-box">Inspect the five-letter box</button></div>`;
}
function modalAtlas(){
  return `<p class="modal-text">A chart of constellations. Which pattern matches the stars outside?</p><div class="art-panel" style="background:#060a0d;min-height:300px;max-width:650px;margin:auto">${asset('atlas','PYXIS   /   CRUX   /   LYRA   /   ORION')}</div><div class="action-row"><button class="game-button" data-action="open-window">Check the sky again</button><button class="game-button" data-action="open-box">Try a name on the lock</button></div>`;
}
function letterWheelRow(){
  return `<div class="dial-row">${state.boxLetters.map((value,i)=>`<div class="dial"><button data-action="letter-up" data-i="${i}" aria-label="Previous letter in slot ${i+1}">▲</button><div class="dial-value">${value}</div><button data-action="letter-down" data-i="${i}" aria-label="Next letter in slot ${i+1}">▼</button></div>`).join('')}</div>`;
}
function modalBox(){
  return `<div class="modal-layout"><div class="art-panel">${asset(state.boxSolved?'boxOpen':'boxClosed',state.boxSolved?'Open box':'Closed five-letter puzzle box')}</div>
  <div><p class="modal-text">Five little letter wheels turn on the front of the box. What did you see through the window?</p>${state.boxSolved?`<div class="puzzle-success">The mechanism releases. The box opens.</div><div class="action-row">${state.keyCollected?'The key has already been collected.':'<button class="game-button" data-action="collect-key">Collect the key</button>'}</div>`:letterWheelRow()}
  ${!state.boxSolved?'<p class="puzzle-instruction">Use ▲ or ▼ to cycle through letters. The lock checks the word automatically.</p>':''}</div></div>`;
}
function modalPainting(){
  const finished = state.paintingSolved;
  return `<p class="modal-text">A painting has been torn into five pieces. Fit them back into the empty frame. <strong>Drag a piece to the matching slot</strong>, or select a piece and then click a slot (touch-friendly).</p>
  <div class="paint-stage"><div><div class="paint-board" id="paintBoard">${[1,2,3,4,5].map(i=>{
    const placed=state.paintingPieces.includes(i);
    return `<div class="paint-slot ${placed?'filled':''}" data-slot="${i}" role="button" tabindex="0" aria-label="Painting slot ${i}">${placed?asset(ASSETS.pieces[i-1],`Piece ${i}`):'<span>□</span>'}</div>`;
  }).join('')}</div><p class="puzzle-instruction">${state.paintingPieces.length} / 5 pieces in position</p></div>
  <div><div class="pieces-tray">${[1,2,3,4,5].filter(i=>!state.paintingPieces.includes(i)).map(i=>
    `<button class="fragment ${selectedPaintPiece===i?'selected':''}" data-piece="${i}" draggable="true" aria-label="Painting fragment ${i}">${asset(ASSETS.pieces[i-1],`FRAGMENT ${i}`)}</button>`).join('') || '<p>The painting is whole.</p>'}</div>
  ${finished?`<div class="puzzle-success"><strong>The image is restored.</strong><br>Something slips from the painting and falls onto the floor. ${state.axeCollected?'The axe is already in your inventory.':'Close this view and collect the axe beneath the painting.'}</div>`:'<p class="puzzle-instruction">Every piece has one correct target. A matching piece snaps into position; an incorrect piece stays in the tray.</p>'}</div></div>`;
}
function modalCode(){
  return `<p class="modal-text">An old four-wheel numerical lock. Perhaps you have already seen its code somewhere in the room.</p><div class="number-lock"><div class="dial-row">${state.codeDigits.map((n,i)=>`<div class="dial"><button data-action="digit-up" data-i="${i}" aria-label="Increase digit ${i+1}">▲</button><div class="dial-value">${n}</div><button data-action="digit-down" data-i="${i}" aria-label="Decrease digit ${i+1}">▼</button></div>`).join('')}</div></div><div class="action-row"><button class="game-button" data-action="submit-code">Try combination</button></div>`;
}
function checkClock(){
  if(!state.clockSolved && state.hour === CLOCK_ANSWER.hour && state.minute === CLOCK_ANSWER.minute){
    state.clockSolved=true; persist(); notice('A click echoes from the clock. A compartment opens: 1888.');
  }
}
function adjustTime(part,amount){
  if(state.clockSolved) return notice('The clock is already unlocked.');
  if(part==='hour') state.hour=((state.hour-1+amount+120)%12)+1;
  else state.minute=(state.minute+amount+600)%60;
  checkClock(); persist(); render();
}
function adjustLetters(i,amount){
  if(state.boxSolved) return;
  const abc='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const idx=abc.indexOf(state.boxLetters[i]);
  state.boxLetters[i]=abc[(idx+amount+26)%26];
  if(state.boxLetters.join('')===STAR_WORD){state.boxSolved=true;notice('The box unlocks. Something metallic is inside.');}
  persist();render();
}
function adjustDigit(i,amount){state.codeDigits[i]=(state.codeDigits[i]+amount+10)%10;persist();render();}
function placePaintingPiece(piece,slot){
  if(state.paintingSolved||state.paintingPieces.includes(piece)) return;
  if(piece!==slot){notice('That fragment does not belong there.');return;}
  state.paintingPieces.push(piece); selectedPaintPiece=null;
  if(state.paintingPieces.length===5){state.paintingSolved=true;notice('The painting is whole. Something falls to the floor behind you.');}
  else notice(`Fragment ${piece} slides into place.`);
  persist();render();
}
function allLocksRemoved(){return state.codeUnlocked&&state.keyUnlocked&&state.plankBroken;}
function collectItem(id){
  if(id==='key'&&!state.keyCollected){state.keyCollected=true;notice('You collected a key. Select it from your inventory to use on the door.');}
  if(id==='axe'&&state.paintingSolved&&!state.axeCollected){state.axeCollected=true;notice('You collected the axe. It could break something wooden.');}
  persist();render();
}
function beginEnding(){
  closeModal();state.complete=true;persist();render();
  const video=byId('endingVideo');
  const fallback=byId('moonFallback');
  video.src=MEDIA.moon; video.muted=true; video.loop=true;
  video.oncanplay=()=>{fallback.style.display='none';video.style.display='block';};
  video.onerror=()=>{fallback.style.display='block';video.style.display='none';};
  video.play().catch(()=>{ fallback.style.display='block';video.style.display='none'; });
  endingIndex=0;updateEndingCaption();
  if(endingInterval) clearInterval(endingInterval);
  endingInterval=setInterval(()=>{endingIndex=(endingIndex+1)%END_LINES.length;updateEndingCaption();},6500);
  syncAudio();notice('The door opens. Beyond it, a quiet pond and the moon.');
}
function updateEndingCaption(){
  const caption=byId('endingCaption');caption.style.animation='none';
  void caption.offsetHeight;caption.textContent=END_LINES[endingIndex];caption.style.animation='captionFade 1.6s ease both';
}
function stopEnding(){
  if(endingInterval) clearInterval(endingInterval);endingInterval=null;
  const video=byId('endingVideo');video.pause();video.removeAttribute('src');video.load();
  byId('moonFallback').style.display='block';video.style.display='block';
  endingAudio.pause();endingAudio.currentTime=0;
  if(musicEnabled) syncAudio();
}
function performAction(action,element){
  const index=Number(element.dataset.i),card=element.dataset.card;
  switch(action){
    case 'open-letter':state.letterRead=true;persist();openModal('letter');break;
    case 'open-table':if(!state.drawerOpen){setState({drawerOpen:true},'The drawer slides open. Three tarot cards are inside.');}else openModal('tarot');break;
    case 'open-tarot':openModal('tarot');break;
    case 'flip-tarot': state.tarotFlipped=state.tarotFlipped.includes(card)?state.tarotFlipped.filter(c=>c!==card):[...state.tarotFlipped,card];persist();renderModal('tarot');break;
    case 'open-clock':openModal('clock');break;
    case 'hour-up':adjustTime('hour',1);break;
    case 'hour-down':adjustTime('hour',-1);break;
    case 'minute-up':adjustTime('minute',1);break;
    case 'minute-down':adjustTime('minute',-1);break;
    case 'minute-plus-five':adjustTime('minute',5);break;
    case 'minute-minus-five':adjustTime('minute',-5);break;
    case 'open-window':state.windowSeen=true;persist();openModal('window');break;
    case 'open-atlas':state.atlasSeen=true;persist();openModal('atlas');break;
    case 'open-box':openModal('box');break;
    case 'letter-up':adjustLetters(index,-1);break;
    case 'letter-down':adjustLetters(index,1);break;
    case 'collect-key':collectItem('key');break;
    case 'open-painting':openModal('painting');break;
    case 'collect-axe':collectItem('axe');break;
    case 'open-code':if(state.codeUnlocked)notice('The combination lock is already open.');else openModal('code');break;
    case 'digit-up':adjustDigit(index,1);break;
    case 'digit-down':adjustDigit(index,-1);break;
    case 'submit-code':
      if(state.codeDigits.join('')===DOOR_CODE){state.codeUnlocked=true;persist();closeModal();render();notice('The combination lock releases.');}
      else notice('The combination lock will not open.');break;
    case 'select-item':state.selectedItem=(state.selectedItem===element.dataset.item?null:element.dataset.item);persist();render();notice(state.selectedItem?'Item selected. Now click its matching obstacle on the exit door.':'Item put away.');break;
    case 'use-key':
      if(state.selectedItem==='key'&&state.keyCollected){state.keyUnlocked=true;state.selectedItem=null;persist();render();notice('The key turns. A second lock releases.');}
      else notice('This lock needs a key. Select it in your inventory first.');break;
    case 'use-axe':
      if(state.selectedItem==='axe'&&state.axeCollected){state.plankBroken=true;state.selectedItem=null;persist();render();notice('One hard blow shatters the wooden plank.');}
      else notice('The plank is fixed in place. A sharp tool might help.');break;
    case 'open-exit':
      if(allLocksRemoved())beginEnding();else notice('The door will not open. Remove all three obstacles.');break;
    default: break;
  }
  if(allLocksRemoved() && !state.complete) notice('All three obstacles are gone. Click the door to escape.');
}

// Delegated clicks work even when scene and modal contents are re-rendered.
document.addEventListener('click',e=>{
  const actionElement=e.target.closest('[data-action]');
  if(actionElement){performAction(actionElement.dataset.action,actionElement);return;}
  const slot=e.target.closest('[data-slot]');
  if(slot && selectedPaintPiece!==null){placePaintingPiece(selectedPaintPiece,Number(slot.dataset.slot));return;}
  const fragment=e.target.closest('[data-piece]');
  if(fragment){selectedPaintPiece=Number(fragment.dataset.piece);renderModal('painting');notice(`Selected painting fragment ${selectedPaintPiece}. Click its correct slot.`);return;}
  if(e.target.closest('[data-close-modal]'))closeModal();
});
// Desktop drag/drop. On touch devices, tap a fragment and then tap a target instead.
document.addEventListener('dragstart',e=>{
  const fragment=e.target.closest('[data-piece]');
  if(!fragment)return;
  const id=Number(fragment.dataset.piece);selectedPaintPiece=id;
  e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(id));
});
document.addEventListener('dragover',e=>{if(e.target.closest('[data-slot]')){e.preventDefault();e.dataTransfer.dropEffect='move';}});
document.addEventListener('drop',e=>{
  const slot=e.target.closest('[data-slot]');if(!slot)return;e.preventDefault();
  const id=Number(e.dataTransfer.getData('text/plain'))||selectedPaintPiece;
  if(id)placePaintingPiece(id,Number(slot.dataset.slot));
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&currentModal)closeModal();
  if(e.key==='Enter'||e.key===' '){const slot=e.target.closest('[data-slot]');if(slot&&selectedPaintPiece!==null){e.preventDefault();placePaintingPiece(selectedPaintPiece,Number(slot.dataset.slot));}}
  if(!currentModal&&!state.complete&&['ArrowLeft','ArrowRight'].includes(e.key)){turn(e.key==='ArrowLeft'?-1:1);}
});

byId('turnLeft').addEventListener('click',()=>turn(-1));
byId('turnRight').addEventListener('click',()=>turn(1));
byId('musicToggle').addEventListener('click',toggleMusic);
byId('restart').addEventListener('click',resetGame);
byId('endingRestart').addEventListener('click',resetGame);
byId('modalClose').addEventListener('click',closeModal);

render();
if(state.complete){state.complete=false;state.wall=3;persist();render();notice('Your previous run is complete. Click the door again to revisit the ending, or restart.');}
