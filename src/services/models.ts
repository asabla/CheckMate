/**
 * Represents the analysis result for each category.
 */
export interface AnalysisResult {
    TruthAndAccuracy?: ResultItem[];
    Independence?: ResultItem[];
    FairnessAndImpartiality?: ResultItem[];
    Accountability?: ResultItem[];
    HarmMinimization?: ResultItem[];
    Attribution?: ResultItem[];
    OriginalReporting?: ResultItem[];
}

/**
 * Represents a single result item.for the analysis result.
 */
export interface ResultItem {
    Title: string;
    Source: string;
    SourceUrl: string;
    Description: string;
}

export interface TrustLevelResult {
    TrustLevel: string;
    TrustDescription: string;
}