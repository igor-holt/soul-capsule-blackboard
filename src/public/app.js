const errorEl = document.getElementById("error");
const statsEl = document.getElementById("stats");
const logEl = document.getElementById("log");
const liveEl = document.getElementById("live-state");

function cardHtml(card) {
  return `<article class="card">
    <strong>${escapeHtml(card.title)}</strong>
    <div class="meta">${escapeHtml(card.subject)} · ${escapeHtml(card.source)} · ${escapeHtml(card.latest_status)} · ${escapeHtml(card.latest_event_id)}</div>
  </article>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render(proj, events) {
  const p = proj.projection ?? proj;
  statsEl.textContent = `${p.event_count} events in the log, ${p.skipped_count} skipped lines, projected at ${p.generated_at}`;
  for (const col of ["LIVE", "BLOCKED", "ACTION_REQUIRED"]) {
    const host = document.getElementById(`col-${col}`);
    const cards = p.columns[col] ?? [];
    host.innerHTML = cards.length ? cards.map(cardHtml).join("") : `<p class="meta">None</p>`;
  }
  logEl.textContent = (events ?? []).map((e) => JSON.stringify(e)).join("\n") || "(empty log)";
}

async function refresh() {
  const [projRes, evRes] = await Promise.all([
    fetch("/api/projection"),
    fetch("/api/events"),
  ]);
  const proj = await projRes.json();
  const ev = await evRes.json();
  render(proj, ev.events);
}

document.getElementById("append-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  errorEl.textContent = "";
  const source = document.getElementById("source").value;
  const subject = document.getElementById("subject").value.trim();
  const body = {
    source,
    source_class: "agent",
    record_type: "capsule",
    event_type: "appended",
    title: document.getElementById("title").value,
    content: document.getElementById("content").value,
    status: document.getElementById("status").value,
    tags: [`subject:${subject}`],
    connections: [subject],
    author: source,
    session_id: "local-demo",
  };
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    errorEl.textContent = (data.errors || [res.statusText]).join("; ");
  }
  // The SSE stream also refreshes the board for this tab and any other open tab.
});

if (typeof EventSource === "function") {
  const source = new EventSource("/api/stream");
  source.onopen = () => {
    liveEl.textContent = "Live updates on.";
  };
  source.onmessage = (message) => {
    try {
      const payload = JSON.parse(message.data);
      if (payload.projection) render({ projection: payload.projection }, payload.events);
    } catch (err) {
      errorEl.textContent = String(err);
    }
  };
  source.onerror = () => {
    liveEl.textContent = "Live stream interrupted; retrying…";
  };
} else {
  liveEl.textContent = "EventSource unavailable; polling every 2s.";
  setInterval(() => {
    refresh().catch((err) => {
      errorEl.textContent = String(err);
    });
  }, 2000);
  refresh().catch((err) => {
    errorEl.textContent = String(err);
  });
}
