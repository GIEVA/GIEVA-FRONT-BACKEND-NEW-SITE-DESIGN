import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";

import FeatureCard from "../../ui/FeatureCard";

export default function FeatureItem({
    item,
    variant = "default",
    linkComponent: LinkComponent = RouterLink,
}) {
    const {
        title,
        description,
        icon,
        image,
        href,
        external = false,
    } = item;

    const card = (
        <FeatureCard
            title={title}
            description={description}
            icon={icon}
            image={
                image || "/placeholders/feature-image.png" // TODO: Replace with Figma asset
            }
            variant={variant}
        />
    );

    if (!href) {
        return card;
    }

    if (external) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    textDecoration: "none",
                    display: "block",
                }}
            >
                {card}
            </a>
        );
    }

    return (
        <LinkComponent
            to={href}
            style={{
                textDecoration: "none",
                display: "block",
            }}
        >
            {card}
        </LinkComponent>
    );
}

FeatureItem.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
        ]),

        title: PropTypes.string.isRequired,

        description: PropTypes.string,

        icon: PropTypes.node,

        image: PropTypes.string,

        href: PropTypes.string,

        external: PropTypes.bool,
    }).isRequired,

    variant: PropTypes.oneOf([
        "default",
        "glass",
        "outlined",
        "filled",
    ]),

    linkComponent: PropTypes.elementType,
};