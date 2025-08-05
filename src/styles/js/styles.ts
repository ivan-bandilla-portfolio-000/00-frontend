const fontSizes = {
    98: `clamp(4.5rem,6.125rem+2dvw+1dvh,100dvw)`,
    80: `clamp(4rem,5rem+1.5dvw+1dvh,100dvw)`,
    60: `clamp(3rem,3.75rem+1dvw+0.5dvh,100dvw)`,
    50: `clamp(2.5rem,3.125rem+0.75dvw+0.5dvh,100dvw)`,
    48: `clamp(2.25rem,3rem+0.75dvw+0.5dvh,100dvw)`,
    40: `clamp(2rem,2.5rem+0.5dvw+0.25dvh,100dvw)`,
    36: `clamp(1.75rem,2.25rem+0.18dvw+0.15dvh,100dvw)`,
    30: `clamp(1.5rem,1.875rem+0.25dvw+0.25dvh,100dvw)`,
    26: `clamp(1.25rem,1.625rem+0.2dvw+0.2dvh,100dvw)`,
    24: `clamp(1.125rem,1.5rem+0.15dvw+0.15dvh,100dvw)`,
    20: `clamp(1rem,1.25rem+0.1dvw+0.1dvh,100dvw)`,
    18: `clamp(0.875rem,1.125rem+0.08dvw+0.08dvh,100dvw)`,
    16: `clamp(0.75rem,1rem+0.05dvw+0.05dvh,100dvw)`,
    14: `clamp(0.625rem,0.875rem+0.03dvw+0.03dvh,100dvw)`,
    8: `clamp(0.375rem,0.5rem+0.01dvw+0.01dvh,100dvw)`,
}


const styles = {
    paddingX: "sm:px-16 px-6",
    paddingY: "sm:py-16 py-6",
    padding: "sm:px-16 px-6 sm:py-16 py-10",

    heroHeadText:
        `lg:text-[${fontSizes[48]}] md:text-[${fontSizes[36]}] xs:text-[${fontSizes[24]}] text-[${fontSizes[20]}]`,
    heroSubText:
        `lg:text-[${fontSizes[30]}] sm:text-[${fontSizes[26]}] xs:text-[${fontSizes[20]}] text-[${fontSizes[16]}]`,
    heroSmallText:
        `xl:text-[${fontSizes[24]}] lg:text-[${fontSizes[18]}] sm:text-[${fontSizes[14]}] text-[${fontSizes[8]}]`,

    sectionHeadText:
        "md:text-[60px] sm:text-[50px] xs:text-[40px] text-[30px]",
    sectionSubText:
        "sm:text-[18px] text-[14px] uppercase tracking-wider",
};

export { styles };