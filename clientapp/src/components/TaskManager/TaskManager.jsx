'use client';

import { useCategories } from '@/redux/utils/categoryUtils';
import { getCompunterNames } from '@/services/profileService';
import { getPromptCategories } from '@/services/promptCatService';
import { getPromptList } from '@/services/promptService';
import { getContent } from '@/services/contentService';

import React, { useEffect, useState, useRef } from 'react';
import { postArticleCMC } from '@/services/cmcService';
import { postArticleSSL } from '@/services/sslService';
import { checkCooldown } from '@/services/cooldownService';
import LogViewer from '../LogViewer/LogViewer';
import { getLogsByName } from '@/services/logService';
import { useLogManager } from '@/redux/utils/logUtitls';


const TaskManager = () => {
    const [computerNames, setComputerNames] = useState([]);
    const [selectedPC, setSelectdPC] = useState();
    const { categories, setCategories } = useCategories();
    const [promptMap, setPromptMap] = useState({});
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [intervalId, setIntervalId] = useState(null);
    const [intervalMinutes, setIntervalMinutes] = useState(10);
    const [sslTitle, setSslTitle] = useState('');
    const [showSslTitleInput, setShowSslTitleInput] = useState(false);
    const [sslImage, setSslImage] = useState(null);
    const [sslImagePreview, setSslImagePreview] = useState('');
    const logManager = useLogManager()

    // Refs to hold latest state
    const selectedCategoriesRef = useRef([]);
    const promptMapRef = useRef({});
    const selectedPCRef = useRef();
    const currentCategoryIndexRef = useRef(0);

    const [collapsedCategories, setCollapsedCategories] = useState(true);


    useEffect(() => {
        fetchComputerNames();
        fetchCategories();
    }, []);

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
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [intervalId]);

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
            const data = await getPromptCategories();
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

            await postArticleCMC({ owner: pc, category, postContent: writerResponse });

  
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
        clearInterval(intervalId);
        setIntervalId(null);
        setIsRunning(false);
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
                        <label>Interval:</label>
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
                    <LogViewer/>
                </div>
            )}


        </div>
    );
};

export default TaskManager;
