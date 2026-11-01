
'use strict';

// Assets and puzzle settings

const ASSET_DIR = 'Asset/images/';
const AUDIO_DIR = 'Asset/audio/';
const VIDEO_DIR = 'Asset/media/';

const ASSETS = {
    room: 'Room.png',
    tableClosed: 'Table-closed.png',
    tableOpen: 'Table-open.png',
    letterClosed: 'Letter-1.png',
    letterOpen: 'Letter-2.png',
    sun: 'Sun.png',
    moon: 'Moon.png',
    star: 'Star.png',
    tarotBack: 'Tarot-back.png',
    clockClosed: 'Clock-closed.png',
    clockOpen: 'Clock-open.png',
    shortHand: 'Short hand.png',
    longHand: 'Long-hand.png',
    password: 'Password.png',
    window: 'Window.png',
    atlas: 'Constellation.png',
    pyxis: 'PYXIS.png',
    boxClosed: 'Box-1.png',
    boxDial: 'Box-2.png',
    boxOpen: 'Box-3.png',
    frame: 'Frame.png',
    frameEmpty: 'Frame-2.png',
    frameComplete: 'Frame-3.png',
    painting: 'Woodcutter.jpg',
    axe: 'ax.png',
    key: 'Key.png',
    door: 'Door.png',
    doorOpen: 'Door-open.png',
    lockKey: 'Lock-1.png',
    lockCode: 'Lock-2.png',
    plank: 'Wooden plank.png',
    plankLeft: 'Wooden plank-L.png',
    plankRight: 'Wooden plank-R.png',
    pieces: [
        'Paint-1.png',
        'Paint-2.png',
        'Paint-3.png',
        'Paint-4.png',
        'Paint-5.png'
    ]
};

const PAINTING_FRAME = {
    x: 35,
    y: 10,
    w: 30,
    h: 69
};

const PAINTING_PARTS = [
    {
        id: 1,
        start: { x: 14, y: 18 },
        target: { x: 30.3, y: 39.4 },
        w: 29,
        h: 29,
        rotation: -9
    },
    {
        id: 2,
        start: { x: 73, y: 18 },
        target: { x: 43.5, y: 45 },
        w: 23,
        h: 23,
        rotation: 8
    },
    {
        id: 3,
        start: { x: 16, y: 50 },
        target: { x: 32.3, y: 21 },
        w: 47,
        h: 47,
        rotation: -7
    },
    {
        id: 4,
        start: { x: 75, y: 48 },
        target: { x: 28.8, y: 20 },
        w: 30,
        h: 30,
        rotation: 11
    },
    {
        id: 5,
        start: { x: 74, y: 71 },
        target: { x: 36, y: 20.7 },
        w: 28,
        h: 28,
        rotation: -5
    }
];

const PAINT_SNAP_DISTANCE = 0.06;

const MEDIA = {
    gameplay: `${AUDIO_DIR}Gnossienne No. 1.mp3`,
    ending: `${AUDIO_DIR}Clair de lune.mp3`,
    moon: `${VIDEO_DIR}Moon.mp4`
};

const CLOCK_ANSWER = {
    hour: 3,
    minute: 25
};

const DOOR_CODE = '1888';
const STAR_WORD = 'PYXIS';

const TAROT = {
    star: {
        name: 'STAR',
        image: 'star',
        value: '3'
    },
    moon: {
        name: 'MOON',
        image: 'moon',
        value: '2'
    },
    sun: {
        name: 'SUN',
        image: 'sun',
        value: '5'
    }
};

const END_LINES = [
    'The moon was there before you arrived.',
    'The water remembers only what it reflects.',
    'Nothing has changed.',
    'Nothing ever needed to.',
    'The moon was there before you arrived.'
];

const STORAGE_KEY = 'white-room-escape-v1';

const byId = id => document.getElementById(id);

const file = key =>
    ASSET_DIR + (ASSETS[key] || key);

const escapeHtml = value =>
    String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

const shuffle = list =>
    [...list].sort(() => Math.random() - 0.5);


// Game state and saving

const initialState = () => ({
    wall: 0,
    drawerOpen: false,
    letterRead: false,

    paintingRevealDone: false,

    tarotOrder: shuffle(['sun', 'moon', 'star']),
    tarotFlipped: [],

    hour: 0,
    minute: 0,
    clockSolved: false,

    windowSeen: false,
    atlasSeen: false,

    boxLetters: ['A', 'A', 'A', 'A', 'A'],
    boxSolved: false,
    keyCollected: false,

    paintingPieces: [],
    paintingPositions: {},
    paintingSolved: false,
    axeCollected: false,

    codeDigits: [0, 0, 0, 0],
    codeUnlocked: false,
    keyUnlocked: false,
    plankBroken: false,

    selectedItem: null,
    complete: false
});


// Painting dragging

let wallPaintingDrag = null;
let paintingRevealStage = 'idle';
let paintingRevealSequence = 0;

function clampPaint(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function paintingDistance(element, part) {
    const canvas = byId('gameCanvas').getBoundingClientRect();

    const x = parseFloat(element.style.left);
    const y = parseFloat(element.style.top);

    const dx = (x - part.target.x) * canvas.width / 100;
    const dy = (y - part.target.y) * canvas.height / 100;

    return Math.hypot(dx, dy);
}

document.addEventListener('pointerdown', e => {
    const element = e.target.closest('[data-wall-piece]');

    if (
        !element ||
        state.wall !== 2 ||
        state.paintingSolved ||
        isTransitioning ||
        currentModal
    ) {
        return;
    }

    const id = Number(element.dataset.wallPiece);

    if (state.paintingPieces.includes(id)) {
        return;
    }

    const part = PAINTING_PARTS.find(p => p.id === id);

    if (!part) {
        return;
    }

    const rect = element.getBoundingClientRect();

    wallPaintingDrag = {
        element,
        part,
        pointerId: e.pointerId,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top
    };

    element.classList.add('dragging');
    element.style.setProperty('--rot', '0deg');
    element.setPointerCapture(e.pointerId);

    e.preventDefault();
});

document.addEventListener('pointermove', e => {
    if (
        !wallPaintingDrag ||
        e.pointerId !== wallPaintingDrag.pointerId
    ) {
        return;
    }

    const { element, part, offsetX, offsetY } = wallPaintingDrag;
    const canvas = byId('gameCanvas').getBoundingClientRect();

    const x = clampPaint(
        e.clientX - canvas.left - offsetX,
        0,
        canvas.width - element.offsetWidth
    );

    const y = clampPaint(
        e.clientY - canvas.top - offsetY,
        0,
        canvas.height - element.offsetHeight
    );

    element.style.left = `${x / canvas.width * 100}%`;
    element.style.top = `${y / canvas.height * 100}%`;

    const distance = paintingDistance(element, part);
    const radius = canvas.width * PAINT_SNAP_DISTANCE;

    element.classList.toggle(
        'near-snap',
        distance <= radius * 1.4
    );

    e.preventDefault();

}, { passive: false });

function finishPaintingDrag(e, cancelled = false) {
    if (
        !wallPaintingDrag ||
        e.pointerId !== wallPaintingDrag.pointerId
    ) {
        return;
    }

    const { element, part } = wallPaintingDrag;
    const canvas = byId('gameCanvas').getBoundingClientRect();

    const distance = paintingDistance(element, part);
    const radius = canvas.width * PAINT_SNAP_DISTANCE;

    element.classList.remove('dragging', 'near-snap');

    if (element.hasPointerCapture(e.pointerId)) {
        element.releasePointerCapture(e.pointerId);
    }

    wallPaintingDrag = null;

    const currentX = parseFloat(element.style.left);
    const currentY = parseFloat(element.style.top);

    if (!cancelled && distance <= radius) {
        element.style.left = `${part.target.x}%`;
        element.style.top = `${part.target.y}%`;
        element.style.setProperty('--rot', '0deg');
        element.classList.add('placed');

        state.paintingPositions[part.id] = {
            x: part.target.x,
            y: part.target.y
        };

        if (!state.paintingPieces.includes(part.id)) {
            state.paintingPieces.push(part.id);
        }

        if (state.paintingPieces.length === PAINTING_PARTS.length) {
            state.paintingSolved = true;
            state.paintingRevealDone = false;

            persist();
            startPaintingReveal();
        }

        persist();

        if (!state.paintingSolved) {
            setTimeout(() => {
                if (
                    state.wall === 2 &&
                    !isTransitioning &&
                    !currentModal
                ) {
                    render();
                }
            }, 240);
        }

        return;
    }

    element.style.setProperty('--rot', '0deg');

    state.paintingPositions[part.id] = {
        x: currentX,
        y: currentY
    };

    persist();
}

document.addEventListener('pointerup', e => {
    finishPaintingDrag(e);
});

document.addEventListener('pointercancel', e => {
    finishPaintingDrag(e, true);
});


function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (!saved || typeof saved !== 'object') {
            return initialState();
        }

        const state = {
            ...initialState(),
            ...saved
        };

        if (state.paintingSolved) {
            state.paintingRevealDone = true;
        }

        if (
            !Array.isArray(state.tarotOrder) ||
            state.tarotOrder.length !== 3
        ) {
            state.tarotOrder = shuffle(['sun', 'moon', 'star']);
        }

        if (!Array.isArray(state.paintingPieces)) {
            state.paintingPieces = [];
        }

        if (
            !state.paintingPositions ||
            typeof state.paintingPositions !== 'object' ||
            Array.isArray(state.paintingPositions)
        ) {
            state.paintingPositions = {};
        }

        if (!Array.isArray(state.tarotFlipped)) {
            state.tarotFlipped = [];
        }

        if (
            !Array.isArray(state.boxLetters) ||
            state.boxLetters.length !== 5
        ) {
            state.boxLetters = ['A', 'A', 'A', 'A', 'A'];
        }

        if (
            !Array.isArray(state.codeDigits) ||
            state.codeDigits.length !== 4
        ) {
            state.codeDigits = [0, 0, 0, 0];
        }

        return state;

    } catch {
        return initialState();
    }
}

let state = loadState();

let currentModal = null;
let endingInterval = null;
let endingIndex = 0;
let musicEnabled = false;
let isTransitioning = false;
let statusTimer = null;
let skyReturnTo = null;
let clockControlsVisible = false;

const WIPE_DURATION = 850;

const gameplayAudio = new Audio(MEDIA.gameplay);
const endingAudio = new Audio(MEDIA.ending);

gameplayAudio.loop = true;
endingAudio.loop = true;

gameplayAudio.volume = 0.26;
endingAudio.volume = 0.40;

function persist() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
}

function notice(message) {
    const status = byId('status');

    status.textContent = message;
    status.classList.remove('visible');

    void status.offsetWidth;

    status.classList.add('visible');

    if (statusTimer) {
        clearTimeout(statusTimer);
    }

    statusTimer = setTimeout(() => {
        status.classList.remove('visible');
    }, 3500);
}

function setState(partial, message) {
    Object.assign(state, partial);

    persist();
    render();

    if (message) {
        notice(message);
    }
}


function asset(key, label = '', extraClass = '') {
    const url = escapeHtml(file(key));

    return `
        <span class="asset-frame ${extraClass}">
            <img
                src="${url}"
                alt="${escapeHtml(label)}"
                draggable="false"
                onerror="
                    this.hidden=true;
                    this.nextElementSibling.hidden=false
                "
            >
            <span class="asset-fallback" hidden>
                ${escapeHtml(label)}
            </span>
        </span>
    `;
}

function sprite(action, key, label, x, y, width, height, more = '') {
    return `
        <button
            class="sprite"
            data-action="${action}"
            style="
                left:${x}%;
                top:${y}%;
                width:${width}%;
                height:${height}%;
            "
            aria-label="${escapeHtml(label)}"
            ${more}
        >
            ${asset(key, label)}
            <span class="sprite-label">
                ${escapeHtml(label)}
            </span>
        </button>
    `;
}

function resetGame() {
    if (isTransitioning) {
        return;
    }

    if (!confirm(
        'Restart from the beginning? All puzzle progress will be erased.'
    )) {
        return;
    }

    paintingRevealSequence++;
    paintingRevealStage = 'idle';
    state = initialState();

    currentModal = null;

    stopEnding();
    closeModal();

    persist();
    render();

    notice('A new game begins. Read the letter on the table.');
}

function playAudio(audio) {
    audio.play().catch(() => {});
}

function syncAudio() {
    gameplayAudio.pause();
    endingAudio.pause();

    if (musicEnabled) {
        playAudio(state.complete ? endingAudio : gameplayAudio);
    }

    byId('musicToggle').textContent =
        `♫ Music ${musicEnabled ? 'On' : 'Off'}`;

    byId('musicToggle').setAttribute(
        'aria-pressed',
        String(musicEnabled)
    );
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    syncAudio();

    notice(
        musicEnabled
            ? 'Music on. Use the same button to mute.'
            : 'Music muted.'
    );
}

function wallMarkup(wall) {
    return [
        renderCabinet,
        renderWindow,
        renderPainting,
        renderExit
    ][wall]();
}

function render() {
    const isEnd = state.complete;

    byId('ending').hidden = !isEnd;
    byId('sceneObjects').hidden = isEnd;
    byId('roomBackground').hidden = isEnd;

    byId('turnLeft').disabled = isEnd || isTransitioning;
    byId('turnRight').disabled = isEnd || isTransitioning;

    if (!isEnd) {
        byId('sceneObjects').innerHTML = wallMarkup(state.wall);
    }

    renderInventory();

    if (currentModal) {
        renderModal(currentModal);
    }
}

function renderInventory() {
    const items = [null, null, null];


    if (state.clockSolved) {
        items[0] = ['password', 'A Folded Note', '1888'];
    }

    if (state.keyCollected && !state.keyUnlocked) {
        items[1] = ['key', 'Key', '⚿'];
    }

    if (state.axeCollected && !state.plankBroken) {
        items[2] = ['axe', 'Axe', '⚒'];
    }


    const slots = Array.from({ length: 3 }, (_, i) => {
        if (!items[i]) {
            return `
                <div
                    class="inventory-slot empty"
                    aria-label="Empty inventory slot ${i + 1}"
                ></div>
            `;
        }

        const [id, label, symbol] = items[i];

        return `
            <button
                class="
                    inventory-slot inventory-item
                    ${state.selectedItem === id ? 'active' : ''}
                "
                data-action="select-item"
                data-item="${id}"
                aria-label="${label}"
                aria-pressed="${state.selectedItem === id}"
                title="${label}"
            >
                <img
                    src="${file(id)}"
                    alt=""
                    onerror="
                        this.hidden=true;
                        this.nextElementSibling.hidden=false
                    "
                >
                <span class="symbol" hidden>
                    ${symbol}
                </span>
            </button>
        `;
    });

    byId('inventory').innerHTML = slots.join('');
}


// Four walls

function renderCabinet() {
    let html = sprite(
        'open-clock',
        state.clockSolved ? 'clockOpen' : 'clockClosed',
        'Clock',
        70, 0, 13, 51
    );

    html += sprite(
        'open-table',
        state.drawerOpen ? 'tableOpen' : 'tableClosed',
        state.drawerOpen ? 'Inspect tarot cards' : 'Open cabinet drawer',
        40, 50, 22, 27
    );

    html += sprite(
        'open-letter',
        'letterClosed',
        'Read letter',
        46, 45, 7, 10
    );

    return html;
}

function renderWindow() {
    return (
        sprite(
            'open-window',
            'window',
            'Look outside',
            41, 0, 17, 76
        ) +
        sprite(
            'open-atlas',
            'atlas',
            'Star chart',
            70, 10, 10, 35
        ) +
        sprite(
            'open-box',
            state.boxSolved ? 'boxOpen' : 'boxClosed',
            state.boxSolved ? 'Open puzzle box' : 'Five-letter puzzle box',
            42, 44, 7, 35
        ) +
        `<div class="scene-whisper sky-whisper">
            The stars remember what the night has forgotten.
        </div>`
    );
}

function renderPainting() {
    const finished = state.paintingSolved;

    const finalImage =
        state.paintingRevealDone ||
        paintingRevealStage === 'fall' ||
        paintingRevealStage === 'done';

    let frameImage;

    if (!finished) {
        frameImage = 'frameEmpty';
    } else if (!finalImage) {
        frameImage = 'frameComplete';
    } else {
        frameImage = 'frame';
    }

    const shaking =
        finished && paintingRevealStage === 'shake';

    let html = `
        <div
            class="painting-wall-frame ${shaking ? 'shaking' : ''}"
            style="
                left:${PAINTING_FRAME.x}%;
                top:${PAINTING_FRAME.y}%;
                width:${PAINTING_FRAME.w}%;
                height:${PAINTING_FRAME.h}%;
            "
        >
            ${asset(frameImage, 'Painting')}
        </div>
    `;

    if (!finished) {
        PAINTING_PARTS.forEach(part => {
            const placed = state.paintingPieces.includes(part.id);
            const saved = state.paintingPositions?.[part.id];

            const pos = placed
                ? part.target
                : (saved || part.start);

            html += `
                <button
                    type="button"
                    class="
                        painting-fragment
                        ${placed ? 'placed' : ''}
                    "
                    data-wall-piece="${part.id}"
                    ${placed ? 'disabled' : ''}
                    style="
                        left:${pos.x}%;
                        top:${pos.y}%;
                        width:${part.w}%;
                        height:${part.h}%;
                        --rot:${placed ? 0 : part.rotation}deg;
                    "
                >
                    <img
                        src="${file(ASSETS.pieces[part.id - 1])}"
                        alt=""
                        draggable="false"
                    >
                </button>
            `;
        });
    }

    if (finished && finalImage && !state.axeCollected) {
        const falling = paintingRevealStage === 'fall';

        html += `
            <button
                type="button"
                class="sprite ${falling ? 'painting-axe-drop' : ''}"
                data-action="collect-axe"
                aria-label="Collect the axe"
                style="
                    left:63%;
                    top:79%;
                    width:10%;
                    height:12%;
                "
            >
                ${asset('axe', 'Axe')}
            </button>
        `;
    }

    return html;
}

function renderExit() {
    const finished =
        state.codeUnlocked &&
        state.keyUnlocked &&
        state.plankBroken;

    const doorPosition = finished
        ? { x: 37, y: 16, w: 27, h: 34 }
        : { x: 38, y: 5, w: 24, h: 34 };

    let html = sprite(
        'open-exit',
        finished ? 'doorOpen' : 'door',
        finished ? 'Open the door' : 'Exit door',
        doorPosition.x,
        doorPosition.y,
        doorPosition.w,
        doorPosition.h
    );

    if (!state.codeUnlocked) {
        html += sprite(
            'open-code',
            'lockCode',
            'Combination lock',
            47.5, 33, 5, 6
        );
    }

    if (!state.keyUnlocked) {
        html += sprite(
            'use-key',
            'lockKey',
            'Keyhole',
            50.5, 46, 4, 4
        );
    }

    if (!state.plankBroken) {
        html += `
            <button
                class="plank"
                data-action="use-axe"
                aria-label="Wooden plank blocking the door"
            >
                ${asset('plank', 'WOODEN')}
            </button>
        `;
    } else if (!finished) {
        html += `
            <div class="plank-half plank-left">
                ${asset('plankLeft', 'Broken plank left')}
            </div>

            <div class="plank-half plank-right">
                ${asset('plankRight', 'Broken plank right')}
            </div>
        `;
    }

    return html;
}


// Wall transitions

function turn(delta) {
    if (
        state.complete ||
        currentModal ||
        isTransitioning
    ) {
        return;
    }

    const nextWall = (state.wall + delta + 4) % 4;

    const reducedMotion =
        window.matchMedia &&
        window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

    if (reducedMotion) {
        state.wall = nextWall;
        persist();
        render();
        return;
    }

    isTransitioning = true;

    byId('turnLeft').disabled = true;
    byId('turnRight').disabled = true;

    document.activeElement?.blur?.();

    byId('inputBlocker').hidden = false;
    document.body.classList.add('scene-changing');

    const incoming = byId('sceneIncoming');
    const bar = byId('wipeBar');

    incoming.innerHTML = `
        <img
            class="room-background"
            src="${file('room')}"
            alt=""
            draggable="false"
        >
        <div class="scene-objects">
            ${wallMarkup(nextWall)}
        </div>
    `;

    incoming.classList.remove('revealing');
    bar.classList.remove('sweeping');

    void incoming.offsetWidth;

    incoming.classList.add('revealing');
    bar.classList.add('sweeping');

    setTimeout(() => {
        state.wall = nextWall;
        persist();

        byId('sceneObjects').innerHTML = wallMarkup(state.wall);

        incoming.classList.remove('revealing');
        bar.classList.remove('sweeping');
        incoming.innerHTML = '';

        isTransitioning = false;

        document.body.classList.remove('scene-changing');
        byId('inputBlocker').hidden = true;

        render();
    }, WIPE_DURATION);
}


// Modal system

function openModal(kind) {
    if (isTransitioning) {
        return;
    }

    if (kind === 'window') {
        skyReturnTo = currentModal;
    }

    currentModal = kind;

    byId('modal').hidden = false;
    document.body.style.overflow = 'hidden';

    renderModal(kind);
}

function closeModal() {
    currentModal = null;

    byId('modal').hidden = true;
    document.body.style.overflow = '';
    byId('modal').classList.remove('sky-mode');
}

function renderModal(kind) {
    byId('modal').classList.toggle(
        'sky-mode',
        kind === 'window'
    );

    const titleMap = {
        note: 'A Folded Note',
        letter: 'A Letter',
        tarot: 'The Three Cards',
        clock: 'The Clock',
        window: 'The Night Sky',
        atlas: 'Constellation Atlas',
        box: 'The Five-Letter Box',
        code: 'Combination Lock'
    };

    byId('modalTitle').textContent =
        titleMap[kind] || 'Inspect';

    byId('modalSubtitle').textContent =
        'LOOK CLOSER';

    const renderers = {
        note: modalNote,
        letter: modalLetter,
        tarot: modalTarot,
        clock: modalClock,
        window: modalWindow,
        atlas: modalAtlas,
        box: modalBox,
        code: modalCode
    };

    if (renderers[kind]) {
        byId('modalBody').innerHTML = renderers[kind]();
    }
}


function modalLetter() {
    return `
        <div
            class="letter-paper letter-art"
            style="background-image:url('${file('letterOpen')}')"
        >
            <div class="letter-overlay">
                <p>To the one who wakes within white walls,</p>

                <p>
                    Three keep the way shut:
                    one asks for numbers,
                    one waits for a metal tooth,
                    one yields only to the fall of an edge.
                </p>

                <p>
                    Look upward before you look outward.
                    Read the lights in their proper order:
                    <strong>Star</strong>, then
                    <strong>Moon</strong>, then
                    <strong>Sun</strong>.
                </p>

                <p>
                    They do not tell you where to go.
                    They tell you <em>when</em>.
                    What begins the hour,
                    what deepens the dark,
                    what remains when the night is still —
                    together they whisper to the face that keeps time.
                </p>

                <p>
                    When the heavens are arranged correctly,
                    the silent watcher will answer.
                </p>

                <p>
                    Turn. Observe. Match what is above,
                    what is broken, and what remembers.
                </p>

                <p class="letter-sign">
                    — The Previous Occupant
                </p>
            </div>
        </div>
    `;
}

function modalTarot() {
    return `
        <p class="modal-text tarot-riddle">
            No matter where they rest,<br>
            the distant light comes before the pale watcher,<br>
            and the pale watcher before the dawn.<br><br>
            <em>Even time obeys the sky.</em>
        </p>

        <div class="tarot-row">
            ${state.tarotOrder.map(id => {
                const card = TAROT[id];
                const flipped = state.tarotFlipped.includes(id);

                return `
                    <button
                        class="tarot-card"
                        data-action="flip-tarot"
                        data-card="${id}"
                        aria-label="Flip ${card.name} card"
                    >
                        ${
                            flipped
                                ? `
                                    <span class="tarot-back">
                                        ${card.value}
                                    </span>
                                `
                                : asset(card.image, card.name)
                        }

                        <span class="tarot-name">
                            ${card.name}
                        </span>
                    </button>
                `;
            }).join('')}
        </div>
    `;
}

function modalClock() {
    const angleHour = (state.hour % 12) * 30;
    const angleMinute = state.minute * 6;

    const disabled = state.clockSolved
        ? 'disabled'
        : '';

    return `
        <div class="clock-scene ${
            clockControlsVisible
                ? 'is-hint-open'
                : 'is-closed'
        }">
            <div class="clock-art-viewport">
                <img
                    class="clock-body-image"
                    src="${file(
                        state.clockSolved ? 'clockOpen' : 'clockClosed'
                    )}"
                    alt="Antique clock"
                    draggable="false"
                >

                <button
                    type="button"
                    class="clock-pointer short"
                    data-action="hour-up"
                    style="--hand-angle:${angleHour}deg"
                    aria-label="Move the hour hand"
                    ${disabled}
                >
                    <img
                        src="${file('shortHand')}"
                        alt=""
                        draggable="false"
                    >
                </button>

                <button
                    type="button"
                    class="clock-pointer long"
                    data-action="minute-plus-five"
                    style="--hand-angle:${angleMinute}deg"
                    aria-label="Move the minute hand"
                    ${disabled}
                >
                    <img
                        src="${file('longHand')}"
                        alt=""
                        draggable="false"
                    >
                </button>
            </div>

            <div class="clock-side">
                <p class="clock-poem">
                    The heavens never stand still.<br>
                    Yet two hands wait for a moment
                    that has already passed.
                </p>

                ${
                    clockControlsVisible
                        ? `
                            <div class="clock-details">
                                <div class="clock-readout">
                                    ${state.hour}:${String(
                                        state.minute
                                    ).padStart(2, '0')}
                                </div>

                                <p class="clock-instruction">
                                    The shorter hand follows
                                    the hours. The longer hand
                                    measures the passing minutes.
                                </p>

                                <div class="clock-keys">
                                    <button
                                        class="game-button"
                                        data-action="hour-down"
                                        ${disabled}
                                    >
                                        HOUR −
                                    </button>

                                    <button
                                        class="game-button"
                                        data-action="hour-up"
                                        ${disabled}
                                    >
                                        HOUR +
                                    </button>
                                </div>

                                <div class="clock-keys">
                                    <button
                                        class="game-button secondary"
                                        data-action="minute-minus-five"
                                        ${disabled}
                                    >
                                        −5 MIN
                                    </button>

                                    <button
                                        class="game-button secondary"
                                        data-action="minute-down"
                                        ${disabled}
                                    >
                                        −1 MIN
                                    </button>

                                    <button
                                        class="game-button"
                                        data-action="minute-up"
                                        ${disabled}
                                    >
                                        +1 MIN
                                    </button>

                                    <button
                                        class="game-button"
                                        data-action="minute-plus-five"
                                        ${disabled}
                                    >
                                        +5 MIN
                                    </button>
                                </div>
                            </div>
                        `
                        : ''
                }

                ${
                    state.clockSolved
                        ? `
                            <p class="clock-solved-text">
                                A quiet click echoes
                                from within the clock.<br>
                                A folded note has been placed
                                in your inventory.
                            </p>
                        `
                        : ''
                }

                <div class="clock-hint-row">
                    <button
                        class="game-button secondary"
                        data-action="clock-hint"
                    >
                        ${
                            clockControlsVisible
                                ? 'Hide Hint'
                                : '? Hint'
                        }
                    </button>
                </div>
            </div>
        </div>
    `;
}

function modalWindow() {
    return `
        <div
            class="sky-view"
            data-action="return-sky"
            role="button"
            tabindex="0"
            aria-label="Return from the night sky"
        >
            <img
                src="${file('pyxis')}"
                alt="Pyxis constellation"
                class="sky-image"
                draggable="false"
            >

            <div class="sky-return-hint">
                Click anywhere to return
            </div>
        </div>
    `;
}

function modalAtlas() {
    return `
        <p class="modal-text">
            A chart of constellations.
            Which pattern matches the stars outside?
        </p>

        <div class="art-panel atlas-art">
            ${asset('atlas', 'PYXIS / CRUX / LYRA / ORION')}
        </div>

        <div class="action-row">
            <button
                class="game-button"
                data-action="open-window"
            >
                Check the sky again
            </button>

            <button
                class="game-button"
                data-action="open-box"
            >
                Try a name on the lock
            </button>
        </div>
    `;
}

function letterWheelRow() {
    return `
        <div class="dial-row">
            ${state.boxLetters.map((value, i) => `
                <div class="dial">
                    <button
                        data-action="letter-up"
                        data-i="${i}"
                        aria-label="Previous letter in slot ${i + 1}"
                    >
                        ▲
                    </button>

                    <div class="dial-value">
                        ${value}
                    </div>

                    <button
                        data-action="letter-down"
                        data-i="${i}"
                        aria-label="Next letter in slot ${i + 1}"
                    >
                        ▼
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function modalBox() {
    return `
        <div class="modal-layout">
            <div class="art-panel box-art">
                ${asset(
                    state.boxSolved ? 'boxOpen' : 'boxClosed',
                    state.boxSolved
                        ? 'Open box'
                        : 'Closed five-letter puzzle box'
                )}
            </div>

            <div>
                <p class="modal-text">
                    Five little letter wheels turn
                    on the front of the box.
                    What did you see through the window?
                </p>

                ${
                    state.boxSolved
                        ? `
                            <div class="puzzle-success">
                                The mechanism releases.
                                The box opens.
                            </div>

                            <div class="action-row">
                                ${
                                    state.keyCollected
                                        ? 'The key has already been collected.'
                                        : `
                                            <button
                                                class="game-button"
                                                data-action="collect-key"
                                            >
                                                Collect the key
                                            </button>
                                        `
                                }
                            </div>
                        `
                        : letterWheelRow()
                }

                ${
                    !state.boxSolved
                        ? `
                            <p class="puzzle-instruction">
                                Use ▲ or ▼ to cycle through letters.
                                The lock checks the word automatically.
                            </p>
                        `
                        : ''
                }
            </div>
        </div>
    `;
}

function modalCode() {
    return `
        <p class="modal-text">
            An old four-wheel numerical lock.
            Perhaps you have already seen its code
            somewhere in the room.
        </p>

        <div class="number-lock">
            <div class="dial-row">
                ${state.codeDigits.map((n, i) => `
                    <div class="dial">
                        <button
                            data-action="digit-up"
                            data-i="${i}"
                            aria-label="Increase digit ${i + 1}"
                        >
                            ▲
                        </button>

                        <div class="dial-value">
                            ${n}
                        </div>

                        <button
                            data-action="digit-down"
                            data-i="${i}"
                            aria-label="Decrease digit ${i + 1}"
                        >
                            ▼
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="action-row">
            <button
                class="game-button"
                data-action="submit-code"
            >
                Try combination
            </button>
        </div>
    `;
}


function checkClock() {
    if (
        !state.clockSolved &&
        state.hour === CLOCK_ANSWER.hour &&
        state.minute === CLOCK_ANSWER.minute
    ) {
        state.clockSolved = true;
        persist();

        notice(
            'The clock opens. A folded note has been added to your inventory.'
        );
    }
}

function adjustTime(part, amount) {
    if (state.clockSolved) {
        return notice('The clock is already unlocked.');
    }

    if (part === 'hour') {
        state.hour = (state.hour + amount + 12) % 12;
    } else {
        state.minute = (state.minute + amount + 60) % 60;
    }

    checkClock();
    persist();
    render();
}

function adjustLetters(i, amount) {
    if (state.boxSolved) {
        return;
    }

    const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const idx = abc.indexOf(state.boxLetters[i]);

    state.boxLetters[i] =
        abc[(idx + amount + 26) % 26];

    if (state.boxLetters.join('') === STAR_WORD) {
        state.boxSolved = true;

        notice(
            'The box unlocks. Something metallic is inside.'
        );
    }

    persist();
    render();
}

function adjustDigit(i, amount) {
    state.codeDigits[i] =
        (state.codeDigits[i] + amount + 10) % 10;

    persist();
    render();
}

function allLocksRemoved() {
    return (
        state.codeUnlocked &&
        state.keyUnlocked &&
        state.plankBroken
    );
}

function collectItem(id) {
    if (id === 'key' && !state.keyCollected) {
        state.keyCollected = true;

        notice(
            'You collected a key. Select it from your inventory ' +
            'to use on the door.'
        );
    }

    if (
        id === 'axe' &&
        state.paintingSolved &&
        !state.axeCollected
    ) {
        state.axeCollected = true;

        notice(
            'You collected the axe. It could break something wooden.'
        );
    }

    persist();
    render();
}


// Ending

function beginEnding() {
    closeModal();

    state.complete = true;
    persist();
    render();

    const video = byId('endingVideo');
    const fallback = byId('moonFallback');

    video.src = MEDIA.moon;
    video.muted = true;
    video.loop = true;

    video.oncanplay = () => {
        fallback.style.display = 'none';
        video.style.display = 'block';
    };

    video.onerror = () => {
        fallback.style.display = 'block';
        video.style.display = 'none';
    };

    video.play().catch(() => {
        fallback.style.display = 'block';
        video.style.display = 'none';
    });

    endingIndex = 0;
    updateEndingCaption();

    if (endingInterval) {
        clearInterval(endingInterval);
    }

    endingInterval = setInterval(() => {
        endingIndex = (endingIndex + 1) % END_LINES.length;
        updateEndingCaption();
    }, 6500);

    syncAudio();

    notice(
        'The door opens. Beyond it, a quiet pond and the moon.'
    );
}

function updateEndingCaption() {
    const caption = byId('endingCaption');

    caption.style.animation = 'none';
    void caption.offsetHeight;

    caption.textContent = END_LINES[endingIndex];
    caption.style.animation = 'captionFade 1.6s ease both';
}

function stopEnding() {
    if (endingInterval) {
        clearInterval(endingInterval);
    }

    endingInterval = null;

    const video = byId('endingVideo');

    video.pause();
    video.removeAttribute('src');
    video.load();

    byId('moonFallback').style.display = 'block';
    video.style.display = 'block';

    endingAudio.pause();
    endingAudio.currentTime = 0;

    if (musicEnabled) {
        syncAudio();
    }
}


// Player interactions

function performAction(action, element) {
    if (isTransitioning) {
        return;
    }

    const index = Number(element.dataset.i);
    const card = element.dataset.card;

    switch (action) {
        case 'open-letter':
            state.letterRead = true;
            persist();
            openModal('letter');
            break;

        case 'open-table':
            if (!state.drawerOpen) {
                setState(
                    { drawerOpen: true },
                    'The drawer slides open. Three tarot cards are inside.'
                );
            } else {
                openModal('tarot');
            }
            break;

        case 'open-tarot':
            openModal('tarot');
            break;

        case 'flip-tarot':
            state.tarotFlipped =
                state.tarotFlipped.includes(card)
                    ? state.tarotFlipped.filter(c => c !== card)
                    : [...state.tarotFlipped, card];

            persist();
            renderModal('tarot');
            break;

        case 'open-clock':
            openModal('clock');
            break;

        case 'hour-up':
            adjustTime('hour', 1);
            break;

        case 'hour-down':
            adjustTime('hour', -1);
            break;

        case 'minute-up':
            adjustTime('minute', 1);
            break;

        case 'minute-down':
            adjustTime('minute', -1);
            break;

        case 'minute-plus-five':
            adjustTime('minute', 5);
            break;

        case 'minute-minus-five':
            adjustTime('minute', -5);
            break;

        case 'open-window':
            state.windowSeen = true;
            persist();
            openModal('window');
            break;

        case 'open-atlas':
            state.atlasSeen = true;
            persist();
            openModal('atlas');
            break;

        case 'open-box':
            openModal('box');
            break;

        case 'letter-up':
            adjustLetters(index, -1);
            break;

        case 'letter-down':
            adjustLetters(index, 1);
            break;

        case 'collect-key':
            collectItem('key');
            break;

        case 'collect-axe':
            collectItem('axe');
            break;

        case 'open-code':
            if (state.codeUnlocked) {
                notice('The combination lock is already open.');
            } else {
                openModal('code');
            }
            break;

        case 'digit-up':
            adjustDigit(index, 1);
            break;

        case 'digit-down':
            adjustDigit(index, -1);
            break;

        case 'submit-code':
            if (state.codeDigits.join('') === DOOR_CODE) {
                state.codeUnlocked = true;

                persist();
                closeModal();
                render();

                notice('The combination lock releases.');
            } else {
                notice('The combination lock will not open.');
            }
            break;

        case 'select-item': {
            const item = element.dataset.item;

            if (item === 'password') {
                openModal('note');
                break;
            }

            state.selectedItem =
                state.selectedItem === item ? null : item;

            persist();
            render();

            notice(
                state.selectedItem ? 'Item selected.' : 'Item put away.'
            );
            break;
        }

        case 'use-key':
            if (
                state.selectedItem === 'key' &&
                state.keyCollected
            ) {
                state.keyUnlocked = true;
                state.selectedItem = null;

                persist();
                render();

                notice('The key turns. A second lock releases.');
            } else {
                notice(
                    'This lock needs a key. ' +
                    'Select it in your inventory first.'
                );
            }
            break;

        case 'use-axe':
            if (
                state.selectedItem === 'axe' &&
                state.axeCollected
            ) {
                state.plankBroken = true;
                state.selectedItem = null;

                persist();
                render();

                notice('One hard blow shatters the wooden plank.');
            } else {
                notice(
                    'The plank is fixed in place. ' +
                    'A sharp tool might help.'
                );
            }
            break;

        case 'open-exit':
            if (allLocksRemoved()) {
                beginEnding();
            } else {
                notice(
                    'The door will not open. Remove all three obstacles.'
                );
            }
            break;

        case 'return-sky': {
            const previous = skyReturnTo;
            skyReturnTo = null;

            if (previous && previous !== 'window') {
                openModal(previous);
            } else {
                closeModal();
            }
            break;
        }

        case 'clock-hint':
            clockControlsVisible = !clockControlsVisible;
            renderModal('clock');
            break;

        default:
            break;
    }

    if (allLocksRemoved() && !state.complete) {
        notice(
            'All three obstacles are gone. Click the door to escape.'
        );
    }
}

document.addEventListener('click', e => {
    if (isTransitioning) {
        e.preventDefault();
        return;
    }

    const actionElement = e.target.closest('[data-action]');

    if (actionElement) {
        performAction(
            actionElement.dataset.action,
            actionElement
        );
        return;
    }

    if (e.target.closest('[data-close-modal]')) {
        closeModal();
    }
});

document.addEventListener('keydown', e => {
    if (isTransitioning) {
        e.preventDefault();
        return;
    }

    if (e.key === 'Escape' && currentModal) {
        closeModal();
    }

    if (
        !currentModal &&
        !state.complete &&
        ['ArrowLeft', 'ArrowRight'].includes(e.key)
    ) {
        e.preventDefault();
        turn(e.key === 'ArrowLeft' ? -1 : 1);
    }
});

byId('turnLeft').addEventListener('click', () => turn(-1));
byId('turnRight').addEventListener('click', () => turn(1));
byId('musicToggle').addEventListener('click', toggleMusic);
byId('restart').addEventListener('click', resetGame);
byId('endingRestart').addEventListener('click', resetGame);
byId('modalClose').addEventListener('click', closeModal);


// Initialize game

render();

if (state.complete) {
    state.complete = false;
    state.wall = 3;

    persist();
    render();

    notice(
        'Your previous run is complete. ' +
        'Click the door again to revisit the ending, or restart.'
    );
}

if (!state.complete) {
    requestAnimationFrame(() => {
        notice('Click the letter on the table to begin.');
    });
}

function modalNote() {
    return `
        <div class="note-inspection">
            <p class="note-description">
                A note from the clock.
            </p>

            <div class="note-image">
                ${asset('password', '1888')}
            </div>

            <p class="note-message">
                The first key is <strong>1888</strong>.
            </p>
        </div>
    `;
}

function startPaintingReveal() {
    const sequence = ++paintingRevealSequence;
    paintingRevealStage = 'hold';

    setTimeout(() => {
        if (sequence !== paintingRevealSequence) {
            return;
        }
        render();
    }, 240);

    setTimeout(() => {
        if (sequence !== paintingRevealSequence) {
            return;
        }
        paintingRevealStage = 'shake';
        render();
    }, 1140);

    setTimeout(() => {
        if (sequence !== paintingRevealSequence) {
            return;
        }
        paintingRevealStage = 'fall';
        state.paintingRevealDone = true;

        persist();
        render();

        notice('Something falls from the painting.');
    }, 1690);

    setTimeout(() => {
        if (sequence !== paintingRevealSequence) {
            return;
        }
        paintingRevealStage = 'done';
    }, 2390);
}
