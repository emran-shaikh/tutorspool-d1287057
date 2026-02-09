import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import { Flashcard } from "@/lib/firestore";

interface FlashcardEditorProps {
  flashcards: Flashcard[];
  onChange: (flashcards: Flashcard[]) => void;
}

export default function FlashcardEditor({ flashcards, onChange }: FlashcardEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Flashcard | null>(null);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...flashcards[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditData(null);
  };

  const saveEdit = () => {
    if (editingIndex === null || !editData) return;
    const updated = [...flashcards];
    updated[editingIndex] = editData;
    onChange(updated);
    setEditingIndex(null);
    setEditData(null);
  };

  const deleteFlashcard = (index: number) => {
    onChange(flashcards.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {flashcards.map((flashcard, index) => (
        <Card key={index} className="border-purple-100 dark:border-purple-900 relative group">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-xs flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              {editingIndex === index ? (
                <Input
                  value={editData?.conceptTitle || ""}
                  onChange={(e) => setEditData(prev => prev ? { ...prev, conceptTitle: e.target.value } : null)}
                  className="text-sm h-8"
                />
              ) : (
                <span className="flex-1">{flashcard.conceptTitle}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {editingIndex === index ? (
              <>
                <div>
                  <label className="font-medium text-muted-foreground text-xs mb-1 block">Explanation</label>
                  <Textarea
                    value={editData?.explanation || ""}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, explanation: e.target.value } : null)}
                    className="text-sm min-h-[60px]"
                  />
                </div>
                <div>
                  <label className="font-medium text-muted-foreground text-xs mb-1 block">Formula (optional)</label>
                  <Input
                    value={editData?.formula || ""}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, formula: e.target.value } : null)}
                    className="text-sm h-8"
                  />
                </div>
                <div>
                  <label className="font-medium text-muted-foreground text-xs mb-1 block">Real-life Example</label>
                  <Textarea
                    value={editData?.realLifeExample || ""}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, realLifeExample: e.target.value } : null)}
                    className="text-sm min-h-[60px]"
                  />
                </div>
                <div>
                  <label className="font-medium text-muted-foreground text-xs mb-1 block">Hint</label>
                  <Input
                    value={editData?.hint || ""}
                    onChange={(e) => setEditData(prev => prev ? { ...prev, hint: e.target.value } : null)}
                    className="text-sm h-8"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={saveEdit} className="h-7 text-xs bg-green-600 hover:bg-green-700">
                    <Check className="h-3 w-3 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7 text-xs">
                    <X className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Explanation</p>
                  <p>{flashcard.explanation}</p>
                </div>
                {flashcard.formula && (
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Formula</p>
                    <code className="bg-purple-50 dark:bg-purple-950/50 px-2 py-1 rounded text-purple-600 dark:text-purple-400">
                      {flashcard.formula}
                    </code>
                  </div>
                )}
                <div>
                  <p className="font-medium text-muted-foreground mb-1">Real-life Example</p>
                  <p className="text-emerald-700 dark:text-emerald-400">{flashcard.realLifeExample}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
                  <p className="font-medium text-amber-700 dark:text-amber-400 text-xs mb-1">💡 Hint</p>
                  <p className="text-amber-800 dark:text-amber-300">{flashcard.hint}</p>
                </div>
                <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="outline" onClick={() => startEdit(index)} className="h-7 text-xs">
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteFlashcard(index)} className="h-7 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
