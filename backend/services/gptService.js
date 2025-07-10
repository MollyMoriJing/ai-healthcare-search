const { OpenAI } = require('openai');
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { PromptTemplate } = require('langchain/prompts');
const { LLMChain } = require('langchain/chains');
const { OutputFixingParser } = require('langchain/output_parsers');
const { z } = require('zod');
const { StructuredOutputParser } = require('langchain/output_parsers');
const logger = require('../utils/logger');

// Define the expected output schema
const symptomAnalysisSchema = z.object({
  urgency: z.enum(['low', 'medium', 'high']).describe('Urgency level of symptoms'),
  specialties: z.array(z.string()).describe('Recommended medical specialties'),
  recommendations: z.array(z.string()).describe('General recommendations for patient'),
  reasoning: z.string().describe('Brief explanation of the analysis')
});

class GPTService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Initialize LangChain ChatOpenAI
    this.chatModel = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      temperature: 0.3,
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
    });

    // Initialize structured output parser
    this.outputParser = StructuredOutputParser.fromZodSchema(symptomAnalysisSchema);
    
    // Initialize prompt template with format instructions
    this.promptTemplate = PromptTemplate.fromTemplate(`
You are a medical triage assistant. Analyze the provided symptoms and provide a structured response.

Guidelines:
- Never provide specific medical diagnoses
- Focus on directing to appropriate medical specialties
- Consider symptom combinations and severity
- Always recommend emergency care for severe symptoms
- Use standard medical specialty names

Common specialties: Family Medicine, Internal Medicine, Cardiology, Dermatology, Orthopedics, Neurology, Gastroenterology, Pulmonology, Endocrinology, Psychiatry, Emergency Medicine, Urgent Care, Pediatrics, Gynecology, Urology, Ophthalmology, ENT, Rheumatology, Oncology.

Symptoms to analyze: {symptoms}

{format_instructions}
`);

    // Initialize LLM Chain
    this.analysisChain = new LLMChain({
      llm: this.chatModel,
      prompt: this.promptTemplate,
      outputParser: this.outputParser,
    });

    // Initialize follow-up questions chain
    this.followUpTemplate = PromptTemplate.fromTemplate(`
Based on these symptoms: "{symptoms}" and the medical analysis indicating {urgency} urgency with recommended specialties: {specialties}, generate 3-5 relevant follow-up questions a healthcare provider might ask.

Return as a JSON object with a "questions" array containing the questions as strings.

Example format:
{{"questions": ["How long have you been experiencing these symptoms?", "Have you taken any medications?"]}}
`);

    this.followUpChain = new LLMChain({
      llm: this.chatModel,
      prompt: this.followUpTemplate,
    });
  }

  async analyzeSymptoms(symptoms) {
    try {
      logger.info('Analyzing symptoms with LangChain', { 
        model: this.chatModel.modelName,
        symptoms: symptoms.substring(0, 50) + '...' 
      });

      const startTime = Date.now();

      // Use LangChain structured prompt routing
      const formatInstructions = this.outputParser.getFormatInstructions();
      
      const result = await this.analysisChain.call({
        symptoms: symptoms,
        format_instructions: formatInstructions
      });

      const responseTime = Date.now() - startTime;

      // The LangChain output parser automatically handles JSON parsing
      const analysis = result.text;

      // Validate the response structure
      if (!this.validateAnalysis(analysis)) {
        throw new Error('Invalid analysis response structure');
      }

      logger.info('LangChain analysis completed successfully', { 
        urgency: analysis.urgency,
        specialties: analysis.specialties.length,
        responseTime 
      });

      return {
        success: true,
        ...analysis,
        responseTime,
        model: this.chatModel.modelName,
        tokensUsed: result.llmOutput?.tokenUsage?.totalTokens || 0
      };

    } catch (error) {
      logger.error('LangChain GPT service error:', error);
      
      // Fallback to basic OpenAI call if LangChain fails
      return await this.fallbackAnalysis(symptoms);
    }
  }

  async fallbackAnalysis(symptoms) {
    try {
      logger.info('Using fallback OpenAI analysis');
      
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a medical triage assistant. Respond with JSON containing: urgency (low/medium/high), specialties (array), recommendations (array), and reasoning (string).' 
          },
          { role: 'user', content: `Analyze these symptoms: ${symptoms}` }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(response.choices[0].message.content);

      if (!this.validateAnalysis(analysis)) {
        throw new Error('Invalid fallback response structure');
      }

      return {
        success: true,
        ...analysis,
        tokensUsed: response.usage.total_tokens,
        model: 'fallback-' + (process.env.OPENAI_MODEL || 'gpt-3.5-turbo')
      };

    } catch (error) {
      logger.error('Fallback analysis failed:', error);
      
      return {
        success: false,
        error: error.message,
        fallback: {
          urgency: 'medium',
          specialties: ['Family Medicine', 'Internal Medicine'],
          recommendations: [
            'Consult with a healthcare provider for proper evaluation',
            'Monitor symptoms and seek immediate care if they worsen',
            'Consider scheduling an appointment with your primary care doctor'
          ],
          reasoning: 'Unable to analyze symptoms due to technical issues'
        }
      };
    }
  }

  async generateFollowUpQuestions(symptoms, analysis) {
    try {
      logger.info('Generating follow-up questions with LangChain');

      const result = await this.followUpChain.call({
        symptoms: symptoms,
        urgency: analysis.urgency,
        specialties: analysis.specialties.join(', ')
      });

      const parsed = JSON.parse(result.text);
      return parsed.questions || [];

    } catch (error) {
      logger.error('Follow-up questions generation error:', error);
      return [
        'How long have you been experiencing these symptoms?',
        'Have you taken any medications or treatments?',
        'Are there any other symptoms you haven\'t mentioned?',
        'Do you have any relevant medical history?',
        'Are the symptoms getting worse or better?'
      ];
    }
  }

  validateAnalysis(analysis) {
    const required = ['urgency', 'specialties', 'recommendations'];
    const validUrgency = ['low', 'medium', 'high'];
    
    if (!required.every(field => analysis.hasOwnProperty(field))) {
      return false;
    }

    if (!validUrgency.includes(analysis.urgency)) {
      return false;
    }

    if (!Array.isArray(analysis.specialties) || analysis.specialties.length === 0) {
      return false;
    }

    if (!Array.isArray(analysis.recommendations) || analysis.recommendations.length === 0) {
      return false;
    }

    return true;
  }

  // Enhanced prompt routing for different medical scenarios
  async routePrompt(symptoms) {
    const symptomsLower = symptoms.toLowerCase();
    
    // Emergency keywords trigger different prompt routing
    const emergencyKeywords = [
      'chest pain', 'difficulty breathing', 'severe headache', 'loss of consciousness',
      'severe bleeding', 'stroke symptoms', 'heart attack', 'severe allergic reaction'
    ];

    const mentalHealthKeywords = [
      'depression', 'anxiety', 'panic', 'suicide', 'self-harm', 'mental health'
    ];

    const chronicKeywords = [
      'diabetes', 'hypertension', 'chronic pain', 'arthritis', 'ongoing'
    ];

    if (emergencyKeywords.some(keyword => symptomsLower.includes(keyword))) {
      return 'emergency';
    } else if (mentalHealthKeywords.some(keyword => symptomsLower.includes(keyword))) {
      return 'mental_health';
    } else if (chronicKeywords.some(keyword => symptomsLower.includes(keyword))) {
      return 'chronic_care';
    } else {
      return 'general';
    }
  }

  async getUsageStats() {
    // Track LangChain usage statistics
    return {
      totalRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      errorRate: 0,
      langchainEnabled: true,
      promptRouting: true
    };
  }
}

module.exports = new GPTService();