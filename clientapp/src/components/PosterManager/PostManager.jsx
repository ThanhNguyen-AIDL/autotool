'use client';

import { useCategories } from '@/redux/utils/categoryUtils';
import { getCompunterNames, getMainList, launchProfileByEmail } from '@/services/profileService';
import { getPromptCategories } from '@/services/promptCatService';
import { getPromptList } from '@/services/promptService';
import { getContent } from '@/services/contentService';

import React, { useEffect, useState, useRef } from 'react';
import styles from './PostManager.module.css';

const PostManager = () => {
    const [mounted, setMounted] = useState(false);
    const [computerNames, setComputerNames] = useState([]);
    const [selectedPC, setSelectdPC] = useState('');
    const [profiles, setProfiles] = useState([]);

    // Refs to hold latest state

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchComputerNames();
        }
    }, [mounted]);

    useEffect(() => {
        fetchMainAccts();
    }, [selectedPC]);

    const fetchComputerNames = async () => {
        try {
            const data = await getCompunterNames();
            setComputerNames(data);
        } catch (err) {
            console.error('Failed to load computer names');
        }
    };

    const fetchMainAccts = async () => {
        try {
            
            if(selectedPC){
                const data = await getMainList(selectedPC);
                
                setProfiles(data);
            }
        } catch (err) {
            console.error('Failed to load computer names');
        }
    };

    const handleLaunch = async (name, url) => {
        await launchProfileByEmail(name, url);
      };
    

    if (!mounted) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div style={{ marginTop: 20 }}>
                <label>Computer Names: </label>
                <select value={selectedPC} onChange={(e) => setSelectdPC(e.target.value)}>
                    <option value="">All</option>
                    {computerNames.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>
            {selectedPC && (
                <div style={{ marginTop: 20 }}>
                    <h1>Main Accounts</h1>

                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th >Computer Name</th>
                                <th >Domain</th>
                                <th >Email</th>
                                <th >Is Created</th>
                                <th >Is Main</th>
                                <th >Is Verified</th>
                                <th >Last Action</th>
                                <th >Last Training</th>
                                <th >SSL Verified</th>
                                <th >SSL Last Action</th>
                                <th >Verify Count</th>
                                <th className={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles?.map((item, idx) => (
                                <tr key={idx}>
                                    <td >{item.computername}</td>
                                    <td >{item.domain}</td>
                                    <td >{item.email}</td>
                                    <td >{String(item.iscreated)}</td>
                                    <td >{String(item.ismain)}</td>
                                    <td >{String(item.isverified)}</td>
                                    <td >{item.lastaction}</td>
                                    <td >{item.lasttraining ?? ""}</td>
                                    <td >{String(item.sslIsverified)}</td>
                                    <td >{item.sslLastaction}</td>
                                    <td >{item.verifycount}</td>
                                    <td className={styles.td}>
                                        <button onClick={() => handleLaunch(item?.email, "https://coinmarketcap.com")}>Launch CMC</button>

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}


        </div>
    );
};

export default PostManager;
