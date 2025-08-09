import { motion } from 'motion/react';
import type { ComponentType } from 'react';
import { styles } from '@/styles/js/styles';
import { staggerContainer } from '@/utils/motion';

interface SectionWrapperOptions {
    className?: string;
    background?: React.ReactNode | ((props: any) => React.ReactNode);
    renderAnchor?: boolean; // new
    anchorOffsetClass?: string; // new
    [key: string]: any;
}

const SectionWrapper = (
    Component: ComponentType<any>,
    idName: string,
    options: SectionWrapperOptions = {}
) => {
    function HOC(props: any) {
        const {
            className = '',
            background = null,
            renderAnchor = true,
            anchorOffsetClass = 'scroll-mt-[64px]', // adjust to TopBar height
        } = options;

        return (
            <section className={className}>
                {typeof background === "function" ? background(props) : background}
                <motion.div
                    variants={staggerContainer()}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.25 }}
                    className={`${styles.padding} container lg:max-w-[80svw] mx-auto relative z-0 pointer-events-none`}
                >
                    {renderAnchor && (
                        <span className={`hash-span ${anchorOffsetClass}`} id={idName} aria-hidden="true">
                            &nbsp;
                        </span>
                    )}
                    <Component {...props} />
                </motion.div>
            </section>
        )
    }
    return HOC;
}

export default SectionWrapper;