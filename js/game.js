/* =========================================================
   game.js — screens, training, "AI" predictions, confetti
   The AI here is a deliberately tiny rule the child shapes:
   it guesses "Yes" when the child said Yes to most animals
   that truly had the feature, and "No" otherwise.
   ========================================================= */

(function () {
  'use strict';

  const { GROUPS, randomFeature, buildRounds } = window.AnimalData;

  const TRAINING_SIZE = 6;
  const TEST_SIZE = 6;
  const EACH_SIDE = 3;   // 3 Yes + 3 No in each set — see animals.js

  /* ---------- tiny DOM helper ---------- */
  const $ = (id) => document.getElementById(id);

  /* "…does fly." / "…do not have fur." */
  function say(animal, truth) {
    const verb = state.feature.key === 'fly'
      ? (truth ? 'flies' : 'does not fly')
      : state.feature.key === 'fur'
        ? (truth ? 'has fur' : 'does not have fur')
        : (truth ? 'lives in water' : 'does not live in water');
    return `A ${animal.name} ${verb}.`;
  }

  const ui = {
    screens: {
      welcome: $('screen-welcome'),
      train:   $('screen-train'),
      test:    $('screen-test'),
      results: $('screen-results')
    },

    // training
    trainQuestion: $('train-question'),
    trainEmoji:    $('train-emoji'),
    trainName:     $('train-name'),
    trainCount:    $('train-count'),
    trainProgress: $('train-progress'),
    trainBar:      $('train-progressbar'),
    trainHint:     $('train-hint'),
    trainFeedback: $('train-feedback'),
    trainAnimal:   $('train-animal'),
    zoneYes:       $('zone-yes'),
    zoneNo:        $('zone-no'),

    // test
    testEmoji:    $('test-emoji'),
    testName:     $('test-name'),
    testAnswer:   $('test-answer'),
    testCount:    $('test-count'),
    testProgress: $('test-progress'),
    testBar:      $('test-progressbar'),
    testFeedback: $('test-feedback'),
    btnRight:     $('btn-right'),
    btnWrong:     $('btn-wrong'),

    // results
    scoreCircle: $('score-circle'),
    scoreLabel:  $('score-label'),
    explain:     $('explain'),

    buttons: {
      start:   $('btn-start'),
      again:   $('btn-again'),
      newQ:    $('btn-new-question')
    },

    confetti: $('confetti')
  };

  /* ---------- game state ---------- */
  const state = {
    feature: null,
    busy: false,            // blocks input while feedback is showing
    training: [],
    test: [],
    trainIndex: 0,
    testIndex: 0,
    trainStats: null,   // { feature, saidYes, correctYes, accuracy }
    testResults: []     // { animal, predicted, truth, kidSaidRight }
  };

  /* =======================================================
     SCREEN CONTROL
     ======================================================= */
  function show(name) {
    Object.values(ui.screens).forEach(s => s.classList.remove('is-active'));
    ui.screens[name].classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setProgress(barEl, fillEl, done, total) {
    const pct = Math.round((done / total) * 100);
    fillEl.style.width = pct + '%';
    barEl.setAttribute('aria-valuenow', String(pct));
  }

  /* =======================================================
     START A ROUND
     ======================================================= */
  function startRound(feature) {
    const f = feature || randomFeature();
    state.feature = f;
    state.busy = false;
const rounds = buildRounds(f.key, EACH_SIDE, GROUPS);

    state.training   = rounds.training;
    state.test       = rounds.test;
    state.trainIndex = 0;
    state.testIndex  = 0;
    state.trainResults = [];   // { animal, saidYes }
    state.testResults  = [];   // { animal, predicted, kidSaidRight }
    state.trainStats = {
      feature: f,
      saidYes: 0,
      correct: 0,
      total: 0
    };

    ui.trainQuestion.textContent = f.question;
    ui.trainHint.textContent = 'Drag the animal, or tap it and then tap a box 👇';
    ui.trainFeedback.textContent = '';
    ui.trainFeedback.className = 'feedback';
    ui.trainAnimal.classList.remove('is-selected');

    setProgress(ui.trainBar, ui.trainProgress, 0, TRAINING_SIZE);
    show('train');
    paintTrain();
  }

  function paintTrain() {
    const animal = state.training[state.trainIndex];
    if (!animal) return;
    ui.trainEmoji.textContent = animal.emoji;
    ui.trainName.textContent  = animal.name;
    ui.trainCount.textContent = (state.trainIndex + 1) + ' / ' + TRAINING_SIZE;
  }

  /* =======================================================
     TRAINING — the child teaches
     ======================================================= */
  function submitTrainingAnswer(answer) {
    if (state.busy) return;                     // ignore double-taps mid-feedback
    const animal = state.training[state.trainIndex];
    if (!animal) return;

    state.busy = true;
    const truth   = animal.has[state.feature.key];
    const correct = (answer === 'yes') === truth;

    state.trainResults.push({ animal: animal, saidYes: answer === 'yes' });

    const stats = state.trainStats;
    stats.total += 1;
    if (correct) stats.correct += 1;
    if (answer === 'yes') stats.saidYes += 1;

    // Gentle, kid-friendly feedback — never harsh.
    if (correct) {
      ui.trainFeedback.textContent = '🌟 Great training! ' + say(animal, truth);
      ui.trainFeedback.className = 'feedback is-good';
    } else {
      ui.trainFeedback.textContent = '👍 Good try! ' + say(animal, truth);
      ui.trainFeedback.className = 'feedback is-bad';
    }

    ui.trainAnimal.classList.remove('is-correct', 'is-wrong');
    void ui.trainAnimal.offsetWidth;                       // restart the animation
    ui.trainAnimal.classList.add(correct ? 'is-correct' : 'is-wrong');

    // Light up the box they chose.
    const zone = answer === 'yes' ? ui.zoneYes : ui.zoneNo;
    zone.classList.remove('is-lit');
    void zone.offsetWidth;
    zone.classList.add('is-lit');
    zone.classList.add(answer === 'yes' ? 'is-pop-yes' : 'is-pop-no');

    state.trainIndex += 1;
    setProgress(ui.trainBar, ui.trainProgress, state.trainIndex, TRAINING_SIZE);

setTimeout(() => {
      state.busy = false;
      zone.classList.remove('is-lit', 'is-pop-yes', 'is-pop-no');
      ui.trainAnimal.classList.remove('is-selected', 'is-correct', 'is-wrong');

      if (state.trainIndex >= TRAINING_SIZE) {
        startTest();
      } else {
        paintTrain();
      }
    }, 950);
  }

  /* =======================================================
     THE "AI" — a real (if very simple) classifier

     It cannot see the animal. All it has is the animal's habitat
     (land / air / water), so it learns one Yes-or-No label per
     habitat from the child's training answers, then applies them.

     That is a crude but genuine nearest-neighbour model: give it more,
     clearer examples and it gets smarter; give it confusing examples and
     its habitats fight each other and it gets worse. */
  function habitatLabels() {
    const tally = {};
    state.trainResults.forEach(r => {
      const t = tally[r.animal.group] || (tally[r.animal.group] = { yes: 0, no: 0 });
      if (r.saidYes) t.yes++; else t.no++;
    });

    // If the child said Yes more often than No overall, that is the
    // best guess for a habitat it never saw. Ties fall back to "No".
    const yes = state.trainResults.filter(r => r.saidYes).length;
    const no  = state.trainResults.length - yes;
    const fallback = yes > no;

    return { tally, fallback };
  }

  function predict(animal) {
    const { tally, fallback } = habitatLabels();
    const t = tally[animal.group];

    if (!t || t.yes === t.no) return fallback;   // unseen or tied habitat
    return t.yes > t.no;
  }

  function startTest() {
    state.testIndex = 0;
    state.testResults = [];
    ui.testFeedback.textContent = '';
    ui.testFeedback.className = 'feedback';
    setProgress(ui.testBar, ui.testProgress, 0, TEST_SIZE);
    show('test');
    paintTest();
  }

  function paintTest() {
    const animal = state.test[state.testIndex];
    if (!animal) return;

    const guess   = predict(animal);

    ui.testEmoji.textContent  = animal.emoji;
    ui.testName.textContent   = animal.name;
    ui.testAnswer.textContent = guess ? 'Yes' : 'No';
    ui.testAnswer.style.color = guess ? 'var(--green-d)' : 'var(--pink-d)';
    ui.testCount.textContent  = (state.testIndex + 1) + ' / ' + TEST_SIZE;
  }

  function judge(isCorrect) {
    if (state.busy) return;                     // ignore double-taps mid-feedback
    const animal = state.test[state.testIndex];
    if (!animal) return;

    state.busy = true;
    const guess = predict(animal);
    const truth = animal.has[state.feature.key];

    state.testResults.push({
      animal: animal,
      predicted: guess,
      truth: truth,
      kidSaidRight: isCorrect
    });

    ui.testFeedback.textContent = isCorrect
      ? `🎉 Nice! The AI was right about this one.`
      : `💡 Not quite — ${say(animal, truth)}`;
    ui.testFeedback.className = isCorrect ? 'feedback is-good' : 'feedback is-bad';

    state.testIndex += 1;
    setProgress(ui.testBar, ui.testProgress, state.testIndex, TEST_SIZE);

    setTimeout(() => {
      state.busy = false;
      if (state.testIndex >= TEST_SIZE) {
        showResults();
      } else {
        paintTest();
      }
    }, 1000);
  }

  /* =======================================================
     RESULTS — score + what the AI "learned"
     ======================================================= */
  /* One readable line per habitat, exactly as the AI now thinks. */
  function describeHabitats() {
    const { tally, fallback } = habitatLabels();
    const word = {
      land:  'land animals',
      air:   'animals that fly',
      water: 'water animals'
    };

    return GROUPS.map(g => {
      const t = tally[g];
      let answer;
      if (!t)      answer = fallback ? 'Yes' : 'No';
      else if (t.yes === t.no) answer = 'No 🤷 (mixed up)';
      else         answer = t.yes > t.no ? 'Yes' : 'No';

      const seen = t ? `${t.yes} Yes / ${t.no} No` : 'never shown';
      return `<li>${word[g]}: the AI says <strong>${answer}</strong> <span style="color:var(--ink-soft)">(you said ${seen})</span></li>`;
    });
  }

  function showResults() {
    const s = state.trainStats;
    const results = state.testResults;
    const total = results.length;
    const agreed = results.filter(r => r.kidSaidRight).length;
    const pct = total ? Math.round((agreed / total) * 100) : 0;
    const trainPct = s.total ? Math.round((s.correct / s.total) * 100) : 0;

    ui.scoreCircle.textContent = agreed + ' / ' + total;

    /* The badge tracks the score, because that is the number the child looks at.
     The paragraph below it is where we tell them how their training went. */
    let label;
    if (agreed === total) label = '🏆 Perfect — expert trainer!';
    else if (pct >= 67)   label = '🌟 Superb! The AI learned a lot.';
    else if (pct >= 34)   label = '👍 Good job — keep training!';
    else                  label = '🌱 Nice try — train it again!';

    let lesson;
    if (trainPct <= 33) {
      lesson = '😄 <strong>Oops — the AI learned something strange!</strong> Because your training answers were mostly wrong, it wrote the <em>opposite</em> rule, so now it puts most animals in the wrong boxes. (It still got a few right by luck — that is what guessing looks like!) Play again and answer carefully.';
    } else if (trainPct >= 84 && agreed === total) {
      lesson = '🌟 <strong>Brilliant teaching!</strong> Your examples were clear, so the AI found a rule that works and put every new animal in the right box. Try “New question” to teach it something else!';
    } else if (agreed === total) {
      lesson = '👍 <strong>Nice!</strong> The AI put every new animal in the right box this time — even though only ' + s.total + ' examples taught it. Real AI needs <em>thousands</em> to be that reliable.';
    } else {
      lesson = '🤔 <strong>Almost!</strong> Your answers were a bit mixed up, so some habitats ended up confused — look at the “mixed up” line above. The AI can only learn from what you show it, so <em>cleaner examples make a smarter AI</em>.';
    }

    ui.explain.innerHTML = [
      '<h3>🤖 What your AI actually learned</h3>',
      '<p>The AI can’t see the animals. It can only guess from <strong>where they live</strong>, so it learned one rule per habitat:</p>',
      '<ul>' + describeHabitats().join('') + '</ul>',
      '<p>You trained with <strong>' + s.total + '</strong> animals and got <strong>' + s.correct +
        '</strong> right. You and the AI then agreed on <strong>' + agreed + '</strong> of the <strong>' +
        total + '</strong> new animals (<strong>' + pct + '%</strong>).</p>',
      '<p>' + lesson + '</p>'
    ].join('');

    ui.scoreLabel.textContent = label;
    show('results');
    launchConfetti();
  }

  /* =======================================================
     CONFETTI (no libraries)
     ======================================================= */
  let confettiRaf = null;
  function launchConfetti() {
    const canvas = ui.confetti;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    function sizeCanvas() {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas, { once: true });

    const colors = ['#ff8fb1', '#6ec6ff', '#ffd166', '#5fd68a', '#b79dff', '#ff9f68'];
    const W = window.innerWidth, H = window.innerHeight;
    const bits = Array.from({ length: 130 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H - H,
      w: 6 + Math.random() * 7,
      h: 8 + Math.random() * 9,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 3.5,
      vx: (Math.random() - 0.5) * 2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.22
    }));

    let frames = 0;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      bits.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.vr;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      });
      frames++;
      if (frames < 300 && bits.some(b => b.y < H + 40)) {
        confettiRaf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
        confettiRaf = null;
      }
    }
    if (confettiRaf) cancelAnimationFrame(confettiRaf);
    confettiRaf = requestAnimationFrame(draw);
  }

  /* =======================================================
     DRAG & DROP (works with mouse AND touch)
     ======================================================= */
  function initDragAndDrop() {
    const card = ui.trainAnimal;
    let ghost = null;
    let startX = 0, startY = 0, dragging = false;

    function makeGhost(emoji) {
      ghost = document.createElement('div');
      ghost.className = 'drag-ghost';
      ghost.textContent = emoji;
      document.body.appendChild(ghost);
    }

    function moveGhost(x, y) {
      if (ghost) {
        ghost.style.left = x + 'px';
        ghost.style.top  = y + 'px';
      }
    }

    function hitZone(x, y) {
      const zones = [ui.zoneYes, ui.zoneNo];
      for (const z of zones) {
        const r = z.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return z;
      }
      return null;
    }

    function clearGhost() {
      if (ghost) { ghost.remove(); ghost = null; }
      card.classList.remove('is-dragging');
      ui.zoneYes.classList.remove('is-over');
      ui.zoneNo.classList.remove('is-over');
    }

    card.addEventListener('pointerdown', (e) => {
      // Only respond to the primary button / single touch.
      if (e.button !== undefined && e.button !== 0) return;
      startX = e.clientX; startY = e.clientY;
      dragging = false;
      card.setPointerCapture(e.pointerId);
    });

    card.addEventListener('pointermove', (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const far = Math.hypot(dx, dy) > 8;

      if (far && !dragging) {
        dragging = true;
        card.classList.add('is-dragging');
        makeGhost(ui.trainEmoji.textContent);
      }
      if (dragging) {
        moveGhost(e.clientX, e.clientY);
        const z = hitZone(e.clientX, e.clientY);
        ui.zoneYes.classList.toggle('is-over', z === ui.zoneYes);
        ui.zoneNo.classList.toggle('is-over', z === ui.zoneNo);
      }
    });

    function endDrag(e) {
      if (dragging) {
        const z = hitZone(e.clientX, e.clientY);
        clearGhost();
        dragging = false;
        if (z) submitTrainingAnswer(z.dataset.answer);
      } else {
        // A tap/click (not a drag): toggle "selected" for tap-to-answer.
        const wasSelected = card.classList.contains('is-selected');
        card.classList.toggle('is-selected', !wasSelected);
        ui.trainHint.textContent = wasSelected
          ? 'Drag the animal, or tap it and then tap a box 👇'
          : 'Nice! Now tap 👍 Yes or 👎 No';
      }
    }

    card.addEventListener('pointerup', endDrag);
    card.addEventListener('pointercancel', () => { clearGhost(); dragging = false; });

    // Tap the boxes directly (works for tap-to-answer and keyboard).
    ui.zoneYes.addEventListener('click', () => submitTrainingAnswer('yes'));
    ui.zoneNo.addEventListener('click',  () => submitTrainingAnswer('no'));

    // Keyboard support on the animal card.
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        ui.zoneYes.focus();
      }
    });
  }

  /* =======================================================
     WIRE UP
     ======================================================= */
  function init() {
    if (init.done) return;      // never wire the buttons up twice
    init.done = true;

    ui.buttons.start.addEventListener('click', () => startRound());
    ui.buttons.again.addEventListener('click', () => startRound());
    ui.buttons.newQ.addEventListener('click', () => startRound());

    ui.btnRight.addEventListener('click', () => judge(true));
    ui.btnWrong.addEventListener('click', () => judge(false));

    initDragAndDrop();
    show('welcome');
  }

  document.addEventListener('DOMContentLoaded', init);
})();