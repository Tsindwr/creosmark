import React from 'react';
import styles from './AbilityCards.module.css';
import type { AbilityCardFaceKind } from '../../../domain';
import { CARD_SYMBOL_SVGS } from "../../../domain";

type Props = {
    faceKind: AbilityCardFaceKind;
};

export default function AbilityCardFaceBadge({ faceKind }: Props) {
    if (faceKind === 'single') return null;

    const symbolId = faceKind === 'direct' ? 'direct' : 'indirect';
    const svg = CARD_SYMBOL_SVGS[symbolId];

    return (
        <div
            className={`${styles.faceBadge} ${
                faceKind === 'direct' ? styles.faceBadgeDirect : styles.faceBadgeIndirect
            }`}
            aria-label={faceKind}
            title={faceKind}
        >
            <span
                className={styles.faceBadgeIcon}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    );
}