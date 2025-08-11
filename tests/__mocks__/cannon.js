// Mock for Cannon-ES
export class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
  setZero() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
  }
  copy(vec) {
    this.x = vec.x;
    this.y = vec.y;
    this.z = vec.z;
    return this;
  }
}

export class Body {
  static STATIC = 0;
  constructor(options = {}) {
    this.mass = options.mass || 1;
    this.position = new Vec3();
    this.velocity = new Vec3();
    this.angularVelocity = new Vec3();
    this.quaternion = { 
      set: () => {}, 
      copy: () => {},
      toEuler: (euler) => {
        euler.x = 0;
        euler.y = 0;
        euler.z = 0;
      }
    };
    this.allowSleep = true;
    this.listeners = {};
  }
  addEventListener(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  applyImpulse() {}
  wakeUp() {}
}

export class Box {
  constructor(vec) {
    this.halfExtents = vec;
  }
}

export class Plane {
  constructor() {}
}

export class World {
  constructor(options = {}) {
    this.gravity = options.gravity || new Vec3(0, -9.82, 0);
    this.bodies = [];
    this.defaultContactMaterial = { restitution: 0.3 };
  }
  addBody(body) {
    this.bodies.push(body);
  }
  removeBody(body) {
    const index = this.bodies.indexOf(body);
    if (index > -1) this.bodies.splice(index, 1);
  }
  fixedStep() {}
}

export default {
  Vec3,
  Body,
  Box,
  Plane,
  World
};