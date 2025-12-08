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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ 
        title: "Invalid file type", 
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Please select an image under 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewURL(base64);
        onPhotoChange(base64);
        setUploading(false);
      };
      reader.onerror = () => {
        toast({ 
          title: "Error", 
          description: "Failed to process image",
          variant: "destructive"
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to upload image",
        variant: "destructive"
      });
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
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <p className="text-xs text-muted-foreground text-center">
        Click the camera icon to upload your photo
      </p>
    </div>
  );
}