export type LanguageCode =
  | 'vi'
  | 'en'
  | 'bg'
  | 'ru'
  | 'es'
  | 'pt'
  | 'de'
  | 'fr';


export const LANGUAGES: {
  code: LanguageCode;
  label: string;
}[] = [
  {
    code: 'vi',
    label: '🇻🇳 Tiếng Việt'
  },
  {
    code: 'en',
    label: '🇺🇸 English'
  },
  {
    code: 'bg',
    label: '🇧🇬 Български'
  },
  {
    code: 'ru',
    label: '🇷🇺 Русский'
  },
  {
    code: 'es',
    label: '🇪🇸 Español'
  },
  {
    code: 'pt',
    label: '🇵🇹 Português'
  },
  {
    code: 'de',
    label: '🇩🇪 Deutsch'
  },
  {
    code: 'fr',
    label: '🇫🇷 Français'
  }
];


export const translations = {

  // =========================================================
  // VIETNAMESE
  // =========================================================

  vi: {

    common: {
      add: 'Thêm',
      delete: 'Xóa',
      save: 'Lưu',
      edit: 'Sửa',
      cancel: 'Hủy',
      confirm: 'Xác nhận',
      loading: 'Đang tải...',
      running: 'Đang chạy',
      completed: 'Hoàn thành',
      failed: 'Thất bại',
      error: 'Lỗi',
      success: 'Thành công',
      default: 'Mặc định',
      enabled: 'Kích hoạt',
      disabled: 'Đã tắt',
      lightMode: 'Chế độ sáng',
      darkMode: 'Chế độ tối',
      language: 'Ngôn ngữ',
      search: 'Tìm kiếm',
      all: 'Tất cả',
      status: 'Trạng thái',
      note: 'Ghi chú'
    },


    sidebar: {
      dashboard: 'Tổng Quan',

      production:
        'Sản Xuất',

      imageCaption:
        'Ảnh & Caption',

      newsImageCaption:
        'Ảnh & Bài Viết',

      videoPipeline:
        'Video',

      // Đổi từ TIN TỨC -> LÀM BÁO
      news:
        'Làm Báo',

      system:
        'Hệ Thống',

      activityLog:
        'Lịch Sử Hoạt Động',

      config:
        'Cấu Hình'
    },


    production: {
      title:
        'SẢN XUẤT > ẢNH & CAPTION',

      addRow:
        'THÊM HÀNG',

      runAll:
        'CHẠY TẤT CẢ',

      rowCount:
        'hàng dữ liệu'
    },


    news: {
      title:
        'LÀM BÁO > ẢNH & BÀI VIẾT'
    },


    table: {
      select:
        'CHỌN',

      stt:
        'STT',

      characterName:
        'TÊN NHÂN VẬT',

      referenceImages:
        'HÌNH THAM KHẢO',

      imagePrompt:
        'LỆNH TẠO ẢNH',

      imageResult:
        'ẢNH TẠO XONG',

      captionSample:
        'MẪU THAM KHẢO CAPTIONS',

      captionInstruction:
        'ÉP VIẾT CAPTIONS CỦA TÊN NHÂN VẬT',

      captionPreset:
        'MẶC ĐỊNH CAPTIONS SẼ NHƯ THẾ NÀY',

      captionResult:
        'CAPTIONS THÀNH CÔNG',

      savePath:
        'THƯ MỤC LƯU',

      done:
        'ĐÃ XONG',

      error:
        'ĐANG LỖI'
    },


    pipeline: {
      characterPlaceholder:
        'Nhập tên nhân vật...',

      imagePromptPlaceholder:
        'Nhập lệnh tạo ảnh...',

      captionSamplePlaceholder:
        'Dán mẫu caption tham khảo...',

      captionInstructionPlaceholder:
        'Nhập nhân vật/chủ thể mà AI bắt buộc phải tập trung...',

      captionPresetPlaceholder:
        'Nhập quy tắc, ngôn ngữ và form caption...',

      captionResultPlaceholder:
        'Caption thành công...',

      savePathPlaceholder:
        'E:\\PROJECT\\MEDIA',

      addImage:
        'Chọn ảnh từ máy',

      pasteImageUrl:
        'Dán URL ảnh...',

      addUrl:
        'THÊM',

      imageHelper:
        'Bấm +, kéo ảnh từ máy hoặc dán URL ảnh.',

      generateImage:
        'TẠO ẢNH',

      generateCaption:
        'TẠO CAPTION',

      // Caption hiện tự động lưu.
      autoSaveTxt:
        'TXT TỰ ĐỘNG LƯU',

      saveImage:
        'Lưu ảnh',

      regenerateImage:
        'Tạo lại ảnh',

      noDefaultImageAI:
        'CHƯA CẤU HÌNH AI ẢNH MẶC ĐỊNH.',

      noDefaultTextAI:
        'CHƯA CẤU HÌNH AI TEXT MẶC ĐỊNH.',

      noImagePrompt:
        'Chưa nhập LỆNH TẠO ẢNH.',

      noSavePath:
        'Chưa nhập THƯ MỤC LƯU.',

      invalidImageFile:
        'File không phải hình ảnh.',

      invalidImageUrl:
        'URL không trả về file hình ảnh.',

      running:
        'ĐANG CHẠY',

      completed:
        'HOÀN THÀNH'
    },


    video: {
      title:
        'SẢN XUẤT > VIDEO',

      runAll:
        'CHẠY TẤT CẢ',

      select:
        'CHỌN',

      stt:
        'STT',

      sourceImage:
        'LẤY HÌNH ẢNH',

      videoPrompt:
        'FORM VIDEO',

      videoResult:
        'TẠO XONG VIDEO',

      success:
        'THÀNH CÔNG',

      failed:
        'THẤT BẠI',

      confirmSave:
        'XÁC NHẬN LƯU',

      savePath:
        'THƯ MỤC LƯU',

      saveButton:
        'NÚT LƯU',

      done:
        'ĐÃ XONG',

      promptPlaceholder:
        'Nhập FORM VIDEO...',

      noSourceImage:
        'CHƯA CÓ ẢNH NGUỒN',

      createVideo:
        'TẠO VIDEO',

      saveVideo:
        'LƯU VIDEO',

      sourceChanged:
        'ẢNH NGUỒN ĐÃ THAY ĐỔI',

      running:
        'ĐANG TẠO',

      ok:
        'OK',

      noDefaultVideoAI:
        'CHƯA CẤU HÌNH AI VIDEO MẶC ĐỊNH.',

      noVideoPrompt:
        'Chưa nhập FORM VIDEO.',

      noVideo:
        'Chưa có video để lưu.',

      noSaveConfirm:
        'Bạn chưa XÁC NHẬN LƯU.',

      noSavePath:
        'Chưa có THƯ MỤC LƯU.'
    },


    activity: {
      title:
        'LỊCH SỬ HOẠT ĐỘNG',

      subtitle:
        'Theo dõi hoạt động tạo ảnh, caption, video, lưu file và lỗi hệ thống.',

      total:
        'hoạt động',

      search:
        'TÌM KIẾM',

      searchPlaceholder:
        'Tìm theo STT, nhân vật, nội dung, đường dẫn, lỗi...',

      module:
        'MODULE',

      status:
        'TRẠNG THÁI',

      all:
        'TẤT CẢ',

      production:
        'SẢN XUẤT',

      news:
        'LÀM BÁO',

      video:
        'VIDEO',

      system:
        'HỆ THỐNG',

      success:
        'THÀNH CÔNG',

      failed:
        'THẤT BẠI',

      running:
        'ĐANG CHẠY',

      info:
        'THÔNG TIN',

      time:
        'THỜI GIAN',

      action:
        'HOẠT ĐỘNG',

      stt:
        'STT',

      subject:
        'NHÂN VẬT / CHỦ THỂ',

      message:
        'NỘI DUNG',

      file:
        'FILE',

      error:
        'LỖI',

      note:
        'GHI CHÚ',

      operations:
        'THAO TÁC',

      edit:
        'SỬA',

      save:
        'LƯU',

      cancel:
        'HỦY',

      delete:
        'XÓA',

      clearAll:
        'XÓA TẤT CẢ',

      noLogs:
        'CHƯA CÓ LỊCH SỬ HOẠT ĐỘNG',

      createImage:
        'TẠO ẢNH',

      regenerateImage:
        'TẠO LẠI ẢNH',

      saveImage:
        'LƯU ẢNH',

      createCaption:
        'TẠO CAPTION',

      saveCaption:
        'LƯU CAPTION',

      createVideo:
        'TẠO VIDEO',

      saveVideo:
        'LƯU VIDEO',

      configCreate:
        'THÊM CẤU HÌNH',

      configUpdate:
        'SỬA CẤU HÌNH',

      configDelete:
        'XÓA CẤU HÌNH',

      other:
        'KHÁC'
    },


    config: {
      title:
        'CẤU HÌNH AI',

      subtitle:
        'Thêm và quản lý API thật cho TEXT, IMAGE và VIDEO.',

      addAI:
        '+ THÊM AI',

      addAIButton:
        'THÊM AI',

      editAI:
        'SỬA AI',

      saveChanges:
        'LƯU THAY ĐỔI',

      cancelEdit:
        'HỦY SỬA',

      saving:
        'ĐANG LƯU...',

      displayName:
        'Tên hiển thị',

      aiType:
        'Loại AI',

      provider:
        'Provider',

      model:
        'Model',

      baseUrl:
        'Base URL',

      apiKey:
        'API Key',

      apiKeyKeep:
        'Để trống để giữ API Key hiện tại',

      displayNamePlaceholder:
        'Ví dụ: Gemini Caption',

      providerPlaceholder:
        'openai / google / xai...',

      modelPlaceholder:
        'Tên model thật',

      baseUrlPlaceholder:
        'https://...',

      apiKeyPlaceholder:
        'Nhập API Key',

      active:
        'Kích hoạt',

      setDefault:
        'Đặt làm mặc định',

      configuredAI:
        'AI đã cấu hình',

      noAI:
        'CHƯA CÓ AI',

      noAIHelp:
        'Thêm AI ở biểu mẫu phía trên.',

      providerLabel:
        'Provider',

      modelLabel:
        'Model',

      apiLabel:
        'API',

      edit:
        'SỬA',

      delete:
        'XÓA',

      default:
        'MẶC ĐỊNH',

      off:
        'ĐÃ TẮT',

      fillAll:
        'Vui lòng nhập đầy đủ thông tin AI.',

      addSuccess:
        'Đã thêm AI thành công.',

      updateSuccess:
        'Đã cập nhật AI thành công.',

      addFailed:
        'Thêm AI thất bại.',

      updateFailed:
        'Cập nhật AI thất bại.',

      loadFailed:
        'Không tải được cấu hình AI.',

      deleteFailed:
        'Xóa AI thất bại.',

      setDefaultFailed:
        'Không thể đặt AI mặc định.'
    },


    dashboard: {
      title:
        'TỔNG QUAN',

      subtitle:
        'Theo dõi nhanh số lượng công việc trong hệ thống.',

      productionJobs:
        'Job Sản Xuất',

      newsJobs:
        'Job Làm Báo',

      productionDescription:
        'Ảnh, caption và video đang quản lý',

      newsDescription:
        'Ảnh và caption thuộc pipeline Làm Báo',

      localTitle:
        'Tools-MMO Local',

      localDescription:
        'SẢN XUẤT và LÀM BÁO được quản lý độc lập. VIDEO chỉ nhận dữ liệu ảnh từ pipeline SẢN XUẤT.'
    }

  },


  // =========================================================
  // ENGLISH
  // =========================================================

  en: {

    common: {
      add: 'Add',
      delete: 'Delete',
      save: 'Save',
      edit: 'Edit',
      cancel: 'Cancel',
      confirm: 'Confirm',
      loading: 'Loading...',
      running: 'Running',
      completed: 'Completed',
      failed: 'Failed',
      error: 'Error',
      success: 'Success',
      default: 'Default',
      enabled: 'Enabled',
      disabled: 'Disabled',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      language: 'Language',
      search: 'Search',
      all: 'All',
      status: 'Status',
      note: 'Note'
    },


    sidebar: {
      dashboard:
        'Dashboard',

      production:
        'Production',

      imageCaption:
        'Image & Caption',

      newsImageCaption:
        'Image & Article',

      videoPipeline:
        'Video',

      news:
        'News Production',

      system:
        'System',

      activityLog:
        'Activity History',

      config:
        'Settings'
    },


    production: {
      title:
        'PRODUCTION > IMAGE & CAPTION',

      addRow:
        'ADD ROW',

      runAll:
        'RUN ALL',

      rowCount:
        'rows'
    },


    news: {
      title:
        'NEWS > IMAGE & ARTICLE'
    },


    table: {
      select:
        'SELECT',

      stt:
        'NO.',

      characterName:
        'CHARACTER NAME',

      referenceImages:
        'REFERENCE IMAGES',

      imagePrompt:
        'IMAGE PROMPT',

      imageResult:
        'GENERATED IMAGE',

      captionSample:
        'CAPTION REFERENCE',

      captionInstruction:
        'CAPTION SUBJECT INSTRUCTION',

      captionPreset:
        'DEFAULT CAPTION RULES',

      captionResult:
        'FINAL CAPTION',

      savePath:
        'SAVE FOLDER',

      done:
        'DONE',

      error:
        'ERROR'
    },


    pipeline: {
      characterPlaceholder:
        'Enter character name...',

      imagePromptPlaceholder:
        'Enter image prompt...',

      captionSamplePlaceholder:
        'Paste reference caption...',

      captionInstructionPlaceholder:
        'Enter the character/subject AI must focus on...',

      captionPresetPlaceholder:
        'Enter caption language, rules and format...',

      captionResultPlaceholder:
        'Final caption...',

      savePathPlaceholder:
        'E:\\PROJECT\\MEDIA',

      addImage:
        'Choose image from computer',

      pasteImageUrl:
        'Paste image URL...',

      addUrl:
        'ADD',

      imageHelper:
        'Click +, drag local images, or paste an image URL.',

      generateImage:
        'GENERATE IMAGE',

      generateCaption:
        'GENERATE CAPTION',

      autoSaveTxt:
        'TXT AUTO-SAVED',

      saveImage:
        'Save image',

      regenerateImage:
        'Regenerate image',

      noDefaultImageAI:
        'NO DEFAULT IMAGE AI CONFIGURED.',

      noDefaultTextAI:
        'NO DEFAULT TEXT AI CONFIGURED.',

      noImagePrompt:
        'IMAGE PROMPT is empty.',

      noSavePath:
        'SAVE FOLDER is empty.',

      invalidImageFile:
        'File is not an image.',

      invalidImageUrl:
        'URL did not return an image.',

      running:
        'RUNNING',

      completed:
        'COMPLETED'
    },


    video: {
      title:
        'PRODUCTION > VIDEO',

      runAll:
        'RUN ALL',

      select:
        'SELECT',

      stt:
        'NO.',

      sourceImage:
        'SOURCE IMAGE',

      videoPrompt:
        'VIDEO PROMPT',

      videoResult:
        'GENERATED VIDEO',

      success:
        'SUCCESS',

      failed:
        'FAILED',

      confirmSave:
        'CONFIRM SAVE',

      savePath:
        'SAVE FOLDER',

      saveButton:
        'SAVE',

      done:
        'DONE',

      promptPlaceholder:
        'Enter video prompt...',

      noSourceImage:
        'NO SOURCE IMAGE',

      createVideo:
        'GENERATE VIDEO',

      saveVideo:
        'SAVE VIDEO',

      sourceChanged:
        'SOURCE IMAGE CHANGED',

      running:
        'GENERATING',

      ok:
        'OK',

      noDefaultVideoAI:
        'NO DEFAULT VIDEO AI CONFIGURED.',

      noVideoPrompt:
        'VIDEO PROMPT is empty.',

      noVideo:
        'No video available to save.',

      noSaveConfirm:
        'SAVE has not been confirmed.',

      noSavePath:
        'SAVE FOLDER is empty.'
    },


    activity: {
      title:
        'ACTIVITY HISTORY',

      subtitle:
        'Track image, caption, video, file save and system operations.',

      total:
        'activities',

      search:
        'SEARCH',

      searchPlaceholder:
        'Search by number, subject, message, file path or error...',

      module:
        'MODULE',

      status:
        'STATUS',

      all:
        'ALL',

      production:
        'PRODUCTION',

      news:
        'NEWS PRODUCTION',

      video:
        'VIDEO',

      system:
        'SYSTEM',

      success:
        'SUCCESS',

      failed:
        'FAILED',

      running:
        'RUNNING',

      info:
        'INFO',

      time:
        'TIME',

      action:
        'ACTION',

      stt:
        'NO.',

      subject:
        'CHARACTER / SUBJECT',

      message:
        'MESSAGE',

      file:
        'FILE',

      error:
        'ERROR',

      note:
        'NOTE',

      operations:
        'OPERATIONS',

      edit:
        'EDIT',

      save:
        'SAVE',

      cancel:
        'CANCEL',

      delete:
        'DELETE',

      clearAll:
        'DELETE ALL',

      noLogs:
        'NO ACTIVITY HISTORY',

      createImage:
        'GENERATE IMAGE',

      regenerateImage:
        'REGENERATE IMAGE',

      saveImage:
        'SAVE IMAGE',

      createCaption:
        'GENERATE CAPTION',

      saveCaption:
        'SAVE CAPTION',

      createVideo:
        'GENERATE VIDEO',

      saveVideo:
        'SAVE VIDEO',

      configCreate:
        'CREATE CONFIG',

      configUpdate:
        'UPDATE CONFIG',

      configDelete:
        'DELETE CONFIG',

      other:
        'OTHER'
    },


    config: {
      title:
        'AI SETTINGS',

      subtitle:
        'Add and manage real APIs for TEXT, IMAGE and VIDEO.',

      addAI:
        '+ ADD AI',

      addAIButton:
        'ADD AI',

      editAI:
        'EDIT AI',

      saveChanges:
        'SAVE CHANGES',

      cancelEdit:
        'CANCEL EDIT',

      saving:
        'SAVING...',

      displayName:
        'Display Name',

      aiType:
        'AI Type',

      provider:
        'Provider',

      model:
        'Model',

      baseUrl:
        'Base URL',

      apiKey:
        'API Key',

      apiKeyKeep:
        'Leave blank to keep the current API Key',

      displayNamePlaceholder:
        'Example: Gemini Caption',

      providerPlaceholder:
        'openai / google / xai...',

      modelPlaceholder:
        'Real model name',

      baseUrlPlaceholder:
        'https://...',

      apiKeyPlaceholder:
        'Enter API Key',

      active:
        'Enabled',

      setDefault:
        'Set as default',

      configuredAI:
        'Configured AI',

      noAI:
        'NO AI CONFIGURED',

      noAIHelp:
        'Add an AI provider using the form above.',

      providerLabel:
        'Provider',

      modelLabel:
        'Model',

      apiLabel:
        'API',

      edit:
        'EDIT',

      delete:
        'DELETE',

      default:
        'DEFAULT',

      off:
        'DISABLED',

      fillAll:
        'Please fill in all required AI fields.',

      addSuccess:
        'AI added successfully.',

      updateSuccess:
        'AI updated successfully.',

      addFailed:
        'Failed to add AI.',

      updateFailed:
        'Failed to update AI.',

      loadFailed:
        'Failed to load AI settings.',

      deleteFailed:
        'Failed to delete AI.',

      setDefaultFailed:
        'Failed to set default AI.'
    },


    dashboard: {
      title:
        'DASHBOARD',

      subtitle:
        'Quick overview of jobs in the system.',

      productionJobs:
        'Production Jobs',

      newsJobs:
        'News Production Jobs',

      productionDescription:
        'Images, captions and videos being managed',

      newsDescription:
        'Images and captions in the independent News Production pipeline',

      localTitle:
        'Tools-MMO Local',

      localDescription:
        'PRODUCTION and NEWS PRODUCTION are managed separately. VIDEO only receives images from PRODUCTION.'
    }

  },


  // =========================================================
  // OTHER LANGUAGES
  //
  // Hiện fallback về tiếng Việt.
  // Chúng ta sẽ dịch đầy đủ từng ngôn ngữ sau để tránh làm
  // quá nhiều việc trong một bước.
  // =========================================================

  bg: {},

  ru: {},

  es: {},

  pt: {},

  de: {},

  fr: {}

} as const;


export type TranslationTree =
  typeof translations.vi;