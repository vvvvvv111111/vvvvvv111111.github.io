/* =====================================================================
   ВЕСЬ КОНТЕНТ САЙТА — ЗДЕСЬ.
   Меняй только текст в кавычках и числа. Код сайта (index.html) трогать не нужно.
   Подробная инструкция — в файле README.md.
   ===================================================================== */

window.SITE = {

  /* ---------- Шапка ---------- */
  logo: "vvvvvvvvvwwwww",
  role: "Game UI Designer",
  heroTitle: "Small details.",
  heroTitleSoft: "Big experiences.",
  heroSub: "Interfaces made for play.",

  /* ---------- Обо мне ---------- */
  about: "Hi! I’m a UI designer specializing in Roblox projects. I create clean and user-friendly interfaces in Figma and can fully implement them in Roblox Studio for all devices. I have 2 years of design experience.",

  /* ---------- Discord ----------
     username — ник, который копируется по клику.
     link     — ссылка на профиль или сервер (можно оставить пустой: "").  */
  discord: {
    username: ".dinastyy",
    link: ""
  },

  /* ---------- Валюты (кнопки над ценами) ---------- */
  currencies: ["Robux", "USDT", "RUB"],

  /* ---------- Услуги и цены ----------
     Чтобы добавить услугу — скопируй блок { ... } целиком, вставь через запятую и поменяй.  */
  services: [
    {
      name: "Per frame",
      description: "",
      prices: { Robux: 3000, USDT: 20, RUB: 1500 }
    }
  ],

  /* ---------- Работы в портфолио ----------
     Картинки клади в папку works/.
     cover  — картинка на карточке.
     images — все картинки проекта (открываются по клику, листаются стрелками).
     category — раздел для фильтра (Cartoon, Simulator, Minimal…), разделы создаются сами.  */
  projects: [
    {
      title: "Quiz interface",
      category: "Cartoon",
      type: "Game UI",
      description: "",
      cover: "works/quiz-interface.jpg",
      images: ["works/quiz-interface.jpg"]
    }
  ]

};
