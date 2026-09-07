// Web Audio API procedural sound generator - 100% offline, zero external dependencies

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: "none" | "rain" | "noise" | "cafe" | "drone" = "none";
  private gainNode: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime, 0.05);
    }
  }

  public stop() {
    this.currentType = "none";
    this.activeNodes.forEach(node => {
      if (typeof node === "number") {
        window.clearInterval(node);
      } else {
        try {
          (node as AudioScheduledSourceNode).stop?.();
          node.disconnect();
        } catch {}
      }
    });
    this.activeNodes = [];
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }
  }

  public play(type: "rain" | "noise" | "cafe" | "drone", volume = 0.4) {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.gainNode.connect(this.ctx.destination);
    this.currentType = type;

    if (type === "noise") {
      this.createPinkNoise();
    } else if (type === "rain") {
      this.createRain();
    } else if (type === "drone") {
      this.createBinauralDrone();
    } else if (type === "cafe") {
      this.createCafeAtmosphere();
    }
  }

  private createPinkNoise() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
      b6 = white * 0.115926;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.gainNode);
    noise.start();

    this.activeNodes.push(noise, filter);
  }

  private createRain() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(800, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(0.7, this.ctx.currentTime);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(2200, this.ctx.currentTime);

    source.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(this.gainNode);
    source.start();

    this.activeNodes.push(source, bandpass, lowpass);
  }

  private createBinauralDrone() {
    if (!this.ctx || !this.gainNode) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(136.1, this.ctx.currentTime);
    osc2.frequency.setValueAtTime(140.1, this.ctx.currentTime);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    osc1.connect(subGain);
    osc2.connect(subGain);
    subGain.connect(this.gainNode);

    osc1.start();
    osc2.start();

    this.activeNodes.push(osc1, osc2, subGain);
  }

  private createCafeAtmosphere() {
    if (!this.ctx || !this.gainNode) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(650, this.ctx.currentTime);

    source.connect(filter);
    filter.connect(this.gainNode);
    source.start();

    this.activeNodes.push(source, filter);
  }

  public getCurrent() {
    return this.currentType;
  }
}

export const ambientSound = typeof window !== "undefined" ? new AmbientSoundEngine() : null;
