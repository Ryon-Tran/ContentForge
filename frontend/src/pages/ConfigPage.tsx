import React, { useEffect, useState } from 'react';
import { AIProviderConfig, AIProviderType } from '../types';
import { FlowService } from '../services/FlowService';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ToastContainer, ToastMessage } from '../components/ui/Toast';

interface Preset {
  label: string;
  provider: string;
  name: string;
  model: string;
  baseUrl: string;
  apiKeyHelp?: string;
}

const PRESETS: Record<AIProviderType, Preset[]> = {
  TEXT: [
    { label: 'Google Gemini', provider: 'google', name: 'Gemini Text', model: 'gemini-2.0-flash', baseUrl: 'https://generativelanguage.googleapis.com' },
    { label: 'OpenAI ChatGPT', provider: 'openai', name: 'OpenAI GPT-4o', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
    { label: 'Anthropic Claude', provider: 'anthropic', name: 'Claude 3.5 Sonnet', model: 'claude-3-5-sonnet-20241022', baseUrl: 'https://api.anthropic.com' },
    { label: 'Ollama (Local)', provider: 'ollama', name: 'Ollama Llama 3.2', model: 'llama3.2', baseUrl: 'http://localhost:11434', apiKeyHelp: 'Không cần API Key' },
    { label: 'LM Studio (Local)', provider: 'lmstudio', name: 'LM Studio Local', model: 'loaded-model', baseUrl: 'http://localhost:1234/v1', apiKeyHelp: 'Không cần API Key' },
    { label: 'DeepSeek', provider: 'deepseek', name: 'DeepSeek V3', model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1' }
  ],
  IMAGE: [
    { label: 'Google Imagen', provider: 'google', name: 'Google Imagen 3', model: 'imagen-3.0-generate-002', baseUrl: 'https://generativelanguage.googleapis.com' },
    { label: 'OpenAI DALL-E', provider: 'openai', name: 'DALL-E 3', model: 'dall-e-3', baseUrl: 'https://api.openai.com/v1' },
    { label: 'xAI Grok Aurora', provider: 'xai', name: 'Grok Aurora Image', model: 'aurora', baseUrl: 'https://api.x.ai/v1' },
    { label: 'SD WebUI (Local)', provider: 'sdwebui', name: 'Stable Diffusion WebUI', model: 'v1-5-pruned', baseUrl: 'http://localhost:7860', apiKeyHelp: 'Không cần API Key' },
    { label: 'ComfyUI (Local)', provider: 'comfyui', name: 'ComfyUI Local API', model: 'v1-5-pruned-emaonly.safetensors', baseUrl: 'http://localhost:8188', apiKeyHelp: 'Không cần API Key' }
  ],
  VIDEO: [
    { label: 'Google Veo', provider: 'google', name: 'Google Veo Preview', model: 'veo-3.0-generate-preview', baseUrl: 'https://generativelanguage.googleapis.com' },
    { label: 'xAI Grok Video', provider: 'xai', name: 'xAI Grok Video', model: 'grok-2-aurora', baseUrl: 'https://api.x.ai/v1' }
  ]
};

export const ConfigModule: React.FC = () => {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<AIProviderType>('TEXT');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; models?: string[] } | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [form, setForm] = useState<{
    name: string;
    provider: string;
    type: AIProviderType;
    model: string;
    baseUrl: string;
    apiKey: string;
    isActive: boolean;
    isDefault: boolean;
  }>({
    name: '',
    provider: 'google',
    type: 'TEXT',
    model: '',
    baseUrl: '',
    apiKey: '',
    isActive: true,
    isDefault: false
  });

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const loadProviders = async () => {
    try {
      const list = await FlowService.config.listProviders();
      setProviders(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleSelectPreset = (preset: Preset) => {
    setForm(prev => ({
      ...prev,
      name: preset.name,
      provider: preset.provider,
      model: preset.model,
      baseUrl: preset.baseUrl,
      apiKey: preset.provider.includes('local') || preset.provider === 'ollama' || preset.provider === 'lmstudio' ? '' : prev.apiKey
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!form.model.trim() && form.provider !== 'ollama') {
      addToast('error', 'Vui lòng nhập tên Model trước khi kiểm tra.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await FlowService.config.testConnection({
        provider: form.provider,
        type: form.type,
        model: form.model,
        baseUrl: form.baseUrl,
        apiKey: form.apiKey
      });
      setTestResult(res);
      if (res.ok) {
        addToast('success', res.message);
      } else {
        addToast('error', res.message);
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message });
      addToast('error', `Lỗi kết nối: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast('error', 'Vui lòng nhập tên cấu hình.');
      return;
    }

    try {
      if (editingId) {
        await FlowService.config.updateProvider(editingId, form);
        addToast('success', 'Đã cập nhật cấu hình AI!');
      } else {
        await FlowService.config.createProvider(form);
        addToast('success', 'Đã thêm cấu hình AI mới!');
      }
      setEditingId(null);
      setTestResult(null);
      setForm({
        name: '',
        provider: 'google',
        type: activeTab,
        model: '',
        baseUrl: '',
        apiKey: '',
        isActive: true,
        isDefault: false
      });
      loadProviders();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  const handleSetDefault = async (id: string, type: string) => {
    await FlowService.config.setDefault(id, type);
    loadProviders();
    addToast('success', 'Đã đặt làm AI mặc định!');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa cấu hình này?')) return;
    await FlowService.config.deleteProvider(id);
    loadProviders();
    addToast('success', 'Đã xóa cấu hình.');
  };

  const filteredProviders = providers.filter(p => p.type === activeTab);

  return (
    <div className="page-wrap overflow-y-auto">
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(t => t.filter(x => x.id !== id))} />

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2 className="page-title">CẤU HÌNH AI CLOUD & LOCAL</h2>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Quản lý API Key, Local Server (Ollama, LM Studio, ComfyUI, SD WebUI) và chọn model mặc định
          </p>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* TABS (TEXT, IMAGE, VIDEO) */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
          {(['TEXT', 'IMAGE', 'VIDEO'] as AIProviderType[]).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setForm(f => ({ ...f, type: tab }));
                setEditingId(null);
                setTestResult(null);
              }}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                activeTab === tab
                  ? 'bg-[var(--primary)] text-white shadow-md'
                  : 'bg-[var(--bg-soft)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab === 'TEXT' && '📝 Text & Caption (Ollama / Claude / GPT)'}
              {tab === 'IMAGE' && '🎨 Tạo Ảnh (ComfyUI / SD WebUI / Imagen)'}
              {tab === 'VIDEO' && '🎬 Tạo Video (Veo / Grok)'}
            </button>
          ))}
        </div>

        {/* MAIN LAYOUT: FORM + LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* FORM (5 cols) */}
          <div className="lg:col-span-5 soft-card space-y-4">
            <h3 className="font-bold text-[14px] text-[var(--text-main)]">
              {editingId ? 'Chỉnh Sửa Cấu Hình' : 'Thêm Cấu Hình Mới'}
            </h3>

            {/* PRESETS BUTTONS */}
            <div>
              <label className="text-[11.5px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                Mẫu Cấu Hình Nhanh (Preset)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS[activeTab].map(pr => (
                  <button
                    key={pr.label}
                    type="button"
                    onClick={() => handleSelectPreset(pr)}
                    className="px-2.5 py-1 rounded-lg text-[11.5px] font-medium bg-[var(--bg-soft)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-main)] transition-colors"
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-[12px] font-medium block mb-1">Tên cấu hình *</label>
                <input
                  type="text"
                  required
                  className="ui-input"
                  placeholder="VD: Ollama Llama 3.2"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[12px] font-medium block mb-1">Provider *</label>
                  <input
                    type="text"
                    required
                    className="ui-input"
                    placeholder="ollama, google, openai..."
                    value={form.provider}
                    onChange={e => setForm({ ...form, provider: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium block mb-1">Tên Model *</label>
                  <input
                    type="text"
                    required
                    className="ui-input"
                    placeholder="llama3.2, gpt-4o..."
                    value={form.model}
                    onChange={e => setForm({ ...form, model: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1">Base URL (Local hoặc Proxy)</label>
                <input
                  type="text"
                  className="ui-input"
                  placeholder="http://localhost:11434 hoặc để trống"
                  value={form.baseUrl}
                  onChange={e => setForm({ ...form, baseUrl: e.target.value })}
                />
              </div>

              <div>
                <label className="text-[12px] font-medium block mb-1">
                  API Key <span className="text-[var(--text-muted)] font-normal">(để trống nếu là model Local)</span>
                </label>
                <input
                  type="password"
                  className="ui-input font-mono text-[12px]"
                  placeholder="sk-..."
                  value={form.apiKey}
                  onChange={e => setForm({ ...form, apiKey: e.target.value })}
                />
              </div>

              {/* TEST RESULT BOX */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-[12px] ${
                    testResult.ok
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="font-bold">{testResult.ok ? '✓ Thành công' : '✗ Thất bại'}</div>
                  <div className="mt-0.5">{testResult.message}</div>
                  {testResult.models && testResult.models.length > 0 && (
                    <div className="mt-1.5 text-[11px] text-emerald-400 font-mono">
                      Models phát hiện: {testResult.models.slice(0, 5).join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  icon="network_check"
                  loading={testing}
                  onClick={handleTestConnection}
                >
                  Test Kết Nối
                </Button>

                <Button type="submit" variant="primary" icon="save">
                  {editingId ? 'Cập Nhật' : 'Lưu Cấu Hình'}
                </Button>

                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null);
                      setForm({
                        name: '',
                        provider: 'google',
                        type: activeTab,
                        model: '',
                        baseUrl: '',
                        apiKey: '',
                        isActive: true,
                        isDefault: false
                      });
                    }}
                  >
                    Hủy
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* LIST (7 cols) */}
          <div className="lg:col-span-7 soft-card space-y-3">
            <h3 className="font-bold text-[14px] text-[var(--text-main)]">
              Danh Sách Cấu Hình {activeTab}
            </h3>

            {filteredProviders.length === 0 ? (
              <EmptyState
                icon="settings"
                title="Chưa có cấu hình"
                description={`Hãy thêm cấu hình ${activeTab} đầu tiên ở bảng bên trái hoặc chọn từ preset.`}
              />
            ) : (
              <div className="space-y-2">
                {filteredProviders.map(p => (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      p.isDefault
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                        : 'border-[var(--border)] bg-[var(--bg-soft)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[13px] text-[var(--text-main)]">{p.name}</span>
                        {p.isDefault && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[var(--primary)] text-white">
                            MẶC ĐỊNH
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-[var(--bg-card)] text-[var(--text-muted)]">
                          {p.provider}
                        </span>
                      </div>
                      <div className="text-[12px] text-[var(--text-secondary)] font-mono mt-1">
                        Model: <span className="text-[var(--text-main)]">{p.model}</span> | URL: {p.baseUrl || 'Default Cloud'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!p.isDefault && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSetDefault(p.id, p.type)}
                        >
                          Đặt Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="edit"
                        onClick={() => {
                          setEditingId(p.id);
                          setForm({
                            name: p.name,
                            provider: p.provider,
                            type: p.type,
                            model: p.model,
                            baseUrl: p.baseUrl,
                            apiKey: '',
                            isActive: p.isActive,
                            isDefault: p.isDefault
                          });
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="delete"
                        onClick={() => handleDelete(p.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
