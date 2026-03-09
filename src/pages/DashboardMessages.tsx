import { useEffect, useState } from "react";
import { api } from "../api";

type Message = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export default function DashboardMessages() {
  const [list, setList] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);

  function load() {
    api.get<Message[]>("/dashboard/messages").then(setList).catch(() => {});
  }
  useEffect(() => load(), []);

  async function markRead(id: number) {
    try {
      await api.patch(`/dashboard/messages/${id}/read`);
      load();
      setSelected((s) => (s?.id === id ? { ...s, read_at: new Date().toISOString() } : s));
    } catch {}
  }

  function select(m: Message) {
    setSelected(m);
    if (!m.read_at) markRead(m.id);
  }

  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-white mb-8">Contact Messages</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          {list.map((m) => (
            <button
              key={m.id}
              onClick={() => select(m)}
              className={`w-full text-left p-4 rounded-sm border transition-colors ${
                selected?.id === m.id ? "border-icube-gold bg-icube-gold/10" : "border-white/10 bg-icube-gray hover:border-white/20"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-white">{m.subject}</span>
                {!m.read_at && <span className="w-2 h-2 rounded-full bg-icube-gold shrink-0" />}
              </div>
              <p className="text-gray-500 text-sm mt-1">{m.name} · {new Date(m.created_at).toLocaleDateString("en-AE")}</p>
            </button>
          ))}
        </div>
        <div className="bg-icube-gray border border-white/10 rounded-sm p-6">
          {selected ? (
            <>
              <h2 className="text-xl font-display font-bold text-white mb-2">{selected.subject}</h2>
              <p className="text-gray-400 text-sm mb-4">
                {selected.name} &lt;{selected.email}&gt; · {new Date(selected.created_at).toLocaleString("en-AE")}
              </p>
              <p className="text-gray-300 whitespace-pre-wrap">{selected.message}</p>
            </>
          ) : (
            <p className="text-gray-500">Select a message</p>
          )}
        </div>
      </div>
    </div>
  );
}
