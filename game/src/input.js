// Gobble's Great Escape — keyboard and mouse input, in one place.
// The game reads this object; it never touches key events anywhere else.

export class InputState {
  constructor(canvas) {
    this.keysDown = new Set();
    this.justPressed = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseClicked = false;
    this.mouseJustClicked = false;
    this.canvas = canvas;

    window.addEventListener('keydown', (event) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.justPressed.add(event.code);
      this.keysDown.add(event.code);
    });
    window.addEventListener('keyup', (event) => {
      this.keysDown.delete(event.code);
    });
    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
      this.mouseClicked = true;
      this.mouseJustClicked = true;
    });
    window.addEventListener('mouseup', () => {
      this.mouseClicked = false;
    });
    canvas.addEventListener('touchstart', (event) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      this.mouseX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
      this.mouseY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
      this.mouseClicked = true;
      this.mouseJustClicked = true;
    }, { passive: false });
  }

  get jumpPressed() {
    return this.wasPressed('Space') || this.wasPressed('ArrowUp') || this.wasPressed('KeyW');
  }

  get slideHeld() {
    return this.keysDown.has('ArrowDown') || this.keysDown.has('KeyS');
  }

  get sprintHeld() {
    return this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight')
      || this.keysDown.has('ArrowRight') || this.keysDown.has('KeyD');
  }

  get hidePressed() {
    return this.wasPressed('KeyH');
  }

  get startPressed() {
    return this.jumpPressed || this.mouseJustClicked;
  }

  get restartPressed() {
    return this.wasPressed('KeyR') || this.mouseJustClicked;
  }

  get pausePressed() {
    return this.wasPressed('KeyP') || this.wasPressed('Escape');
  }

  get mutePressed() {
    return this.wasPressed('KeyM');
  }

  wasPressed(code) {
    return this.justPressed.has(code);
  }

  clickedInside(x, y, width, height) {
    return this.mouseJustClicked
      && this.mouseX >= x && this.mouseX <= x + width
      && this.mouseY >= y && this.mouseY <= y + height;
  }

  endFrame() {
    this.justPressed.clear();
    this.mouseJustClicked = false;
  }
}
