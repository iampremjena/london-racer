export class AudioController {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.gainNode = null;
    this.skidOsc = null;
    this.isInitialized = false;

    // Initialize audio context on first user keypress or click
    const initAudio = () => {
      if (this.isInitialized) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Engine Sound Synthesizer (Sawtooth wave for combustion engine RPM)
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

      // Low pass filter to soften engine raw tone
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(400, this.ctx.currentTime);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.15, this.ctx.currentTime);

      this.engineOsc.connect(this.filter);
      this.filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.engineOsc.start();

      this.isInitialized = true;
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('click', initAudio);
    };

    window.addEventListener('keydown', initAudio);
    window.addEventListener('click', initAudio);
  }

  update(speed, isBraking) {
    if (!this.isInitialized || !this.ctx) return;

    // Pitch engine based on car speed
    const normalizedSpeed = Math.abs(speed);
    const targetFreq = 50 + normalizedSpeed * 350;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);

    // Boost engine volume when accelerating
    const targetGain = 0.08 + normalizedSpeed * 0.2;
    this.gainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
  }
}
