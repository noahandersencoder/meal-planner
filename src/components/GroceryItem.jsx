function GroceryItem({ item, checked, onToggle, onRemove }) {
  const handleRemove = (e) => {
    e.stopPropagation()
    onRemove?.()
  }

  return (
    <div
      onClick={onToggle}
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all group ${
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

      <span className="text-sm text-gray-400 mr-2">
        ${item.cost.toFixed(2)}
      </span>

      {onRemove && (
        <button
          onClick={handleRemove}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1"
          title="Remove item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default GroceryItem
