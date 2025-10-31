'use client';

import { useCategories } from '@/redux/utils/categoryUtils';
import { getCompunterNames } from '@/services/profileService';
import { getPromptCategories } from '@/services/promptCatService';
import { getPromptList } from '@/services/promptService';
import { getContent } from '@/services/contentService';

import React, { useEffect, useState, useRef } from 'react';
import { postArticleCMC } from '@/services/cmcService';
import { postArticleSSL, signupSSLAccount } from '@/services/sslService';
import { checkCooldown } from '@/services/cooldownService';
import LogViewer from '../LogViewer/LogViewer';
import { getLogsByName } from '@/services/logService';
import { useLogManager } from '@/redux/utils/logUtitls';


const TaskManager = () => {
    const [mounted, setMounted] = useState(false);
    const [computerNames, setComputerNames] = useState([]);
    const [selectedPC, setSelectdPC] = useState('');
    const { categories, setCategories } = useCategories();
    const [promptMap, setPromptMap] = useState({});
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [intervalMinutes, setIntervalMinutes] = useState(10);
    const [isSslRunning, setIsSslRunning] = useState(false);
    const [sslIntervalId, setSslIntervalId] = useState(null);
    const [sslTitle, setSslTitle] = useState('');
    const [showSslTitleInput, setShowSslTitleInput] = useState(false);
    const [sslImage, setSslImage] = useState(null);
    const [sslImagePreview, setSslImagePreview] = useState('');
    // Replace single mainAccountTag with category-specific tags
    const [categoryTags, setCategoryTags] = useState({});
    const [cmcImage, setCmcImage] = useState(null);
    const [cmcImagePreview, setCmcImagePreview] = useState('');
    const [signupLoading, setSignupLoading] = useState(false);
    const [signupResult, setSignupResult] = useState(null);
    const [signupError, setSignupError] = useState('');
    const [isSignupRunning, setIsSignupRunning] = useState(false);
    const [signupIntervalId, setSignupIntervalId] = useState(null);
    const [signupIntervalMinutes, setSignupIntervalMinutes] = useState(30); // Default 30 minutes
    const logManager = useLogManager()
    const queryParams = new URLSearchParams(window.location.search);

    // Refs to hold latest state
    const selectedCategoriesRef = useRef([]);
    const promptMapRef = useRef({});
    const selectedPCRef = useRef();
    const currentCategoryIndexRef = useRef(0);
    const categoryTagsRef = useRef({});

    const [collapsedCategories, setCollapsedCategories] = useState(true);


    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchComputerNames();
            fetchCategories();
        }
    }, [mounted]);

    useEffect(() => {
        selectedCategoriesRef.current = selectedCategories;
    }, [selectedCategories]);

    useEffect(() => {
        promptMapRef.current = promptMap;
    }, [promptMap]);

    useEffect(() => {
        selectedPCRef.current = selectedPC;
    }, [selectedPC]);

    useEffect(() => {
        currentCategoryIndexRef.current = currentCategoryIndex;
    }, [currentCategoryIndex]);

    useEffect(() => {
        categoryTagsRef.current = categoryTags;
    }, [categoryTags]);

    useEffect(() => {
        return () => {
            if (intervalId) clearInterval(intervalId);
            if (sslIntervalId) clearInterval(sslIntervalId);
            if (signupIntervalId) clearInterval(signupIntervalId);
        };
    }, [intervalId, sslIntervalId, signupIntervalId]);

    /**
     * Update tag for a specific category
     * @param {string} category - The category name
     * @param {string} tag - The tag value to set
     */
    const updateCategoryTag = (category, tag) => {
        setCategoryTags(prev => ({
            ...prev,
            [category]: tag
        }));
    };

    const handleSignupSSLAccount = async () => {
        setSignupLoading(true);
        setSignupError('');
        setSignupResult(null);

        try {
            const payload = {};
            if (selectedPC) {
                payload.profileName = `${selectedPC}-ssl-${Date.now()}`;
            }
            const result = await signupSSLAccount(payload);
            setSignupResult(result);
        } catch (err) {
            const message = err?.response?.data?.error || err.message || 'Failed to create SSL account';
            setSignupError(message);
        } finally {
            setSignupLoading(false);
        }
    };

    const fetchComputerNames = async () => {
        try {
            const data = await getCompunterNames();
            setComputerNames(data);
        } catch (err) {
            console.error('Failed to load computer names');
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await getPromptCategories(queryParams.get('owner'));
            setCategories(data);
        } catch (err) {
            console.error('Failed to load categories');
        }
    };

    const fetchPromptsForCategory = async (category) => {
        try {
            const prompts = await getPromptList(category, selectedPC);
            setPromptMap((prev) => ({ ...prev, [category]: prompts }));
        } catch (err) {
            console.error(`Failed to fetch prompts for ${category}`);
        }
    };

    const handleCategoryToggle = async (category) => {
        const alreadySelected = selectedCategories.includes(category);
        if (alreadySelected) {
            setSelectedCategories((prev) => prev.filter((c) => c !== category));
            setPromptMap((prev) => {
                const newMap = { ...prev };
                delete newMap[category];
                return newMap;
            });
        } else {
            setSelectedCategories((prev) => [...prev, category]);
            await fetchPromptsForCategory(category);
        }
    };

    const handlePost = async () => {
        const selected = selectedCategoriesRef.current;
        const map = promptMapRef.current;
        const pc = selectedPCRef.current;
        const idx = currentCategoryIndexRef.current;

        if (!pc || selected.length === 0) return;

        if (idx >= selected.length) {
            const nextIdx = (idx + 1) % selected.length;
            currentCategoryIndexRef.current = nextIdx;
            setCurrentCategoryIndex(nextIdx);
            return;
        }

        const category = selected[idx];
        const prompts = map[category] || [];
        const inputPrompt = prompts[Math.floor(Math.random() * prompts.length)];



        const cooldown = await checkCooldown(category, pc);

        
        if (!cooldown.allowed) {
            const nextIdx = (idx + 1) % selected.length;
            currentCategoryIndexRef.current = nextIdx;
            setCurrentCategoryIndex(nextIdx);
            return;
        }

        if (inputPrompt?.name) {
            console.log(`📂 Processing category [${category}] with prompt ${inputPrompt.name}`);
            const res = await getContent(inputPrompt.name);
            const writerResponse = res?.data?.data;

            console.log("article content", writerResponse);

            // Get the tag for the current category
            const currentCategoryTag = categoryTagsRef.current[category] || '';

            await postArticleCMC({ 
                owner: pc, 
                category, 
                postContent: writerResponse, 
                mainAccountTag: currentCategoryTag,
                ...(cmcImagePreview && { imageData: cmcImagePreview })
            });

  
            const nextIdx = (idx + 1) % selected.length;
            currentCategoryIndexRef.current = nextIdx;
            setCurrentCategoryIndex(nextIdx);

            getLogsByName(logManager.selectedFile)
                  .then(data => logManager.setLogRows(data.logs))
                  .catch(console.error)
        }
    };

    const handlePostSSL = async () => {
        const selected = selectedCategoriesRef.current;
        const map = promptMapRef.current;
        const pc = selectedPCRef.current;
        const idx = currentCategoryIndexRef.current;

        if (!pc || selected.length === 0) return;

        if (idx >= selected.length) {
            const nextIdx = (idx + 1) % selected.length;
            currentCategoryIndexRef.current = nextIdx;
            setCurrentCategoryIndex(nextIdx);
            return;
        }

        const category = selected[idx];
        const prompts = map[category] || [];
        const inputPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        const cooldown = await checkCooldown(category, pc);
        
        if (!cooldown.allowed) {
            const nextIdx = (idx + 1) % selected.length;
            currentCategoryIndexRef.current = nextIdx;
            setCurrentCategoryIndex(nextIdx);
            return;
        }

        if (inputPrompt?.name) {
            console.log(`📂 Processing SSL category [${category}] with prompt ${inputPrompt.name}`);
            const res = await getContent(inputPrompt.name);
            const writerResponse = res?.data?.data;

            console.log("SSL article content", writerResponse);
            console.log("Full response from getContent:", res);

            // Check if content generation failed
            if (!writerResponse || writerResponse.trim() === '') {
                console.error("❌ Content generation failed or returned empty content");
                console.log("Response structure:", JSON.stringify(res, null, 2));
                return;
            }

            // Prepare SSL post data with title and image if provided
            const sslPostData = {
                owner: pc,
                category,
                postContent: writerResponse,
                ...(sslTitle && { title: sslTitle }),
                ...(sslImagePreview && { imageData: sslImagePreview })
            };

            console.log("SSL post data being sent:", sslPostData);
            await postArticleSSL(sslPostData);

            const nextIdx = (idx + 1) % selected.length;
            currentCategoryIndexRef.current = nextIdx;
            setCurrentCategoryIndex(nextIdx);

            getLogsByName(logManager.selectedFile)
                  .then(data => logManager.setLogRows(data.logs))
                  .catch(console.error)
        }
    };

    const handleStart = () => {
        if (isRunning || !selectedPC || selectedCategories.length === 0) return;

        handlePost()

        const id = setInterval(() => {
            handlePost();
        }, intervalMinutes * 60 * 1000);

        setIntervalId(id);
        setIsRunning(true);
    };

    const handleStop = () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
        setIntervalId(null);
        setIsRunning(false);
    };

    const handleStartSSL = () => {
        if (isSslRunning || !selectedPC || selectedCategories.length === 0) return;

        handlePostSSL();

        const id = setInterval(() => {
            handlePostSSL();
        }, intervalMinutes * 60 * 1000);

        setSslIntervalId(id);
        setIsSslRunning(true);
    };

    const handleStopSSL = () => {
        if (sslIntervalId) {
            clearInterval(sslIntervalId);
        }
        setSslIntervalId(null);
        setIsSslRunning(false);
    };

    const handleStartSignup = () => {
        if (isSignupRunning || !selectedPC) return;

        // Create first account immediately
        handleSignupSSLAccount();

        // Set up interval for creating accounts
        const id = setInterval(() => {
            handleSignupSSLAccount();
        }, signupIntervalMinutes * 60 * 1000);

        setSignupIntervalId(id);
        setIsSignupRunning(true);
    };

    const handleStopSignup = () => {
        if (signupIntervalId) {
            clearInterval(signupIntervalId);
        }
        setSignupIntervalId(null);
        setIsSignupRunning(false);
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSslImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setSslImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSslImage(null);
        setSslImagePreview('');
    };

    const handleCmcImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setCmcImage(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setCmcImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeCmcImage = () => {
        setCmcImage(null);
        setCmcImagePreview('');
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
                    <h3>Categories</h3>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {categories.map((cat) => (
                        <div
                            key={cat.id}
                            style={{ width: '10%', marginBottom: 8, display: 'flex', alignItems: 'center' }}
                        >
                            <label>
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat.name)}
                                onChange={() => handleCategoryToggle(cat.name)}
                                style={{ marginRight: 6 }}
                            />
                            {cat.name}
                            </label>
                        </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 10 , }}>
                        <strong>Selected Categories:</strong>
                        <ul style={{ marginTop: 8 , }} >
                            {selectedCategories.map((cat, index) => (
                            <li
                                key={cat}
                                style={{
                                fontWeight: index === currentCategoryIndex ? 'bold' : 'normal',
                                color: index === currentCategoryIndex ? '#fa541c' : '#333',
                                backgroundColor: index === currentCategoryIndex ? '#fff2e8' : 'transparent',
                                padding: '4px 8px',
                                borderRadius: 4,
                                }}
                            >
                                {index === currentCategoryIndex ? '▶ ' : ''}
                                {cat}
                            </li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ marginTop: 20, }} >

                        <h4 onClick={() => setCollapsedCategories((prev) => !prev)}>Selected Prompts by Category</h4>
                        <div style={{ marginTop: 20, display: collapsedCategories ? "block" : "none"   }} > 
                            {selectedCategories.map((cat) => (
                            <div key={cat} style={{ marginBottom: 10 }}>
                                <strong>{cat}</strong>
                                <ul>
                                {(promptMap[cat] || []).map((p) => (
                                    <li key={p.id}>{p.name}</li>
                                ))}
                                </ul>
                            </div>
                            ))}
                        </div>

                    </div>
                    <div style={{ marginTop: 20 }}>
                        <button onClick={handlePost} style={{ marginRight: 10 }}> DO POST CMC</button>
                        
                        <button 
                            onClick={() => setShowSslTitleInput(!showSslTitleInput)}
                            style={{ 
                                marginRight: 10, 
                                backgroundColor: showSslTitleInput ? '#1890ff' : '#52c41a',
                                color: 'white'
                            }}
                        >
                            {showSslTitleInput ? 'Hide SSL Title Input' : 'Show SSL Title Input'}
                        </button>
                        
                        <button 
                            onClick={handlePostSSL}
                            style={{ 
                                backgroundColor: '#fa8c16',
                                color: 'white'
                            }}
                        >
                            DO POST SSL
                        </button>
                    </div>

                    <div style={{ marginTop: 15, padding: 15, border: '1px solid #d9d9d9', borderRadius: 6, backgroundColor: '#fafafa' }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                            Category Tags (for CMC posts):
                        </label>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#666', marginBottom: 15 }}>
                            Set specific tags for each selected category. Tags will be added before the main content in CMC posts.
                        </div>
                        
                        {/* Category-specific tag inputs - only show for selected categories */}
                        {selectedCategories.map(category => (
                            <div key={category} style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: '#333' }}>
                                    {category}:
                                </label>
                                <input
                                    type="text"
                                    value={categoryTags[category] || ''}
                                    onChange={(e) => updateCategoryTag(category, e.target.value)}
                                    placeholder={`Enter tag for ${category} (e.g., @${category}_)`}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: 4,
                                        fontSize: 14
                                    }}
                                />
                            </div>
                        ))}
                        
                        <div style={{ marginTop: 20 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                                CMC Post Image (optional):
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleCmcImageUpload}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: 4,
                                    fontSize: 14
                                }}
                            />
                            {cmcImagePreview && (
                                <div style={{ marginTop: 10 }}>
                                    <img 
                                        src={cmcImagePreview} 
                                        alt="Preview" 
                                        style={{ 
                                            maxWidth: '200px', 
                                            maxHeight: '200px', 
                                            border: '1px solid #d9d9d9',
                                            borderRadius: 4
                                        }} 
                                    />
                                    <button 
                                        onClick={removeCmcImage}
                                        style={{ 
                                            marginLeft: 10, 
                                            padding: '4px 8px', 
                                            backgroundColor: '#ff4d4f', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: 4,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {showSslTitleInput && (
                        <div style={{ marginTop: 15, padding: 15, border: '1px solid #d9d9d9', borderRadius: 6, backgroundColor: '#fafafa' }}>
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                                SSL Post Title (optional):
                            </label>
                            <input
                                type="text"
                                value={sslTitle}
                                onChange={(e) => setSslTitle(e.target.value)}
                                placeholder="Enter title for SSL post (e.g., Haccercoin.com)"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: 4,
                                    fontSize: 14
                                }}
                            />
                            <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                                Format: "CATEGORY | TITLE" (e.g., "ICO | Haccercoin.com")
                            </div>
                            
                            <div style={{ marginTop: 20 }}>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                                    SSL Post Image (optional):
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: 4,
                                        fontSize: 14
                                    }}
                                />
                                {sslImagePreview && (
                                    <div style={{ marginTop: 10 }}>
                                        <img 
                                            src={sslImagePreview} 
                                            alt="Preview" 
                                            style={{ 
                                                maxWidth: '200px', 
                                                maxHeight: '200px', 
                                                border: '1px solid #d9d9d9',
                                                borderRadius: 4
                                            }} 
                                        />
                                        <button 
                                            onClick={removeImage}
                                            style={{ 
                                                marginLeft: 10, 
                                                padding: '4px 8px', 
                                                backgroundColor: '#ff4d4f', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: 4,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div style={{ marginTop: 30 }}>
                        <label>Interval (minutes):</label>
                        <select
                            value={intervalMinutes}
                            onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                            style={{ marginLeft: 10 }}
                        >
                            {[1, 3, 5, 10, 15, 20, 30, 60,90,120].map((min) => (
                                <option key={min} value={min}>
                                    {min} min
                                </option>
                            ))}
                        </select>

                        <div style={{ marginTop: 15 }}>
                            <strong>CMC Scheduler</strong>
                            <button
                                style={{ marginLeft: 20, backgroundColor: isRunning ? '#faad14' : '#52c41a' }}
                                onClick={handleStart}
                                disabled={isRunning}
                            >
                                {isRunning ? 'Running...' : 'Start Job'}
                            </button>

                            <button
                                style={{ marginLeft: 10, backgroundColor: '#f5222d', color: '#fff' }}
                                onClick={handleStop}
                                disabled={!isRunning}
                            >
                                Stop Job
                            </button>
                        </div>

                        <div style={{ marginTop: 15 }}>
                            <strong>SSL Scheduler</strong>
                            <button
                                style={{ marginLeft: 20, backgroundColor: isSslRunning ? '#faad14' : '#1890ff', color: '#fff' }}
                                onClick={handleStartSSL}
                                disabled={isSslRunning}
                            >
                                {isSslRunning ? 'Running...' : 'Start SSL Job'}
                            </button>

                            <button
                                style={{ marginLeft: 10, backgroundColor: '#f5222d', color: '#fff' }}
                                onClick={handleStopSSL}
                                disabled={!isSslRunning}
                            >
                                Stop SSL Job
                            </button>
                        </div>

                        <div style={{ marginTop: 20 }}>
                            <strong>SSL Account Provisioning</strong>
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {/* Manual account creation */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <button
                                        onClick={handleSignupSSLAccount}
                                        disabled={signupLoading || isSignupRunning}
                                        style={{
                                            padding: '6px 14px',
                                            backgroundColor: signupLoading ? '#faad14' : '#722ed1',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 4,
                                            cursor: (signupLoading || isSignupRunning) ? 'not-allowed' : 'pointer',
                                            opacity: isSignupRunning ? 0.5 : 1
                                        }}
                                    >
                                        {signupLoading ? 'Creating account…' : 'Create SSL Account'}
                                    </button>
                                    {signupResult?.email && (
                                        <span style={{ color: '#389e0d', fontSize: 12 }}>
                                            Created: {signupResult.email} (pwd: {signupResult.password})
                                        </span>
                                    )}
                                    {signupError && (
                                        <span style={{ color: '#f5222d', fontSize: 12 }}>
                                            Error: {signupError}
                                        </span>
                                    )}
                                </div>

                                {/* Automatic account creation scheduler */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                                    <label style={{ fontSize: 14 }}>
                                        Auto-create interval (minutes):
                                        <input
                                            type="number"
                                            value={signupIntervalMinutes}
                                            onChange={(e) => setSignupIntervalMinutes(Number(e.target.value))}
                                            disabled={isSignupRunning}
                                            min="5"
                                            max="1440"
                                            style={{
                                                marginLeft: 8,
                                                padding: '4px 8px',
                                                width: 80,
                                                border: '1px solid #d9d9d9',
                                                borderRadius: 4
                                            }}
                                        />
                                    </label>
                                    <button
                                        onClick={handleStartSignup}
                                        disabled={isSignupRunning || !selectedPC}
                                        style={{
                                            padding: '6px 14px',
                                            backgroundColor: isSignupRunning ? '#52c41a' : '#1890ff',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 4,
                                            cursor: (isSignupRunning || !selectedPC) ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {isSignupRunning ? 'Running...' : 'Start Auto-Create'}
                                    </button>
                                    <button
                                        onClick={handleStopSignup}
                                        disabled={!isSignupRunning}
                                        style={{
                                            padding: '6px 14px',
                                            backgroundColor: '#f5222d',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: 4,
                                            cursor: !isSignupRunning ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Stop Auto-Create
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <LogViewer/>
                </div>
            )}


        </div>
    );
};

export default TaskManager;
