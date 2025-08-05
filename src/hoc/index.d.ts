declare module "@/hoc" {
    import { ComponentType } from "react";
    const SectionWrapper: (
        Component: ComponentType<any>,
        id: string,
        options?: Record<string, any>
    ) => ComponentType<any>;
    export { SectionWrapper };
}