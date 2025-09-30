import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { FiUser, FiMail, FiLock, FiSave, FiEdit2, FiEye, FiEyeOff } from "react-icons/fi";
import axios from 'axios';
import { toast } from "react-toastify";

export default function Profileform({
    _id,
    firstname: existingFirstname,
    lastname: existingLastname,
    email: existingEmail,
    password: existingPassword,
    avtar: existingAvtar,
    userRole: existingUserRole,
    createdAt: existingCreatedAt
}) {
    const [firstname, setFirstname] = useState(existingFirstname || '');
    const [lastname, setLastname] = useState(existingLastname || '');
    const [email, setEmail] = useState(existingEmail || '');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [avtar, setAvatar] = useState(existingAvtar || []);
    const { status } = useSession();

    if (status === 'loading') {
        return (
            <div className="flex flex-center wh_100">
                Loading...
            </div>
        );
    }
    console.log(avtar);

    async function updateProfile(ev) {
        ev.preventDefault();

        const data = {
            firstname,
            lastname,
            email,
            avtar,
            _id
        };

        // Only send the password if it was changed
        if (password.trim()) {
            data.password = password;
        }
        if (_id) {
            try {
                try{
                    await axios.put('/api/auth/profile', data);
                    toast.success('Profile Updated!');
                }catch(error){
                    if(error.response.status === 403){
                        toast.error("Permission denied to Demo User.");
                    }
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                toast.error('Failed to update profile.');
            }
        } else {
            toast.error('Profile not found.');
        }

    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="profile_page">
            <div className="existing_model_list">
                <h2>Profile</h2>
                <div className="ex_model_list_ul">
                    <ul>
                        <li><Link href='/setting/overview'>Overview</Link></li>
                        <li><Link href='/setting/apitokens'>API Tokens</Link></li>
                        <li><Link href='/setting/envdata'>Env variables</Link></li>
                        <li><Link href='/setting/permision'>Permision</Link></li>
                        <li><Link href='/setting/profile'>Profile</Link></li>
                    </ul>
                </div>
            </div>
            <div className="profile_page_content">
                <div className="profile_header">
                    <h1>Profile Settings</h1>
                    <p>Manage your account settings and preferences</p>
                </div>

                <div className="profile_container">
                    <div className="profile_avatar_section">
                        <div className="avatar_wrapper">
                            <img
                                src={avtar.length > 0 ? avtar[0] : '/img/logo.png'}
                                alt={`${firstname} ${lastname}`}
                                className="profile_avatar"
                            />
                        </div>
                        <div className="profile_info">
                            <h2>{`${firstname} ${lastname}`}</h2>
                            <p className="role_badge">{existingUserRole}</p>
                            <p className="join_date">Joined {new Date(existingCreatedAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <form className="profile_form" onSubmit={updateProfile}>
                        <div className="form_group">
                            <label htmlFor="firstname">
                                <FiUser /> First Name
                            </label>
                            <input
                                type="text"
                                id="firstname"
                                value={firstname}
                                onChange={ev => setFirstname(ev.target.value)}
                            />
                        </div>

                        <div className="form_group">
                            <label htmlFor="lastname">
                                <FiUser /> Last Name
                            </label>
                            <input
                                type="text"
                                id="lastname"
                                value={lastname}
                                onChange={ev => setLastname(ev.target.value)}
                            />
                        </div>

                        <div className="form_group">
                            <label htmlFor="email">
                                <FiMail /> Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={ev => setEmail(ev.target.value)}
                            />
                        </div>

                        <div className="form_group">
                            <label htmlFor="password">
                                <FiLock /> Password
                            </label>
                            <div className="password_input_wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={ev => setPassword(ev.target.value)}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="password_toggle"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <div className="form_actions">
                            <button type="submit" className="save_btn">
                                <FiSave /> Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}