import { interpolate, useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion';

/**
 * AppStorePreview: Programmatic 60fps Trailer for Min-Max.
 * 
 * NOTE: Post-production overlays (generated via Kling and Apple Creator Studio) 
 * should be injected as <Video /> components at the frame marks indicated below.
 */

export const AppStorePreview: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Animations
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  const chartProgress = interpolate(frame, [60, 240], [0, 1], { extrapolateRight: 'clamp' });
  const logPulse = interpolate(frame % 60, [0, 30, 60], [1, 1.1, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', color: '#FFFFFF', fontFamily: 'sans-serif' }}>
      
      {/* SCENE 1: Performance Analytics (Frames 60 - 300) */}
      {frame >= 60 && frame < 300 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '80%', height: 400, border: '2px solid #333', borderRadius: 20, padding: 20, position: 'relative' }}>
            <h2 style={{ fontSize: 48, marginBottom: 40 }}>120Hz Analytics</h2>
            <div style={{ width: `${chartProgress * 100}%`, height: 4, backgroundColor: '#FFD700', borderRadius: 2 }} />
            <p style={{ marginTop: 20, color: '#888' }}>Zero-lag Skia Chart Scrubbing</p>
          </div>
          {/* INJECTION POINT: Kling Cinematic Overlay (Frame 150) */}
        </AbsoluteFill>
      )}

      {/* SCENE 2: Fluid Logging (Frames 300 - 600) */}
      {frame >= 300 && frame < 600 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ transform: `scale(${logPulse})`, padding: 60, backgroundColor: '#1A1A1E', borderRadius: 40, border: '2px solid #FFD700' }}>
            <h1 style={{ fontSize: 72 }}>SET LOGGED</h1>
          </div>
          <p style={{ marginTop: 40, fontSize: 32, color: '#FFD700' }}>Transactional Offline Integrity</p>
          {/* INJECTION POINT: Apple Creator Studio Post-FX (Frame 450) */}
        </AbsoluteFill>
      )}

      {/* SCENE 3: Universal Sync (Frames 600 - 900) */}
      {frame >= 600 && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity }}>
          <h1 style={{ fontSize: 120, textAlign: 'center' }}>MIN-MAX</h1>
          <h3 style={{ color: '#FFD700', fontSize: 48, marginTop: 20 }}>V1.0.0 READY</h3>
          <div style={{ position: 'absolute', bottom: 100, width: '100%', textAlign: 'center' }}>
            <p style={{ fontSize: 32, color: '#888' }}>Available on TestFlight & Google Play</p>
          </div>
        </AbsoluteFill>
      )}

    </AbsoluteFill>
  );
};
