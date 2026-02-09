import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import { QuizQuestion } from "@/lib/firestore";

interface QuestionEditorProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
}

export default function QuestionEditor({ questions, onChange }: QuestionEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<QuizQuestion | null>(null);

  const startEdit = (q: QuizQuestion) => {
    setEditingId(q.id);
    setEditData({ ...q, options: q.options ? [...q.options] : undefined });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveEdit = () => {
    if (!editData) return;
    onChange(questions.map(q => q.id === editData.id ? editData : q));
    setEditingId(null);
    setEditData(null);
  };

  const deleteQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
  };

  const updateOption = (index: number, value: string) => {
    if (!editData?.options) return;
    const opts = [...editData.options];
    opts[index] = value;
    setEditData({ ...editData, options: opts });
  };

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
          >
            {editingId === question.id && editData ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Select
                    value={editData.type}
                    onValueChange={(v) => setEditData({
                      ...editData,
                      type: v as QuizQuestion["type"],
                      options: v === "mcq" ? (editData.options || ["A) ", "B) ", "C) ", "D) "]) : undefined,
                    })}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">MCQ</SelectItem>
                      <SelectItem value="conceptual">Conceptual</SelectItem>
                      <SelectItem value="numerical">Numerical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={editData.difficulty}
                    onValueChange={(v) => setEditData({ ...editData, difficulty: v as QuizQuestion["difficulty"] })}
                  >
                    <SelectTrigger className="w-[110px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={editData.question}
                  onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                  placeholder="Question text"
                  className="text-sm min-h-[60px]"
                />
                {editData.type === "mcq" && editData.options && (
                  <div className="space-y-2">
                    {editData.options.map((opt, i) => (
                      <Input
                        key={i}
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        className="text-sm h-8"
                      />
                    ))}
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Correct Answer</label>
                  <Input
                    value={editData.correctAnswer}
                    onChange={(e) => setEditData({ ...editData, correctAnswer: e.target.value })}
                    className="text-sm h-8 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Explanation</label>
                  <Textarea
                    value={editData.explanation}
                    onChange={(e) => setEditData({ ...editData, explanation: e.target.value })}
                    className="text-sm min-h-[50px] mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} className="h-7 text-xs bg-green-600 hover:bg-green-700">
                    <Check className="h-3 w-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7 text-xs">
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <span className="font-bold text-muted-foreground">{index + 1}.</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs capitalize">{question.type}</Badge>
                    <Badge
                      variant="outline"
                      className={
                        question.difficulty === "easy" ? "border-green-300 text-green-600" :
                        question.difficulty === "medium" ? "border-amber-300 text-amber-600" :
                        "border-red-300 text-red-600"
                      }
                    >
                      {question.difficulty}
                    </Badge>
                  </div>
                  <p className="font-medium mb-2">{question.question}</p>
                  {question.options && (
                    <div className="space-y-1 mb-2">
                      {question.options.map((opt, i) => (
                        <p
                          key={i}
                          className={`text-sm pl-4 ${opt === question.correctAnswer ? "text-green-600 font-medium" : "text-muted-foreground"}`}
                        >
                          {opt === question.correctAnswer && "✓ "}{opt}
                        </p>
                      ))}
                    </div>
                  )}
                  {!question.options && (
                    <p className="text-sm text-green-600 mb-2">
                      <span className="font-medium">Answer:</span> {question.correctAnswer}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Explanation:</span> {question.explanation}
                  </p>
                  <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" onClick={() => startEdit(question)} className="h-7 text-xs">
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteQuestion(question.id)} className="h-7 text-xs text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
