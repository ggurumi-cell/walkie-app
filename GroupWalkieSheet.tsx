import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Radio } from "lucide-react";

interface WalkieGroup {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GroupWalkieSheetProps {
  isOpen: boolean;
  onClose: () => void;
  groups: WalkieGroup[];
  selectedGroup: WalkieGroup | null;
  onSelectGroup: (group: WalkieGroup) => void;
  transmitState: "idle" | "transmitting" | "receiving";
  onTransmitToggle: () => void;
  onStopReceiving: () => void;
  receivingFrom: string | null;
}

export default function GroupWalkieSheet({
  isOpen,
  onClose,
  groups,
  selectedGroup,
  onSelectGroup,
  transmitState,
  onTransmitToggle,
  onStopReceiving,
  receivingFrom,
}: GroupWalkieSheetProps) {
  const isReceiving = transmitState === "receiving";
  const isTransmitting = transmitState === "transmitting";

  const getButtonColor = () => {
    switch (transmitState) {
      case "transmitting":
        return "bg-green-500 hover:bg-green-600";
      case "receiving":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-400 hover:bg-gray-500";
    }
  };

  const getButtonText = () => {
    switch (transmitState) {
      case "transmitting":
        return "송신 중...";
      case "receiving":
        return "상대 무전 수신 중...";
      default:
        return "그룹 무전 - 누르고 말하기";
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>그룹 무전</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 그룹 선택 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              그룹 선택
            </label>
            <div className="space-y-2">
              {groups.length === 0 ? (
                <p className="text-slate-500 text-center py-4">
                  사용 가능한 그룹이 없습니다.
                </p>
              ) : (
                groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => onSelectGroup(group)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedGroup?.id === group.id
                        ? "bg-green-100 border-2 border-green-500 text-slate-900 font-semibold"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="font-medium">{group.name}</div>
                    {group.description && (
                      <div className="text-xs text-slate-500 mt-1">
                        {group.description}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 그룹 무전 버튼 */}
          {selectedGroup && (
            <Card className="p-6">
              <p className="text-slate-600 mb-4 text-center">
                선택된 그룹: <span className="font-bold">{selectedGroup.name}</span>
              </p>

              <button
                onClick={onTransmitToggle}
                disabled={isReceiving}
                className={`w-full h-32 rounded-full ${getButtonColor()} text-white font-bold text-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-col gap-2 shadow-lg`}
              >
                <Radio className="w-8 h-8" />
                <span>{getButtonText()}</span>
              </button>

              {/* 수신 중 상태 표시 */}
              {isReceiving && (
                <div className="mt-4 text-center">
                  <p className="text-blue-600 font-semibold animate-pulse mb-3">
                    {receivingFrom}님의 무전을 수신 중입니다...
                  </p>
                  <Button
                    variant="outline"
                    onClick={onStopReceiving}
                    className="border-blue-500 text-blue-600"
                  >
                    수신 종료
                  </Button>
                </div>
              )}

              {/* 송신 중 상태 표시 */}
              {isTransmitting && (
                <div className="mt-4 text-center">
                  <p className="text-green-600 font-semibold animate-pulse">
                    송신 중입니다...
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
