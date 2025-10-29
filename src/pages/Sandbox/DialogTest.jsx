import React, { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/shadcn/dialog";
import SwiperDialog from "@/components/shared/SwiperDialog";
import { SwiperButton } from "@/components/shared/SwiperButton";
import { ActionCard } from "@/components/shared/ActionCard";
import { Square, Plus } from "lucide-react";

export default function DialogTest() {
  const [openControlled, setOpenControlled] = useState(false);
  const [longContent, setLongContent] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const [openSwiper, setOpenSwiper] = useState(false);
  const [size, setSize] = useState("md");
  const [align, setAlign] = useState("center");
  const [closeOnOverlayClick, setCloseOnOverlayClick] = useState(true);

  return (
    <AppLayout title="Dialog Component Test" showSidebar>
      <div className="px-6 pt-6 max-w-2xl">
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Options</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={longContent}
                onChange={(e) => setLongContent(e.target.checked)}
              />
              Long content
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showFooter}
                onChange={(e) => setShowFooter(e.target.checked)}
              />
              Show footer
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={closeOnOverlayClick}
                onChange={(e) => setCloseOnOverlayClick(e.target.checked)}
              />
              Close on overlay click
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span>Size</span>
              <select className="border rounded px-2 py-1" value={size} onChange={(e) => setSize(e.target.value)}>
                <option value="sm">sm</option>
                <option value="md">md</option>
                <option value="lg">lg</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span>Align</span>
              <select className="border rounded px-2 py-1" value={align} onChange={(e) => setAlign(e.target.value)}>
                <option value="center">center</option>
                <option value="top">top</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">Uncontrolled (trigger)</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Uncontrolled Dialog</DialogTitle>
                  <DialogDescription>
                    Use this to quickly test default behavior.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 text-sm text-slate-700">
                  {longContent ? (
                    <div className="max-h-64 overflow-auto space-y-2">
                      {Array.from({ length: 40 }).map((_, i) => (
                        <p key={i}>Line {i + 1}: Sample content for scrolling.</p>
                      ))}
                    </div>
                  ) : (
                    <p>Short content inside the dialog.</p>
                  )}
                </div>
                {showFooter && (
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">Close</Button>
                    </DialogClose>
                    <Button onClick={() => alert("Confirmed")}>Confirm</Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium mb-3">Controlled (open/onOpenChange)</h3>
            <div className="flex gap-2 mb-3">
              <Button onClick={() => setOpenControlled(true)}>Open</Button>
              <Button variant="outline" onClick={() => setOpenControlled(false)}>
                Close
              </Button>
            </div>
            <Dialog open={openControlled} onOpenChange={setOpenControlled}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Controlled Dialog</DialogTitle>
                  <DialogDescription>
                    Manage open state externally to test callbacks.
                  </DialogDescription>
                </DialogHeader>
                <div className="text-sm text-slate-700">
                  {longContent ? (
                    <div className="max-h-64 overflow-auto space-y-2">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <p key={i}>Row {i + 1}: Data row preview.</p>
                      ))}
                    </div>
                  ) : (
                    <p>Editable content region.</p>
                  )}
                </div>
                {showFooter && (
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">Close</Button>
                    </DialogClose>
                    <Button onClick={() => setOpenControlled(false)}>Save</Button>
                  </DialogFooter>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4 mt-6">
          <h3 className="font-medium mb-3">SwiperDialog</h3>
          <div className="flex gap-2 mb-3">
            <Button onClick={() => setOpenSwiper(true)}>Open SwiperDialog</Button>
            <Button variant="outline" onClick={() => setOpenSwiper(false)}>Close</Button>
          </div>
          <SwiperDialog
            open={openSwiper}
            onOpenChange={setOpenSwiper}
            title="Dialog header"
            size={size}
            align={align}
            closeOnOverlayClick={closeOnOverlayClick}
            hideFooter
            headerClassName="self-stretch h-11 px-3 bg-neutral-Neutral-50 border-t border-neutral-300 inline-flex justify-start items-center"
            headerRight={
              <button 
                onClick={() => setOpenSwiper(false)}
                className="w-4 h-4 bg-red-300 rounded-full border border-neutral-300 hover:bg-red-400 transition-colors cursor-pointer"
                aria-label="Close dialog"
              />
            }
          >
            <ActionCard
              text="Create action here"
              className="self-stretch w-full"
              onClick={() => alert('Primary action clicked!')}
            />
            <div data-layer="deck-wrapper" className="DeckWrapper self-stretch w-full flex flex-col justify-center items-center gap-3 px-0">
              {[1,2,3].map((idx) => (
                <div key={idx} data-layer="Routine Card" className="RoutineCard w-full max-w-[500px] p-3 bg-white rounded-lg border border-neutral-300 flex flex-col justify-start items-start gap-6 overflow-hidden">
                  <div data-layer="Frame 5001" className="Frame5001 self-stretch flex flex-col justify-start items-start gap-5">
                    <div data-layer="Frame 5007" className="Frame5007 self-stretch flex flex-col justify-start items-start">
                      <div data-layer="Biceps and chest" className="BicepsAndChest w-[452px] justify-start text-neutral-neutral-600 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">Biceps and chest</div>
                      <div data-layer="Completed 5 days ago" className="Completed5DaysAgo text-center justify-center text-neutral-neutral-400 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">Completed 5 days ago</div>
                    </div>
                  </div>
                  <div data-layer="Frame 5014" className="Frame5014 inline-flex justify-start items-start gap-2">
                    <div data-layer="Frame 5013" className="Frame5013 w-7 h-7 bg-neutral-neutral-200 rounded-lg flex justify-center items-center gap-1">
                       <Plus className="w-5 h-5 text-neutral-neutral-500" strokeWidth={2} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div data-layer="deck-wrapper" className="DeckWrapper self-stretch w-full flex flex-col justify-start items-start gap-3 px-0 mx-0">
              <div data-layer="text-wrapper" className="TextWrapper self-stretch pt-3 pb-4 inline-flex justify-center items-center gap-2.5">
                <div data-layer="Are you sure you want to take this action?" className="AreYouSureYouWantToTakeThisAction flex-1 justify-start text-neutral-neutral-700 text-xl font-medium font-['Be_Vietnam_Pro'] leading-normal">Are you sure you want to take this action?</div>
              </div>
              <SwiperButton data-layer="swiperButton" className="self-stretch rounded-lg" variant="default">
                Button text
              </SwiperButton>
              <SwiperButton data-layer="swiperButton" className="self-stretch rounded-lg" variant="destructive">
                Button text
              </SwiperButton>
            </div>
          </SwiperDialog>
        </div>
      </div>
    </AppLayout>
  );
}


