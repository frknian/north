// Picture-in-Picture (PiP) Floating Mini Timer using HTML5 Canvas & Video captureStream

export class PipTimerController {
  private canvas: HTMLCanvasElement | null = null;
  private video: HTMLVideoElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private active = false;

  public isSupported(): boolean {
    if (typeof document === "undefined") return false;
    return Boolean(
      "pictureInPictureEnabled" in document &&
      document.pictureInPictureEnabled &&
      HTMLCanvasElement.prototype.captureStream
    );
  }

  public async start(title: string, initialTimeStr: string, areaName = "North Odak"): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      this.canvas = document.createElement("canvas");
      this.canvas.width = 360;
      this.canvas.height = 200;
      this.ctx = this.canvas.getContext("2d");

      this.video = document.createElement("video");
      this.video.muted = true;
      this.video.playsInline = true;

      this.draw(title, initialTimeStr, areaName, false);

      const stream = this.canvas.captureStream(15);
      this.video.srcObject = stream;
      await this.video.play();
      await this.video.requestPictureInPicture();
      this.active = true;

      this.video.addEventListener("leavepictureinpicture", () => {
        this.active = false;
        this.cleanup();
      });

      return true;
    } catch (err) {
      console.warn("Could not start Picture-in-Picture timer", err);
      this.cleanup();
      return false;
    }
  }

  public update(title: string, timeStr: string, areaName = "North Odak", isPaused = false) {
    if (!this.active || !this.ctx || !this.canvas) return;
    this.draw(title, timeStr, areaName, isPaused);
  }

  private draw(title: string, timeStr: string, areaName: string, isPaused: boolean) {
    if (!this.ctx || !this.canvas) return;
    const { width, height } = this.canvas;

    // Background
    this.ctx.fillStyle = "#0c0d0e";
    this.ctx.fillRect(0, 0, width, height);

    // Subtle top border accent
    const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, "#38bdf8");
    gradient.addColorStop(0.5, "#818cf8");
    gradient.addColorStop(1, "#34d399");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, 4);

    // Area / Badge
    this.ctx.fillStyle = "#94a3b8";
    this.ctx.font = "600 13px system-ui, -apple-system, sans-serif";
    this.ctx.fillText(areaName.toLocaleUpperCase("tr-TR"), 24, 38);

    // Pause status indicator
    if (isPaused) {
      this.ctx.fillStyle = "#fbbf24";
      this.ctx.font = "bold 12px system-ui, sans-serif";
      this.ctx.fillText("⏸ DURAKLATILDI", width - 130, 38);
    }

    // Main Timer
    this.ctx.fillStyle = isPaused ? "#94a3b8" : "#ffffff";
    this.ctx.font = "bold 58px system-ui, -apple-system, monospace";
    this.ctx.fillText(timeStr, 22, 108);

    // Task Title
    this.ctx.fillStyle = "#cbd5e1";
    this.ctx.font = "500 15px system-ui, -apple-system, sans-serif";
    const truncatedTitle = title.length > 34 ? title.slice(0, 33) + "…" : title;
    this.ctx.fillText(truncatedTitle, 24, 150);

    // Subtext
    this.ctx.fillStyle = "#64748b";
    this.ctx.font = "12px system-ui, -apple-system, sans-serif";
    this.ctx.fillText("North Odak Modu", 24, 178);
  }

  public async close() {
    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
      } catch {}
    }
    this.cleanup();
  }

  private cleanup() {
    this.active = false;
    if (this.video) {
      this.video.srcObject = null;
      this.video.remove();
      this.video = null;
    }
    this.canvas = null;
    this.ctx = null;
  }

  public isActive(): boolean {
    return this.active;
  }
}
