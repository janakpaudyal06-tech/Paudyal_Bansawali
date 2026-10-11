(function () {
  const STORE_KEY = "paudyal-bansawali-v1";
  const EDIT_KEY = "paudyal-bansawali-edit";
  const OLD_DEFAULT_NAMES = new Set(["हिरन्दलाल पौड्याल"]); // placeholder names from earlier versions
  const NUM = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  const np = n => String(n).replace(/\d/g, d => NUM[d]);

  const tabsEl = document.getElementById("tabs");
  const panelEl = document.getElementById("panel");
  const editToggle = document.getElementById("edit-toggle");
  const statusEl = document.getElementById("status");

  let data = load();
  let current = (location.hash.slice(1)) || data[0].id;
  let editing = readEditPref();

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // Saved data is matched to the brothers in data.js by id, so the tab list and
  // order always follow data.js while what people filled in is kept.
  function load() {
    let saved = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE_KEY));
      if (Array.isArray(parsed)) saved = parsed;
    } catch (e) { /* storage unavailable or corrupt: fall back to defaults */ }
    return mergeWithDefaults(saved);
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
    // Keep anything filled in under a tab that no longer exists, rather than losing it.
    byId.forEach(b => { if ((b.spouses || []).length) merged.push(b); });
    return merged;
  }

  function readEditPref() {
    try { return localStorage.getItem(EDIT_KEY) !== "off"; } catch (e) { return true; }
  }

  let statusTimer;
  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
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

  // जन्मक्रमको नाम: पहिलो जेठो, अन्तिम कान्छो, बीचका माइलो, साइँलो, काइँलो, राइँलो, ठाइँलो
  const ORDER_MALE = ["माइलो", "साइँलो", "काइँलो", "राइँलो", "ठाइँलो"];
  const ORDER_FEMALE = ["माइली", "साइँली", "काइँली", "राइँली", "ठाइँली"];
  function birthOrder(i, n, female) {
    if (n < 2) return "";
    if (i === 0) return female ? "जेठी" : "जेठो";
    if (i === n - 1) return female ? "कान्छी" : "कान्छो";
    return (female ? ORDER_FEMALE : ORDER_MALE)[i - 1] || (female ? "सानी कान्छी" : "सानो कान्छो");
  }

  // Sons and daughters are counted separately, across all wives, in the order listed.
  function childOrders(person) {
    const kids = [].concat(...(person.spouses || []).map(s => s.children || []));
    const sons = kids.filter(k => k.gender !== "female");
    const daughters = kids.filter(k => k.gender === "female");
    const map = new Map();
    sons.forEach((k, i) => map.set(k, birthOrder(i, sons.length, false)));
    daughters.forEach((k, i) => map.set(k, birthOrder(i, daughters.length, true)));
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
    if (order) {
      const o = document.createElement("div");
      o.className = "order";
      o.textContent = order;
      card.appendChild(o);
    }
    const placeholder = isRoot ? "दाजुभाइको नाम" : (person.gender === "female" ? "छोरीको नाम" : "छोराको नाम");
    card.appendChild(field(person, "name", placeholder, "name"));
    if (editing || person.note) card.appendChild(field(person, "note", "विवरण", "note"));

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
        if (at > 0) bar.appendChild(button("◀", "जेठो/जेठी तिर सार्नुहोस्", move(-1)));
        if (at < parentList.length - 1) bar.appendChild(button("▶", "कान्छो/कान्छी तिर सार्नुहोस्", move(1)));
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

  function spouseCard(person, spouse) {
    const box = document.createElement("div");
    box.className = "spouse";
    const word = person.gender === "female" ? "श्रीमानको नाम" : "श्रीमतीको नाम";
    box.appendChild(field(spouse, "name", word, "name"));
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
    const spouses = person.spouses || [];
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

    panelEl.innerHTML = "";
    const meta = document.createElement("p");
    meta.className = "meta";
    const total = countDescendants(b);
    meta.textContent = total ? "जम्मा " + np(total) + " जना सन्तान" : "अहिलेसम्म विवरण भरिएको छैन।";
    panelEl.appendChild(meta);

    const wrap = document.createElement("div");
    wrap.className = "tree";
    const ul = document.createElement("ul");
    ul.appendChild(renderNode(b, data, true, birthOrder(idx, data.length, false)));
    wrap.appendChild(ul);
    panelEl.appendChild(wrap);

    if (location.hash !== "#" + b.id) history.replaceState(null, "", "#" + b.id);
  }

  editToggle.addEventListener("click", () => {
    editing = !editing;
    try { localStorage.setItem(EDIT_KEY, editing ? "on" : "off"); } catch (e) {}
    render();
  });

  document.getElementById("download").addEventListener("click", () => {
    const text = "// पौड्याल बंशावली — " + new Date().toISOString().slice(0, 10) + " मा डाउनलोड गरिएको\n" +
      "const BROTHERS = " + JSON.stringify(data, null, 2) + ";\n";
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
    data = clone(BROTHERS); render();
  });

  render();
})();
