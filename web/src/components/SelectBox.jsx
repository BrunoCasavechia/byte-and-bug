import Select from 'react-select';

// react-select: a dropdown built from <div>s, very common in company apps.
// It is NOT a native <select>: to automate it you click to open, then click an option.
// The menu options get the class "rs__option" (classNamePrefix below).
export function SelectBox({ inputId, options, value, onChange, placeholder = 'Selecione', invalid, describedBy, testId }) {
  const selected = options.find((o) => o.value === value) || null;
  return (
    <div data-testid={testId}>
      <Select
        inputId={inputId}
        classNamePrefix="rs"
        className={`rs${invalid ? ' rs--invalid' : ''}`}
        unstyled
        options={options}
        value={selected}
        onChange={(opt) => onChange(opt?.value || '')}
        placeholder={placeholder}
        noOptionsMessage={() => 'Nada encontrado'}
        aria-invalid={invalid ? 'true' : 'false'}
        aria-errormessage={invalid ? describedBy : undefined}
        menuPlacement="auto"
      />
    </div>
  );
}
