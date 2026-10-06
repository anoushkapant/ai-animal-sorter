# AI Animal Sorter 🤖🐾

A free, offline, kid-friendly game that teaches children how **machine learning
works** — you train a tiny AI, it makes a rule from your examples, and you judge
whether its rule was any good.

Perfect for classrooms, coding clubs, and curious 6–12 year olds.

**Live demo:** `https://YOUR-USERNAME.github.io/ai-animal-sorter/`
**Price:** free forever (MIT). No login, no ads, no tracking, works offline.

---

## How it works

The game has four screens:

| Screen | What happens |
| --- | --- |
| **Welcome** | Fun intro, "Become an AI Trainer!" |
| **Training** | Drag (or tap) animals into 👍 Yes / 👎 No boxes to answer the question — e.g. *"Does this animal have fur?"* 6 animals. |
| **AI tries** | The AI now sorts **new** animals by itself. The child taps ✅ right / ❌ wrong. 6 animals. |
| **Results** | Score, confetti, and a plain-language explanation of what the AI actually learned. |

### The three questions

- 🧶 Does this animal have **fur**?
- 🕊️ Can this animal **fly**?
- 🌊 Does this animal live in **water**?

### What the "AI" really is

This is a genuine (if very small) classifier, not a trick. It cannot see the
animal — its only input is the animal's **habitat** (land / air / water) — so it
learns one Yes-or-No label per habitat from the child's answers:

```js
// js/game.js — predict()
// land → Yes, air → No, water → No
return t.yes > t.no;
```

That is crude nearest-neighbour learning, and it behaves the way a real model
should:

| How the child trained | AI's result |
| --- | --- |
| All 6 correct | **6 / 6** every time |
| 4–5 correct | usually 3 / 6 or 6 / 6 |
| Half right (guessing) | **3 / 6** — no signal, no skill |
| Mostly wrong | **0 / 6** — it learned the opposite rule |

The failure case is the best part of the lesson: *bad training data → bad model.*

Two design details do a lot of work here:

1. **Every set is exactly half Yes / half No.** With only 6 examples a model can
   trivially "cheat" by always answering one way. A balanced set means 6/6 can
   only mean "it really learned the rule".
2. **Training always touches all three habitats**, so the AI is never asked
   about a habitat it has never seen.

---

## Play it locally

No build step, no dependencies, no `npm install`.

```bash
# Option 1 — just open the file
open index.html

# Option 2 — serve it (handy for testing on a phone on the same Wi-Fi)
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## Project structure

```
ai-animal-sorter/
├── index.html          # all four screens
├── css/style.css       # pastel gradients, clouds, stars, confetti canvas
├── js/animals.js       # 16 animals, 3 questions, 3 habitats
├── js/game.js          # screens, drag & drop, the classifier, confetti
├── README.md
├── LICENSE             # MIT
└── .gitignore
```

The 16 animals: cat, dog, rabbit, bear, sheep (land), bat, bird, butterfly,
bee, eagle (air), fish, dolphin, whale, turtle, frog, duck (water).

Two are deliberately awkward, and they make great discussion starters:
**🦇 the bat has fur *and* flies**, and **🦆 the duck flies *and* lives in water.**

---

## Classroom tips

- **Ages 6–8** — play in pairs. One child drags, the other calls out Yes/No.
- **Ages 9–12** — ask: *"Why did the AI get it wrong?"* and *"What training
  data would have fixed it?"*
- **Try to make it fail on purpose** — train it badly and read the results
  screen together. Then train it properly and compare.
- **Discussion prompts**
  - What is training data?
  - Who is responsible for a wrong AI answer — the AI, or the person who taught it?
  - Why do real AIs need *thousands* of examples instead of 6?
  - The AI only knows if an animal lives on land, in the air or in water. What
    else would it need to know about a bat or a duck?
- **Differentiation** — edit `js/animals.js`: add a new animal (give it a
  `group` and its `has` flags), or add a whole new question. The game picks up
  new questions automatically; keep roughly 6 Yes and 10 No animals per
  question so the training and test sets stay balanced.

## Accessibility & technical notes

- Works on tablets and phones; drag uses Pointer Events (mouse + touch), with a
  tap-then-tap fallback for young children.
- Respects `prefers-reduced-motion`.
- No web fonts and no CDN requests, so it works fully offline.
- Classic `<script>` tags (not ES modules) so `index.html` works over `file://`.

---

## Publish to GitHub Pages

1. Create a new repo named `ai-animal-sorter`.
2. Upload all the files to the root of the repo.
3. **Settings → Pages → Source:** `main` branch, folder `/` (root).
4. Save. After 1–2 minutes the game is live at:
   `https://YOUR-USERNAME.github.io/ai-animal-sorter/`

---

## License

MIT — free for schools. See [LICENSE](LICENSE).

Emoji artwork belongs to their respective vendors under the Unicode license;
this project claims no rights over them.