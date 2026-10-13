import Link from "next/link";
import { Landmark } from "lucide-react";
import styles from "./landing.module.css";

export default function Brand() {
    return (
        <Link href="/" className={styles.brand} aria-label="MBANK home">
            <span className={styles.brandMark}>
                <Landmark size={21} strokeWidth={2} />
            </span>
            MBANK<span className={styles.brandDot}>®</span>
        </Link>
    );
}
