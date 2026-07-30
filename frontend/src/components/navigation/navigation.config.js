// ======================================================
// PUBLIC NAVIGATION
// ======================================================

export const publicNavigation = [
  {
    label: "Home",
    path: "/",
    
  },
  {
    label: "Consultancy",
    children: [
      {
        label: "Educational Consultancy",
        description:
          "Personalized guidance for your academic journey.",
        path: "/consultations",
      },
      {
        label: "Study Abroad",
        description:
          "Admissions and international placement support.",
        path: "/study-abroad",
      },
      {
        label: "Visa Assistance",
        description:
          "Professional visa application guidance.",
        path: "/visa",
      },
      {
        label: "Career Guidance",
        description:
          "Academic and career counselling services.",
        path: "/consultations",
      },
    ],
  },

  {
    label: "About",
    children: [
      {
        label: "About GIEVA",
        path: "/about",
      },
      {
        label: "Our Team",
        path: "/team",
      },
      {
        label: "Partners",
        path: "/partners",
      },
      {
        label: "Testimonials",
        path: "/testimonials",
      },
    ],
  },

 {
  label: "Services",
  children: [
    {
      label: "What We Do",
      description: "Explore all educational services offered by GIEVA.",
      path: "/services",
    },
    {
      label: "HEALS Membership",
      description: "Join the HEALS programme.",
      path: "/heals/apply",
    },
    {
      label: "Test Registration",
      description: "Browse all available international examinations.",
      path: "/exam-catalog",
    },
    {
      label: "TOEFL ASR Form",
      description: "Request TOEFL Additional Score Reports.",
      path: "/toefl-asr",
    },
    {
      label: "Visa Processing",
      description: "Professional visa guidance and processing.",
      path: "/services/visa",
    },
  ],
},

  {
    label: "Resources",
    children: [
      {
        label: "Articles",
        path: "/articles",
      },
      {
        label: "Campaigns",
        path: "/campaigns",
      },
      {
        label: "Programs",
        path: "/our-programs",
      },
      {
        label: "FAQs",
        path: "/faqs",
      },
      {
        label: "Contact",
        path: "/contact",
      },
    ],
  },
];


// ======================================================
// GUEST ACTIONS
// ======================================================

export const guestActions = [
  {
    label: "Log in",
    path: "/login",
    variant: "text",
  },

  {
    label: "Book Consultancy",
    path: "/book-consultancy",
    variant: "contained",
  },
];



// ======================================================
// USER MENU
// ======================================================

export const userMenu = {
  student: [
    {
      label: "My Profile",
      path: "/student/profile",
    },
    {
      label: "Dashboard",
      path: "/student/dashboard",
    },
      {
    label: "Live Classes",
    path: "/student/live-classes",
  },
    {
      label: "My Courses",
      path: "/courses",
    },
    {
      label: "Certificates",
      path: "/certificates",
    },
    {
      label: "Bookings",
      path: "/bookings",
    },
    {
      label: "Settings",
      path: "/settings",
    },
  ],

  tutor: [
    {
      label: "My Profile",
      path: "/tutor/profile",
    },
    {
      label: "Dashboard",
      path: "/tutor/dashboard",
    },
      {
    label: "Live Classes",
    path: "/tutor/live-classes",
  },
    {
      label: "My Courses",
      path: "/courses",
    },
    {
      label: "Bookings",
      path: "/bookings",
    },
    {
      label: "Settings",
      path: "/settings",
    },
  ],

  admin: [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
    },
    {
      label: "Settings",
      path: "/admin/settings",
    },
  ],
};



// ======================================================
// ROLE DASHBOARDS
// ======================================================

export const dashboards = {
  student: "/student/dashboard",

  tutor: "/tutor/dashboard",

  admin: "/admin/dashboard",

  superadmin: "/admin/dashboard",
};

// ======================================================
// ROLE ROUTES
// ======================================================

export const roleRoutes = {

  dashboard: {
    student: "/student/dashboard",
    tutor: "/tutor/dashboard",
    admin: "/admin/dashboard",
  },

  profile: {
    student: "/student/profile",
    tutor: "/tutor/profile",
  },

  courses: {
    student: "/courses",
    tutor: "/courses",
  },

  liveClasses: {
    student: "/student/live-classes",
    tutor: "/tutor/live-classes",
  },

  applications: {
    student: "/heals/my-applications",
  },

  exams: {
    student: "/my-exam-registrations",
  },

};


// ======================================================
// PORTAL NAVIGATION
// ======================================================

export const portalNavigation = [

  {
    label: "Dashboard",
    routeKey: "dashboard",
  },

  {
    label: "My Learning",

    children: [

      {
        label: "Courses",
        routeKey: "courses",
      },

      {
        label: "Live Classes",
        routeKey: "liveClasses",
      },

      {
        label: "My Applications",
        routeKey: "applications",
        roles: ["student"],
      },

      {
        label: "Exam Registrations",
        routeKey: "exams",
        roles: ["student"],
      },

    ],

  },

  {

    label: "Explore",

    children: [

      {
        label: "Articles",
        path: "/articles",
      },

      {
        label: "Campaigns",
        path: "/campaigns",
      },

      {
        label: "Programs",
        path: "/programs",
      },

      {
        label: "Consultancy",
        path: "/consultancy",
      },

    ],

  },

];


// ======================================================
// FOOTER
// ======================================================

export const footerNavigation = {
  consultancy: [
    {
      label: "Educational Consultancy",
      path: "/consultations",
    },

    {
      label: "Study Abroad",
      path: "/study-abroad",
    },

    {
      label: "Scholarships",
      path: "/services/scholarships",
    },

    {
      label: "Visa Assistance",
      path: "/services/visa",
    },
  ],

  resources: [
    {
      label: "Articles",
      path: "/articles",
    },

    {
      label: "Campaigns",
      path: "/campaigns",
    },

    {
      label: "Programs",
      path: "/programs",
    },

    {
      label: "FAQs",
      path: "/faqs",
    },
  ],

  company: [
    {
      label: "About",
      path: "/about",
    },

    {
      label: "Contact",
      path: "/contact",
    },

    {
      label: "Privacy Policy",
      path: "/privacy",
    },

    {
      label: "Terms of Service",
      path: "/terms",
    },
  ],
};


// ======================================================
// SOCIALS
// ======================================================

export const socialLinks = [
  {
    label: "Facebook",
    icon: "facebook",
    url: "#",
  },

  {
    label: "Instagram",
    icon: "instagram",
    url: "#",
  },

  {
    label: "LinkedIn",
    icon: "linkedin",
    url: "#",
  },

  {
    label: "X",
    icon: "twitter",
    url: "#",
  },

  {
    label: "YouTube",
    icon: "youtube",
    url: "#",
  },
];