import { useNavigate } from 'react-router';
import { X } from 'lucide-react';

interface VerifyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VerifyGuideModal({ isOpen, onClose }: VerifyGuideModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmitCertificate = () => {
    onClose();
    navigate('/guide-application');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Yêu cầu xác minh hướng dẫn viên
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Để sử dụng các tính năng như tạo tour, bạn cần nộp chứng chỉ hướng dẫn viên du lịch.
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleSubmitCertificate}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Nộp chứng chỉ
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
