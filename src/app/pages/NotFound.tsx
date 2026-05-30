import { Link } from 'react-router';
import { Button } from '../components/ui/button';

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-orange-600 mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Trang không tồn tại</h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="bg-orange-600 hover:bg-orange-700">
              Về trang chủ
            </Button>
          </Link>
          <Link to="/tours">
            <Button variant="outline">Khám phá tour</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
