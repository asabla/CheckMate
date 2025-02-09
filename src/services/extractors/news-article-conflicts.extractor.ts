import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AzureChatOpenAI } from "@langchain/openai";
import { z } from "zod";

/**
 * Represents a single conflict of interest.
 */
export type Conflict = z.infer<typeof conflictSchema>;

/**
 * Represents the conflicts of interest in an article.
 */
export type ArticleConflicts = z.infer<typeof articleConflictsSchema>;

/**
 * Represents a single conflict of interest.
 */
export const conflictSchema = z.object({
    title: z.string().describe("The title of the conflict"),
    source: z.string().describe("Name of the source or link title"),
    sourceUrl: z
        .optional(z.string())
        .nullable()
        .describe("Markdown url of the source"),
    description: z.string().describe("A description of the conflict"),
});

/**
 * Represents the conflicts of interest in an article.
 */
export const articleConflictsSchema = z.object({
    conflicts: z.array(conflictSchema).describe("The conflicts of interest in the article"),
    conclusion: z
        .optional(z.string())
        .nullable()
        .describe(`Conclusion drawn from the conflicts of interest.
            An example would be: No obvious conflicts of interest detected`),
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
 * Extracts the conflicts of interest from a given news article. The
 * output is a structured object containing the conflicts of interest
 * and a conclusion drawn from the conflicts of interest.
 * 
 * @param newsArticle The text of the news article to extract conflicts from
 * @returns a promise with the conflicts of interest
 */
export async function extractConflicts(newsArticle: string): Promise<ArticleConflicts> {
    try {
        const llm = new AzureChatOpenAI({
            deploymentName: "gpt-4o",
            temperature: 0,
            azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
            azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
            azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
        });

        const structured_llm = llm.withStructuredOutput(articleConflictsSchema, {
            name: "news-article-conflicts",
        });

        const prompt = await promptTemplate.invoke({
            text: newsArticle,
        });

        return await structured_llm.invoke(prompt);
    } catch (error) {
        console.error("Failed to extract conflicts of interest", error);
        return {} as ArticleConflicts;
    }
}