import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: number;
  title: string;
  content: string;
  senderName: string;
  priority: "normal" | "urgent";
  createdAt: Date;
}

interface AnnouncementBannerProps {
  announcement: Announcement | null;
  onClose: () => void;
}

export default function AnnouncementBanner({
  announcement,
  onClose,
}: AnnouncementBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (announcement) {
      setIsVisible(true);
      // 10초 후 자동 닫기
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [announcement, onClose]);

  if (!announcement || !isVisible) {
    return null;
  }

  const isUrgent = announcement.priority === "urgent";
  const bgColor = isUrgent
    ? "bg-red-500"
    : "bg-yellow-500";
  const textColor = isUrgent ? "text-white" : "text-gray-900";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${bgColor} ${textColor} p-4 shadow-lg animate-in slide-in-from-top-2 duration-300`}
    >
      <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {isUrgent && (
            <AlertCircle className="w-5 h-5 mt-1 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-bold text-lg">{announcement.title}</div>
            <div className="text-sm opacity-90 mt-1">{announcement.content}</div>
            <div className="text-xs opacity-75 mt-2">
              {announcement.senderName} •{" "}
              {new Date(announcement.createdAt).toLocaleTimeString("ko-KR")}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
          }}
          className={`flex-shrink-0 ${textColor} hover:opacity-75`}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
