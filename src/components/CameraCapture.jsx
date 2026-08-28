import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, AlertCircle, Check, Video } from 'lucide-react';

/**
 * CameraCapture Component
 * Uses navigator.mediaDevices.getUserMedia() to capture photos from webcam or mobile camera.
 *
 * Props:
 * @param {Function} onPhotoCaptured - Called with (dataUrl, file) after a successful capture
 * @param {Function} onClear        - Called when the capture is reset
 */
export const CameraCapture = ({ onPhotoCaptured, onClear }) => {

  // ─── STATE ────────────────────────────────────────────────────────────────
  const [isCameraActive, setIsCameraActive] = useState(false); // shows the <video> in the DOM
  const [isCameraReady,  setIsCameraReady]  = useState(false); // canplay event has fired
  const [stream,         setStream]         = useState(null);  // raw MediaStream from getUserMedia
  const [previewUrl,     setPreviewUrl]     = useState(null);  // base64 dataURL of captured photo
  const [error,          setError]          = useState(null);  // user-facing error message
  const [isLoading,      setIsLoading]      = useState(false); // initial camera boot

  // ─── REFS ─────────────────────────────────────────────────────────────────
  const videoRef  = useRef(null); // <video> DOM element
  const canvasRef = useRef(null); // hidden <canvas> for frame extraction

  // ─── CLEANUP ON UNMOUNT ───────────────────────────────────────────────────
  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  // ─── KEY FIX: ASSIGN STREAM → VIDEO IN AN EFFECT ─────────────────────────
  /**
   * WHY THIS EXISTS:
   * React state updates (setIsCameraActive, setStream) are batched and applied
   * asynchronously. The <video> element is conditionally rendered only when
   * isCameraActive=true. If we try to set video.srcObject immediately after
   * getUserMedia() resolves, videoRef.current is still NULL because React hasn't
   * re-rendered the <video> into the DOM yet.
   *
   * Solution: wait for React to render the <video>, then assign the stream via
   * useEffect. This effect runs AFTER the DOM has updated with the new state,
   * so videoRef.current is guaranteed to be a real element.
   */
  useEffect(() => {
    if (!stream || !isCameraActive) return;

    const video = videoRef.current;
    if (!video) {
      console.error('[CameraCapture] stream ready but videoRef.current is still null — DOM not updated yet?');
      return;
    }

    console.log('[CameraCapture] Assigning stream to <video> element');
    video.srcObject = stream;

    // play() returns a Promise — we must await/catch it
    video.play()
      .then(() => console.log('[CameraCapture] video.play() resolved — stream rendering started'))
      .catch(e => {
        console.error('[CameraCapture] video.play() failed:', e);
        setError(`Camera preview failed to start: ${e.message}`);
      });
  }, [stream, isCameraActive]);
  // ─────────────────────────────────────────────────────────────────────────

  // ─── START CAMERA ─────────────────────────────────────────────────────────
  const startCamera = async () => {
    console.log('[CameraCapture] "Open Camera" clicked — requesting getUserMedia()');

    setError(null);
    setIsLoading(true);
    setIsCameraReady(false);
    setPreviewUrl(null);
    if (onClear) onClear();

    // Try ideal HD constraints first, fall back to basic {video:true} if device
    // doesn't support facingMode or resolution constraints (e.g. some desktops).
    const constraintOptions = [
      {
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      },
      {
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      },
      {
        // Bare minimum fallback — any camera, any resolution
        video: true,
        audio: false,
      },
    ];

    let mediaStream = null;
    let lastErr = null;

    for (const constraints of constraintOptions) {
      try {
        console.log('[CameraCapture] Trying constraints:', JSON.stringify(constraints.video));
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('[CameraCapture] getUserMedia() succeeded with constraints:', JSON.stringify(constraints.video));
        break; // success — stop trying
      } catch (err) {
        lastErr = err;
        // NotAllowedError means the user denied permission — no point retrying with looser constraints
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') break;
        console.warn(`[CameraCapture] Constraint attempt failed (${err.name}), trying next...`);
      }
    }

    if (!mediaStream) {
      // Print the full error object for diagnosis
      console.error('[CameraCapture] All getUserMedia() attempts failed. Last error:', lastErr);
      console.error('[CameraCapture] Error name:', lastErr?.name);
      console.error('[CameraCapture] Error message:', lastErr?.message);

      // Map known error types to friendly messages with actionable advice
      const msg = (() => {
        switch (lastErr?.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            return 'Camera access denied. Click the camera/lock icon in your browser address bar, set Camera to "Allow", then refresh the page.';
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            return 'No camera found on this device. Please connect a webcam and try again.';
          case 'NotReadableError':
          case 'TrackStartError':
            return 'Camera is being used by another app or browser tab. Close other apps using the camera, then try again.';
          case 'OverconstrainedError':
          case 'ConstraintNotSatisfiedError':
            return 'Your camera does not support the requested settings. Please try again.';
          case 'SecurityError':
            return 'Camera access is blocked by browser security policy (requires HTTPS or localhost).';
          default:
            return `Camera error (${lastErr?.name}): ${lastErr?.message}`;
        }
      })();

      setError(msg);
      setIsLoading(false);
      return;
    }

    // Stream is ready — set state. React will re-render <video> into the DOM,
    // and the useEffect above will then assign stream → video.srcObject.
    setStream(mediaStream);
    setIsCameraActive(true); // <video> element now enters the DOM
    setIsLoading(false);
  };

  // ─── CANPLAY: BROWSER CONFIRMS FIRST RENDERABLE FRAME ────────────────────
  /**
   * "canplay" fires once the browser has decoded at least one video frame.
   * This is the ONLY correct signal that drawImage(video) will return real pixels.
   * We enable the Capture button here — not earlier.
   */
  const onCanPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    console.log(
      '[CameraCapture] canplay event fired ✅',
      `| readyState=${video.readyState}`,
      `| ${video.videoWidth}×${video.videoHeight}`
    );
    setIsCameraReady(true);
  }, []);

  // ─── CAPTURE PHOTO ────────────────────────────────────────────────────────
  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;

    // Diagnostic log on every capture click
    console.log(
      '[CameraCapture] Capture clicked →',
      `readyState=${video?.readyState}`,
      `${video?.videoWidth}×${video?.videoHeight}`,
      `paused=${video?.paused}`
    );

    if (!video || !canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;

    if (!w || !h) {
      setError('Video frame not available yet. Please wait for the preview to appear.');
      return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width  = w;
    canvas.height = h;

    // Synchronously draw the current live frame — no timing issues
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    console.log('[CameraCapture] Captured ✅ dataURL prefix:', dataUrl.slice(0, 80));

    setPreviewUrl(dataUrl);

    // Release camera hardware
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    setIsCameraActive(false);
    setIsCameraReady(false);

    // Build a proper File object for FormData upload
    canvas.toBlob(blob => {
      if (!blob || !onPhotoCaptured) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, {
        type: 'image/jpeg', lastModified: Date.now(),
      });
      onPhotoCaptured(dataUrl, file);
    }, 'image/jpeg', 0.92);
  };

  // ─── RETAKE / CANCEL ──────────────────────────────────────────────────────
  const handleRetake = () => {
    setPreviewUrl(null);
    if (onClear) onClear();
    startCamera();
  };

  const handleCancel = () => {
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    setIsCameraActive(false);
    setIsCameraReady(false);
    setPreviewUrl(null);
    setError(null);
    if (onClear) onClear();
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex flex-col items-center p-4 border border-slate-800/80 bg-slate-900/40 backdrop-blur-md rounded-2xl">

      {/* ── VIEWPORT ── */}
      <div className="relative w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">

        {/* IDLE */}
        {!isCameraActive && !previewUrl && !error && (
          <div className="text-center p-6 flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Camera className="w-8 h-8 opacity-70 text-campus-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white">Capture via Camera</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                Take a clear snapshot of the item from your webcam or mobile camera.
              </p>
            </div>
            <button
              type="button"
              onClick={startCamera}
              disabled={isLoading}
              className="min-h-[42px] px-6 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-campus-600 to-ai-purple text-white shadow-glow-primary hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              {isLoading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Video className="w-4 h-4" />}
              {isLoading ? 'Activating...' : 'Open Camera'}
            </button>
          </div>
        )}

        {/* LIVE VIDEO FEED
            Rendered as long as isCameraActive is true.
            stream→video assignment happens in the useEffect above, after this renders. */}
        {isCameraActive && (
          <div className="w-full h-full relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onCanPlay={onCanPlay}
              className="w-full h-full object-cover"
            />
            {/* Status badge */}
            <div className="absolute top-4 left-4 flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1 rounded-full border backdrop-blur-sm border-red-500/30">
              {isCameraReady ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">Live</span>
                </>
              ) : (
                <>
                  <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Preparing…</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* CAPTURED PHOTO PREVIEW */}
        {previewUrl && (
          <div className="w-full h-full relative">
            <img src={previewUrl} alt="Captured item" className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-emerald-950/90 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center space-x-1.5 backdrop-blur-sm">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Captured</span>
            </div>
          </div>
        )}

        {/* ERROR OVERLAY */}
        {error && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-10">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <p className="text-sm font-bold text-rose-200 mb-2">Camera Problem</p>
            <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => { setError(null); startCamera(); }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* ── CONTROL BUTTONS ── */}
      {(isCameraActive || previewUrl) && (
        <div className="w-full flex items-center justify-center gap-3 mt-4">

          {/* Live stream controls */}
          {isCameraActive && (
            <>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!isCameraReady}
                title={!isCameraReady ? 'Waiting for camera…' : 'Take photo'}
                className={`min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-lg transition-all flex items-center gap-2
                  ${isCameraReady ? 'bg-rose-600 hover:bg-rose-500 active:scale-95' : 'bg-slate-700 opacity-60 cursor-not-allowed'}`}
              >
                {isCameraReady
                  ? <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  : <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isCameraReady ? 'Capture Photo' : 'Preparing camera…'}
              </button>

              <button type="button" onClick={handleCancel}
                className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 active:scale-95 transition-all">
                Cancel
              </button>
            </>
          )}

          {/* Post-capture controls */}
          {previewUrl && (
            <>
              <button type="button" onClick={handleRetake}
                className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95 transition-all flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Retake
              </button>
              <button type="button" onClick={handleCancel}
                className="min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 text-slate-400 hover:text-white border border-slate-800/80 active:scale-95 transition-all">
                Reset Camera
              </button>
            </>
          )}
        </div>
      )}

      {/* Hidden canvas — frame buffer target */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
