"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { QuestionType } from "@/types"

interface QuestionDraft {
  id: string
  type: QuestionType
  text: string
  description: string
  required: boolean
  options: string[]
}

const questionTypes: { value: QuestionType; label: string }[] = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "select", label: "Dropdown" },
  { value: "multi_select", label: "Multi-select" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "rating", label: "Star Rating" },
  { value: "scale", label: "Linear Scale" },
]

let questionIdCounter = 0

export default function CreateSurveyPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [blockchainVerification, setBlockchainVerification] = useState(true)
  const [geolocation, setGeolocation] = useState(false)
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { id: `q-${++questionIdCounter}`, type: "text", text: "", description: "", required: true, options: [] },
  ])

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: `q-${++questionIdCounter}`, type: "text", text: "", description: "", required: true, options: [] },
    ])
  }

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, field: keyof QuestionDraft, value: unknown) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const handleSave = async (asDraft: boolean) => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 1500))
    setSaving(false)
    router.push("/surveys")
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Survey</h1>
          <p className="text-muted-foreground mt-1">Design a new survey with blockchain verification</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input placeholder="Enter survey title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder="Describe the purpose of this survey" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Blockchain Verification</p>
              <p className="text-xs text-muted-foreground">Verify responses on-chain and mint NFT certificates</p>
            </div>
            <Switch checked={blockchainVerification} onCheckedChange={setBlockchainVerification} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Geolocation</p>
              <p className="text-xs text-muted-foreground">Collect and verify respondent locations</p>
            </div>
            <Switch checked={geolocation} onCheckedChange={setGeolocation} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Questions</h2>
          <Button variant="outline" size="sm" onClick={addQuestion}>
            <Plus className="mr-2 h-4 w-4" />Add Question
          </Button>
        </div>

        {questions.map((q, i) => (
          <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-bold text-electric-blue">Q{i + 1}</span>
                  <Input
                    placeholder="Enter question text"
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                    className="flex-1"
                  />
                  <Select value={q.type} onValueChange={(v) => updateQuestion(q.id, "type", v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Switch checked={q.required} onCheckedChange={(v) => updateQuestion(q.id, "required", v)} />
                    <span className="text-xs text-muted-foreground">Required</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)} disabled={questions.length <= 1}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <Input
                  placeholder="Optional description or help text"
                  value={q.description}
                  onChange={(e) => updateQuestion(q.id, "description", e.target.value)}
                  className="ml-7"
                />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Separator />

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
          Save as Draft
        </Button>
        <Button onClick={() => handleSave(false)} disabled={saving} className="bg-electric-blue hover:bg-electric-blue-dark">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Publish Survey
        </Button>
      </div>
    </div>
  )
}
