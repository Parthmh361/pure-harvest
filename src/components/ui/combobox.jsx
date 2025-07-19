import { useState } from "react"

export function Combobox({ options, value, onChange, placeholder = "Select...", clearable = false }) {
  const [query, setQuery] = useState("")
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="relative">
      <input
        type="text"
        value={value ? options.find(opt => opt.value === value)?.label : query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
        autoComplete="off"
      />
      {clearable && value && (
        <button
          type="button"
          className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
          onClick={() => { onChange(""); setQuery(""); }}
        >
          ×
        </button>
      )}
      {query && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-gray-500">No results</div>
          ) : (
            filteredOptions.map(opt => (
              <div
                key={opt.value}
                className="px-3 py-2 cursor-pointer hover:bg-green-100"
                onClick={() => { onChange(opt.value); setQuery(""); }}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}