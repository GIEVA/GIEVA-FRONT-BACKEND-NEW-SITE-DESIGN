import { useCallback, useEffect, useState } from "react";

export default function useNavbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    const [activeDropdown, setActiveDropdown] = useState(null);

    const [activeMegaMenu, setActiveMegaMenu] = useState(null);

    const [scrolled, setScrolled] = useState(false);

    //--------------------------------------------------
    // Mobile
    //--------------------------------------------------

    const openMobile = useCallback(() => {
        setMobileOpen(true);
    }, []);

    const closeMobile = useCallback(() => {
        setMobileOpen(false);
    }, []);

    //--------------------------------------------------
    // Dropdown
    //--------------------------------------------------

    const openDropdown = useCallback((id) => {
        setActiveDropdown(id);
    }, []);

    const closeDropdown = useCallback(() => {
        setActiveDropdown(null);
    }, []);

    //--------------------------------------------------
    // Mega Menu
    //--------------------------------------------------

    const openMegaMenu = useCallback((id) => {
        setActiveMegaMenu(id);
    }, []);

    const closeMegaMenu = useCallback(() => {
        setActiveMegaMenu(null);
    }, []);

    //--------------------------------------------------
    // Scroll
    //--------------------------------------------------

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener(
            "scroll",
            handleScroll
        );

        handleScroll();

        return () =>
            window.removeEventListener(
                "scroll",
                handleScroll
            );
    }, []);

    return {
        mobileOpen,
        activeDropdown,
        activeMegaMenu,
        scrolled,

        openMobile,
        closeMobile,

        openDropdown,
        closeDropdown,

        openMegaMenu,
        closeMegaMenu,
    };
}