(function () {
  const STORE_KEY = "paudyal-bansawali-v1";
  const EDIT_KEY = "paudyal-bansawali-edit";
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

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (e) { /* storage unavailable or corrupt: fall back to defaults */ }
    return clone(BROTHERS);
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

  function tabLabel(b, i) {
    return b.name ? b.name.replace(/\s*पौड्याल$/, "") : "दाजुभाइ " + np(i + 1);
  }

  // An inline editable text field. Writes back to obj[key] on every input.
  function field(obj, key, placeholder, cls, onChange) {
    const el = document.createElement("span");
    el.className = cls;
    el.dataset.placeholder = placeholder;
    el.textContent = obj[key] || "";
    if (editing) {
      el.contentEditable = "plaintext-only";
      if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
      el.spellcheck = false;
      el.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); el.blur(); } });
      el.addEventListener("input", () => {
        obj[key] = el.textContent.trim();
        if (onChange) onChange();
      });
      el.addEventListener("blur", () => { el.textContent = obj[key] || ""; save(); });
    } else if (!obj[key]) {
      el.classList.add("blank");
    }
    return el;
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

  function personCard(person, parentList, isRoot, onRootName) {
    const card = document.createElement("div");
    card.className = "person " + (person.gender === "female" ? "female" : "male");
    const placeholder = isRoot ? "दाजुभाइको नाम" : (person.gender === "female" ? "छोरीको नाम" : "छोराको नाम");
    card.appendChild(field(person, "name", placeholder, "name", isRoot ? onRootName : null));
    if (editing || person.note) card.appendChild(field(person, "note", "विवरण", "note"));

    if (editing) {
      const bar = document.createElement("div");
      bar.className = "actions";
      const spouseWord = person.gender === "female" ? "श्रीमान" : "श्रीमती";
      bar.appendChild(button("+ " + spouseWord, spouseWord + " थप्नुहोस्", () => {
        (person.spouses = person.spouses || []).push({ name: "", children: [] });
        save(); render();
      }));
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
  function renderNode(person, parentList, isRoot, onRootName) {
    const li = document.createElement("li");
    li.appendChild(personCard(person, parentList, isRoot, onRootName));
    const spouses = person.spouses || [];
    if (spouses.length) {
      const ul = document.createElement("ul");
      spouses.forEach(spouse => {
        const sli = document.createElement("li");
        sli.appendChild(spouseCard(person, spouse));
        const kids = spouse.children || [];
        if (kids.length) {
          const kul = document.createElement("ul");
          kids.forEach(k => kul.appendChild(renderNode(k, kids, false)));
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
      btn.textContent = tabLabel(b, i);
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
    const tabBtn = tabsEl.children[idx];
    ul.appendChild(renderNode(b, data, true, () => { tabBtn.textContent = tabLabel(b, idx); }));
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
      data = parsed; save(); render();
    }).catch(() => alert("यो फाइल पढ्न सकिएन।")).finally(() => { e.target.value = ""; });
  });

  document.getElementById("reset").addEventListener("click", () => {
    if (!confirm("यो ब्राउजरमा भरिएका सबै विवरण मेटाएर सुरुको डेटामा फर्कने हो?")) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    data = clone(BROTHERS); render();
  });

  render();
})();
