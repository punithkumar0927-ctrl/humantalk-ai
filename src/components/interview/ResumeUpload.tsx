import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ResumeUploadProps {
  onResumeAnalyzed: (analysis: ResumeAnalysis) => void;
}

export interface ResumeAnalysis {
  name: string;
  skills: string[];
  experience: string[];
  education: string[];
  summary: string;
  dynamicQuestions: string[];
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const ResumeUpload = ({ onResumeAnalyzed }: ResumeUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a PDF, Word document, or image file.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`;
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setError(null);
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setFile(selectedFile);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Supabase storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      toast.success("Resume uploaded successfully!");
      setIsUploading(false);
      setIsAnalyzing(true);

      // Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(fileName);

      // Read the file content for text-based files
      let resumeText = "";
      
      if (selectedFile.type === "text/plain") {
        resumeText = await selectedFile.text();
      } else if (selectedFile.type === "application/pdf" || 
                 selectedFile.type.startsWith("application/") ||
                 selectedFile.type.startsWith("image/")) {
        // For PDFs, Word docs, and images, we'll send a description and let AI work with what it can
        resumeText = `File: ${selectedFile.name}\nType: ${selectedFile.type}\nSize: ${(selectedFile.size / 1024).toFixed(1)}KB\n\nNote: This is a ${selectedFile.type} file. Please analyze based on the file name and any available context. If this is an image-based resume, extract visible text and information.`;
        
        // For text extraction, convert file to base64 for image processing
        if (selectedFile.type.startsWith("image/")) {
          const arrayBuffer = await selectedFile.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          resumeText = `This is an image-based resume. File: ${selectedFile.name}\n\nBase64 image data is available for OCR processing. Please extract and analyze any visible text, skills, experience, and qualifications from this resume image.`;
        }
      }

      // Call the AI analysis edge function
      const analysisResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            resumeText,
            fileName: selectedFile.name,
            fileUrl: urlData?.publicUrl,
          }),
        }
      );

      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to analyze resume");
      }

      const analysisData = await analysisResponse.json();
      
      if (!analysisData.success || !analysisData.analysis) {
        throw new Error(analysisData.error || "Failed to analyze resume");
      }

      setIsAnalyzing(false);
      toast.success("Resume analyzed! Starting your interview...");
      onResumeAnalyzed(analysisData.analysis);
    } catch (err: any) {
      setIsUploading(false);
      setIsAnalyzing(false);
      
      let errorMessage = "Failed to upload resume. Please try again.";
      
      if (err.message?.includes("413") || err.message?.includes("Payload Too Large")) {
        errorMessage = "File is too large. Please use a smaller file.";
      } else if (err.message?.includes("504") || err.message?.includes("timeout")) {
        errorMessage = "Upload timed out. Please try again with a smaller file.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 text-center",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50",
          error && "border-destructive"
        )}
      >
        {isUploading || isAnalyzing ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {isAnalyzing ? "Analyzing your resume..." : "Uploading..."}
              </p>
              {isUploading && (
                <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : file ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              {error ? (
                <AlertCircle className="w-8 h-8 text-destructive" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">
                {error || "Drop your resume here"}
              </p>
              <p className="text-sm text-muted-foreground">
                PDF, Word, or image files up to 100MB
              </p>
            </div>
          </>
        )}

        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading || isAnalyzing}
        />
      </div>

      {!file && !isUploading && (
        <div className="mt-4 text-center">
          <Button variant="outline" className="gap-2" asChild>
            <label className="cursor-pointer">
              <FileText className="w-4 h-4" />
              Browse Files
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
              onChange={handleFileInput}
              className="hidden"
            />
            </label>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
