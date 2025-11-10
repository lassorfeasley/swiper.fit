import React from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/shadcn/button";
import { SwiperButton } from "@/components/shared/SwiperButton";
import ActionPill from "@/components/shared/ActionPill";
import { ActionCard } from "@/components/shared/ActionCard";
import { Toggle } from "@/components/shadcn/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import { Play, Pause, SkipForward, Heart, Plus, Settings, Check, X } from "lucide-react";

export default function ButtonTest() {
  const [toggleOn, setToggleOn] = React.useState(false);
  const [toggleOutlineOn, setToggleOutlineOn] = React.useState(false);
  const [singleToggle, setSingleToggle] = React.useState("option1");
  const [multipleToggle, setMultipleToggle] = React.useState<string[]>(["option1"]);

  return (
    <AppLayout title="Button Test Page" search={false} showSidebar={true} reserveSpace={true}>
      <div className="max-w-6xl mx-auto px-5 pt-6 pb-12 space-y-8">
        
        {/* Header */}
        <div className="bg-white border border-neutral-300 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-neutral-700 mb-2">Button Component Test Page</h1>
          <p className="text-neutral-600">A comprehensive demonstration of all button variants in the Swiper.fit codebase.</p>
        </div>

        {/* Shadcn Button Component */}
        <section className="bg-white border border-neutral-300 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Button Component (shadcn/button)</h2>
            <p className="text-sm text-neutral-600 mb-4">Base button component with multiple variants and sizes.</p>
          </div>

          {/* Variants */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Variants (Default Size)</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Sizes - Default Variant */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Sizes (Default Variant)</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon"><Heart className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Icon Buttons - All Variants */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Icon Buttons</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <Button size="icon"><Play className="h-4 w-4" /></Button>
              <Button size="icon" variant="secondary"><Pause className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline"><SkipForward className="h-4 w-4" /></Button>
              <Button size="icon" variant="destructive"><X className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost"><Settings className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* With Icons and Text */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Buttons with Icons</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <Button><Play className="h-4 w-4 mr-2" />Play</Button>
              <Button variant="secondary"><Pause className="h-4 w-4 mr-2" />Pause</Button>
              <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Add</Button>
              <Button variant="destructive"><X className="h-4 w-4 mr-2" />Delete</Button>
              <Button variant="ghost"><Settings className="h-4 w-4 mr-2" />Settings</Button>
            </div>
          </div>

          {/* Disabled States */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Disabled States</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <Button disabled>Default</Button>
              <Button variant="secondary" disabled>Secondary</Button>
              <Button variant="outline" disabled>Outline</Button>
              <Button variant="destructive" disabled>Destructive</Button>
              <Button variant="ghost" disabled>Ghost</Button>
              <Button variant="link" disabled>Link</Button>
            </div>
          </div>

          {/* All Combinations Matrix */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Complete Size/Variant Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="border border-neutral-300 p-3 text-left text-sm font-semibold">Size / Variant</th>
                    <th className="border border-neutral-300 p-3 text-center text-sm font-semibold">Default</th>
                    <th className="border border-neutral-300 p-3 text-center text-sm font-semibold">Secondary</th>
                    <th className="border border-neutral-300 p-3 text-center text-sm font-semibold">Outline</th>
                    <th className="border border-neutral-300 p-3 text-center text-sm font-semibold">Destructive</th>
                    <th className="border border-neutral-300 p-3 text-center text-sm font-semibold">Ghost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-neutral-300 p-3 font-medium bg-neutral-50">Small</td>
                    <td className="border border-neutral-300 p-3 text-center"><Button size="sm">Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button size="sm" variant="secondary">Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button size="sm" variant="outline">Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button size="sm" variant="destructive">Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button size="sm" variant="ghost">Button</Button></td>
                  </tr>
                  <tr>
                    <td className="border border-neutral-300 p-3 font-medium bg-neutral-50">Default</td>
                    <td className="border border-neutral-300 p-3 text-center"><Button>Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button variant="secondary">Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button variant="outline">Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button variant="destructive">Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button variant="ghost">Button</Button></td>
                  </tr>
                  <tr>
                    <td className="border border-neutral-300 p-3 font-medium bg-neutral-50">Large</td>
                    <td className="border border-neutral-300 p-3 text-center"><Button size="lg">Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button size="lg" variant="secondary">Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button size="lg" variant="outline">Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button size="lg" variant="destructive">Button</Button></td>
                    <td className="border border-neutral-300 p-3 text-center"><Button size="lg" variant="ghost">Button</Button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SwiperButton Component */}
        <section className="bg-white border border-neutral-300 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-700 mb-2">SwiperButton Component</h2>
            <p className="text-sm text-neutral-600 mb-4">Custom button component with Swiper.fit branding (fixed height of 48px, rounded-lg).</p>
          </div>

          {/* SwiperButton Variants */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Variants</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <SwiperButton>Default</SwiperButton>
              <SwiperButton variant="outline">Outline</SwiperButton>
              <SwiperButton variant="destructive">Destructive</SwiperButton>
            </div>
          </div>

          {/* SwiperButton with Icons */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">With Icons</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <SwiperButton><Play className="h-4 w-4 mr-2" />Start Workout</SwiperButton>
              <SwiperButton variant="outline"><Plus className="h-4 w-4 mr-2" />Add Exercise</SwiperButton>
              <SwiperButton variant="destructive"><X className="h-4 w-4 mr-2" />Delete Routine</SwiperButton>
            </div>
          </div>

          {/* SwiperButton Disabled */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Disabled States</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <SwiperButton disabled>Default</SwiperButton>
              <SwiperButton variant="outline" disabled>Outline</SwiperButton>
              <SwiperButton variant="destructive" disabled>Destructive</SwiperButton>
            </div>
          </div>
        </section>

        {/* ActionPill Component */}
        <section className="bg-white border border-neutral-300 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-700 mb-2">ActionPill Component</h2>
            <p className="text-sm text-neutral-600 mb-4">Pill-shaped action buttons used during workouts and other interactive flows.</p>
          </div>

          {/* Color Variants with Text */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Color Variants (with text)</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <ActionPill label="Orange" Icon={Play} color="orange" />
              <ActionPill label="Neutral" Icon={Pause} color="neutral" iconColor="neutral" />
              <ActionPill label="Neutral Dark" Icon={SkipForward} color="neutral-dark" />
              <ActionPill label="Red" Icon={X} color="red" />
              <ActionPill label="Green" Icon={Check} color="green" />
              <ActionPill label="Blue" Icon={Heart} color="blue" />
              <ActionPill label="Blue 700" Icon={Settings} color="blue-700" />
            </div>
          </div>

          {/* Icon Only */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Icon Only (no text)</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <ActionPill label="Play" Icon={Play} color="orange" showText={false} />
              <ActionPill label="Pause" Icon={Pause} color="neutral" iconColor="neutral" showText={false} />
              <ActionPill label="Skip" Icon={SkipForward} color="neutral-dark" showText={false} />
              <ActionPill label="Delete" Icon={X} color="red" showText={false} />
              <ActionPill label="Check" Icon={Check} color="green" showText={false} />
              <ActionPill label="Heart" Icon={Heart} color="blue" showText={false} />
              <ActionPill label="Settings" Icon={Settings} color="blue-700" showText={false} />
            </div>
          </div>

          {/* Without Shadow */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Without Shadow</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <ActionPill label="Orange" Icon={Play} color="orange" showShadow={false} />
              <ActionPill label="Red" Icon={X} color="red" showShadow={false} />
              <ActionPill label="Green" Icon={Check} color="green" showShadow={false} />
            </div>
          </div>

          {/* Without Fill */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Without Fill (transparent background)</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <ActionPill label="Play" Icon={Play} color="orange" iconColor="blue" fill={false} />
              <ActionPill label="Pause" Icon={Pause} color="neutral" iconColor="red" fill={false} />
              <ActionPill label="Settings" Icon={Settings} color="blue-700" iconColor="green" fill={false} />
            </div>
          </div>

          {/* Complete Matrix */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Configuration Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="border border-neutral-300 p-3 text-left text-sm font-semibold">Configuration</th>
                    <th className="border border-neutral-300 p-3 text-center text-sm font-semibold">Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-neutral-300 p-3 text-sm">Text + Icon + Shadow + Fill</td>
                    <td className="border border-neutral-300 p-3 text-center">
                      <ActionPill label="Complete" Icon={Play} color="orange" showText={true} showShadow={true} fill={true} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-neutral-300 p-3 text-sm">Icon Only + Shadow + Fill</td>
                    <td className="border border-neutral-300 p-3 text-center">
                      <ActionPill label="Icon" Icon={Pause} color="blue" showText={false} showShadow={true} fill={true} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-neutral-300 p-3 text-sm">Text + Icon + No Shadow + Fill</td>
                    <td className="border border-neutral-300 p-3 text-center">
                      <ActionPill label="No Shadow" Icon={SkipForward} color="green" showText={true} showShadow={false} fill={true} />
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-neutral-300 p-3 text-sm">Text + Icon + Shadow + No Fill</td>
                    <td className="border border-neutral-300 p-3 text-center">
                      <ActionPill label="No Fill" Icon={X} color="red" iconColor="red" showText={true} showShadow={true} fill={false} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ActionCard Component */}
        <section className="bg-white border border-neutral-300 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-700 mb-2">ActionCard Component</h2>
            <p className="text-sm text-neutral-600 mb-4">Card-based action buttons with plus icon, typically used to add new items.</p>
          </div>

          {/* ActionCard Variants */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Variants</h3>
            <div className="space-y-3 p-4 bg-neutral-50 rounded-lg">
              <ActionCard text="Add exercise" onClick={() => alert('Add exercise clicked')} />
              <ActionCard text="Create a new routine" onClick={() => alert('Create routine clicked')} />
              <ActionCard text="Add new workout" onClick={() => alert('Add workout clicked')} />
            </div>
          </div>

          {/* Custom Colors */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Custom Colors</h3>
            <div className="space-y-3 p-4 bg-neutral-50 rounded-lg">
              <ActionCard 
                text="Custom blue background" 
                fillColor="bg-blue-50" 
                textColor="text-blue-700"
                onClick={() => alert('Blue action')} 
              />
              <ActionCard 
                text="Custom green background" 
                fillColor="bg-green-50" 
                textColor="text-green-700"
                onClick={() => alert('Green action')} 
              />
              <ActionCard 
                text="Custom red background" 
                fillColor="bg-red-50" 
                textColor="text-red-700"
                onClick={() => alert('Red action')} 
              />
            </div>
          </div>
        </section>

        {/* Toggle Component */}
        <section className="bg-white border border-neutral-300 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-700 mb-2">Toggle Component</h2>
            <p className="text-sm text-neutral-600 mb-4">Single toggle buttons with on/off states.</p>
          </div>

          {/* Toggle Variants */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Variants</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <Toggle pressed={toggleOn} onPressedChange={setToggleOn}>
                Default Toggle
              </Toggle>
              <Toggle pressed={toggleOutlineOn} onPressedChange={setToggleOutlineOn} variant="outline">
                Outline Toggle
              </Toggle>
            </div>
            <p className="text-xs text-neutral-500 ml-4">Click the toggles to see the active state</p>
          </div>

          {/* Toggle Sizes */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Sizes</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <Toggle size="sm">Small</Toggle>
              <Toggle size="default">Default</Toggle>
              <Toggle size="lg">Large</Toggle>
            </div>
          </div>

          {/* Toggle with Icons */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">With Icons</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <Toggle><Play className="h-4 w-4 mr-2" />Play</Toggle>
              <Toggle variant="outline"><Heart className="h-4 w-4 mr-2" />Like</Toggle>
              <Toggle><Settings className="h-4 w-4" /></Toggle>
            </div>
          </div>

          {/* Toggle Disabled */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Disabled</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <Toggle disabled>Disabled Off</Toggle>
              <Toggle disabled pressed>Disabled On</Toggle>
            </div>
          </div>
        </section>

        {/* ToggleGroup Component */}
        <section className="bg-white border border-neutral-300 rounded-lg p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-neutral-700 mb-2">ToggleGroup Component</h2>
            <p className="text-sm text-neutral-600 mb-4">Group of toggle buttons for single or multiple selection.</p>
          </div>

          {/* Single Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Single Selection</h3>
            <div className="space-y-3 p-4 bg-neutral-50 rounded-lg">
              <ToggleGroup type="single" value={singleToggle} onValueChange={setSingleToggle}>
                <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
                <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
                <ToggleGroupItem value="option3">Option 3</ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-neutral-500">Selected: {singleToggle}</p>
            </div>
          </div>

          {/* Multiple Selection */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Multiple Selection</h3>
            <div className="space-y-3 p-4 bg-neutral-50 rounded-lg">
              <ToggleGroup type="multiple" value={multipleToggle} onValueChange={setMultipleToggle}>
                <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
                <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
                <ToggleGroupItem value="option3">Option 3</ToggleGroupItem>
                <ToggleGroupItem value="option4">Option 4</ToggleGroupItem>
              </ToggleGroup>
              <p className="text-xs text-neutral-500">Selected: {multipleToggle.join(", ") || "none"}</p>
            </div>
          </div>

          {/* Outline Variant */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Outline Variant</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <ToggleGroup type="single" variant="outline">
                <ToggleGroupItem value="a" variant="outline">A</ToggleGroupItem>
                <ToggleGroupItem value="b" variant="outline">B</ToggleGroupItem>
                <ToggleGroupItem value="c" variant="outline">C</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Sizes</h3>
            <div className="flex flex-wrap items-center gap-6 p-4 bg-neutral-50 rounded-lg">
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-600">Small</p>
                <ToggleGroup type="single" size="sm">
                  <ToggleGroupItem value="1" size="sm">1</ToggleGroupItem>
                  <ToggleGroupItem value="2" size="sm">2</ToggleGroupItem>
                  <ToggleGroupItem value="3" size="sm">3</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-600">Default</p>
                <ToggleGroup type="single" size="default">
                  <ToggleGroupItem value="1" size="default">1</ToggleGroupItem>
                  <ToggleGroupItem value="2" size="default">2</ToggleGroupItem>
                  <ToggleGroupItem value="3" size="default">3</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-neutral-600">Large</p>
                <ToggleGroup type="single" size="lg">
                  <ToggleGroupItem value="1" size="lg">1</ToggleGroupItem>
                  <ToggleGroupItem value="2" size="lg">2</ToggleGroupItem>
                  <ToggleGroupItem value="3" size="lg">3</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>

          {/* Disabled */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-neutral-700">Disabled</h3>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <ToggleGroup type="single" disabled>
                <ToggleGroupItem value="a">Option A</ToggleGroupItem>
                <ToggleGroupItem value="b">Option B</ToggleGroupItem>
                <ToggleGroupItem value="c">Option C</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </section>

        {/* Summary Table */}
        <section className="bg-white border border-neutral-300 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-neutral-700 mb-4">Component Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border border-neutral-300 p-3 text-left text-sm font-semibold">Component</th>
                  <th className="border border-neutral-300 p-3 text-left text-sm font-semibold">Location</th>
                  <th className="border border-neutral-300 p-3 text-left text-sm font-semibold">Variants</th>
                  <th className="border border-neutral-300 p-3 text-left text-sm font-semibold">Sizes</th>
                  <th className="border border-neutral-300 p-3 text-left text-sm font-semibold">Use Cases</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-neutral-300 p-3 font-medium">Button</td>
                  <td className="border border-neutral-300 p-3 text-sm"><code className="text-xs">@/components/shadcn/button</code></td>
                  <td className="border border-neutral-300 p-3 text-sm">default, secondary, outline, destructive, ghost, link</td>
                  <td className="border border-neutral-300 p-3 text-sm">sm, default, lg, icon</td>
                  <td className="border border-neutral-300 p-3 text-sm">General purpose buttons</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 p-3 font-medium">SwiperButton</td>
                  <td className="border border-neutral-300 p-3 text-sm"><code className="text-xs">@/components/shared/SwiperButton</code></td>
                  <td className="border border-neutral-300 p-3 text-sm">default, outline, destructive</td>
                  <td className="border border-neutral-300 p-3 text-sm">Fixed (48px height)</td>
                  <td className="border border-neutral-300 p-3 text-sm">Branded primary actions</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 p-3 font-medium">ActionPill</td>
                  <td className="border border-neutral-300 p-3 text-sm"><code className="text-xs">@/components/shared/ActionPill</code></td>
                  <td className="border border-neutral-300 p-3 text-sm">7 colors × text/icon × fill/no fill × shadow/no shadow</td>
                  <td className="border border-neutral-300 p-3 text-sm">Fixed (40px height)</td>
                  <td className="border border-neutral-300 p-3 text-sm">Workout controls, quick actions</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 p-3 font-medium">ActionCard</td>
                  <td className="border border-neutral-300 p-3 text-sm"><code className="text-xs">@/components/shared/ActionCard</code></td>
                  <td className="border border-neutral-300 p-3 text-sm">Default, custom colors</td>
                  <td className="border border-neutral-300 p-3 text-sm">Fixed (56px height)</td>
                  <td className="border border-neutral-300 p-3 text-sm">Add new items</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 p-3 font-medium">Toggle</td>
                  <td className="border border-neutral-300 p-3 text-sm"><code className="text-xs">@/components/shadcn/toggle</code></td>
                  <td className="border border-neutral-300 p-3 text-sm">default, outline</td>
                  <td className="border border-neutral-300 p-3 text-sm">sm, default, lg</td>
                  <td className="border border-neutral-300 p-3 text-sm">Single toggle states</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 p-3 font-medium">ToggleGroup</td>
                  <td className="border border-neutral-300 p-3 text-sm"><code className="text-xs">@/components/shadcn/toggle-group</code></td>
                  <td className="border border-neutral-300 p-3 text-sm">default, outline</td>
                  <td className="border border-neutral-300 p-3 text-sm">sm, default, lg</td>
                  <td className="border border-neutral-300 p-3 text-sm">Multiple choice selection</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </AppLayout>
  );
}

