import React from "react";
import {
  getRankTitle,
  getRankColor,
  getRequiredExpForLevel,
  getAIDifficultyByLevel,
  type UserProfile,
} from "../game/level";

interface UserProfileCardProps {
  profile: UserProfile;
  onOpenSaveCodeModal: () => void;
  compact?: boolean;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  profile,
  onOpenSaveCodeModal,
  compact = false,
}) => {
  const reqExp = getRequiredExpForLevel(profile.level);
  const expPercent = Math.min(100, Math.floor((profile.exp / reqExp) * 100));
  const rankTitle = getRankTitle(profile.level);
  const rankColor = getRankColor(profile.level);
  const aiInfo = getAIDifficultyByLevel(profile.level);

  const winRate =
    profile.totalGames > 0
      ? Math.round((profile.wins / profile.totalGames) * 100)
      : 0;

  if (compact) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          padding: "8px 16px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          fontSize: "14px",
        }}
      >
        <span
          style={{
            background: rankColor.bg,
            color: rankColor.text,
            border: `1px solid ${rankColor.border}`,
            padding: "2px 8px",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "12px",
          }}
        >
          {rankTitle}
        </span>
        <span style={{ fontWeight: "bold", color: "#1e293b" }}>
          Lv.{profile.level}
        </span>
        <div style={{ flex: 1, minWidth: "80px", maxWidth: "120px" }}>
          <div
            style={{
              height: "8px",
              backgroundColor: "#e2e8f0",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${expPercent}%`,
                height: "100%",
                background: "linear-gradient(90deg, #3b82f6, #6366f1)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e2e8f0",
        maxWidth: "420px",
        margin: "0 auto 20px auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              background: rankColor.bg,
              color: rankColor.text,
              border: `1px solid ${rankColor.border}`,
              padding: "4px 10px",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "13px",
            }}
          >
            {rankTitle}
          </span>
          <span
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: "#0f172a",
            }}
          >
            Lv.{profile.level}
          </span>
        </div>
        <button
          onClick={onOpenSaveCodeModal}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "600",
            backgroundColor: "#f1f5f9",
            color: "#475569",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          title="기기 이동용 세이브 코드 복사/불러오기"
        >
          🔑 세이브 코드
        </button>
      </div>

      {/* 경험치 바 */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: "#64748b",
            marginBottom: "4px",
            fontWeight: "600",
          }}
        >
          <span>경험치 (EXP)</span>
          <span>
            {profile.exp} / {reqExp} ({expPercent}%)
          </span>
        </div>
        <div
          style={{
            height: "10px",
            backgroundColor: "#f1f5f9",
            borderRadius: "6px",
            overflow: "hidden",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              width: `${expPercent}%`,
              height: "100%",
              background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
              borderRadius: "6px",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* 전적 및 AI 난이도 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          backgroundColor: "#f8fafc",
          padding: "12px",
          borderRadius: "12px",
          fontSize: "13px",
        }}
      >
        <div>
          <div style={{ color: "#64748b", fontSize: "11px" }}>통산 전적</div>
          <div style={{ fontWeight: "700", color: "#1e293b", marginTop: "2px" }}>
            {profile.totalGames}전 {profile.wins}승 (승률 {winRate}%)
          </div>
        </div>
        <div>
          <div style={{ color: "#64748b", fontSize: "11px" }}>싱글 AI 난이도</div>
          <div style={{ fontWeight: "700", color: "#2563eb", marginTop: "2px" }}>
            🤖 {aiInfo.name.split(" ")[0]}
          </div>
        </div>
      </div>
    </div>
  );
};
