import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AzureChatOpenAI } from "@langchain/openai";
import { z } from "zod";

/**
 * Represents a single harm minimization issue.
 */
export type HarmMinimization = z.infer<typeof harmMinimizationSchema>;

/**
 * Represents the harm minimization issues in an article.
 */
export type ArticleHarmMinimizations = z.infer<typeof articleHarmMinimizationsSchema>;

/**
 * Represents a single harm minimization issue.
 */
export const harmMinimizationSchema = z.object({
    title: z.string().describe("The title of the harm minimization issue"),
    source: z.string().describe("Name of the source or link title"),
    sourceUrl: z
        .optional(z.string())
        .nullable()
        .describe("Markdown url of the source"),
    description: z.string().describe("A description of the harm minimization issue"),
});

/**
 * Represents the harm minimization issues in an article.
 */
export const articleHarmMinimizationsSchema = z.object({
    harmMinimizations: z
        .array(harmMinimizationSchema)
        .describe("The harm minimization issues in the article"),
    conclusion: z
        .optional(z.string())
        .nullable()
        .describe(`Conclusion drawn from the harm minimization issues.
            An example would be: Content appears to follow ethical guidelines`),
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
 * Extracts the harm minimization issues from a given news article. The
 * output is a structured object containing the harm minimization issues
 * and a conclusion drawn from the harm minimization issues.
 * 
 * @param newsArticle The text of the news article to extract harm minimization from
 * @returns a promise with the harm minimization issues
 */
export async function extractHarmMinimization(newsArticle: string): Promise<ArticleHarmMinimizations> {
    try {
        const llm = new AzureChatOpenAI({
            deploymentName: "gpt-4o",
            temperature: 0,
            azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
            azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
            azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
        });

        const structured_llm = llm.withStructuredOutput(articleHarmMinimizationsSchema, {
            name: "news-article-harm-minimization",
        });

        const prompt = await promptTemplate.invoke({
            text: newsArticle,
        });

        return await structured_llm.invoke(prompt);
    } catch (error) {
        console.error("Error extracting harm minimization issues:", error);
        return {} as ArticleHarmMinimizations;
    }
}