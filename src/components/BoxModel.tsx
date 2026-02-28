// components/BoxModel.tsx - Visual CSS Box Model Diagram

interface BoxModelProps {
  width: number;
  height: number;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  borderTopWidth: string;
  borderRightWidth: string;
  borderBottomWidth: string;
  borderLeftWidth: string;
}

function px(val: string): string {
  return parseInt(val) === 0 ? '-' : parseInt(val).toString();
}

export default function BoxModel(props: BoxModelProps) {
  return (
    <div className="w-full flex justify-center py-2">
      <div className="relative" style={{ width: '240px', height: '180px' }}>

        {/* Margin Layer */}
        <div className="absolute inset-0 border border-dashed border-slate-300 bg-orange-50/30 rounded-md flex items-center justify-center">
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] text-orange-400 font-medium">{px(props.marginTop)}</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-orange-400 font-medium">{px(props.marginBottom)}</span>
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-orange-400 font-medium">{px(props.marginLeft)}</span>
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-orange-400 font-medium">{px(props.marginRight)}</span>

          {/* Border Layer */}
          <div className="absolute inset-4 border border-slate-300 bg-yellow-50/40 rounded flex items-center justify-center">
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[9px] text-yellow-600 font-medium">{px(props.borderTopWidth)}</span>
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] text-yellow-600 font-medium">{px(props.borderBottomWidth)}</span>
            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] text-yellow-600 font-medium">{px(props.borderLeftWidth)}</span>
            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-yellow-600 font-medium">{px(props.borderRightWidth)}</span>

            {/* Padding Layer */}
            <div className="absolute inset-4 border border-slate-200 bg-green-50/40 rounded flex items-center justify-center">
              <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[9px] text-green-600 font-medium">{px(props.paddingTop)}</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[9px] text-green-600 font-medium">{px(props.paddingBottom)}</span>
              <span className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[9px] text-green-600 font-medium">{px(props.paddingLeft)}</span>
              <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[9px] text-green-600 font-medium">{px(props.paddingRight)}</span>

              {/* Content */}
              <div className="bg-slate-700 text-white text-xs font-mono rounded px-3 py-1.5 shadow-sm">
                {props.width} x {props.height}
              </div>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute -bottom-5 left-0 flex gap-3 text-[8px] font-medium">
          <span className="text-orange-400">margin</span>
          <span className="text-yellow-600">border</span>
          <span className="text-green-600">padding</span>
        </div>
      </div>
    </div>
  );
}
