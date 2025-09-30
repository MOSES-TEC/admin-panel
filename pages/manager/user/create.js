

import dynamic from "next/dynamic";
  const User = dynamic(() => import("@/components/User"), { ssr: false });

  export default function create() {

  return <>

    <div>
      <User />
    </div>
  </>
}
  