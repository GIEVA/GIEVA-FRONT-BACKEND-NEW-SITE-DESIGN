import { Outlet } from "react-router-dom";


import AuthenticatedNavbar from "../components/navigation/AuthenticatedNavbar/AuthenticatedNavbar";

import { Footer } from "../components/navigation/Footer";

export default function AuthenticatedLayout() {
  return (
    <>
      <AuthenticatedNavbar />

      <main>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}