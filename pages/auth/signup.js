import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaLaptopCode } from "react-icons/fa";


export default function signup() {

    const { status } = useSession();

    const [ firstname, setFirstname ] = useState('');
    const [ lastname, setLastname ] = useState('');
    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ confirmPassword, setConfirmPassword ] = useState('');

    const [ error, setError ] = useState('');

    const [ isLoading, setIsLoading ] = useState(false);
    const [ showPopup, setShowPopup ] = useState(false);

    // for existing user then it will show popup
    const [ hasExistingUsers, setHasExistingUsers ] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if(status === "authenticated") {
            router.push('/');
        }
    }, [status, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
    

        if(hasExistingUsers) {
            setShowPopup(true);
            setIsLoading(false);
            return;
        }

        if(password !== confirmPassword) {
            setError('Password do not match');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'signup',
                    firstname, 
                    lastname, 
                    email, password,
                    role: 'superadmin', // by default first user will be superadmin
                })
            });

            const data = await response.json();

            if(response.status === 403) {
                setShowPopup(true);
                setHasExistingUsers(true);
                return;
            }

            if(!response.ok) {
                throw new Error(data.message || "Registration Failed");
            }

            // create user model automatic when signup (req for database setup)
            const userModelResponse = await fetch('/api/models', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `Bearer ${data.token}`
                },
                body: JSON.stringify({
                    modelType: 'user',
                    data: {
                        id: data.user.id,
                        firstname,
                        lastname,
                        email,
                        password: '********', // include password field but don't sent actual password
                        userRole: 'superadmin',
                    }
                })
            });

            const userModelData = await userModelResponse.json();

            if(!userModelResponse.ok) {
                console.error("Failed to create user model:", userModelData);
                // continue with login flow even if model creation fails
                // the model can be created later if needed
            } else {
                console.log("User model created successfully");
            }

            localStorage.setItem('token', data.json);
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/auth/signin');

        } catch (error) {
            setError(error.message || "Registration failed. Please try again!");
            setHasExistingUsers(true);
            setShowPopup(true);

        } finally {
            setIsLoading(false);
        }
    };

    return <>

        <div className="auth_container">
            {/* decorative elements */}
            <div className="auth_decor_left"></div>
            <div className="auth_decor_circle1"></div>
            <div className="auth_decor_circle2"></div>

            {/* popup */}
            {showPopup && (
                <div className="auth_popup_overlay">
                    <div className="auth_popup">
                        <div className="auth_popup_bar"></div>
                        <div className="auth_popup_content">
                            <div className="auth_popup_icon">
                                <FaLaptopCode className="auth_popup_icon_inner" />
                            </div>
                            <h3 className="auth_popup_title">Admin Acess Required.</h3>
                            <p className="auth_popup_desc">
                                This is an Admin panel and user registration is restricted. 
                                Please contact the system administrator for access. 
                            </p>
                            <button onClick={() => router.push('/auth/signin')} className="auth_popup_button">Sign in</button>
                        </div>
                    </div>
                </div>
            )}
            

            {/* Main SignUp form */}
            {!hasExistingUsers && (
                <div className="auth_form_wrapper">
                    <div className="auth_form_header">
                        <h2 className="auth_form_title">Create Account</h2>
                        <p className="auth_form_subtitle">
                            Already have an account? {' '}
                            <Link href='/auth/signin' className="auth_form_link">Sign in</Link>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && <div className="auth_error">{error}</div>}

                        <div className="auth_name_fields">
                            <div className="auth_input_group">
                                <label htmlFor="firstname" className="auth_label">First name</label>
                                <input id="firstname" type="text" name="firstname" required className="auth_input" placeholder="Nimora" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
                            </div>
                            <div className="auth_input_group">
                                <label htmlFor="lastname" className="auth_label">Last name</label>
                                <input id="lastname" type="text" name="lastname" required className="auth_input" placeholder="Verse" value={lastname} onChange={(e) => setLastname(e.target.value)} />
                            </div>
                        </div>

                        <div className="auth_input_group">
                            <label htmlFor="email-address" className="auth_label">Email Address</label>
                            <input id="email-address" type="email" name="email" required className="auth_input" placeholder="nimoraverse@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="auth_input_group">
                            <label htmlFor="password" className="auth_label">Password</label>
                            <input id="password" type="password" name="password" required className="auth_input" placeholder="●●●●●●●●" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <div className="auth_input_group">
                            <label htmlFor="confirm-password" className="auth_label">Confirm password</label>
                            <input id="confirm-password" type="password" name="confirm-password" required className="auth_input" placeholder="●●●●●●●●" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>

                        <button type="submit" className={`auth_submit_button ${isLoading || hasExistingUsers ? 'auth_disabled' : ''}`} disabled={isLoading || hasExistingUsers}>
                            {isLoading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                </div>
            )}
            

        </div>

    </>
};


