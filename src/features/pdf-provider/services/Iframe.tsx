import React from 'react'

const Iframe = ({ name, title }: { name: string, title: string }) => {
    return (
        <iframe src="https://drive.google.com/file/d/1rDkJ21vCOCThI5HO6A-2kpyX1gzXr1v3/preview"
            title={title}
            height={1280}
            width={720}
            style={{ height: "100%", width: "100%" }}
            loading="lazy"
            name={name}
            border="0"
            allowDownloads={false}
            allowTopNavigation={false}
            allowFullScreen={true}
            allowPopups={false}
            className='print:hidden'
        ></iframe>
    )
}

export default Iframe