import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AzureChatOpenAI } from "@langchain/openai";
import { z } from "zod";

/**
 * Represents a single original reporting issue.
 */
export type OriginalReporting = z.infer<typeof originalReportingSchema>;

/**
 * Represents the original reporting issues in an article.
 */
export type ArticleOriginalReporting = z.infer<typeof articleOriginalReportingSchema>;

/**
 * Represents a single original reporting issue.
 */
export const originalReportingSchema = z.object({
    title: z.string().describe("The title of the original reporting issue"),
    source: z.string().describe("Name of the source or link title"),
    sourceUrl: z
        .optional(z.string())
        .nullable()
        .describe("Markdown url of the source"),
    description: z
        .string()
        .describe("A description of the original reporting issue"),
});

/**
 * Represents the original reporting issues in an article.
 */
export const articleOriginalReportingSchema = z.object({
    originalReporting: z
        .array(originalReportingSchema)
        .describe("The original reporting issues in the article"),
    conclusion: z
        .optional(z.string())
        .nullable()
        .describe(`Conclusion drawn from the original reporting issues.
            An example would be: Some content appears to be derivative of other sources`),
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
 * Extracts the original reporting issues from a given news article. The
 * output is a structured object containing the original reporting issues
 * and a conclusion drawn from the original reporting issues.
 * 
 * @param newsArticle The text of the news article to extract original reporting from
 * @returns a promise with the original reporting issues
 */
export async function extractOriginalReporting(newsArticle: string): Promise<ArticleOriginalReporting> {
    try {
        const llm = new AzureChatOpenAI({
            deploymentName: "gpt-4o",
            temperature: 0,
            azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
            azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
            azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
        });

        const structured_llm = llm.withStructuredOutput(articleOriginalReportingSchema, {
            name: "news-article-original-reporting",
        });

        const prompt = await promptTemplate.invoke({
            text: newsArticle,
        });

        return await structured_llm.invoke(prompt);
    } catch (error) {
        console.error(`Error extracting original reporting: ${error}`);
        return {} as ArticleOriginalReporting;
    }
}