import React, { useState } from 'react';
import { X, DollarSign, ArrowUpRight, ArrowDownLeft, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'deposit' | 'withdraw' | 'transfer';
  currentBalance: number;
  onSuccess: () => void;
  onPaymentAction: (amount: number, receiverId?: string, description?: string) => Promise<void>;
  users?: { _id: string; name: string; email: string }[];
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  type,
  currentBalance,
  onSuccess,
  onPaymentAction,
  users = [],
}) => {
  const [amount, setAmount] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getTitle = () => {
    switch (type) {
      case 'deposit':
        return 'Deposit Funds';
      case 'withdraw':
        return 'Withdraw Funds';
      case 'transfer':
        return 'Transfer Funds';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft size={20} className="text-green-600" />;
      case 'withdraw':
        return <ArrowUpRight size={20} className="text-red-600" />;
      case 'transfer':
        return <Send size={20} className="text-blue-600" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (type === 'withdraw' && amountNum > currentBalance) {
      toast.error('Insufficient funds');
      return;
    }

    if (type === 'transfer' && !receiverId) {
      toast.error('Please select a recipient');
      return;
    }

    try {
      setIsProcessing(true);
      await onPaymentAction(amountNum, receiverId, description);

      toast.success(
        type === 'deposit'
          ? 'Deposit successful!'
          : type === 'withdraw'
          ? 'Withdrawal successful!'
          : 'Transfer successful!'
      );

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || `${type} failed`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setReceiverId('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {getIcon()}
              <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isProcessing}
            >
              <X size={24} />
            </button>
          </div>

          {/* Current Balance */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                required
                disabled={isProcessing}
                startAdornment={<DollarSign size={18} className="text-gray-400" />}
                fullWidth
              />
              {type === 'deposit' && (
                <p className="text-xs text-gray-500 mt-1">Max: $1,000,000</p>
              )}
              {type === 'withdraw' && (
                <p className="text-xs text-gray-500 mt-1">
                  Available: ${currentBalance.toFixed(2)}
                </p>
              )}
            </div>

            {/* Recipient Selection (for transfers) */}
            {type === 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient *
                </label>
                <select
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  required
                  disabled={isProcessing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select recipient...</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Description (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <Input
                type="text"
                placeholder={
                  type === 'deposit'
                    ? 'e.g., Initial deposit'
                    : type === 'withdraw'
                    ? 'e.g., Withdrawal to bank'
                    : 'e.g., Investment payment'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isProcessing}
                fullWidth
              />
            </div>

            {/* Mock Payment Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Mock Payment:</strong> This is a simulated transaction for demonstration purposes. No real money is involved.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Processing...' : `${type === 'deposit' ? 'Deposit' : type === 'withdraw' ? 'Withdraw' : 'Transfer'}`}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
