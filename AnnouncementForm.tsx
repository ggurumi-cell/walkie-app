import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { AlertCircle, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnnouncementFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    priority: "normal" | "urgent";
  }) => Promise<void>;
  isLoading?: boolean;
  senderName: string;
}

export default function AnnouncementForm({
  onSubmit,
  isLoading = false,
  senderName,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        priority,
      });
      setTitle("");
      setContent("");
      setPriority("normal");
    } catch (error) {
      console.error("공지 전송 실패:", error);
      alert("공지 전송에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-white shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-bold">전체 공지 보내기</h3>
        <p className="text-sm text-gray-500 mt-1">
          발신자: <span className="font-semibold">{senderName}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 제목 입력 */}
        <div>
          <label className="block text-sm font-medium mb-2">제목</label>
          <Input
            type="text"
            placeholder="공지 제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            disabled={isSubmitting || isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/200</p>
        </div>

        {/* 내용 입력 */}
        <div>
          <label className="block text-sm font-medium mb-2">내용</label>
          <Textarea
            placeholder="공지 내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            disabled={isSubmitting || isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {content.length} 글자
          </p>
        </div>

        {/* 우선순위 선택 */}
        <div>
          <label className="block text-sm font-medium mb-2">우선순위</label>
          <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
            <SelectTrigger disabled={isSubmitting || isLoading}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  일반
                </span>
              </SelectItem>
              <SelectItem value="urgent">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  긴급
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 전송 버튼 */}
        <Button
          type="submit"
          disabled={isSubmitting || isLoading || !title.trim() || !content.trim()}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Send className="w-4 h-4 mr-2" />
          {isSubmitting ? "전송 중..." : "전체 공지 전송"}
        </Button>
      </form>
    </Card>
  );
}
