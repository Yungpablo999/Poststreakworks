const FISH_AUDIO_API_URL = "https://api.fish.audio";

type FishAudioPreviewOptions = {
  text: string;
  voiceId: string;
  referenceId?: string;
};

type FishAudioFullRenderOptions = FishAudioPreviewOptions & {
  webhookUrl?: string;
};

export async function fishAudioPreview(options: FishAudioPreviewOptions) {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) throw new Error("FISH_AUDIO_API_KEY is not set");

  const response = await fetch(`${FISH_AUDIO_API_URL}/v1/tts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: options.text,
      reference_id: options.voiceId,
      chunk_length: 200,
      format: "mp3",
      mp3_bitrate: 128,
      normalize: true,
      latency: "normal",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Fish Audio API error ${response.status}: ${body}`);
  }

  return response.blob();
}

export async function fishAudioFullRender(options: FishAudioFullRenderOptions) {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) throw new Error("FISH_AUDIO_API_KEY is not set");

  const response = await fetch(`${FISH_AUDIO_API_URL}/v1/tts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: options.text,
      reference_id: options.voiceId,
      chunk_length: 200,
      format: "mp3",
      mp3_bitrate: 128,
      normalize: true,
      latency: "normal",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Fish Audio API error ${response.status}: ${body}`);
  }

  return response.blob();
}
