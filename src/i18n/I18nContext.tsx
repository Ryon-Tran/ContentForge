import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  LANGUAGES,
  LanguageCode,
  translations
} from './translations';

type TranslationValue =
  | string
  | Record<string, any>;

interface I18nContextValue {
  language: LanguageCode;

  setLanguage: (
    language: LanguageCode
  ) => void;

  languages: typeof LANGUAGES;

  t: (
    key: string,
    fallback?: string
  ) => string;
}

const I18nContext =
  createContext<I18nContextValue | null>(
    null
  );

const DEFAULT_LANGUAGE: LanguageCode =
  'vi';

const STORAGE_KEY =
  'tools-mmo-language';


function isLanguageCode(
  value: string | null
): value is LanguageCode {
  if (!value) {
    return false;
  }

  return LANGUAGES.some(
    item =>
      item.code === value
  );
}


function getNestedValue(
  object: any,
  path: string
): TranslationValue | undefined {
  return path
    .split('.')
    .reduce(
      (
        current: any,
        part: string
      ) => {
        if (
          current === null ||
          current === undefined
        ) {
          return undefined;
        }

        return current[part];
      },
      object
    );
}


export const I18nProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {

  const [
    language,
    setLanguageState
  ] = useState<LanguageCode>(() => {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (
      isLanguageCode(saved)
    ) {
      return saved;
    }

    return DEFAULT_LANGUAGE;
  });


  useEffect(() => {

    localStorage.setItem(
      STORAGE_KEY,
      language
    );

    document.documentElement.lang =
      language;

  }, [language]);


  const setLanguage = (
    nextLanguage: LanguageCode
  ) => {
    setLanguageState(
      nextLanguage
    );
  };


  const t = (
    key: string,
    fallback?: string
  ): string => {

    const selectedTree =
      translations[language];

    let value =
      getNestedValue(
        selectedTree,
        key
      );


    /*
      Nếu ngôn ngữ được chọn chưa có bản dịch,
      fallback về tiếng Việt.
    */

    if (
      typeof value !== 'string'
    ) {
      value =
        getNestedValue(
          translations.vi,
          key
        );
    }


    /*
      Nếu tiếng Việt cũng không có,
      dùng fallback được truyền vào.
    */

    if (
      typeof value !== 'string'
    ) {
      if (fallback) {
        return fallback;
      }

      return key;
    }


    return value;
  };


  const contextValue =
    useMemo<I18nContextValue>(
      () => ({
        language,
        setLanguage,
        languages:
          LANGUAGES,
        t
      }),
      [language]
    );


  return (
    <I18nContext.Provider
      value={contextValue}
    >
      {children}
    </I18nContext.Provider>
  );
};


export const useI18n =
  (): I18nContextValue => {

    const context =
      useContext(
        I18nContext
      );

    if (!context) {
      throw new Error(
        'useI18n phải được sử dụng bên trong I18nProvider.'
      );
    }

    return context;
  };