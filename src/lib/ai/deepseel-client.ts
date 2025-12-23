import Anthropic from '@anthropic-ai/sdk';

class DeepSeekClient {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      baseURL: 'https://api.deepseek.com/v1',
    });
  }

  async transcribe(audioUrl: string): Promise<string> {
    try {
      // Implementar transcripción con DeepSeek
      const response = await this.client.messages.create({
        model: 'deepseek-chat',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `Transcribe the audio from this URL: ${audioUrl}`,
          },
        ],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  async analyzeScene(videoUrl: string): Promise<{
    scenes: Array<{ timestamp: number; description: string; confidence: number }>;
  }> {
    try {
      const response = await this.client.messages.create({
        model: 'deepseek-chat',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: `Analyze this video and detect scene changes: ${videoUrl}. Return JSON with scenes array containing timestamp, description, and confidence.`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Scene analysis error:', error);
      throw new Error('Failed to analyze scenes');
    }
  }

  async generateEditSuggestions(
    transcript: string,
    scenes: any[]
  ): Promise<{
    cuts: Array<{ start: number; end: number; reason: string }>;
    highlights: Array<{ timestamp: number; description: string }>;
  }> {
    try {
      const response = await this.client.messages.create({
        model: 'deepseek-chat',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: `Based on this transcript and scenes, suggest video edits:\n\nTranscript: ${transcript}\n\nScenes: ${JSON.stringify(scenes)}\n\nReturn JSON with cuts and highlights arrays.`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Edit suggestions error:', error);
      throw new Error('Failed to generate edit suggestions');
    }
  }

  async generateSubtitles(
    transcript: string,
    duration: number
  ): Promise<Array<{ start: number; end: number; text: string }>> {
    try {
      const response = await this.client.messages.create({
        model: 'deepseek-chat',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: `Generate SRT-style subtitles from this transcript for a ${duration}s video:\n\n${transcript}\n\nReturn JSON array with start, end, and text for each subtitle.`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return JSON.parse(content.text);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Subtitle generation error:', error);
      throw new Error('Failed to generate subtitles');
    }
  }
}

export const deepseekClient = new DeepSeekClient();