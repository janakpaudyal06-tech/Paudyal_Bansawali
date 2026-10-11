(function () {
  const tabsEl = document.getElementById("tabs");
  const panelEl = document.getElementById("panel");

  function countDescendants(person) {
    let n = 0;
    (person.spouses || []).forEach(s =>
      (s.children || []).forEach(c => { n += 1 + countDescendants(c); })
    );
    return n;
  }

  function personCard(person) {
    const card = document.createElement("div");
    card.className = "person " + (person.gender === "female" ? "female" : "male");
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = person.name;
    card.appendChild(name);
    if (person.note) {
      const note = document.createElement("div");
      note.className = "note";
      note.textContent = person.note;
      card.appendChild(note);
    }
    return card;
  }

  // Renders a person and, under them, one branch per spouse with that spouse's children.
  function renderNode(person) {
    const li = document.createElement("li");
    li.appendChild(personCard(person));

    const spouses = (person.spouses || []).filter(s => s);
    if (spouses.length) {
      const ul = document.createElement("ul");
      spouses.forEach(spouse => {
        const sli = document.createElement("li");
        const sp = document.createElement("div");
        sp.className = "spouse";
        sp.textContent = spouse.name;
        sli.appendChild(sp);
        const kids = spouse.children || [];
        if (kids.length) {
          const kul = document.createElement("ul");
          kids.forEach(k => kul.appendChild(renderNode(k)));
          sli.appendChild(kul);
        }
        ul.appendChild(sli);
      });
      li.appendChild(ul);
    }
    return li;
  }

  function show(id) {
    const b = BROTHERS.find(x => x.id === id) || BROTHERS[0];
    tabsEl.querySelectorAll("button").forEach(btn =>
      btn.setAttribute("aria-selected", String(btn.dataset.id === b.id))
    );
    panelEl.innerHTML = "";

    const head = document.createElement("div");
    head.className = "panel-head";
    const h2 = document.createElement("h2");
    h2.textContent = b.name;
    const meta = document.createElement("p");
    const total = countDescendants(b);
    meta.textContent = total
      ? total + " descendant" + (total === 1 ? "" : "s") + " recorded"
      : "No family details added yet.";
    head.append(h2, meta);
    panelEl.appendChild(head);

    const wrap = document.createElement("div");
    wrap.className = "tree";
    const ul = document.createElement("ul");
    ul.appendChild(renderNode(b));
    wrap.appendChild(ul);
    panelEl.appendChild(wrap);

    if (location.hash !== "#" + b.id) history.replaceState(null, "", "#" + b.id);
  }

  BROTHERS.forEach(b => {
    const btn = document.createElement("button");
    btn.setAttribute("role", "tab");
    btn.dataset.id = b.id;
    btn.textContent = b.name.replace(/\s+Paudyal$/, "");
    btn.addEventListener("click", () => show(b.id));
    tabsEl.appendChild(btn);
  });

  show(location.hash.slice(1));
})();
