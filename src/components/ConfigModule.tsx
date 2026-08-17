import React, {
  FormEvent,
  useEffect,
  useState
} from 'react';

import {
  AIProviderConfig,
  AIProviderType
} from '../types';

import {
  useI18n
} from '../i18n/I18nContext';


const API_BASE =
  'http://127.0.0.1:8000';


interface FormState {
  name: string;
  provider: string;
  type: AIProviderType;
  model: string;
  baseUrl: string;
  apiKey: string;
  isActive: boolean;
  isDefault: boolean;
}


const EMPTY_FORM: FormState = {
  name: '',
  provider: '',
  type: 'TEXT',
  model: '',
  baseUrl: '',
  apiKey: '',
  isActive: true,
  isDefault: false
};


export const ConfigModule:
  React.FC = () => {

  const { t } =
    useI18n();


  // =========================================================
  // PROVIDERS
  // =========================================================

  const [
    providers,
    setProviders
  ] =
    useState<AIProviderConfig[]>(
      []
    );


  // =========================================================
  // FORM
  // =========================================================

  const [
    form,
    setForm
  ] =
    useState<FormState>(
      EMPTY_FORM
    );


  const [
    editingId,
    setEditingId
  ] =
    useState<string | null>(
      null
    );


  // =========================================================
  // UI STATE
  // =========================================================

  const [
    loading,
    setLoading
  ] =
    useState(false);


  const [
    saving,
    setSaving
  ] =
    useState(false);


  const [
    message,
    setMessage
  ] =
    useState('');


  const [
    error,
    setError
  ] =
    useState('');


  // =========================================================
  // KEY STATE
  // =========================================================

  /*
    Cache key thật sau khi người dùng
    chủ động bấm XEM hoặc SAO CHÉP.
  */
  const [
    revealedKeys,
    setRevealedKeys
  ] =
    useState<
      Record<string, string>
    >({});


  /*
    Provider nào đang hiện key thật.
  */
  const [
    visibleKeyIds,
    setVisibleKeyIds
  ] =
    useState<Set<string>>(
      new Set()
    );


  /*
    Hiện / ẩn key trong FORM SỬA.
  */
  const [
    showFormKey,
    setShowFormKey
  ] =
    useState(false);


  const [
    keyLoadingId,
    setKeyLoadingId
  ] =
    useState<string | null>(
      null
    );


  // =========================================================
  // MESSAGE HELPERS
  // =========================================================

  const clearMessages = () => {
    setMessage('');
    setError('');
  };


  const resetForm = () => {

    setForm({
      ...EMPTY_FORM
    });

    setEditingId(
      null
    );

    setShowFormKey(
      false
    );

    clearMessages();

  };


  const parseError =
    async (
      response: Response
    ) => {

      try {

        const data =
          await response.json();


        if (
          data?.detail
        ) {

          if (
            typeof data.detail ===
            'string'
          ) {

            return data.detail;

          }


          return JSON.stringify(
            data.detail
          );

        }

      } catch {
        //
      }


      try {

        return await response.text();

      } catch {

        return `HTTP ${response.status}`;

      }

    };


  // =========================================================
  // LOAD PROVIDERS
  // =========================================================

  const loadProviders =
    async () => {

      setLoading(
        true
      );

      setError(
        ''
      );


      try {

        const response =
          await fetch(
            `${API_BASE}/api/config/ai-providers`
          );


        if (
          !response.ok
        ) {

          const detail =
            await parseError(
              response
            );


          throw new Error(
            detail ||
            `HTTP ${response.status}`
          );

        }


        const data =
          await response.json();


        setProviders(
          Array.isArray(
            data.providers
          )
            ? data.providers
            : []
        );

      } catch (
        err
      ) {

        const text =
          err instanceof Error
            ? err.message
            : String(err);


        setError(
          `Không tải được cấu hình AI: ${text}`
        );

      } finally {

        setLoading(
          false
        );

      }

    };


  useEffect(
    () => {

      loadProviders();

    },
    []
  );


  // =========================================================
  // FORM UPDATE
  // =========================================================

  const updateForm = <
    K extends keyof FormState
  >(
    key: K,
    value: FormState[K]
  ) => {

    setForm(
      prev => ({
        ...prev,
        [key]:
          value
      })
    );

  };


  // =========================================================
  // GET FULL API KEY
  // =========================================================

  const fetchFullApiKey =
    async (
      id: string
    ) => {

      /*
        Nếu đã lấy một lần thì dùng cache.
      */
      if (
        revealedKeys[
          id
        ]
      ) {

        return revealedKeys[
          id
        ];

      }


      setKeyLoadingId(
        id
      );


      try {

        const response =
          await fetch(
            `${API_BASE}/api/config/ai-providers/${encodeURIComponent(id)}/api-key`
          );


        if (
          !response.ok
        ) {

          const detail =
            await parseError(
              response
            );


          throw new Error(
            detail ||
            `HTTP ${response.status}`
          );

        }


        const data =
          await response.json();


        const apiKey =
          String(
            data.apiKey ||
            ''
          );


        if (
          !apiKey
        ) {

          throw new Error(
            'Backend không trả về API Key.'
          );

        }


        setRevealedKeys(
          prev => ({
            ...prev,
            [id]:
              apiKey
          })
        );


        return apiKey;

      } finally {

        setKeyLoadingId(
          null
        );

      }

    };


  // =========================================================
  // TOGGLE KEY IN LIST
  // =========================================================

  const toggleProviderKey =
    async (
      item: AIProviderConfig
    ) => {

      clearMessages();


      const isVisible =
        visibleKeyIds.has(
          item.id
        );


      /*
        Đang hiện -> chỉ ẩn.
      */
      if (
        isVisible
      ) {

        setVisibleKeyIds(
          prev => {

            const next =
              new Set(
                prev
              );


            next.delete(
              item.id
            );


            return next;

          }
        );

        return;

      }


      try {

        await fetchFullApiKey(
          item.id
        );


        setVisibleKeyIds(
          prev => {

            const next =
              new Set(
                prev
              );


            next.add(
              item.id
            );


            return next;

          }
        );

      } catch (
        err
      ) {

        const text =
          err instanceof Error
            ? err.message
            : String(err);


        setError(
          `Không thể xem API Key: ${text}`
        );

      }

    };


  // =========================================================
  // COPY KEY
  // =========================================================

  const copyProviderKey =
    async (
      item: AIProviderConfig
    ) => {

      clearMessages();


      try {

        const key =
          await fetchFullApiKey(
            item.id
          );


        await navigator.clipboard.writeText(
          key
        );


        setMessage(
          `Đã sao chép API Key của "${item.name}".`
        );

      } catch (
        err
      ) {

        const text =
          err instanceof Error
            ? err.message
            : String(err);


        setError(
          `Không thể sao chép API Key: ${text}`
        );

      }

    };


  // =========================================================
  // REVEAL KEY IN EDIT FORM
  // =========================================================

  const toggleFormApiKey =
    async () => {

      clearMessages();


      /*
        Khi đang THÊM AI:
        chỉ đổi password/text.
      */
      if (
        !editingId
      ) {

        setShowFormKey(
          prev =>
            !prev
        );

        return;

      }


      /*
        Nếu đã có key trong form:
        chỉ hiện / ẩn.
      */
      if (
        form.apiKey
      ) {

        setShowFormKey(
          prev =>
            !prev
        );

        return;

      }


      try {

        const key =
          await fetchFullApiKey(
            editingId
          );


        setForm(
          prev => ({
            ...prev,
            apiKey:
              key
          })
        );


        setShowFormKey(
          true
        );

      } catch (
        err
      ) {

        const text =
          err instanceof Error
            ? err.message
            : String(err);


        setError(
          `Không thể lấy API Key: ${text}`
        );

      }

    };


  // =========================================================
  // COPY KEY FROM FORM
  // =========================================================

  const copyFormApiKey =
    async () => {

      clearMessages();


      try {

        let key =
          form.apiKey.trim();


        /*
          Đang sửa nhưng form chưa load key:
          tự lấy từ backend.
        */
        if (
          !key &&
          editingId
        ) {

          key =
            await fetchFullApiKey(
              editingId
            );

        }


        if (
          !key
        ) {

          throw new Error(
            'Chưa có API Key để sao chép.'
          );

        }


        await navigator.clipboard.writeText(
          key
        );


        setMessage(
          'Đã sao chép API Key.'
        );

      } catch (
        err
      ) {

        const text =
          err instanceof Error
            ? err.message
            : String(err);


        setError(
          `Không thể sao chép API Key: ${text}`
        );

      }

    };


  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  const handleSubmit =
    async (
      event: FormEvent
    ) => {

      event.preventDefault();

      clearMessages();


      if (
        !form.name.trim() ||
        !form.provider.trim() ||
        !form.model.trim() ||
        !form.baseUrl.trim()
      ) {

        setError(
          'Vui lòng nhập đầy đủ Tên hiển thị, Provider, Model và Base URL.'
        );

        return;

      }


      /*
        Tạo mới bắt buộc có key.

        Khi sửa:
        để trống = giữ key cũ.
      */
      if (
        !editingId &&
        !form.apiKey.trim()
      ) {

        setError(
          'Vui lòng nhập API Key.'
        );

        return;

      }


      setSaving(
        true
      );


      try {

        // =====================================================
        // UPDATE
        // =====================================================

        if (
          editingId
        ) {

          const body:
            Record<string, any> = {

            name:
              form.name.trim(),

            provider:
              form.provider.trim(),

            type:
              form.type,

            model:
              form.model.trim(),

            baseUrl:
              form.baseUrl.trim(),

            isActive:
              form.isActive,

            isDefault:
              form.isDefault
          };


          /*
            Nếu form có key:
            gửi key lên.

            Nếu trống:
            backend giữ key cũ.
          */
          if (
            form.apiKey.trim()
          ) {

            body.apiKey =
              form.apiKey.trim();

          }


          const response =
            await fetch(
              `${API_BASE}/api/config/ai-providers/${encodeURIComponent(editingId)}`,
              {
                method:
                  'PUT',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body:
                  JSON.stringify(
                    body
                  )
              }
            );


          if (
            !response.ok
          ) {

            const detail =
              await parseError(
                response
              );


            throw new Error(
              detail ||
              `HTTP ${response.status}`
            );

          }


          await loadProviders();


          /*
            Xóa cache key để lần sau
            lấy lại đúng key mới.
          */
          setRevealedKeys(
            prev => {

              const next = {
                ...prev
              };


              delete next[
                editingId
              ];


              return next;

            }
          );


          setVisibleKeyIds(
            prev => {

              const next =
                new Set(
                  prev
                );


              next.delete(
                editingId
              );


              return next;

            }
          );


          setMessage(
            'Đã cập nhật AI thành công.'
          );


          setEditingId(
            null
          );


          setShowFormKey(
            false
          );


          setForm({
            ...EMPTY_FORM
          });


          return;

        }


        // =====================================================
        // CREATE
        // =====================================================

        const response =
          await fetch(
            `${API_BASE}/api/config/ai-providers`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({

                  name:
                    form.name.trim(),

                  provider:
                    form.provider.trim(),

                  type:
                    form.type,

                  model:
                    form.model.trim(),

                  baseUrl:
                    form.baseUrl.trim(),

                  apiKey:
                    form.apiKey.trim(),

                  isActive:
                    form.isActive,

                  isDefault:
                    form.isDefault

                })
            }
          );


        if (
          !response.ok
        ) {

          const detail =
            await parseError(
              response
            );


          throw new Error(
            detail ||
            `HTTP ${response.status}`
          );

        }


        await loadProviders();


        setForm({
          ...EMPTY_FORM
        });


        setShowFormKey(
          false
        );


        setMessage(
          'Đã thêm AI thành công.'
        );

      } catch (
        err
      ) {

        const text =
          err instanceof Error
            ? err.message
            : String(err);


        setError(
          text
        );

      } finally {

        setSaving(
          false
        );

      }

    };


  // =========================================================
  // EDIT
  // =========================================================

  const startEdit = (
    item: AIProviderConfig
  ) => {

    clearMessages();


    setEditingId(
      item.id
    );


    /*
      Không tự tải key thật khi bấm SỬA.

      Key vẫn nằm trong database.

      Chỉ khi bấm icon con mắt
      hoặc Copy thì mới gọi backend.
    */
    setForm({
      name:
        item.name,

      provider:
        item.provider,

      type:
        item.type,

      model:
        item.model,

      baseUrl:
        item.baseUrl,

      apiKey:
        '',

      isActive:
        item.isActive,

      isDefault:
        item.isDefault
    });


    setShowFormKey(
      false
    );


    window.scrollTo({
      top:
        0,

      behavior:
        'smooth'
    });

  };


  // =========================================================
  // DELETE
  // =========================================================

  const deleteProvider =
    async (
      item: AIProviderConfig
    ) => {

      const ok =
        window.confirm(
          `Xóa AI "${item.name}"?`
        );


      if (
        !ok
      ) {
        return;
      }


      clearMessages();


      try {

        const response =
          await fetch(
            `${API_BASE}/api/config/ai-providers/${encodeURIComponent(item.id)}`,
            {
              method:
                'DELETE'
            }
          );


        if (
          !response.ok
        ) {

          const detail =
            await parseError(
              response
            );


          throw new Error(
            detail ||
            `HTTP ${response.status}`
          );

        }


        if (
          editingId ===
          item.id
        ) {

          resetForm();

        }


        /*
          Dọn cache key.
        */
        setRevealedKeys(
          prev => {

            const next = {
              ...prev
            };


            delete next[
              item.id
            ];


            return next;

          }
        );


        setVisibleKeyIds(
          prev => {

            const next =
              new Set(
                prev
              );


            next.delete(
              item.id
            );


            return next;

          }
        );


        await loadProviders();


        setMessage(
          `Đã xóa "${item.name}".`
        );

      } catch (
        err
      ) {

        const text =
          err instanceof Error
            ? err.message
            : String(err);


        setError(
          `Xóa AI thất bại: ${text}`
        );

      }

    };


  // =========================================================
  // SET DEFAULT
  // =========================================================

  const setDefaultProvider =
    async (
      item: AIProviderConfig
    ) => {

      clearMessages();


      try {

        const response =
          await fetch(
            `${API_BASE}/api/config/set-default`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  id:
                    item.id,

                  type:
                    item.type
                })
            }
          );


        if (
          !response.ok
        ) {

          const detail =
            await parseError(
              response
            );


          throw new Error(
            detail ||
            `HTTP ${response.status}`
          );

        }


        await loadProviders();


        setMessage(
          `"${item.name}" đã được đặt làm mặc định cho ${item.type}.`
        );

      } catch (
        err
      ) {

        const text =
          err instanceof Error
            ? err.message
            : String(err);


        setError(
          `Không thể đặt mặc định: ${text}`
        );

      }

    };


  // =========================================================
  // UI
  // =========================================================

  return (

    <div
      className="
        page-wrap
        overflow-y-auto
      "
    >

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-header">

        <div>

          <div className="page-title">
            {
              t(
                'config.title',
                'CẤU HÌNH AI'
              )
            }
          </div>


          <div
            className="
              text-[12px]
              mt-1
            "

            style={{
              color:
                'var(--text-muted)'
            }}
          >
            Quản lý AI Provider, Model, Base URL và API Key.
          </div>

        </div>

      </div>


      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          p-6
          space-y-6
        "
      >

        {/* ===================================================
            FORM
        ==================================================== */}

        <form
          onSubmit={
            handleSubmit
          }

          className="
            soft-card
            space-y-5
          "
        >

          {/* TITLE */}

          <div
            className="
              flex
              items-center
              justify-between
              gap-4
            "
          >

            <div>

              <div
                className="
                  font-bold
                  text-[15px]
                "

                style={{
                  color:
                    'var(--text-main)'
                }}
              >

                {
                  editingId
                    ? '✏️ SỬA AI'
                    : '+ THÊM AI'
                }

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

                {
                  editingId

                    ? 'Key cũ vẫn được giữ. Bấm con mắt để xem hoặc nút sao chép để copy key.'

                    : 'Nhập Provider, Model, Base URL và API Key.'
                }

              </div>

            </div>


            {
              editingId && (

                <button
                  type="button"

                  onClick={
                    resetForm
                  }

                  className="
                    btn-action
                    btn-secondary
                  "
                >

                  <span
                    className="
                      material-symbols-outlined
                      text-[18px]
                    "
                  >
                    close
                  </span>

                  HỦY SỬA

                </button>

              )
            }

          </div>


          {/* ROW 1 */}

          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-2
              gap-4
            "
          >

            {/* NAME */}

            <div>

              <label
                className="
                  block
                  text-[11px]
                  font-semibold
                  mb-2
                "
              >
                Tên hiển thị
              </label>


              <input
                type="text"

                value={
                  form.name
                }

                onChange={
                  e =>
                    updateForm(
                      'name',
                      e.currentTarget.value
                    )
                }

                className="form-input"

                placeholder="Ví dụ: OpenAI Image"
              />

            </div>


            {/* TYPE */}

            <div>

              <label
                className="
                  block
                  text-[11px]
                  font-semibold
                  mb-2
                "
              >
                Loại AI
              </label>


              <select
                value={
                  form.type
                }

                onChange={
                  e =>
                    updateForm(
                      'type',

                      e.currentTarget
                        .value as AIProviderType
                    )
                }

                className="form-select"
              >

                <option value="TEXT">
                  TEXT
                </option>

                <option value="IMAGE">
                  IMAGE
                </option>

                <option value="VIDEO">
                  VIDEO
                </option>

              </select>

            </div>

          </div>


          {/* ROW 2 */}

          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-2
              gap-4
            "
          >

            {/* PROVIDER */}

            <div>

              <label
                className="
                  block
                  text-[11px]
                  font-semibold
                  mb-2
                "
              >
                Provider
              </label>


              <input
                type="text"

                value={
                  form.provider
                }

                onChange={
                  e =>
                    updateForm(
                      'provider',
                      e.currentTarget.value
                    )
                }

                className="form-input"

                placeholder="openai / google / xai..."
              />

            </div>


            {/* MODEL */}

            <div>

              <label
                className="
                  block
                  text-[11px]
                  font-semibold
                  mb-2
                "
              >
                Model
              </label>


              <input
                type="text"

                value={
                  form.model
                }

                onChange={
                  e =>
                    updateForm(
                      'model',
                      e.currentTarget.value
                    )
                }

                className="form-input"

                placeholder="Tên model"
              />

            </div>

          </div>


          {/* BASE URL */}

          <div>

            <label
              className="
                block
                text-[11px]
                font-semibold
                mb-2
              "
            >
              Base URL
            </label>


            <input
              type="text"

              value={
                form.baseUrl
              }

              onChange={
                e =>
                  updateForm(
                    'baseUrl',
                    e.currentTarget.value
                  )
              }

              className="form-input"

              placeholder="https://..."
            />

          </div>


          {/* ===================================================
              API KEY
          ==================================================== */}

          <div>

            <label
              className="
                block
                text-[11px]
                font-semibold
                mb-2
              "
            >

              API Key

              {
                editingId && (

                  <span
                    className="
                      ml-2
                      font-normal
                    "

                    style={{
                      color:
                        'var(--text-muted)'
                    }}
                  >
                    (để trống = giữ key cũ)
                  </span>

                )
              }

            </label>


            <div
              className="
                flex
                gap-2
                items-center
              "
            >

              <div
                className="
                  relative
                  flex-1
                "
              >

                <input
                  type={
                    showFormKey
                      ? 'text'
                      : 'password'
                  }

                  autoComplete="off"

                  value={
                    form.apiKey
                  }

                  onChange={
                    e =>
                      updateForm(
                        'apiKey',
                        e.currentTarget.value
                      )
                  }

                  className="
                    form-input
                    pr-12
                  "

                  placeholder={
                    editingId

                      ? 'Key cũ đang được lưu - bấm con mắt để xem'

                      : 'Nhập API Key'
                  }
                />


                {/* EYE */}

                <button
                  type="button"

                  onClick={
                    toggleFormApiKey
                  }

                  disabled={
                    Boolean(
                      editingId &&
                      keyLoadingId ===
                        editingId
                    )
                  }

                  className="
                    absolute
                    right-2
                    top-1/2
                    -translate-y-1/2
                    w-8
                    h-8
                    flex
                    items-center
                    justify-center
                    rounded-md
                    hover:bg-slate-100
                    disabled:opacity-50
                  "

                  title={
                    showFormKey
                      ? 'Ẩn API Key'
                      : 'Xem API Key'
                  }
                >

                  <span
                    className="
                      material-symbols-outlined
                      text-[19px]
                    "
                  >

                    {
                      keyLoadingId ===
                      editingId

                        ? 'progress_activity'

                        : showFormKey
                          ? 'visibility_off'
                          : 'visibility'
                    }

                  </span>

                </button>

              </div>


              {/* COPY */}

              <button
                type="button"

                onClick={
                  copyFormApiKey
                }

                className="
                  btn-action
                  btn-secondary
                  shrink-0
                "

                title="Sao chép API Key"
              >

                <span
                  className="
                    material-symbols-outlined
                    text-[18px]
                  "
                >
                  content_copy
                </span>

                SAO CHÉP

              </button>

            </div>


            {
              editingId &&
              !form.apiKey && (

                <div
                  className="
                    text-[10px]
                    mt-2
                  "

                  style={{
                    color:
                      'var(--text-muted)'
                  }}
                >
                  Key không bị mất. Key cũ vẫn nằm trong SQLite.
                </div>

              )
            }

          </div>


          {/* CHECKBOXES */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-6
            "
          >

            <label
              className="
                flex
                items-center
                gap-2
                text-[12px]
                cursor-pointer
              "
            >

              <input
                type="checkbox"

                checked={
                  form.isActive
                }

                onChange={
                  e =>
                    updateForm(
                      'isActive',
                      e.currentTarget.checked
                    )
                }
              />

              Kích hoạt

            </label>


            <label
              className="
                flex
                items-center
                gap-2
                text-[12px]
                cursor-pointer
              "
            >

              <input
                type="checkbox"

                checked={
                  form.isDefault
                }

                onChange={
                  e =>
                    updateForm(
                      'isDefault',
                      e.currentTarget.checked
                    )
                }
              />

              Đặt làm mặc định

            </label>

          </div>


          {/* ACTIONS */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
            "
          >

            <button
              type="submit"

              disabled={
                saving
              }

              className="
                btn-action
                btn-primary
              "
            >

              <span
                className="
                  material-symbols-outlined
                  text-[19px]
                "
              >

                {
                  editingId
                    ? 'save'
                    : 'add'
                }

              </span>


              {
                saving
                  ? 'ĐANG LƯU...'
                  : editingId
                    ? 'LƯU THAY ĐỔI'
                    : 'THÊM AI'
              }

            </button>


            {
              editingId && (

                <button
                  type="button"

                  onClick={
                    resetForm
                  }

                  className="
                    btn-action
                    btn-secondary
                  "
                >
                  HỦY
                </button>

              )
            }


            {
              message && (

                <div
                  className="
                    text-[12px]
                    font-semibold
                  "

                  style={{
                    color:
                      '#16a34a'
                  }}
                >
                  {message}
                </div>

              )
            }

          </div>


          {
            error && (

              <div
                className="
                  p-3
                  rounded-lg
                  border
                  text-[12px]
                "

                style={{
                  background:
                    '#fef2f2',

                  borderColor:
                    '#fecaca',

                  color:
                    '#dc2626'
                }}
              >
                {error}
              </div>

            )
          }

        </form>


        {/* ===================================================
            LIST HEADER
        ==================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
          "
        >

          <div
            className="
              font-bold
              text-[14px]
            "
          >
            AI ĐÃ CẤU HÌNH
          </div>


          <div
            className="
              text-[11px]
            "

            style={{
              color:
                'var(--text-muted)'
            }}
          >
            {providers.length} AI
          </div>

        </div>


        {/* ===================================================
            PROVIDER LIST
        ==================================================== */}

        {
          loading ? (

            <div
              className="
                soft-card
                text-center
                py-10
                text-[12px]
              "
            >
              ĐANG TẢI...
            </div>

          ) : providers.length ===
            0 ? (

            <div
              className="
                soft-card
                text-center
                py-12
              "
            >

              <span
                className="
                  material-symbols-outlined
                  text-[32px]
                  mb-2
                "

                style={{
                  color:
                    'var(--text-muted)'
                }}
              >
                memory
              </span>


              <div
                className="
                  font-bold
                  text-[14px]
                "
              >
                CHƯA CÓ AI
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
                Thêm AI bằng biểu mẫu phía trên.
              </div>

            </div>

          ) : (

            <div
              className="
                space-y-4
              "
            >

              {
                providers.map(
                  item => {

                    const keyVisible =
                      visibleKeyIds.has(
                        item.id
                      );


                    const fullKey =
                      revealedKeys[
                        item.id
                      ];


                    const displayedKey =
                      keyVisible &&
                      fullKey

                        ? fullKey

                        : (
                            item.apiKeyMasked ||
                            '********'
                          );


                    const keyLoading =
                      keyLoadingId ===
                      item.id;


                    return (

                      <div
                        key={
                          item.id
                        }

                        className="
                          soft-card
                          flex
                          flex-col
                          xl:flex-row
                          xl:items-center
                          justify-between
                          gap-5
                        "

                        style={{
                          outline:
                            editingId ===
                            item.id

                              ? '2px solid #2563eb'

                              : undefined
                        }}
                      >

                        {/* LEFT */}

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >

                          {/* TITLE + BADGES */}

                          <div
                            className="
                              flex
                              flex-wrap
                              items-center
                              gap-2
                              mb-3
                            "
                          >

                            <div
                              className="
                                text-[15px]
                                font-bold
                              "
                            >
                              {item.name}
                            </div>


                            <span
                              className="
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
                                  'var(--border)'
                              }}
                            >
                              {item.type}
                            </span>


                            {
                              item.isDefault && (

                                <span
                                  className="
                                    px-2
                                    py-1
                                    rounded-lg
                                    text-[10px]
                                    font-bold
                                    border
                                  "

                                  style={{
                                    background:
                                      '#eff6ff',

                                    borderColor:
                                      '#bfdbfe',

                                    color:
                                      '#2563eb'
                                  }}
                                >
                                  MẶC ĐỊNH
                                </span>

                              )
                            }


                            {
                              !item.isActive && (

                                <span
                                  className="
                                    px-2
                                    py-1
                                    rounded-lg
                                    text-[10px]
                                    font-bold
                                    border
                                  "

                                  style={{
                                    background:
                                      '#fef2f2',

                                    borderColor:
                                      '#fecaca',

                                    color:
                                      '#dc2626'
                                  }}
                                >
                                  ĐÃ TẮT
                                </span>

                              )
                            }

                          </div>


                          {/* DETAILS */}

                          <div
                            className="
                              space-y-2
                              text-[12px]
                            "
                          >

                            <div>
                              <strong>
                                Provider:
                              </strong>{' '}
                              {item.provider}
                            </div>


                            <div>
                              <strong>
                                Model:
                              </strong>{' '}
                              {item.model}
                            </div>


                            {/* API KEY */}

                            <div
                              className="
                                flex
                                flex-wrap
                                items-center
                                gap-2
                              "
                            >

                              <strong>
                                API:
                              </strong>


                              <code
                                className="
                                  text-[11px]
                                  break-all
                                  px-2
                                  py-1
                                  rounded-md
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
                                {displayedKey}
                              </code>


                              {/* EYE */}

                              <button
                                type="button"

                                onClick={
                                  () =>
                                    toggleProviderKey(
                                      item
                                    )
                                }

                                disabled={
                                  keyLoading
                                }

                                className="
                                  w-8
                                  h-8
                                  inline-flex
                                  items-center
                                  justify-center
                                  rounded-md
                                  border
                                  disabled:opacity-50
                                "

                                style={{
                                  borderColor:
                                    'var(--border)',

                                  background:
                                    'var(--bg-card)'
                                }}

                                title={
                                  keyVisible
                                    ? 'Ẩn API Key'
                                    : 'Xem API Key'
                                }
                              >

                                <span
                                  className="
                                    material-symbols-outlined
                                    text-[18px]
                                  "
                                >

                                  {
                                    keyLoading

                                      ? 'progress_activity'

                                      : keyVisible
                                        ? 'visibility_off'
                                        : 'visibility'
                                  }

                                </span>

                              </button>


                              {/* COPY */}

                              <button
                                type="button"

                                onClick={
                                  () =>
                                    copyProviderKey(
                                      item
                                    )
                                }

                                disabled={
                                  keyLoading
                                }

                                className="
                                  w-8
                                  h-8
                                  inline-flex
                                  items-center
                                  justify-center
                                  rounded-md
                                  border
                                  disabled:opacity-50
                                "

                                style={{
                                  borderColor:
                                    'var(--border)',

                                  background:
                                    'var(--bg-card)'
                                }}

                                title="Sao chép API Key"
                              >

                                <span
                                  className="
                                    material-symbols-outlined
                                    text-[18px]
                                  "
                                >
                                  content_copy
                                </span>

                              </button>

                            </div>


                            {/* BASE URL */}

                            <div
                              className="
                                break-all
                                text-[11px]
                              "

                              style={{
                                color:
                                  'var(--text-muted)'
                              }}
                            >
                              {item.baseUrl}
                            </div>

                          </div>

                        </div>


                        {/* ACTIONS */}

                        <div
                          className="
                            flex
                            flex-wrap
                            items-center
                            gap-2
                            shrink-0
                          "
                        >

                          {/* EDIT */}

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
                                text-[18px]
                              "
                            >
                              edit
                            </span>

                            SỬA

                          </button>


                          {/* DEFAULT */}

                          {
                            !item.isDefault && (

                              <button
                                type="button"

                                onClick={
                                  () =>
                                    setDefaultProvider(
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
                                    text-[18px]
                                  "
                                >
                                  check_circle
                                </span>

                                ĐẶT MẶC ĐỊNH

                              </button>

                            )
                          }


                          {/* DELETE */}

                          <button
                            type="button"

                            onClick={
                              () =>
                                deleteProvider(
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
                                text-[18px]
                              "
                            >
                              delete
                            </span>

                            XÓA

                          </button>

                        </div>

                      </div>

                    );

                  }
                )
              }

            </div>

          )
        }

      </div>

    </div>

  );

};