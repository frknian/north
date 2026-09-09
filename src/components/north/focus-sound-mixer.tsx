"use client";

import { useEffect, useState } from "react";
import {
  ExternalLink,
  Headphones,
  Maximize2,
  Music2,
  Play,
  RotateCcw,
  Sliders,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type AmbientSoundType = "none" | "rain" | "noise" | "cafe" | "drone";

interface FocusSoundMixerProps {
  activeSound: AmbientSoundType;
  onSoundChange: (type: AmbientSoundType) => void;
  ambientVolume?: number;
  onVolumeChange?: (volume: number) => void;
}

// Preset Curated Focus Playlists
const SPOTIFY_PRESETS = [
  {
    id: "deep-focus",
    title: "Deep Focus",
    subtitle: "Sakin ambient & elektronik odak",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ",
  },
  {
    id: "lofi-beats",
    title: "Lofi Beats",
    subtitle: "Düşük tempolu çalışma ritimleri",
    url: "https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM",
  },
  {
    id: "peaceful-piano",
    title: "Peaceful Piano",
    subtitle: "Dingin akustik piyano",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
  },
  {
    id: "brain-food",
    title: "Brain Food",
    subtitle: "Nöral ritimler & elektronik",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWXLeA8Omikj7",
  },
];

const APPLE_PRESETS = [
  {
    id: "pure-focus",
    title: "Pure Focus",
    subtitle: "Zihni berraklaştıran odak akışı",
    url: "https://music.apple.com/us/playlist/pure-focus/pl.046a6f6713e449c490898867f53cf7bc",
  },
  {
    id: "beats-to-study",
    title: "Beats to Study to",
    subtitle: "Ders ve derin çalışma ritimleri",
    url: "https://music.apple.com/us/playlist/beats-to-study-to/pl.35f750b2aa77420583b27b953d39589d",
  },
  {
    id: "ambient-essentials",
    title: "Ambient Essentials",
    subtitle: "Pürüzsüz arka plan sesleri",
    url: "https://music.apple.com/us/playlist/ambient-essentials/pl.b5687796934c44bc82cbef7ba1b76ee9",
  },
];

const YOUTUBE_PRESETS = [
  {
    id: "lofi-girl",
    title: "Lofi Girl Radio",
    subtitle: "Canlı Lofi Hip Hop Akışı",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
  },
  {
    id: "binaural-40hz",
    title: "40Hz Gamma Focus",
    subtitle: "Binaural derin konsantrasyon dalgası",
    url: "https://www.youtube.com/watch?v=1ZYbU8JGB4U",
  },
  {
    id: "synthwave-radio",
    title: "Synthwave Radio",
    subtitle: "Retro elektronik kodlama akışı",
    url: "https://www.youtube.com/watch?v=4xDzrJKXOOY",
  },
  {
    id: "coffee-shop-live",
    title: "Cozy Coffee Shop",
    subtitle: "Yağmurlu kafe müziği ve ambiyansı",
    url: "https://www.youtube.com/watch?v=e3L1PIY1pN8",
  },
];

function convertToEmbedUrl(url: string, platform: "spotify" | "apple" | "yt"): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    if (platform === "spotify") {
      if (trimmed.includes("open.spotify.com/embed/")) {
        return trimmed;
      }
      if (trimmed.includes("open.spotify.com/")) {
        const clean = trimmed.split("?")[0];
        const parts = clean.split("open.spotify.com/");
        if (parts[1]) {
          return `https://open.spotify.com/embed/${parts[1]}?utm_source=generator&theme=0`;
        }
      }
      if (trimmed.startsWith("spotify:")) {
        const parts = trimmed.replace("spotify:", "").replace(/:/g, "/");
        return `https://open.spotify.com/embed/${parts}?utm_source=generator&theme=0`;
      }
    }

    if (platform === "apple") {
      if (trimmed.includes("embed.music.apple.com/")) {
        return trimmed;
      }
      if (trimmed.includes("music.apple.com/")) {
        return trimmed.replace("music.apple.com/", "embed.music.apple.com/");
      }
    }

    if (platform === "yt") {
      if (trimmed.includes("youtube.com/embed/")) {
        return trimmed;
      }
      const playlistMatch = trimmed.match(/[?&]list=([^#&?]+)/);
      if (playlistMatch && playlistMatch[1]) {
        return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistMatch[1]}&autoplay=1`;
      }
      const videoMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/)|music\.youtube\.com\/watch\?v=)([\w-]{11})/);
      if (videoMatch && videoMatch[1]) {
        return `https://www.youtube-nocookie.com/embed/${videoMatch[1]}?autoplay=1`;
      }
    }
  } catch (err) {
    console.error("URL parse error:", err);
  }

  return null;
}

export function FocusSoundMixer({
  activeSound,
  onSoundChange,
  ambientVolume = 0.4,
  onVolumeChange,
}: FocusSoundMixerProps) {
  const [tab, setTab] = useState<"ambient" | "spotify" | "apple" | "yt">("ambient");
  const [volume, setVolume] = useState(ambientVolume);

  // Spotify state
  const [spotifyUrl, setSpotifyUrl] = useState(SPOTIFY_PRESETS[0].url);
  const [spotifyInput, setSpotifyInput] = useState("");
  const [spotifyEmbed, setSpotifyEmbed] = useState<string | null>(
    convertToEmbedUrl(SPOTIFY_PRESETS[0].url, "spotify")
  );

  // Apple Music state
  const [appleUrl, setAppleUrl] = useState(APPLE_PRESETS[0].url);
  const [appleInput, setAppleInput] = useState("");
  const [appleEmbed, setAppleEmbed] = useState<string | null>(
    convertToEmbedUrl(APPLE_PRESETS[0].url, "apple")
  );

  // YouTube Music state
  const [ytUrl, setYtUrl] = useState(YOUTUBE_PRESETS[0].url);
  const [ytInput, setYtInput] = useState("");
  const [ytEmbed, setYtEmbed] = useState<string | null>(
    convertToEmbedUrl(YOUTUBE_PRESETS[0].url, "yt")
  );

  // Modal expand
  const [expanded, setExpanded] = useState(false);

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedTab = localStorage.getItem("north_focus_sound_tab");
      if (savedTab && ["ambient", "spotify", "apple", "yt"].includes(savedTab)) {
        setTab(savedTab as "ambient" | "spotify" | "apple" | "yt");
      }
      const savedSpotify = localStorage.getItem("north_focus_spotify_url");
      if (savedSpotify) {
        setSpotifyUrl(savedSpotify);
        setSpotifyEmbed(convertToEmbedUrl(savedSpotify, "spotify"));
      }
      const savedApple = localStorage.getItem("north_focus_apple_url");
      if (savedApple) {
        setAppleUrl(savedApple);
        setAppleEmbed(convertToEmbedUrl(savedApple, "apple"));
      }
      const savedYt = localStorage.getItem("north_focus_yt_url");
      if (savedYt) {
        setYtUrl(savedYt);
        setYtEmbed(convertToEmbedUrl(savedYt, "yt"));
      }
      const savedVol = localStorage.getItem("north_focus_ambient_vol");
      if (savedVol) {
        const v = parseFloat(savedVol);
        if (!isNaN(v)) {
          setVolume(v);
          onVolumeChange?.(v);
        }
      }
    } catch {}
  }, []);

  const handleTabChange = (nextTab: "ambient" | "spotify" | "apple" | "yt") => {
    setTab(nextTab);
    try {
      localStorage.setItem("north_focus_sound_tab", nextTab);
    } catch {}
  };

  const handleVolumeSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    onVolumeChange?.(val);
    try {
      localStorage.setItem("north_focus_ambient_vol", String(val));
    } catch {}
  };

  const handleConnectSpotify = (customUrl?: string) => {
    const target = (customUrl || spotifyInput).trim();
    if (!target) return;
    const embed = convertToEmbedUrl(target, "spotify");
    if (!embed) {
      toast.error("Geçerli bir Spotify linki girin (Örn: https://open.spotify.com/playlist/...)");
      return;
    }
    setSpotifyUrl(target);
    setSpotifyEmbed(embed);
    setSpotifyInput("");
    try {
      localStorage.setItem("north_focus_spotify_url", target);
    } catch {}
    toast.success("Spotify çalma listesi bağlandı!");
  };

  const handleConnectApple = (customUrl?: string) => {
    const target = (customUrl || appleInput).trim();
    if (!target) return;
    const embed = convertToEmbedUrl(target, "apple");
    if (!embed) {
      toast.error("Geçerli bir Apple Music linki girin (Örn: https://music.apple.com/us/playlist/...)");
      return;
    }
    setAppleUrl(target);
    setAppleEmbed(embed);
    setAppleInput("");
    try {
      localStorage.setItem("north_focus_apple_url", target);
    } catch {}
    toast.success("Apple Music listesi bağlandı!");
  };

  const handleConnectYt = (customUrl?: string) => {
    const target = (customUrl || ytInput).trim();
    if (!target) return;
    const embed = convertToEmbedUrl(target, "yt");
    if (!embed) {
      toast.error("Geçerli bir YouTube veya YouTube Music linki girin");
      return;
    }
    setYtUrl(target);
    setYtEmbed(embed);
    setYtInput("");
    try {
      localStorage.setItem("north_focus_yt_url", target);
    } catch {}
    toast.success("YouTube Music yayını bağlandı!");
  };

  return (
    <div className="flex-1 rounded-2xl border bg-card p-3 shadow-xs flex flex-col min-h-0">
      {/* Top Header & Tab switcher */}
      <div className="flex items-center justify-between border-b pb-2 shrink-0 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="grid size-6 place-items-center rounded-lg bg-teal-500/10 text-teal-500 shrink-0">
            {activeSound === "none" && tab === "ambient" ? (
              <VolumeX className="size-3.5" />
            ) : (
              <Volume2 className="size-3.5" />
            )}
          </span>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-foreground truncate">Ses &amp; Müzik Mikseri</h2>
            <p className="text-[10px] text-muted-foreground truncate">Ortam sesi veya müzik akışı</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {activeSound !== "none" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-teal-600 dark:text-teal-400">
              <span className="size-1.5 rounded-full bg-teal-500 animate-pulse" />
              Ortam Açık
            </span>
          )}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
            title={expanded ? "Küçült" : "Genişlet"}
          >
            <Maximize2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Platform Switcher Tabs */}
      <div className="mt-2 grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-muted/60 border text-[11px] font-medium shrink-0">
        <button
          type="button"
          onClick={() => handleTabChange("ambient")}
          className={`flex items-center justify-center gap-1 py-1 rounded-lg transition-all ${
            tab === "ambient"
              ? "bg-background text-foreground shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Ortam Sesleri"
        >
          <Headphones className="size-3" />
          <span className="truncate">Ortam</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("spotify")}
          className={`flex items-center justify-center gap-1 py-1 rounded-lg transition-all ${
            tab === "spotify"
              ? "bg-[#1DB954]/15 text-[#1DB954] shadow-xs font-semibold border border-[#1DB954]/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Spotify"
        >
          <svg className="size-3 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <span className="truncate">Spotify</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("apple")}
          className={`flex items-center justify-center gap-1 py-1 rounded-lg transition-all ${
            tab === "apple"
              ? "bg-[#FA243C]/15 text-[#FA243C] shadow-xs font-semibold border border-[#FA243C]/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Apple Music"
        >
          <Music2 className="size-3 text-[#FA243C]" />
          <span className="truncate">Apple</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("yt")}
          className={`flex items-center justify-center gap-1 py-1 rounded-lg transition-all ${
            tab === "yt"
              ? "bg-[#FF0000]/15 text-[#FF0000] shadow-xs font-semibold border border-[#FF0000]/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="YouTube Music"
        >
          <svg className="size-3 fill-current text-[#FF0000] shrink-0" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          <span className="truncate">YT Music</span>
        </button>
      </div>

      {/* TAB 1: PROCEDURAL AMBIENT SOUNDS */}
      {tab === "ambient" && (
        <div className="mt-2 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-2 pr-0.5 focus-scrollbar">
          {/* Sound buttons */}
          <div className="grid grid-cols-2 gap-1.5 content-start">
            {([
              ["none", "Kapalı", "Sessiz ortam"],
              ["rain", "🌧️ Yağmur", "Hafif yağmur akışı"],
              ["cafe", "☕ Kafe & Fısıltı", "Fısıltı & bardak tıkırtısı"],
              ["noise", "📻 Berrak Beyaz", "Arıtılmış pürüzsüz ses"],
              ["drone", "🧘 432Hz Zen", "Derin alfa dalgası"],
            ] as const).map(([val, label, sub]) => (
              <button
                key={val}
                type="button"
                onClick={() => onSoundChange(val)}
                className={`flex flex-col items-start rounded-xl border p-2 text-left transition-all ${
                  activeSound === val
                    ? "border-teal-500/50 bg-teal-500/10 text-foreground shadow-xs"
                    : "border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <span className="text-xs font-semibold truncate w-full">{label}</span>
                <span className="text-[9px] opacity-75 truncate w-full">{sub}</span>
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          {activeSound !== "none" && (
            <div className="rounded-xl border bg-muted/30 p-2 space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Sliders className="size-3" />
                  Ortam Ses Seviyesi
                </span>
                <span className="font-mono font-semibold text-foreground">
                  %{Math.round(volume * 100)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeSlide}
                className="w-full accent-teal-500 cursor-pointer h-1.5 bg-muted-foreground/20 rounded-lg"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SPOTIFY */}
      {tab === "spotify" && (
        <div className="mt-2 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-2 pr-0.5 focus-scrollbar">
          {/* Quick preset selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block px-0.5">
              Hazır Odak Listeleri
            </span>
            <div className="grid grid-cols-2 gap-1">
              {SPOTIFY_PRESETS.map((p) => {
                const isSelected = spotifyUrl === p.url;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleConnectSpotify(p.url)}
                    className={`rounded-lg border p-1.5 text-left text-[11px] transition-all flex flex-col ${
                      isSelected
                        ? "border-[#1DB954] bg-[#1DB954]/10 text-foreground font-semibold"
                        : "border-border/60 bg-background/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="truncate w-full">{p.title}</span>
                    <span className="text-[9px] opacity-70 truncate w-full">{p.subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Link Input */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-semibold text-muted-foreground block px-0.5">
              Veya Kendi Spotify Listeni Bağla
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={spotifyInput}
                onChange={(e) => setSpotifyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnectSpotify()}
                placeholder="https://open.spotify.com/playlist/..."
                className="flex-1 rounded-lg border bg-background/80 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[#1DB954]"
              />
              <Button
                size="sm"
                onClick={() => handleConnectSpotify()}
                className="h-7 px-2 text-xs bg-[#1DB954] text-black hover:bg-[#1ed760] font-semibold"
              >
                Bağla
              </Button>
            </div>
          </div>

          {/* Embed Player */}
          {spotifyEmbed ? (
            <div className="pt-1">
              <iframe
                src={spotifyEmbed}
                width="100%"
                height="152"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-xl border border-border/80 shadow-xs bg-black"
                title="Spotify Odak Çalar"
              />
              <div className="flex items-center justify-between pt-1 px-1 text-[10px]">
                <span className="text-muted-foreground">Spotify Web Çalar</span>
                <a
                  href={spotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#1DB954] hover:underline font-medium"
                >
                  Uygulamada Aç <ExternalLink className="size-2.5" />
                </a>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 3: APPLE MUSIC */}
      {tab === "apple" && (
        <div className="mt-2 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-2 pr-0.5 focus-scrollbar">
          {/* Quick preset selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block px-0.5">
              Hazır Odak Listeleri
            </span>
            <div className="grid grid-cols-1 gap-1">
              {APPLE_PRESETS.map((p) => {
                const isSelected = appleUrl === p.url;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleConnectApple(p.url)}
                    className={`rounded-lg border p-1.5 text-left text-[11px] transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-[#FA243C] bg-[#FA243C]/10 text-foreground font-semibold"
                        : "border-border/60 bg-background/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="truncate block font-semibold">{p.title}</span>
                      <span className="text-[9px] opacity-70 truncate block">{p.subtitle}</span>
                    </div>
                    <Play className="size-3 text-[#FA243C] shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Apple Music Link Input */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-semibold text-muted-foreground block px-0.5">
              Veya Apple Music Listeni Bağla
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={appleInput}
                onChange={(e) => setAppleInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnectApple()}
                placeholder="https://music.apple.com/us/playlist/..."
                className="flex-1 rounded-lg border bg-background/80 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[#FA243C]"
              />
              <Button
                size="sm"
                onClick={() => handleConnectApple()}
                className="h-7 px-2 text-xs bg-[#FA243C] text-white hover:bg-[#d91930] font-semibold"
              >
                Bağla
              </Button>
            </div>
          </div>

          {/* Embed Player */}
          {appleEmbed ? (
            <div className="pt-1">
              <iframe
                src={appleEmbed}
                width="100%"
                height="150"
                allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
                className="rounded-xl border border-border/80 shadow-xs bg-black"
                title="Apple Music Odak Çalar"
              />
              <div className="flex items-center justify-between pt-1 px-1 text-[10px]">
                <span className="text-muted-foreground">Apple Music Çalar</span>
                <a
                  href={appleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#FA243C] hover:underline font-medium"
                >
                  Apple Music'te Aç <ExternalLink className="size-2.5" />
                </a>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 4: YOUTUBE MUSIC / LOFI */}
      {tab === "yt" && (
        <div className="mt-2 flex-1 flex flex-col min-h-0 overflow-y-auto space-y-2 pr-0.5 focus-scrollbar">
          {/* Quick preset selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block px-0.5">
              Canlı Odak Yayınları &amp; Listeler
            </span>
            <div className="grid grid-cols-2 gap-1">
              {YOUTUBE_PRESETS.map((p) => {
                const isSelected = ytUrl === p.url;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleConnectYt(p.url)}
                    className={`rounded-lg border p-1.5 text-left text-[11px] transition-all flex flex-col ${
                      isSelected
                        ? "border-[#FF0000] bg-[#FF0000]/10 text-foreground font-semibold"
                        : "border-border/60 bg-background/80 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="truncate w-full">{p.title}</span>
                    <span className="text-[9px] opacity-70 truncate w-full">{p.subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom YouTube Link Input */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-semibold text-muted-foreground block px-0.5">
              Veya YouTube / YT Music Linki Bağla
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="url"
                value={ytInput}
                onChange={(e) => setYtInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnectYt()}
                placeholder="https://youtube.com/watch?v=... veya liste"
                className="flex-1 rounded-lg border bg-background/80 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-[#FF0000]"
              />
              <Button
                size="sm"
                onClick={() => handleConnectYt()}
                className="h-7 px-2 text-xs bg-[#FF0000] text-white hover:bg-[#cc0000] font-semibold"
              >
                Bağla
              </Button>
            </div>
          </div>

          {/* Embed Player */}
          {ytEmbed ? (
            <div className="pt-1">
              <iframe
                src={ytEmbed}
                width="100%"
                height="150"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-xl border border-border/80 shadow-xs bg-black"
                title="YouTube Odak Çalar"
              />
              <div className="flex items-center justify-between pt-1 px-1 text-[10px]">
                <span className="text-muted-foreground">YouTube Music Çalar</span>
                <a
                  href={ytUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#FF0000] hover:underline font-medium"
                >
                  YouTube'da Aç <ExternalLink className="size-2.5" />
                </a>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* EXPANDED MODAL VIEW (IF USER CLICKS MAXIMIZE) */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl border bg-card p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-teal-500/10 text-teal-500">
                  <Volume2 className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Genişletilmiş Ses &amp; Müzik Mikseri</h3>
                  <p className="text-xs text-muted-foreground">Spotify, Apple Music, YT Music ve Ortam Sesleri</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Active Platform View */}
            <div>
              {tab === "spotify" && spotifyEmbed && (
                <iframe
                  src={spotifyEmbed.replace("height=152", "height=352")}
                  width="100%"
                  height="352"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  className="rounded-2xl border bg-black shadow-lg"
                  title="Genişletilmiş Spotify"
                />
              )}
              {tab === "apple" && appleEmbed && (
                <iframe
                  src={appleEmbed}
                  width="100%"
                  height="350"
                  allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                  className="rounded-2xl border bg-black shadow-lg"
                  title="Genişletilmiş Apple Music"
                />
              )}
              {tab === "yt" && ytEmbed && (
                <iframe
                  src={ytEmbed}
                  width="100%"
                  height="300"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-2xl border bg-black shadow-lg"
                  title="Genişletilmiş YouTube"
                />
              )}
              {tab === "ambient" && (
                <div className="p-6 text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Şu anda <strong>{activeSound === "none" ? "Sessiz Ortam" : activeSound}</strong> ortam sesi devrede.
                  </p>
                  <div className="max-w-xs mx-auto space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Ses Seviyesi</span>
                      <span className="font-mono font-bold">%{Math.round(volume * 100)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeSlide}
                      className="w-full accent-teal-500 cursor-pointer h-2 bg-muted rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setExpanded(false)} className="rounded-xl">
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
