"use client";

import { useState } from "react";
import { UserPlus, Plus } from "lucide-react";
import { mockFriendStats, Friend, MOCK_FRIENDS } from "@/app/lib/mockFriends";
import PageHeader from "@/app/components/ui/PageHeader";
import { ActionButton } from "@/app/components/ui/dashboard/ActionButton";

import AddFriendModal from "@/app/components/ui/friends/AddFriendModal";
import SplitBillModal from "@/app/components/ui/friends/SplitBillModal";
import ConfirmationModal from "@/app/components/ui/friends/ConfirmationModal";
import FriendsTable from "@/app/components/ui/friends/FriendsTable";
import FriendsMobileTable from "@/app/components/ui/friends/FriendsMobileTable";
import PendingRequests from "@/app/components/ui/friends/PendingRequests";
import RequestMoneyModal from "@/app/components/ui/friends/RequestMoneyModal";
import GiftModal from "@/app/components/ui/friends/GiftModal";
import QuickFriendTransferModal from "@/app/components/ui/friends/QuickFriendTransfer";

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Stare pentru tipul de acțiune care se execută
  const [actionModal, setActionModal] = useState<
    "transfer" | "request" | "gift" | null
  >(null);

  const [isSplitOpen, setIsSplitOpen] = useState<boolean>(false);
  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    type: "mute" | "unmute" | "delete" | null;
    friend: Friend | null;
  }>({ isOpen: false, type: null, friend: null });

  const stats = mockFriendStats;

  const handleOpenSplit = (friend: Friend) => {
    setActiveFriend(friend);
    setIsSplitOpen(true);
  };

  // HANDLERELE CORECTE CARE SETEAZĂ ȘI PRIETENUL
  const handleOpenTransfer = (friend: Friend) => {
    setActiveFriend(friend); // AICI ERA PROBLEMA! Acum modalul va primi datele.
    setActionModal("transfer");
  };

  const handleOpenRequest = (friend: Friend) => {
    setActiveFriend(friend);
    setActionModal("request");
  };

  const handleOpenGift = (friend: Friend) => {
    setActiveFriend(friend);
    setActionModal("gift");
  };

  const triggerConfirm = (
    type: "mute" | "unmute" | "delete",
    friend: Friend,
  ) => {
    setConfirmConfig({ isOpen: true, type, friend });
  };

  const handleExecuteConfirmation = () => {
    const { type, friend } = confirmConfig;
    if (!friend || !type) return;

    if (type === "delete") {
      setFriends((prev) => prev.filter((f) => f.id !== friend.id));
    } else if (type === "mute" || type === "unmute") {
      setFriends((prev) =>
        prev.map((f) =>
          f.id === friend.id ? { ...f, isMuted: !f.isMuted } : f,
        ),
      );
    }
  };

  const getConfirmModalDetails = () => {
    if (!confirmConfig.friend)
      return { title: "", desc: "", label: "", variant: "warning" as const };
    const name = confirmConfig.friend.name.toUpperCase();
    if (confirmConfig.type === "delete") {
      return {
        title: "Purge Network Connection",
        desc: `Are you sure you want to permanently erase\n ${name} \nfrom your local node database?`,
        label: "PURGE CONTACT",
        variant: "danger" as const,
      };
    }
    if (confirmConfig.type === "mute") {
      return {
        title: "Mute P2P Ledger Node",
        desc: `Deactivate automatic synchronization and notifications for \n ${name}?`,
        label: "MUTE NODE",
        variant: "warning" as const,
      };
    }
    return {
      title: "Unmute P2P Ledger Node",
      desc: `Re-establish hot-sync pipeline and alerts for \n ${name}?`,
      label: "UNMUTE NODE",
      variant: "warning" as const,
    };
  };

  const modalDetails = getConfirmModalDetails();

  return (
    <div className="w-full flex flex-col bg-[#02050e] text-white antialiased">
      {/* HEADER ZONE */}
      <div className="w-full shrink-0">
        <PageHeader
          systemDate="03 Jun 2026"
          statusText="Social Ledger Sync Active"
        >
          <div className="grid grid-cols-2 sm:flex items-center p-1 bg-zinc-950/60 rounded-xl border border-white/[0.04] backdrop-blur-md w-full sm:w-auto gap-0">
            <div className="flex items-center justify-center gap-2 px-4 py-2 font-mono text-xs text-emerald-400 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                ONLINE:{" "}
                <span className="text-white font-black">{stats.online}</span>
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 px-4 py-2 font-mono text-xs text-amber-400 font-bold border-l border-white/[0.06]">
              <UserPlus size={14} className="text-amber-400/80" />
              <span>
                PENDING:{" "}
                <span className="text-white font-black">{stats.pending}</span>
              </span>
            </div>
          </div>

          <ActionButton
            variant="cyan"
            icon={<Plus size={15} />}
            onClick={() => setIsModalOpen(true)}
          >
            ADD NEW FRIEND
          </ActionButton>
        </PageHeader>
      </div>

      {/* WORKSPACE RESPONSIV */}
      <div className="w-full flex flex-col space-y-6 ">
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block w-full">
          <FriendsTable
            friends={friends}
            onTransferClick={handleOpenTransfer} // AICI AM MODIFICAT
            onSplitClick={handleOpenSplit}
            onRequestClick={handleOpenRequest}
            onGiftClick={handleOpenGift}
            onMuteToggle={(friend) =>
              triggerConfirm(friend.isMuted ? "unmute" : "mute", friend)
            }
            onDeleteClick={(friend) => triggerConfirm("delete", friend)}
          />
        </div>

        {/* MOBILE CARDS VIEW */}
        <div className="block md:hidden w-full">
          <FriendsMobileTable
            friends={friends}
            onTransferClick={handleOpenTransfer} // AICI AM MODIFICAT
            onSplitClick={handleOpenSplit}
            onRequestClick={handleOpenRequest}
            onGiftClick={handleOpenGift}
            onMuteToggle={(friend) =>
              triggerConfirm(friend.isMuted ? "unmute" : "mute", friend)
            }
            onDeleteClick={(friend) => triggerConfirm("delete", friend)}
          />
        </div>

        {/* PENDING REQUESTS SYSTEM */}
        <div className="w-full">
          <PendingRequests />
        </div>
      </div>

      {/* SYSTEM MODALS */}
      <AddFriendModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <SplitBillModal
        isOpen={isSplitOpen}
        onClose={() => {
          setIsSplitOpen(false);
          setActiveFriend(null);
        }}
        friend={activeFriend}
      />

      {/* NOILE MODALE LEGATE DE PRIETENI */}
      <QuickFriendTransferModal
        isOpen={actionModal === "transfer"}
        onClose={() => {
          setActionModal(null);
          setActiveFriend(null);
        }}
        friend={activeFriend}
      />

      <RequestMoneyModal
        isOpen={actionModal === "request"}
        onClose={() => {
          setActionModal(null);
          setActiveFriend(null);
        }}
        friend={activeFriend}
      />

      <GiftModal
        isOpen={actionModal === "gift"}
        onClose={() => {
          setActionModal(null);
          setActiveFriend(null);
        }}
        friend={activeFriend}
      />

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={() =>
          setConfirmConfig({ isOpen: false, type: null, friend: null })
        }
        onConfirm={handleExecuteConfirmation}
        title={modalDetails.title}
        description={modalDetails.desc}
        confirmLabel={modalDetails.label}
        variant={modalDetails.variant}
      />
    </div>
  );
}
