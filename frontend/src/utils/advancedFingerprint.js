// Advanced Device Fingerprinting
// Combines multiple techniques to create a unique device identifier

export async function generateAdvancedFingerprint() {
  const components = [];

  // 1. Canvas Fingerprint
  components.push(await getCanvasFingerprint());

  // 2. WebGL Fingerprint
  components.push(await getWebGLFingerprint());

  // 3. Audio Fingerprint
  components.push(await getAudioFingerprint());

  // 4. Screen and Hardware Info
  components.push(getScreenFingerprint());
  components.push(getHardwareFingerprint());

  // 5. Browser Properties
  components.push(getBrowserFingerprint());

  // 6. Timezone and Language
  components.push(getTimezoneFingerprint());

  // Combine all components
  const combined = components.join('|||');
  
  // Generate SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// Canvas Fingerprinting
function getCanvasFingerprint() {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 280;
      canvas.height = 60;
      
      // Draw text with different properties
      ctx.textBaseline = 'top';
      ctx.font = '14px "Arial"';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      
      ctx.fillStyle = '#069';
      ctx.font = '11pt "Times New Roman"';
      
      // Include special characters
      const text = 'Cwm fjordbank glyphs vext quiz, 😃';
      ctx.fillText(text, 2, 15);
      
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.font = 'bold 18px "Courier New"';
      ctx.fillText(text, 4, 45);
      
      // Get canvas data
      const canvasData = canvas.toDataURL();
      resolve(canvasData);
    } catch (e) {
      resolve('canvas-error');
    }
  });
}

// WebGL Fingerprinting
function getWebGLFingerprint() {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        resolve('webgl-not-supported');
        return;
      }
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
      
      const webglData = {
        vendor,
        renderer,
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS).toString(),
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
      };
      
      resolve(JSON.stringify(webglData));
    } catch (e) {
      resolve('webgl-error');
    }
  });
}

// Audio Fingerprinting
function getAudioFingerprint() {
  return new Promise((resolve) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        resolve('audio-not-supported');
        return;
      }
      
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
      
      gainNode.gain.value = 0; // Mute
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);
      
      scriptProcessor.onaudioprocess = function(event) {
        const output = event.outputBuffer.getChannelData(0);
        const fingerprint = Array.from(output.slice(0, 30)).reduce((acc, val) => acc + Math.abs(val), 0);
        
        oscillator.disconnect();
        scriptProcessor.disconnect();
        gainNode.disconnect();
        context.close();
        
        resolve(fingerprint.toString());
      };
      
      oscillator.start(0);
      
      // Timeout fallback
      setTimeout(() => {
        resolve('audio-timeout');
      }, 1000);
    } catch (e) {
      resolve('audio-error');
    }
  });
}

// Screen Fingerprint
function getScreenFingerprint() {
  return JSON.stringify({
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientation: screen.orientation ? screen.orientation.type : 'unknown'
  });
}

// Hardware Fingerprint
function getHardwareFingerprint() {
  return JSON.stringify({
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    deviceMemory: navigator.deviceMemory || 'unknown',
    maxTouchPoints: navigator.maxTouchPoints || 0,
    platform: navigator.platform || 'unknown'
  });
}

// Browser Fingerprint
function getBrowserFingerprint() {
  return JSON.stringify({
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages ? navigator.languages.join(',') : '',
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || 'unknown',
    plugins: Array.from(navigator.plugins || []).map(p => p.name).join(',')
  });
}

// Timezone Fingerprint
function getTimezoneFingerprint() {
  return JSON.stringify({
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    locale: Intl.DateTimeFormat().resolvedOptions().locale
  });
}
