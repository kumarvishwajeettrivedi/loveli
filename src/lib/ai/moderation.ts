import { OpenAI } from 'openai';
import { HfInference } from '@huggingface/inference';
import { ModerationResult } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN);

export async function moderateText(text: string): Promise<ModerationResult> {
  try {
    // Use OpenAI moderation API
    const moderation = await openai.moderations.create({ input: text });
    const results = moderation.results[0];
    
    if (results.flagged) {
      return {
        flagged: true,
        categories: Object.keys(results.categories).filter(key => results.categories[key as keyof typeof results.categories]),
        scores: results.category_scores as unknown as { [key: string]: number },
        action: determineAction(results.categories)
      };
    }
    
    return { flagged: false, categories: [], scores: {}, action: 'allow' };
  } catch (error) {
    console.error('OpenAI moderation failed:', error);
    // Fallback to Hugging Face
    return moderateTextWithHuggingFace(text);
  }
}

async function moderateTextWithHuggingFace(text: string): Promise<ModerationResult> {
  try {
    const response = await hf.textClassification({
      model: "facebook/roberta-hate-speech-dynabench-r4-target",
      inputs: text
    });
    
    const toxicityScore = response[0]?.score || 0;
    const flagged = toxicityScore > 0.75;
    
    return {
      flagged,
      categories: flagged ? ['toxicity'] : [],
      scores: { toxicity: toxicityScore },
      action: flagged ? 'warn' : 'allow'
    };
  } catch (error) {
    console.error('Hugging Face moderation failed:', error);
    // Final fallback - simple keyword matching
    return moderateTextWithKeywords(text);
  }
}

function moderateTextWithKeywords(text: string): ModerationResult {
  const harmfulKeywords = [
    'hate', 'violence', 'harassment', 'abuse', 'spam',
    'explicit', 'inappropriate', 'offensive', 'discriminatory'
  ];
  
  const foundKeywords = harmfulKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  return {
    flagged: foundKeywords.length > 0,
    categories: foundKeywords.length > 0 ? ['keyword-match'] : [],
    scores: {},
    action: foundKeywords.length > 0 ? 'warn' : 'allow'
  };
}

function determineAction(categories: any): 'allow' | 'warn' | 'block' {
  const severeCategories = ['harassment', 'hate', 'self-harm'];
  const hasSevere = Object.keys(categories).some(key => 
    categories[key as keyof typeof categories] && severeCategories.includes(key)
  );
  
  return hasSevere ? 'block' : 'warn';
}

export async function moderateImage(imageData: string): Promise<ModerationResult> {
  try {
    // Use Hugging Face NSFW detection
    const response = await hf.imageClassification({
      model: "Falconsai/nsfw_image_detection",
      data: imageData as any
    });
    
    const nsfwScore = response.find(r => r.label === 'NSFW')?.score || 0;
    const flagged = nsfwScore > 0.7;
    
    return {
      flagged,
      categories: flagged ? ['nsfw'] : [],
      scores: { nsfw: nsfwScore },
      action: flagged ? 'block' : 'allow'
    };
  } catch (error) {
    console.error('Image moderation failed:', error);
    return { flagged: false, categories: [], scores: {}, action: 'allow' };
  }
}
