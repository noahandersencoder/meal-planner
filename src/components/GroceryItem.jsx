function GroceryItem({ item, checked, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
        checked
          ? 'bg-gray-100 opacity-60'
          : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
          checked
            ? 'bg-primary-600 border-primary-600'
            : 'border-gray-300'
        }`}
      >
        {checked && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1">
        <span className={`font-medium ${checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {item.name}
        </span>
        <span className="text-gray-500 ml-2">
          {item.amount} {item.unit}
        </span>
      </div>

      <span className="text-sm text-gray-400">
        ${item.cost.toFixed(2)}
      </span>
    </div>
  )
}

export default GroceryItem
