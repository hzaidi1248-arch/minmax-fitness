import { Composition } from 'remotion';
import { AppStorePreview } from './AppStorePreview';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AppStorePreview"
        component={AppStorePreview}
        durationInFrames={900} // 15 seconds at 60fps
        fps={60}
        width={1080}
        height={1920}
      />
    </>
  );
};
