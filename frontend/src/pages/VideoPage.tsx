import React, {
  useState
} from 'react';

import {
  WorkflowRow,
  VideoRow,
  AppConfig,
  ActivityStatus,
  ActivityType
} from '../types';

import {
  useService
} from '../context/ServiceContext';

import { PageLayout } from '../layouts/PageLayout';
import { Button } from '../components/ui/Button';


interface Props {
  /*
    sourceItems CHỈ được truyền productionItems
    từ App.tsx.

    NEWS / LÀM BÁO tuyệt đối không đi vào đây.
  */
  sourceItems: WorkflowRow[];

  videoItems: VideoRow[];

  setVideoItems:
    React.Dispatch<
      React.SetStateAction<
        VideoRow[]
      >
    >;

  config: AppConfig;
}


export const VideoModule:
  React.FC<Props> = ({
    sourceItems,
    videoItems,
    setVideoItems,
    config
  }) => {

  const [
    selectedIds,
    setSelectedIds
  ] = useState<Set<string>>(
    new Set()
  );


  const service =
    useService();


  // =========================================================
  // UPDATE VIDEO ROW
  // =========================================================

  const updateVideoRow = (
    id: string,
    field: keyof VideoRow,
    value: any
  ) => {

    setVideoItems(
      prev => {
        const next = prev.map(
          row =>
            row.id === id
              ? {
                  ...row,
                  [field]:
                    value
                }
              : row
        );
        const updatedRow = next.find(r => r.id === id);
        if (updatedRow) {
          service.storage.saveRow(updatedRow, 'video').catch(console.error);
        }
        return next;
      }
    );

  };


  const patchVideoRow = (
    id: string,
    patch: Partial<VideoRow>
  ) => {

    setVideoItems(
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
          service.storage.saveRow(updatedRow, 'video').catch(console.error);
        }
        return next;
      }
    );

  };


  // =========================================================
  // ERROR FORMAT
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
        'Video bị chặn. ' +
        'Hãy thử đổi Prompt.'
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
      msg
        .toLowerCase()
        .includes(
          'cancelled'
        ) ||
      msg
        .toLowerCase()
        .includes(
          'canceled'
        )
    ) {

      return '';

    }


    return msg;

  };


  // =========================================================
  // GET PRODUCTION SOURCE ROW
  // =========================================================

  const getSourceRow = (
    id: string
  ) => {

    return (
      sourceItems.find(
        row =>
          row.id === id
      ) || null
    );

  };


  // =========================================================
  // GET CURRENT PRODUCTION IMAGE
  // =========================================================

  const getSourceImage = (
    id: string
  ) => {

    const productionRow =
      getSourceRow(
        id
      );


    if (
      !productionRow ||
      productionRow.imageVersions.length ===
        0 ||
      productionRow.currentImageIndex <
        0
    ) {

      return null;

    }


    return (
      productionRow.imageVersions[
        productionRow.currentImageIndex
      ] || null
    );

  };


  // =========================================================
  // ACTIVITY LOG
  // =========================================================

  const writeActivity =
    async (
      row: VideoRow,
      type: ActivityType,
      status: ActivityStatus,
      message: string,
      options?: {
        filePath?: string;
        error?: string;
      }
    ) => {

      try {

        const sourceRow =
          getSourceRow(
            row.id
          );


        const now =
          Date.now();


        await service.activity.create({
          id:
            crypto.randomUUID(),

          module:
            'VIDEO',

          type,

          status,

          rowId:
            row.id,

          stt:
            sourceRow?.stt ||
            row.stt,

          subject:
            sourceRow
              ? (
                  sourceRow
                    .captionInstruction
                    .trim() ||

                  sourceRow
                    .characterName
                    .trim() ||

                  ''
                )
              : '',

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

        /*
          Ghi log lỗi không được làm hỏng
          quy trình video chính.
        */
        console.error(
          'Không ghi được Activity Log VIDEO:',
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
  // GENERATE VIDEO
  // =========================================================

  const generateVideo =
    async (
      id: string
    ) => {

      const row =
        videoItems.find(
          videoRow =>
            videoRow.id === id
        );


      const sourceRow =
        getSourceRow(
          id
        );


      const sourceImg =
        getSourceImage(
          id
        );


      if (!row) {
        return;
      }


      if (!sourceRow) {

        const error =
          'Không tìm thấy dòng nguồn trong SẢN XUẤT.';


        patchVideoRow(
          id,
          {
            status:
              'FAILED',

            saveConfirmed:
              false,

            error
          }
        );


        await writeActivity(
          row,
          'CREATE_VIDEO',
          'FAILED',
          'Không thể tạo video.',
          {
            error
          }
        );

        return;

      }


      if (!sourceImg) {

        const error =
          'Chưa có ảnh nguồn từ SẢN XUẤT > ẢNH & CAPTION.';


        patchVideoRow(
          id,
          {
            status:
              'FAILED',

            saveConfirmed:
              false,

            error
          }
        );


        await writeActivity(
          row,
          'CREATE_VIDEO',
          'FAILED',
          'Không thể tạo video.',
          {
            error
          }
        );

        return;

      }


      if (
        !config.defaultVideoAI
      ) {

        const error =
          'CHƯA CẤU HÌNH AI VIDEO MẶC ĐỊNH.';


        patchVideoRow(
          id,
          {
            status:
              'FAILED',

            saveConfirmed:
              false,

            error
          }
        );


        await writeActivity(
          row,
          'CREATE_VIDEO',
          'FAILED',
          'Không thể tạo video.',
          {
            error
          }
        );

        return;

      }


      if (
        !row.videoPrompt.trim()
      ) {

        const error =
          'Chưa nhập FORM VIDEO.';


        patchVideoRow(
          id,
          {
            status:
              'FAILED',

            saveConfirmed:
              false,

            error
          }
        );


        await writeActivity(
          row,
          'CREATE_VIDEO',
          'FAILED',
          'Không thể tạo video.',
          {
            error
          }
        );

        return;

      }


      /*
        Mỗi lần tạo video mới:
        người dùng phải xem và xác nhận lại.
      */
      patchVideoRow(
        id,
        {
          status:
            'RUNNING',

          saveConfirmed:
            false,

          error:
            ''
        }
      );


      await writeActivity(
        row,
        'CREATE_VIDEO',
        'RUNNING',

        row.videoVersions.length >
        0
          ? 'Đang tạo lại video.'
          : 'Đang tạo video.'
      );


      try {

        const { id: jobId } = await service.jobs.enqueue(
          id,
          'VIDEO_GEN',
          {
            prompt: row.videoPrompt.trim(),
            firstFrameId: sourceImg.mediaId,
            model: config.defaultVideoAI,
            aspectRatio: '9:16',
            durationSeconds: 8
          }
        );

        let done = false;
        while (!done) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const job = await service.jobs.getJob(jobId);
          if (job.status === 'DONE') {
            done = true;
            const updatedRow = await service.storage.loadRow(id);
            setVideoItems(prev => prev.map(videoRow => videoRow.id === id ? {
              ...videoRow,
              stt: sourceRow.stt,
              savePath: sourceRow.savePath || videoRow.savePath,
              videoVersions: updatedRow.videoVersions,
              currentVideoIndex: updatedRow.currentVideoIndex,
              status: 'COMPLETED',
              saveConfirmed: false,
              error: ''
            } : videoRow));
          } else if (job.status === 'FAILED' || job.status === 'CANCELLED') {
            throw new Error(job.error || 'Job failed');
          }
        }


        await writeActivity(
          row,
          'CREATE_VIDEO',
          'SUCCESS',

          row.videoVersions.length >
          0
            ? `Tạo lại video thành công. Version ${row.videoVersions.length + 1}.`
            : 'Tạo video thành công.'
        );

      } catch (
        e: any
      ) {

        const error =
          formatError(
            e
          );


        patchVideoRow(
          id,
          {
            status:
              'FAILED',

            saveConfirmed:
              false,

            error
          }
        );


        await writeActivity(
          row,
          'CREATE_VIDEO',
          'FAILED',
          'Tạo video thất bại.',
          {
            error
          }
        );

      }

    };


  // =========================================================
  // SELECT VIDEO VERSION
  // =========================================================

  const selectVideoVersion = (
    rowId: string,
    index: number
  ) => {

    /*
      Chuyển version:
      bắt buộc xác nhận lại.
    */
    patchVideoRow(
      rowId,
      {
        currentVideoIndex:
          index,

        saveConfirmed:
          false,

        error:
          ''
      }
    );

  };


  // =========================================================
  // CONFIRM SAVE
  // =========================================================

  const handleConfirmSave = (
    row: VideoRow,
    checked: boolean
  ) => {

    const sourceImg =
      getSourceImage(
        row.id
      );


    const currentVideo =
      row.currentVideoIndex >=
      0
        ? row.videoVersions[
            row.currentVideoIndex
          ]
        : null;


    if (!currentVideo) {

      patchVideoRow(
        row.id,
        {
          saveConfirmed:
            false,

          error:
            'Chưa có video để xác nhận.'
        }
      );

      return;

    }


    if (!sourceImg) {

      patchVideoRow(
        row.id,
        {
          saveConfirmed:
            false,

          error:
            'Ảnh nguồn SẢN XUẤT không còn tồn tại.'
        }
      );

      return;

    }


    if (
      currentVideo.sourceImageId !==
      sourceImg.id
    ) {

      patchVideoRow(
        row.id,
        {
          saveConfirmed:
            false,

          error:
            'ẢNH NGUỒN ĐÃ THAY ĐỔI. Hãy tạo lại video trước khi xác nhận lưu.'
        }
      );

      return;

    }


    patchVideoRow(
      row.id,
      {
        saveConfirmed:
          checked,

        error:
          ''
      }
    );

  };


  // =========================================================
  // SAVE VIDEO
  // =========================================================

  const saveVideo =
    async (
      row: VideoRow
    ) => {

      try {

        const productionRow =
          getSourceRow(
            row.id
          );


        const sourceImg =
          getSourceImage(
            row.id
          );


        const video =
          row.videoVersions[
            row.currentVideoIndex
          ];


        if (!productionRow) {

          const error =
            'Không còn dòng nguồn trong SẢN XUẤT.';


          updateVideoRow(
            row.id,
            'error',
            error
          );


          await writeActivity(
            row,
            'SAVE_VIDEO',
            'FAILED',
            'Không thể lưu video.',
            {
              error
            }
          );

          return;

        }


        if (!sourceImg) {

          const error =
            'Không còn ảnh nguồn trong SẢN XUẤT.';


          updateVideoRow(
            row.id,
            'error',
            error
          );


          await writeActivity(
            row,
            'SAVE_VIDEO',
            'FAILED',
            'Không thể lưu video.',
            {
              error
            }
          );

          return;

        }


        if (!video) {

          const error =
            'Chưa có video để lưu.';


          updateVideoRow(
            row.id,
            'error',
            error
          );


          await writeActivity(
            row,
            'SAVE_VIDEO',
            'FAILED',
            'Không thể lưu video.',
            {
              error
            }
          );

          return;

        }


        /*
          Video phải được tạo từ ảnh Production hiện tại.
        */
        if (
          video.sourceImageId !==
          sourceImg.id
        ) {

          const error =
            'ẢNH NGUỒN ĐÃ THAY ĐỔI. Video này không còn khớp với ảnh SẢN XUẤT hiện tại.';


          patchVideoRow(
            row.id,
            {
              saveConfirmed:
                false,

              error
            }
          );


          await writeActivity(
            row,
            'SAVE_VIDEO',
            'FAILED',
            'Không thể lưu video.',
            {
              error
            }
          );

          return;

        }


        /*
          Bắt buộc người dùng xác nhận.
        */
        if (
          !row.saveConfirmed
        ) {

          const error =
            'Bạn chưa XÁC NHẬN LƯU sau khi xem video.';


          updateVideoRow(
            row.id,
            'error',
            error
          );


          await writeActivity(
            row,
            'SAVE_VIDEO',
            'FAILED',
            'Không thể lưu video.',
            {
              error
            }
          );

          return;

        }


        /*
          Ưu tiên thư mục từ Production.
        */
        const finalSavePath =
          productionRow.savePath.trim() ||
          row.savePath.trim();


        if (!finalSavePath) {

          const error =
            'Chưa có THƯ MỤC LƯU.';


          updateVideoRow(
            row.id,
            'error',
            error
          );


          await writeActivity(
            row,
            'SAVE_VIDEO',
            'FAILED',
            'Không thể lưu video.',
            {
              error
            }
          );

          return;

        }


        /*
          STT cuối cùng luôn lấy từ Production.
        */
        const finalStt =
          productionRow.stt.trim();


        if (!finalStt) {

          const error =
            'STT của dòng SẢN XUẤT đang trống.';


          updateVideoRow(
            row.id,
            'error',
            error
          );


          await writeActivity(
            row,
            'SAVE_VIDEO',
            'FAILED',
            'Không thể lưu video.',
            {
              error
            }
          );

          return;

        }


        const filename =
          `${finalStt}.mp4`;


        await service.files.saveFile(

          video.base64,

          video.mimeType,

          filename,

          finalSavePath

        );


        patchVideoRow(
          row.id,
          {
            stt:
              finalStt,

            savePath:
              finalSavePath,

            error:
              ''
          }
        );


        await writeActivity(
          row,
          'SAVE_VIDEO',
          'SUCCESS',
          `Đã lưu video: ${filename}`,
          {
            filePath:
              makeDisplayPath(
                finalSavePath,
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


        updateVideoRow(
          row.id,
          'error',
          `Lỗi lưu video: ${error}`
        );


        await writeActivity(
          row,
          'SAVE_VIDEO',
          'FAILED',
          'Lưu video thất bại.',
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
        const row of videoItems
      ) {

        if (
          row.isDone
        ) {
          continue;
        }


        /*
          CHẠY TẤT CẢ chỉ tạo video.
          Không tự lưu.
        */
        if (
          row.videoVersions.length ===
          0
        ) {

          await generateVideo(
            row.id
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


  // =========================================================
  // UI
  // =========================================================

  return (
    <PageLayout
      title="SẢN XUẤT > VIDEO"
      description="Chỉ nhận ảnh từ SẢN XUẤT. Video phải xem và xác nhận trước khi lưu."
      actions={
        <Button variant="primary" onClick={runAll} icon="movie_edit">
          CHẠY TẤT CẢ
        </Button>
      }
    >
      <div className="flex-1 min-h-0">
        <div className="h-full flex flex-col min-h-0">
          <div className="h-full overflow-auto dark-scrollbar p-0">

            <table
              className="table-fixed"
              style={{ minWidth: '1900px' }}
            >

              <thead>

                <tr>

                  <th className="sheet-header w-12 text-center">
                    CHỌN
                  </th>

                  <th className="sheet-header w-14 text-center">
                    STT
                  </th>

                  <th className="sheet-header w-52">
                    LẤY HÌNH ẢNH
                  </th>

                  <th className="sheet-header w-72">
                    FORM VIDEO
                  </th>

                  <th className="sheet-header w-64">
                    TẠO XONG VIDEO
                  </th>

                  <th className="sheet-header w-28 text-center">
                    THÀNH CÔNG
                  </th>

                  <th className="sheet-header w-52">
                    THẤT BẠI
                  </th>

                  <th className="sheet-header w-28 text-center">
                    XÁC NHẬN LƯU
                  </th>

                  <th className="sheet-header w-52">
                    THƯ MỤC LƯU
                  </th>

                  <th className="sheet-header w-36 text-center">
                    NÚT LƯU
                  </th>

                  <th className="sheet-header w-24 text-center">
                    ĐÃ XONG
                  </th>

                </tr>

              </thead>


              <tbody>

                {
                  videoItems.map(
                    row => {

                      const sourceImg =
                        getSourceImage(
                          row.id
                        );


                      const sourceRow =
                        getSourceRow(
                          row.id
                        );


                      const currentVideo =
                        row.currentVideoIndex >=
                        0

                          ? row.videoVersions[
                              row.currentVideoIndex
                            ]

                          : null;


                      const isOutdated =
                        Boolean(
                          currentVideo &&
                          sourceImg &&
                          currentVideo.sourceImageId !==
                            sourceImg.id
                        );


                      const canConfirm =
                        Boolean(
                          currentVideo &&
                          sourceImg &&
                          !isOutdated &&
                          row.status ===
                            'COMPLETED'
                        );


                      const canSave =
                        Boolean(
                          currentVideo &&
                          sourceImg &&
                          !isOutdated &&
                          row.saveConfirmed
                        );


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
                                min-w-10
                                h-7
                                px-2
                                rounded-lg
                                border
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
                              {
                                sourceRow?.stt ||
                                row.stt
                              }
                            </span>

                          </td>


                          {/* SOURCE IMAGE */}

                          <td className="sheet-cell">

                            {
                              sourceImg
                                ? (

                                <div
                                  className="
                                    flex
                                    items-center
                                    gap-3
                                  "
                                >

                                  <div
                                    className="
                                      relative
                                      w-20
                                      h-24
                                      border
                                      rounded-lg
                                      overflow-hidden
                                      shadow-sm
                                    "

                                    style={{
                                      background:
                                        'var(--bg-soft)',

                                      borderColor:
                                        'var(--border)'
                                    }}
                                  >

                                    <img
                                      src={`data:${sourceImg.mimeType};base64,${sourceImg.base64}`}

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
                                        top-1
                                        left-1
                                        bg-blue-600
                                        text-white
                                        px-1.5
                                        py-0.5
                                        text-[9px]
                                        rounded
                                        font-bold
                                      "
                                    >
                                      V
                                      {
                                        (
                                          sourceRow
                                            ?.currentImageIndex ??
                                          0
                                        ) + 1
                                      }
                                    </div>

                                  </div>


                                  <div
                                    className="
                                      text-[10px]
                                      leading-relaxed
                                    "

                                    style={{
                                      color:
                                        'var(--text-muted)'
                                    }}
                                  >

                                    Ảnh hiện tại từ
                                    <br />

                                    <strong
                                      style={{
                                        color:
                                          'var(--text-secondary)'
                                      }}
                                    >
                                      SẢN XUẤT
                                    </strong>

                                    <br />

                                    STT: {
                                      sourceRow?.stt ||
                                      row.stt
                                    }

                                  </div>

                                </div>

                              )
                                : (

                                <div
                                  className="
                                    generate-placeholder
                                    flex
                                    items-center
                                    justify-center
                                    text-center
                                    px-3
                                  "
                                >
                                  CHƯA CÓ ẢNH NGUỒN
                                </div>

                              )
                            }

                          </td>


                          {/* VIDEO PROMPT */}

                          <td
                            className="
                              sheet-cell
                              relative
                            "
                          >

                            <textarea
                              value={
                                row.videoPrompt
                              }

                              onChange={
                                e =>
                                  updateVideoRow(
                                    row.id,
                                    'videoPrompt',
                                    e.currentTarget.value
                                  )
                              }

                              placeholder="Nhập FORM VIDEO..."
                            />


                            {
                              isOutdated && (

                                <div
                                  className="
                                    absolute
                                    top-2
                                    right-2
                                    bg-red-50
                                    border
                                    border-red-200
                                    text-red-700
                                    px-2
                                    py-1
                                    text-[9px]
                                    font-bold
                                    rounded-lg
                                  "
                                >
                                  ẢNH NGUỒN ĐÃ THAY ĐỔI
                                </div>

                              )
                            }

                          </td>


                          {/* VIDEO RESULT */}

                          <td className="sheet-cell">

                            <div className="flex gap-2 h-full">

                              <div className="flex-1 min-w-0">

                                {
                                  currentVideo
                                    ? (

                                    <div
                                      className="
                                        relative
                                        h-full
                                        min-h-[130px]
                                        border
                                        rounded-lg
                                        overflow-hidden
                                        group
                                      "

                                      style={{
                                        background:
                                          'var(--bg-soft)',

                                        borderColor:
                                          isOutdated
                                            ? '#ef4444'
                                            : 'var(--border)'
                                      }}
                                    >

                                      <video
                                        src={`data:${currentVideo.mimeType};base64,${currentVideo.base64}`}

                                        className="
                                          w-full
                                          h-full
                                          object-contain
                                          bg-black
                                        "

                                        controls

                                        preload="metadata"
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
                                          rounded
                                          font-bold
                                          pointer-events-none
                                        "
                                      >
                                        V{row.currentVideoIndex + 1}
                                      </div>


                                      <button
                                        type="button"

                                        onClick={
                                          () =>
                                            generateVideo(
                                              row.id
                                            )
                                        }

                                        className="
                                          icon-button
                                          absolute
                                          top-2
                                          right-2
                                        "

                                        title="Tạo lại video"
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

                                    </div>

                                  )
                                    : (

                                    <button
                                      type="button"

                                      onClick={
                                        () =>
                                          generateVideo(
                                            row.id
                                          )
                                      }

                                      disabled={
                                        !sourceImg
                                      }

                                      className="
                                        generate-placeholder
                                        disabled:opacity-50
                                        disabled:cursor-not-allowed
                                      "
                                    >
                                      TẠO VIDEO
                                    </button>

                                  )
                                }

                              </div>


                              {
                                row.videoVersions.length >
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
                                      row.videoVersions.map(
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
                                                selectVideoVersion(
                                                  row.id,
                                                  index
                                                )
                                            }

                                            className={`
                                              min-h-7
                                              rounded
                                              border
                                              text-[9px]
                                              font-bold

                                              ${
                                                row.currentVideoIndex ===
                                                index
                                                  ? 'bg-blue-600 border-blue-600 text-white'
                                                  : 'border-slate-300'
                                              }
                                            `}

                                            style={
                                              row.currentVideoIndex ===
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


                          {/* SUCCESS */}

                          <td className="sheet-cell text-center pt-5">

                            {
                              row.status ===
                              'COMPLETED' &&
                              !isOutdated && (

                                <div
                                  className="
                                    inline-flex
                                    items-center
                                    gap-1
                                    text-green-600
                                    font-bold
                                    text-[10px]
                                  "
                                >

                                  <span
                                    className="
                                      material-symbols-outlined
                                      text-[20px]
                                    "
                                  >
                                    check_circle
                                  </span>

                                  OK

                                </div>

                              )
                            }


                            {
                              row.status ===
                              'RUNNING' && (

                                <div
                                  className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    text-blue-600
                                    text-[10px]
                                    font-bold
                                  "
                                >

                                  <div
                                    className="
                                      w-4
                                      h-4
                                      border-2
                                      border-blue-600
                                      border-t-transparent
                                      rounded-full
                                      animate-spin
                                    "
                                  />

                                  ĐANG TẠO

                                </div>

                              )
                            }

                          </td>


                          {/* FAILED */}

                          <td className="sheet-cell">

                            {
                              row.status ===
                              'FAILED'
                                ? (

                                <div
                                  className="
                                    bg-red-50
                                    border
                                    border-red-200
                                    text-red-700
                                    rounded-lg
                                    p-2
                                    text-[10px]
                                    leading-relaxed
                                    break-words
                                  "
                                >
                                  {
                                    row.error ||
                                    'Tạo video thất bại.'
                                  }
                                </div>

                              )
                                : isOutdated
                                  ? (

                                  <div
                                    className="
                                      bg-amber-50
                                      border
                                      border-amber-200
                                      text-amber-700
                                      rounded-lg
                                      p-2
                                      text-[10px]
                                      leading-relaxed
                                    "
                                  >
                                    Video này được tạo từ ảnh version cũ. Hãy tạo lại trước khi lưu.
                                  </div>

                                )
                                  : (

                                  <div
                                    className="
                                      text-[10px]
                                      break-words
                                    "

                                    style={{
                                      color:
                                        row.error
                                          ? '#dc2626'
                                          : 'var(--text-muted)'
                                    }}
                                  >
                                    {row.error}
                                  </div>

                                )
                            }

                          </td>


                          {/* CONFIRM SAVE */}

                          <td className="sheet-cell text-center pt-4">

                            <div
                              className="
                                flex
                                flex-col
                                items-center
                                gap-2
                              "
                            >

                              <input
                                type="checkbox"

                                checked={
                                  row.saveConfirmed
                                }

                                disabled={
                                  !canConfirm
                                }

                                onChange={
                                  e =>
                                    handleConfirmSave(
                                      row,
                                      e.currentTarget.checked
                                    )
                                }

                                className="
                                  accent-blue-600
                                  disabled:opacity-40
                                "
                              />


                              <div
                                className="
                                  text-[9px]
                                  leading-tight
                                "

                                style={{
                                  color:
                                    'var(--text-muted)'
                                }}
                              >
                                Xem video
                                <br />
                                rồi xác nhận
                              </div>

                            </div>

                          </td>


                          {/* SAVE PATH */}

                          <td className="sheet-cell">

                            <textarea
                              value={
                                sourceRow?.savePath ||
                                row.savePath
                              }

                              onChange={
                                e =>
                                  updateVideoRow(
                                    row.id,
                                    'savePath',
                                    e.currentTarget.value
                                  )
                              }

                              placeholder={
                                'E:\\PROJECT\\MEDIA'
                              }
                            />


                            {
                              sourceRow?.savePath && (

                                <div
                                  className="
                                    mt-1
                                    text-[9px]
                                  "

                                  style={{
                                    color:
                                      'var(--text-muted)'
                                  }}
                                >
                                  Kế thừa từ SẢN XUẤT
                                </div>

                              )
                            }

                          </td>


                          {/* SAVE VIDEO */}

                          <td className="sheet-cell text-center pt-4">

                            <button
                              type="button"

                              onClick={
                                () =>
                                  saveVideo(
                                    row
                                  )
                              }

                              disabled={
                                !canSave
                              }

                              className="
                                btn-action
                                btn-primary
                                disabled:opacity-40
                                disabled:cursor-not-allowed
                              "
                            >

                              <span
                                className="
                                  material-symbols-outlined
                                  text-[16px]
                                "
                              >
                                save
                              </span>

                              LƯU VIDEO

                            </button>


                            {
                              canSave && (

                                <div
                                  className="
                                    text-[9px]
                                    mt-2
                                    font-semibold
                                  "

                                  style={{
                                    color:
                                      '#16a34a'
                                  }}
                                >
                                  {
                                    sourceRow?.stt ||
                                    row.stt
                                  }.mp4
                                </div>

                              )
                            }

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
                                  updateVideoRow(
                                    row.id,
                                    'isDone',
                                    e.currentTarget.checked
                                  )
                              }

                              className="accent-green-600"
                            />

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