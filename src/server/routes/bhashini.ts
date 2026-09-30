import { Router, Request, Response } from 'express';
import { bhashiniProvider } from '../providers/bhashini.js';

export const bhashiniRouter = Router();

bhashiniRouter.get('/status', async (req: Request, res: Response) => {
  const isConfigured = bhashiniProvider.isConfigured();
  const health = await bhashiniProvider.healthCheck();

  res.json({
    provider: 'BHASHINI - National Language Translation Mission',
    ministry: 'Ministry of Electronics and Information Technology (MeitY)',
    configured: isConfigured,
    health,
    supported_languages: [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'Hindi (हिन्दी)' },
      { code: 'bn', name: 'Bengali (বাংলা)' },
      { code: 'ta', name: 'Tamil (தமிழ்)' },
      { code: 'te', name: 'Telugu (తెలుగు)' },
      { code: 'mr', name: 'Marathi (मराठी)' },
      { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
      { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
      { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
      { code: 'ml', name: 'Malayalam (മലയാളം)' }
    ],
    policy_notice: 'Speech recognition (ASR) and text-to-speech (TTS) are routed strictly through the Government of India BHASHINI platform. Commercial generative AI or non-government voice substitutes are prohibited.'
  });
});

bhashiniRouter.post('/translate', async (req: Request, res: Response) => {
  const { content, sourceLanguage = 'en', targetLanguage = 'hi' } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Content is required for translation' });
  }

  const result = await bhashiniProvider.translate({
    content,
    sourceLanguage,
    targetLanguage
  });

  res.json(result);
});
