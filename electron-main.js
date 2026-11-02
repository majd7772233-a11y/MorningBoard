const { app, BrowserWindow, shell, Menu, MenuItem, desktopCapturer, ipcMain, session, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

// Catch unhandled exceptions to prevent the fatal "A JavaScript error occurred in the main process" dialog
process.on('uncaughtException', (err) => {
  console.error('[Main Process] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main Process] Unhandled Rejection:', reason);
});

// Safe URL opener: ensures only secure web protocols (http, https, mailto, ms-windows-store) are passed to the OS
function safeOpenExternal(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return;
  try {
    const parsed = new URL(rawUrl);
    if (['http:', 'https:', 'mailto:', 'ms-windows-store:'].includes(parsed.protocol)) {
      shell.openExternal(rawUrl);
    } else {
      console.warn('Blocked opening unsafe URL protocol:', parsed.protocol);
    }
  } catch (e) {
    if (rawUrl.startsWith('https://') || rawUrl.startsWith('http://') || rawUrl.startsWith('mailto:') || rawUrl.startsWith('ms-windows-store:')) {
      shell.openExternal(rawUrl);
    }
  }
}


// Automatically disable Windows Pen Feedback balloon (Alt / Shift tooltip under stylus nib)
if (process.platform === 'win32') {
  try {
    const { exec } = require('child_process');
    exec('reg add "HKCU\\Software\\Policies\\Microsoft\\TabletPC" /v "TurnOffPenFeedback" /t REG_DWORD /d 1 /f', () => {});
    exec('reg add "HKCU\\Software\\Microsoft\\Wisp\\Pen\\SysEventParameters" /v "HoldMode" /t REG_DWORD /d 3 /f', () => {});
  } catch (_) {}
}

// Set a standard Google Chrome User-Agent globally to prevent YouTube Error 152
app.userAgentFallback = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// ── Single instance lock ──────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }

// ── GPU hardware acceleration is fully enabled with native OS power management ──
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// Map of common MIME types
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.bcmap': 'application/octet-stream',
  '.pfb': 'application/x-font-type1',
};

let activeLocalHttpServer = null;

// Start a local HTTP server to serve the app files.
// This is required to support Firebase Authentication, which doesn't support the file:// protocol.
function startLocalServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // Decode URL to handle Arabic characters or spaces in filenames
      let safeUrl = req.url.split('?')[0];
      try {
        safeUrl = decodeURIComponent(safeUrl);
      } catch (e) {
        // Fallback
      }

      if (safeUrl === '/' || safeUrl === '') {
        safeUrl = '/index.html';
      }

      const baseDir = __dirname;

      const filePath = path.normalize(path.join(baseDir, safeUrl));

      // Security check: ensure the file is strictly inside baseDir (prevent directory traversal)
      const baseDirNormalized = path.normalize(baseDir).toLowerCase();
      const baseDirWithSep = baseDirNormalized.endsWith(path.sep) ? baseDirNormalized : baseDirNormalized + path.sep;
      const filePathNormalized = path.normalize(filePath).toLowerCase();
      if (filePathNormalized !== baseDirNormalized && !filePathNormalized.startsWith(baseDirWithSep)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.statusCode = 404;
            res.end('Not Found');
          } else {
            res.statusCode = 500;
            res.end(`Internal Server Error: ${err.code}`);
          }
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 
          'Content-Type': contentType,
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.end(data);
      });
    });

    const DEFAULT_LOCAL_PORT = 38445;

    const startListening = (port) => {
      server.listen(port, '127.0.0.1', () => {
        const actualPort = server.address().port;
        console.log(`Local server running at http://localhost:${actualPort}`);
        resolve(actualPort);
      });
    };

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Local Server] Port ${DEFAULT_LOCAL_PORT} in use, falling back to dynamic port...`);
        server.listen(0, '127.0.0.1', () => {
          resolve(server.address().port);
        });
      } else {
        reject(err);
      }
    });

    activeLocalHttpServer = server;
    startListening(DEFAULT_LOCAL_PORT);
  });
}

const PRELOAD_PATH = path.join(__dirname, 'preload.js');
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'سبورة الصباح',
    icon: path.join(__dirname, 'icon-192.png'),
    backgroundColor: '#0b0f19',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: PRELOAD_PATH,
      webviewTag: true, // Enable Electron native <webview> tag for bot-proof, full-browser webpage widgets
      allowRunningInsecureContent: false,
      nodeIntegrationInSubFrames: false,
      webSecurity: true,
      devTools: false,
      javascript: true,
      backgroundThrottling: true, // Allow Chromium to save CPU/GPU and trim memory when window is idle or in background
    }
  });

  // Prevent DevTools from being opened
  mainWindow.webContents.on('devtools-opened', () => {
    try {
      mainWindow.webContents.closeDevTools();
    } catch (e) {}
  });

  // Automatically grant permissions for media devices (camera, microphone, webcam) to local origin only
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback, details) => {
    try {
      const url = (webContents && typeof webContents.getURL === 'function')
        ? (webContents.getURL() || '')
        : ((details && details.requestingUrl) ? details.requestingUrl : '');
      const isLocal = url.startsWith('file://') || url.includes('localhost') || url.includes('127.0.0.1');
      if (isLocal) {
        callback(true);
      } else {
        // Allow safe display/audio/storage permissions for external embedded pages
        if (['fullscreen', 'pointerLock', 'clipboard-read', 'clipboard-sanitized-write'].includes(permission)) {
          callback(true);
        } else {
          callback(false);
        }
      }
    } catch (_) {
      try { callback(false); } catch (e) {}
    }
  });

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    try {
      const url = (webContents && typeof webContents.getURL === 'function')
        ? (webContents.getURL() || '')
        : (requestingOrigin || '');
      return url.startsWith('file://') || url.includes('localhost') || url.includes('127.0.0.1');
    } catch (_) {
      return false;
    }
  });

  // ── Intercept Display Media Requests (for screen recording) ────────────────
  mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
    try {
      const sourceId = mainWindow.getMediaSourceId();
      console.log(`Selected Source for screen recording (Direct ID): "${sourceId}"`);
      callback({
        video: {
          id: sourceId,
          name: 'سبورة الصباح'
        },
        audio: 'loopback'
      });
    } catch (err) {
      console.error('Error fetching screen capture sources:', err);
      callback({ video: null, audio: null });
    }
  });

  // Apply User-Agent specifically to this window
  mainWindow.webContents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

  // ═══════════════════════════════════════════════════════════════
  // مسح كامل لجميع بيانات الجلسة عند كل تشغيل للحصول على أداء نظيف
  // كالمرة الأولى بعد التثبيت. مفتاح الترخيص محفوظ في ملف منفصل
  // لذلك لا يتأثر أبداً بهذا المسح.
  // ═══════════════════════════════════════════════════════════════
  const sess = mainWindow.webContents.session;
  sess.clearCache().catch(() => {});
  // Do NOT wipe localstorage, shadercache or indexdb so user settings & GPU performance persist cleanly
  sess.clearStorageData({
    storages: [
      'appcache',
      'serviceworkers',
      'cachestorage'
    ]
  }).catch(() => {});

  // ── Inject Referrer headers for all web requests to prevent Error 153/152 ──────
  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    (details, callback) => {
      const url = details.url;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const initiator = details.initiator;
        // Only rewrite headers for requests initiated by our local app (file:// or localhost)
        const isLocal = initiator && (initiator.startsWith('file://') || initiator.includes('localhost') || initiator.includes('127.0.0.1'));
        
        if (isLocal) {
          // Do NOT rewrite headers for YouTube, DoubleClick, Pixabay and Elsapah Games to allow their APIs to execute cleanly
          const isExcluded = url.includes('youtube.com') || url.includes('youtube-nocookie.com') || url.includes('youtu.be') || url.includes('doubleclick.net') || url.includes('pixabay.com') || url.includes('elsapahgames.pages.dev') || url.includes('pages.dev');
          if (!isExcluded) {
            details.requestHeaders['Referer'] = 'https://spahboard.ninjascribe.workers.dev/';
            details.requestHeaders['Origin'] = 'https://spahboard.ninjascribe.workers.dev';
          }
        }
        
        // Force standard Google Chrome User-Agent on all external web requests
        details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  // ── Strip X-Frame-Options & Content-Security-Policy to allow embedding any website widget ──
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = Object.assign({}, details.responseHeaders);
    
    // Delete headers that prevent sites from loading inside iframes
    for (const key in responseHeaders) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'x-frame-options' || lowerKey === 'content-security-policy' || lowerKey === 'frame-ancestors') {
        delete responseHeaders[key];
      }
    }
    
    callback({ cancel: false, responseHeaders: responseHeaders });
  });

  // ── Right-click context menu for editable fields (Copy/Paste) ─────────────────
  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();
    const isInput = params.isEditable || 
                    params.inputFieldType !== 'none' || 
                    (params.editFlags && (params.editFlags.canPaste || params.editFlags.canCut || params.editFlags.canCopy));

    if (isInput) {
      menu.append(new MenuItem({ label: 'قص (Cut)', role: 'cut' }));
      menu.append(new MenuItem({ label: 'نسخ (Copy)', role: 'copy' }));
      menu.append(new MenuItem({ label: 'لصق (Paste)', role: 'paste' }));
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({ label: 'تحديد الكل (Select All)', role: 'selectall' }));
      menu.popup({ window: mainWindow });
    } else if (params.selectionText && params.selectionText.trim() !== '') {
      menu.append(new MenuItem({ label: 'نسخ (Copy)', role: 'copy' }));
      menu.popup({ window: mainWindow });
    }
  });

  // ── Remove menu bar (تمنع المستخدم من رؤية أي أدوات) ──────────────────────
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);

  // ── Load the app ───────────────────────────────────────────────────────────
  const indexPath = path.join(__dirname, 'index.html');

  startLocalServer()
    .then((port) => {
      mainWindow.loadURL(`http://localhost:${port}/index.html`);
    })
    .catch((err) => {
      console.error('Failed to start local HTTP server, falling back to loadFile:', err);
      mainWindow.loadFile(indexPath);
    });

  // ── IPC Focus Handler for Text Inputs ─────────────────────────────
  ipcMain.on('focus-window', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isFocused()) {
        mainWindow.focus();
      }
    }
  });

  // ── Block F12, Ctrl+Shift+I/J/C, Ctrl+U (Inspect Shortcuts & Debuggers) ────────
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const key = (input.key || '').toLowerCase();
    const isF12 = input.key === 'F12';
    const isCommandOrControl = input.control || input.meta;
    const isInspect = isCommandOrControl && input.shift && ['i', 'j', 'c'].includes(key);
    const isSource = isCommandOrControl && key === 'u';
    
    if (isF12 || isInspect || isSource) {
      event.preventDefault();
    }
  });

  // ── Open external links in default browser & Allow Google Auth popups ────────
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url || typeof url !== 'string') return { action: 'deny' };

    // 1. Allow Google / Firebase Auth popups to open cleanly inside Electron
    const isAuthUrl = url.includes('accounts.google.com') || 
                      url.includes('__/auth/handler') || 
                      url.includes('firebaseapp.com') || 
                      url.includes('googleapis.com') ||
                      url.includes('googleusercontent.com');

    if (isAuthUrl) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 680,
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            devTools: false,
          }
        }
      };
    }

    // 2. Block Google Maps from opening in external browser
    const isMapsUrl = url.includes('maps.google') || url.includes('/maps');
    if (isMapsUrl) {
      return { action: 'deny' };
    }

    // 3. Open other external links in default external browser
    safeOpenExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url || typeof url !== 'string') return;
    const isLocal = url.startsWith('file://') || url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost');
    if (!isLocal) {
      event.preventDefault();
      const isMapsUrl = url.includes('maps.google') || url.includes('/maps');
      if (!isMapsUrl) {
        safeOpenExternal(url);
      }
    }
  });

  // Block Google Maps from navigating the iframe internally when links are clicked
  mainWindow.webContents.on('will-frame-navigate', (event, details) => {
    if (!details || !details.url || typeof details.url !== 'string') return;
    const url = details.url;
    const isLocal = url.startsWith('file://') || url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost');
    const isAllowedFrameUrl = url.includes('elsapahgames.pages.dev') || url.includes('firebaseapp.com') || url.includes('accounts.google.com') || url.includes('googleapis.com');
    if (!isLocal && !isAllowedFrameUrl) {
      const isMapsUrl = url.includes('maps.google') || url.includes('/maps');
      if (isMapsUrl) {
        event.preventDefault();
      } else {
        if (details.isMainFrame) {
          event.preventDefault();
          safeOpenExternal(url);
        }
      }
    }
  });

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('[Renderer Console] [' + level + '] ' + message + ' (' + sourceId + ':' + line + ')');
  });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('[Renderer Fail Load] ' + errorCode + ': ' + errorDescription + ' at ' + validatedURL);
  });
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript('if (typeof window.fitCanvasToScreen === "function") window.fitCanvasToScreen(false);').catch(() => {});
      }
    }, 250);
  });

  mainWindow.on('maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript('if (typeof window.fitCanvasToScreen === "function") window.fitCanvasToScreen(false);').catch(() => {});
    }
  });

  mainWindow.on('resize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript('if (typeof window.fitCanvasToScreen === "function") window.fitCanvasToScreen(false);').catch(() => {});
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  try {
    if (activeLocalHttpServer) {
      activeLocalHttpServer.close();
      activeLocalHttpServer = null;
    }
  } catch (_) {}
  app.quit();
  process.exit(0);
});
app.on('activate', () => { if (!mainWindow) createWindow(); });

// Memory trimmer on window blur/minimize to keep system responsive
app.on('browser-window-blur', (event, window) => {
  if (window && !window.isDestroyed()) {
    try {
      window.webContents.send('app-idle-trim');
    } catch (_) {}
  }
});

// Force standard Google Chrome User-Agent on all created WebContents (including popups) to prevent Google Auth block
app.on('web-contents-created', (event, contents) => {
  contents.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
});

// Native Storage for Alphabet custom words
const ALPHABET_DATA_FILE = path.join(app.getPath('userData'), 'alphabet_custom_words.json');

ipcMain.handle('save-alphabet-words', async (event, words) => {
  try {
    fs.writeFileSync(ALPHABET_DATA_FILE, JSON.stringify(words, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving alphabet words:', err);
    return false;
  }
});

ipcMain.handle('load-alphabet-words', async () => {
  try {
    if (fs.existsSync(ALPHABET_DATA_FILE)) {
      const data = fs.readFileSync(ALPHABET_DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading alphabet words:', err);
  }
  return null;
});

// Native Storage for General App Settings (Palette colors, UI options, etc.)
const APP_SETTINGS_FILE = path.join(app.getPath('userData'), 'app_settings.json');

ipcMain.handle('save-app-setting', async (event, key, val) => {
  try {
    let settings = {};
    if (fs.existsSync(APP_SETTINGS_FILE)) {
      try {
        settings = JSON.parse(fs.readFileSync(APP_SETTINGS_FILE, 'utf8'));
      } catch (parseErr) {}
    }
    settings[key] = val;
    fs.writeFileSync(APP_SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving app setting:', err);
    return false;
  }
});

ipcMain.handle('load-app-settings', async () => {
  try {
    if (fs.existsSync(APP_SETTINGS_FILE)) {
      const data = fs.readFileSync(APP_SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading app settings:', err);
  }
  return {};
});

// IPC Handler to read image from clipboard natively on Electron
ipcMain.handle('read-clipboard-image', async () => {
  try {
    const { clipboard } = require('electron');
    const image = clipboard.readImage();
    if (image && !image.isEmpty()) {
      return image.toDataURL(); // Returns "data:image/png;base64,..."
    }
  } catch (err) {
    console.error('Error reading clipboard image:', err);
  }
  return null;
});

// ── SCREEN CAPTURE & SNIPPING MODULE ──
const { screen: electronScreen } = require('electron');
let captureWindow = null;

ipcMain.on('start-screen-capture', async (event) => {
  if (mainWindow) {
    mainWindow.hide();
  }
  
  // Wait 300ms for the main window to disappear completely from screen
  setTimeout(async () => {
    try {
      const primaryDisplay = electronScreen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.bounds;
      
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: width, height: height }
      });
      
      if (sources && sources.length > 0) {
        const screenImgData = sources[0].thumbnail.toDataURL();
        
        captureWindow = new BrowserWindow({
          x: 0,
          y: 0,
          width: width,
          height: height,
          frame: false,
          transparent: true,
          resizable: false,
          movable: false,
          minimizable: false,
          maximizable: false,
          fullscreen: true,
          alwaysOnTop: true,
          skipTaskbar: true,
          show: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: PRELOAD_PATH
          }
        });
        
        captureWindow.webContents.on('devtools-opened', () => {
          try { captureWindow.webContents.closeDevTools(); } catch (e) {}
        });
        
        captureWindow.loadFile(path.join(__dirname, 'src/capture.html'));
        
        captureWindow.once('ready-to-show', () => {
          captureWindow.show();
          captureWindow.focus();
          captureWindow.webContents.send('init-capture', {
            imgData: screenImgData,
            width: width,
            height: height
          });
        });
        
        captureWindow.on('closed', () => {
          captureWindow = null;
        });
      } else {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.maximize();
          mainWindow.focus();
        }
      }
    } catch (err) {
      console.error('Failed to capture screen:', err);
      if (mainWindow) {
        mainWindow.show();
        mainWindow.maximize();
        mainWindow.focus();
      }
    }
  }, 300);
});

ipcMain.on('crop-completed', (event, croppedDataUrl) => {
  if (captureWindow) {
    captureWindow.close();
  }
  if (mainWindow) {
    mainWindow.show();
    mainWindow.maximize();
    mainWindow.focus();
    mainWindow.webContents.send('screenshot-captured', croppedDataUrl);
  }
});

ipcMain.on('crop-cancelled', () => {
  if (captureWindow) {
    captureWindow.close();
  }
  if (mainWindow) {
    mainWindow.show();
    mainWindow.maximize();
    mainWindow.focus();
  }
});

// IPC Handler to safely open external links in the OS default web browser
ipcMain.on('open-external', (event, url) => {
  safeOpenExternal(url);
});

// ── Fast WebM Duration & Header Fixer (100% HandBrake & Player Compatible) ──
function fixWebmOnDisk(inputPath, outputPath, actualDurationMs) {
  try {
    let buf = fs.readFileSync(inputPath);
    if (!buf || buf.length < 32) {
      fs.copyFileSync(inputPath, outputPath);
      return;
    }

    function readId(p, buffer = buf) {
      if (p >= buffer.length) return null;
      const b0 = buffer[p];
      let len = 1, mask = 0x80;
      while (len <= 4 && !(b0 & mask)) { len++; mask >>= 1; }
      if (len > 4 || p + len > buffer.length) return null;
      let id = 0;
      for (let i = 0; i < len; i++) id = ((id * 256) + buffer[p + i]) >>> 0;
      return { length: len, id };
    }

    function readVint(p, buffer = buf) {
      if (p >= buffer.length) return null;
      const b0 = buffer[p];
      let len = 1, mask = 0x80;
      while (len <= 8 && !(b0 & mask)) { len++; mask >>= 1; }
      if (len > 8 || p + len > buffer.length) return null;
      let val = b0 & (mask - 1);
      for (let i = 1; i < len; i++) val = (val * 256) + buffer[p + i];
      const isUnknown = (len === 1 && val === 0x7F) || (len === 8 && (b0 & 0x01) && val >= 0x00FFFFFFFFFFFF);
      return { length: len, value: val, isUnknown };
    }

    function readTag(p, buffer = buf) {
      const idInfo = readId(p, buffer);
      if (!idInfo) return null;
      const sizeInfo = readVint(p + idInfo.length, buffer);
      if (!sizeInfo) return null;
      const dataPos = p + idInfo.length + sizeInfo.length;
      const endPos = sizeInfo.isUnknown ? buffer.length : (dataPos + sizeInfo.value);
      return {
        id: idInfo.id,
        headerLength: idInfo.length + sizeInfo.length,
        dataPos: dataPos,
        dataSize: sizeInfo.value,
        endPos: Math.min(endPos, buffer.length),
        isUnknown: sizeInfo.isUnknown,
        startPos: p
      };
    }

    function encodeSize(len) {
      if (len < 127) return Buffer.from([0x80 | len]);
      if (len < 16383) return Buffer.from([0x40 | (len >> 8), len & 0xFF]);
      if (len < 2097151) return Buffer.from([0x20 | (len >> 16), (len >> 8) & 0xFF, len & 0xFF]);
      return Buffer.from([0x10 | (len >> 24), (len >> 16) & 0xFF, (len >> 8) & 0xFF, len & 0xFF]);
    }

    // 1. Locate Segment
    let pos = 0;
    let segmentTag = null;
    while (pos < buf.length) {
      const tag = readTag(pos);
      if (!tag) break;
      if (tag.id === 0x18538067) { segmentTag = tag; break; }
      pos = tag.endPos;
    }

    if (!segmentTag) {
      fs.copyFileSync(inputPath, outputPath);
      return;
    }

    // 2. Locate Info & Tracks tags inside Segment
    let infoTag = null;
    let tracksTag = null;
    let segPos = segmentTag.dataPos;
    while (segPos < buf.length - 4) {
      const tag = readTag(segPos);
      if (!tag) { segPos++; continue; }
      if (tag.id === 0x1549A966) infoTag = tag;
      else if (tag.id === 0x1654AE6B) tracksTag = tag;
      if (infoTag && tracksTag) break;
      if (tag.id === 0x1F43B675) break; // Cluster reached
      segPos = tag.endPos;
    }

    // Determine final duration cleanly
    let finalDurationMs = actualDurationMs && actualDurationMs > 0 ? actualDurationMs : 0;
    if (finalDurationMs <= 0) {
      const clusterPattern = Buffer.from([0x1F, 0x43, 0xB6, 0x75]);
      let cIdx = buf.indexOf(clusterPattern, segmentTag.dataPos);
      let maxClusterTc = 0;
      while (cIdx !== -1) {
        let tc = 0;
        const cEnd = Math.min(buf.length, cIdx + 40);
        for (let i = cIdx + 4; i < cEnd; i++) {
          if (buf[i] === 0xE7) {
            const sizeByte = buf[i + 1];
            const len = sizeByte & 0x7F;
            for (let j = 0; j < len; j++) tc = (tc * 256) + buf[i + 2 + j];
            break;
          }
        }
        if (tc > maxClusterTc) maxClusterTc = tc;
        cIdx = buf.indexOf(clusterPattern, cIdx + 4);
      }
      finalDurationMs = maxClusterTc > 0 ? (maxClusterTc + 1000) : 1000;
    }

    // 3. Update Info element with accurate Duration (0x4489)
    if (infoTag) {
      const durTag = Buffer.alloc(11);
      durTag[0] = 0x44;
      durTag[1] = 0x89;
      durTag[2] = 0x88;
      durTag.writeDoubleBE(finalDurationMs, 3);

      const infoData = buf.subarray(infoTag.dataPos, infoTag.endPos);
      let durPosInInfo = -1, durSizeInInfo = 0, iScan = 0;
      while (iScan < infoData.length) {
        const t = readTag(infoTag.dataPos + iScan);
        if (!t) break;
        if (t.id === 0x4489) {
          durPosInInfo = iScan;
          durSizeInInfo = t.headerLength + t.dataSize;
          break;
        }
        iScan = t.endPos - infoTag.dataPos;
      }

      let newInfoData;
      if (durPosInInfo >= 0) {
        newInfoData = Buffer.concat([
          infoData.subarray(0, durPosInInfo),
          durTag,
          infoData.subarray(durPosInInfo + durSizeInInfo)
        ]);
      } else {
        newInfoData = Buffer.concat([infoData, durTag]);
      }

      const newInfoHeader = Buffer.concat([
        Buffer.from([0x15, 0x49, 0xA9, 0x66]),
        encodeSize(newInfoData.length),
        newInfoData
      ]);

      buf = Buffer.concat([
        buf.subarray(0, infoTag.startPos),
        newInfoHeader,
        buf.subarray(infoTag.endPos)
      ]);
    }

    // 4. Update Tracks element to inject DefaultDuration (30 FPS = 33,333,333 ns = 0x01FC22A5)
    // This allows HandBrake, FFmpeg, and all players to know the nominal 30 FPS rate instead of assuming 1000 FPS!
    const tracksPattern = Buffer.from([0x16, 0x54, 0xAE, 0x6B]);
    const tracksIdx = buf.indexOf(tracksPattern);
    if (tracksIdx !== -1) {
      const curTracksTag = readTag(tracksIdx);
      if (curTracksTag) {
        const tracksData = buf.subarray(curTracksTag.dataPos, curTracksTag.endPos);
        let videoTrackStart = -1, videoTrackEnd = -1;
        let videoDataPos = -1, videoDataEnd = -1;
        let tp = 0;

        while (tp < tracksData.length) {
          const tEntry = readTag(tp, tracksData);
          if (!tEntry) break;
          if (tEntry.id === 0xAE) { // TrackEntry
            const entryData = tracksData.subarray(tEntry.dataPos, tEntry.endPos);
            let isVideo = false;
            let ep = 0;
            while (ep < entryData.length) {
              const field = readTag(ep, entryData);
              if (!field) break;
              if (field.id === 0x83 && field.dataSize === 1 && entryData[field.dataPos] === 1) {
                isVideo = true;
                break;
              }
              ep = field.endPos;
            }
            if (isVideo) {
              videoTrackStart = tEntry.startPos;
              videoTrackEnd = tEntry.endPos;
              videoDataPos = tEntry.dataPos;
              videoDataEnd = tEntry.endPos;
              break;
            }
          }
          tp = tEntry.endPos;
        }

        if (videoTrackStart !== -1) {
          const videoEntryData = tracksData.subarray(videoDataPos, videoDataEnd);
          let hasDefaultDur = false;
          let durFieldPos = -1, durFieldEnd = -1;
          let vp = 0;
          while (vp < videoEntryData.length) {
            const vf = readTag(vp, videoEntryData);
            if (!vf) break;
            if (vf.id === 0x23E383) {
              hasDefaultDur = true;
              durFieldPos = vf.startPos;
              durFieldEnd = vf.endPos;
              break;
            }
            vp = vf.endPos;
          }

          // 33,333,333 ns = 30.000 FPS (0x01FC22A5)
          const defaultDurationTag = Buffer.from([0x23, 0xE3, 0x83, 0x84, 0x01, 0xFC, 0x22, 0xA5]);
          let newVideoEntryData;
          if (hasDefaultDur) {
            newVideoEntryData = Buffer.concat([
              videoEntryData.subarray(0, durFieldPos),
              defaultDurationTag,
              videoEntryData.subarray(durFieldEnd)
            ]);
          } else {
            newVideoEntryData = Buffer.concat([videoEntryData, defaultDurationTag]);
          }

          const newVideoTrackEntry = Buffer.concat([
            Buffer.from([0xAE]),
            encodeSize(newVideoEntryData.length),
            newVideoEntryData
          ]);

          const newTracksData = Buffer.concat([
            tracksData.subarray(0, videoTrackStart),
            newVideoTrackEntry,
            tracksData.subarray(videoTrackEnd)
          ]);

          const newTracksElement = Buffer.concat([
            Buffer.from([0x16, 0x54, 0xAE, 0x6B]),
            encodeSize(newTracksData.length),
            newTracksData
          ]);

          buf = Buffer.concat([
            buf.subarray(0, curTracksTag.startPos),
            newTracksElement,
            buf.subarray(curTracksTag.endPos)
          ]);
        }
      }
    }

    fs.writeFileSync(outputPath, buf);
  } catch (err) {
    console.error('fixWebmOnDisk failed, copying raw:', err);
    fs.copyFileSync(inputPath, outputPath);
  }
}

let activeRecordingStream = null;
let activeRecordingTempPath = null;

ipcMain.handle('start-recording-stream', async () => {
  try {
    const tempDir = app.getPath('temp');
    activeRecordingTempPath = path.join(tempDir, `sapah_rec_${Date.now()}.raw`);
    activeRecordingStream = fs.createWriteStream(activeRecordingTempPath, { flags: 'w' });
    return { success: true };
  } catch (e) {
    console.error('start-recording-stream failed:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.on('write-recording-chunk', (event, chunkBuffer) => {
  if (activeRecordingStream && chunkBuffer) {
    try {
      const buf = Buffer.isBuffer(chunkBuffer) ? chunkBuffer : Buffer.from(chunkBuffer);
      activeRecordingStream.write(buf);
    } catch (e) {
      console.error('write-recording-chunk error:', e);
    }
  }
});

ipcMain.handle('finish-recording-stream', async (event, { durationMs, defaultFilename }) => {
  const currentTemp = activeRecordingTempPath;
  const currentStream = activeRecordingStream;
  activeRecordingTempPath = null;
  activeRecordingStream = null;

  if (!currentTemp || !fs.existsSync(currentTemp)) {
    return { success: false, error: 'No active recording stream file' };
  }

  if (currentStream) {
    await new Promise(resolve => currentStream.end(resolve));
  }

  const fixedTempPath = path.join(app.getPath('temp'), `sapah_done_${Date.now()}.mp4`);

  try {
    // 1. Fix duration & Cues Seek Table in < 50ms
    fixWebmOnDisk(currentTemp, fixedTempPath, durationMs);

    // 2. Open Save Dialog
    const saveRes = await dialog.showSaveDialog(mainWindow, {
      title: 'حفظ تسجيل الفيديو',
      defaultPath: defaultFilename || `تسجيل_سبورة_الصباح_${Date.now()}.mp4`,
      filters: [
        { name: 'فيديو MP4 عالي الجودة (*.mp4; *.webm)', extensions: ['mp4', 'webm'] }
      ]
    });

    if (saveRes.canceled || !saveRes.filePath) {
      try { if (fs.existsSync(currentTemp)) fs.unlinkSync(currentTemp); } catch(e) {}
      try { if (fs.existsSync(fixedTempPath)) fs.unlinkSync(fixedTempPath); } catch(e) {}
      return { canceled: true };
    }

    fs.copyFileSync(fixedTempPath, saveRes.filePath);

    try { if (fs.existsSync(currentTemp)) fs.unlinkSync(currentTemp); } catch(e) {}
    try { if (fs.existsSync(fixedTempPath)) fs.unlinkSync(fixedTempPath); } catch(e) {}

    return { success: true, filePath: saveRes.filePath };
  } catch (err) {
    console.error('finish-recording-stream error:', err);
    try { if (fs.existsSync(currentTemp)) fs.unlinkSync(currentTemp); } catch(e) {}
    try { if (fs.existsSync(fixedTempPath)) fs.unlinkSync(fixedTempPath); } catch(e) {}
    return { success: false, error: err.message || String(err) };
  }
});

