import { motion } from 'motion/react';

import { styles } from '@/styles/js/styles';
import { staggerContainer } from '@/utils/motion';

const SectionWrapper = (Component, idName, options = {}) => {
    function HOC() {
        const { className = '', background = null, ...rest } = options;

        return (
            <section className={className}>
                {typeof background === "function" ? background(props) : background}
                <motion.div
                    variants={staggerContainer()}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.25 }}
                    className={`${styles.padding} container mx-auto relative z-0 pointer-events-none`}
                >
                    <span className='hash-span' id={idName}>
                        &nbsp;
                    </span>
                    <Component />
                </motion.div>
            </section>
        )
    }
    return HOC;
}

export default SectionWrapper