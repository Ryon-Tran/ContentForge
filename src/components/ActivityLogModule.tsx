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

      case 'NEWS':
        return 'LÀM BÁO';

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

    <div className="page-wrap">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header">

        <div>

          <div className="page-title">
            LỊCH SỬ HOẠT ĐỘNG
          </div>


          <div
            className="
              text-[11px]
              mt-1
            "
            style={{
              color:
                'var(--text-muted)'
            }}
          >
            Theo dõi hoạt động tạo ảnh, caption, video, lưu file và lỗi hệ thống.
          </div>

        </div>


        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <div
            className="
              text-[11px]
              font-semibold
              px-3
              py-2
              rounded-lg
              border
            "
            style={{
              background:
                'var(--bg-card)',

              borderColor:
                'var(--border)',

              color:
                'var(--text-secondary)'
            }}
          >
            {items.length} hoạt động
          </div>


          <button
            type="button"

            onClick={
              clearAll
            }

            className="
              btn-action
              btn-danger
            "
          >

            <span
              className="
                material-symbols-outlined
                text-[17px]
              "
            >
              delete_sweep
            </span>

            XÓA TẤT CẢ

          </button>

        </div>

      </div>


      {/* =====================================================
          FILTER
      ====================================================== */}

      <div
        className="
          p-4
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
            soft-card
            grid
            grid-cols-1
            md:grid-cols-3
            gap-3
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

              <option value="NEWS">
                LÀM BÁO
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

      <div
        className="
          flex-1
          min-h-0
          p-4
        "
      >

        <div
          className="
            soft-panel
            h-full
          "
        >

          <div
            className="
              h-full
              overflow-auto
              dark-scrollbar
            "
          >

            <table
              className="table-fixed"
              style={{
                minWidth:
                  '1700px'
              }}
            >

              <thead>

                <tr>

                  <th
                    className="
                      sheet-header
                      w-44
                    "
                  >
                    THỜI GIAN
                  </th>


                  <th
                    className="
                      sheet-header
                      w-28
                    "
                  >
                    MODULE
                  </th>


                  <th
                    className="
                      sheet-header
                      w-36
                    "
                  >
                    HOẠT ĐỘNG
                  </th>


                  <th
                    className="
                      sheet-header
                      w-24
                    "
                  >
                    STT
                  </th>


                  <th
                    className="
                      sheet-header
                      w-44
                    "
                  >
                    NHÂN VẬT / CHỦ THỂ
                  </th>


                  <th
                    className="
                      sheet-header
                      w-32
                    "
                  >
                    TRẠNG THÁI
                  </th>


                  <th
                    className="
                      sheet-header
                      w-80
                    "
                  >
                    NỘI DUNG
                  </th>


                  <th
                    className="
                      sheet-header
                      w-72
                    "
                  >
                    FILE
                  </th>


                  <th
                    className="
                      sheet-header
                      w-72
                    "
                  >
                    LỖI
                  </th>


                  <th
                    className="
                      sheet-header
                      w-64
                    "
                  >
                    GHI CHÚ
                  </th>


                  <th
                    className="
                      sheet-header
                      w-44
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
                          11
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

                          </td>


                          {/* TYPE */}

                          <td className="sheet-cell">

                            <div
                              className="
                                text-[11px]
                                font-bold
                              "
                            >
                              {
                                typeLabel(
                                  item.type
                                )
                              }
                            </div>

                          </td>


                          {/* STT */}

                          <td className="sheet-cell">

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

                          </td>


                          {/* SUBJECT */}

                          <td className="sheet-cell">

                            <div
                              className="
                                text-[11px]
                                font-semibold
                                break-words
                              "
                            >
                              {
                                item.subject ||
                                '-'
                              }
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
                                    min-h-[80px]
                                  "
                                />

                              )
                                : (

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

                              )
                            }

                          </td>


                          {/* FILE */}

                          <td className="sheet-cell">

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

                          </td>


                          {/* ERROR */}

                          <td className="sheet-cell">

                            {
                              item.error
                                ? (

                                <div
                                  className="
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
                                >
                                  {
                                    item.error
                                  }
                                </div>

                              )
                                : (

                                <span
                                  className="
                                    text-[10px]
                                  "
                                  style={{
                                    color:
                                      'var(--text-muted)'
                                  }}
                                >
                                  -
                                </span>

                              )
                            }

                          </td>


                          {/* NOTE */}

                          <td className="sheet-cell">

                            {
                              editing
                                ? (

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
                                    min-h-[80px]
                                  "
                                />

                              )
                                : (

                                <div
                                  className="
                                    text-[10px]
                                    whitespace-pre-wrap
                                    break-words
                                  "
                                  style={{
                                    color:
                                      'var(--text-secondary)'
                                  }}
                                >
                                  {
                                    item.note ||
                                    '-'
                                  }
                                </div>

                              )
                            }

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

                                <div
                                  className="
                                    flex
                                    flex-col
                                    gap-2
                                  "
                                >

                                  <button
                                    type="button"

                                    onClick={
                                      () =>
                                        saveEdit(
                                          item.id
                                        )
                                    }

                                    className="
                                      btn-action
                                      btn-primary
                                    "
                                  >
                                    LƯU
                                  </button>


                                  <button
                                    type="button"

                                    onClick={
                                      cancelEdit
                                    }

                                    className="
                                      btn-action
                                      btn-secondary
                                    "
                                  >
                                    HỦY
                                  </button>

                                </div>

                              )
                                : (

                                <div
                                  className="
                                    flex
                                    flex-col
                                    gap-2
                                  "
                                >

                                  <button
                                    type="button"

                                    onClick={
                                      () =>
                                        startEdit(
                                          item
                                        )
                                    }

                                    className="
                                      btn-action
                                      btn-secondary
                                    "
                                  >

                                    <span
                                      className="
                                        material-symbols-outlined
                                        text-[16px]
                                      "
                                    >
                                      edit
                                    </span>

                                    SỬA

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
                                      btn-action
                                      btn-danger
                                    "
                                  >

                                    <span
                                      className="
                                        material-symbols-outlined
                                        text-[16px]
                                      "
                                    >
                                      delete
                                    </span>

                                    XÓA

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

    </div>

  );

};