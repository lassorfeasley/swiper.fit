import React, { useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import CardWrapper from '../../components/common/CardsAndTiles/Cards/CardWrapper';
import MainContainer from "@/components/common/MainContainer";

const Switch = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <span className="text-sm">{label}</span>
    <span className="relative inline-block w-10 h-6">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="opacity-0 w-0 h-0 peer"
      />
      <span
        className="absolute left-0 top-0 h-6 w-10 rounded-full bg-gray-300 peer-checked:bg-[var(--Black)] transition-colors duration-200"
      ></span>
      <span
        className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow peer-checked:translate-x-4 transition-transform duration-200"
      ></span>
    </span>
  </label>
);

const AppHeaderDemo = () => {
  const [showActionBar, setShowActionBar] = useState(true);
  const [showActionIcon, setShowActionIcon] = useState(true);
  const [showBackButton, setShowBackButton] = useState(true);
  const [subhead, setSubhead] = useState(true);
  const [search, setSearch] = useState(true);

  return (
    <>
      <AppHeader
        appHeaderTitle="Example app header title"
        subheadText="example subhead text"
        actionBarText="Example action bar text"
        showActionBar={showActionBar}
        showActionIcon={showActionIcon}
        showBackButton={showBackButton}
        subhead={subhead}
        search={search}
      />
      <CardWrapper>
        <div className="flex flex-wrap gap-4 p-4 w-full max-w-[430px] mt-8">
          <Switch checked={showActionBar} onChange={() => setShowActionBar(v => !v)} label="showActionBar" />
          <Switch checked={showActionIcon} onChange={() => setShowActionIcon(v => !v)} label="showActionIcon" />
          <Switch checked={showBackButton} onChange={() => setShowBackButton(v => !v)} label="showBackButton" />
          <Switch checked={subhead} onChange={() => setSubhead(v => !v)} label="subhead" />
          <Switch checked={search} onChange={() => setSearch(v => !v)} label="search" />
        </div>
      </CardWrapper>
    </>
  );
};

export default AppHeaderDemo; 