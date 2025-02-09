import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AzureChatOpenAI } from "@langchain/openai";
import { z } from "zod";

/**
 * Represents a single claim made in an article.
 */
export type Claim = z.infer<typeof claimSchema>;

/**
 * Represents the claims made in an article.
 */
export type ArticleClaims = z.infer<typeof articleClaimsSchema>;

/**
 * Represents a single claim made in an article.
 */
export const claimSchema = z.object({
    title: z.string().describe("The title of the claim"),
    claim: z.string().describe("The claim being made"),
    source: z
        .optional(z.string())
        .nullable()
        .describe("Name of the source or link title"),
    sourceUrl: z
        .optional(z.string())
        .nullable()
        .describe("Markdown url of the source"),
    description: z
        .string()
        .describe("A description of the claim"),
});

/**
 * Represents the claims made in an article.
 */
export const articleClaimsSchema = z.object({
    claims: z
        .optional(z.array(claimSchema))
        .nullable()
        .describe("The claims made in the article"),
    conclusion: z
        .optional(z.string())
        .nullable()
        .describe(`Conclusion drawn from the claims made.
            An example would be: The main claims are supported
            but require additional verification`),
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
 * Extracts the claims made in a given news article. The
 * output is a structured object containing the claims made
 * and a conclusion drawn from the claims made.
 * 
 * @param newsArticle The text of the news article to extract claims from
 * @returns a promise with the claims made
 */
export async function extractClaims(newsArticle: string): Promise<ArticleClaims> {
    try {
        const llm = new AzureChatOpenAI({
            deploymentName: "gpt-4o",
            temperature: 0,
            azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
            azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
            azureOpenAIApiKey: process.env.AZURE_OPENAI_KEY,
        });

        const structured_llm = llm.withStructuredOutput(articleClaimsSchema, {
            name: "news-article-claims",
        });

        const prompt = await promptTemplate.invoke({
            text: newsArticle,
        });

        return await structured_llm.invoke(prompt);
    } catch (error) {
        console.error("Error extracting claims:", error);
        return {} as ArticleClaims;
    }
}