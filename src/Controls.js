export class Controls {
  constructor() {
    this.keys = { forward: false, backward: false, left: false, right: false, brake: false };
    
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
  }

  onKey(event, isPressed) {
    switch (event.code) {
      case 'KeyW': case 'ArrowUp': this.keys.forward = isPressed; break;
      case 'KeyS': case 'ArrowDown': this.keys.backward = isPressed; break;
      case 'KeyA': case 'ArrowLeft': this.keys.left = isPressed; break;
      case 'KeyD': case 'ArrowRight': this.keys.right = isPressed; break;
      case 'Space': this.keys.brake = isPressed; break;
    }
  }
}
