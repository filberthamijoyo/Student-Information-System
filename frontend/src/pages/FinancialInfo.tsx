import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { financialAPI } from '../services/api';

export function FinancialInfo() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const { data: account, isLoading } = useQuery({
    queryKey: ['financial-account'],
    queryFn: () => financialAPI.getAccount().then(res => res.data.data),
  });

  const { data: charges } = useQuery({
    queryKey: ['charges'],
    queryFn: () => financialAPI.getCharges().then(res => res.data.data),
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => financialAPI.getPayments().then(res => res.data.data),
  });

  const unpaidCharges = charges?.filter((c: any) => !c.isPaid) || [];
  const totalDue = unpaidCharges.reduce((sum: number, c: any) => sum + c.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Financial Information</h1>
        <p className="mt-2 text-gray-600">View your account balance, charges, and payments</p>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`bg-gradient-to-br ${
          account && account.balance < 0
            ? 'from-red-500 to-red-600'
            : 'from-green-500 to-green-600'
        } rounded-lg shadow-lg p-6 text-white md:col-span-2`}>
          <div className="text-sm font-medium opacity-90">Current Balance</div>
          <div className="mt-2 text-5xl font-bold">
            ¥{account?.balance.toLocaleString() || '0'}
          </div>
          {account && account.balance < 0 && (
            <div className="mt-2 text-sm opacity-90">
              Payment due: ¥{Math.abs(account.balance).toLocaleString()}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="text-sm font-medium text-gray-600">Tuition Due</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            ¥{account?.tuitionDue.toLocaleString() || '0'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="text-sm font-medium text-gray-600">Housing Due</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            ¥{account?.housingDue.toLocaleString() || '0'}
          </div>
        </div>
      </div>

      {/* Alert for Outstanding Balance */}
      {account && account.balance < 0 && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Outstanding Balance
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You have an outstanding balance of ¥{Math.abs(account.balance).toLocaleString()}. Please make a payment to avoid registration holds.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShowPaymentForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Make Payment Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button className="border-b-2 border-blue-500 py-4 px-6 text-center text-sm font-medium text-blue-600">
              Charges
            </button>
            <button className="border-transparent py-4 px-6 text-center text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Payments
            </button>
          </nav>
        </div>

        {/* Charges Tab */}
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Charges</h3>

          {unpaidCharges.length > 0 && (
            <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <span className="font-medium">Total Unpaid: ¥{totalDue.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {charges?.map((charge: any) => (
                  <tr key={charge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {charge.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {charge.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                      ¥{charge.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                      {new Date(charge.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        charge.isPaid
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {charge.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!charges || charges.length === 0) && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No charges</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any charges at the moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments?.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                      ¥{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payment.method.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payment.referenceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!payments || payments.length === 0) && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payments</h3>
              <p className="mt-1 text-sm text-gray-500">No payment history to display.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
