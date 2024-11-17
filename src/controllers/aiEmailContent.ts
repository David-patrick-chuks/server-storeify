import { Request, Response } from 'express';
import logger from '../config/logger';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, SchemaType } from '@google/generative-ai';
import dotenv from "dotenv";
dotenv.config();

const gemini_api_key = process.env.API_KEY;
logger.info(gemini_api_key)



const schema = {
    description: "Email content generator for Storeify, specializing in web design, branding, and logo creation.",
    type: SchemaType.OBJECT,
    properties: {
        subject: {
            type: SchemaType.STRING,
            description: "A catchy and relevant subject line for the email.",
            nullable: false,
        },
        body: {
            type: SchemaType.STRING,
            description: "The full content of the email, including greeting for all client [not one client], message, call to action, and closing.",
            nullable: false,
        }
    },
    required: ["subject", "body"]
};


const systemInstruction = `You are an AI assistant named StoreifyBot. Your role is to generate professional and engaging email content for Storeify, a web tech company specializing in website creation, logo design, and branding services. also dont add the "[Client Name]" use a generative word like ["hello amazing client"]`
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


export const emailContent = async (req: Request, res: Response): Promise<void> => {
    try {
        const { prompt } = req.body;

        // Validate request body
        if (!prompt) {
            res.status(400).json({ success: false, message: 'Prompt is required.' })
            return
        }

        // Check if API key is available
        if (!gemini_api_key) {
            logger.error('Invalid API key.');
            res.status(500).json({ success: false, message: 'Internal Server Error.' })
            return
        }

        const googleAI = new GoogleGenerativeAI(gemini_api_key);

        const model = googleAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction,
            safetySettings,
            generationConfig,
        });

        // Generate content using Google AI model
        const result = await model.generateContent(prompt);

        // Check if response exists and restructure the output
        if (result && result.response) {
            const response = result.response.text();
            const { body, subject } = JSON.parse(response)

            // Constructing a clean response object
            const emailResponse = {
                success: true,
                subject,
                body,
            };

            logger.info('Generated Email Content:', emailResponse);

            // Send the formatted response to the client
            res.status(200).json(emailResponse)
            return
        } else {
            logger.error('Failed to generate content from Gemini AI.');
            res.status(500).json({ success: false, message: 'Failed to generate content.' })
            return
        }
    } catch (error) {
        // Handling unexpected errors and logging them
        logger.error('Error generating email content:', error);
        res.status(500).json({ success: false, message: 'An unexpected error occurred.' })
        return
    }
};

