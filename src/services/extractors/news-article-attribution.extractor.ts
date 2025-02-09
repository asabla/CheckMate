import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AzureChatOpenAI } from "@langchain/openai";
import { z } from "zod";

/**
 * Represents a single attribution issue.
 */
export type Attribution = z.infer<typeof attributionSchema>;

/**
 * Represents the attribution issues in an article.
 */
export type ArticleAttributions = z.infer<typeof articleAttributionsSchema>;

/**
 * Represents a single attribution issue.
 */
export const attributionSchema = z.object({
    title: z.string().describe("The title of the attribution issue"),
    source: z.string().describe("Name of the source or link title"),
    sourceUrl: z
        .optional(z.string())
        .describe("Markdown url of the source"),
    description: z.string().describe("A description of the attribution issue"),
});

/**
 * Represents the attribution issues in an article.
 */
export const articleAttributionsSchema = z.object({
    attributions: z.array(attributionSchema).describe("The attribution issues in the article"),
    conclusion: z
        .optional(z.string())
        .describe(`Conclusion drawn from the attribution issues.
            An example would be: Most claims are properly attributed to sources`),
});

/**
 * Chat prompt template for the news article extractor.
 */
const promptTemplate = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are an expert extraction algorithm on markdown text content.
        Only extract relevant information from the article.
        If you do not know the value of an attribute asked to extract,
        return null for the attribute's value`
    ],
    [ "human", "{text}" ]
]);

/**
 * Extracts the attribution issues from a given news article. The
 * output is a structured object containing the attribution issues
 * and a conclusion drawn from the attribution issues.
 * 
 * @param newsArticle The text of the news article to extract attribution from
 * @returns a promise with the attribution issues
 */
export async function extractAttribution(newsArticle: string): Promise<ArticleAttributions> {
    const llm = new AzureChatOpenAI({
        deploymentName: "gpt-4o",
        temperature: 0,
        azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
        azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
        azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
    });

    const structured_llm = llm.withStructuredOutput(articleAttributionsSchema, {
        name: "news-article-attribution",
    });

    const prompt = await promptTemplate.invoke({
        text: newsArticle,
    });

    return await structured_llm.invoke(prompt);
}