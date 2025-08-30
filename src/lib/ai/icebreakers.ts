import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateIcebreaker(interests: string[]): Promise<string> {
  try {
    const prompt = `Generate a friendly, engaging icebreaker question based on these interests: ${interests.join(', ')}. 
    The question should be:
    - Conversational and natural
    - Related to the shared interests
    - Open-ended to encourage discussion
    - Appropriate for all ages
    - Maximum 2 sentences
    
    Return only the question, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates friendly conversation starters."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    return completion.choices[0]?.message?.content || getFallbackIcebreaker(interests);
  } catch (error) {
    console.error('Failed to generate AI icebreaker:', error);
    return getFallbackIcebreaker(interests);
  }
}

function getFallbackIcebreaker(interests: string[]): string {
  const fallbackQuestions = [
    "What's the most interesting thing you've learned recently?",
    "If you could travel anywhere in the world, where would you go and why?",
    "What's a hobby or skill you've always wanted to learn?",
    "What's your favorite way to spend a weekend?",
    "What's the best book, movie, or show you've experienced lately?",
    "What's something that always makes you smile?",
    "If you could have dinner with anyone, living or dead, who would it be?",
    "What's a goal you're working towards right now?",
    "What's your favorite season and what do you love about it?",
    "What's something you're grateful for today?"
  ];

  // If we have interests, try to make it relevant
  if (interests.length > 0) {
    const interest = interests[0].toLowerCase();
    
    if (interest.includes('music')) {
      return "What's a song that always puts you in a good mood?";
    } else if (interest.includes('travel') || interest.includes('adventure')) {
      return "What's the most adventurous thing you've ever done?";
    } else if (interest.includes('food') || interest.includes('cooking')) {
      return "What's a dish you could eat every day and never get tired of?";
    } else if (interest.includes('sport') || interest.includes('fitness')) {
      return "What's your favorite way to stay active and healthy?";
    } else if (interest.includes('art') || interest.includes('creative')) {
      return "What's something creative you've made or done that you're proud of?";
    }
  }

  // Return a random fallback question
  return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
}

export async function generateConversationPrompt(interests: string[]): Promise<string> {
  try {
    const prompt = `Based on these interests: ${interests.join(', ')}, suggest a fun topic or question that two strangers could discuss to get to know each other better. 
    Make it:
    - Engaging and thought-provoking
    - Related to the shared interests
    - Light-hearted and positive
    - Something that can lead to a longer conversation
    
    Return only the suggestion, no additional text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that suggests conversation topics."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || getFallbackConversationPrompt(interests);
  } catch (error) {
    console.error('Failed to generate conversation prompt:', error);
    return getFallbackConversationPrompt(interests);
  }
}

function getFallbackConversationPrompt(interests: string[]): string {
  const fallbackPrompts = [
    "Share a funny or interesting story from your life that relates to something you're passionate about.",
    "Talk about a challenge you've overcome and what you learned from it.",
    "Discuss what you think makes a great conversation with someone new.",
    "Share something you're looking forward to in the near future.",
    "Talk about a place, person, or experience that has shaped who you are today."
  ];

  return fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)];
}
