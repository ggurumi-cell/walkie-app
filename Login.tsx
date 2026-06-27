import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LoginProps {
  onLoginSuccess: (user: { id: number; name: string; employeeId: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginMutation = trpc.walkie.login.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId.trim() || !authCode.trim()) {
      toast.error("사번과 인증번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginMutation.mutateAsync({
        employeeId: employeeId.trim(),
        authCode: authCode.trim(),
      });

      if (result.success) {
        toast.success(`${result.user.name}님 환영합니다!`);
        onLoginSuccess(result.user);
      }
    } catch (error) {
      toast.error("로그인 실패: 사번 또는 인증번호를 확인해주세요.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          {/* 헤더 */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">무전기</h1>
            <p className="text-slate-600">실시간 무전 통신 시스템</p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                사번
              </label>
              <Input
                type="text"
                placeholder="예: EMP001"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                인증번호
              </label>
              <Input
                type="password"
                placeholder="인증번호 입력"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "로그인"
              )}
            </Button>
          </form>

          {/* 테스트 계정 안내 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900 font-semibold mb-2">테스트 계정:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• 사번: EMP001 / 인증번호: 1234</li>
              <li>• 사번: EMP002 / 인증번호: 5678</li>
              <li>• 사번: EMP003 / 인증번호: 9012</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
