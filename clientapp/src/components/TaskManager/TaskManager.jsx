'use client';

import { useCategories } from '@/redux/utils/categoryUtils';
import { getCompunterNames } from '@/services/profileService';
import { getPromptCategories } from '@/services/promptCatService';
import { getPromptList } from '@/services/promptService';
import { getContent } from '@/services/contentService';

import React, { useEffect, useState } from 'react';
import { postArticleCMC } from '@/services/cmcService';

const TaskManager = () => {
    const [computerNames, setComputerNames] = useState([]);
    const [selectedPC, setSelectdPC] = useState();
    const {categories, setCategories } = useCategories()
    const [promptMap, setPromptMap] = useState({}); // category -> prompt list
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);


    useEffect(() => {
        fetchComputerNames();
        fetchCategories()
    }, []);

    const fetchComputerNames = async () => {
        try {
            const data = await getCompunterNames()
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
            // Remove category from state and map
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

    const handlePost = async () =>{
        if (currentCategoryIndex >= selectedCategories.length) {
            setCurrentCategoryIndex((prev) => (prev + 1)%selectedCategories.length);
            return;
        }
        const category = selectedCategories[currentCategoryIndex];
        const prompts = promptMap[category] || [];
        const inputPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        if(inputPrompt?.name){

            console.log(`📂 Processing category [${category}] with promt ${inputPrompt?.name} `);
            const res = await getContent(inputPrompt?.name);
            const writerResponse = await res?.data?.data;
            



            console.log("article content", writerResponse)

            await postArticleCMC({
                owner: selectedPC,
                category , 
                postContent: writerResponse
            })

        }
        setCurrentCategoryIndex((prev) => (prev + 1)%selectedCategories.length);
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
                </div>
            )}


        </div>
    );
};

export default TaskManager;
