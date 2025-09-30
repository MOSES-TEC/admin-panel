
import axios from "axios";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const Developer = dynamic(() => import("@/components/Developer"), { ssr: false });

export default function EditDeveloper() {


    const router = useRouter();
    const { id } = router.query;

    const [DeveloperInfo, setDeveloperInfo] = useState(null);

    useEffect(() => {
        if (!id) {
            return;
        } else {
            axios.get('/api/developer?id=' + id).then(response => {
                setDeveloperInfo(response.data)
            })
        }
    }, [id])

    return <>

        <div>
            {
                DeveloperInfo && (
                    <Developer {...DeveloperInfo} />
                )
            }
        </div>
    </>
}

