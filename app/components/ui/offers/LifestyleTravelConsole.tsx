"use client";

import React, { useState } from "react";
import {
  Layers,
  QrCode,
  Calendar,
  MapPin,
  Ticket,
  Check,
  X,
  Search,
} from "lucide-react";
import { LoungeAccess, ExclusiveEvent } from "@/app/lib/mockOffers";

interface Props {
  lounge: LoungeAccess;
  events: ExclusiveEvent[];
  pointsBalance: number;
  onUpdateEventStatus: (
    id: string,
    newStatus: "AVAILABLE" | "RESERVED",
    pointCost: number,
  ) => void;
}

export default function LifestyleTravelConsole({
  lounge,
  events,
  pointsBalance,
  onUpdateEventStatus,
}: Props) {
  const [showQR, setShowQR] = useState(false);
  const [eventSearch, setEventSearch] = useState("");

  const filteredEvents = events.filter(
    (evt) =>
      evt.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      evt.location.toLowerCase().includes(eventSearch.toLowerCase()),
  );

  return (
    <div className="relative border border-cyan-500/30 bg-[#0a1024] rounded-xl p-5 transition-all duration-300 group hover:border-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-[484px] overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-3">
        {/* HEADER */}
        <div className="flex justify-between items-center pb-3 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-cyan-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#02040f] border border-cyan-500/10 text-cyan-400">
              <Layers size={14} />
            </div>
            Lifestyle & Avionics Lounge
          </h2>
          <span className="text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest">
            {lounge.provider}
          </span>
        </div>

        {/* LOUNGE TRACKER INTERACTIVE DISPLAY */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center shrink-0">
          <div className="sm:col-span-7 space-y-2 font-mono">
            <div className="p-2.5 rounded-lg bg-[#02040f]/60 border border-blue-500/10 flex flex-col">
              <span className="text-[8px] font-bold text-slate-500 uppercase">
                Active Geo-Node Lounge
              </span>
              <span className="text-white font-black text-[11px] mt-0.5 truncate uppercase">
                {lounge.activeLounge}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-[#02040f]/40 border border-blue-500/5 text-center">
                <span className="text-[8px] text-slate-500 block uppercase">
                  Tokens Left
                </span>
                <span className="text-cyan-400 font-black text-xs">
                  {lounge.tokensAvailable} VVIP
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#02040f]/40 border border-blue-500/5 text-center">
                <span className="text-[8px] text-slate-500 block uppercase">
                  Tier Access
                </span>
                <span className="text-white font-black text-[9px] uppercase truncate block mt-0.5">
                  {lounge.tierStatus}
                </span>
              </div>
            </div>
          </div>

          {/* REAL MATRIX DYNAMIC QR GATE */}
          <div className="sm:col-span-5 flex justify-center items-center h-full">
            <button
              onClick={() => setShowQR(!showQR)}
              className="cursor-pointer w-full p-2.5 h-[76px] rounded-lg bg-[#02040f] border border-cyan-500/40 hover:border-cyan-400 flex flex-col items-center justify-center gap-1 transition-all"
            >
              {showQR ? (
                <span className="font-mono text-[9px] text-white bg-cyan-950/40 px-2 py-1 rounded border border-cyan-500/30 tracking-wider">
                  {lounge.qrCodePayload}
                </span>
              ) : (
                <QrCode
                  size={20}
                  className="text-cyan-400 drop-shadow-[0_0_5px_#22d3ee]"
                />
              )}
              <span className="text-[8px] font-mono font-black text-cyan-400 tracking-widest uppercase">
                {showQR ? "HIDE CODE DEPLOYMENT" : "GENERATE PASS QR"}
              </span>
            </button>
          </div>
        </div>

        {/* HIGH-VISIBILITY SEARCH FOR EVENTS */}
        <div className="relative shrink-0 my-1">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400"
          />
          <input
            type="text"
            placeholder="SEARCH VIP CIRCUIT EVENTS..."
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
            className="w-full bg-[#02040f]/60 border border-cyan-500/50 focus:border-cyan-400 rounded-lg pl-8 pr-7 py-2 font-mono text-[10px] text-white placeholder-slate-500 uppercase tracking-wider focus:outline-none transition-all"
          />
          {eventSearch && (
            <button
              onClick={() => setEventSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* EVENTS MATRIX LIST ENGINE */}
        <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin pr-1 bg-black/10 rounded border border-blue-500/5 p-1">
          {filteredEvents.map((evt) => {
            const isReserved = evt.status === "RESERVED";
            const isSoldOut = evt.status === "SOLD_OUT";
            const canAfford = pointsBalance >= evt.ticketPricePoints;

            return (
              <div
                key={evt.id}
                className={`flex justify-between items-center p-2.5 rounded-lg font-mono border text-[11px] transition-all ${
                  isSoldOut
                    ? "opacity-25 bg-[#02040f]/10 border-transparent cursor-not-allowed"
                    : isReserved
                      ? "bg-[#02040f] border-emerald-400 shadow-[inset_0_0_10px_rgba(52,211,153,0.1)]"
                      : "bg-[#02040f]/50 border-blue-500/10 hover:border-cyan-500/40"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded border flex items-center justify-center font-bold shrink-0 ${
                      isReserved
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-cyan-950/30 border-cyan-500/20 text-cyan-400"
                    }`}
                  >
                    <Ticket size={12} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-white uppercase truncate tracking-wide">
                      {evt.title}
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase flex items-center gap-1.5 truncate">
                      <MapPin size={9} className="text-cyan-400" />{" "}
                      {evt.location} • <Calendar size={9} /> {evt.date}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-3 flex items-center gap-3">
                  <div className="flex flex-col text-right hidden sm:flex">
                    <span className="font-black text-white text-xs">
                      {evt.ticketPricePoints.toLocaleString()}
                    </span>
                    <span className="text-[7px] text-slate-500 uppercase font-bold">
                      PTS
                    </span>
                  </div>

                  {isReserved ? (
                    <button
                      onClick={() =>
                        onUpdateEventStatus(
                          evt.id,
                          "AVAILABLE",
                          evt.ticketPricePoints,
                        )
                      }
                      className="cursor-pointer px-2.5 py-1 text-[8px] font-black uppercase rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white tracking-widest transition-all"
                    >
                      CANCEL
                    </button>
                  ) : (
                    <button
                      disabled={isSoldOut || !canAfford}
                      onClick={() =>
                        onUpdateEventStatus(
                          evt.id,
                          "RESERVED",
                          evt.ticketPricePoints,
                        )
                      }
                      className={`cursor-pointer px-2.5 py-1 text-[8px] font-black uppercase rounded tracking-widest transition-all ${
                        isSoldOut
                          ? "bg-slate-900 text-slate-600 border-transparent cursor-not-allowed"
                          : !canAfford
                            ? "bg-slate-900 text-slate-500 border border-dashed border-red-500/20 cursor-not-allowed"
                            : "bg-cyan-400 text-black hover:bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                      }`}
                    >
                      {isSoldOut
                        ? "SOLD OUT"
                        : !canAfford
                          ? "LOW PTS"
                          : "BOOK VIP"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
