import PropTypes from "prop-types";

import { Stack } from "@mui/material";

import NavbarItem from "./NavbarItem";
import NavbarDropdown from "./NavbarDropdown";
import NavbarMegaMenu from "./NavbarMegaMenu";

export default function NavbarLinks({
    navigation = [],
}) {
    return (
        <Stack
            direction="row"
            spacing={1}
            alignItems="center"
        >
            {navigation.map((item) => {
                //--------------------------------------------------
                // Mega Menu
                //--------------------------------------------------

                if (item.type === "mega") {
                    return (
                        <NavbarMegaMenu
                            key={item.id}
                            item={item}
                        />
                    );
                }

                //--------------------------------------------------
                // Dropdown
                //--------------------------------------------------

                if (
                    item.children &&
                    item.children.length > 0
                ) {
                    return (
                        <NavbarDropdown
                            key={item.id}
                            item={item}
                        />
                    );
                }

                //--------------------------------------------------
                // Normal Link
                //--------------------------------------------------

                return (
                    <NavbarItem
                        key={item.id}
                        item={item}
                    />
                );
            })}
        </Stack>
    );
}

NavbarLinks.propTypes = {
    navigation: PropTypes.arrayOf(
        PropTypes.object
    ),
};