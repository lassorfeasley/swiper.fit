import React from 'react';
import { useDayPicker } from 'react-day-picker';

function isDateSelected(date, selected) {
  if (!selected || !selected.from) return false;
  if (selected.to) {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const fromDay = new Date(selected.from.getFullYear(), selected.from.getMonth(), selected.from.getDate());
    const toDay = new Date(selected.to.getFullYear(), selected.to.getMonth(), selected.to.getDate());
    return day >= fromDay && day <= toDay;
  }
  return date.toDateString() === selected.from.toDateString();
}

export function CustomRow(props) {
  const { selected, mode } = useDayPicker();

  const isRangeMode = mode === 'range' && selected && selected.from && selected.to;

  const segments = [];
  if (isRangeMode) {
    let currentSegment = [];
    props.dates.forEach((date, index) => {
      if (date && isDateSelected(date, selected)) {
        currentSegment.push({ date, index });
      } else {
        if (currentSegment.length > 0) {
          segments.push(currentSegment);
          currentSegment = [];
        }
      }
    });
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }
  }
  
  const PADDING = 0.25; // p-1 in rem
  const GAP = 0.5;      // gap-2 in rem
  const NUM_DAYS = 7;
  
  const totalGapWidth = (NUM_DAYS - 1) * GAP;
  const totalPaddingWidth = 2 * PADDING;
  const cellWidth = `calc((100% - ${totalGapWidth + totalPaddingWidth}rem) / ${NUM_DAYS})`;
  
  return (
    <tr className="relative" style={{ zIndex: 1 }}>
      {isRangeMode && segments.map((segment, i) => {
        const startIndex = segment[0].index;
        const segmentLength = segment.length;
        
        const startOffset = `calc(${PADDING}rem + ${startIndex} * ${cellWidth} + ${startIndex * GAP}rem)`;
        const wrapperWidth = `calc(${segmentLength} * ${cellWidth} + ${Math.max(0, segmentLength - 1)} * ${GAP}rem)`;

        const wrapperStyle = {
          position: 'absolute',
          top: '2px',
          bottom: '2px',
          left: startOffset,
          width: wrapperWidth,
          zIndex: -1,
        };
        
        return (
          <td key={i} colSpan={7} className="p-0">
             <div
                className="bg-white shadow-calendar-selected rounded-sm h-full"
                style={wrapperStyle}
              />
          </td>
        );
      })}
      {props.children}
    </tr>
  );
} 