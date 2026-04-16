import React from "react";
import styles from './AbilityCards.module.css';
import { CARD_SYMBOL_SVGS } from "../../../domain";

type Props = {
    text: string;
    symbolId: string;
    mode: "inline_chip" | "inline_keyword" | "inline_symbol";
};

export default function AbilityCardInlineToken({ text, symbolId, mode }: Props) {
    const svg = CARD_SYMBOL_SVGS[symbolId] ?? CARD_SYMBOL_SVGS.generic;

    if (mode === 'inline_symbol') {
        return (
            <span className={`${styles.inlineToken} ${styles.inlineTokenSymbol}`} title={text}>
                <span
                    className={styles.inlineTokenIcon}
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            </span>
        );
    }

    if (mode === 'inline_keyword') {
        return (
            <span className={`${styles.inlineToken} ${styles.inlineTokenKeyword}`} title={text}>
                <span
                    className={styles.inlineTokenIcon}
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
                <span>{text}</span>
            </span>
        );
    }

    return (
        <span className={`${styles.inlineToken} ${styles.inlineTokenChip}`} title={text}>
            <span
                className={styles.inlineTokenIcon}
                dangerouslySetInnerHTML={{ __html: svg }}
            />
            <span>{text}</span>
        </span>
    );
}