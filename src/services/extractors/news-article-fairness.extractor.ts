import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AzureChatOpenAI } from "@langchain/openai";
import { z } from "zod";

/**
 * Represents a single fairness issue.
 */
export type Fairness = z.infer<typeof fairnessSchema>;

/**
 * Represents the fairness issues in an article.
 */
export type ArticleFairness = z.infer<typeof articleFairnessSchema>;

/**
 * Represents a single fairness issue.
 */
export const fairnessSchema = z.object({
    title: z.string().describe("The title of the fairness issue"),
    source: z.string().describe("Name of the source or link title"),
    sourceUrl: z
        .optional(z.string())
        .nullable()
        .describe("Markdown url of the source"),
    description: z.string().describe("A description of the fairness issue"),
});

/**
 * Represents the fairness issues in an article.
 */
export const articleFairnessSchema = z.object({
    fairness: z.array(fairnessSchema).describe("The fairness issues in the article"),
    conclusion: z
        .optional(z.string())
        .nullable()
        .describe(`Conclusion drawn from the fairness issues.
            An example would be: Multiple viewpoints are presented`),
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
 * Extracts the fairness issues from a given news article. The
 * output is a structured object containing the fairness issues
 * and a conclusion drawn from the fairness issues.
 * 
 * @param newsArticle The text of the news article to extract fairness from
 * @returns a promise with the fairness issues
 */
export async function extractFairness(newsArticle: string): Promise<ArticleFairness> {
    try {
        const llm = new AzureChatOpenAI({
            deploymentName: "gpt-4o",
            temperature: 0,
            azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
            azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
            azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
        });

        const structured_llm = llm.withStructuredOutput(articleFairnessSchema, {
            name: "news-article-fairness",
        });

        const prompt = await promptTemplate.invoke({
            text: newsArticle,
        });

        return await structured_llm.invoke(prompt);
    } catch (error) {
        console.error("Error extracting fairness issues:", error);
        return {} as ArticleFairness;
    }
}