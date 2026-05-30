import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { WithdrawalRequest } from '../types';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Banknote,
  Smartphone,
  CreditCard,
  Wallet,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface WithdrawalHistoryProps {
  guideId: string;
}

export function WithdrawalHistory({ guideId }: WithdrawalHistoryProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    loadWithdrawals();

    const handleUpdate = () => loadWithdrawals();
    window.addEventListener('withdrawalsUpdated', handleUpdate);
    return () => window.removeEventListener('withdrawalsUpdated', handleUpdate);
  }, [guideId]);

  const loadWithdrawals = () => {
    const allWithdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');
    const guideWithdrawals = allWithdrawals
      .filter((w: WithdrawalRequest) => w.guideId === guideId)
      .sort((a: WithdrawalRequest, b: WithdrawalRequest) => 
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
    setWithdrawals(guideWithdrawals);
  };

  const statusConfig = {
    pending: {
      label: 'Chờ xử lý',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    processing: {
      label: 'Đang xử lý',
      icon: Loader2,
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    completed: {
      label: 'Hoàn thành',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    rejected: {
      label: 'Từ chối',
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-300',
    },
  };

  const methodConfig = {
    bank_transfer: { label: 'Ngân hàng', icon: Banknote },
    momo: { label: 'MoMo', icon: Smartphone },
    zalopay: { label: 'ZaloPay', icon: Wallet },
    vnpay: { label: 'VNPay', icon: CreditCard },
  };

  const handleViewDetails = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailDialog(true);
  };

  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử rút tiền</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Banknote className="size-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">Chưa có yêu cầu rút tiền nào</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử rút tiền</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã GD</TableHead>
                  <TableHead>Ngày yêu cầu</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => {
                  const StatusIcon = statusConfig[withdrawal.status].icon;
                  const MethodIcon = methodConfig[withdrawal.method].icon;
                  
                  return (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-mono text-sm">{withdrawal.id}</TableCell>
                      <TableCell>
                        {new Date(withdrawal.requestedAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {withdrawal.amount.toLocaleString('vi-VN')}đ
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MethodIcon className="size-4 text-gray-600" />
                          <span className="text-sm">{methodConfig[withdrawal.method].label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig[withdrawal.status].className}>
                          <StatusIcon className={`size-3 mr-1 ${withdrawal.status === 'processing' ? 'animate-spin' : ''}`} />
                          {statusConfig[withdrawal.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(withdrawal)}
                        >
                          <Eye className="size-4 mr-1" />
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu rút tiền</DialogTitle>
          </DialogHeader>

          {selectedWithdrawal && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Trạng thái:</span>
                <Badge 
                  variant="outline" 
                  className={`${statusConfig[selectedWithdrawal.status].className} text-base px-3 py-1`}
                >
                  {React.createElement(statusConfig[selectedWithdrawal.status].icon, { 
                    className: `size-4 mr-1 ${selectedWithdrawal.status === 'processing' ? 'animate-spin' : ''}` 
                  })}
                  {statusConfig[selectedWithdrawal.status].label}
                </Badge>
              </div>

              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mã giao dịch</p>
                  <p className="font-mono font-semibold">{selectedWithdrawal.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ngày yêu cầu</p>
                  <p className="font-semibold">
                    {new Date(selectedWithdrawal.requestedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Amount Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Số tiền yêu cầu:</span>
                  <span className="font-semibold">{selectedWithdrawal.amount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Phí giao dịch (2%):</span>
                  <span className="text-red-600">-{(selectedWithdrawal.amount * 0.02).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-300">
                  <span className="font-semibold">Số tiền thực nhận:</span>
                  <span className="font-bold text-green-600">
                    {(selectedWithdrawal.amount * 0.98).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Phương thức thanh toán</p>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {React.createElement(methodConfig[selectedWithdrawal.method].icon, { className: 'size-5' })}
                  <span className="font-medium">{methodConfig[selectedWithdrawal.method].label}</span>
                </div>
              </div>

              {/* Account Info */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Thông tin tài khoản</h4>
                {selectedWithdrawal.method === 'bank_transfer' ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ngân hàng:</span>
                      <span className="font-medium">{selectedWithdrawal.accountInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tài khoản:</span>
                      <span className="font-mono font-medium">{selectedWithdrawal.accountInfo.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chủ tài khoản:</span>
                      <span className="font-medium">{selectedWithdrawal.accountInfo.accountName}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số điện thoại:</span>
                    <span className="font-mono font-medium">{selectedWithdrawal.accountInfo.phoneNumber}</span>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedWithdrawal.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Ghi chú</p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{selectedWithdrawal.notes}</p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedWithdrawal.adminNotes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Phản hồi từ Admin</p>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-900">{selectedWithdrawal.adminNotes}</p>
                  </div>
                </div>
              )}

              {/* Processed Date */}
              {selectedWithdrawal.processedAt && (
                <div className="text-sm text-gray-600">
                  Đã xử lý: {new Date(selectedWithdrawal.processedAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
