/**
 * Mobile Debugger - Shows logs directly on screen for iPhone debugging
 */

class MobileDebugger {
  constructor() {
    this.logs = [];
    this.isVisible = false;
    this.container = null;
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Auto-enable for iOS
    if (this.isIOS) {
      this.init();
    }
  }
  
  init() {
    // Create debug container
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: #00ff00;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      max-height: 200px;
      overflow-y: auto;
      display: none;
    `;
    
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '🐛';
    toggleBtn.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      background: #ff6b6b;
      border: none;
      border-radius: 50%;
      font-size: 20px;
      z-index: 10000;
      cursor: pointer;
    `;
    
    toggleBtn.onclick = () => this.toggle();
    
    document.body.appendChild(this.container);
    document.body.appendChild(toggleBtn);
    
    // Capture console errors
    this.captureConsole();
    
    this.log('🐛 Mobile Debugger initialized for iOS');
  }
  
  captureConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      this.log('LOG:', ...args);
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      this.log('❌ ERROR:', ...args);
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      this.log('⚠️ WARN:', ...args);
      originalWarn.apply(console, args);
    };
    
    // Capture uncaught errors
    window.addEventListener('error', (event) => {
      this.log(`❌ UNCAUGHT ERROR: ${event.message} at ${event.filename}:${event.lineno}`);
    });
    
    // Capture promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.log(`❌ UNHANDLED PROMISE: ${event.reason}`);
    });
  }
  
  log(...args) {
    const timestamp = new Date().toLocaleTimeString();
    
    // Convert all arguments to strings and handle objects
    const processedArgs = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Object: ' + Object.prototype.toString.call(arg) + ']';
        }
      }
      return String(arg);
    });
    
    const logEntry = `[${timestamp}] ${processedArgs.join(' ')}`;
    
    this.logs.push(logEntry);
    
    // Keep only last 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(-50);
    }
    
    this.updateDisplay();
  }
  
  updateDisplay() {
    if (this.container) {
      this.container.innerHTML = this.logs.join('<br>');
      this.container.scrollTop = this.container.scrollHeight;
    }
  }
  
  toggle() {
    this.isVisible = !this.isVisible;
    this.container.style.display = this.isVisible ? 'block' : 'none';
  }
  
  clear() {
    this.logs = [];
    this.updateDisplay();
  }
}

// Create global instance
const mobileDebugger = new MobileDebugger();

export default mobileDebugger;
