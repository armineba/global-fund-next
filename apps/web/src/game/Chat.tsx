import {useState,type FormEvent} from "react";
import { Radio, ArrowUpRight } from "lucide-react";
import type { RoomView } from "@global-fund/shared";
import { request } from "../store";
export default function Chat({ room }: { room: RoomView }) {
  const [text, setText] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    void request("room:chat", { roomId: room.roomId, text });
    setText("");
  };
  return (
    <section className="chat-panel">
      <div className="panel-title">
        <span>CHAT DU SALON</span>
        <Radio size={13} />
      </div>
      <div className="chat-messages" aria-live="polite">
        {room.messages.length ? (
          room.messages.slice(-12).map((m) => (
            <p key={m.id}>
              <b>{m.name}</b>
              <span>{m.text}</span>
            </p>
          ))
        ) : (
          <p className="muted">Votre table est prête à discuter.</p>
        )}
      </div>
      <form onSubmit={submit}>
        <input
          aria-label="Message du salon"
          placeholder="Écrire au salon…"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
        />
        <button aria-label="Envoyer le message">
          <ArrowUpRight size={17} />
        </button>
      </form>
    </section>
  );
}

