import { AzureChatOpenAI } from "@langchain/openai";
import { AnalysisResult } from "../models";
import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";

/**
 * Represents the trust level of an article.
 */
export interface TrustLevelInput {
    result: AnalysisResult;
}

/**
 * Represents the trust level of an article.
 */
export type TrustResult = z.infer<typeof trustResultSchema>;

/**
 * Represents the trust level of an article.
 */
export const trustResultSchema = z.object({
    trustLevel: z
        .enum(["High", "Medium", "Low", "Unknown"])
        .describe("The trust level of the article"),
    trustDescription: z
        .optional(z.string())
        .nullable()
        .describe("The description of the trust level"),
});

/**
 * Chat prompt template for the trust level extractor.
 */
const promptTemplate = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are an expert classification algorithm of news articles
        in a JSON format.

        Classify the trust level of the article based on the following levels:
        - High: The article is highly trustworthy
        - Medium: The article is somewhat trustworthy
        - Low: The article is not trustworthy
        
        Motivate your classification with a short description.
        Like: "The article is highly trustworthy because it has a high level of accountability and fairness."`
    ],
    [ "human", "{text}" ]
]);

/**
 * Extracts the trust level of a given news article. The
 * output is a structured object containing the trust level
 * and a description of the trust level.
 * 
 * @param input The trust level input
 * @returns a promise with the trust level
 */
export async function extractResultTrustLevel(input: TrustLevelInput): Promise<TrustResult> {
    const llm = new AzureChatOpenAI({
        deploymentName: "gpt-4o",
        temperature: 0,
        maxTokens: 100,
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
        azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
        azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
    });

    const structured_llm = llm.withStructuredOutput(trustResultSchema, {
        name: "news-article-trust-level",
    });

    const prompt = await promptTemplate.invoke({
        text: JSON.stringify(input.result),
    });

    return await structured_llm.invoke(prompt);
}