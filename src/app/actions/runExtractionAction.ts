"use server"

import { extractResultTrustLevel } from "@/services/analyzers/resultTrust.analyzer";
import { ArticleAccountabilities, extractAccountability } from "@/services/extractors/news-article-accountability.extractor";
import { ArticleAttributions, extractAttribution } from "@/services/extractors/news-article-attribution.extractor";
import { ArticleClaims, extractClaims } from "@/services/extractors/news-article-claims.extractor";
import { ArticleConflicts, extractConflicts } from "@/services/extractors/news-article-conflicts.extractor";
import { ArticleFairness, extractFairness } from "@/services/extractors/news-article-fairness.extractor";
import { ArticleHarmMinimizations, extractHarmMinimization } from "@/services/extractors/news-article-harm-minimization.extractor";
import { ArticleOriginalReporting, extractOriginalReporting } from "@/services/extractors/news-article-original-reporting.extractor";
import { NewsArticle, getContentAsMarkdown } from "@/services/extractors/news-article.extractor";
import { extractInformation } from "@/services/extractors/textToArticleObject.extractor";
import { AnalysisResult, ResultItem, TrustLevelResult } from "@/services/models";

/**
 * Type definition for the URL extraction state.
 */
export interface IUrlExtractState {
    url: string;
    trustLevel?: TrustLevelResult;
    article?: NewsArticle;
    result?: AnalysisResult;
};

/**
 * Runs the extraction action on the given form data. This function
 * extracts the article content from the given URL, then extracts
 * the information from the article content. It then runs the
 * extraction functions for the different trust indicators and
 * returns the trust level of the article.
 * 
 * @param prevState 
 * @param formData 
 * @returns a promise with the updated URL extraction state
 */
export async function runExtractionAction(prevState: IUrlExtractState, formData: FormData): Promise<IUrlExtractState> {
    console.log("Extracting URL data...");
    const url = formData.get("url") as string;

    // Step 1
    console.log("Extracting article content...");
    const content = await getContentAsMarkdown(url);
    console.log("Article content extracted successfully.");

    // Step 2
    console.log("Extracting information from article...");
    const articleContent = await extractInformation(content);
    console.log("Information extracted successfully.");

    // Step 3
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

    // Step 4
    console.log("Checking trust level...");
    let trustLevel = {} as TrustLevelResult;
    try {
        const resultValue = {
            truthAndAccuracy: parseClaimsToResultItem(claims),
            independence: parseConflictsToResultItem(conflicts),
            fairnessAndImpartiality: parseFairnessToResultItem(fairness),
            accountability: parseAccountabilityToResultItem(accountability),
            harmMinimization: parseHarmMinimizationToResultItem(harm),
            attribution: parseAttributionToResultItem(attribution),
            originalReporting: parseOriginalReportingToResultItem(originalReporting)
        } as AnalysisResult;

        const trustResult = await extractResultTrustLevel({
            result: resultValue
        });

        console.log("Trust level extracted:", trustResult.trustLevel);

        trustLevel = {
            TrustLevel: trustResult.trustLevel,
            TrustDescription: trustResult.trustDescription || ""
        };
    } catch (error) {
        console.error("Error extracting trust level:", error);
    }
    console.log("Trust level extracted successfully.");

    // Everything is done
    console.log("Done");

    return {
        url: url,
        article: articleContent,
        trustLevel: {
            TrustLevel: trustLevel.TrustLevel,
            TrustDescription: trustLevel.TrustDescription
        },
        result: {
            TruthAndAccuracy: parseClaimsToResultItem(claims),
            Independence: parseConflictsToResultItem(conflicts),
            FairnessAndImpartiality: parseFairnessToResultItem(fairness),
            Accountability: parseAccountabilityToResultItem(accountability),
            HarmMinimization: parseHarmMinimizationToResultItem(harm),
            Attribution: parseAttributionToResultItem(attribution),
            OriginalReporting: parseOriginalReportingToResultItem(originalReporting)
        }
    };
}

function parseClaimsToResultItem(claims: ArticleClaims): ResultItem[] {
    return (claims.claims || []).map(claim => ({
        Title: claim.title,
        Description: claim.description,
        Source: claim.source || "",
        SourceUrl: claim.sourceUrl || ""
    }));
}

function parseConflictsToResultItem(conflicts: ArticleConflicts): ResultItem[] {
    return conflicts.conflicts.map(conflict => ({
        Title: conflict.title,
        Description: conflict.description,
        Source: conflict.source,
        SourceUrl: conflict.sourceUrl || ""
    }));
}

function parseFairnessToResultItem(fairness: ArticleFairness): ResultItem[] {
    return fairness.fairness.map(fairness => ({
        Title: fairness.title,
        Description: fairness.description,
        Source: fairness.source,
        SourceUrl: fairness.sourceUrl || ""
    }));
}

function parseAccountabilityToResultItem(accountability: ArticleAccountabilities): ResultItem[] {
  return accountability.accountabilities.map(accountability => ({
      Title: accountability.title,
      Description: accountability.description,
      Source: accountability.source,
      SourceUrl: accountability.sourceUrl || ""
  }));
}

function parseHarmMinimizationToResultItem(harmMinimization: ArticleHarmMinimizations): ResultItem[] {
  return harmMinimization.harmMinimizations.map(harmMinimization => ({
      Title: harmMinimization.title,
      Description: harmMinimization.description,
      Source: harmMinimization.source,
      SourceUrl: harmMinimization.sourceUrl || ""
  }));
}

function parseAttributionToResultItem(attribution: ArticleAttributions): ResultItem[] {
  return attribution.attributions.map(attribution => ({
      Title: attribution.title,
      Description: attribution.description,
      Source: attribution.source,
      SourceUrl: attribution.sourceUrl || ""
  }));
}

function parseOriginalReportingToResultItem(originalReporting: ArticleOriginalReporting): ResultItem[] {
  return originalReporting.originalReporting.map(originalReporting => ({
      Title: originalReporting.title,
      Description: originalReporting.description,
      Source: originalReporting.source,
      SourceUrl: originalReporting.sourceUrl || ""
  }));
}