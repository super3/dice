// Setup file for Jest tests

global.document = {
  querySelector: jest.fn(() => ({
    addEventListener: jest.fn(),
    getContext: jest.fn(() => ({
      font: '',
      textAlign: '',
      textBaseline: '',
      fillText: jest.fn()
    })),
    getBoundingClientRect: jest.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600
    }))
  })),
  createElement: jest.fn(() => ({
    width: 128,
    height: 128,
    getContext: jest.fn(() => ({
      font: '',
      textAlign: '',
      textBaseline: '',
      fillText: jest.fn()
    }))
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

global.window = {
  addEventListener: jest.fn(),
  innerWidth: 800,
  innerHeight: 600,
  devicePixelRatio: 1
};

// Mock Canvas
global.HTMLCanvasElement = jest.fn();
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  font: '',
  textAlign: '',
  textBaseline: '',
  fillText: jest.fn()
}));