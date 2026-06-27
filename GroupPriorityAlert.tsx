import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface GroupPriorityAlertProps {
  isOpen: boolean;
  groupName: string | null;
  onContinueGroup: () => void;
  onReturnToIndividual: () => void;
}

export default function GroupPriorityAlert({
  isOpen,
  groupName,
  onContinueGroup,
  onReturnToIndividual,
}: GroupPriorityAlertProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <AlertDialogTitle>그룹 무전 수신</AlertDialogTitle>
          </div>
        </AlertDialogHeader>

        <AlertDialogDescription className="space-y-3 pt-2">
          <p className="text-base font-semibold text-slate-900">
            <span className="text-orange-600">{groupName}</span> 그룹에서 무전이 왔습니다.
          </p>
          <p className="text-sm text-slate-600">
            현재 진행 중인 개별 무전이 일시 중단됩니다.
          </p>
          <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
            💡 팁: 그룹 무전이 끝난 후 개별 무전으로 돌아갈 수 있습니다.
          </p>
        </AlertDialogDescription>

        <div className="flex gap-3 pt-4">
          <AlertDialogCancel onClick={onReturnToIndividual} className="flex-1">
            개별 무전 계속
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onContinueGroup}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            그룹 무전 수신
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
