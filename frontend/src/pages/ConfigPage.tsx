import React, {
  FormEvent,
  useEffect,
  useState
} from 'react';

import {
  AIProviderConfig,
  AIProviderType
} from '../types';

import { PageLayout } from '../layouts/PageLayout';
import { Button } from '../components/ui/Button';

import {
  useI18n
} from '../i18n/I18nContext';

import {
  API_BASE
} from '../config';


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

interface ProviderPreset {
  label: string;
  provider: string;
  name: string;
  model: string;
  baseUrl: string;
}


const PROVIDER_PRESETS:
  Record<AIProviderType, ProviderPreset[]> = {

  TEXT: [
    {
      label: 'Google Gemini',
      provider: 'google',
      name: 'Gemini Text',
      model: 'gemini-3.6-flash',
      baseUrl: 'https://generativelanguage.googleapis.com'
    },
    {
      label: 'OpenAI ChatGPT',
      provider: 'openai',
      name: 'OpenAI Text',
      model: 'gpt-4.1-mini',
      baseUrl: 'https://api.openai.com/v1'
    },
    {
      label: 'OpenRouter / Khác',
      provider: 'openrouter',
      name: 'OpenRouter Text',
      model: 'openai/gpt-4.1-mini',
      baseUrl: 'https://openrouter.ai/api/v1'
    },
    {
      label: 'xAI Grok',
      provider: 'xai',
      name: 'xAI Grok Text',
      model: 'grok-4.5',
      baseUrl: 'https://api.x.ai/v1'
    },
    {
      label: 'Anthropic Claude',
      provider: 'anthropic',
      name: 'Claude Text',
      model: 'claude-sonnet-5',
      baseUrl: 'https://api.anthropic.com'
    },
    {
      label: 'DeepSeek',
      provider: 'deepseek',
      name: 'DeepSeek Text',
      model: 'deepseek-v4-flash',
      baseUrl: 'https://api.deepseek.com'
    },
    {
      label: 'Groq',
      provider: 'groq',
      name: 'Groq Text',
      model: 'openai/gpt-oss-20b',
      baseUrl: 'https://api.groq.com/openai/v1'
    },
    {
      label: 'Mistral AI',
      provider: 'mistral',
      name: 'Mistral Text',
      model: 'mistral-large-latest',
      baseUrl: 'https://api.mistral.ai/v1'
    },
    {
      label: 'Together AI',
      provider: 'together',
      name: 'Together Text',
      model: 'openai/gpt-oss-20b',
      baseUrl: 'https://api.together.ai/v1'
    },
    {
      label: 'Fireworks AI',
      provider: 'fireworks',
      name: 'Fireworks Text',
      model: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
      baseUrl: 'https://api.fireworks.ai/inference/v1'
    },
    {
      label: 'Cerebras',
      provider: 'cerebras',
      name: 'Cerebras Text',
      model: 'gpt-oss-120b',
      baseUrl: 'https://api.cerebras.ai/v1'
    },
    {
      label: 'Perplexity Sonar',
      provider: 'perplexity',
      name: 'Perplexity Text',
      model: 'sonar',
      baseUrl: 'https://api.perplexity.ai/v1'
    },
    {
      label: 'Ollama Local',
      provider: 'ollama',
      name: 'Ollama Local',
      model: 'gpt-oss:20b',
      baseUrl: 'http://127.0.0.1:11434/v1'
    },
    {
      label: 'Custom OpenAI-compatible',
      provider: 'custom',
      name: 'Custom Text',
      model: '',
      baseUrl: ''
    }
  ],

  IMAGE: [
    {
      label: 'Google Imagen/Gemini',
      provider: 'google',
      name: 'Google Image',
      model: 'imagen-4.0-generate-preview-06-06',
      baseUrl: 'https://generativelanguage.googleapis.com'
    },
    {
      label: 'OpenAI DALL-E',
      provider: 'openai',
      name: 'OpenAI Image',
      model: 'gpt-image-1',
      baseUrl: 'https://api.openai.com/v1'
    },
    {
      label: 'xAI Grok',
      provider: 'xai',
      name: 'xAI Image',
      model: 'grok-2-image',
      baseUrl: 'https://api.x.ai/v1'
    },
    {
      label: 'Together AI',
      provider: 'together',
      name: 'Together Image',
      model: 'black-forest-labs/FLUX.2-dev',
      baseUrl: 'https://api.together.ai/v1'
    },
    {
      label: 'Custom OpenAI-compatible',
      provider: 'custom',
      name: 'Custom Image',
      model: '',
      baseUrl: ''
    }
  ],

  VIDEO: [
    {
      label: 'Google Veo',
      provider: 'google',
      name: 'Google Veo',
      model: 'veo-3.0-generate-preview',
      baseUrl: 'https://generativelanguage.googleapis.com'
    },
    {
      label: 'xAI Grok',
      provider: 'xai',
      name: 'xAI Video',
      model: 'grok-2-video',
      baseUrl: 'https://api.x.ai/v1'
    },
    {
      label: 'Custom xAI-compatible',
      provider: 'grok',
      name: 'Custom Video',
      model: '',
      baseUrl: 'https://api.x.ai/v1'
    }
  ]
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


  const [
    isFormOpen,
    setIsFormOpen
  ] =
    useState(false);


  const [
    showAdvancedFields,
    setShowAdvancedFields
  ] =
    useState(false);


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

    setShowAdvancedFields(
      false
    );

    setIsFormOpen(
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


  const getProviderPreset = (
    type: AIProviderType,
    provider: string
  ) =>
    PROVIDER_PRESETS[
      type
    ].find(
      preset =>
        preset.provider ===
        provider
    );


  const getDefaultPreset = (
    type: AIProviderType
  ) =>
    PROVIDER_PRESETS[
      type
    ][0];


  const getModelPresetValues = (
    type: AIProviderType
  ) => {

    const models =
      new Set<string>(
        type === 'TEXT'
          ? [
              'gemini-3.7-flash',
              'gemini-3.6-flash',
              'gemini-3.5-flash',
              'gemini-2.5-flash',
              'gemini-2.5-pro'
            ]
          : []
      );

    PROVIDER_PRESETS[
      type
    ].forEach(
      preset => {

        if (
          preset.model
        ) {

          models.add(
            preset.model
          );

        }

      }
    );

    return [
      ...models
    ];

  };


  const applyPresetToForm = (
    preset: ProviderPreset
  ) => {

    setForm(
      prev => ({
        ...prev,
        name:
          preset.name,
        provider:
          preset.provider,
        model:
          preset.model,
        baseUrl:
          preset.baseUrl
      })
    );

  };


  const startCreate = () => {

    clearMessages();

    const preset =
      getDefaultPreset(
        EMPTY_FORM.type
      );

    setEditingId(
      null
    );

    setForm({
      ...EMPTY_FORM,
      name:
        preset.name,
      provider:
        preset.provider,
      model:
        preset.model,
      baseUrl:
        preset.baseUrl
    });

    setShowFormKey(
      false
    );

    setShowAdvancedFields(
      false
    );

    setIsFormOpen(
      true
    );

  };


  const updateProviderType = (
    type: AIProviderType
  ) => {

    const preset =
      getDefaultPreset(
        type
      );

    setForm(
      prev => ({
        ...prev,
        type,
        name:
          preset.name,
        provider:
          preset.provider,
        model:
          preset.model,
        baseUrl:
          preset.baseUrl
      })
    );

    setShowAdvancedFields(
      false
    );

  };


  const updateProviderName = (
    provider: string
  ) => {

    const preset =
      getProviderPreset(
        form.type,
        provider
      );

    if (
      preset
    ) {

      applyPresetToForm(
        preset
      );

      setShowAdvancedFields(
        !preset.model ||
        !preset.baseUrl
      );

      return;

    }

    updateForm(
      'provider',
      provider
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
          'Vui lòng kiểm tra Provider, Model và Base URL trong phần Tùy chỉnh.'
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


          setShowAdvancedFields(
            false
          );


          setIsFormOpen(
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


        setShowAdvancedFields(
          false
        );


        setIsFormOpen(
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


    setShowAdvancedFields(
      true
    );


    setIsFormOpen(
      true
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
    <PageLayout
      title={t('config.title', 'CẤU HÌNH AI')}
      description="Quản lý AI Provider, Model, Base URL và API Key."
      actions={
        <>
          <Button
            type="button"
            size="sm"
            variant={
              isFormOpen
                ? 'secondary'
                : 'primary'
            }
            icon={
              isFormOpen
                ? 'close'
                : 'add'
            }
            onClick={
              isFormOpen
                ? resetForm
                : startCreate
            }
          >
            {
              isFormOpen
                ? 'ĐÓNG'
                : 'THÊM AI'
            }
          </Button>

          <div className="text-[11px] font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600">
            {providers.length} AI
          </div>
        </>
      }
    >
      <div className="h-full flex flex-col min-h-0">

        {/* ===================================================
            FORM
        ==================================================== */}

        {
          isFormOpen && (

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

        <form
          onSubmit={
            handleSubmit
          }

          className="
            soft-card
            flat-card
            space-y-4
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
                  text-[14px]
                  flex
                  items-center
                  gap-2
                "

                style={{
                  color:
                    'var(--text-main)'
                }}
              >

                {
                  editingId
                    ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">
                          edit
                        </span>
                        SỬA AI
                      </>
                    )
                    : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">
                          add
                        </span>
                        THÊM AI
                      </>
                    )
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

                    : 'Chọn loại AI, provider rồi nhập API Key. Model và Base URL đã được điền sẵn.'
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

                  <span className="material-symbols-outlined text-[18px]">
                    close
                  </span>
                  HỦY

                </button>

              )
            }

          </div>


          {/* QUICK SETUP */}

          <div
            className="
              grid
              grid-cols-1
              lg:grid-cols-2
              gap-4
            "
          >

            {/* TYPE */}

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
                LOẠI AI
              </label>


              <select
                value={
                  form.type
                }

                onChange={
                  e =>
                    updateProviderType(
                      e.currentTarget.value as AIProviderType
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


            {/* PROVIDER */}

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
                PROVIDER
              </label>


              <select
                value={
                  form.provider
                }

                onChange={
                  e =>
                    updateProviderName(
                      e.currentTarget.value
                    )
                }

                className="form-select"
              >

                {
                  form.provider &&
                  !getProviderPreset(
                    form.type,
                    form.provider
                  ) && (

                    <option value={form.provider}>
                      {form.provider}
                    </option>

                  )
                }

                {
                  PROVIDER_PRESETS[
                    form.type
                  ].map(
                    preset => (

                      <option
                        key={
                          preset.provider
                        }
                        value={
                          preset.provider
                        }
                      >
                        {preset.label}
                      </option>

                    )
                  )
                }

              </select>

            </div>

          </div>


          <div
            className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
              rounded-lg
              border
              px-3
              py-2
              text-[11px]
            "
            style={{
              background:
                'var(--bg-soft)',

              borderColor:
                'var(--border)'
            }}
          >

            <div
              className="
                min-w-0
                flex-1
              "
              style={{
                color:
                  'var(--text-secondary)'
              }}
            >
              <strong>
                {form.name || 'AI mới'}
              </strong>
              {' · '}
              {form.model || 'Chưa có model'}
              {' · '}
              <span className="break-all">
                {form.baseUrl || 'Chưa có Base URL'}
              </span>
            </div>


            <button
              type="button"
              onClick={
                () =>
                  setShowAdvancedFields(
                    prev =>
                      !prev
                  )
              }
              className="
                inline-flex
                items-center
                gap-1
                shrink-0
                text-[11px]
                font-bold
                text-blue-600
              "
            >
              <span className="material-symbols-outlined text-[16px]">
                {
                  showAdvancedFields
                    ? 'expand_less'
                    : 'tune'
                }
              </span>
              TÙY CHỈNH
            </button>

          </div>


          {
            showAdvancedFields && (

              <div
                className="
                  grid
                  grid-cols-1
                  lg:grid-cols-3
                  gap-4
                "
              >

                {/* NAME */}

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
                    TÊN HIỂN THỊ
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


                {/* MODEL */}

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
                    MODEL
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
                    list="ai-model-presets"
                  />

                  <datalist id="ai-model-presets">
                    {
                      getModelPresetValues(
                        form.type
                      ).map(
                        model => (
                          <option
                            key={
                              model
                            }
                            value={
                              model
                            }
                          />
                        )
                      )
                    }
                  </datalist>

                </div>


                {/* BASE URL */}

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
                    BASE URL
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

              </div>

            )
          }


          {/* ===================================================
              API KEY
          ==================================================== */}

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

              API KEY

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
                      editingId &&
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

              <Button
                type="button"

                onClick={
                  copyFormApiKey
                }

                className="
                  h-11
                  shrink-0
                "

                title="Sao chép API Key"
                variant="secondary"
                icon="content_copy"
              >

                SAO CHÉP

              </Button>

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

            <Button
              type="submit"

              loading={
                saving
              }

              icon={
                editingId
                  ? 'save'
                  : 'add'
              }

              className="
                h-10
              "
            >


              {
                saving
                  ? 'ĐANG LƯU...'
                  : editingId
                    ? 'LƯU THAY ĐỔI'
                    : 'THÊM AI'
              }

            </Button>


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

        </div>

          )
        }


        {
          !isFormOpen &&
          (message || error) && (

            <div className="px-4 pt-4">

              <div
                className="
                  p-3
                  rounded-lg
                  border
                  text-[12px]
                "
                style={{
                  background:
                    error
                      ? '#fef2f2'
                      : '#f0fdf4',

                  borderColor:
                    error
                      ? '#fecaca'
                      : '#bbf7d0',

                  color:
                    error
                      ? '#dc2626'
                      : '#16a34a'
                }}
              >
                {error || message}
              </div>

            </div>

          )
        }


        {/* ===================================================
            LIST HEADER
        ==================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            px-4
            pt-4
            pb-3
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
                flat-card
                mx-4
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
                flat-card
                mx-4
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
                Bấm THÊM AI ở header để tạo cấu hình mới.
              </div>

            </div>

          ) : (

            <div
              className="
                space-y-3
                px-4
                pb-4
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
                          rounded-lg
                          border
                          flat-card
                          p-4
                          bg-white
                          flex
                          flex-col
                          xl:flex-row
                          xl:items-center
                          justify-between
                          gap-4
                          transition-colors
                        "

                        style={{
                          background:
                            'var(--bg-main)',

                          borderColor:
                            editingId ===
                            item.id
                              ? '#2563eb'
                              : 'var(--border)'
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
    </PageLayout>
  );
};
