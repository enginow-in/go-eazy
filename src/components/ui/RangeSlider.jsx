import React, { memo, useCallback } from "react";

export const RangeSlider = memo(
  ({
    min = 0,
    max = 100000,
    step = 1000,
    value,
    onChange,
    showValue = true,
    formatValue,
    className = "",
  }) => {
    const handleChange = useCallback(
      (e) => {
        onChange(Number(e.target.value));
      },
      [onChange]
    );

    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className={`w-full ${className}`}>
        {showValue && (
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-gray-500">
              Price Range
            </span>

            <span className="text-sm font-bold text-brand-600">
              {formatValue
                ? formatValue(value)
                : `₹${value.toLocaleString("en-IN")}`}
            </span>
          </div>
        )}

        <div className="relative">
          {/* Background Track */}
          <div className="absolute top-1/2 left-0 w-full h-1.5 rounded-full bg-gray-200 -translate-y-1/2" />

          {/* Active Track */}
          <div
            className="absolute top-1/2 left-0 h-1.5 rounded-full bg-brand-500 -translate-y-1/2"
            style={{ width: `${percentage}%` }}
          />

          {/* Slider */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className="relative w-full appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-brand-500
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-white
              [&::-webkit-slider-thumb]:shadow-lg

              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-brand-500
              [&::-moz-range-thumb]:border-none
            "
          />
        </div>

        <div className="flex justify-between mt-2 text-[10px] font-semibold text-gray-400">
          <span>₹{min.toLocaleString("en-IN")}</span>
          <span>₹{max >= 100000 ? "1L+" : max.toLocaleString("en-IN")}</span>
        </div>
      </div>
    );
  }
);

RangeSlider.displayName = "RangeSlider";