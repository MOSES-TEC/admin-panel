
export const generateEditFormCode = (modelName) => {
    const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);
    const ModelName = capitalizeFirstLetter(modelName)

    return `
import axios from "axios";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const ${ModelName} = dynamic(() => import("@/components/${ModelName}"), { ssr: false });

export default function Edit${ModelName}() {


    const router = useRouter();
    const { id } = router.query;

    const [${ModelName}Info, set${ModelName}Info] = useState(null);

    useEffect(() => {
        if (!id) {
            return;
        } else {
            axios.get('/api/${modelName.toLowerCase()}?id=' + id).then(response => {
                set${ModelName}Info(response.data)
            })
        }
    }, [id])

    return <>

        <div>
            {
                ${ModelName}Info && (
                    <${ModelName} {...${ModelName}Info} />
                )
            }
        </div>
    </>
}

`
}
