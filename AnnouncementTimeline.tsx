import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Announcement {
  id: number;
  title: string;
  content: string;
  senderName: string;
  priority: "normal" | "urgent";
  createdAt: Date;
}

interface AnnouncementTimelineProps {
  announcements: Announcement[];
  onDelete?: (id: number) => void;
}

export default function AnnouncementTimeline({
  announcements,
  onDelete,
}: AnnouncementTimelineProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (announcements.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 z-40">
      <Card className="bg-white shadow-lg">
        <div
          className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer flex items-center justify-between rounded-t-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div>
            <div className="font-bold">오늘의 공지</div>
            <div className="text-sm opacity-90">{announcements.length}개</div>
          </div>
          {isOpen ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </div>

        {isOpen && (
          <div className="overflow-y-auto max-h-80 divide-y">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-4 ${
                  announcement.priority === "urgent"
                    ? "bg-red-50 border-l-4 border-red-500"
                    : "bg-yellow-50 border-l-4 border-yellow-500"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      {announcement.title}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {announcement.content}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {announcement.senderName} •{" "}
                      {new Date(announcement.createdAt).toLocaleTimeString(
                        "ko-KR"
                      )}
                    </div>
                  </div>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(announcement.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
