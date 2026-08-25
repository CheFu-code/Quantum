import { createId } from "./conversations";
import type { ImageAttachment, SpeechRecognitionLike } from "./types";

export function getSpeechRecognition() {
  if (typeof window === "undefined") return null;

  const SpeechRecognitionConstructor = (
    window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    }
  ).SpeechRecognition || (
    window as typeof window & {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    }
  ).webkitSpeechRecognition;

  return SpeechRecognitionConstructor ? new SpeechRecognitionConstructor() : null;
}

export function fileToAttachment(file: File) {
  return new Promise<ImageAttachment>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const [, base64 = ""] = result.split(",");

      if (!base64) {
        reject(new Error("Could not read file."));
        return;
      }

      resolve({
        id: createId(file.type.startsWith("image/") ? "image" : "file"),
        name: file.name,
        mimeType: file.type || inferMimeType(file.name),
        data: base64,
        size: file.size,
      });
    };

    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function inferMimeType(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "csv") return "text/csv";
  if (extension === "json") return "application/json";
  if (extension === "md" || extension === "markdown") return "text/markdown";
  if (extension === "pdf") return "application/pdf";
  if (extension === "py") return "text/x-python";
  if (extension === "sql") return "text/x-sql";
  if (extension === "ts" || extension === "tsx") return "text/typescript";
  if (extension === "js" || extension === "jsx") return "text/javascript";

  return "text/plain";
}

export function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 5) return "Burning the midnight oil?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 22) return "Good evening";
  return "Hello there";
}
