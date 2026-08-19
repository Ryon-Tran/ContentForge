import React, {
  useRef,
  useState
} from 'react';

import {
  WorkflowRow,
  ReferenceImage,
  AppConfig,
  ActivityStatus,
  ActivityType
} from '../types';

import {
  useService
} from '../context/ServiceContext';

import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { PageLayout } from '../layouts/PageLayout';


interface Props {
  title: string;
  items: WorkflowRow[];

  setItems:
    React.Dispatch<
      React.SetStateAction<WorkflowRow[]>
    >;

  config: AppConfig;

  isNews?: boolean;
}


export const PipelineModule:
  React.FC<Props> = ({
    title,
    items,
    setItems,
    config,
    isNews = false
  }) => {

  const service =
    useService();


  const [
    selectedIds,
    setSelectedIds
  ] = useState<Set<string>>(
    new Set()
  );


  const [
    urlInputs,
    setUrlInputs
  ] = useState<
    Record<string, string>
  >({});


  const fileInputRefs =
    useRef<
      Record<
        string,
        HTMLInputElement | null
      >
    >({});


  // =========================================================
  // MODULE
  // =========================================================

  const activityModule =
    isNews
      ? 'NEWS'
      : 'PRODUCTION';


  // =========================================================
  // ROW HELPERS
  // =========================================================

  const updateRow = (
    id: string,
    field: keyof WorkflowRow,
    value: any
  ) => {

    setItems(
      prev => {
        const next = prev.map(
          row =>
            row.id === id
              ? {
                  ...row,
                  [field]: value
                }
              : row
        );
        const updatedRow = next.find(r => r.id === id);
        if (updatedRow) {
          service.storage.saveRow(updatedRow, isNews ? 'news' : 'production').catch(console.error);
        }
        return next;
      }
    );

  };


  const patchRow = (
    id: string,
    patch: Partial<WorkflowRow>
  ) => {

    setItems(
      prev => {
        const next = prev.map(
          row =>
            row.id === id
              ? {
                  ...row,
                  ...patch
                }
              : row
        );
        const updatedRow = next.find(r => r.id === id);
        if (updatedRow) {
          service.storage.saveRow(updatedRow, isNews ? 'news' : 'production').catch(console.error);
        }
        return next;
      }
    );

  };


  // =========================================================
  // ERROR
  // =========================================================

  const formatError = (
    err: any
  ) => {

    const msg =
      err?.message ||
      String(err);


    if (
      msg.includes(
        'UNSAFE_GENERATION'
      )
    ) {

      return (
        'Nội dung bị chặn. ' +
        'Hãy thử thay đổi Prompt.'
      );

    }


    if (
      msg.includes(
        'SOMETHING_WENT_WRONG'
      )
    ) {

      return (
        'Lỗi hệ thống AI. ' +
        'Vui lòng thử lại.'
      );

    }


    if (
      msg.toLowerCase()
        .includes('cancelled') ||
      msg.toLowerCase()
        .includes('canceled')
    ) {

      return '';

    }


    return msg;

  };


  // =========================================================
  // ACTIVITY LOG
  // =========================================================

  const writeActivity =
    async (
      row: WorkflowRow,
      type: ActivityType,
      status: ActivityStatus,
      message: string,
      options?: {
        filePath?: string;
        error?: string;
      }
    ) => {

    /*
      QUAN TRỌNG:
      Nếu ghi log lỗi thì KHÔNG được làm hỏng
      quy trình tạo ảnh/caption chính.
    */

    try {

      const now =
        Date.now();


      await service.activity.create({
        id:
          crypto.randomUUID(),

        module:
          activityModule,

        type,

        status,

        rowId:
          row.id,

        stt:
          row.stt,

        subject:
          (
            row.captionInstruction.trim() ||
            row.characterName.trim() ||
            ''
          ),

        message,

        filePath:
          options?.filePath,

        error:
          options?.error,

        note:
          '',

        createdAt:
          now,

        updatedAt:
          now
      });

    } catch (
      error
    ) {

      console.error(
        'Không ghi được Activity Log:',
        error
      );

    }

  };


  const makeDisplayPath = (
    directory: string,
    filename: string
  ) => {

    const clean =
      directory
        .trim()
        .replace(
          /[\\/]+$/,
          ''
        );


    if (!clean) {
      return filename;
    }


    return `${clean}\\${filename}`;

  };


  // =========================================================
  // ADD ROW
  // =========================================================

  const addRow = () => {

    const maxNumber =
      items.reduce(
        (
          max,
          row
        ) => {

          const n =
            Number(
              row.stt
            );


          return Number.isFinite(n)
            ? Math.max(
                max,
                n
              )
            : max;

        },
        0
      );


    const nextStt =
      String(
        maxNumber + 1
      ).padStart(
        3,
        '0'
      );


    const newRow:
      WorkflowRow = {

      id:
        crypto.randomUUID(),

      stt:
        nextStt,

      characterName:
        '',

      referenceImages:
        [],

      imagePrompt:
        '',

      imageVersions:
        [],

      currentImageIndex:
        -1,

      captionSample:
        '',

      captionInstruction:
        '',

      captionPreset:
        '',

      captionResult:
        '',

      savePath:
        '',

      isDone:
        false,

      status:
        'IDLE',

      error:
        '',

      createdAt:
        Date.now()

    };


    setItems(
      prev => {
        const next = [
          ...prev,
          newRow
        ];
        service.storage.saveRow(newRow, isNews ? 'news' : 'production').catch(console.error);
        return next;
      }
    );

  };


  // =========================================================
  // LOCAL IMAGE
  // =========================================================

  const fileToReferenceImage = (
    file: File
  ):
    Promise<ReferenceImage> => {

    return new Promise(
      (
        resolve,
        reject
      ) => {

        if (
          !file.type.startsWith(
            'image/'
          )
        ) {

          reject(
            new Error(
              'File không phải hình ảnh.'
            )
          );

          return;

        }


        const reader =
          new FileReader();


        reader.onload =
          () => {

            const dataUrl =
              String(
                reader.result ||
                ''
              );


            const commaIndex =
              dataUrl.indexOf(
                ','
              );


            if (
              commaIndex === -1
            ) {

              reject(
                new Error(
                  'Không đọc được dữ liệu ảnh.'
                )
              );

              return;

            }


            resolve({
              id:
                crypto.randomUUID(),

              base64:
                dataUrl.substring(
                  commaIndex + 1
                ),

              mimeType:
                file.type ||
                'image/jpeg',

              mediaId:
                `local:${crypto.randomUUID()}`
            });

          };


        reader.onerror =
          () => {

            reject(
              new Error(
                `Không thể đọc file: ${file.name}`
              )
            );

          };


        reader.readAsDataURL(
          file
        );

      }
    );

  };


  const addLocalFiles =
    async (
      rowId: string,
      fileList:
        FileList |
        File[]
    ) => {

      try {

        const files =
          Array.from(
            fileList
          );


        const imageFiles =
          files.filter(
            file =>
              file.type.startsWith(
                'image/'
              )
          );


        if (
          imageFiles.length ===
          0
        ) {

          updateRow(
            rowId,
            'error',
            'Không tìm thấy file hình ảnh hợp lệ.'
          );

          return;

        }


        const newImages =
          await Promise.all(
            imageFiles.map(
              fileToReferenceImage
            )
          );


        setItems(
          prev =>
            prev.map(
              row =>
                row.id === rowId
                  ? {
                      ...row,

                      referenceImages:
                        [
                          ...row.referenceImages,
                          ...newImages
                        ],

                      error:
                        ''
                    }
                  : row
            )
        );

      } catch (
        err: any
      ) {

        updateRow(
          rowId,
          'error',
          `Lỗi tải ảnh Local: ${formatError(err)}`
        );

      }

    };


  const handleSelectLocalMedia = (
    rowId: string
  ) => {

    fileInputRefs.current[
      rowId
    ]?.click();

  };


  // =========================================================
  // URL IMAGE
  // =========================================================

  const urlToReferenceImage =
    async (
      url: string
    ):
      Promise<ReferenceImage> => {

      const response =
        await fetch(
          url
        );


      if (
        !response.ok
      ) {

        throw new Error(
          `Không tải được ảnh URL (${response.status}).`
        );

      }


      const blob =
        await response.blob();


      if (
        !blob.type.startsWith(
          'image/'
        )
      ) {

        throw new Error(
          'URL không trả về file hình ảnh.'
        );

      }


      const file =
        new File(
          [
            blob
          ],

          `url-image-${Date.now()}`,

          {
            type:
              blob.type
          }
        );


      const ref =
        await fileToReferenceImage(
          file
        );


      return {
        ...ref,
        mediaId:
          url
      };

    };


  const addImageUrl =
    async (
      rowId: string
    ) => {

      const url =
        (
          urlInputs[
            rowId
          ] ||
          ''
        ).trim();


      if (!url) {
        return;
      }


      try {

        updateRow(
          rowId,
          'error',
          ''
        );


        const ref =
          await urlToReferenceImage(
            url
          );


        setItems(
          prev =>
            prev.map(
              row =>
                row.id === rowId
                  ? {
                      ...row,

                      referenceImages:
                        [
                          ...row.referenceImages,
                          ref
                        ],

                      error:
                        ''
                    }
                  : row
            )
        );


        setUrlInputs(
          prev => ({
            ...prev,
            [rowId]:
              ''
          })
        );

      } catch (
        err: any
      ) {

        updateRow(
          rowId,
          'error',
          `Không thêm được URL ảnh: ${formatError(err)}`
        );

      }

    };


  // =========================================================
  // DRAG DROP
  // =========================================================

  const handleDrop =
    async (
      event:
        React.DragEvent<HTMLDivElement>,

      rowId:
        string
    ) => {

      event.preventDefault();
      event.stopPropagation();


      if (
        event.dataTransfer
          .files?.length >
        0
      ) {

        await addLocalFiles(
          rowId,
          event.dataTransfer.files
        );

        return;

      }


      const uri =
        event.dataTransfer.getData(
          'text/uri-list'
        ) ||

        event.dataTransfer.getData(
          'text/plain'
        );


      if (
        uri &&
        /^https?:\/\//i.test(
          uri.trim()
        )
      ) {

        try {

          const ref =
            await urlToReferenceImage(
              uri.trim()
            );


          setItems(
            prev =>
              prev.map(
                row =>
                  row.id === rowId
                    ? {
                        ...row,

                        referenceImages:
                          [
                            ...row.referenceImages,
                            ref
                          ],

                        error:
                          ''
                      }
                    : row
              )
          );

        } catch (
          err: any
        ) {

          updateRow(
            rowId,
            'error',
            `Không tải được ảnh kéo thả từ URL: ${formatError(err)}`
          );

        }

      }

    };


  const removeReferenceImage = (
    rowId: string,
    imageId: string
  ) => {

    const row =
      items.find(
        item =>
          item.id === rowId
      );


    if (!row) {
      return;
    }


    updateRow(
      rowId,
      'referenceImages',

      row.referenceImages.filter(
        image =>
          image.id !==
          imageId
      )
    );

  };


  // =========================================================
  // TEXT -> BASE64
  // =========================================================

  const stringToBase64 = (
    text: string
  ) => {

    const bytes =
      new TextEncoder()
        .encode(
          text
        );


    let binary =
      '';


    bytes.forEach(
      byte => {

        binary +=
          String.fromCharCode(
            byte
          );

      }
    );


    return btoa(
      binary
    );

  };


  // =========================================================
  // AUTO SAVE CAPTION
  // =========================================================

  const autoSaveCaption =
    async (
      row: WorkflowRow,
      captionText: string
    ) => {

      if (
        !row.savePath.trim()
      ) {

        throw new Error(
          'Caption đã tạo nhưng chưa thể tự lưu TXT vì THƯ MỤC LƯU đang trống.'
        );

      }


      const base64 =
        stringToBase64(
          captionText
        );


      const filename =
        `${row.stt}.txt`;


      await service.files.saveFile(
        base64,
        'text/plain;charset=utf-8',
        filename,
        row.savePath
      );


      return makeDisplayPath(
        row.savePath,
        filename
      );

    };


  // =========================================================
  // IMAGE GENERATION
  // =========================================================

  const generateImage =
    async (
      id: string
    ) => {

      const row =
        items.find(
          item =>
            item.id === id
        );


      if (!row) {
        return;
      }


      const activityType:
        ActivityType =
        row.imageVersions.length >
        0
          ? 'REGENERATE_IMAGE'
          : 'CREATE_IMAGE';


      if (
        !config.defaultImageAI
      ) {

        const error =
          'CHƯA CẤU HÌNH AI ẢNH MẶC ĐỊNH.';


        patchRow(
          id,
          {
            status:
              'FAILED',

            error
          }
        );


        await writeActivity(
          row,
          activityType,
          'FAILED',
          'Không thể tạo ảnh.',
          {
            error
          }
        );

        return;

      }


      if (
        !row.imagePrompt.trim()
      ) {

        const error =
          'Chưa nhập LỆNH TẠO ẢNH.';


        patchRow(
          id,
          {
            status:
              'FAILED',

            error
          }
        );


        await writeActivity(
          row,
          activityType,
          'FAILED',
          'Không thể tạo ảnh.',
          {
            error
          }
        );

        return;

      }


      patchRow(
        id,
        {
          status:
            'RUNNING',

          error:
            ''
        }
      );


      await writeActivity(
        row,
        activityType,
        'RUNNING',
        activityType ===
          'REGENERATE_IMAGE'
          ? 'Đang tạo lại ảnh.'
          : 'Đang tạo ảnh.'
      );


      try {

        const prompt =
          row.characterName.trim()

            ? `${row.characterName.trim()}\n\n${row.imagePrompt.trim()}`

            : row.imagePrompt.trim();


        const { id: jobId } = await service.jobs.enqueue(
          id,
          'IMAGE_GEN',
          {
            prompt,
            referenceIds: row.referenceImages.map(img => img.mediaId),
            model: config.defaultImageAI,
            aspectRatio: '9:16'
          }
        );

        let done = false;
        while (!done) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const job = await service.jobs.getJob(jobId);
          if (job.status === 'DONE') {
            done = true;
            const updatedRow = await service.storage.loadRow(id);
            setItems(prev => prev.map(item => item.id === id ? {
              ...item,
              imageVersions: updatedRow.imageVersions,
              currentImageIndex: updatedRow.currentImageIndex,
              status: 'COMPLETED',
              error: ''
            } : item));
          } else if (job.status === 'FAILED' || job.status === 'CANCELLED') {
            throw new Error(job.error || 'Job failed');
          }
        }


        await writeActivity(
          row,
          activityType,
          'SUCCESS',

          activityType ===
            'REGENERATE_IMAGE'
            ? `Tạo lại ảnh thành công. Version ${row.imageVersions.length + 1}.`
            : 'Tạo ảnh thành công.'
        );

      } catch (
        e: any
      ) {

        const error =
          formatError(
            e
          );


        patchRow(
          id,
          {
            status:
              'FAILED',

            error
          }
        );


        await writeActivity(
          row,
          activityType,
          'FAILED',

          activityType ===
            'REGENERATE_IMAGE'
            ? 'Tạo lại ảnh thất bại.'
            : 'Tạo ảnh thất bại.',

          {
            error
          }
        );

      }

    };


  // =========================================================
  // CAPTION PROMPT
  // =========================================================

  const buildCaptionPrompt = (
    row: WorkflowRow
  ) => {

    const forcedSubject =
      row.captionInstruction
        .trim() ||

      row.characterName
        .trim();


    return `
NHIỆM VỤ:
Viết DUY NHẤT 1 caption hoàn chỉnh theo dữ liệu người dùng cung cấp.

==================================================
CHỦ THỂ / NHÂN VẬT CHÍNH CỦA DÒNG HIỆN TẠI
==================================================

TÊN NHÂN VẬT:
${row.characterName.trim() || '(không có)'}

CHỦ THỂ BẮT BUỘC PHẢI TẬP TRUNG:
${forcedSubject || '(không có)'}

==================================================
MẪU CAPTION THAM KHẢO
==================================================

${row.captionSample.trim() || '(không có)'}

==================================================
YÊU CẦU ÉP VIẾT CAPTION
==================================================

${row.captionInstruction.trim() || '(không có)'}

==================================================
QUY TẮC / FORM CAPTION DO NGƯỜI DÙNG NHẬP
==================================================

${row.captionPreset.trim() || '(không có)'}

==================================================
QUY TẮC BẮT BUỘC PHẢI TUÂN THỦ
==================================================

1. Đọc toàn bộ QUY TẮC / FORM CAPTION trước khi viết.

2. Tự động xác định ngôn ngữ người dùng yêu cầu.

Ví dụ:
- "viết bằng tiếng Tây Ban Nha" => toàn bộ caption bằng tiếng Tây Ban Nha.
- "viết bằng tiếng Anh" => toàn bộ caption bằng tiếng Anh.
- "viết bằng tiếng Bulgaria" => toàn bộ caption bằng tiếng Bulgaria.
- tương tự với mọi ngôn ngữ khác.

3. Khi đã xác định được ngôn ngữ:
TOÀN BỘ caption phải sử dụng đúng ngôn ngữ đó.

Bao gồm:
- tiêu đề
- hook
- Read more
- nội dung
- CTA
- phần mô tả

Không được trộn tiếng Việt hoặc ngôn ngữ khác nếu người dùng không yêu cầu.

4. Hashtag có thể giữ tên riêng, thương hiệu và tên nhân vật theo cách tự nhiên.

5. CHỦ THỂ BẮT BUỘC PHẢI TẬP TRUNG là đối tượng chính.

Caption phải:
- nói chủ yếu về chủ thể này
- phát triển nội dung xoay quanh chủ thể này
- không để nhân vật khác chiếm trọng tâm

6. Nếu mẫu tham khảo có nhân vật khác:
không được giữ nguyên nhân vật cũ một cách máy móc.

Phải chuyển trọng tâm sang:
${forcedSubject || row.characterName || 'chủ thể của dòng hiện tại'}

7. Mẫu chỉ dùng để học:
- cấu trúc
- phong cách
- hook
- độ dài
- cách dùng hashtag

8. Nếu người dùng quy định:
- tiêu đề
- Read more
- hashtag nhân vật
- hashtag nội dung

thì phải giữ đúng cấu trúc đó.

9. Không tạo nhiều phiên bản.

10. Không giải thích.

11. Không chào hỏi.

12. Không viết:
"Đây là caption"
"Caption:"
"Kết quả:"

13. Chỉ trả về caption hoàn chỉnh.

14. Không dùng Markdown code block.

BẮT ĐẦU VIẾT CAPTION.
`.trim();

  };


  // =========================================================
  // GENERATE CAPTION
  // =========================================================

  const generateCaption =
    async (
      id: string
    ) => {

      const row =
        items.find(
          item =>
            item.id === id
        );


      if (!row) {
        return;
      }


      if (
        !config.defaultTextAI
      ) {

        const error =
          'CHƯA CẤU HÌNH AI TEXT MẶC ĐỊNH.';


        patchRow(
          id,
          {
            status:
              'FAILED',

            error
          }
        );


        await writeActivity(
          row,
          'CREATE_CAPTION',
          'FAILED',
          'Không thể tạo caption.',
          {
            error
          }
        );

        return;

      }


      if (
        !row.captionInstruction.trim() &&
        !row.characterName.trim()
      ) {

        const error =
          'Chưa có TÊN NHÂN VẬT hoặc nội dung trong cột ÉP VIẾT CAPTIONS.';


        patchRow(
          id,
          {
            status:
              'FAILED',

            error
          }
        );


        await writeActivity(
          row,
          'CREATE_CAPTION',
          'FAILED',
          'Không thể tạo caption.',
          {
            error
          }
        );

        return;

      }


      if (
        !row.savePath.trim()
      ) {

        const error =
          'Chưa nhập THƯ MỤC LƯU. Caption thành công sẽ tự động lưu TXT nên cần thư mục trước khi chạy.';


        patchRow(
          id,
          {
            status:
              'FAILED',

            error
          }
        );


        await writeActivity(
          row,
          'CREATE_CAPTION',
          'FAILED',
          'Không thể tạo caption.',
          {
            error
          }
        );

        return;

      }


      patchRow(
        id,
        {
          status:
            'RUNNING',

          error:
            ''
        }
      );


      await writeActivity(
        row,
        'CREATE_CAPTION',
        'RUNNING',
        'Đang tạo caption.'
      );


      try {

        const prompt =
          buildCaptionPrompt(
            row
          );


        const { id: jobId } = await service.jobs.enqueue(
          id,
          'CAPTION_GEN',
          { prompt }
        );

        let done = false;
        let text = '';
        while (!done) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const job = await service.jobs.getJob(jobId);
          if (job.status === 'DONE') {
            done = true;
            const updatedRow = await service.storage.loadRow(id);
            text = updatedRow.captionResult || '';
          } else if (job.status === 'FAILED' || job.status === 'CANCELLED') {
            throw new Error(job.error || 'Job failed');
          }
        }


        if (!text) {

          throw new Error(
            'AI không trả về nội dung caption.'
          );

        }


        /*
          TẠO CAPTION ĐÃ THÀNH CÔNG
        */
        await writeActivity(
          row,
          'CREATE_CAPTION',
          'SUCCESS',
          'Tạo caption thành công.'
        );


        /*
          AUTO SAVE TXT
        */
        try {

          const filePath =
            await autoSaveCaption(
              row,
              text
            );


          await writeActivity(
            row,
            'SAVE_CAPTION',
            'SUCCESS',
            `Đã tự động lưu caption: ${row.stt}.txt`,
            {
              filePath
            }
          );


          patchRow(
            id,
            {
              captionResult:
                text,

              status:
                'COMPLETED',

              error:
                ''
            }
          );

        } catch (
          saveError: any
        ) {

          const error =
            formatError(
              saveError
            );


          /*
            Caption vẫn hiện ra vì AI đã tạo thành công.
            Chỉ phần lưu TXT bị lỗi.
          */
          patchRow(
            id,
            {
              captionResult:
                text,

              status:
                'FAILED',

              error:
                `Caption đã tạo nhưng lưu TXT thất bại: ${error}`
            }
          );


          await writeActivity(
            row,
            'SAVE_CAPTION',
            'FAILED',
            'Caption đã tạo nhưng tự động lưu TXT thất bại.',
            {
              error
            }
          );

        }

      } catch (
        e: any
      ) {

        const error =
          formatError(
            e
          );


        patchRow(
          id,
          {
            status:
              'FAILED',

            error
          }
        );


        await writeActivity(
          row,
          'CREATE_CAPTION',
          'FAILED',
          'Tạo caption thất bại.',
          {
            error
          }
        );

      }

    };


  // =========================================================
  // SAVE IMAGE
  // =========================================================

  const saveImage =
    async (
      row: WorkflowRow
    ) => {

      try {

        if (
          !row.savePath.trim()
        ) {

          const error =
            'Chưa nhập THƯ MỤC LƯU.';


          updateRow(
            row.id,
            'error',
            error
          );


          await writeActivity(
            row,
            'SAVE_IMAGE',
            'FAILED',
            'Không thể lưu ảnh.',
            {
              error
            }
          );

          return;

        }


        const img =
          row.imageVersions[
            row.currentImageIndex
          ];


        if (!img) {

          const error =
            'Chưa có ảnh để lưu.';


          updateRow(
            row.id,
            'error',
            error
          );


          await writeActivity(
            row,
            'SAVE_IMAGE',
            'FAILED',
            'Không thể lưu ảnh.',
            {
              error
            }
          );

          return;

        }


        const ext =
          (
            img.mimeType
              .split('/')[1] ||
            'png'
          )
            .split(';')[0];


        const filename =
          `${row.stt}.${ext}`;


        await service.files.saveFile(

          img.base64,

          img.mimeType,

          filename,

          row.savePath

        );


        updateRow(
          row.id,
          'error',
          ''
        );


        await writeActivity(
          row,
          'SAVE_IMAGE',
          'SUCCESS',
          `Đã lưu ảnh: ${filename}`,
          {
            filePath:
              makeDisplayPath(
                row.savePath,
                filename
              )
          }
        );

      } catch (
        e: any
      ) {

        const error =
          formatError(
            e
          );


        updateRow(
          row.id,
          'error',
          `Lỗi lưu ảnh: ${error}`
        );


        await writeActivity(
          row,
          'SAVE_IMAGE',
          'FAILED',
          'Lưu ảnh thất bại.',
          {
            error
          }
        );

      }

    };


  // =========================================================
  // RUN ALL
  // =========================================================

  const runAll =
    async () => {

      for (
        const row of items
      ) {

        if (
          row.isDone
        ) {
          continue;
        }


        try {

          if (
            row.imagePrompt.trim() &&
            row.imageVersions.length ===
              0
          ) {

            await generateImage(
              row.id
            );

          }


          if (
            (
              row.captionSample.trim() ||

              row.captionInstruction.trim() ||

              row.captionPreset.trim() ||

              row.characterName.trim()
            ) &&

            !row.captionResult
          ) {

            await generateCaption(
              row.id
            );

          }

        } catch (
          err: any
        ) {

          const error =
            formatError(
              err
            );


          patchRow(
            row.id,
            {
              status:
                'FAILED',

              error
            }
          );


          await writeActivity(
            row,
            'OTHER',
            'FAILED',
            'CHẠY TẤT CẢ gặp lỗi ngoài dự kiến.',
            {
              error
            }
          );

        }

      }

    };


  // =========================================================
  // SELECT
  // =========================================================

  const toggleSelected = (
    id: string
  ) => {

    const next =
      new Set(
        selectedIds
      );


    if (
      next.has(id)
    ) {

      next.delete(
        id
      );

    } else {

      next.add(
        id
      );

    }


    setSelectedIds(
      next
    );

  };

  const removeSelectedRows = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm('Bạn có chắc chắn muốn xoá các dòng đã chọn?')) return;

    const remaining = items.filter(row => !selectedIds.has(row.id));
    setItems(remaining);
    setSelectedIds(new Set());
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await service.storage.importCSV(file);
      const rows = await service.storage.loadRows(isNews ? 'news' : 'production');
      setItems(rows as WorkflowRow[]);
    } catch (err: any) {
      alert(`Lỗi nhập CSV: ${err.message}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };


  // =========================================================
  // UI
  // =========================================================

  return (
    <PageLayout
      title={title}
      description={`${items.length} hàng dữ liệu`}
      actions={
        <>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleImportCSV}
            style={{ display: 'none' }}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} icon="upload_file">
            Nhập CSV
          </Button>
          <Button variant="secondary" onClick={addRow} icon="add">
            THÊM HÀNG
          </Button>
          <Button variant="danger" onClick={removeSelectedRows} icon="delete">
            XOÁ ĐÃ CHỌN
          </Button>
          <Button variant="primary" onClick={runAll} icon="play_arrow">
            CHẠY TẤT CẢ
          </Button>
        </>
      }
    >
      <div className="flex-1 min-h-0">
        <div className="h-full flex flex-col min-h-0">
          <div className="h-full overflow-auto dark-scrollbar p-0">

            <table
              className="table-fixed"
            >

              <thead>

                <tr>

                  <th className="sheet-header w-14 text-center">
                    CHỌN
                  </th>

                  <th className="sheet-header w-16 text-center">
                    STT
                  </th>

                  <th className="sheet-header w-44">
                    TÊN NHÂN VẬT
                  </th>

                  <th className="sheet-header w-72">
                    HÌNH THAM KHẢO
                  </th>

                  <th className="sheet-header w-72">
                    LỆNH TẠO ẢNH
                  </th>

                  <th className="sheet-header w-64">
                    ẢNH TẠO XONG
                  </th>

                  <th className="sheet-header w-64">
                    MẪU THAM KHẢO CAPTIONS
                  </th>

                  <th className="sheet-header w-72">
                    ÉP VIẾT CAPTIONS CỦA TÊN NHÂN VẬT
                  </th>

                  <th className="sheet-header w-72">
                    MẶC ĐỊNH CAPTIONS SẼ NHƯ THẾ NÀY
                  </th>

                  <th className="sheet-header w-72">
                    CAPTIONS THÀNH CÔNG
                  </th>

                  <th className="sheet-header w-56">
                    THƯ MỤC LƯU
                  </th>

                  <th className="sheet-header w-24 text-center">
                    ĐÃ XONG
                  </th>

                  <th className="sheet-header w-56">
                    ĐANG LỖI
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  items.map(
                    row => {

                      const currentImage =
                        row.currentImageIndex >=
                        0

                          ? row.imageVersions[
                              row.currentImageIndex
                            ]

                          : null;


                      return (

                        <tr
                          key={
                            row.id
                          }
                        >

                          {/* SELECT */}

                          <td className="sheet-cell text-center pt-5">

                            <input
                              type="checkbox"

                              checked={
                                selectedIds.has(
                                  row.id
                                )
                              }

                              onChange={
                                () =>
                                  toggleSelected(
                                    row.id
                                  )
                              }

                              className="accent-blue-600"
                            />

                          </td>


                          {/* STT */}

                          <td className="sheet-cell text-center pt-5">

                            <span
                              className="
                                inline-flex
                                items-center
                                justify-center
                                min-w-9
                                h-7
                                px-2
                                border
                                rounded-lg
                                text-[11px]
                                font-bold
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
                              {row.stt}
                            </span>

                          </td>


                          {/* CHARACTER */}

                          <td className="sheet-cell">

                            <textarea
                              value={
                                row.characterName
                              }

                              onChange={
                                e =>
                                  updateRow(
                                    row.id,
                                    'characterName',
                                    e.currentTarget.value
                                  )
                              }

                              placeholder="Nhập tên nhân vật..."
                            />

                          </td>


                          {/* REFERENCE IMAGES */}

                          <td className="sheet-cell">

                            <div
                              className="
                                reference-drop-zone
                                h-full
                                flex
                                flex-col
                                gap-2
                              "

                              onDragOver={
                                e => {
                                  e.preventDefault();

                                  e.dataTransfer.dropEffect =
                                    'copy';
                                }
                              }

                              onDrop={
                                e =>
                                  handleDrop(
                                    e,
                                    row.id
                                  )
                              }
                            >

                              <div
                                className="
                                  flex
                                  flex-wrap
                                  gap-2
                                  min-h-[52px]
                                "
                              >

                                {
                                  row.referenceImages.map(
                                    image => (

                                      <div
                                        key={
                                          image.id
                                        }

                                        className="
                                          reference-thumb
                                          group
                                        "
                                      >

                                        <img
                                          src={`data:${image.mimeType};base64,${image.base64}`}
                                          alt=""
                                        />


                                        <button
                                          type="button"

                                          onClick={
                                            () =>
                                              removeReferenceImage(
                                                row.id,
                                                image.id
                                              )
                                          }

                                          className="
                                            absolute
                                            top-1
                                            right-1
                                            w-5
                                            h-5
                                            rounded-full
                                            bg-red-600
                                            text-white
                                            items-center
                                            justify-center
                                            hidden
                                            group-hover:flex
                                            shadow
                                          "

                                          title="Xóa ảnh"
                                        >
                                          ×
                                        </button>

                                      </div>

                                    )
                                  )
                                }


                                <button
                                  type="button"

                                  onClick={
                                    () =>
                                      handleSelectLocalMedia(
                                        row.id
                                      )
                                  }

                                  className="add-image-button"

                                  title="Chọn ảnh từ máy"
                                >

                                  <span
                                    className="
                                      material-symbols-outlined
                                      text-[22px]
                                    "
                                  >
                                    add_photo_alternate
                                  </span>

                                </button>


                                <input
                                  ref={
                                    el => {

                                      fileInputRefs.current[
                                        row.id
                                      ] = el;

                                    }
                                  }

                                  type="file"

                                  accept="image/*"

                                  multiple

                                  hidden

                                  onChange={
                                    e => {

                                      if (
                                        e.currentTarget.files &&
                                        e.currentTarget.files.length >
                                          0
                                      ) {

                                        addLocalFiles(
                                          row.id,
                                          e.currentTarget.files
                                        );

                                      }


                                      e.currentTarget.value =
                                        '';

                                    }
                                  }
                                />

                              </div>


                              <div className="flex gap-2">

                                <input
                                  type="text"

                                  value={
                                    urlInputs[
                                      row.id
                                    ] || ''
                                  }

                                  onChange={
                                    e =>
                                      setUrlInputs(
                                        prev => ({
                                          ...prev,

                                          [row.id]:
                                            e.currentTarget.value
                                        })
                                      )
                                  }

                                  onKeyDown={
                                    e => {

                                      if (
                                        e.key ===
                                        'Enter'
                                      ) {

                                        e.preventDefault();

                                        addImageUrl(
                                          row.id
                                        );

                                      }

                                    }
                                  }

                                  placeholder="Dán URL ảnh..."

                                  className="
                                    reference-url-input
                                    flex-1
                                    min-w-0
                                  "
                                />


                                <button
                                  type="button"

                                  onClick={
                                    () =>
                                      addImageUrl(
                                        row.id
                                      )
                                  }

                                  className="
                                    btn-action
                                    btn-muted
                                    !min-h-[34px]
                                    px-3
                                  "
                                >
                                  THÊM
                                </button>

                              </div>


                              <div
                                className="
                                  reference-helper
                                  flex
                                  items-center
                                  gap-1
                                "
                              >

                                <span
                                  className="
                                    material-symbols-outlined
                                    text-[13px]
                                  "
                                >
                                  upload
                                </span>

                                Bấm +, kéo ảnh từ máy hoặc dán URL ảnh.

                              </div>

                            </div>

                          </td>


                          {/* IMAGE PROMPT */}

                          <td className="sheet-cell">

                            <textarea
                              value={
                                row.imagePrompt
                              }

                              onChange={
                                e =>
                                  updateRow(
                                    row.id,
                                    'imagePrompt',
                                    e.currentTarget.value
                                  )
                              }

                              placeholder="Nhập lệnh tạo ảnh..."
                            />

                          </td>


                          {/* IMAGE RESULT */}

                          <td className="sheet-cell">

                            <div className="flex gap-2 h-full">

                              <div className="flex-1 min-w-0">

                                {
                                  currentImage
                                    ? (

                                      <div
                                        className="
                                          relative
                                          h-full
                                          min-h-[92px]
                                          border
                                          rounded-lg
                                          overflow-hidden
                                          group
                                        "

                                        style={{
                                          background:
                                            'var(--bg-soft)',

                                          borderColor:
                                            'var(--border)'
                                        }}
                                      >

                                        <img
                                          src={`data:${currentImage.mimeType};base64,${currentImage.base64}`}

                                          className="
                                            w-full
                                            h-full
                                            object-cover
                                          "

                                          alt=""
                                        />


                                        <div
                                          className="
                                            absolute
                                            top-2
                                            left-2
                                            bg-slate-900/80
                                            text-white
                                            px-2
                                            py-1
                                            text-[9px]
                                            font-bold
                                            rounded
                                          "
                                        >
                                          V{row.currentImageIndex + 1}
                                        </div>


                                        <div
                                          className="
                                            absolute
                                            top-2
                                            right-2
                                            flex
                                            gap-1
                                          "
                                        >

                                          <button
                                            type="button"

                                            onClick={
                                              () =>
                                                generateImage(
                                                  row.id
                                                )
                                            }

                                            className="icon-button"

                                            title="Tạo lại ảnh"
                                          >

                                            <span
                                              className="
                                                material-symbols-outlined
                                                text-[16px]
                                              "
                                            >
                                              refresh
                                            </span>

                                          </button>


                                          <button
                                            type="button"

                                            onClick={
                                              () =>
                                                saveImage(
                                                  row
                                                )
                                            }

                                            className="icon-button"

                                            title="Lưu ảnh"
                                          >

                                            <span
                                              className="
                                                material-symbols-outlined
                                                text-[16px]
                                              "
                                            >
                                              download
                                            </span>

                                          </button>

                                        </div>

                                      </div>

                                    )
                                    : (

                                      <button
                                        type="button"

                                        onClick={
                                          () =>
                                            generateImage(
                                              row.id
                                            )
                                        }

                                        className="generate-placeholder"
                                      >

                                        <span
                                          className="
                                            material-symbols-outlined
                                            text-[22px]
                                            block
                                            mx-auto
                                            mb-1
                                          "
                                        >
                                          image
                                        </span>

                                        TẠO ẢNH

                                      </button>

                                    )
                                }

                              </div>


                              {
                                row.imageVersions.length >
                                  0 && (

                                  <div
                                    className="
                                      w-12
                                      flex
                                      flex-col
                                      gap-1
                                      overflow-y-auto
                                    "
                                  >

                                    {
                                      row.imageVersions.map(
                                        (
                                          _,
                                          index
                                        ) => (

                                          <button
                                            type="button"

                                            key={
                                              index
                                            }

                                            onClick={
                                              () =>
                                                updateRow(
                                                  row.id,
                                                  'currentImageIndex',
                                                  index
                                                )
                                            }

                                            className={`
                                              min-h-7
                                              border
                                              rounded-md
                                              text-[9px]
                                              font-bold

                                              ${
                                                row.currentImageIndex ===
                                                index
                                                  ? 'bg-blue-600 border-blue-600 text-white'
                                                  : 'border-slate-300'
                                              }
                                            `}

                                            style={
                                              row.currentImageIndex ===
                                              index

                                                ? undefined

                                                : {
                                                    background:
                                                      'var(--bg-card)',

                                                    color:
                                                      'var(--text-secondary)'
                                                  }
                                            }
                                          >
                                            V{index + 1}
                                          </button>

                                        )
                                      )
                                    }

                                  </div>

                                )
                              }

                            </div>

                          </td>


                          {/* CAPTION SAMPLE */}

                          <td className="sheet-cell">

                            <textarea
                              value={
                                row.captionSample
                              }

                              onChange={
                                e =>
                                  updateRow(
                                    row.id,
                                    'captionSample',
                                    e.currentTarget.value
                                  )
                              }

                              placeholder="Dán mẫu caption tham khảo..."
                            />

                          </td>


                          {/* CAPTION SUBJECT */}

                          <td className="sheet-cell">

                            <textarea
                              value={
                                row.captionInstruction
                              }

                              onChange={
                                e =>
                                  updateRow(
                                    row.id,
                                    'captionInstruction',
                                    e.currentTarget.value
                                  )
                              }

                              placeholder="Nhập nhân vật / chủ thể mà caption bắt buộc phải tập trung..."
                            />

                          </td>


                          {/* CAPTION PRESET */}

                          <td className="sheet-cell">

                            <textarea
                              value={
                                row.captionPreset
                              }

                              onChange={
                                e =>
                                  updateRow(
                                    row.id,
                                    'captionPreset',
                                    e.currentTarget.value
                                  )
                              }

                              placeholder={`Ví dụ:
- nội dung viết bằng tiếng Tây Ban Nha
- tiêu đề giật gân
- Read more ngắn 2 dòng
- hashtag nhân vật
- hashtag nội dung`}
                            />

                          </td>


                          {/* CAPTION RESULT */}

                          <td className="sheet-cell">

                            <div
                              className="
                                h-full
                                flex
                                flex-col
                                gap-2
                              "
                            >

                              {
                                row.captionResult
                                  ? (

                                    <>

                                      <textarea
                                        value={
                                          row.captionResult
                                        }

                                        onChange={
                                          e =>
                                            updateRow(
                                              row.id,
                                              'captionResult',
                                              e.currentTarget.value
                                            )
                                        }

                                        placeholder="Caption thành công..."
                                      />


                                      <div
                                        className="
                                          flex
                                          items-center
                                          gap-1
                                          text-[10px]
                                          font-semibold
                                        "

                                        style={{
                                          color:
                                            '#16a34a'
                                        }}
                                      >

                                        <span
                                          className="
                                            material-symbols-outlined
                                            text-[15px]
                                          "
                                        >
                                          save
                                        </span>

                                        TXT TỰ ĐỘNG LƯU: {row.stt}.txt

                                      </div>

                                    </>

                                  )
                                  : (

                                    <button
                                      type="button"

                                      onClick={
                                        () =>
                                          generateCaption(
                                            row.id
                                          )
                                      }

                                      className="generate-placeholder"
                                    >

                                      <span
                                        className="
                                          material-symbols-outlined
                                          text-[21px]
                                          block
                                          mx-auto
                                          mb-1
                                        "
                                      >
                                        edit_note
                                      </span>

                                      TẠO CAPTION

                                    </button>

                                  )
                              }

                            </div>

                          </td>


                          {/* SAVE PATH */}

                          <td className="sheet-cell">

                            <textarea
                              value={
                                row.savePath
                              }

                              onChange={
                                e =>
                                  updateRow(
                                    row.id,
                                    'savePath',
                                    e.currentTarget.value
                                  )
                              }

                              placeholder={
                                'E:\\PROJECT\\MEDIA'
                              }
                            />

                          </td>


                          {/* DONE */}

                          <td className="sheet-cell text-center pt-5">

                            <input
                              type="checkbox"

                              checked={
                                row.isDone
                              }

                              onChange={
                                e =>
                                  updateRow(
                                    row.id,
                                    'isDone',
                                    e.currentTarget.checked
                                  )
                              }

                              className="accent-green-600"
                            />

                          </td>


                          {/* ERROR */}

                          <td className="sheet-cell">

                            {
                              row.status === 'RUNNING' && (
                                <StatusBadge status="RUNNING" />
                              )
                            }

                            {
                              row.error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-2 text-[10px] leading-relaxed break-words mt-2">
                                  {row.error}
                                </div>
                              )
                            }

                            {
                              !row.error && row.status === 'COMPLETED' && (
                                <StatusBadge status="DONE" />
                              )
                            }

                          </td>

                        </tr>

                      );

                    }
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