interface Props {

  name?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

const options = [
  { value: 'sketch', label: 'Sketch' },
  { value: 'younger', label: 'Younger image' },
  { value: 'blurry', label: 'Blurry / CCTV image' },
];

export default function ImageTypeSelector({ name = 'image_type', value, onChange, error, disabled }: Props) {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-slate-700">
        What is the type of the uploaded image? <span className="text-red-500">*</span>
      </label>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`relative cursor-pointer rounded-lg border p-3 flex items-center justify-center text-center transition-shadow ${
                selected
                  ? 'border-blue-600 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:shadow-sm'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
                disabled={disabled}
              />
              <div className="text-sm font-medium text-slate-800">{opt.label}</div>
              {selected && (
                <div className="absolute top-2 right-2 text-blue-600 font-semibold">✓</div>
              )}
            </label>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        This helps us choose the right matching algorithm and prioritize processing for the uploaded
        photo.
      </p>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
