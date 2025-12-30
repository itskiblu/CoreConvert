
export async function takeVideoSnapshot(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(video.duration, 0.5);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context failed'));
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Snapshot capture failed'));
      }, 'image/png');
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Video processing error'));
    };
  });
}

/**
 * Generic Video Converter using MediaRecorder.
 * Supports scaling via Canvas processing.
 */
export async function convertVideo(
  file: File,
  options: {
    targetMime?: string;
    mute?: boolean;
    targetWidth?: number;
    targetHeight?: number;
  },
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = options.mute || false;
    video.preload = 'auto';

    video.onloadedmetadata = () => {
      const originalWidth = video.videoWidth;
      const originalHeight = video.videoHeight;
      
      let width = options.targetWidth || originalWidth;
      let height = options.targetHeight || originalHeight;

      // Maintain aspect ratio if only one dimension provided
      if (options.targetWidth && !options.targetHeight) {
        height = (originalHeight / originalWidth) * width;
      } else if (options.targetHeight && !options.targetWidth) {
        width = (originalWidth / originalHeight) * height;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Capture stream from canvas
      // @ts-ignore
      const canvasStream = canvas.captureStream ? canvas.captureStream(30) : (canvas as any).mozCaptureStream ? (canvas as any).mozCaptureStream(30) : null;
      
      if (!canvasStream) {
        reject(new Error('Canvas stream capture not supported in this browser.'));
        return;
      }

      // If we want audio, we need to extract it from the video element and add to canvas stream
      if (!options.mute) {
        // @ts-ignore
        const videoStream = video.captureStream ? video.captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
        if (videoStream) {
          const audioTracks = videoStream.getAudioTracks();
          if (audioTracks.length > 0) {
            canvasStream.addTrack(audioTracks[0]);
          }
        }
      }

      // Determine best available mime type
      const possibleTypes = [
        options.targetMime,
        'video/quicktime',
        'video/x-matroska',
        'video/mp4;codecs=h264,aac',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ].filter(Boolean) as string[];

      let selectedMime = '';
      for (const type of possibleTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMime = type;
          break;
        }
      }

      if (!selectedMime) {
        reject(new Error('No supported video recording formats found in this browser.'));
        return;
      }

      const recorder = new MediaRecorder(canvasStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        resolve(new Blob(chunks, { type: selectedMime }));
      };

      video.ontimeupdate = () => {
        if (onProgress && video.duration) {
          onProgress((video.currentTime / video.duration) * 100);
        }
      };

      // Animation loop to draw video to canvas
      let requestIdx: number;
      const drawFrame = () => {
        if (video.paused || video.ended) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestIdx = requestAnimationFrame(drawFrame);
      };

      video.onended = () => {
        cancelAnimationFrame(requestIdx);
        recorder.stop();
      };

      video.oncanplaythrough = () => {
        recorder.start();
        video.play().then(() => {
          drawFrame();
        }).catch(reject);
      };
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error loading video file for conversion.'));
    };
  });
}
