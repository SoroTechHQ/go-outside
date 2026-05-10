// Browser fingerprinting utilities — runs entirely client-side, never imports server modules

export interface BrowserFingerprint {
  fingerprint_hash: string;
  canvas_hash: string;
  webgl_hash: string;
  audio_hash: string;
  cpu_cores: number;
  ram_gb: number;
  gpu_vendor: string;
  gpu_renderer: string;
  screen_width: number;
  screen_height: number;
  pixel_ratio: number;
  color_depth: number;
  timezone: string;
  language: string;
  platform: string;
  touch_points: number;
  fonts_count: number;
  has_ad_blocker: boolean;
  has_do_not_track: boolean;
  is_incognito: boolean;
  has_webrtc: boolean;
  connection_type: string;
  downlink_mbps: number;
  battery_level: number | null;
  is_charging: boolean | null;
  browser_name: string;
  browser_version: string;
  os_name: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  raw_data: Record<string, unknown>;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function canvasHash(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.font = '14px "Arial"';
    ctx.fillText('GoOutside \u{1F389}', 2, 20);
    ctx.fillStyle = 'rgba(102,200,0,0.7)';
    ctx.font = '14px "Times New Roman"';
    ctx.fillText('GoOutside \u{1F389}', 4, 45);
    ctx.beginPath();
    ctx.arc(50, 50, 30, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = 'rgba(74,222,128,0.4)';
    ctx.fill();
    return simpleHash(canvas.toDataURL());
  } catch {
    return '';
  }
}

function webGLInfo(): { vendor: string; renderer: string; hash: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return { vendor: '', renderer: '', hash: '' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = ext ? (gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) as string) : '';
    const renderer = ext ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string) : '';
    return { vendor, renderer, hash: simpleHash(vendor + '|' + renderer) };
  } catch {
    return { vendor: '', renderer: '', hash: '' };
  }
}

async function audioHash(): Promise<string> {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return '';
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const analyser = ctx.createAnalyser();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;
    oscillator.connect(analyser);
    analyser.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(0);
    analyser.fftSize = 256;
    const buf = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(buf);
    oscillator.stop();
    await ctx.close();
    return simpleHash(Array.from(buf.slice(0, 30)).join(','));
  } catch {
    return '';
  }
}

async function detectAdBlocker(): Promise<boolean> {
  try {
    const el = document.createElement('div');
    el.className = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads ad-300';
    el.style.cssText = 'position:absolute;left:-10000px;top:-10000px;width:1px;height:1px;';
    document.body.appendChild(el);
    await new Promise(r => setTimeout(r, 80));
    const blocked = !el.offsetParent || el.offsetHeight === 0;
    document.body.removeChild(el);
    return blocked;
  } catch {
    return false;
  }
}

async function detectIncognito(): Promise<boolean> {
  try {
    const quota = await navigator.storage?.estimate?.();
    if (quota?.quota && quota.quota < 120_000_000) return true;
    return false;
  } catch {
    return false;
  }
}

function countFonts(): number {
  const testFonts = [
    'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Georgia',
    'Impact', 'Times New Roman', 'Trebuchet MS', 'Verdana', 'Helvetica',
    'Palatino', 'Garamond', 'Bookman', 'Tahoma', 'Lucida Sans',
  ];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  const baseline = ctx.measureText('mmmmmmmmli').width;
  let count = 0;
  for (const font of testFonts) {
    ctx.font = `16px "${font}", monospace`;
    if (ctx.measureText('mmmmmmmmli').width !== baseline) count++;
  }
  return count;
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const w = window.innerWidth;
  if (navigator.maxTouchPoints > 0 && w < 640) return 'mobile';
  if (navigator.maxTouchPoints > 0 && w < 1024) return 'tablet';
  return 'desktop';
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS';
  if (/Mac/i.test(ua)) return 'macOS';
  if (/Win/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

function getBrowserInfo(): { name: string; version: string } {
  const ua = navigator.userAgent;
  const match =
    ua.match(/(?:Chrome|CriOS)\/(\d+)/) ??
    ua.match(/Firefox\/(\d+)/) ??
    ua.match(/Safari\/(\d+)/) ??
    ua.match(/Edg\/(\d+)/) ??
    ua.match(/OPR\/(\d+)/);
  const version = match?.[1] ?? '';
  if (/Edg\//i.test(ua)) return { name: 'Edge', version };
  if (/OPR|Opera/i.test(ua)) return { name: 'Opera', version };
  if (/Firefox/i.test(ua)) return { name: 'Firefox', version };
  if (/Chrome/i.test(ua)) return { name: 'Chrome', version };
  if (/Safari/i.test(ua)) return { name: 'Safari', version };
  return { name: 'Unknown', version };
}

export async function collectFingerprint(): Promise<BrowserFingerprint> {
  const [canvasH, audioH, adBlocker, incognito] = await Promise.all([
    Promise.resolve(canvasHash()),
    audioHash(),
    detectAdBlocker(),
    detectIncognito(),
  ]);

  const gl = webGLInfo();
  const browser = getBrowserInfo();
  const fontsCount = countFonts();

  const conn = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number } }).connection;
  const battery = await (navigator as unknown as { getBattery?: () => Promise<{ level: number; charging: boolean }> }).getBattery?.().catch(() => null);

  const hasWebRTC = typeof RTCPeerConnection !== 'undefined';

  const raw: Record<string, unknown> = {
    screen: `${screen.width}x${screen.height}`,
    window: `${window.innerWidth}x${window.innerHeight}`,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages,
    doNotTrack: navigator.doNotTrack,
    cookiesEnabled: navigator.cookieEnabled,
    maxTouchPoints: navigator.maxTouchPoints,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,
    pdfViewer: (navigator as { pdfViewerEnabled?: boolean }).pdfViewerEnabled,
    webGL: gl.renderer,
    webGLVendor: gl.vendor,
    connectionType: conn?.effectiveType,
    downlink: conn?.downlink,
    battery: battery ? { level: battery.level, charging: battery.charging } : null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
  };

  const compositeHash = simpleHash([canvasH, gl.hash, audioH, navigator.platform, screen.width, screen.height, navigator.hardwareConcurrency].join('|'));

  return {
    fingerprint_hash: compositeHash,
    canvas_hash: canvasH,
    webgl_hash: gl.hash,
    audio_hash: audioH,
    cpu_cores: navigator.hardwareConcurrency ?? 0,
    ram_gb: (navigator as { deviceMemory?: number }).deviceMemory ?? 0,
    gpu_vendor: gl.vendor,
    gpu_renderer: gl.renderer,
    screen_width: screen.width,
    screen_height: screen.height,
    pixel_ratio: window.devicePixelRatio,
    color_depth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    touch_points: navigator.maxTouchPoints,
    fonts_count: fontsCount,
    has_ad_blocker: adBlocker,
    has_do_not_track: navigator.doNotTrack === '1',
    is_incognito: incognito,
    has_webrtc: hasWebRTC,
    connection_type: conn?.effectiveType ?? 'unknown',
    downlink_mbps: conn?.downlink ?? 0,
    battery_level: battery?.level ?? null,
    is_charging: battery?.charging ?? null,
    browser_name: browser.name,
    browser_version: browser.version,
    os_name: getOS(),
    device_type: getDeviceType(),
    raw_data: raw,
  };
}
