'use client';

import { useCategories } from '@/redux/utils/categoryUtils';
import { getCompunterNames } from '@/services/profileService';
import { getPromptCategories } from '@/services/promptCatService';
import { getPromptList } from '@/services/promptService';
import { getContent } from '@/services/contentService';

import React, { useEffect, useState, useRef } from 'react';
import { postArticleCMC } from '@/services/cmcService';
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
    const logManager = useLogManager()

    // Refs to hold latest state
    const selectedCategoriesRef = useRef([]);
    const promptMapRef = useRef({});
    const selectedPCRef = useRef();
    const currentCategoryIndexRef = useRef(0);

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
            const prompts = await getPromptList(category);
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

        const cooldown = await checkCooldown('doPostArticleCMC');
        if (!cooldown.allowed) {
            return;
        }

        const category = selected[idx];
        const prompts = map[category] || [];
        const inputPrompt = prompts[Math.floor(Math.random() * prompts.length)];

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

                    <div style={{ marginTop: 10 }}>
                        <strong>Selected Categories:</strong>
                        <ul style={{ marginTop: 8 }}>
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

                    <div style={{ marginTop: 20 }}>
                        <h4>Selected Prompts by Category</h4>
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
                    <div>
                        <button onClick={handlePost}> DO POST CMC</button>

                    </div>
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
