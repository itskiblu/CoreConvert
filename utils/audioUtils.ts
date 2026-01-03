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
      blob = await bufferToStreamFormat(audioBuffer, 'audio/webm');
      ext = type === 'AUDIO_TO_OGG' ? 'ogg' : 'webm';
      mime = 'audio/webm';
      break;

    case 'AUDIO_TO_M4A':
    case 'AUDIO_TO_AAC':
    case 'AUDIO_TO_M4R':
       try {
           blob = await bufferToStreamFormat(audioBuffer, 'audio/mp4');
           ext = type === 'AUDIO_TO_M4R' ? 'm4r' : 'm4a';
           mime = 'audio/mp4';
       } catch (e) {
           console.warn("MP4 Audio encoding not supported, falling back to WAV");
           blob = bufferToWav(audioBuffer);
           ext = 'wav';
           mime = 'audio/wav';
       }
       break;

    default:
      blob = bufferToWav(audioBuffer);
      ext = 'wav';
      mime = 'audio/wav';
  }

  audioContext.close();

  const url = URL.createObjectURL(blob);
  return { url, name: `${baseName}.${ext}`, blob };
}

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

  const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
  const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  let dataPos = 0;
  while (dataPos < abuffer.length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][dataPos]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    dataPos++;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

async function bufferToMp3(audioBuffer: AudioBuffer): Promise<Blob> {
    const lamejsModule = await import('lamejs');
    const Mp3Encoder = lamejsModule.Mp3Encoder || (lamejsModule as any).default?.Mp3Encoder;
    
    if (!Mp3Encoder) throw new Error("MP3 Encoder (lamejs) not available");
    
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const mp3encoder = new Mp3Encoder(channels, sampleRate, 128);

    const left = audioBuffer.getChannelData(0);
    const right = channels > 1 ? audioBuffer.getChannelData(1) : left;

    const sampleBlockSize = 1152;
    const mp3Data = [];

    const l = new Int16Array(left.length);
    const r = new Int16Array(right.length);
    
    for(let i=0; i<left.length; i++) {
        l[i] = left[i] < 0 ? left[i] * 32768 : left[i] * 32767;
        r[i] = right[i] < 0 ? right[i] * 32768 : right[i] * 32767;
    }

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

async function bufferToStreamFormat(audioBuffer: AudioBuffer, mimeType: string): Promise<Blob> {
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
        sourceNode.onended = () => {
             setTimeout(() => recorder.stop(), 100);
        };
    });
}
