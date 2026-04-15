import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'

const variantStyles = {
    orange: {
        focus: 'focus:ring-orange-500/20 focus:border-orange-500',
        active: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    },
    blue: {
        focus: 'focus:ring-blue-500/20 focus:border-blue-500',
        active: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
}

const Select = ({ value, onChange, options, placeholder = "Pilih...", label, className = "", variant = "orange" }) => {
    const selectedOption = options.find(opt => opt.value === value)
    const colors = variantStyles[variant] || variantStyles.orange

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
            )}
            <Listbox value={value} onChange={onChange}>
                <div className="relative">
                    <Listbox.Button className={`relative w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-left focus:ring-2 ${colors.focus} transition-all cursor-pointer`}>
                        <span className={`block truncate ${!value ? 'text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                            {selectedOption?.label || placeholder}
                        </span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                            </svg>
                        </span>
                    </Listbox.Button>
                    <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <Listbox.Options className="absolute z-[80] mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-auto focus:outline-none">
                            {options.map((option) => (
                                <Listbox.Option
                                    key={option.value}
                                    value={option.value}
                                    className={({ active }) =>
                                        `relative cursor-pointer select-none py-3 px-4 transition-colors ${active ? colors.active : 'text-gray-800 dark:text-gray-200'
                                        }`
                                    }
                                >
                                    {({ selected }) => (
                                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                                            {option.label}
                                        </span>
                                    )}
                                </Listbox.Option>
                            ))}
                        </Listbox.Options>
                    </Transition>
                </div>
            </Listbox>
        </div>
    )
}

export default Select
