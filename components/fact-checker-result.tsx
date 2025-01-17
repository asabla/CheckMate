"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { IUrlExtractState } from "@/app/actions/runExtractionAction"
import { ResultItem } from "@/services/models"

export default function FactCheckerResult(analysisResponse: IUrlExtractState) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState("title")
  const [sortDirection, setSortDirection] = useState("asc")
  const [openSection, setOpenSection] = useState<string | null>(null)

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedAndFilteredData = (details: ResultItem[]) => {
    return details
      .filter(
        (item) =>
          item.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.Source.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      // .sort((a, b) => {
      //   if (a.Title[sortColumn] < b.Title[sortColumn]) return sortDirection === "asc" ? -1 : 1
      //   if (a[sortColumn] > b[sortColumn]) return sortDirection === "asc" ? 1 : -1
      //   return 0
      // })
  }

  const renderCollapsibleTrigger = (title: string, summary: string) => (
    <div className="flex justify-between items-center py-4 hover:bg-gray-800/50 px-4 rounded-lg cursor-pointer">
      <div className="flex items-baseline gap-2">
        <span className="font-medium text-white">{title}:</span>
        <span className="text-gray-400">{summary}</span>
      </div>
      {openSection === summary ? (
        <ChevronUp className="h-5 w-5 text-gray-500" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-500" />
      )}
    </div>
  )

  const renderCollapsibleContent = (details: ResultItem[]) => (
    <div className="py-4 px-4">
      <Input
        placeholder="Search by title or source..."
        className="mb-4 bg-gray-800/50 border-gray-700 text-gray-300 placeholder-gray-500"
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th
                className="text-left py-2 px-4 text-gray-400 font-medium cursor-pointer"
                onClick={() => handleSort("title")}
              >
                Title {sortColumn === "title" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="text-left py-2 px-4 text-gray-400 font-medium cursor-pointer"
                onClick={() => handleSort("source")}
              >
                Source {sortColumn === "source" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="text-left py-2 px-4 text-gray-400 font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredData(details).map((detail: ResultItem, detailIndex) => (
              <tr key={detailIndex} className="border-b border-gray-700/50">
                <td className="py-2 px-4">{detail.Title}</td>
                <td className="py-2 px-4">
                  {detail.SourceUrl.startsWith("http") ? (
                    <a
                      href={detail.SourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {detail.Source}
                    </a>
                  ) : (
                    detail.Source
                  )}
                </td>
                <td className="py-2 px-4">{detail.Description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-gray-300 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-white">Analysis Result</h1>
          <div className="flex items-center gap-2">
            {analysisResponse.trustLevel?.TrustLevel === "High" && (
              <div className="flex items-center gap-2" title={analysisResponse.trustLevel?.TrustDescription}>
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-gray-400">High Trust</span>
              </div>
            )}
            {analysisResponse.trustLevel?.TrustLevel === "Medium" && (
              <div className="flex items-center gap-2" title={analysisResponse.trustLevel?.TrustDescription}>
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-gray-400">Medium Trust</span>
              </div>
            )}
            {analysisResponse.trustLevel?.TrustLevel === "Low" && (
              <div className="flex items-center gap-2" title={analysisResponse.trustLevel?.TrustDescription}>
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <span className="text-gray-400">Low Trust</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-400 mb-8">This content has been evaluated against core journalistic principles.</p>

        <div className="space-y-2">
          <div className="bg-white/5 p-4 rounded-lg">
            <div className="text-gray-400 mb-2">URL:</div>
            <a
              href={analysisResponse.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {analysisResponse.url}
            </a>
          </div>

          {analysisResponse.result?.TruthAndAccuracy && (
            <Collapsible
              open={openSection === "Truth and Accuracy"}
              onOpenChange={() => setOpenSection(openSection === "Truth and Accuracy" ? null : "Truth and Accuracy")}
            >
              <div className="border-b border-gray-700">
                <CollapsibleTrigger className="w-full">
                  {renderCollapsibleTrigger("Truth and Accuracy", "The main claims are supported but require additional verification")}
                </CollapsibleTrigger>
                <CollapsibleContent>{renderCollapsibleContent(analysisResponse.result.TruthAndAccuracy)}</CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {analysisResponse.result?.Independence && (
            <Collapsible
              open={openSection === "Independence"}
              onOpenChange={() => setOpenSection(openSection === "Independence" ? null : "Independence")}
            >
              <div className="border-b border-gray-700">
                <CollapsibleTrigger className="w-full">
                  {renderCollapsibleTrigger("Independence", "No obvious conflicts of interest detected")}
                </CollapsibleTrigger>
                <CollapsibleContent>{renderCollapsibleContent(analysisResponse.result.Independence)}</CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {analysisResponse.result?.FairnessAndImpartiality && (
            <Collapsible
              open={openSection === "Fairness and Impartiality"}
              onOpenChange={() => setOpenSection(openSection === "Fairness and Impartiality" ? null : "Fairness and Impartiality")}
            >
              <div className="border-b border-gray-700">
                <CollapsibleTrigger className="w-full">
                  {renderCollapsibleTrigger("Fairness and Impartiality", "Multiple viewpoints are presented")}
                </CollapsibleTrigger>
                <CollapsibleContent>{renderCollapsibleContent(analysisResponse.result.FairnessAndImpartiality)}</CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {analysisResponse.result?.Accountability && (
            <Collapsible
              open={openSection === "Accountability"}
              onOpenChange={() => setOpenSection(openSection === "Accountability" ? null : "Accountability")}
            >
              <div className="border-b border-gray-700">
                <CollapsibleTrigger className="w-full">
                  {renderCollapsibleTrigger("Accountability", "Sources are cited but some need additional verification")}
                </CollapsibleTrigger>
                <CollapsibleContent>{renderCollapsibleContent(analysisResponse.result.Accountability)}</CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {analysisResponse.result?.HarmMinimization && (
            <Collapsible
              open={openSection === "Harm Minimization"}
              onOpenChange={() => setOpenSection(openSection === "Harm Minimization" ? null : "Harm Minimization")}
            >
              <div className="border-b border-gray-700">
                <CollapsibleTrigger className="w-full">
                  {renderCollapsibleTrigger("Harm Minimization", "Content appears to follow ethical guidelines")}
                </CollapsibleTrigger>
                <CollapsibleContent>{renderCollapsibleContent(analysisResponse.result.HarmMinimization)}</CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {analysisResponse.result?.Attribution && (
            <Collapsible
              open={openSection === "Attribution"}
              onOpenChange={() => setOpenSection(openSection === "Attribution" ? null : "Attribution")}
            >
              <div className="border-b border-gray-700">
                <CollapsibleTrigger className="w-full">
                  {renderCollapsibleTrigger("Attribution", "Most claims are properly attributed to sources")}
                </CollapsibleTrigger>
                <CollapsibleContent>{renderCollapsibleContent(analysisResponse.result.Attribution)}</CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {analysisResponse.result?.OriginalReporting && (
            <Collapsible
              open={openSection === "Original Reporting"}
              onOpenChange={() => setOpenSection(openSection === "Original Reporting" ? null : "Original Reporting")}
            >
              <div className="border-b border-gray-700">
                <CollapsibleTrigger className="w-full">
                  {renderCollapsibleTrigger("Original Reporting", "Some content appears to be derivative of other sources")}
                </CollapsibleTrigger>
                <CollapsibleContent>{renderCollapsibleContent(analysisResponse.result.OriginalReporting)}</CollapsibleContent>
              </div>
            </Collapsible>
          )}

          {/* {analysisData.map((item, index) => (
            <Collapsible
              key={index}
              open={openSection === item.principle}
              onOpenChange={() => setOpenSection(openSection === item.principle ? null : item.principle)}
            >
              <div className="border-b border-gray-700">
                <CollapsibleTrigger className="w-full">
                  <div className="flex justify-between items-center py-4 hover:bg-gray-800/50 px-4 rounded-lg cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-medium text-white">{item.principle}:</span>
                        <span className="text-gray-400">{item.summary}</span>
                      </div>
                    </div>
                    {openSection === item.principle ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="py-4 px-4">
                    <Input
                      placeholder="Search by title or source..."
                      className="mb-4 bg-gray-800/50 border-gray-700 text-gray-300 placeholder-gray-500"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th
                              className="text-left py-2 px-4 text-gray-400 font-medium cursor-pointer"
                              onClick={() => handleSort("title")}
                            >
                              Title {sortColumn === "title" && (sortDirection === "asc" ? "↑" : "↓")}
                            </th>
                            <th
                              className="text-left py-2 px-4 text-gray-400 font-medium cursor-pointer"
                              onClick={() => handleSort("source")}
                            >
                              Source {sortColumn === "source" && (sortDirection === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="text-left py-2 px-4 text-gray-400 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedAndFilteredData(item.details).map((detail, detailIndex) => (
                            <tr key={detailIndex} className="border-b border-gray-700/50">
                              <td className="py-2 px-4">{detail.title}</td>
                              <td className="py-2 px-4">
                                {detail.source.startsWith("http") ? (
                                  <a
                                    href={detail.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                  >
                                    {detail.source}
                                  </a>
                                ) : (
                                  detail.source
                                )}
                              </td>
                              <td className="py-2 px-4">{detail.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))} */}
        </div>
      </div>
    </div>
  )
}

