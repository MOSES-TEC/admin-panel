import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

{/* 
export default function SignIn() {
    return <>

    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9ff", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', position: "relative", overflow: "hidden"}}>
        // Decorative elements
        <div style={{ position: "absolute", left: "0", top: "0", height: "100%", width: "25%", background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 100%)', borderRadius: "0 100% 100% 0" }}>
            
        </div>

        // Main SignIn form
        <div style={{ maxWidth: "400px", width: "100%", padding: "0 24px" }}>
            <div style={{ marginBottom: "40px", textAlign: "center" }}>
                <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1F2937", margin: "0 0 8px 0" }}>
                    Welcome Back
                </h2>
                <p style={{ fontSize: "15px", color: "#6B7280", margin: "0"}}>
                    Don't have an account? {''}
                    <Link href="/auth/signup" style={{ color: "#6366f1", fontWeight: "500", textDecoration: "none" }}>
                        Create account 
                    </Link>
                </p>
            </div>

            <form>
                <div style={{ marginBottom: "24px" }}>
                    <label htmlFor="email" style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#374151", marginBottom: "6px" }}>
                        Email Address
                    </label>
                    <input type="text" />
                </div>
            </form>

        </div>

    </div>
    
    </>
}; 

*/}

export default function signin() {

    const { status } = useSession();
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const [ error, setError ] = useState('');
    const [ loading, setLoading ] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if(status === "authenticated") {
            router.push('/');
        }
    }, [status, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const email = emailRef.current.value;
        const password = passwordRef.current.value;

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email, password
            });

            if(result.error) {
                setError(result.error);
            } else {
                router.push('/');
            }

        } catch (error) {
            setError("An error occurred during sign in");
        } finally {
            setLoading(false);
        }
    };

    return <>

        <div className="signin-container">
            <div className="decor-left"></div>
            <div className="decor-circle-purple"></div>
            <div className="decor-circle-indigo"></div>

            <div className="signin-form-wrapper">
                <div className="signin-heading">
                    <h2>Welcome Back</h2>
                    <p>
                        Don't have an account? {' '}
                        <Link href='/auth/signup' className="signup-link">Create account</Link>
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="signin-error">{error}</div>}

                    <div className="form-group-auth">
                        <label htmlFor="email">Email Address</label>
                        <input ref={emailRef} name="email" type="email" id="email" autoComplete="username" required className="form-input-auth" placeholder="nimoraverse@gmail.com" />
                    </div>

                    <div className="password-group">
                        <div className="label-row">
                            <label htmlFor="password">Password</label>
                        </div>
                        <input ref={passwordRef} name="password" type="password" id="password" autoComplete="current-password" required className="form-input-auth" placeholder="********" />
                    </div>

                    <button type="submit" disabled={loading} className="signin-button">
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

            </div>

        </div>

    </>
};

