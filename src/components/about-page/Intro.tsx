import CTA2 from "@/components/mvpblocks/cta-2";
import personalInfo from "@/constants/personalInfo";
import PdfProvider from "@/features/pdf-provider";

const Intro = () => {
    const description = () => (
        <>
            <p>I'm a junior backend developer specializing in web application development with a focus on performance optimization and data integrity.</p>
            <br />
            <p>As a self-taught junior developer, I bring expertise in content delivery optimization, database management, and performance tuning while eagerly exploring modern architectures for scalability and maintainability. I'm passionate about building secure systems and actively learning emerging technologies while continuously expanding my technical skill set particularly in automation and networking.</p>
        </>
    );

    return (
        <>
            <CTA2
                title={{
                    level: 1, text: "About Ivan",
                    props: { className: "text-sm sm:text-sm md:text-base font-black" }
                }}
                description={description()}
                ctaArea={
                    <div className="flex w-full justify-center-safe my-6 lg:my-0">
                        <PdfProvider
                            // @ts-ignore
                            docID={personalInfo.resume.cloudPdfDocID}
                            fallbackSrc={personalInfo.resume.driveLink}
                            description={null}
                            title={`${personalInfo.name}'s Resume`}
                            trigger={{
                                label: <>See Resume</>,
                                props: { variant: "outline", className: "pointer-coarse:px-8 pointer-coarse:py-5 px-10 py-6 rounded-full text-base md:text-lg font-bold cursor-pointer" }
                            }}
                            showProviderTabs={true}
                        />
                    </div>
                }
            />


        </>
    );
};

export default Intro;