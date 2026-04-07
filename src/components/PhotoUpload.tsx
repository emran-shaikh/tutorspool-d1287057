import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  currentPhotoURL?: string;
  fullName: string;
  onPhotoChange: (base64: string) => void;
}

/** Resize and compress an image to fit within maxSize px and target byte limit */
function compressImage(file: File, maxSize = 300, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Scale down to maxSize maintaining aspect ratio
      if (width > height) {
        if (width > maxSize) { height = Math.round(height * maxSize / width); width = maxSize; }
      } else {
        if (height > maxSize) { width = Math.round(width * maxSize / height); height = maxSize; }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Try JPEG first for smaller size, then reduce quality if still too large
      let result = canvas.toDataURL("image/jpeg", quality);
      
      // If still over 500KB, reduce quality further
      if (result.length > 500_000) {
        result = canvas.toDataURL("image/jpeg", 0.4);
      }
      
      // If STILL over 500KB, shrink dimensions more
      if (result.length > 500_000) {
        const smallerMax = 200;
        let w2 = img.width, h2 = img.height;
        if (w2 > h2) { h2 = Math.round(h2 * smallerMax / w2); w2 = smallerMax; }
        else { w2 = Math.round(w2 * smallerMax / h2); h2 = smallerMax; }
        canvas.width = w2;
        canvas.height = h2;
        ctx.drawImage(img, 0, 0, w2, h2);
        result = canvas.toDataURL("image/jpeg", 0.4);
      }

      resolve(result);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
    img.src = url;
  });
}

export function PhotoUpload({ currentPhotoURL, fullName, onPhotoChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewURL, setPreviewURL] = useState(currentPhotoURL);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const compressed = await compressImage(file);
      setPreviewURL(compressed);
      onPhotoChange(compressed);
    } catch {
      toast({ title: "Error", description: "Failed to process image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
          <AvatarImage src={previewURL} alt={fullName} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        <Button
          size="icon"
          variant="secondary"
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        </Button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <p className="text-xs text-muted-foreground text-center">Click the camera icon to upload your photo</p>
    </div>
  );
}
