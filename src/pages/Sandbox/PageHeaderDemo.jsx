import React, { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import MainContainer from "@/components/layout/MainContainer";
import { TextInput } from "@/components/molecules/text-input";
import { Eye } from "lucide-react";

export default function PageHeaderDemo() {
  const [searchValue, setSearchValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [errorValue, setErrorValue] = useState("");

  return (
    <>
      <PageHeader
        appHeaderTitle="Example app header title"
        subheadText="example subhead text"
        actionBarText="Example action bar text"
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onAction={() => console.log("Action clicked")}
      />
      <MainContainer>
        <CardWrapper>
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">PageHeader Component Demo</h2>
            <p className="mb-4">
              This is a demo page for the PageHeader component. The header above demonstrates all the features of the component.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">Features:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Back button navigation</li>
                  <li>Title and subtitle</li>
                  <li>Action bar with icon</li>
                  <li>Search functionality</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-2">Props:</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>showActionBar (boolean)</li>
                  <li>showActionIcon (boolean)</li>
                  <li>showBackButton (boolean)</li>
                  <li>appHeaderTitle (string)</li>
                  <li>actionBarText (string)</li>
                  <li>search (boolean)</li>
                  <li>subhead (boolean)</li>
                  <li>subheadText (string)</li>
                  <li>onBack (function)</li>
                  <li>onAction (function)</li>
                  <li>searchValue (string)</li>
                  <li>onSearchChange (function)</li>
                  <li>searchPlaceholder (string)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardWrapper>

        {/* TextInput Demo Section */}
        <CardWrapper className="mt-6">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">TextInput Component Demo</h2>
            <p className="mb-4">
              This section demonstrates all variants of the TextInput component.
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-2">Default State:</h3>
                <TextInput 
                  placeholder="Enter your email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                />
              </div>

              <div>
                <h3 className="font-bold mb-2">With Icon (Password):</h3>
                <TextInput 
                  type="password"
                  placeholder="Enter your password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  icon={<Eye className="size-6 text-neutral-300" />}
                />
              </div>

              <div>
                <h3 className="font-bold mb-2">Error State:</h3>
                <TextInput 
                  placeholder="Enter your email"
                  value={errorValue}
                  onChange={(e) => setErrorValue(e.target.value)}
                  error="Please enter a valid email address"
                />
              </div>

              <div>
                <h3 className="font-bold mb-2">Disabled State:</h3>
                <TextInput 
                  placeholder="Disabled input"
                  disabled
                />
              </div>
            </div>
          </div>
        </CardWrapper>
      </MainContainer>
    </>
  );
} 