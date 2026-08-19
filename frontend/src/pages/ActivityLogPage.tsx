import React, {
  useMemo,
  useState
} from 'react';

import {
  ActivityLog,
  ActivityModule,
  ActivityStatus,
  ActivityType
} from '../types';

import { PageLayout } from '../layouts/PageLayout';
import { Button } from '../components/ui/Button';


interface Props {
  items: ActivityLog[];

  setItems:
    React.Dispatch<
      React.SetStateAction<
        ActivityLog[]
      >
    >;
}


type FilterModule =
  | 'ALL'
  | ActivityModule;


type FilterStatus =
  | 'ALL'
  | ActivityStatus;


export const ActivityLogModule:
  React.FC<Props> = ({
    items,
    setItems
  }) => {

  // =========================================================
  // FILTER STATE
  // =========================================================

  const [
    search,
    setSearch
  ] = useState('');


  const [
    filterModule,
    setFilterModule
  ] =
    useState<FilterModule>(
      'ALL'
    );


  const [
    filterStatus,
    setFilterStatus
  ] =
    useState<FilterStatus>(
      'ALL'
    );


  // =========================================================
  // EDIT STATE
  // =========================================================

  const [
    editingId,
    setEditingId
  ] =
    useState<string | null>(
      null
    );


  const [
    editNote,
    setEditNote
  ] =
    useState('');


  const [
    editMessage,
    setEditMessage
  ] =
    useState('');


  // =========================================================
  // FILTER
  // =========================================================

  const filteredItems =
    useMemo(() => {

      const keyword =
        search
          .trim()
          .toLowerCase();


      return [...items]
        .filter(item => {

          if (
            filterModule !==
              'ALL' &&
            item.module !==
              filterModule
          ) {
            return false;
          }


          if (
            filterStatus !==
              'ALL' &&
            item.status !==
              filterStatus
          ) {
            return false;
          }


          if (!keyword) {
            return true;
          }


          const haystack = [
            item.stt || '',
            item.subject || '',
            item.message || '',
            item.filePath || '',
            item.error || '',
            item.note || '',
            item.module || '',
            item.type || '',
            item.status || ''
          ]
            .join(' ')
            .toLowerCase();


          return haystack.includes(
            keyword
          );

        })
        .sort(
          (
            a,
            b
          ) =>
            b.createdAt -
            a.createdAt
        );

    }, [
      items,
      search,
      filterModule,
      filterStatus
    ]);


  // =========================================================
  // HELPERS
  // =========================================================

  const formatDate =
    (
      timestamp: number
    ) => {

    try {

      return new Date(
        timestamp
      ).toLocaleString();

    } catch {

      return '';

    }

  };


  const moduleLabel =
    (
      module:
        ActivityModule
    ) => {

    switch (
      module
    ) {

      case 'PRODUCTION':
        return 'SẢN XUẤT';

      case 'VIDEO':
        return 'VIDEO';

      case 'SYSTEM':
        return 'HỆ THỐNG';

      default:
        return module;

    }

  };


  const typeLabel =
    (
      type:
        ActivityType
    ) => {

    switch (
      type
    ) {

      case 'CREATE_IMAGE':
        return 'TẠO ẢNH';

      case 'REGENERATE_IMAGE':
        return 'TẠO LẠI ẢNH';

      case 'SAVE_IMAGE':
        return 'LƯU ẢNH';

      case 'CREATE_CAPTION':
        return 'TẠO CAPTION';

      case 'SAVE_CAPTION':
        return 'LƯU CAPTION';

      case 'CREATE_VIDEO':
        return 'TẠO VIDEO';

      case 'SAVE_VIDEO':
        return 'LƯU VIDEO';

      case 'CONFIG_CREATE':
        return 'THÊM CẤU HÌNH';

      case 'CONFIG_UPDATE':
        return 'SỬA CẤU HÌNH';

      case 'CONFIG_DELETE':
        return 'XÓA CẤU HÌNH';

      case 'OTHER':
        return 'KHÁC';

      default:
        return type;

    }

  };


  const statusLabel =
    (
      status:
        ActivityStatus
    ) => {

    switch (
      status
    ) {

      case 'SUCCESS':
        return 'THÀNH CÔNG';

      case 'FAILED':
        return 'THẤT BẠI';

      case 'RUNNING':
        return 'ĐANG CHẠY';

      case 'INFO':
        return 'THÔNG TIN';

      default:
        return status;

    }

  };


  const statusStyle =
    (
      status:
        ActivityStatus
    ):
      React.CSSProperties => {

    switch (
      status
    ) {

      case 'SUCCESS':
        return {
          background:
            '#ecfdf5',
          borderColor:
            '#bbf7d0',
          color:
            '#15803d'
        };


      case 'FAILED':
        return {
          background:
            '#fef2f2',
          borderColor:
            '#fecaca',
          color:
            '#b91c1c'
        };


      case 'RUNNING':
        return {
          background:
            '#eff6ff',
          borderColor:
            '#bfdbfe',
          color:
            '#1d4ed8'
        };


      default:
        return {
          background:
            'var(--bg-soft)',
          borderColor:
            'var(--border)',
          color:
            'var(--text-secondary)'
        };

    }

  };


  // =========================================================
  // UPDATE
  // =========================================================

  const startEdit =
    (
      item:
        ActivityLog
    ) => {

    setEditingId(
      item.id
    );

    setEditMessage(
      item.message
    );

    setEditNote(
      item.note || ''
    );

  };


  const cancelEdit =
    () => {

    setEditingId(
      null
    );

    setEditMessage(
      ''
    );

    setEditNote(
      ''
    );

  };


  const saveEdit =
    (
      id:
        string
    ) => {

    setItems(
      prev =>
        prev.map(
          item =>
            item.id === id
              ? {
                  ...item,
                  message:
                    editMessage.trim(),
                  note:
                    editNote.trim(),
                  updatedAt:
                    Date.now()
                }
              : item
        )
    );


    cancelEdit();

  };


  // =========================================================
  // DELETE
  // =========================================================

  const deleteItem =
    (
      item:
        ActivityLog
    ) => {

    const confirmed =
      window.confirm(
        `Xóa lịch sử này?\n\n${item.message}`
      );


    if (!confirmed) {
      return;
    }


    setItems(
      prev =>
        prev.filter(
          log =>
            log.id !==
            item.id
        )
    );


    if (
      editingId ===
        item.id
    ) {
      cancelEdit();
    }

  };


  const clearAll =
    () => {

    if (
      items.length ===
      0
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        'Xóa toàn bộ lịch sử hoạt động?'
      );


    if (!confirmed) {
      return;
    }


    setItems(
      []
    );


    cancelEdit();

  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <PageLayout
      title="LỊCH SỬ HOẠT ĐỘNG"
      description="Theo dõi hoạt động tạo ảnh, caption, video, lưu file và lỗi hệ thống."
      actions={
        <>
          <div className="text-[11px] font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600">
            {items.length} hoạt động
          </div>
          <Button variant="danger" onClick={clearAll} icon="delete_sweep">
            XOÁ TẤT CẢ
          </Button>
        </>
      }
    >


      {/* =====================================================
          FILTER
      ====================================================== */}

      <div
        className="
          px-6
          py-3
          border-b
        "
        style={{
          background:
            'var(--bg-main)',

          borderColor:
            'var(--border)'
        }}
      >

        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-3
            gap-4
          "
        >

          {/* SEARCH */}

          <div>

            <label
              className="
                block
                text-[10px]
                font-bold
                mb-1
              "
              style={{
                color:
                  'var(--text-muted)'
              }}
            >
              TÌM KIẾM
            </label>


            <input
              type="text"

              value={
                search
              }

              onChange={
                e =>
                  setSearch(
                    e.currentTarget.value
                  )
              }

              className="form-input"

              placeholder="
Tìm theo STT, nhân vật, nội dung, đường dẫn, lỗi...
"
            />

          </div>


          {/* MODULE */}

          <div>

            <label
              className="
                block
                text-[10px]
                font-bold
                mb-1
              "
              style={{
                color:
                  'var(--text-muted)'
              }}
            >
              MODULE
            </label>


            <select
              value={
                filterModule
              }

              onChange={
                e =>
                  setFilterModule(
                    e.currentTarget
                      .value as
                      FilterModule
                  )
              }

              className="form-select"
            >

              <option value="ALL">
                TẤT CẢ
              </option>

              <option value="PRODUCTION">
                SẢN XUẤT
              </option>



              <option value="VIDEO">
                VIDEO
              </option>

              <option value="SYSTEM">
                HỆ THỐNG
              </option>

            </select>

          </div>


          {/* STATUS */}

          <div>

            <label
              className="
                block
                text-[10px]
                font-bold
                mb-1
              "
              style={{
                color:
                  'var(--text-muted)'
              }}
            >
              TRẠNG THÁI
            </label>


            <select
              value={
                filterStatus
              }

              onChange={
                e =>
                  setFilterStatus(
                    e.currentTarget
                      .value as
                      FilterStatus
                  )
              }

              className="form-select"
            >

              <option value="ALL">
                TẤT CẢ
              </option>

              <option value="SUCCESS">
                THÀNH CÔNG
              </option>

              <option value="FAILED">
                THẤT BẠI
              </option>

              <option value="RUNNING">
                ĐANG CHẠY
              </option>

              <option value="INFO">
                THÔNG TIN
              </option>

            </select>

          </div>

        </div>

      </div>


      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="flex-1 min-h-0">
        <div className="h-full flex flex-col min-h-0">
          <div className="h-full overflow-auto dark-scrollbar p-0">

            <table
              className="activity-log-table table-fixed"
              style={{ minWidth: '1120px' }}
            >

              <thead>

                <tr>

                  <th
                    className="
                      sheet-header
                      w-36
                    "
                  >
                    THỜI GIAN
                  </th>


                  <th
                    className="
                      sheet-header
                      w-44
                    "
                  >
                    MODULE / HOẠT ĐỘNG
                  </th>


                  <th
                    className="
                      sheet-header
                      w-44
                    "
                  >
                    STT / CHỦ THỂ
                  </th>


                  <th
                    className="
                      sheet-header
                      w-28
                    "
                  >
                    TRẠNG THÁI
                  </th>


                  <th
                    className="
                      sheet-header
                      w-96
                    "
                  >
                    NỘI DUNG
                  </th>


                  <th
                    className="
                      sheet-header
                      w-64
                    "
                  >
                    FILE / LỖI
                  </th>


                  <th
                    className="
                      sheet-header
                      w-24
                      text-center
                    "
                  >
                    THAO TÁC
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  filteredItems.length ===
                    0
                    ? (

                    <tr>

                      <td
                        colSpan={
                          7
                        }
                        className="
                          sheet-cell
                          text-center
                          py-12
                        "
                        style={{
                          color:
                            'var(--text-muted)'
                        }}
                      >

                        <span
                          className="
                            material-symbols-outlined
                            text-[32px]
                            block
                            mb-2
                          "
                        >
                          history
                        </span>

                        CHƯA CÓ LỊCH SỬ HOẠT ĐỘNG

                      </td>

                    </tr>

                  )
                    : (

                    filteredItems.map(
                      item => {

                      const editing =
                        editingId ===
                        item.id;


                      return (

                        <tr
                          key={
                            item.id
                          }
                        >

                          {/* TIME */}

                          <td className="sheet-cell">

                            <div
                              className="
                                text-[11px]
                                font-semibold
                              "
                            >
                              {
                                formatDate(
                                  item.createdAt
                                )
                              }
                            </div>

                          </td>


                          {/* MODULE */}

                          <td className="sheet-cell">

                            <div
                              className="
                                space-y-2
                              "
                            >
                              <span
                                className="
                                  inline-flex
                                  px-2
                                  py-1
                                  rounded-lg
                                  text-[10px]
                                  font-bold
                                  border
                                "
                                style={{
                                  background:
                                    'var(--bg-soft)',

                                  borderColor:
                                    'var(--border)',

                                  color:
                                    'var(--text-secondary)'
                                }}
                              >
                                {
                                  moduleLabel(
                                    item.module
                                  )
                                }
                              </span>

                              <div
                                className="
                                  text-[11px]
                                  font-bold
                                  leading-snug
                                "
                              >
                                {
                                  typeLabel(
                                    item.type
                                  )
                                }
                              </div>
                            </div>

                          </td>


                          {/* STT + SUBJECT */}

                          <td className="sheet-cell">

                            <div
                              className="
                                space-y-2
                              "
                            >
                              <span
                                className="
                                  inline-flex
                                  min-w-10
                                  justify-center
                                  px-2
                                  py-1
                                  rounded-lg
                                  border
                                  text-[11px]
                                  font-bold
                                "
                                style={{
                                  background:
                                    'var(--bg-soft)',

                                  borderColor:
                                    'var(--border)'
                                }}
                              >
                                {
                                  item.stt ||
                                  '-'
                                }
                              </span>

                              <div
                                className="
                                  text-[11px]
                                  font-semibold
                                  leading-snug
                                  break-words
                                "
                              >
                                {
                                  item.subject ||
                                  '-'
                                }
                              </div>
                            </div>

                          </td>


                          {/* STATUS */}

                          <td className="sheet-cell">

                            <span
                              className="
                                inline-flex
                                px-2
                                py-1
                                rounded-lg
                                border
                                text-[10px]
                                font-bold
                              "
                              style={
                                statusStyle(
                                  item.status
                                )
                              }
                            >
                              {
                                statusLabel(
                                  item.status
                                )
                              }
                            </span>

                          </td>


                          {/* MESSAGE */}

                          <td className="sheet-cell">

                            {
                              editing
                                ? (

                                <div
                                  className="
                                    space-y-2
                                  "
                                >
                                  <textarea
                                    value={
                                      editMessage
                                    }

                                    onChange={
                                      e =>
                                        setEditMessage(
                                          e.currentTarget
                                            .value
                                        )
                                    }

                                    className="
                                      min-h-[70px]
                                    "
                                  />

                                  <textarea
                                    value={
                                      editNote
                                    }

                                    onChange={
                                      e =>
                                        setEditNote(
                                          e.currentTarget
                                            .value
                                        )
                                    }

                                    placeholder="
Ghi chú...
"

                                    className="
                                      min-h-[56px]
                                    "
                                  />
                                </div>

                              )
                                : (

                                <div className="space-y-2">
                                  <div
                                    className="
                                      text-[11px]
                                      leading-relaxed
                                      whitespace-pre-wrap
                                      break-words
                                    "
                                  >
                                    {
                                      item.message
                                    }
                                  </div>

                                  {
                                    item.note && (

                                      <div
                                        className="
                                          text-[10px]
                                          leading-relaxed
                                          whitespace-pre-wrap
                                          break-words
                                          rounded-md
                                          px-2
                                          py-1.5
                                        "
                                        style={{
                                          background:
                                            'var(--bg-soft)',

                                          color:
                                            'var(--text-secondary)'
                                        }}
                                      >
                                        {item.note}
                                      </div>

                                    )
                                  }
                                </div>

                              )
                            }

                          </td>


                          {/* FILE + ERROR */}

                          <td className="sheet-cell">

                            <div
                              className="
                                space-y-2
                              "
                            >
                              <div
                                className="
                                  text-[10px]
                                  break-all
                                "
                                style={{
                                  color:
                                    'var(--text-secondary)'
                                }}
                              >
                                {
                                  item.filePath ||
                                  '-'
                                }
                              </div>

                              {
                                item.error && (

                                  <div
                                    className="
                                      activity-log-error
                                      text-[10px]
                                      leading-relaxed
                                      break-words
                                      p-2
                                      rounded-lg
                                      border
                                    "
                                    style={{
                                      background:
                                        '#fef2f2',

                                      borderColor:
                                        '#fecaca',

                                      color:
                                        '#b91c1c'
                                    }}
                                    title={
                                      item.error
                                    }
                                  >
                                    {
                                      item.error
                                    }
                                  </div>

                                )
                              }
                            </div>

                          </td>


                          {/* ACTION */}

                          <td
                            className="
                              sheet-cell
                              text-center
                            "
                          >

                            {
                              editing
                                ? (

                                <div className="inline-flex items-center justify-center gap-1">

                                  <button
                                    type="button"

                                    onClick={
                                      () =>
                                        saveEdit(
                                          item.id
                                        )
                                    }

                                    className="
                                      icon-button
                                      btn-primary
                                    "
                                    title="Lưu"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      save
                                    </span>
                                  </button>


                                  <button
                                    type="button"

                                    onClick={
                                      cancelEdit
                                    }

                                    className="
                                      icon-button
                                      btn-secondary
                                    "
                                    title="Hủy"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      close
                                    </span>
                                  </button>

                                </div>

                              )
                                : (

                                <div className="inline-flex items-center justify-center gap-1">

                                  <button
                                    type="button"

                                    onClick={
                                      () =>
                                        startEdit(
                                          item
                                        )
                                    }

                                    className="
                                      icon-button
                                      btn-secondary
                                    "
                                    title="Sửa"
                                  >

                                    <span
                                      className="
                                        material-symbols-outlined
                                        text-[16px]
                                      "
                                    >
                                      edit
                                    </span>

                                  </button>


                                  <button
                                    type="button"

                                    onClick={
                                      () =>
                                        deleteItem(
                                          item
                                        )
                                    }

                                    className="
                                      icon-button
                                      btn-danger
                                    "
                                    title="Xóa"
                                  >

                                    <span
                                      className="
                                        material-symbols-outlined
                                        text-[16px]
                                      "
                                    >
                                      delete
                                    </span>

                                  </button>

                                </div>

                              )
                            }

                          </td>

                        </tr>

                      );

                    })

                  )
                }

              </tbody>

            </table>

          </div>
        </div>
      </div>
    </PageLayout>
  );
};
