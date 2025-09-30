import Link from "next/link";

export default function SettingNav({ currentPage }) {
    return (
        <div className="existing_model_list">
            <h2>{currentPage}</h2>
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
    )
}
