import PropTypes from "prop-types";

import {
    Stack,
    Box,
} from "@mui/material";

export default function NavbarActions({

    primaryAction,

    secondaryAction,

    actions = [],

    sx = {},

}) {

    return (

        <Stack

            direction="row"

            spacing={1.5}

            alignItems="center"

            sx={{

                flexShrink:0,

                ...sx,

            }}

        >

            {actions.map((action,index)=>(

                <Box key={index}>

                    {action}

                </Box>

            ))}

            {secondaryAction}

            {primaryAction}

        </Stack>

    );

}

NavbarActions.propTypes={

    primaryAction:PropTypes.node,

    secondaryAction:PropTypes.node,

    actions:PropTypes.arrayOf(
        PropTypes.node
    ),

    sx:PropTypes.object,

};