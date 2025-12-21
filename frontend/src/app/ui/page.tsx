'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, Tooltip as RechartsTooltip, Legend as RechartsLegend } from 'recharts';

// Core inputs
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Overlays
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter
} from '@/components/ui/drawer';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';

// Menus
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel
} from '@/components/ui/menubar';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink
} from '@/components/ui/navigation-menu';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator
} from '@/components/ui/context-menu';

// Display and feedback
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// Layout/content
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption
} from '@/components/ui/table';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator
} from '@/components/ui/command';

// Charts
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';

// Toasts
import { Toaster } from '@/components/ui/sonner';

// Simple wrapper to render each demo block consistently
function DemoBlock({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm w-full md:w-[calc(50%-0.75rem)] xl:w-[calc(33.333%-1rem)] overflow-scroll">
      <div className="text-sm font-semibold mb-3 overflow-scroll">{title}</div>
      <div className="flex flex-wrap items-center gap-3 overflow-scroll">{children}</div>
    </div>
  );
}

// Mock data for charts and table
const chartData = [
  { month: 'Jan', sales: 120, returns: 12 },
  { month: 'Feb', sales: 200, returns: 20 },
  { month: 'Mar', sales: 180, returns: 15 },
  { month: 'Apr', sales: 240, returns: 18 }
];

const chartConfig = {
  sales: { label: 'Sales', color: 'hsl(var(--primary))' },
  returns: { label: 'Returns', color: 'hsl(var(--destructive))' }
};

const tableRows = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin' },
  { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'Editor' },
  { id: '3', name: 'Charlie P.', email: 'charlie@example.com', role: 'Viewer' }
];

export default function UIShowcasePage() {
  // Local state for a few interactive demos
  const [openSheet, setOpenSheet] = React.useState(false);
  const [openDrawer, setOpenDrawer] = React.useState(false);
  const [openCmd, setOpenCmd] = React.useState(false);
  const [otp, setOtp] = React.useState('');

  return (
    <div className="bg-white h-[100dvh] overflow-y-auto p-6 flex flex-col">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">UI Components Showcase</h1>
        <p className="text-muted-foreground text-sm">
          A quick preview of components under <code>@/components/ui</code> with mock data.
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button onClick={() => toast.success('Success toast from Sonner!')}>
          Show Toast
        </Button>
        <Button variant="outline" onClick={() => setOpenCmd(true)}>
          Open Command Palette
        </Button>
      </div>

      {/* Flex container for demos */}
      <div className="flex flex-wrap gap-4">
        {/* Core Controls */}
        <DemoBlock title="Buttons">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </DemoBlock>

        <DemoBlock title="Inputs">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 w-full">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Jane Doe" className="max-w-xs" />
            </div>
            <div className="flex items-start gap-2 w-full">
              <Label htmlFor="bio" className="mt-2">Bio</Label>
              <Textarea id="bio" placeholder="A short bio..." className="max-w-md" />
            </div>
          </div>
        </DemoBlock>

        <DemoBlock title="Select">
          <Select defaultValue="apple">
            <SelectTrigger className="min-w-40">
              <SelectValue placeholder="Choose a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
            </SelectContent>
          </Select>
        </DemoBlock>

        <DemoBlock title="Switch / Checkbox / Radio">
          <div className="flex items-center gap-2">
            <Switch id="s1" />
            <Label htmlFor="s1">Enable feature</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="c1" />
            <Label htmlFor="c1">Accept terms</Label>
          </div>
          <RadioGroup defaultValue="email" className="flex gap-3">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="email" value="email" />
              <Label htmlFor="email">Email</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="sms" value="sms" />
              <Label htmlFor="sms">SMS</Label>
            </div>
          </RadioGroup>
        </DemoBlock>

        <DemoBlock title="Slider / Toggle">
          <div className="w-56">
            <Slider defaultValue={[20, 80]} min={0} max={100} />
          </div>
          <Toggle>Bold</Toggle>
          <ToggleGroup type="single" defaultValue="left" variant="outline">
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="center">Center</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
        </DemoBlock>

        {/* Overlays */}
        <DemoBlock title="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Helpful info appears here.</TooltipContent>
          </Tooltip>
        </DemoBlock>

        <DemoBlock title="Popover">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="text-sm">This is a popover content.</div>
            </PopoverContent>
          </Popover>
        </DemoBlock>

        <DemoBlock title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>Small description about the dialog.</DialogDescription>
              </DialogHeader>
              <div className="text-sm">Any content can live here.</div>
              <DialogFooter>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DemoBlock>

        <DemoBlock title="Drawer">
          <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
            <DrawerTrigger asChild>
              <Button variant="outline">Open Drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Drawer Title</DrawerTitle>
                <DrawerDescription>Slide-in panel content.</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 text-sm">You can add forms and content here.</div>
              <DrawerFooter>
                <Button onClick={() => setOpenDrawer(false)}>Close</Button>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </DemoBlock>

        <DemoBlock title="Sheet (Side Panel)">
          <Sheet open={openSheet} onOpenChange={setOpenSheet}>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Sheet Title</SheetTitle>
                <SheetDescription>Useful side panel.</SheetDescription>
              </SheetHeader>
              <div className="px-4 text-sm">Put quick settings or details here.</div>
              <SheetFooter className="p-4">
                <Button onClick={() => setOpenSheet(false)}>Close</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </DemoBlock>

        <DemoBlock title="Alert Dialog">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex gap-2">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DemoBlock>

        {/* Menus */}
        <DemoBlock title="Dropdown Menu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>New</DropdownMenuItem>
              <DropdownMenuItem>Copy</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Archive</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuCheckboxItem checked>Enabled</DropdownMenuCheckboxItem>
              <DropdownMenuRadioGroup value="a">
                <DropdownMenuRadioItem value="a">Option A</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="b">Option B</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </DemoBlock>

        <DemoBlock title="Menubar">
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>New</MenubarItem>
                <MenubarItem>Open</MenubarItem>
                <MenubarSeparator />
                <MenubarLabel>Recent</MenubarLabel>
                <MenubarItem>Project 1</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </DemoBlock>

        <DemoBlock title="Navigation Menu">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-2 p-2">
                    <NavigationMenuLink href="#">Getting Started</NavigationMenuLink>
                    <NavigationMenuLink href="#">Components</NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </DemoBlock>

        <DemoBlock title="Context Menu (Right-click)">
          <ContextMenu>
            <ContextMenuTrigger>
              <div className="border rounded-md p-4 text-sm">
                Right-click here to open the context menu.
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>Refresh</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>Inspect</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </DemoBlock>

        {/* Display */}
        <DemoBlock title="Badge / Avatar">
          <Badge>New</Badge>
          <Badge variant="secondary">Beta</Badge>
          <Avatar>
            <AvatarImage src="https://i.pravatar.cc/100?img=1" alt="User" />
            <AvatarFallback>AU</AvatarFallback>
          </Avatar>
        </DemoBlock>

        <DemoBlock title="Breadcrumb">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Library</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Data</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DemoBlock>

        <DemoBlock title="Card / Alert">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Short description for context.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                Cards help group and surface related content.
              </div>
            </CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>
          <Alert className="w-full">
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>This is an informational alert.</AlertDescription>
          </Alert>
        </DemoBlock>

        <DemoBlock title="Progress / Skeleton / Separator / Pagination">
          <div className="w-56">
            <Progress value={65} />
          </div>
          <Skeleton className="h-6 w-32" />
          <Separator className="w-full" />
          <Pagination>
            <PaginationContent>
              <PaginationPrevious href="#" />
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationNext href="#" />
            </PaginationContent>
          </Pagination>
        </DemoBlock>

        <DemoBlock title="Tabs / Hover Card">
          <Tabs defaultValue="account" className="w-full">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="p-2">
              Account content
            </TabsContent>
            <TabsContent value="password" className="p-2">
              Password content
            </TabsContent>
          </Tabs>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="text-sm">Extra info appears on hover.</div>
            </HoverCardContent>
          </HoverCard>
        </DemoBlock>

        <DemoBlock title="Calendar / OTP / Aspect Ratio">
          <Calendar />
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <div className="w-48">
            <AspectRatio ratio={16 / 9}>
              <div className="bg-muted flex h-full w-full items-center justify-center rounded-md text-xs">
                16:9
              </div>
            </AspectRatio>
          </div>
        </DemoBlock>

        {/* Layout / Content */}
        <DemoBlock title="Scroll Area">
          <ScrollArea className="h-32 w-64 rounded-md border p-3">
            <div className="space-y-2 text-sm">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i}>Scrollable content line {i + 1}</div>
              ))}
            </div>
          </ScrollArea>
        </DemoBlock>

        <DemoBlock title="Resizable Panels">
          <div className="w-full">
            <ResizablePanelGroup direction="horizontal" className="h-40 rounded-md border overflow-hidden">
              <ResizablePanel defaultSize={50} className="p-3 text-sm">
                Left panel
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} className="p-3 text-sm">
                Right panel
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </DemoBlock>

        <DemoBlock title="Table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>Mock table data</TableCaption>
          </Table>
        </DemoBlock>

        <DemoBlock title="Accordion">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="a">
              <AccordionTrigger>What is this?</AccordionTrigger>
              <AccordionContent>It’s an accordion item content.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>How does it work?</AccordionTrigger>
              <AccordionContent>Click the header to expand/collapse.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </DemoBlock>

        <DemoBlock title="Command Palette">
          <Button onClick={() => setOpenCmd(true)} variant="outline">Open</Button>
          <CommandDialog open={openCmd} onOpenChange={setOpenCmd}>
            <Command>
              <CommandInput placeholder="Type a command or search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>New File</CommandItem>
                  <CommandItem>Open Project</CommandItem>
                  <CommandItem>Settings</CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Help">
                  <CommandItem>Documentation</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </CommandDialog>
        </DemoBlock>

        {/* Charts */}
        <DemoBlock title="Chart (Bar & Line)">
          <div className="w-full">
            <ChartContainer config={chartConfig} className="w-full">
              <BarChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="sales" fill="var(--color-sales)" />
                <Bar dataKey="returns" fill="var(--color-returns)" />
              </BarChart>
            </ChartContainer>
            <div className="mt-4" />
            <ChartContainer config={chartConfig} className="w-full">
              <LineChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <RechartsLegend />
                <Line dataKey="sales" stroke="var(--color-sales)" />
                <Line dataKey="returns" stroke="var(--color-returns)" />
              </LineChart>
            </ChartContainer>
          </div>
        </DemoBlock>
      </div>

      {/* Global toaster for notifications */}
      <Toaster />
    </div>
  );
}


