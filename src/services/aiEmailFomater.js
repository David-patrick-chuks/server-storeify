
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SchemaType } from '@google/generative-ai';
import dotenv from "dotenv";
import logger from '../config/logger.js';
dotenv.config();

const gemini_api_key = process.env.API_KEY;
// logger.info(gemini_api_key)



const schema = {
    description: "Email content formater to text/Html for Storeify, specializing in web design, branding, and logo creation.",
    type: SchemaType.OBJECT,
    properties: {
        body: {
            type: SchemaType.STRING,
            description: "Format the prompt [email body] to full text/html with stylying that is professional. this is our brand for [#481570]",
            nullable: false,
        }
    },
    required: ["body"]
};


const systemInstruction = `You are an AI assistant named emailFormater. Your role is format the prompt email body give to you then style and send in json object format, this is our brand for [#481570]`
const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
    responseMimeType: "application/json",
    responseSchema: schema,
};


const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];


export const AiTextToHtmlFormater = async (prompt )  => {
    try {
        

        // Validate request body
        if (!prompt) {
            logger.info({ success: false, message: 'Prompt is required.' })
            return
        }

        // Check if API key is available
        if (!gemini_api_key) {
            logger.error('Invalid API key.');
            return
        }

        const googleAI = new GoogleGenerativeAI(gemini_api_key);

        const model = googleAI.getGenerativeModel({
            model: 'gemini-1.0-pro-latest',
            
            systemInstruction,
            safetySettings,
            generationConfig,
        });

        // Generate content using Google AI model
        const result = await model.generateContent(prompt);

        // Check if response exists and restructure the output
        if (result && result.response) {
            const response = result.response.text();
            const { body } = JSON.parse(response)

            // Constructing a clean response object
            const emailResponse = {
                success: true,
                body,
            };

            // logger.info('Generated Email Content:', emailResponse);
            return body;
        } else {
            logger.error('Failed to generate content from Gemini AI.');
            return
        }
    } catch (error) {
        // Handling unexpected errors and logging them
        logger.error('Error generating email content:', error);
        return
    }
};

const p = "Hello amazing client,\n\nWelcome to Storeify! We're thrilled to have you join our community of entrepreneurs and businesses looking to make their mark online. Get ready to embark on a journey of creating a stunning online presence that truly represents your brand.\n\nWhether you need a website that captivates your audience, a logo that speaks volumes, or a complete branding overhaul, our team of expert designers and developers is here to help every step of the way. Explore our services and discover how we can help you achieve your business goals.\n\nTo get started, you can:\n\n* Visit our website at [website address] to browse our services\n* Check out our portfolio at [portfolio address] for inspiration\n* Contact us directly at [contact information] for customized support \n\nWe're confident that together, we can build something amazing.  Let's get started!\n\nSincerely,\nThe Storeify Team"
