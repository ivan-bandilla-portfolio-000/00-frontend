interface IframeProps {
    name: string;
    title: string;
    src: string;
}

const Iframe = ({ name, title, src }: IframeProps) => {
    return (
        <iframe
            src={src}
            title={title}
            height={1280}
            width={720}
            style={{ height: "100%", width: "100%" }}
            loading="lazy"
            name={name}
            className='print:hidden'
        />
    )
}

export default Iframe