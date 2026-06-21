// src/constants/examCatalogData.js

import { EXAM_PRICES } from "./examPrices";

export const EXAM_CATALOG = [
  {
    examType: "SAT",
    title: "SAT",
    description:
      "Scholastic Assessment Test for undergraduate admissions in the United States and other countries.",

    amount: EXAM_PRICES.SAT,

    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",

    route: "/exam-register/SAT",
  },

  {
    examType: "IELTS",
    title: "IELTS",
    description:
      "International English Language Testing System for study, work, and migration.",

    amount: EXAM_PRICES.IELTS,

    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173",

    route: "/exam-register/IELTS",
  },

  {
    examType: "TOEFL",
    title: "TOEFL",
    description:
      "Test of English as a Foreign Language accepted by universities worldwide.",

    amount: EXAM_PRICES.TOEFL,

    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f",

    route: "/exam-register/TOEFL",
  },

  {
    examType: "GRE",
    title: "GRE",
    description:
      "Graduate Record Examination required by many graduate schools.",

    amount: EXAM_PRICES.GRE,

    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85",

    route: "/exam-register/GRE",
  },

  {
    examType: "ACT",
    title: "ACT",
    description:
      "American College Testing exam used for undergraduate admissions.",

    amount:
      EXAM_PRICES.ACT.standard,

    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",

    route: "/exam-register/ACT",
  },

  {
    examType: "SEVIS",
    title: "SEVIS",
    description:
      "SEVIS fee processing support for F1 and J1 visa applicants.",

    amount:
      EXAM_PRICES.SEVIS.F1,

    image:
      "https://images.unsplash.com/photo-1521791136064-7986c2920216",

    route: "/exam-register/SEVIS",
  },
];