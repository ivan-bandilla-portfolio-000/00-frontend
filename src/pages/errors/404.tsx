import { Button } from '@/components/ui/button'
import { Link } from 'react-router'

const NotFound = () => {
    return (
        <main className='h-screen grid place-content-center'>
            <div className=" text-center space-y-2">
                <h1 className='text-3xl lg:text-5xl font-bold'>404 <span className='text-[0.5em]'>Page not found</span></h1>
                <p
                    className='text-base'
                >The page you requested doesn't exist.</p>
                <br />
                <Button size={'lg'} className='text-lg py-8' >
                    <Link
                        className=''
                        to="/">Go home</Link>
                </Button>
            </div>
        </main>
    )
}

export default NotFound