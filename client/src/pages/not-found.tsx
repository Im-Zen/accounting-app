import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-bold">صفحه مورد نظر یافت نشد</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          متأسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد یا حذف شده است.
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 sm:space-x-reverse justify-center mt-8">
          <Button
            onClick={() => setLocation("/")}
            variant="default"
            className="px-8"
          >
            بازگشت به صفحه اصلی
          </Button>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="px-8"
          >
            بازگشت به صفحه قبلی
          </Button>
        </div>
      </div>
    </div>
  );
}