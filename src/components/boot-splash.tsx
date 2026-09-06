"use client";

import { useEffect } from "react";

export function BootSplash() {
  return (
    <div
      id="boot-splash"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        color: "#1d1d1f",
        fontFamily:
          '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Source Han Sans SC", sans-serif',
        letterSpacing: "0.08em",
        textAlign: "center",
        padding: "0 28px",
      }}
    >
      <p style={{ margin: 0, fontSize: 22, fontWeight: 500, lineHeight: 1.7 }}>
        好好吃饭 好好睡觉
      </p>
      <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 500, lineHeight: 1.7 }}>
        保持真诚和善良❤️
      </p>
    </div>
  );
}

export function BootSplashDismiss() {
  useEffect(() => {
    const el = document.getElementById("boot-splash");
    if (!el) return;
    const hide = () => {
      el.style.transition = "opacity 0.5s ease";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      window.setTimeout(() => el.remove(), 520);
    };
    const timer = window.setTimeout(hide, 420);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
