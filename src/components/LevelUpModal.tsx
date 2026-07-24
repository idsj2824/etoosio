import React from "react";
import { getRankColor, type ExpGainResult } from "../game/level";

interface LevelUpModalProps {
  result: ExpGainResult | null;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ result, onClose }) => {
  if (!result || !result.leveledUp) return null;

  const rankColor = getRankColor(result.newLevel);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1100,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "400px",
          padding: "32px 24px",
          textAlign: "center",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          animation: "popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <div style={{ fontSize: "56px", marginBottom: "12px" }}>
          {result.promotedRank ? "🎉 🎖️" : "⭐ 🆙"}
        </div>

        <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", color: "#0f172a", fontWeight: "800" }}>
          {result.promotedRank ? "직급 승진 축하합니다!" : "레벨 업!"}
        </h2>

        <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>
          꾸준한 업무 성과로 새로운 경지에 도달하셨습니다.
        </p>

        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "24px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "6px" }}>
            Lv.{result.oldLevel} ➔ <strong style={{ color: "#2563eb", fontSize: "18px" }}>Lv.{result.newLevel}</strong>
          </div>

          <div style={{ marginTop: "10px" }}>
            <span
              style={{
                background: rankColor.bg,
                color: rankColor.text,
                border: `1px solid ${rankColor.border}`,
                padding: "6px 14px",
                borderRadius: "10px",
                fontWeight: "bold",
                fontSize: "15px",
                display: "inline-block",
              }}
            >
              {result.newRankTitle}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px 20px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
          }}
        >
          확인
        </button>
      </div>
    </div>
  );
};
