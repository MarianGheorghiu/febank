"use client";

import React, { useState } from "react";
import { User, Check, Key, Mail, Phone, Lock, Unlock } from "lucide-react";

interface ExtendedUserProfile {
  firstName: string;
  lastName: string;
  residenceNode: string;
  email: string;
  phone: string;
  operatorId: string;
}

interface UserProfileProps {
  initialProfile: any;
}

export default function UserProfile({ initialProfile }: UserProfileProps) {
  const [profile, setProfile] = useState<ExtendedUserProfile>({
    firstName: initialProfile?.firstName || "JOHN",
    lastName: initialProfile?.lastName || "DOE",
    residenceNode: initialProfile?.residenceNode || "NODE_SECURE_ALPHA",
    email: initialProfile?.email || "j.doe@mainframe.bank",
    phone: initialProfile?.phone || "+40 711 000 222",
    operatorId: "OP-8839-SEC",
  });

  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSudoActive, setIsSudoActive] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleInputChange = (
    field: keyof ExtendedUserProfile,
    value: string,
  ) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value.toUpperCase(),
    }));
  };

  const handleCommitChanges = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSudoActive) return;

    const { currentPassword, newPassword, confirmPassword } = passwordState;
    if (currentPassword || newPassword || confirmPassword) {
      if (
        !currentPassword ||
        newPassword.length < 8 ||
        newPassword !== confirmPassword
      ) {
        return;
      }
    }

    setSaved(true);
    setPasswordState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  return (
    <div className="font-mono antialiased bg-[#111827] border border-slate-700 rounded-xl p-5 flex flex-col h-full justify-between transition-all duration-200 shadow-lg">
      <div>
        {/* HEADER NEO TOKYO EDGE */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#1e293b] border border-slate-600 text-cyan-400 shrink-0">
              <User size={14} />
            </div>
            <div>
              <h2 className="text-white text-xs font-black uppercase tracking-widest">
                IDENTITY_MATRIX
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSudoActive(!isSudoActive)}
            className={`text-[10px] font-black px-3 py-1.5 rounded-md border transition-all duration-150 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider ${
              isSudoActive
                ? "bg-cyan-500/20 text-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                : "bg-red-500/10 text-red-400 border-red-500/40 hover:bg-red-500/20"
            }`}
          >
            {isSudoActive ? (
              <>
                <Unlock size={12} className="text-cyan-400" /> SUDO: UNLOCKED
              </>
            ) : (
              <>
                <Lock size={12} className="text-red-400" /> SUDO: LOCKED
              </>
            )}
          </button>
        </div>

        {/* STATUS PANEL MULTI-STATE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 p-3 bg-[#1e293b] rounded-lg border border-slate-700 text-xs items-center">
          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mr-1">
              OP_ID:
            </span>
            <span className="text-cyan-400 font-black text-sm">
              {profile.operatorId}
            </span>
          </div>
          <div
            className={`sm:col-span-2 text-[11px] font-black tracking-wider sm:text-right ${isSudoActive ? "text-cyan-400" : "text-red-400 animate-pulse"}`}
          >
            {isSudoActive
              ? "> SUDO OVERRIDE: ACCESS GRANTED"
              : "> CORES LOADED. READ-ONLY ACTIVE"}
          </div>
        </div>

        {/* FORM GRID WITH ENHANCED INPUTS */}
        <form onSubmit={handleCommitChanges} className="space-y-4">
          {/* LAYER 01: NAMES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                First Name
              </label>
              <input
                type="text"
                disabled={!isSudoActive}
                value={profile.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-600 focus:border-cyan-400 text-white rounded-lg px-3 py-2.5 text-sm uppercase focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-inner"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Last Name
              </label>
              <input
                type="text"
                disabled={!isSudoActive}
                value={profile.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-600 focus:border-cyan-400 text-white rounded-lg px-3 py-2.5 text-sm uppercase focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-inner"
              />
            </div>
          </div>

          {/* LAYER 02: COMMS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={11} className="text-cyan-400" /> Secure Email
              </label>
              <input
                type="email"
                disabled={!isSudoActive}
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                className="w-full bg-[#1e293b] border border-slate-600 focus:border-cyan-400 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-inner"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={11} className="text-cyan-400" /> Comms Phone
              </label>
              <input
                type="text"
                disabled={!isSudoActive}
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
                className="w-full bg-[#1e293b] border border-slate-600 focus:border-cyan-400 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-inner"
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Mainframe Cluster Node Residence
              </label>
              <input
                type="text"
                disabled={!isSudoActive}
                value={profile.residenceNode}
                onChange={(e) =>
                  handleInputChange("residenceNode", e.target.value)
                }
                className="w-full bg-[#1e293b] border border-slate-600 focus:border-cyan-400 text-white rounded-lg px-3 py-2.5 text-sm uppercase focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold shadow-inner"
              />
            </div>
          </div>

          {/* LAYER 03: PASSWORDS */}
          <div className="space-y-3 p-3 bg-[#1c2535] border border-slate-700 rounded-lg shadow-md">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Current Master Password
              </label>
              <input
                type="password"
                disabled={!isSudoActive}
                placeholder="••••••••••••"
                value={passwordState.currentPassword}
                onChange={(e) =>
                  setPasswordState({
                    ...passwordState,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full bg-[#111827] border border-slate-600 focus:border-cyan-400 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all tracking-widest font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={11} className="text-cyan-400" /> New Key
                </label>
                <input
                  type="password"
                  disabled={!isSudoActive}
                  placeholder="MIN 8 CHARS"
                  value={passwordState.newPassword}
                  onChange={(e) =>
                    setPasswordState({
                      ...passwordState,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-slate-600 focus:border-cyan-400 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all tracking-widest font-bold placeholder:tracking-normal placeholder:text-[10px]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  Confirm Key
                </label>
                <input
                  type="password"
                  disabled={!isSudoActive}
                  placeholder="RE-ENTER"
                  value={passwordState.confirmPassword}
                  onChange={(e) =>
                    setPasswordState({
                      ...passwordState,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full bg-[#111827] border border-slate-600 focus:border-cyan-400 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all tracking-widest font-bold placeholder:tracking-normal placeholder:text-[10px]"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={!isSudoActive}
              className={`w-full cursor-pointer rounded-lg font-black text-xs py-3 tracking-widest uppercase transition-all duration-150 flex items-center justify-center gap-2 border-2 ${
                saved
                  ? "bg-emerald-500 text-[#111827] border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  : "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500 hover:text-[#111827] hover:border-transparent active:scale-[0.99]"
              } disabled:opacity-20 disabled:cursor-not-allowed`}
            >
              {saved ? (
                <>
                  <Check size={14} strokeWidth={3} /> PARAMETERS COMMITTED
                </>
              ) : (
                "COMMIT MUTATION RUN"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
