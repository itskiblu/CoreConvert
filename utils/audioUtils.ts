
import { loadScript } from './scriptLoader';

/**
 * lamejs is a port of the LAME MP3 encoder. 
 * Because it's an older codebase, it relies on its internal classes/constants 
 * being available in the global scope. We load it via a script tag in index.html
 * to ensure it works correctly in its own non-strict global context.
 */
async function getLameJS() {
  await loadScript('lamejs');
  const lj = (window as any).lamejs;
  if (!lj) {
    throw new Error("lamejs library not loaded. Please check your internet connection.");
  }
  return lj;
}

/**
 * Utility to convert AudioBuffer to a WAV blob.
 * This manually writes the RIFF WAVE header bytes and PCM audio data
 * to an ArrayBuffer.
 */
export async function audioBufferToWav(buffer: AudioBuffer, mono: boolean = false): Promise<Blob> {
  const numChannels = mono ? 1 : buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM (Uncompressed)
  const bitDepth = 16; // Standard CD quality bit depth
  
  let result: Float32Array;
  
  // Interleave channels or downmix to mono
  if (mono && buffer.numberOfChannels > 1) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) {
      result[i] = (left[i] + right[i]) / 2; // Average the channels
    }
  } else {
    if (numChannels === 2) {
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);
      result = new Float32Array(left.length * 2);
      for (let i = 0; i < left.length; i++) {
        result[i * 2] = left[i];
        result[i * 2 + 1] = right[i];
      }
    } else {
      result = buffer.getChannelData(0);
    }
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const bufferLength = result.length * bytesPerSample;
  const headerSize = 44; // Standard WAV header size
  const totalLength = headerSize + bufferLength;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Write RIFF Header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + bufferLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, bufferLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i])); // Clamp to [-1, 1]
    // Convert float range to 16-bit integer range
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Utility to convert AudioBuffer to an MP3 blob using lamejs.
 * Encodes raw PCM data into MP3 frames.
 */
export async function audioBufferToMp3(buffer: AudioBuffer, kbps: number = 128): Promise<Blob> {
  const lamejs = await getLameJS();
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  
  const Mp3Encoder = lamejs.Mp3Encoder;
  if (!Mp3Encoder) {
    throw new Error("Mp3Encoder not found in lamejs library.");
  }

  const mp3encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data: any[] = [];

  // LameJS requires samples as 16-bit integers
  const sampleBlockSize = 1152; // Standard MP3 block size
  
  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : null;
  
  const leftInt16 = new Int16Array(left.length);
  const rightInt16 = right ? new Int16Array(right.length) : null;
  
  // Convert float32 samples to Int16
  for (let i = 0; i < left.length; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    leftInt16[i] = l < 0 ? l * 0x8000 : l * 0x7FFF;
    
    if (right && rightInt16) {
      const r = Math.max(-1, Math.min(1, right[i]));
      rightInt16[i] = r < 0 ? r * 0x8000 : r * 0x7FFF;
    }
  }

  // Encode blocks
  for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    let mp3buf;
    if (channels === 2 && rightInt16) {
      const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    }
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
  }

  // Finalize encoding
  const flushBuf = mp3encoder.flush();
  if (flushBuf.length > 0) {
    mp3Data.push(flushBuf);
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/**
 * Decodes a raw audio file (MP3, WAV, etc.) into a raw AudioBuffer.
 * Uses the Browser's native AudioContext.
 */
export async function decodeAudio(file: File): Promise<AudioBuffer> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Converts audio to OGG, M4A, WEBM, FLAC, AAC, OPUS, or M4R using the MediaRecorder API.
 * This is a real-time (or quasi-real-time) conversion process.
 */
export async function convertAudioViaRecorder(
  file: File,
  targetFormat: 'ogg' | 'm4a' | 'webm' | 'flac' | 'aac' | 'opus' | 'm4r',
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  
  // Determine supported MIME type for the requested format
  const mimeTypes: Record<string, string[]> = {
    'ogg': ['audio/ogg; codecs=opus', 'audio/ogg', 'application/ogg'],
    'opus': ['audio/ogg; codecs=opus', 'audio/opus'],
    'm4a': ['audio/mp4', 'audio/aac', 'audio/mp4; codecs=mp4a.40.2'],
    'm4r': ['audio/mp4', 'audio/aac', 'audio/mp4; codecs=mp4a.40.2'], // M4R is just AAC in mp4 container
    'webm': ['audio/webm; codecs=opus', 'audio/webm'],
    'flac': ['audio/flac', 'audio/x-flac'],
    'aac': ['audio/aac', 'audio/aacp', 'audio/mp4; codecs=mp4a.40.2']
  };
  
  const supportedMime = mimeTypes[targetFormat].find(m => MediaRecorder.isTypeSupported(m));
  
  if (!supportedMime) {
     throw new Error(`Your browser does not support encoding to ${targetFormat.toUpperCase()}`);
  }

  const dest = audioCtx.createMediaStreamDestination();
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(dest);
  
  const recorder = new MediaRecorder(dest.stream, { mimeType: supportedMime });
  const chunks: Blob[] = [];
  
  return new Promise((resolve, reject) => {
      recorder.ondataavailable = (e) => {
          if(e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
         const blob = new Blob(chunks, { type: supportedMime });
         source.disconnect();
         audioCtx.close();
         resolve(blob);
      };
      
      recorder.onerror = (e) => {
          reject(e);
          audioCtx.close();
      };

      // Progress tracker based on playback time
      const duration = audioBuffer.duration;
      const interval = setInterval(() => {
          if (audioCtx.state === 'running') {
               const p = (audioCtx.currentTime / duration) * 100;
               if(onProgress) onProgress(Math.min(p, 99));
          }
      }, 100);

      source.onended = () => {
          clearInterval(interval);
          // Wait a tiny bit to ensure recorder captures the end
          setTimeout(() => {
            if (recorder.state !== 'inactive') recorder.stop();
            if(onProgress) onProgress(100);
          }, 100);
      };

      recorder.start();
      source.start();
      // Resume context if suspended (common in browsers requiring user gesture)
      if (audioCtx.state === 'suspended') audioCtx.resume();
  });
}
