import React, { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Toggle } from '@/components/atoms/toggle';

const DemoPage = () => {
    const [showAddButton, setShowAddButton] = useState(false);
    const [addButtonText, setAddButtonText] = useState("Add program");
    const [pageNameEditable, setPageNameEditable] = useState(false);
    const [showDeleteOption, setShowDeleteOption] = useState(false);
    const [showBackButton, setShowBackButton] = useState(true);
    const [appHeaderTitle, setAppHeaderTitle] = useState("Demo Page");
    const [search, setSearch] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [searchPlaceholder, setSearchPlaceholder] = useState("Search...");
    const [pageContext, setPageContext] = useState("default");

    const pageContextOptions = ["default", "programs", "history", "workout", "workoutDetail", "programBuilder"];

    const handleTitleChange = (newTitle) => {
        setAppHeaderTitle(newTitle);
        alert(`Title changed to: ${newTitle}`);
    };

    const handleDelete = () => {
        alert(`Delete ${pageContext} action triggered!`);
    };

    return (
        <div>
            <PageHeader
                showAddButton={showAddButton}
                addButtonText={addButtonText}
                pageNameEditable={pageNameEditable}
                showBackButton={showBackButton}
                appHeaderTitle={appHeaderTitle}
                search={search}
                onBack={() => alert("Back button clicked!")}
                onAction={() => alert("Action button clicked!")}
                onTitleChange={handleTitleChange}
                onDelete={handleDelete}
                showDeleteOption={showDeleteOption}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder={searchPlaceholder}
                sidebarWidth={0} // Set to 0 for demo page to be full width
                pageContext={pageContext}
            />
            <div className="p-4 mt-20">
                <h2 className="text-xl font-bold mb-4">PageHeader Controls</h2>
                <div className="space-y-4 max-w-sm">
                    <div className="flex items-center space-x-2">
                        <Toggle id="showAddButton" pressed={showAddButton} onPressedChange={setShowAddButton} aria-label="Toggle add button"/>
                        <Label htmlFor="showAddButton">Show Add Button</Label>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="addButtonText">Add Button Text</Label>
                        <Input id="addButtonText" type="text" value={addButtonText} onChange={(e) => setAddButtonText(e.target.value)} disabled={!showAddButton} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Toggle id="pageNameEditable" pressed={pageNameEditable} onPressedChange={setPageNameEditable} aria-label="Toggle page name editable"/>
                        <Label htmlFor="pageNameEditable">Page Name Editable</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Toggle id="showDeleteOption" pressed={showDeleteOption} onPressedChange={setShowDeleteOption} aria-label="Toggle delete option"/>
                        <Label htmlFor="showDeleteOption">Show Delete Option</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Toggle id="showBackButton" pressed={showBackButton} onPressedChange={setShowBackButton} aria-label="Toggle back button"/>
                        <Label htmlFor="showBackButton">Show Back Button</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Toggle id="search" pressed={search} onPressedChange={setSearch} aria-label="Toggle search"/>
                        <Label htmlFor="search">Enable Search</Label>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="appHeaderTitle">Header Title</Label>
                        <Input id="appHeaderTitle" type="text" value={appHeaderTitle} onChange={(e) => setAppHeaderTitle(e.target.value)} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="searchValue">Search Value</Label>
                        <Input id="searchValue" type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} disabled={!search} />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="searchPlaceholder">Search Placeholder</Label>
                        <Input id="searchPlaceholder" type="text" value={searchPlaceholder} onChange={(e) => setSearchPlaceholder(e.target.value)} disabled={!search}/>
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="pageContext">Page Context</Label>
                        <select
                            id="pageContext"
                            value={pageContext}
                            onChange={(e) => setPageContext(e.target.value)}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {pageContextOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoPage; 