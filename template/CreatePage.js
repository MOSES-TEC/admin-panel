
export const generateCreateFormCode = (modelName) => {
  const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1);
  const ModelName = capitalizeFirstLetter(modelName)

  return `

import dynamic from "next/dynamic";
  const ${ModelName} = dynamic(() => import("@/components/${ModelName}"), { ssr: false });

  export default function create() {

  return <>

    <div>
      <${ModelName} />
    </div>
  </>
}
  `
}
