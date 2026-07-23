import transitions from "./transitions";

export const fadeUp = {

    hidden: {
        opacity: 0,
        y: 40,
    },

    visible: {
        opacity: 1,
        y: 0,

        transition: transitions.smooth,
    },
};

export const fadeDown = {

    hidden: {
        opacity: 0,
        y: -40,
    },

    visible: {
        opacity: 1,
        y: 0,

        transition: transitions.smooth,
    },
};

export const fadeLeft = {

    hidden: {
        opacity: 0,
        x: -40,
    },

    visible: {
        opacity: 1,
        x: 0,

        transition: transitions.smooth,
    },
};

export const fadeRight = {

    hidden: {
        opacity: 0,
        x: 40,
    },

    visible: {
        opacity: 1,
        x: 0,

        transition: transitions.smooth,
    },
};