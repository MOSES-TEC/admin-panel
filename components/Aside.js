import Link from "next/link";
import { IoHomeOutline } from "react-icons/io5";
import { BiLeaf } from "react-icons/bi";
import { MdOutlinePermMedia } from "react-icons/md";
import { SiCodecrafters } from "react-icons/si";
import { IoSettingsOutline } from "react-icons/io5";
import { MdOutlinePowerSettingsNew } from "react-icons/md";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";


export default function Aside() {

    const { data: session } = useSession();
    const [ activeLink, setActiveLink ] = useState('/');

    const router = useRouter();

    const handleLinkChange = (link) => {
        setActiveLink(link);
    };

    useEffect(() => {
        setActiveLink(router.pathname);
    }, [router.pathname]);

    if(session) {

        return <>

        <aside>
            <div className="logo">
                <img src="/img/logo.png" alt="logo" />
            </div>

            <div className="aside_left_nav">
                <Link href="/" className={activeLink === '/' ? 'active' : ''}>
                    <IoHomeOutline /> <span>Home</span>
                </Link>
                <Link href="/manager" className={activeLink === '/manager' ? 'active' : ''}>
                    <BiLeaf /> <span>Content Manager</span>
                </Link>
                <Link href="/media" className={activeLink === '/media' ? 'active' : ''}>
                    <MdOutlinePermMedia /> <span>Media Library</span>
                </Link>
                {process.env.NODE_ENV === "development" && (
                    <Link href="/builder" className={activeLink === '/builder' ? 'active' : ''}>
                        <SiCodecrafters /> <span>Content-Type Builder</span>
                    </Link>
                )}
                <Link href="/setting/overview" className={activeLink === '/setting/overview' ? 'active' : ''}>
                    <IoSettingsOutline /> <span>Settings</span>
                </Link>
            </div>

            <div className="account_setting_icon_aside">
                <button onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
                    <MdOutlinePowerSettingsNew />
                </button>
            </div>

        </aside>

        </>

    }
};

