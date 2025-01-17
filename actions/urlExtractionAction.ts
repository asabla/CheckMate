"use server";

import { extractAccountability } from "@/services/extractors/news-article-accountability.extractor";
import { extractAttribution } from "@/services/extractors/news-article-attribution.extractor";
import { extractClaims } from "@/services/extractors/news-article-claims.extractor";
import { extractConflicts } from "@/services/extractors/news-article-conflicts.extractor";
import { extractFairness } from "@/services/extractors/news-article-fairness.extractor";
import { extractHarmMinimization } from "@/services/extractors/news-article-harm-minimization.extractor";
import { extractOriginalReporting } from "@/services/extractors/news-article-original-reporting.extractor";
import { NewsArticle, getContentAsMarkdown } from "@/services/extractors/news-article.extractor";
import { TrustResult, extractResultTrustLevel } from "@/services/analyzers/resultTrust.analyzer";
import { extractInformation } from "@/services/extractors/textToArticleObject.extractor";
import { AnalysisResult } from "@/services/models";

/**
 * Type definition for the URL extraction state.
 */
export interface UrlExtractState {
    url: string;
    article: NewsArticle | undefined;
    result: AnalysisResult | undefined;
};

/**
 * Runs the URL extraction action.
 * 
 * @param prevState The previous state of the URL extraction
 * @param formData The form data to extract
 */
export async function runExtractionAction(prevState: UrlExtractState, formData: FormData) {
    console.log("Extracting URL data...");
    const url = formData.get("url") as string;

    // 1. Using browserless
    //  - check if the url is valid
    //  - Check if there is an <article> tag, if not use https://r.jina.ai/<url> to extract the article
    //  - Extract the article content
    // 2. Start the analysis process
    //  - Truth and Accuracy - The main claims are supported but require additional verification
    //  - Independence - No obvious conflicts of interest detected
    //  - Fairness and Impartiality - Multiple viewpoints are presented
    //  - Accountability - Sources are cited but some need additional verification
    //  - Harm Minimization - Content appears to follow ethical guidelines
    //  - Attribution - Most claims are properly attributed to sources
    //  - Original Reporting - Some content appears to be derivative of other sources
    // 3. Return the result

    // Step 1
    console.log("Extracting article content...");
    const content = await getContentAsMarkdown(url);
    console.log("Article content extracted successfully.");

    console.log("Extracting information from article...");
    const articleContent = await extractInformation(content);
    console.log("Information extracted successfully.");

    // Run all the extraction functions concurrently
    const [
        claims,
        conflicts,
        fairness,
        accountability,
        harm,
        attribution,
        originalReporting
    ] = await Promise.all([
        (async () => {
            console.log("Analyzing article content...");
            const claims = await extractClaims(content);
            console.log("Article claims extracted successfully.");
            return claims;
        })(),
        (async () => {
            console.log("Checking for conflicts of interest...");
            const conflicts = await extractConflicts(content);
            console.log("Conflicts of interest checked successfully.");
            return conflicts;
        })(),
        (async () => {
            console.log("Checking for fairness and impartiality...");
            const fairness = await extractFairness(content);
            console.log("Fairness and impartiality checked successfully.");
            return fairness;
        })(),
        (async () => {
            console.log("Checking for accountability...");
            const accountability = await extractAccountability(content);
            console.log("Accountability checked successfully.");
            return accountability;
        })(),
        (async () => {
            console.log("Checking for harm minimization...");
            const harm = await extractHarmMinimization(content);
            console.log("Harm minimization checked successfully.");
            return harm;
        })(),
        (async () => {
            console.log("Checking for attribution...");
            const attribution = await extractAttribution(content);
            console.log("Attribution checked successfully.");
            return attribution;
        })(),
        (async () => {
            console.log("Checking for original reporting...");
            const originalReporting = await extractOriginalReporting(content);
            console.log("Original reporting checked successfully.");
            return originalReporting;
        })()
    ]);

    const data = {
        url: url,
        article: articleContent,
        trustLevel: {
            trustLevel: "High",
            trustDescription: "The article is highly trustworthy"
        },
        result: {
            truthAndAccuracy: claims,
            independence: conflicts,
            fairnessAndImpartiality: fairness,
            accountability: accountability,
            harmMinimization: harm,
            attribution: attribution,
            originalReporting: originalReporting
        }
    };

    const trustLevel = await extractResultTrustLevel({
        result: data.result as AnalysisResult
    });

    console.log("Trust level extracted successfully.");
    console.log("Trust level: ", trustLevel);

    data.trustLevel.trustLevel = trustLevel.trustLevel;
    data.trustLevel.trustDescription = trustLevel.trustDescription;

    // console.log("PrevState: ", prevState);
    // console.log("content", content);
    // console.log("Claims extracted: ", claims);
    // console.log("Conflicts: ", conflicts);
    // console.log("Fairness: ", fairness);
    // console.log("Accountability: ", accountability);
    // console.log("Harm: ", harm);
    // console.log("Attribution: ", attribution);
    // console.log("Original Reporting: ", originalReporting);

    console.log("Done");

    // Return the new state
    return {
        result: data
    };
}
