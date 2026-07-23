import PropTypes from "prop-types";

import { motion } from "framer-motion";

import variants from "../../animations/variants";

export default function AnimatedContainer({

    children,

    animation = "fadeUp",

    delay = 0,

    duration,

    once = true,

    amount = .2,

    as = "div",

    ...props
}) {

    const selected = variants[animation];

    return (

        <motion.div

            as={as}

            variants={selected}

            initial="hidden"

            whileInView="visible"

            viewport={{

                once,

                amount,

            }}

            transition={{

                delay,

                duration,
            }}

            {...props}
        >

            {children}

        </motion.div>

    );

}

AnimatedContainer.propTypes = {

    children: PropTypes.node,

    animation: PropTypes.oneOf([

        "fadeUp",

        "fadeDown",

        "fadeLeft",

        "fadeRight",

    ]),

    delay: PropTypes.number,

    duration: PropTypes.number,

    once: PropTypes.bool,

    amount: PropTypes.number,

    as: PropTypes.string,

};