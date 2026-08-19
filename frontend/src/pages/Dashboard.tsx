import React from 'react';

interface Props {
  productionCount: number;
}

export const Dashboard: React.FC<Props> = ({
  productionCount
}) => {
  return (
    <div className="page-wrap overflow-auto">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            TỔNG QUAN
          </h2>

          <p className="text-[12px] text-slate-500 mt-1">
            Theo dõi nhanh số lượng công việc trong hệ thống.
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6">

        <div className="max-w-5xl mx-auto">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* PRODUCTION */}
            <div className="soft-card group hover:border-blue-300 hover:shadow-md transition-all">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-[12px] font-black text-slate-500 uppercase tracking-[0.12em]">
                    Job Sản Xuất
                  </div>

                  <div className="text-5xl font-black text-slate-900 mt-3">
                    {productionCount}
                  </div>

                  <div className="text-[11px] text-slate-400 mt-2">
                    Ảnh, caption và video đang quản lý
                  </div>

                </div>

                <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">

                  <span className="material-symbols-outlined text-blue-600 text-[34px]">
                    precision_manufacturing
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* INFO */}
          <div className="soft-card mt-5">

            <div className="flex items-start gap-3">

              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">

                <span className="material-symbols-outlined text-slate-600">
                  info
                </span>

              </div>

              <div>

                <div className="text-[13px] font-black text-slate-800">
                  Tools-MMO Local
                </div>

                <div className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                  VIDEO chỉ nhận dữ liệu ảnh từ pipeline SẢN XUẤT.
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};