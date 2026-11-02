"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.563v1.877h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// Small floating share button, mounted site-wide (except /admin). Stays
// invisible until the visitor scrolls down a bit, then slides in from the
// edge and stays fixed in the corner — intentionally tiny so it never
// competes with the actual page content, especially on mobile.
export default function ShareButton() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 200);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  // Instagram Stories has no public web API a site can post to directly —
  // the only way to make it show up as a destination is the same way
  // sharing a photo from the camera roll does: hand the OS share sheet an
  // actual image file via the Web Share API's `files`. So this fetches the
  // page's own og:image (product photo, campaign banner, ...) and tries
  // that first; browsers/pages that can't do file sharing fall back to a
  // plain link share, then to the small Facebook/LINE/copy menu.
  async function handleShareClick() {
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
      canShare?: (data: ShareData) => boolean;
    };
    const title = document.title;
    const url = window.location.href;

    if (nav.share && nav.canShare) {
      const imageUrl = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
      let file: File | null = null;
      if (imageUrl) {
        try {
          const res = await fetch(imageUrl);
          const blob = await res.blob();
          const ext = blob.type.split("/")[1]?.split("+")[0] || "jpg";
          file = new File([blob], `supatida.${ext}`, { type: blob.type });
        } catch {
          file = null; // CORS, network error, etc. — fall through to link share
        }
      }
      if (file && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ files: [file], title, text: `${title}\n${url}` });
        } catch {
          // user cancelled the native share sheet — respect that, don't
          // immediately pop a second (link-only) share prompt
        }
        return;
      }
    }

    if (nav.share) {
      try {
        await nav.share({ title, url });
      } catch {
        // user cancelled — nothing to do
      }
    } else {
      setMenuOpen((v) => !v);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // clipboard unavailable — link is still right there in the address bar
    }
    setMenuOpen(false);
  }

  const encodedUrl = encodeURIComponent(shareUrl);

  return (
    <div
      className="fixed z-30 flex flex-col items-end gap-1.5"
      style={{
        right: 14,
        bottom: 84,
        transform: visible ? "translateX(0)" : "translateX(56px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {menuOpen && (
        <div className="flex flex-col gap-1 p-1 bg-white" style={{ border: "1px solid var(--border)", boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            title="แชร์ไป Facebook"
            className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#1877F2", color: "white" }}
          >
            <FacebookIcon />
          </a>
          <a
            href={`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            title="แชร์ไป LINE"
            className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#06C755", color: "white" }}
          >
            <LineIcon />
          </a>
          <button
            type="button"
            onClick={copyLink}
            title="คัดลอกลิงก์"
            className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ backgroundColor: "var(--charcoal)", color: "white" }}
          >
            <LinkIcon />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={handleShareClick}
        aria-label="แชร์หน้านี้"
        className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
        style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}
      >
        <ShareIcon />
      </button>
    </div>
  );
}
