import { PurchaseError as PurchaseErrorType } from '../utils/errorHandlers';

interface PurchaseErrorProps {
  error: PurchaseErrorType;
  onRetry?: () => void;
}

export function PurchaseError({ error, onRetry }: PurchaseErrorProps) {
  const getIcon = () => {
    switch (error.type) {
      case 'network':
        return (
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        );
      case 'payment':
        return (
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'timeout':
        return (
          <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBackgroundColor = () => {
    return error.type === 'timeout' ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200';
  };

  const getTextColor = () => {
    return error.type === 'timeout' ? 'text-orange-800' : 'text-red-800';
  };

  return (
    <div className={`p-4 ${getBackgroundColor()} border rounded-lg`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${getTextColor()}`}>
            {error.message}
          </h3>
          {error.details && (
            <div className="mt-2 text-sm text-gray-700">
              <p className="whitespace-pre-line">{error.details}</p>
            </div>
          )}
          {error.recoverable && onRetry && (
            <div className="mt-3">
              <button
                onClick={onRetry}
                className="text-sm bg-white px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}