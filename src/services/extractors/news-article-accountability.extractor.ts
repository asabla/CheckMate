import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AzureChatOpenAI } from "@langchain/openai";
import { z } from "zod";

/**
 * Represents a single accountability issue.
 */
export type Accountability = z.infer<typeof accountabilitySchema>;

/**
 * Represents the accountability issues in an article.
 */
export type ArticleAccountabilities = z.infer<typeof articleAccountabilitiesSchema>;

/**
 * Represents a single accountability issue.
 */
export const accountabilitySchema = z.object({
    title: z.string().describe("The title of the accountability issue"),
    source: z.string().describe("Name of the source or link title"),
    sourceUrl: z
        .optional(z.string())
        .nullable()
        .describe("Markdown url of the source"),
    description: z.string().describe("A description of the accountability issue"),
});

/**
 * Represents the accountability issues in an article.
 */
export const articleAccountabilitiesSchema = z.object({
    accountabilities: z
        .array(accountabilitySchema)
        .describe("The accountability issues in the article"),
    conclusion: z
        .optional(z.string())
        .nullable()
        .describe(`Conclusion drawn from the accountability issues.
            An example would be: Sources are cited but some need additional verification`),
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
 * Extracts the accountability issues from a given news article. The
 * output is a structured object containing the accountability issues
 * and a conclusion drawn from the accountability issues.
 * 
 * @param newsArticle The text of the news article to extract accountability from
 * @returns a promise with the accountability issues
 */
export async function extractAccountability(newsArticle: string): Promise<ArticleAccountabilities> {
    try {
        const llm = new AzureChatOpenAI({
            deploymentName: "gpt-4o",
            temperature: 0,
            azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
            azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
            azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
        });

        const structured_llm = llm.withStructuredOutput(articleAccountabilitiesSchema, {
            name: "news-article-fairness",
        });

        const prompt = await promptTemplate.invoke({
            text: newsArticle,
        });

        return await structured_llm.invoke(prompt);
    } catch (error) {
        console.error("Error extracting accountability issues:", error);
        return {} as ArticleAccountabilities;
    }
}