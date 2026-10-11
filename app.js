(function () {
  const STORE_KEY = "paudyal-bansawali-v1";
  const EDIT_KEY = "paudyal-bansawali-edit";
  const ORPHAN_KEY = "paudyal-bansawali-old-tabs";
  const ZOOM_KEY = "paudyal-bansawali-zoom";
  const LAYOUT_KEY = "paudyal-bansawali-layout";
  // Which website version this browser's copy started from, and whether it has unsent edits.
  const META_KEY = "paudyal-bansawali-meta";
  const PUBLISHED = typeof DATA_VERSION === "string" ? DATA_VERSION : "";
  const OLD_DEFAULT_NAMES = new Set(["हिरन्दलाल पौड्याल"]); // placeholder names from earlier versions
  const NUM = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  const np = n => String(n).replace(/\d/g, d => NUM[d]);

  const tabsEl = document.getElementById("tabs");
  const panelEl = document.getElementById("panel");
  const editToggle = document.getElementById("edit-toggle");
  const statusEl = document.getElementById("status");

  let meta = readMeta();
  let newerPublished = false; // the website has data newer than this browser's own edits
  let data = load();
  let current = (location.hash.slice(1)) || data[0].id;
  let editing = readEditPref();
  let zoom = readZoom();
  let vertical = readLayout() !== "horizontal"; // ठाडो (top-to-bottom list) is the default
  const collapsed = new WeakSet(); // people whose branch is folded away (this visit only)
  let lastView = null;             // keeps the tree's scroll position across re-renders

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // Saved data is matched to the brothers in data.js by id, so the tab list and
  // order always follow data.js while what people filled in is kept.
  //
  // Whoever opens the link sees the website's data (data.js), unless they have made
  // their own edits in this browser. If the website then gets newer data, people
  // without edits switch to it automatically; people with edits are asked.
  function load() {
    let saved = null;
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE_KEY));
      if (Array.isArray(parsed)) saved = parsed;
    } catch (e) { /* storage unavailable or corrupt: fall back to defaults */ }
    if (!saved) { writeMeta({ basedOn: PUBLISHED, dirty: false }); return clone(BROTHERS); }
    if (meta.basedOn !== PUBLISHED) {
      if (!meta.dirty) { writeMeta({ basedOn: PUBLISHED, dirty: false }); return clone(BROTHERS); }
      newerPublished = true;
    }
    return mergeWithDefaults(saved);
  }

  function readMeta() {
    try {
      const m = JSON.parse(localStorage.getItem(META_KEY));
      if (m && typeof m === "object") return m;
    } catch (e) {}
    // Copies saved before this existed may hold someone's typing: treat them as edited.
    return { basedOn: "", dirty: true };
  }
  function writeMeta(m) {
    meta = m;
    try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {}
  }

  function mergeWithDefaults(saved) {
    const byId = new Map(saved.map(b => [b.id, b]));
    const merged = BROTHERS.map(def => {
      const b = byId.get(def.id);
      if (!b) return clone(def);
      byId.delete(def.id);
      if (!b.name || OLD_DEFAULT_NAMES.has(b.name)) b.name = def.name;
      return b;
    });
    // Tabs are exactly the brothers in data.js. Anything filled in under an old
    // placeholder tab is set aside (not shown) so it isn't lost.
    const orphans = [...byId.values()].filter(b => (b.spouses || []).length);
    if (orphans.length) {
      try { localStorage.setItem(ORPHAN_KEY, JSON.stringify(orphans)); } catch (e) {}
    }
    return merged;
  }

  function readLayout() {
    try { return localStorage.getItem(LAYOUT_KEY); } catch (e) { return null; }
  }

  function readZoom() {
    try { const z = parseFloat(localStorage.getItem(ZOOM_KEY)); return z >= 0.2 && z <= 2 ? z : 1; } catch (e) { return 1; }
  }

  function readEditPref() {
    try { return localStorage.getItem(EDIT_KEY) !== "off"; } catch (e) { return true; }
  }

  let statusTimer;
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      if (!meta.dirty) writeMeta({ ...meta, dirty: true });
      flash("सुरक्षित भयो ✓");
    } catch (e) {
      flash("यो ब्राउजरमा सुरक्षित गर्न सकिएन — डेटा डाउनलोड गर्नुहोस्");
    }
  }
  function flash(msg) {
    statusEl.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { statusEl.textContent = ""; }, 2500);
  }

  function countDescendants(person) {
    let n = 0;
    (person.spouses || []).forEach(s =>
      (s.children || []).forEach(c => { n += 1 + countDescendants(c); })
    );
    return n;
  }

  // जन्मक्रमको नाम: एउटा मात्र भए एकल; पहिलो जेठो, अन्तिम कान्छो, बीचका माइलो, साइँलो, काइँलो, राइँलो, ठाइँलो
  const ORDER_MALE = ["माइलो", "साइँलो", "काइँलो", "राइँलो", "ठाइँलो"];
  const ORDER_FEMALE = ["माइली", "साइँली", "काइँली", "राइँली", "ठाइँली"];
  function birthOrder(i, n, female) {
    if (n < 1) return "";
    if (n === 1) return "एकल"; // एउटा मात्र छोरो/छोरी
    if (i === 0) return female ? "जेठी" : "जेठो";
    if (i === n - 1) return female ? "कान्छी" : "कान्छो";
    return (female ? ORDER_FEMALE : ORDER_MALE)[i - 1] || (female ? "सानी कान्छी" : "सानो कान्छो");
  }

  // Each mother's children are counted on their own, sons and daughters separately,
  // in the order listed (e.g. 4 sons → जेठो, माइलो, साइँलो, कान्छो).
  function childOrders(person) {
    const map = new Map();
    (person.spouses || []).forEach(s => {
      const kids = s.children || [];
      const sons = kids.filter(k => k.gender !== "female");
      const daughters = kids.filter(k => k.gender === "female");
      sons.forEach((k, i) => map.set(k, birthOrder(i, sons.length, false)));
      daughters.forEach((k, i) => map.set(k, birthOrder(i, daughters.length, true)));
    });
    return map;
  }

  function tabLabel(b, i) {
    return b.name ? b.name.replace(/\s*पौड्याल$/, "") : "दाजुभाइ " + np(i + 1);
  }

  // A name/note shown as text; in edit mode a click opens the Roman → नेपाली editor.
  function field(obj, key, placeholder, cls) {
    const el = document.createElement("span");
    el.className = cls;
    el.dataset.placeholder = placeholder;
    el.textContent = obj[key] || "";
    if (editing) {
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      const open = () => {
        const ed = editor(obj, key, placeholder, cls);
        el.replaceWith(ed);
        const input = ed.querySelector("input");
        input.focus();
        input.select();
      };
      el.addEventListener("click", open);
      el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    } else if (!obj[key]) {
      el.classList.add("blank");
    }
    return el;
  }

  // Optional extra suggestions from Google's transliteration service. If it
  // can't be reached, the built-in converter (translit.js) is used alone.
  const googleCache = new Map();
  function googleVariants(word) {
    const w = word.toLowerCase();
    if (!googleCache.has(w)) {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 3000);
      const url = "https://inputtools.google.com/request?itc=ne-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&text=" +
        encodeURIComponent(w);
      googleCache.set(w, fetch(url, { signal: ctrl.signal })
        .then(r => r.json())
        .then(j => (j[0] === "SUCCESS" && j[1][0] && j[1][0][1]) || [])
        .catch(() => []));
    }
    return googleCache.get(w);
  }

  function editor(obj, key, placeholder, cls) {
    const romanKey = key + "Roman";
    const box = document.createElement("div");
    box.className = "editor " + cls;

    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "Roman मा लेख्नुहोस्";
    input.setAttribute("aria-label", placeholder + " (Roman मा)");
    input.value = obj[romanKey] || (obj[key] && !/[A-Za-z]/.test(obj[key]) ? obj[key] : "") || "";

    const preview = document.createElement("div");
    preview.className = "preview";
    preview.setAttribute("aria-live", "polite");

    const hint = document.createElement("div");
    hint.className = "editor-hint";

    const ok = button("✓", "ठीक छ (Enter)", () => commit());
    const cancel = button("✕", "रद्द (Esc)", () => close());
    const row = document.createElement("div");
    row.className = "editor-row";
    row.append(input, ok, cancel);
    box.append(row, preview, hint);

    // per word: chosen variant index, and whether the person picked it themselves
    const picks = new Map();
    let segs = [];

    function wordVariants(w) {
      const local = Translit.variants(w);
      const g = picks.get(w.toLowerCase());
      return g && g.google ? [...new Set([...g.google, ...local])] : local;
    }

    function result() {
      return segs.map(s => {
        if (!s.word) return s.text;
        const v = wordVariants(s.word);
        const p = picks.get(s.word.toLowerCase());
        return v[(p && p.i) || 0] || v[0];
      }).join("").replace(/\s+/g, " ").trim();
    }

    function draw() {
      segs = Translit.segments(input.value);
      preview.innerHTML = "";
      let ambiguous = false;
      segs.forEach(s => {
        if (!s.word) { preview.appendChild(document.createTextNode(s.text)); return; }
        const lw = s.word.toLowerCase();
        const v = wordVariants(s.word);
        const p = picks.get(lw) || {};
        const b = document.createElement("button");
        b.type = "button";
        b.className = "variant";
        b.textContent = v[p.i || 0] || v[0];
        if (v.length > 1) {
          ambiguous = true;
          b.title = "अर्को रूप: " + v.filter((_, i) => i !== (p.i || 0)).slice(0, 4).join(", ");
          b.addEventListener("mousedown", e => e.preventDefault()); // keep focus in the input
          b.addEventListener("click", () => {
            const cur = picks.get(lw) || {};
            picks.set(lw, { ...cur, i: ((cur.i || 0) + 1) % v.length, mine: true });
            draw();
          });
        } else {
          b.disabled = true;
        }
        preview.appendChild(b);
        if (!p.google && !p.asked) {
          picks.set(lw, { ...p, asked: true });
          googleVariants(s.word).then(list => {
            if (!list.length) return;
            const cur = picks.get(lw) || {};
            picks.set(lw, { ...cur, google: list, i: cur.mine ? cur.i : 0 });
            if (box.isConnected) draw();
          });
        }
      });
      hint.textContent = !input.value.trim() ? "जस्तै: ram prasad → राम प्रसाद"
        : ambiguous ? "मिलेन? शब्दमा थिचेर अर्को रूप छान्नुहोस्" : "";
    }

    let done = false;
    function close() {
      if (done) return;
      done = true;
      // Swap just this box back (a full re-render would close a box opened by the same click).
      box.replaceWith(field(obj, key, placeholder, cls));
      renderTabs();
    }
    function commit() {
      if (done) return;
      const roman = input.value.trim();
      obj[key] = result();
      if (/[A-Za-z]/.test(roman)) obj[romanKey] = roman; else delete obj[romanKey];
      save();
      close();
    }

    input.addEventListener("input", draw);
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      if (e.key === "Escape") { e.preventDefault(); close(); }
    });
    box.addEventListener("focusout", e => {
      if (!box.contains(e.relatedTarget)) setTimeout(() => { if (!box.contains(document.activeElement)) commit(); }, 0);
    });

    draw();
    return box;
  }

  function button(label, title, onClick, cls) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "act" + (cls ? " " + cls : "");
    b.textContent = label;
    b.title = title;
    b.addEventListener("click", onClick);
    return b;
  }

  function confirmRemove(what, person) {
    const n = person ? countDescendants(person) : 0;
    const extra = n ? "\nयससँगै तलका " + np(n) + " जना पनि हट्नेछन्।" : "";
    return confirm(what + " हटाउने हो?" + extra);
  }

  function personCard(person, parentList, isRoot, order) {
    const card = document.createElement("div");
    card.className = "person " + (person.gender === "female" ? "female" : "male");
    if (editing && !isRoot && parentList.length > 1) card.appendChild(dragHandle(person, parentList));
    if (order) {
      const o = document.createElement("div");
      o.className = "order";
      o.textContent = order;
      card.appendChild(o);
    }
    const placeholder = isRoot ? "दाजुभाइको नाम" : (person.gender === "female" ? "छोरीको नाम" : "छोराको नाम");
    card.appendChild(field(person, "name", placeholder, "name"));
    if (editing || person.note) card.appendChild(field(person, "note", "विवरण", "note"));
    const below = countDescendants(person);
    if (below) {
      const folded = collapsed.has(person);
      const t = button(folded ? "▸ " + np(below) + " जना" : "▾", folded ? "हाँगा खोल्नुहोस्" : "हाँगा बन्द गर्नुहोस्", () => {
        if (folded) collapsed.delete(person); else collapsed.add(person);
        render();
      }, "fold");
      card.appendChild(t);
    }

    if (editing) {
      const bar = document.createElement("div");
      bar.className = "actions";
      const spouseWord = person.gender === "female" ? "श्रीमान" : "श्रीमती";
      bar.appendChild(button("+ " + spouseWord, spouseWord + " थप्नुहोस्", () => {
        (person.spouses = person.spouses || []).push({ name: "", children: [] });
        save(); render();
      }));
      if (!isRoot && parentList.length > 1) {
        const at = parentList.indexOf(person);
        const move = d => () => {
          parentList.splice(at, 1);
          parentList.splice(at + d, 0, person);
          save(); render();
        };
        if (at > 0) bar.appendChild(button(vertical ? "▲" : "◀", "जेठो/जेठी तिर सार्नुहोस्", move(-1)));
        if (at < parentList.length - 1) bar.appendChild(button(vertical ? "▼" : "▶", "कान्छो/कान्छी तिर सार्नुहोस्", move(1)));
      }
      if (!isRoot) {
        bar.appendChild(button("✕", "हटाउनुहोस्", () => {
          if (!confirmRemove(person.name || "यो व्यक्ति", person)) return;
          parentList.splice(parentList.indexOf(person), 1);
          save(); render();
        }, "danger"));
      }
      card.appendChild(bar);
    }
    return card;
  }

  // Grab ⠿ and drop a son/daughter among their siblings to set who is elder or younger.
  // Pointer events, so it works with a mouse and with a finger.
  function dragHandle(person, parentList) {
    const h = document.createElement("span");
    h.className = "drag";
    h.textContent = "⠿";
    h.title = "तानेर जेठो/कान्छो क्रम मिलाउनुहोस्";
    h.setAttribute("role", "button");
    h.setAttribute("aria-label", "क्रम मिलाउन तान्नुहोस्");
    h.addEventListener("pointerdown", e => {
      if (e.button !== 0) return;
      e.preventDefault();
      const li = h.closest("li");
      const lis = [...li.parentElement.children];
      const from = lis.indexOf(li);
      const cardOf = l => l.querySelector(":scope > .person");
      let to = from;

      const ghost = cardOf(li).cloneNode(true);
      ghost.classList.add("drag-ghost");
      document.body.appendChild(ghost);
      li.classList.add("drag-source");
      h.setPointerCapture(e.pointerId);

      const clearMarks = () => lis.forEach(l => l.classList.remove("drop-before", "drop-after"));
      const move = ev => {
        ghost.style.left = ev.clientX + 14 + "px";
        ghost.style.top = ev.clientY + 10 + "px";
        const pos = vertical ? ev.clientY : ev.clientX;
        let slot = lis.length; // insertion point among the original siblings
        for (let i = 0; i < lis.length; i++) {
          const r = cardOf(lis[i]).getBoundingClientRect();
          if (pos < (vertical ? r.top + r.height / 2 : r.left + r.width / 2)) { slot = i; break; }
        }
        to = slot > from ? slot - 1 : slot;
        clearMarks();
        if (to !== from) {
          if (slot < lis.length) lis[slot].classList.add("drop-before");
          else lis[lis.length - 1].classList.add("drop-after");
        }
        // Scroll when dragging near the edge of the screen.
        if (ev.clientY < 70) window.scrollBy(0, -18);
        else if (ev.clientY > window.innerHeight - 70) window.scrollBy(0, 18);
        const wrap = li.closest(".tree");
        if (!vertical && wrap) {
          const r = wrap.getBoundingClientRect();
          if (ev.clientX < r.left + 50) wrap.scrollLeft -= 18;
          else if (ev.clientX > r.right - 50) wrap.scrollLeft += 18;
        }
      };
      const finish = commit => () => {
        h.removeEventListener("pointermove", move);
        h.removeEventListener("pointerup", onUp);
        h.removeEventListener("pointercancel", onCancel);
        ghost.remove();
        li.classList.remove("drag-source");
        clearMarks();
        if (commit && to !== from) {
          parentList.splice(from, 1);
          parentList.splice(to, 0, person);
          save();
          render();
        }
      };
      const onUp = finish(true), onCancel = finish(false);
      h.addEventListener("pointermove", move);
      h.addEventListener("pointerup", onUp);
      h.addEventListener("pointercancel", onCancel);
      move(e);
    });
    return h;
  }

  function spouseCard(person, spouse) {
    const box = document.createElement("div");
    box.className = "spouse";
    const word = person.gender === "female" ? "श्रीमानको नाम" : "श्रीमतीको नाम";
    box.appendChild(field(spouse, "name", word, "name"));
    if (editing || spouse.note) box.appendChild(field(spouse, "note", "विवरण", "note"));
    if (editing) {
      const bar = document.createElement("div");
      bar.className = "actions";
      const add = gender => () => {
        (spouse.children = spouse.children || []).push({ name: "", gender });
        save(); render();
      };
      bar.appendChild(button("+ छोरा", "छोरा थप्नुहोस्", add("male")));
      bar.appendChild(button("+ छोरी", "छोरी थप्नुहोस्", add("female")));
      bar.appendChild(button("✕", "हटाउनुहोस्", () => {
        const n = (spouse.children || []).reduce((a, c) => a + 1 + countDescendants(c), 0);
        const extra = n ? "\nयससँगै तलका " + np(n) + " जना पनि हट्नेछन्।" : "";
        if (!confirm((spouse.name || "यो नाम") + " हटाउने हो?" + extra)) return;
        person.spouses.splice(person.spouses.indexOf(spouse), 1);
        save(); render();
      }, "danger"));
      box.appendChild(bar);
    }
    return box;
  }

  // A person, then one branch per spouse with that spouse's children beneath.
  function renderNode(person, parentList, isRoot, order) {
    const li = document.createElement("li");
    li.appendChild(personCard(person, parentList, isRoot, order));
    const spouses = collapsed.has(person) ? [] : (person.spouses || []);
    const orders = childOrders(person);
    if (spouses.length) {
      const ul = document.createElement("ul");
      spouses.forEach(spouse => {
        const sli = document.createElement("li");
        sli.appendChild(spouseCard(person, spouse));
        const kids = spouse.children || [];
        if (kids.length) {
          const kul = document.createElement("ul");
          kids.forEach(k => kul.appendChild(renderNode(k, kids, false, orders.get(k))));
          sli.appendChild(kul);
        }
        ul.appendChild(sli);
      });
      li.appendChild(ul);
    }
    return li;
  }

  function renderTabs() {
    tabsEl.innerHTML = "";
    data.forEach((b, i) => {
      const btn = document.createElement("button");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(b.id === current));
      const ord = document.createElement("small");
      ord.textContent = birthOrder(i, data.length, false);
      const nm = document.createElement("span");
      nm.textContent = tabLabel(b, i);
      btn.append(ord, nm);
      btn.addEventListener("click", () => { current = b.id; render(); });
      tabsEl.appendChild(btn);
    });
  }

  function render() {
    if (!data.some(b => b.id === current)) current = data[0].id;
    const idx = data.findIndex(b => b.id === current);
    const b = data[idx];
    renderTabs();
    document.body.classList.toggle("editing", editing);
    editToggle.setAttribute("aria-pressed", String(editing));
    editToggle.textContent = editing ? "हेर्ने मोड" : "भर्ने / सम्पादन मोड";

    const oldWrap = panelEl.querySelector(".tree");
    if (oldWrap && lastView && lastView.id === b.id) {
      lastView.left = oldWrap.scrollLeft; lastView.top = oldWrap.scrollTop;
    }
    panelEl.innerHTML = "";
    if (newerPublished) panelEl.appendChild(newerBanner());
    const meta = document.createElement("p");
    meta.className = "meta";
    const total = countDescendants(b);
    meta.textContent = total ? "जम्मा " + np(total) + " जना सन्तान" : "अहिलेसम्म विवरण भरिएको छैन।";
    panelEl.appendChild(meta);

    const wrap = document.createElement("div");
    wrap.className = "tree" + (vertical ? " vertical" : "");
    const ul = document.createElement("ul");
    ul.style.zoom = zoom;
    ul.appendChild(renderNode(b, data, true, birthOrder(idx, data.length, false)));
    wrap.appendChild(ul);
    panelEl.appendChild(treeTools(wrap, ul));
    panelEl.appendChild(wrap);
    enableDragPan(wrap);

    if (lastView && lastView.id === b.id) {
      wrap.scrollLeft = lastView.left; wrap.scrollTop = lastView.top;
    } else {
      // New tab: the sideways tree starts with its top in the middle of the view.
      wrap.scrollLeft = vertical ? 0 : (wrap.scrollWidth - wrap.clientWidth) / 2;
      lastView = { id: b.id, left: wrap.scrollLeft, top: 0 };
    }

    if (location.hash !== "#" + b.id) history.replaceState(null, "", "#" + b.id);
  }

  function newerBanner() {
    const box = document.createElement("div");
    box.className = "banner";
    const msg = document.createElement("p");
    msg.textContent = "वेबसाइटमा नयाँ बंशावली राखिएको छ। तपाईंले यो ब्राउजरमा भरेको पुरानो प्रति देखिरहनुभएको छ।";
    box.append(msg,
      button("वेबसाइटको नयाँ हेर्नुहोस्", "वेबसाइटमा राखिएको बंशावली देखाउनुहोस्", () => {
        if (!confirm("यो ब्राउजरमा भरेका तर वेबसाइटमा नराखिएका कुरा हट्नेछन्।\nचाहिएमा पहिले \"डेटा डाउनलोड\" गर्नुहोस्।\n\nवेबसाइटको बंशावली देखाउने हो?")) return;
        try { localStorage.removeItem(STORE_KEY); } catch (e) {}
        writeMeta({ basedOn: PUBLISHED, dirty: false });
        newerPublished = false;
        data = clone(BROTHERS);
        render();
      }, "primary"),
      button("मेरो नै राख्नुहोस्", "यो ब्राउजरमा भरेको प्रति नै राख्नुहोस्", () => {
        writeMeta({ basedOn: PUBLISHED, dirty: true });
        newerPublished = false;
        render();
      })
    );
    return box;
  }

  function setZoom(z, wrap, ul) {
    // Keep the point in the middle of the view in the middle after zooming.
    const cx = (wrap.scrollLeft + wrap.clientWidth / 2) / zoom;
    const cy = (wrap.scrollTop + wrap.clientHeight / 2) / zoom;
    zoom = Math.min(2, Math.max(0.2, Math.round(z * 100) / 100));
    ul.style.zoom = zoom;
    wrap.scrollLeft = cx * zoom - wrap.clientWidth / 2;
    wrap.scrollTop = cy * zoom - wrap.clientHeight / 2;
    try { localStorage.setItem(ZOOM_KEY, String(zoom)); } catch (e) {}
    const label = panelEl.querySelector(".zoom-level");
    if (label) label.textContent = np(Math.round(zoom * 100)) + "%";
  }

  function treeTools(wrap, ul) {
    const bar = document.createElement("div");
    bar.className = "tree-tools";
    const level = document.createElement("span");
    level.className = "zoom-level";
    level.textContent = np(Math.round(zoom * 100)) + "%";
    bar.append(
      button("−", "सानो बनाउनुहोस्", () => setZoom(zoom - 0.1, wrap, ul)),
      level,
      button("+", "ठूलो बनाउनुहोस्", () => setZoom(zoom + 0.1, wrap, ul)),
      button("पूरै देखाउनुहोस्", "पूरै बंशावली एकै पटक स्क्रिनमा", () => {
        // From full size, shrink until nothing sticks out sideways (re-measure: rounding can leave a sliver).
        setZoom(1, wrap, ul);
        for (let i = 0; i < 4 && wrap.scrollWidth > wrap.clientWidth + 1; i++) {
          setZoom(zoom * (wrap.clientWidth - 4) / wrap.scrollWidth - 0.005, wrap, ul);
        }
        wrap.scrollLeft = 0; wrap.scrollTop = 0;
      }),
      button("१००%", "सामान्य आकार", () => setZoom(1, wrap, ul))
    );
    bar.appendChild(button(vertical ? "तेर्सो रूखमा हेर्नुहोस्" : "ठाडो सूचीमा हेर्नुहोस्", "देखाउने तरिका बदल्नुहोस्", () => {
      vertical = !vertical;
      try { localStorage.setItem(LAYOUT_KEY, vertical ? "vertical" : "horizontal"); } catch (e) {}
      lastView = null;
      render();
    }, "layout"));
    if (anyCollapsed()) {
      bar.appendChild(button("सबै हाँगा खोल्नुहोस्", "बन्द गरिएका सबै हाँगा खोल्नुहोस्", () => {
        (function open(p) { collapsed.delete(p); (p.spouses || []).forEach(s => (s.children || []).forEach(open)); })(data.find(x => x.id === current));
        render();
      }));
    }
    const tip = document.createElement("span");
    tip.className = "tree-tip";
    tip.textContent = "माउसले तानेर वा स्क्रोल गरेर सार्नुहोस्";
    if (!vertical) bar.appendChild(tip);
    return bar;
  }

  function anyCollapsed() {
    let found = false;
    (function walk(p) { if (collapsed.has(p)) found = true; (p.spouses || []).forEach(s => (s.children || []).forEach(walk)); })(data.find(x => x.id === current));
    return found;
  }

  // Drag the empty part of the tree with the mouse to move around (touch already scrolls).
  function enableDragPan(wrap) {
    let start = null;
    wrap.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if (e.target.closest("button, input, [role=button], .editor")) return;
      start = { x: e.clientX, y: e.clientY, left: wrap.scrollLeft, top: wrap.scrollTop };
      wrap.setPointerCapture(e.pointerId);
      wrap.classList.add("dragging");
    });
    wrap.addEventListener("pointermove", e => {
      if (!start) return;
      wrap.scrollLeft = start.left - (e.clientX - start.x);
      wrap.scrollTop = start.top - (e.clientY - start.y);
    });
    const end = () => { start = null; wrap.classList.remove("dragging"); };
    wrap.addEventListener("pointerup", end);
    wrap.addEventListener("pointercancel", end);
  }

  editToggle.addEventListener("click", () => {
    editing = !editing;
    try { localStorage.setItem(EDIT_KEY, editing ? "on" : "off"); } catch (e) {}
    render();
  });

  document.getElementById("download").addEventListener("click", () => {
    const version = new Date().toISOString();
    const text = "// पौड्याल बंशावली — " + version.slice(0, 10) + " मा डाउनलोड गरिएको\n" +
      "// वेबसाइटमा राख्न: यो फाइल GitHub मा data.js को सट्टा अपलोड गर्नुहोस्।\n" +
      "const DATA_VERSION = " + JSON.stringify(version) + ";\n" +
      "const BROTHERS = " + JSON.stringify(data, null, 2) + ";\n";
    // Once this file is on the website, this browser's copy matches it.
    writeMeta({ basedOn: version, dirty: false });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
    a.download = "data.js";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById("upload").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then(text => {
      const m = text.match(/\[[\s\S]*\]/);
      const parsed = m && JSON.parse(m[0]);
      if (!Array.isArray(parsed) || !parsed.length) throw new Error("bad file");
      data = mergeWithDefaults(parsed); save(); render();
    }).catch(() => alert("यो फाइल पढ्न सकिएन।")).finally(() => { e.target.value = ""; });
  });

  document.getElementById("reset").addEventListener("click", () => {
    if (!confirm("यो ब्राउजरमा भरिएका सबै विवरण मेटाएर सुरुको डेटामा फर्कने हो?")) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    writeMeta({ basedOn: PUBLISHED, dirty: false });
    newerPublished = false;
    data = clone(BROTHERS); render();
  });

  render();
})();
