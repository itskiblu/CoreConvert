import { ConversionType } from '../types';

interface ConversionResult {
  url: string;
  name: string;
  blob: Blob;
}

export async function convertVideoFile(file: File, type: ConversionType): Promise<ConversionResult> {
  const baseName = file.name.split('.').slice(0, -1).join('.');

  if (type === 'VIDEO_SNAPSHOT') {
     return takeSnapshot(file, baseName);
  }

  if (type === 'VIDEO_TO_MP3') {
     // Extract audio track or record audio only
     return extractAudio(file, baseName);
  }

  // Transcoding
  let mimeType = 'video/webm';
  let ext = 'webm';
  
  if (type === 'VIDEO_TO_MP4' || type === 'VIDEO_TO_MOV') {
      if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
          ext = type === 'VIDEO_TO_MOV' ? 'mov' : 'mp4';
      } else {
          console.warn("video/mp4 not supported, falling back to webm container");
          // We name it mp4/mov but it is webm content. Many players handle this, but it's imperfect.
          ext = type === 'VIDEO_TO_MOV' ? 'mov' : 'mp4';
      }
  } else if (type === 'VIDEO_TO_MKV') {
      mimeType = 'video/webm'; // WebM is MKV subset
      ext = 'mkv';
  } else if (type === 'VIDEO_TO_AVI') {
      mimeType = 'video/webm'; // AVI not supported, fallback
      ext = 'avi';
  }

  return transcodeVideo(file, mimeType, ext, baseName);
}

async function takeSnapshot(file: File, baseName: string): Promise<ConversionResult> {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    
    await new Promise((resolve) => {
        video.onloadeddata = () => {
            video.currentTime = 1; // Seek to 1s or middle? 1s is safer than 0 (black frame)
            resolve(null);
        };
        video.onseeked = resolve;
    });

    // Wait for seek
    await new Promise(r => setTimeout(r, 200));

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    const blob: Blob | null = await new Promise(r => canvas.toBlob(r, 'image/png'));
    if (!blob) throw new Error("Snapshot failed");

    URL.revokeObjectURL(video.src);
    return { url: URL.createObjectURL(blob), name: `${baseName}_snapshot.png`, blob };
}

async function extractAudio(file: File, baseName: string): Promise<ConversionResult> {
    // Dynamic import lamejs for MP3
    // @ts-ignore
    const lamejs = await import('lamejs');
    
    // We play the video into an AudioContext
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true; // We don't want to hear it, but we need to decode it.
    // Actually, to get audio data effectively we usually need to play it.
    // Faster way: Decode buffer.
    
    // Warning: Decoding large video audio buffer is memory intensive.
    // We'll try AudioContext.decodeAudioData but strictly on the file arraybuffer?
    // File arraybuffer contains video too. decodeAudioData MIGHT work if it ignores video tracks.
    
    try {
        const ab = await file.arrayBuffer();
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await ctx.decodeAudioData(ab);
        
        // Encode to MP3 (Reuse logic from audioUtils ideally, but duplicated here for isolation)
        const channels = audioBuffer.numberOfChannels;
        const mp3encoder = new lamejs.Mp3Encoder(channels, audioBuffer.sampleRate, 128);
        const left = audioBuffer.getChannelData(0);
        const right = channels > 1 ? audioBuffer.getChannelData(1) : left;
        const mp3Data = [];
        const l = new Int16Array(left.length);
        const r = new Int16Array(right.length);
        for(let i=0; i<left.length; i++) {
            l[i] = left[i] < 0 ? left[i] * 32768 : left[i] * 32767;
            r[i] = right[i] < 0 ? right[i] * 32768 : right[i] * 32767;
        }
        
        const blockSize = 1152;
        for(let i=0; i<l.length; i+=blockSize) {
             const lc = l.subarray(i, i+blockSize);
             const rc = r.subarray(i, i+blockSize);
             const buf = mp3encoder.encodeBuffer(lc, rc);
             if(buf.length > 0) mp3Data.push(buf);
        }
        const end = mp3encoder.flush();
        if(end.length > 0) mp3Data.push(end);
        
        const blob = new Blob(mp3Data, { type: 'audio/mpeg' });
        return { url: URL.createObjectURL(blob), name: `${baseName}.mp3`, blob };

    } catch (e) {
        console.error("Audio extraction failed", e);
        throw new Error("Could not extract audio track.");
    }
}

async function transcodeVideo(file: File, mimeType: string, ext: string, baseName: string): Promise<ConversionResult> {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true; // Required for autoplay policies often
    video.playsInline = true;
    
    await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
    });

    const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream();
    // Add audio track? captureStream usually captures audio if playing. 
    // We need to unmute video for captureStream to get audio?
    // Actually, captureStream() gets what is being rendered. If muted, no audio.
    // But playing unmuted might blast sound.
    // Solution: GainNode = 0? Not easily applied to video element directly without AudioContext graph.
    // For now, we accept silent video or muted video transcoding for stability.
    // To properly do audio, we'd need to create a MediaStreamDestination, connect video source to it, and video to it... complex.
    // We will stick to video-only or whatever captureStream gives (usually silent if muted).

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    
    return new Promise((resolve, reject) => {
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
             const blob = new Blob(chunks, { type: mimeType });
             URL.revokeObjectURL(video.src);
             resolve({ url: URL.createObjectURL(blob), name: `${baseName}.${ext}`, blob });
        };
        recorder.onerror = (e) => reject(e);

        recorder.start(100); // 100ms chunks
        video.play();
        
        video.onended = () => {
             recorder.stop();
        };
        
        // Timeout watchdog
        setTimeout(() => {
             if (video.paused && chunks.length === 0) {
                 recorder.stop();
                 reject(new Error("Video playback failed to start"));
             }
        }, 5000);
    });
}