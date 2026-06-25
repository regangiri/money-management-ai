type MarketStatusProps = {
  isOpen: boolean;
  name: string;
};

export function MarketStatus({ isOpen, name }: MarketStatusProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
        isOpen
          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      }`}
      title={name}
    >
      <span className="relative flex size-2">
        {isOpen && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
        )}
        <span
          className={`relative inline-flex size-2 rounded-full ${
            isOpen ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      </span>
      Market {isOpen ? 'open' : 'closed'}
    </span>
  );
}
