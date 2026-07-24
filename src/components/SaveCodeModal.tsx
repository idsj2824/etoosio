import React, { useState } from "react";
import { exportSaveCode, importSaveCode, type UserProfile } from "../game/level";

interface SaveCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onLoadProfile: (imported: UserProfile) => void;
}

export const SaveCodeModal: React.FC<SaveCodeModalProps> = ({
  isOpen,
  onClose,
  profile,
  onLoadProfile,
}) => {
  const [inputCode, setInputCode] = useState("");
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const currentSaveCode = exportSaveCode(profile);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentSaveCode);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleImport = () => {
    setErrorMessage("");
    setSuccessMessage("");

    const imported = importSaveCode(inputCode);
    if (!imported) {
      setErrorMessage("올바르지 않거나 손상된 세이브 코드입니다.");
      return;
    }

    onLoadProfile(imported);
    setSuccessMessage(`성공! [Lv.${imported.level}] 레벨 데이터로 복원되었습니다.`);
    setInputCode("");
    setTimeout(() => {
      setSuccessMessage("");
      onClose();
    }, 1800);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "460px",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
            🔑 프로필 세이브 코드 관리
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#94a3b8",
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0", lineHeight: "1.5" }}>
          로그인 없이 다른 기기나 웹 브라우저에서 내 레벨과 경험치를 그대로 이어서 플레이할 수 있습니다.
        </p>

        {/* 세이브 코드 내보내기 */}
        <div style={{ marginBottom: "20px", backgroundColor: "#f8fafc", padding: "14px", borderRadius: "12px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
            내 현재 프로필 세이브 코드 (Export)
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              readOnly
              value={currentSaveCode}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontFamily: "monospace",
                color: "#475569",
              }}
            />
            <button
              onClick={handleCopyCode}
              style={{
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: "600",
                backgroundColor: copiedMessage ? "#22c55e" : "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {copiedMessage ? "복사완료! ✓" : "코드 복사"}
            </button>
          </div>
        </div>

        {/* 세이브 코드 불러오기 */}
        <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "12px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
            다른 기기 세이브 코드 불러오기 (Import)
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="ETOOS- 로 시작하는 코드를 입력하세요"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                fontSize: "12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontFamily: "monospace",
              }}
            />
            <button
              onClick={handleImport}
              style={{
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: "600",
                backgroundColor: "#4f46e5",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              불러오기
            </button>
          </div>
          {errorMessage && (
            <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "8px", fontWeight: "600" }}>
              ⚠️ {errorMessage}
            </div>
          )}
          {successMessage && (
            <div style={{ color: "#16a34a", fontSize: "12px", marginTop: "8px", fontWeight: "600" }}>
              🎉 {successMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
