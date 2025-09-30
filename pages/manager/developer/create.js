

import dynamic from "next/dynamic";
  const Developer = dynamic(() => import("@/components/Developer"), { ssr: false });

  export default function create() {

  return <>

    <div>
      <Developer />
    </div>
  </>
}
  