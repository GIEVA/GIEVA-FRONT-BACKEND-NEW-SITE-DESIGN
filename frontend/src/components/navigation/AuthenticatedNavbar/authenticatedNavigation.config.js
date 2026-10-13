export const authenticatedNavigation = {
  student: [
    {
      label: "Dashboard",
      path: "/student/dashboard",
    },
    {
      label: "Courses",
      path: "/courses",
    },
    {
      label: "Live Classes",
      path: "/student/live-classes",
    },
    {
      label: "Articles",
      path: "/articles",
    },
    {
      label: "Campaigns",
      path: "/campaigns",
    },
    {
      label: "Consultancy",
      children: [
        {
          label: "Book Consultancy",
          path: "/consultancy/book",
        },
        {
          label: "My Consultations",
          path: "/consultancy/my-bookings",
        },
      ],
    },
  ],

  tutor: [
    {
      label: "Dashboard",
      path: "/tutor/dashboard",
    },
    {
      label: "Courses",
      path: "/courses",
    },
    {
      label: "Live Classes",
      path: "/tutor/live-classes",
    },
    {
      label: "Articles",
      path: "/articles",
    },
    {
      label: "Campaigns",
      path: "/campaigns",
    },
    {
      label: "Consultancy",
      children: [
        {
          label: "Book Consultancy",
          path: "/consultancy/book",
        },
      ],
    },
  ],
};