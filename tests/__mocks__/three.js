// Mock for Three.js
export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  copy() { return this; }
  set(x, y, z) { 
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
}

export class Scene {
  constructor() {
    this.children = [];
  }
  add(obj) { this.children.push(obj); }
  remove(obj) { 
    const index = this.children.indexOf(obj);
    if (index > -1) this.children.splice(index, 1);
  }
}

export class Group {
  constructor() {
    this.children = [];
    this.userData = {};
  }
  add(obj) { this.children.push(obj); }
  clone() { return new Group(); }
}

export class Mesh extends Group {
  constructor() {
    super();
    this.position = new Vector3();
    this.quaternion = { copy: () => {} };
  }
}

export class Sprite {
  constructor() {
    this.visible = false;
    this.position = new Vector3();
    this.scale = { set: () => {} };
    this.lookAt = () => {};
    this.raycast = () => {};
  }
}

export class WebGLRenderer {
  setSize() {}
  render() {}
  setPixelRatio() {}
}

export class PerspectiveCamera {
  constructor() {
    this.position = new Vector3();
  }
  updateProjectionMatrix() {}
}

export class Raycaster {
  setFromCamera() {}
  intersectObjects() { return []; }
}

export const BufferGeometryUtils = {
  mergeVertices: (geometry) => geometry,
  mergeBufferGeometries: (geometries) => geometries[0] || {}
};

export default {
  Vector3,
  Scene,
  Group,
  Mesh,
  Sprite,
  WebGLRenderer,
  PerspectiveCamera,
  Raycaster
};