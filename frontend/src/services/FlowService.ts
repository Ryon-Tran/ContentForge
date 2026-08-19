import {
  IService,
  StorageTable
} from './types';

import {
  ActivityLog
} from '../types';


const API_BASE =
  'http://127.0.0.1:8000';


async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {

  const response =
    await fetch(
      `${API_BASE}${path}`,
      {
        headers: {
          'Content-Type':
            'application/json',

          ...(options.headers || {})
        },

        ...options
      }
    );


  if (!response.ok) {

    const text =
      await response.text();

    throw new Error(
      `API ${path} failed: ${response.status} ${text}`
    );

  }


  const contentType =
    response.headers.get(
      'content-type'
    ) || '';


  if (
    !contentType.includes(
      'application/json'
    )
  ) {

    return {} as T;

  }


  return response.json();

}


export const FlowService:
  IService = {

  // =========================================================
  // AI
  // =========================================================

  ai: {

    generateImage:
      async (
        prompt,
        referenceIds,
        model
      ) => {

      const result =
        await apiRequest<{
          base64: string;
          mimeType: string;
          mediaId?: string;
        }>(
          '/api/ai/generate-image',
          {
            method: 'POST',

            body:
              JSON.stringify({
                prompt,
                referenceIds,
                model,
                aspectRatio:
                  '9:16'
              })
          }
        );


      return {
        id:
          crypto.randomUUID(),

        base64:
          result.base64,

        mimeType:
          result.mimeType,

        mediaId:
          result.mediaId ??
          crypto.randomUUID(),

        createdAt:
          Date.now()
      };

    },


    generateVideo:
      async (
        prompt,
        firstFrameId,
        model
      ) => {

      const result =
        await apiRequest<{
          base64: string;
          mimeType: string;
          mediaId?: string;
        }>(
          '/api/ai/generate-video',
          {
            method:
              'POST',

            body:
              JSON.stringify({
                prompt,
                firstFrameId,
                model,
                aspectRatio:
                  '9:16',

                durationSeconds:
                  8
              })
          }
        );


      return {
        id:
          crypto.randomUUID(),

        base64:
          result.base64,

        mimeType:
          result.mimeType,

        mediaId:
          result.mediaId ??
          crypto.randomUUID(),

        sourceImageId:
          firstFrameId,

        createdAt:
          Date.now()
      };

    },


    generateText:
      async (
        prompt
      ) => {

      const result =
        await apiRequest<{
          text: string;
        }>(
          '/api/ai/generate-text',
          {
            method:
              'POST',

            body:
              JSON.stringify({
                prompt
              })
          }
        );


      return result.text;

    }

  },


  // =========================================================
  // STORAGE
  // =========================================================

  storage: {

    saveRow:
      async (
        row,
        table:
          StorageTable
      ) => {

      await apiRequest<{
        success:
          boolean;
      }>(
        '/api/storage/save-row',
        {
          method:
            'POST',

          body:
            JSON.stringify({
              row,
              table
            })
        }
      );

    },


    loadRows:
      async (
        table:
          StorageTable
      ) => {

      const result =
        await apiRequest<{
          rows:
            any[];
        }>(
          `/api/storage/load-rows?table=${encodeURIComponent(table)}`,
          {
            method:
              'GET'
          }
        );


      return (
        result.rows ||
        []
      );

    },

    loadRow:
      async (
        id: string
      ) => {
        const result = await apiRequest<{ row: any }>(
          `/api/storage/load-row?id=${encodeURIComponent(id)}`,
          { method: 'GET' }
        );
        return result.row;
      },


    deleteRow:
      async (
        id: string,
        table:
          StorageTable
      ) => {

      await apiRequest<{
        success:
          boolean;
      }>(
        '/api/storage/delete-row',
        {
          method:
            'POST',

          body:
            JSON.stringify({
              id,
              table
            })
        }
      );

    }

  },


  // =========================================================
  // FILES
  // =========================================================

  files: {

    saveFile:
      async (
        base64:
          string,

        mimeType:
          string,

        filename:
          string,

        path:
          string
      ) => {

      await apiRequest<{
        success:
          boolean;

        path?:
          string;

        filename?:
          string;

        overwritten?:
          boolean;
      }>(
        '/api/files/save-file',
        {
          method:
            'POST',

          body:
            JSON.stringify({
              base64,
              mimeType,
              filename,
              path
            })
        }
      );

    }

  },


  // =========================================================
  // JOBS
  // =========================================================

  jobs: {
    enqueue: async (rowId: string, jobType: string, payload: any) => {
      return await apiRequest<{ id: string, status: string }>(
        '/api/jobs',
        {
          method: 'POST',
          body: JSON.stringify({ row_id: rowId, job_type: jobType, payload })
        }
      );
    },
    
    getJob: async (jobId: string) => {
      return await apiRequest<any>(
        `/api/jobs/${encodeURIComponent(jobId)}`,
        {
          method: 'GET'
        }
      );
    }
  },


  // =========================================================
  // ACTIVITY LOG CRUD
  // =========================================================

  activity: {

    // -------------------------------------------------------
    // CREATE
    // -------------------------------------------------------

    create:
      async (
        log:
          ActivityLog
      ) => {

      const result =
        await apiRequest<{
          activity:
            ActivityLog;
        }>(
          '/api/activity',
          {
            method:
              'POST',

            body:
              JSON.stringify({
                activity:
                  log
              })
          }
        );


      return result.activity;

    },


    // -------------------------------------------------------
    // READ
    // -------------------------------------------------------

    list:
      async () => {

      const result =
        await apiRequest<{
          activities:
            ActivityLog[];
        }>(
          '/api/activity',
          {
            method:
              'GET'
          }
        );


      return (
        result.activities ||
        []
      );

    },


    // -------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------

    update:
      async (
        id:
          string,

        patch:
          Partial<ActivityLog>
      ) => {

      const result =
        await apiRequest<{
          activity:
            ActivityLog;
        }>(
          `/api/activity/${encodeURIComponent(id)}`,
          {
            method:
              'PUT',

            body:
              JSON.stringify({
                patch
              })
          }
        );


      return result.activity;

    },


    // -------------------------------------------------------
    // DELETE ONE
    // -------------------------------------------------------

    delete:
      async (
        id:
          string
      ) => {

      await apiRequest<{
        success:
          boolean;
      }>(
        `/api/activity/${encodeURIComponent(id)}`,
        {
          method:
            'DELETE'
        }
      );

    },


    // -------------------------------------------------------
    // CLEAR ALL
    // -------------------------------------------------------

    clear:
      async () => {

      await apiRequest<{
        success:
          boolean;
      }>(
        '/api/activity',
        {
          method:
            'DELETE'
        }
      );

    }

  }

};