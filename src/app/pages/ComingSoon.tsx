import { Link } from 'react-router'
import { Button } from '../components/ui/button'

export function ComingSoon() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-6xl mb-4">🚧</div>
      <h1 className="text-3xl font-bold mb-2">Sắp ra mắt</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Tính năng này đang được phát triển và sẽ có mặt sớm. Hãy quay lại sau nhé!
      </p>
      <Button asChild>
        <Link to="/">Về trang chủ</Link>
      </Button>
    </div>
  )
}
