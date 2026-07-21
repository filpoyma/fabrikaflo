export type SegmentedOption<T extends string> = {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
}

export function SegmentedControl<const T extends string>({
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div style={{ display: 'flex', gap: '8px' }} role="radiogroup">
      {options.map((option) => {
        const isSelected = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: `2px solid ${isSelected ? 'var(--color-sage)' : 'var(--border-light)'}`,
              backgroundColor: isSelected
                ? 'rgba(var(--color-sage-rgb, 130, 160, 100), 0.08)'
                : 'transparent',
              color: isSelected ? 'var(--color-sage)' : 'var(--text-secondary)',
              fontWeight: isSelected ? 600 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
