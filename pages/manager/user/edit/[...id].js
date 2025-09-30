
import axios from "axios";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const User = dynamic(() => import("@/components/User"), { ssr: false });

export default function EditUser() {


    const router = useRouter();
    const { id } = router.query;

    const [UserInfo, setUserInfo] = useState(null);

    useEffect(() => {
        if (!id) {
            return;
        } else {
            axios.get('/api/user?id=' + id).then(response => {
                setUserInfo(response.data)
            })
        }
    }, [id])

    return <>

        <div>
            {
                UserInfo && (
                    <User {...UserInfo} />
                )
            }
        </div>
    </>
}

