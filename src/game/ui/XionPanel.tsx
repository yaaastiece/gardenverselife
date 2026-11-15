import { useEffect, useRef, useState } from "react";
import { MessageCircle, Mic, Send, Square, Volume2, VolumeX, Trash2, BookmarkPlus, X } from "lucide-react";
import { SUGGESTIONS, type XionChat } from "../xion/chat";
import { PLANT_KEYS, PLANT_LABELS, TAGS, type Journal, type PlantKey, type Snapshot } from "../xion/journal";
import { createDictation, onSpeaking, speak, stopSpeaking, VOICE_UNSUPPORTED } from "../xion/voice";

type Props = {
  chat: XionChat; journal: Journal;
  plant: PlantKey; setPlant: (p: PlantKey) => void;
  snapshot: (p: PlantKey) => Snapshot;
  onReply: (text: string) => void;
};

function useSub(sub: (f: () => void) => () => void) { const [, f] = useState(0); useEffect(() => sub(() => f((x) => x + 1)), [sub]); }

function MicButton({ onText, label }: { onText: (t: string) => void; label: string }) {
  const [listening, setListening] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const dict = useRef<ReturnType<typeof createDictation> | undefined>(undefined);
  const get = () => { if (dict.current === undefined) dict.current = createDictation(onText, setListening); return dict.current; };
  const down = (e: React.PointerEvent) => { e.preventDefault(); const d = get(); if (!d) { setMsg(VOICE_UNSUPPORTED); return; } setMsg(null); d.start(); };
  const up = () => get()?.stop();
  return <>
    <button type="button" className="gv-xp-icon" data-on={listening ? "" : undefined} aria-label={listening ? "Listening, release to stop" : label} title="Hold to talk"
      onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}><Mic size={15} /></button>
    {msg && <p className="gv-xp-note" role="alert">{msg}</p>}
  </>;
}

export function XionPanel(p: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "journal">("chat");
  return (
    <>
      <button type="button" className="gv-xp-toggle" aria-expanded={open} aria-controls="gv-xion-panel" onClick={() => setOpen(!open)}>
        {open ? <X size={15} /> : <MessageCircle size={15} />} Xion
      </button>
      {open && <aside id="gv-xion-panel" className="gv-care gv-xp" aria-label="Xion">
        <div className="gv-xp-tabs" role="tablist">
          <button role="tab" aria-selected={tab === "chat"} onClick={() => setTab("chat")}>Chat</button>
          <button role="tab" aria-selected={tab === "journal"} onClick={() => setTab("journal")}>Journal</button>
        </div>
        {tab === "chat" ? <ChatTab {...p} /> : <JournalTab {...p} />}
      </aside>}
    </>
  );
}

function context(p: Props) {
  const s = p.snapshot(p.plant);
  const notes = p.journal.lastNotes(p.plant, 3).map((e) => `- ${new Date(e.at).toLocaleDateString()}: ${[e.tags.join(", "), e.text].filter(Boolean).join(" — ")}`).join("\n");
  return `Selected plant: ${PLANT_LABELS[p.plant]}. Stage: ${s.stage}. Water ${Math.round(s.water)}, Sun ${Math.round(s.sun)}, Soil ${Math.round(s.soil)} (0-100; below 30 is low, above 90 water is overwatered).\nLast journal notes:\n${notes || "(none)"}`;
}

function ChatTab(p: Props) {
  const { chat } = p;
  useSub(chat.subscribe);
  const [text, setText] = useState("");
  const [voiceOn, setVoiceOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  useEffect(() => onSpeaking(setSpeaking), []);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [chat.state.messages.length, chat.state.thinking]);
  const send = async (q: string) => {
    setText("");
    const r = await chat.send(q, context(p));
    if (r) { p.onReply(r.text); if (voiceOn && !r.error) speak(r.text); }
  };
  return <div className="gv-xp-body">
    <p className="gv-xp-note">Asking about: <b>{PLANT_LABELS[p.plant]}</b></p>
    <div className="gv-xp-list" ref={list} aria-live="polite">
      {!chat.state.messages.length && <div className="gv-xp-chips">{SUGGESTIONS.map((s) => <button key={s} type="button" onClick={() => send(s)}>{s}</button>)}</div>}
      {chat.state.messages.map((m) => <div key={m.id} className="gv-xp-msg" data-role={m.role} data-error={m.error ? "" : undefined}>
        {m.role === "assistant" && <b>Xion</b>}{m.text}
        {m.role === "assistant" && !m.error && <button type="button" className="gv-xp-save" disabled={saved.has(m.id)}
          onClick={() => { p.journal.add({ plant: p.plant, text: m.text, source: "xion" }, p.snapshot(p.plant)); setSaved(new Set(saved).add(m.id)); }}>
          <BookmarkPlus size={12} />{saved.has(m.id) ? "Saved" : "Save to journal"}</button>}
      </div>)}
      {chat.state.thinking && <div className="gv-xp-msg" data-role="assistant"><b>Xion</b><span className="gv-xp-dots">thinking</span></div>}
    </div>
    <form className="gv-xp-row" onSubmit={(e) => { e.preventDefault(); void send(text); }}>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask Xion…" aria-label="Message Xion" maxLength={500} />
      <MicButton label="Hold to talk to Xion" onText={(t) => void send(t)} />
      <button type="submit" className="gv-xp-icon" aria-label="Send" disabled={!text.trim() || chat.state.thinking}><Send size={15} /></button>
    </form>
    <div className="gv-xp-row">
      <button type="button" className="gv-xp-pill" aria-pressed={voiceOn} onClick={() => { if (voiceOn) stopSpeaking(); setVoiceOn(!voiceOn); }}>{voiceOn ? <Volume2 size={13} /> : <VolumeX size={13} />}Xion speaks</button>
      {speaking && <button type="button" className="gv-xp-pill" onClick={stopSpeaking}><Square size={12} />Stop</button>}
    </div>
  </div>;
}

function JournalTab(p: Props) {
  const { journal } = p;
  useSub(journal.subscribe);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [filter, setFilter] = useState<PlantKey | "all">("all");
  const save = () => { if (journal.add({ plant: p.plant, text, tags }, p.snapshot(p.plant))) { setText(""); setTags([]); } };
  return <div className="gv-xp-body">
    <label className="gv-xp-note">Plant <select value={p.plant} onChange={(e) => p.setPlant(e.target.value as PlantKey)}>{PLANT_KEYS.map((k) => <option key={k} value={k}>{PLANT_LABELS[k]}</option>)}</select></label>
    <div className="gv-xp-row"><textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="What did you notice?" aria-label="Journal note" maxLength={1000} />
      <MicButton label="Hold to dictate a note" onText={(t) => setText((x) => (x ? `${x} ${t}` : t))} /></div>
    <div className="gv-xp-chips">{TAGS.map((t) => <button key={t} type="button" aria-pressed={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{t}</button>)}</div>
    <button type="button" className="gv-xp-primary" onClick={save} disabled={!text.trim() && !tags.length}>Save to journal</button>
    <label className="gv-xp-note">Show <select value={filter} onChange={(e) => setFilter(e.target.value as PlantKey | "all")}><option value="all">All plants</option>{PLANT_KEYS.map((k) => <option key={k} value={k}>{PLANT_LABELS[k]}</option>)}</select></label>
    <ul className="gv-xp-list gv-xp-entries">
      {journal.list(filter).map((e) => <li key={e.id}>
        <div className="gv-xp-entry-head"><b>{PLANT_LABELS[e.plant]}</b><span>{e.stage}</span><time>{new Date(e.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>
          <button type="button" aria-label="Delete entry" onClick={() => journal.remove(e.id)}><Trash2 size={12} /></button></div>
        {e.tags.length > 0 && <div className="gv-xp-tags">{e.tags.join(" · ")}</div>}
        {e.text && <p>{e.source === "xion" ? `Xion: ${e.text}` : e.text}</p>}
        <div className="gv-xp-snap">💧{e.water} ☀️{e.sun} 🌱{e.soil}</div>
      </li>)}
      {!journal.list(filter).length && <li className="gv-xp-note">No entries yet.</li>}
    </ul>
  </div>;
}
