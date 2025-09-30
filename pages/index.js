import SplineScene from "@/components/SplineScene";
import Head from "next/head";


export default function Home() {
  return (
    <>
      <Head>
        <title>Admin Panel</title>
        <meta name="description" content="Custom Admin panel Created by nimora" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <SplineScene />
      
    </>
  );
};
