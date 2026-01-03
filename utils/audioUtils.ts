import { ConversionType } from '../types';

interface ConversionResult {
  url: string;
  name: string;
  blob: Blob;
}

export async function convertAudioFile(file: File, type: ConversionType): Promise<ConversionResult> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const baseName = file.name.split('.').slice(0, -1).join('.');

  let blob: Blob;
  let ext: string;
  let mime: string;

  switch (type) {
    case 'AUDIO_TO_WAV':
      blob = bufferToWav(audioBuffer);
      ext = 'wav';
      mime = 'audio/wav';
      break;
    
    case 'AUDIO_TO_MP3':
      blob = await bufferToMp3(audioBuffer);
      ext = 'mp3';
      mime = 'audio/mpeg';
      break;

    case 'AUDIO_TO_WEBM':
    case 'AUDIO_TO_OGG':
      // Use MediaRecorder for WebM/Ogg if supported
      blob = await bufferToStreamFormat(audioBuffer, 'audio/webm');
      ext = type === 'AUDIO_TO_OGG' ? 'ogg' : 'webm';
      mime = 'audio/webm';
      break;

    case 'AUDIO_TO_M4A':
    case 'AUDIO_TO_AAC':
    case 'AUDIO_TO_M4R':
       // Try MP4 container
       try {
           blob = await bufferToStreamFormat(audioBuffer, 'audio/mp4');
           ext = type === 'AUDIO_TO_M4R' ? 'm4r' : 'm4a';
           mime = 'audio/mp4';
       } catch (e) {
           // Fallback to WAV if MP4 encoding not supported (e.g. Firefox)
           console.warn("MP4 Audio encoding not supported, falling back to WAV");
           blob = bufferToWav(audioBuffer);
           ext = 'wav';
           mime = 'audio/wav';
       }
       break;

    default:
      // Fallback to WAV
      blob = bufferToWav(audioBuffer);
      ext = 'wav';
      mime = 'audio/wav';
  }

  // Cleanup
  audioContext.close();

  const url = URL.createObjectURL(blob);
  return { url, name: `${baseName}.${ext}`, blob };
}

// --- WAV Encoder ---

function bufferToWav(abuffer: AudioBuffer) {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this loop)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < abuffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

// --- MP3 Encoder (Lamejs) ---

async function bufferToMp3(audioBuffer: AudioBuffer): Promise<Blob> {
    // Dynamic import
    // @ts-ignore
    const lamejs = await import('lamejs');
    
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128); // 128kbps

    // Get Data
    const samples = [];
    const left = audioBuffer.getChannelData(0);
    const right = channels > 1 ? audioBuffer.getChannelData(1) : left;

    // Convert float to int16
    const sampleBlockSize = 1152; // multiple of 576
    const mp3Data = [];

    // LameJS expects Int16
    const l = new Int16Array(left.length);
    const r = new Int16Array(right.length);
    
    for(let i=0; i<left.length; i++) {
        l[i] = left[i] < 0 ? left[i] * 32768 : left[i] * 32767;
        r[i] = right[i] < 0 ? right[i] * 32768 : right[i] * 32767;
    }

    // Encode
    let remaining = l.length;
    let i = 0;
    while (remaining >= sampleBlockSize) {
        const leftChunk = l.subarray(i, i + sampleBlockSize);
        const rightChunk = r.subarray(i, i + sampleBlockSize);
        const mp3buf = channels === 1 
            ? mp3encoder.encodeBuffer(leftChunk)
            : mp3encoder.encodeBuffer(leftChunk, rightChunk);
        
        if (mp3buf.length > 0) mp3Data.push(mp3buf);
        remaining -= sampleBlockSize;
        i += sampleBlockSize;
    }
    
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) mp3Data.push(mp3buf);

    return new Blob(mp3Data, { type: 'audio/mpeg' });
}

// --- Realtime / Stream Encoder (WebM/MP4) ---

async function bufferToStreamFormat(audioBuffer: AudioBuffer, mimeType: string): Promise<Blob> {
    const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    
    // We need to render it to get a Stream... 
    // Actually, MediaRecorder needs a MediaStreamDestination. OfflineContext doesn't support that directly.
    // We must use a real AudioContext or perform a fast "playback" into a stream.
    // To avoid hearing it, we use a GainNode set to 0 connected to destination, 
    // AND a StreamDestination for recording.
    
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const streamDest = ctx.createMediaStreamDestination();
    const sourceNode = ctx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(streamDest);
    
    const recorder = new MediaRecorder(streamDest.stream, { mimeType });
    const chunks: Blob[] = [];
    
    return new Promise((resolve, reject) => {
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
             const blob = new Blob(chunks, { type: mimeType });
             ctx.close();
             resolve(blob);
        };
        recorder.onerror = reject;
        
        recorder.start();
        sourceNode.start();
        // Stop recording when buffer duration ends (+ padding)
        sourceNode.onended = () => {
             // Small delay to ensure flush
             setTimeout(() => recorder.stop(), 100);
        };
    });
}