import React, { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import MainContainer from "@/components/layout/MainContainer";

export default function PageHeaderDemo() {
  const [searchValue, setSearchValue] = useState("");

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
      </MainContainer>
    </>
  );
} 