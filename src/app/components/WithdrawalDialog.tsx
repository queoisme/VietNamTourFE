import { useState } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';
import { WithdrawalRequest } from '../types';
import { Banknote, Smartphone, CreditCard, Wallet } from 'lucide-react';

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guideId: string;
  guideName: string;
  availableBalance: number;
}

export function WithdrawalDialog({
  open,
  onOpenChange,
  guideId,
  guideName,
  availableBalance,
}: WithdrawalDialogProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank_transfer' | 'momo' | 'zalopay' | 'vnpay'>('bank_transfer');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minWithdrawal = 100000; // 100k VND
  const fee = 0.02; // 2% fee

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const amountNum = parseFloat(amount);

    // Validation
    if (!amountNum || amountNum < minWithdrawal) {
      toast.error(`Số tiền rút tối thiểu là ${minWithdrawal.toLocaleString('vi-VN')}đ`);
      setIsSubmitting(false);
      return;
    }

    if (amountNum > availableBalance) {
      toast.error('Số dư không đủ');
      setIsSubmitting(false);
      return;
    }

    if (method === 'bank_transfer') {
      if (!bankName || !accountNumber || !accountName) {
        toast.error('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng');
        setIsSubmitting(false);
        return;
      }
    } else {
      if (!phoneNumber) {
        toast.error('Vui lòng điền số điện thoại ví điện tử');
        setIsSubmitting(false);
        return;
      }
    }

    // Create withdrawal request
    const withdrawal: WithdrawalRequest = {
      id: `WD${Date.now()}`,
      guideId,
      guideName,
      amount: amountNum,
      method,
      accountInfo: {
        bankName: method === 'bank_transfer' ? bankName : undefined,
        accountNumber: method === 'bank_transfer' ? accountNumber : undefined,
        accountName: method === 'bank_transfer' ? accountName : undefined,
        phoneNumber: method !== 'bank_transfer' ? phoneNumber : undefined,
      },
      status: 'pending',
      requestedAt: new Date().toISOString(),
      notes,
    };

    // Save to localStorage
    const existingWithdrawals = JSON.parse(localStorage.getItem('withdrawals') || '[]');
    existingWithdrawals.push(withdrawal);
    localStorage.setItem('withdrawals', JSON.stringify(existingWithdrawals));

    // Dispatch event
    window.dispatchEvent(new Event('withdrawalsUpdated'));

    toast.success('Yêu cầu rút tiền đã được gửi! Chúng tôi sẽ xử lý trong 1-3 ngày làm việc.');
    
    // Reset form
    setAmount('');
    setBankName('');
    setAccountNumber('');
    setAccountName('');
    setPhoneNumber('');
    setNotes('');
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const netAmount = amount ? parseFloat(amount) * (1 - fee) : 0;
  const feeAmount = amount ? parseFloat(amount) * fee : 0;

  const methodIcons = {
    bank_transfer: Banknote,
    momo: Smartphone,
    zalopay: Wallet,
    vnpay: CreditCard,
  };

  const methodLabels = {
    bank_transfer: 'Chuyển khoản ngân hàng',
    momo: 'Ví MoMo',
    zalopay: 'Ví ZaloPay',
    vnpay: 'Ví VNPay',
  };

  const Icon = methodIcons[method];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yêu cầu rút tiền</DialogTitle>
          <DialogDescription>
            Số dư khả dụng: <span className="font-bold text-green-600">{availableBalance.toLocaleString('vi-VN')}đ</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Số tiền muốn rút <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Nhập số tiền..."
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={minWithdrawal}
                max={availableBalance}
                required
              />
              <p className="text-sm text-gray-600">
                Số tiền rút tối thiểu: {minWithdrawal.toLocaleString('vi-VN')}đ
              </p>
            </div>

            {/* Fee Info */}
            {amount && parseFloat(amount) >= minWithdrawal && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Số tiền yêu cầu:</span>
                  <span className="font-semibold">{parseFloat(amount).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí giao dịch (2%):</span>
                  <span className="text-red-600">-{feeAmount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-orange-300">
                  <span className="font-semibold">Số tiền thực nhận:</span>
                  <span className="font-bold text-green-600">{netAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="method">
                Phương thức thanh toán <span className="text-red-500">*</span>
              </Label>
              <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center gap-2">
                      <Banknote className="size-4" />
                      Chuyển khoản ngân hàng
                    </div>
                  </SelectItem>
                  <SelectItem value="momo">
                    <div className="flex items-center gap-2">
                      <Smartphone className="size-4" />
                      Ví MoMo
                    </div>
                  </SelectItem>
                  <SelectItem value="zalopay">
                    <div className="flex items-center gap-2">
                      <Wallet className="size-4" />
                      Ví ZaloPay
                    </div>
                  </SelectItem>
                  <SelectItem value="vnpay">
                    <div className="flex items-center gap-2">
                      <CreditCard className="size-4" />
                      Ví VNPay
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank Transfer Info */}
            {method === 'bank_transfer' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankName">
                    Tên ngân hàng <span className="text-red-500">*</span>
                  </Label>
                  <Select value={bankName} onValueChange={setBankName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn ngân hàng..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vietcombank">Vietcombank</SelectItem>
                      <SelectItem value="VietinBank">VietinBank</SelectItem>
                      <SelectItem value="BIDV">BIDV</SelectItem>
                      <SelectItem value="Agribank">Agribank</SelectItem>
                      <SelectItem value="Techcombank">Techcombank</SelectItem>
                      <SelectItem value="MBBank">MBBank</SelectItem>
                      <SelectItem value="ACB">ACB</SelectItem>
                      <SelectItem value="VPBank">VPBank</SelectItem>
                      <SelectItem value="TPBank">TPBank</SelectItem>
                      <SelectItem value="Sacombank">Sacombank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">
                    Số tài khoản <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountNumber"
                    placeholder="Nhập số tài khoản..."
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountName">
                    Tên chủ tài khoản <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="accountName"
                    placeholder="NGUYEN VAN A"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                    required
                  />
                  <p className="text-sm text-gray-600">
                    Vui lòng nhập chính xác họ tên không dấu
                  </p>
                </div>
              </>
            )}

            {/* E-Wallet Info */}
            {method !== 'bank_transfer' && (
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Số điện thoại ví {methodLabels[method]} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="0912345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="notes"
                placeholder="Thêm ghi chú nếu cần..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Important Notes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Lưu ý quan trọng:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Thời gian xử lý: 1-3 ngày làm việc</li>
                <li>• Phí giao dịch: 2% trên tổng số tiền rút</li>
                <li>• Số tiền rút tối thiểu: {minWithdrawal.toLocaleString('vi-VN')}đ</li>
                <li>• Vui lòng kiểm tra kỹ thông tin tài khoản trước khi gửi yêu cầu</li>
                <li>• Sau khi gửi yêu cầu, bạn không thể chỉnh sửa</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? 'Đang xử lý...' : 'Gửi yêu cầu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
