import CTA2 from "@/components/mvpblocks/cta-2";

const Intro = () => {
    const description = () => (
        <>
            <p>I'm a junior backend developer specializing in web application development with a focus on performance optimization and data integrity.</p>
            <br />
            <p>As a self-taught junior developer, I bring expertise in content delivery optimization, database management, and performance tuning while eagerly exploring modern architectures for scalability and maintainability. I'm passionate about building secure systems and actively learning emerging technologies while continuously expanding my technical skill set particularly in automation and networking.</p>
        </>
    );

    return (
        <CTA2
            title={{
                level: 2, text: "About Ivan",
                props: { className: "text-sm sm:text-sm md:text-sm" }
            }}
            description={description()}
        />
    );
};

export default Intro;