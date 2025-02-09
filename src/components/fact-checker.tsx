"use client"

import { startTransition, useActionState, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ImageIcon, QuoteIcon, Link } from "lucide-react"

// Importing the result component
import FactCheckerResult from "./fact-checker-result"
import { runExtractionAction, IUrlExtractState } from "@/app/actions/runExtractionAction"

const initialState: IUrlExtractState = {
  url: "",
  article: undefined,
  result: undefined
}

export default function FactChecker() {
  const [url, setUrl] = useState("")
  // const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [state, formAction] = useActionState(runExtractionAction, initialState)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    console.log("Extracting URL data...")
    console.log("Form data", e.currentTarget)

    const formData = new FormData(e.currentTarget)
    startTransition(() => {
      // setShowResults(true)
      setIsLoading(false)
      formAction(formData)
    })
  }


  return (
    <div className="min-h-screen bg-[#1a1f2e] flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Super Journalist</h1>
          <p className="text-xl text-gray-400">AI-powered fact checking based on professional journalistic standards</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 space-y-6">
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                URL / Text
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="quote" className="flex items-center gap-2">
                <QuoteIcon className="h-4 w-4" />
                Quote
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="url" className="text-sm text-gray-400">
                    Enter URL or paste text
                  </label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    required
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-white/5 border-gray-700 text-gray-100"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={!url || isLoading}>
                  {isLoading ? "Checking Facts..." : "Check Facts"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="image">
              <div className="text-center py-8 text-gray-400">Image upload coming soon</div>
            </TabsContent>

            <TabsContent value="quote">
              <div className="text-center py-8 text-gray-400">Quote analysis coming soon</div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {state.url && state.result && (
        <FactCheckerResult url={state.url} result={state.result} trustLevel={state.trustLevel} />
      )}
    </div>
  )
}