import Aside from "@/components/Aside";
import CheckingSession from "@/components/CheckingSession";
import { RestartProvider } from "@/context/RestartContext";
import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import { useRouter } from "next/router";
import { Bounce, ToastContainer } from "react-toastify";


export default function App({ Component, pageProps: { session, ...pageProps } }) {

  const router = useRouter();

  // determine if the current page is 'login' or any other page where you don't want the container
  const isAuthPage = ['/auth/signin', '/auth/signup'].includes(router.pathname);

  const isContainerNeeded = !isAuthPage;

  return <>

    <SessionProvider session={session}>
      <RestartProvider>

        <Aside />

        <main className={isContainerNeeded ? "container" : "container close"}>
          <CheckingSession enabled={!isAuthPage}>
            <Component {...pageProps} session={session} />
          </CheckingSession>
        </main>

      </RestartProvider>

    </SessionProvider>

    <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick={false}
      rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" transition={Bounce} />
  
  </>
}
