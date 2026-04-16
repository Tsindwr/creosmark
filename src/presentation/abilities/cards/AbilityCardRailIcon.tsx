import React from 'react';
import styles from './AbilityCards.module.css';
import { CARD_SYMBOL_SVGS } from "../../../domain";

type Props = {
    symbolId: string;
    label: string;
    emphasis?: 'normal' | 'large' | 'badge';
};

export default function AbilityCardRailIcon({
    symbolId,
    label,
    emphasis = 'normal',
}: Props) {
    const svg = CARD_SYMBOL_SVGS[symbolId] ?? CARD_SYMBOL_SVGS.generic;

    return (
        <div
            className={`${styles.railIcon} ${
                emphasis === 'large' 
                    ? styles.railIconLarge
                    : emphasis === 'badge'
                        ? styles.railIconBadge
                        : ''
            }`}
            title={label}
            aria-label={label}
        >
            <span
                className={styles.railIconSvg}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
            <span className={styles.railIconLabel}>{label}</span>
        </div>
    );
}