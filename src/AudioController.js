export class AudioController {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.gainNode = null;
    this.isInitialized = false;

    const initAudio = () => {
      if (this.isInitialized) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = "sawtooth";
      this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.setValueAtTime(400, this.ctx.currentTime);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.engineOsc.connect(this.filter);
      this.filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.engineOsc.start();

      this.isInitialized = true;
      window.removeEventListener("keydown", initAudio);
      window.removeEventListener("click", initAudio);
    };

    window.addEventListener("keydown", initAudio);
    window.addEventListener("click", initAudio);
  }

  update(speed) {
    if (!this.isInitialized || !this.ctx) return;
    const normalizedSpeed = Math.abs(speed);
    const targetFreq = 50 + normalizedSpeed * 300;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }
}