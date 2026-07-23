const transitions = {
    smooth: {
        duration: .5,
        ease: "easeOut",
    },

    slow: {
        duration: .8,
        ease: "easeOut",
    },

    spring: {
        type: "spring",
        stiffness: 120,
        damping: 18,
    },

    bounce: {
        type: "spring",
        stiffness: 250,
        damping: 12,
    },
};

export default transitions;