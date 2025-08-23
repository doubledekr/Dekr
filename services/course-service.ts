import OpenAI from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface CourseSection {
  id: string;
  title: string;
  content: string;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    type: 'initial' | 'follow-up';
  }[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  sections: CourseSection[];
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const SYSTEM_PROMPT = `You are an expert financial educator. Your task is to create a structured course based on the user's query. The course should be:
1. Concise but informative
2. Suitable for the target audience
3. Include practical examples
4. Have interactive quizzes to test understanding
5. Contain 3-5 sections that build upon each other

For each section, provide TWO types of quiz questions:
1. An 'initial' quick question to test basic understanding
2. 'follow-up' questions for deeper comprehension

Format the response as a JSON object with the following structure:
{
  "title": "Course title",
  "description": "Brief course description",
  "estimatedTime": "Estimated completion time",
  "difficulty": "Beginner/Intermediate/Advanced",
  "sections": [
    {
      "id": "1",
      "title": "Introduction and Basic Concepts",
      "content": "Section content in markdown format",
      "quiz": [
        {
          "question": "Initial quick question",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 0,
          "type": "initial"
        },
        {
          "question": "Follow-up question for deeper understanding",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 1,
          "type": "follow-up"
        }
      ]
    },
    {
      "id": "2",
      "title": "Core Concepts and Applications",
      "content": "Section content in markdown format",
      "quiz": [
        {
          "question": "Initial quick question",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 0,
          "type": "initial"
        },
        {
          "question": "Follow-up question for deeper understanding",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 1,
          "type": "follow-up"
        }
      ]
    },
    {
      "id": "3",
      "title": "Advanced Topics and Practice",
      "content": "Section content in markdown format",
      "quiz": [
        {
          "question": "Initial quick question",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 0,
          "type": "initial"
        },
        {
          "question": "Follow-up question for deeper understanding",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": 1,
          "type": "follow-up"
        }
      ]
    }
  ]
}

Keep sections focused and digestible, with clear learning objectives. Make initial questions simpler and follow-up questions more challenging. Each section should build upon the knowledge from previous sections, creating a logical learning progression.`;

interface CachedCourse extends Course {
  query: string;
  cachedAt: number;
}

interface CourseCache {
  [query: string]: CachedCourse;
}

async function getCourseCache(): Promise<CourseCache> {
  try {
    const cache = await AsyncStorage.getItem('course_cache');
    return cache ? JSON.parse(cache) : {};
  } catch (error) {
    console.error('Error getting course cache:', error);
    return {};
  }
}

async function saveCourseCache(cache: CourseCache): Promise<void> {
  try {
    await AsyncStorage.setItem('course_cache', JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving course cache:', error);
  }
}

export async function generateCourse(query: string): Promise<Course> {
  try {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Check cache first
    const cache = await getCourseCache();
    const cachedCourse = cache[normalizedQuery];
    
    if (cachedCourse) {
      console.log('Returning cached course for query:', normalizedQuery);
      return cachedCourse;
    }

    console.log('Generating new course for query:', normalizedQuery);
    
    // Generate course using OpenAI
    try {
      // Use a promise with timeout for better control
      const apiPromise = openai.chat.completions.create({
        model: 'o3-mini-2025-01-31',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Create a course about: ${query}` }
        ],
        response_format: { type: "json_object" }
      });
      
      // Implement manual timeout (30 seconds)
      const timeout = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out after 30 seconds')), 30000);
      });
      
      // Race between API call and timeout
      const response = await Promise.race([apiPromise, timeout]) as any;

      console.log('OpenAI API response received:', {
        status: 'success',
        model: response.model,
        usage: response.usage
      });

      const courseContent = response.choices[0].message.content;
      if (!courseContent) {
        console.error('No content in OpenAI response');
        throw new Error('Failed to generate course content: Empty response');
      }

      try {
        // Parse the JSON response
        const parsedContent = JSON.parse(courseContent);
        console.log('Successfully parsed course content');
        
        const course: CachedCourse = {
          id: Date.now().toString(),
          ...parsedContent,
          query: normalizedQuery,
          cachedAt: Date.now()
        };

        // Update cache
        cache[normalizedQuery] = course;
        await saveCourseCache(cache);
        console.log('Course saved to cache');

        return course;
      } catch (parseError) {
        console.error('Error parsing course content:', parseError);
        console.log('Raw course content:', courseContent);
        // Return fallback content instead of throwing
        return generateFallbackCourse(query);
      }
    } catch (apiError: any) {
      console.error('OpenAI API Error:', {
        error: apiError,
        message: apiError.message,
        status: apiError.status,
        response: apiError.response
      });
      // Return fallback content instead of throwing
      return generateFallbackCourse(query);
    }
  } catch (error) {
    console.error('Error in generateCourse:', error);
    // Return fallback content as a last resort
    return generateFallbackCourse(query);
  }
}

// Add a function to generate fallback content when API fails
function generateFallbackCourse(query: string): Course {
  const courseId = Date.now().toString();
  const sanitizedQuery = query.trim();
  const capitalizedQuery = sanitizedQuery.charAt(0).toUpperCase() + sanitizedQuery.slice(1);
  
  // Create a simple course structure with placeholder content
  return {
    id: courseId,
    title: `Learning About ${capitalizedQuery}`,
    description: `A comprehensive introduction to ${sanitizedQuery} covering the fundamental concepts and practical applications.`,
    difficulty: 'Beginner',
    estimatedTime: '30 minutes',
    sections: [
      {
        id: '1',
        title: 'Introduction to the Basics',
        content: `Welcome to this course on ${capitalizedQuery}. In this section, we'll cover the foundational concepts and terminology to get you started.

This is a placeholder section created when we couldn't connect to our knowledge base. Please try again later for the full course content.

In the meantime, you can explore the structure of this course and get a general idea of what you'll learn.`,
        quiz: [
          {
            question: `What is this course about?`,
            options: [
              `${capitalizedQuery}`,
              'Cooking recipes',
              'Space exploration',
              'Ancient history'
            ],
            correctAnswer: 0,
            type: 'initial'
          },
          {
            question: 'Why is this content showing?',
            options: [
              'This is the full course',
              'There was a temporary connection issue',
              'The course was designed this way',
              'You selected this content specifically'
            ],
            correctAnswer: 1,
            type: 'follow-up'
          }
        ]
      },
      {
        id: '2',
        title: 'Key Concepts and Terminology',
        content: `This section would normally dive deeper into the key concepts related to ${sanitizedQuery}.

We're showing placeholder content right now due to a connection issue. Please try again later or check your internet connection.

The full course will include detailed explanations, examples, and interactive elements to help you learn effectively.`,
        quiz: [
          {
            question: 'What would you find in a complete course?',
            options: [
              'Just these placeholder sections',
              'Detailed explanations and examples',
              'Only videos, no text',
              'Nothing important'
            ],
            correctAnswer: 1,
            type: 'initial'
          },
          {
            question: 'What should you do to get the full course?',
            options: [
              'Pay for premium content',
              'Install additional software',
              'Try again later when connection is restored',
              'This is already the full content'
            ],
            correctAnswer: 2,
            type: 'follow-up'
          }
        ]
      },
      {
        id: '3',
        title: 'Practical Applications',
        content: `The final section would typically cover practical applications of ${sanitizedQuery} in real-world scenarios.

We apologize for the limited content available right now. The full course will be much more comprehensive and tailored specifically to your query.

Thank you for your patience and understanding.`,
        quiz: [
          {
            question: 'What is this section supposed to cover?',
            options: [
              'Theoretical concepts only',
              'Historical background',
              'Practical applications in real-world scenarios',
              'Future predictions'
            ],
            correctAnswer: 2,
            type: 'initial'
          },
          {
            question: 'What should you expect when the full course is available?',
            options: [
              'Exactly the same content as now',
              'A more comprehensive and tailored learning experience',
              'Fewer sections than this preview',
              'Only video content, no text'
            ],
            correctAnswer: 1,
            type: 'follow-up'
          }
        ]
      }
    ]
  };
}

export async function getCourseProgress(courseId: string): Promise<number> {
  try {
    const progress = await AsyncStorage.getItem(`progress_${courseId}`);
    return progress ? parseInt(progress, 10) : 0;
  } catch (error) {
    console.error('Error getting course progress:', error);
    return 0;
  }
}

export async function saveCourseProgress(courseId: string, progress: number): Promise<void> {
  try {
    await AsyncStorage.setItem(`progress_${courseId}`, progress.toString());
  } catch (error) {
    console.error('Error saving course progress:', error);
  }
}

export interface QuizState {
  currentType: 'initial' | 'follow-up';
  completedInitial: boolean;
  completedFollowUp: boolean;
  score: number;
}

export async function getQuizState(courseId: string, sectionId: string): Promise<QuizState> {
  try {
    const state = await AsyncStorage.getItem(`quiz_state_${courseId}_${sectionId}`);
    return state ? JSON.parse(state) : {
      currentType: 'initial',
      completedInitial: false,
      completedFollowUp: false,
      score: 0
    };
  } catch (error) {
    console.error('Error getting quiz state:', error);
    return {
      currentType: 'initial',
      completedInitial: false,
      completedFollowUp: false,
      score: 0
    };
  }
}

export async function saveQuizState(
  courseId: string,
  sectionId: string,
  state: QuizState
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      `quiz_state_${courseId}_${sectionId}`,
      JSON.stringify(state)
    );
  } catch (error) {
    console.error('Error saving quiz state:', error);
  }
}

export function getCurrentQuizQuestions(section: CourseSection, type: 'initial' | 'follow-up') {
  return section.quiz?.filter(q => q.type === type) ?? [];
}

export async function clearCourseCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem('course_cache');
    
    // Clear all related quiz states
    const keys = await AsyncStorage.getAllKeys();
    const quizStateKeys = keys.filter(key => key.startsWith('quiz_state_'));
    await Promise.all(quizStateKeys.map(key => AsyncStorage.removeItem(key)));
  } catch (error) {
    console.error('Error clearing course cache:', error);
  }
}

export async function removeCourseFromCache(query: string): Promise<void> {
  try {
    const normalizedQuery = query.toLowerCase().trim();
    const cache = await getCourseCache();
    
    if (cache[normalizedQuery]) {
      const courseId = cache[normalizedQuery].id;
      delete cache[normalizedQuery];
      await saveCourseCache(cache);
      
      // Clear related quiz states
      const keys = await AsyncStorage.getAllKeys();
      const quizStateKeys = keys.filter(key => key.startsWith(`quiz_state_${courseId}`));
      await Promise.all(quizStateKeys.map(key => AsyncStorage.removeItem(key)));
    }
  } catch (error) {
    console.error('Error removing course from cache:', error);
  }
} 