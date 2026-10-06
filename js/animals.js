/* =========================================================
   animals.js — the data the whole game learns from
   Loaded as a plain script (no ES modules) so that opening
   index.html straight from a folder still works.
   ========================================================= */

window.AnimalData = (function () {
  'use strict';

  /* The three things a child can teach the AI.
     `rule` is how we phrase the answer in the results screen. */
  const FEATURES = [
    { key: 'fur',   emoji: '🧶', rule: 'have fur',      question: 'Does this animal have fur?' },
    { key: 'fly',   emoji: '🕊️', rule: 'fly',           question: 'Can this animal fly?' },
    { key: 'water', emoji: '🌊', rule: 'live in water', question: 'Does this animal live in water?' }
  ];

  /* The three habitats. This is the AI's only input — it cannot see an
     animal, it can only guess from "does this one live on land, in the
     air, or in water?". Grouping the animals this way is what lets the
     toy AI give a *different* answer for different animals. */
  const GROUPS = ['land', 'air', 'water'];

  /* 16 animals, balanced so that exactly 6 match each feature and 10 do
     not. That lets every round use 3 Yes + 3 No for training AND the same
     for testing (see buildRounds below — it matters).

     Two animals are deliberately awkward, and they are great for talking
     about afterwards:
       🦇 Bat  — has fur AND flies
       🦆 Duck — flies AND lives in water                                */
  const ANIMALS = [
    // --- land ---
    { id: 'cat',    name: 'Cat',    emoji: '🐱', group: 'land',
      has: { fur: true,  fly: false, water: false } },
    { id: 'dog',    name: 'Dog',    emoji: '🐶', group: 'land',
      has: { fur: true,  fly: false, water: false } },
    { id: 'rabbit', name: 'Rabbit', emoji: '🐰', group: 'land',
      has: { fur: true,  fly: false, water: false } },
    { id: 'bear',   name: 'Bear',   emoji: '🐻', group: 'land',
      has: { fur: true,  fly: false, water: false } },
    { id: 'sheep',  name: 'Sheep',  emoji: '🐑', group: 'land',
      has: { fur: true,  fly: false, water: false } },

    // --- air ---
    { id: 'bat',       name: 'Bat',       emoji: '🦇', group: 'air',
      has: { fur: true,  fly: true, water: false } },
    { id: 'bird',      name: 'Bird',      emoji: '🐦', group: 'air',
      has: { fur: false, fly: true, water: false } },
    { id: 'butterfly', name: 'Butterfly', emoji: '🦋', group: 'air',
      has: { fur: false, fly: true, water: false } },
    { id: 'bee',       name: 'Bee',       emoji: '🐝', group: 'air',
      has: { fur: false, fly: true, water: false } },
    { id: 'eagle',     name: 'Eagle',     emoji: '🦅', group: 'air',
      has: { fur: false, fly: true, water: false } },

    // --- water ---
    { id: 'fish',    name: 'Fish',    emoji: '🐟', group: 'water',
      has: { fur: false, fly: false, water: true } },
    { id: 'dolphin', name: 'Dolphin', emoji: '🐬', group: 'water',
      has: { fur: false, fly: false, water: true } },
    { id: 'whale',   name: 'Whale',   emoji: '🐳', group: 'water',
      has: { fur: false, fly: false, water: true } },
    { id: 'turtle',  name: 'Turtle',  emoji: '🐢', group: 'water',
      has: { fur: false, fly: false, water: true } },
    { id: 'frog',    name: 'Frog',    emoji: '🐸', group: 'water',
      has: { fur: false, fly: false, water: true } },
    { id: 'duck',    name: 'Duck',    emoji: '🦆', group: 'water',
      has: { fur: false, fly: true,  water: true } }
  ];

  /* ---------- helpers ---------- */

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function randomFeature() {
    return FEATURES[Math.floor(Math.random() * FEATURES.length)];
  }

  /* Pick `count` animals from `pool`, trying to include every habitat in
     `groups` before topping up at random. Covering all three habitats is
     what stops the AI from meeting a habitat it has never been taught about. */
  function draft(pool, count, groups) {
    const chosen = [];
    const taken  = new Set();

    for (const g of groups) {
      if (chosen.length >= count) break;
      const candidate = shuffle(pool.filter(a => a.group === g))[0];
      if (candidate) { chosen.push(candidate); taken.add(candidate.id); }
    }

    const rest = shuffle(pool.filter(a => !taken.has(a.id)));
    while (chosen.length < count && rest.length) chosen.push(rest.shift());

    return shuffle(chosen);
  }

  /* Split the animals into a training set and a test set for one round.
     Both sets are kept at exactly half Yes / half No, and the training set
     always touches all three habitats. That is what lets a well-trained AI
     score 6/6 and a badly-trained one score near 0. */
  function buildRounds(featureKey, each, groups) {
    const g = groups || GROUPS;

    const matches  = ANIMALS.filter(a => a.has[featureKey]);
    const nonMatch = ANIMALS.filter(a => !a.has[featureKey]);

    const trainYes = draft(matches,  each, g);
    const trainNo  = draft(nonMatch, each, g);

    const used = new Set(trainYes.concat(trainNo).map(a => a.id));
    const leftMatch   = matches.filter(a => !used.has(a.id));
    const leftNonMatch = nonMatch.filter(a => !used.has(a.id));

    return {
      training: shuffle(trainYes.concat(trainNo)),
      test:     shuffle(leftMatch.slice(0, each).concat(leftNonMatch.slice(0, each)))
    };
  }

  return { FEATURES, GROUPS, ANIMALS, shuffle, randomFeature, buildRounds };
})();