'use server'

import "dotenv/config";
import { AzureChatOpenAI } from "@langchain/openai";
import {
    NewsArticle,
    newsArticleSchema,
    promptTemplate
} from "./news-article.extractor";

/**
 * Extracts information from a given article text using the
 * Configured LLM model. The output is a structured object
 * containing the title, URL, body, author, and date of the
 * article.
 * 
 * @param articleText The text of the article to extract information from
 * @returns a promise with the news article object
 */
export async function extractInformation(articleText: string): Promise<NewsArticle> {
    const llm = new AzureChatOpenAI({
        deploymentName: "gpt-4o",
        temperature: 0,
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
        azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
        azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
    });

    const structured_llm = llm.withStructuredOutput(newsArticleSchema, {
        name: "news-article",
    });

    const prompt = await promptTemplate.invoke({
        text: articleText,
    });

    return await structured_llm.invoke(prompt);
};