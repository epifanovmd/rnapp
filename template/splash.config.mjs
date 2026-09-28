/**
 * Конфигурация splash-экрана. Применяется скриптом `npm run splash`.
 *
 * Источник (`logo`/`brand`) — файл (`image`), текст (`text`) или эмодзи
 * (`emoji`); несколько источников складываются вертикально через `stack`.
 *
 * Что можно размещать: логотип — по центру (на Android позицию задаёт система),
 * бренд — внизу; отступ бренда от низа настраивается только на iOS, на Android
 * слот 200x80dp у низа экрана фиксирован ОС.
 *
 * Тёмная тема — необязательная секция `dark`: без неё ночные ресурсы удаляются.
 */
export default {
  platforms: ["android", "ios"],

  android: {
    resPath: "android/app/src/main/res",
  },

  ios: {
    projectPath: "ios/rnapp",
    storyboardName: "Splash",
    /** Отступ бренда от низа safe area, pt. */
    brandBottom: 60,
    /** Сдвиг логотипа от центра по вертикали, pt. */
    logoOffsetY: 0,
  },

  /** Слот бренда: холст, в который вписывается изображение. */
  brand: {
    slotWidth: 200,
    slotHeight: 80,
  },

  light: {
    background: "#b84020",
    logo: {
      image: "assets/splash-src/logo.png",
      /** Ширина логотипа в dp/pt: до 134 — безопасная зона иконки Android 12. */
      width: 100,
    },
    brand: {
      text: "React Native",
      font: "sans",
      size: 28,
      color: "#FFFFFF",
      width: 180,
    },
  },
};
