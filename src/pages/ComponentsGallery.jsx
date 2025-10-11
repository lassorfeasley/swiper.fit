import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button as UiButton } from "@/components/ui/button";
import { Button as AppButton } from "@/components/atoms/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/atoms/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/atoms/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch as AtomSwitch } from "@/components/atoms/switch";
import { Switch as UiSwitch } from "@/components/ui/switch";
import { SwiperButton } from "@/components/molecules/swiper-button";
import { SwiperCard, SwiperCardContent, SwiperCardDescription, SwiperCardFooter, SwiperCardHeader, SwiperCardTitle } from "@/components/molecules/swiper-card";
import SwiperFormSwitch from "@/components/molecules/swiper-form-switch";
import SwiperDialog from "@/components/molecules/swiper-dialog";
import { SwiperSheet } from "@/components/molecules/swiper-sheet";
import SwiperForm, { SwiperFormSection } from "@/components/molecules/swiper-form";
import SwiperProgress from "@/components/molecules/swiper-progress";
import DurationInput from "@/components/molecules/duration-input";
import NumericInput from "@/components/molecules/numeric-input";
import EditableTextInput from "@/components/molecules/editable-text-input";
import SearchField from "@/components/molecules/search-field";
import ToggleInput from "@/components/molecules/toggle-input";
import SectionNav from "@/components/molecules/section-nav";
import SetBadge from "@/components/molecules/SetBadge";
import { ActionCard } from "@/components/molecules/action-card";
import ActionPill from "@/components/molecules/action-pill";
import StaticCard from "@/components/organisms/static-card";
import { Play } from "lucide-react";
import SwiperCombobox from "@/components/molecules/swiper-combobox";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Gallery component error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
          Failed to render this example: {this.state.error?.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ComponentsGallery() {
  const [checked, setChecked] = React.useState(false);
  const [radioValue, setRadioValue] = React.useState("one");
  const [date, setDate] = React.useState(new Date());
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openSheet, setOpenSheet] = React.useState(false);
  const [openForm, setOpenForm] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [num, setNum] = React.useState(5);
  const [secs, setSecs] = React.useState(75);
  const [section, setSection] = React.useState("warmup");
  const [toggle, setToggle] = React.useState("a");
  const [textVal, setTextVal] = React.useState("Sample value");

  // Demo registry: label + renderer
  const demos = React.useMemo(() => ([
    {
      key: 'buttons',
      label: 'Buttons',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Buttons</h2>
          <div className="flex flex-wrap items-center gap-3">
            <UiButton>UI Button</UiButton>
            <UiButton variant="secondary">Secondary</UiButton>
            <UiButton variant="outline">Outline</UiButton>
            <UiButton variant="destructive">Destructive</UiButton>
            <AppButton>App Button</AppButton>
            <SwiperButton>Swiper Button</SwiperButton>
          </div>
        </section>
      )
    },
    {
      key: 'alerts',
      label: 'Alerts',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Alerts</h2>
          <Alert>
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>This is a neutral alert using atom styles.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Something went wrong. Please try again.</AlertDescription>
          </Alert>
        </section>
      )
    },
    {
      key: 'cards',
      label: 'Cards',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Cards</h2>
          <Card>
            <CardHeader>
              <CardTitle>Atom Card</CardTitle>
              <CardDescription>Simple card with header, content, and footer.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-700">Card content area with typical paragraph text.</p>
            </CardContent>
            <CardFooter>
              <UiButton size="sm">Action</UiButton>
            </CardFooter>
          </Card>
          <SwiperCard>
            <SwiperCardHeader>
              <SwiperCardTitle>Swiper Card</SwiperCardTitle>
              <SwiperCardDescription>A variant used across app flows.</SwiperCardDescription>
            </SwiperCardHeader>
            <SwiperCardContent>
              <div className="text-sm text-neutral-700">Reusable card styling tailored for Swiper.</div>
            </SwiperCardContent>
            <SwiperCardFooter>
              <SwiperButton variant="outline">Action</SwiperButton>
            </SwiperCardFooter>
          </SwiperCard>
        </section>
      )
    },
    {
      key: 'switches',
      label: 'Switches',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Switches</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">Atom</span>
              <AtomSwitch checked={checked} onCheckedChange={setChecked} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">UI</span>
              <UiSwitch checked={checked} onCheckedChange={setChecked} />
            </div>
            <div className="flex-1">
              <SwiperFormSwitch label="Form Switch" checked={checked} onCheckedChange={setChecked} />
            </div>
          </div>
        </section>
      )
    },
    
    {
      key: 'dropdown',
      label: 'Dropdown Menu',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Dropdown Menu</h2>
          <div className="bg-white border rounded-xl p-4 inline-block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <UiButton variant="outline">Open Menu</UiButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Team</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Invite</DropdownMenuItem>
                    <DropdownMenuItem>Members</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>Emails</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Push Notifications</DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={radioValue} onValueChange={setRadioValue}>
                  <DropdownMenuRadioItem value="one">One</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="two">Two</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>
      )
    },
    {
      key: 'inputs',
      label: 'Inputs',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Inputs</h2>
          <div className="space-y-3 bg-white border rounded-xl p-4">
            <div className="grid grid-cols-1 gap-3">
              <EditableTextInput label="Editable" value={textVal} onChange={setTextVal} />
              <SearchField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
              <NumericInput value={num} onChange={setNum} min={0} max={999} />
              <DurationInput value={secs} onChange={setSecs} />
              <ToggleInput
                label="Toggle Input"
                options={[{ label: "A", value: "a" }, { label: "B", value: "b" }, { label: "C", value: "c" }]}
                value={toggle}
                onValueChange={setToggle}
              />
              <SectionNav value={section} onChange={setSection} />
              <SetBadge reps={10} weight={135} unit="lbs" />
            </div>
          </div>
        </section>
      )
    },
    {
      key: 'overlays',
      label: 'Dialogs and Sheets',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Dialogs and Sheets</h2>
          <div className="flex flex-wrap items-center gap-3">
            <UiButton onClick={() => setOpenDialog(true)}>Open SwiperDialog</UiButton>
            <UiButton variant="secondary" onClick={() => setOpenSheet(true)}>Open SwiperSheet</UiButton>
          </div>
          <ErrorBoundary>
            <SwiperDialog
              open={openDialog}
              onOpenChange={setOpenDialog}
              title="Confirm action"
              description="This is a dialog example."
            >
              <div className="space-y-2">
                <p className="text-sm text-neutral-700">Dialog body content for demonstration.</p>
              </div>
            </SwiperDialog>
          </ErrorBoundary>
          <ErrorBoundary>
            <SwiperSheet open={openSheet} onOpenChange={setOpenSheet} title="Sheet" description="Demo" />
          </ErrorBoundary>
        </section>
      )
    },
    {
      key: 'combobox',
      label: 'Combobox',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Combobox</h2>
          <div className="space-y-3">
            <SwiperCombobox
              items={[
                { value: 'next.js', label: 'Next.js' },
                { value: 'sveltekit', label: 'SvelteKit' },
                { value: 'nuxt.js', label: 'Nuxt.js' },
                { value: 'remix', label: 'Remix' },
                { value: 'astro', label: 'Astro' },
              ]}
              placeholder="Filter workouts"
              filterPlaceholder="Search routines"
              width={240}
              className=""
            />
          </div>
        </section>
      )
    },
    {
      key: 'form',
      label: 'Form Scaffolding',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Form Scaffolding</h2>
          <ErrorBoundary>
            <div className="flex items-center gap-3 mb-2">
              <UiButton onClick={() => setOpenForm(true)}>Open SwiperForm</UiButton>
            </div>
            <SwiperForm open={openForm} onOpenChange={setOpenForm} title="Form Title" description="Form description" className="max-w-[480px]">
              <SwiperFormSection>
                <div className="text-sm text-neutral-700">A simple section of form content.</div>
              </SwiperFormSection>
            </SwiperForm>
          </ErrorBoundary>
        </section>
      )
    },
    {
      key: 'actions',
      label: 'Action Components',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Action Components</h2>
          <div className="space-y-3">
            <ActionCard text="Create a new routine" onClick={() => {}} />
            <ActionCard text="Primary action" variant="primary" onClick={() => {}} />
            <ActionPill label="Play" Icon={Play} onClick={() => {}} />
          </div>
        </section>
      )
    },
    {
      key: 'staticCard',
      label: 'Static Card (Organism)',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Static Card (Organism)</h2>
          <div className="space-y-3">
            <StaticCard id={1} name="Upper Body Strength" labels={["Push", "Pull"]} count={6} duration="45m" onClick={() => {}} />
          </div>
        </section>
      )
    },
    {
      key: 'progress',
      label: 'Progress Bar',
      render: () => (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-700">Progress Bar</h2>
          <p className="text-sm text-neutral-600">Appears fixed at bottom; included for completeness.</p>
          <SwiperProgress completedSets={3} totalSets={10} />
        </section>
      )
    },
  ]), [checked, date, num, openDialog, openForm, openSheet, radioValue, section, secs, textVal, toggle]);

  const [activeKey, setActiveKey] = React.useState(demos[0]?.key);
  const filtered = demos.filter(d => d.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout title="Components Gallery" search={false} showSidebar={true} reserveSpace={true}>
      <div className="max-w-6xl mx-auto px-5 pt-6 pb-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <div className="bg-white border rounded-xl p-3 sticky top-[calc(var(--header-height,0px)+16px)]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter components…"
              className="w-full mb-3 h-9 rounded border border-neutral-300 px-3 text-sm focus:outline-none focus:ring-0"
            />
            <div className="flex flex-col divide-y divide-neutral-200">
              {filtered.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setActiveKey(d.key)}
                  className={`text-left py-2 px-2 rounded hover:bg-neutral-50 ${activeKey === d.key ? 'bg-neutral-100 font-medium' : ''}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
        <section className="md:col-span-3 space-y-4">
          <ErrorBoundary>
            {demos.find(d => d.key === activeKey)?.render()}
          </ErrorBoundary>
        </section>
      </div>
    </AppLayout>
  );
}


