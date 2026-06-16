"use client";

import React, { useState, useMemo } from "react";
import ApiTelemetryChart from "@/app/components/ui/admin/ApiTelemetryChart";
import LiveAuditLogs from "@/app/components/ui/admin/LiveAuditLogs";
import ThreatActionList from "@/app/components/ui/admin/ThreatActionList";
import VectorAnalysisChart from "@/app/components/ui/admin/VectorAnalysisChart";
import { FLAGGED_ENTITIES, RiskLevel } from "@/app/lib/admin/mockDashboard";

export default function AdminCommandCenter() {
    const [selectedId, setSelectedId] = useState<string>(
        FLAGGED_ENTITIES[0]?.id || "",
    );

    const currentEntity = useMemo(() => {
        return (
            FLAGGED_ENTITIES.find((e) => e.id === selectedId) ||
            FLAGGED_ENTITIES[0]
        );
    }, [selectedId]);

    const riskColors: Record<RiskLevel, string> = {
        CRITICAL: "#ff0055",
        HIGH: "#f59e0b",
        MEDIUM: "#00f0ff",
        LOW: "#10b981",
    };

    return (
        <div className="flex flex-col gap-4 font-mono w-full m-0 p-0 bg-[#02040a] text-slate-200 selection:bg-cyan-500/30">
            {/* RANDUL 1: MACRO VIEW (Charts & Logs) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <ApiTelemetryChart />
                <LiveAuditLogs />
            </div>

            {/* RANDUL 2: MICRO VIEW (Interactive Lists & Risk Analysis) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <ThreatActionList
                    selectedId={selectedId}
                    onSelectId={setSelectedId}
                    riskColors={riskColors}
                />
                <VectorAnalysisChart currentEntity={currentEntity} />
            </div>
        </div>
    );
}
